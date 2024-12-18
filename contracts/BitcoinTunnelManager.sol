// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "./BTCToken.sol";
import "./bitcoinkit/IBitcoinKit.sol";
import "./governance/GlobalConfig.sol";

/**
 * The BitcoinTunnelManager is deployed once for the entire Bitcoin Tunnel System and is the central
 * interaction point for:
 *   - Creating new vaults
 *   - Preconfirming and confirming deposits
 *   - Initiating withdrawals
 *   - Challenging a withdrawal
 *   - Operators minting collected fees as hBTC
 *
 * The BitcoinTunnelManager is not governed directly by an admin, but upon initialization it deploys
 * a GlobalConfig which delegates administration of specific configuration options to different
 * admins. Specifically:
 *   - Whether or not new vault creation is permitted
 *   - Whether ot not new vault creation is only allowed for particular whitelisted addresses
 *   - Whether or not withdrawals are permitted
 *   - Whether or not withdrawals are only allowed for particular whitelisted addresses
 *   - Which vault implementation(s) to allow for new vault creation (see upgradeable BTC 
 *     custodianship system below)
 *   - Which IBitcoinKit implementation to use as a fallback for converting addresses to scripts
 *     if the original IBitcoinKit implementation this BitcoinVaultManager was constructed with is
 *     unable to convert the address (to support new address types in future).
 * 
 * ** hBTC Token Contract **
 * The BitcoinTunnelManager deploys its own instance of the hBTC token contract, which will continue
 * to be the only hBTC token representing BTC custodied with this instace of the Bitcoin tunnel
 * system for the duration of its lifetime.
 * 
 * ** Upgradeable BTC Custodianship System **
 * Over time, the custodianship mechanism for BTC used by the BitcoinTunnelManager can change. For
 * example, a BitcoinTunnelManager could be initially deployed using a over-collateralized
 * address-based custodianship system, and then later be updated to use a BitVM-style construction.
 *
 * When the custodianship mechanism is updated by the appropriate admin in GlobalConfig (which could
 * be a single EOA, a Safe, or a custom smart contract that is controlled via some on-chain
 * governance mechanic), the active Vault Factory is updated, meaning that all new vaults created
 * will use the new custodianship mechanism (Vault implementation).
 *
 * This custodianship upgrade will deprecate all vaults created using the old mechanism, which if
 * implemented correctly in the vault implementation itself will block deposit confirmations to
 * vaults of the old system after a grace period to phase them out.
 * 
 * ** BTC Deposit Process **
 * To deposit BTC and mint corresponding hBTC, users:
 *   1. Choose a Vault they want to deposit to which will accept the size of deposit
 *      they need, has fees they agree with, etc.
 *   2. Send BTC on the Bitcoin blockchain to that Vault, in whichever way is required
 *      for the Vault (such as sending to a specified address specific to the vault, etc.)
 *   3. Wait for the on-Bitcoin deposit transaction to be sufficiently confirmed
 *      (what constitutes sufficiently confirmed depends on Vault implementation)
 *   4. (If required by the chosen Vault) Execute a deposit pre-confirmation with Vault
 *      (which could be required by implementations that need information about a 
 *      user-generated intermediate address to be revealed, etc.)
 *   5. Execute a deposit confirmation with the BitcoinTunnelManager, which will confirm
 *      the deposit with the specified Vault and if successful mint the corresponding 
 *      hBTC for user
 *
 * ** BTC Withdrawal Process **
 * To withdrawal BTC, users:
 *   1. Initiate a withdrawal from a specific vault that the user has selected, which
 *      has enough BTC available to fulfill the withdrawal.
 *   2. Wait for the operator of the vault to process their withdrawal.
 *   3. If the operator of the vault does not process their withdrawal within the
 *      time specified by the vault custodianship implementation, the user calls
 *      challengeWithdrawal() to report the misbehavior, and if the withdrawal was
 *      not fulfilled by the operator successfully the BitcoinTunnelManager will
 *      re-mint the corresponding hBTC for the user.
 *      
 * 
 * ** Vault Fee Collection **
 * Vault implementations will generally charge a fee, which is implemented by each vault
 * differently. A specific Vault implementation can either credit the operator(s) with ownership of
 * native BTC held by the vault which they could withdraw directly, or by recording the fees and
 * allowing the Operator to claim them and mint hBTC via the BitcoinTunnelManager.
 * 
 * To support the 2nd model of Vault fee claiming, the BitcoinTunnelManager implements a
 * "mintVaultFees" which a specific Operator can call when they want to mint some or all of their
 * collected fees as hBTC.
*/
contract BitcoinTunnelManager is CommonStructs {
    // Indicates that a new vault was successfully created
    event VaultCreated(address indexed setupAdmin, address indexed operatorAdmin, address indexed vaultAddress);

    // Indicates a deposit was successfully confirmed
    event DepositConfirmed(address indexed vault, address indexed recipient, bytes32 indexed depositTxId, uint256 depositSats, uint256 netSatsAfterFee);
    
    // Indicates that a withdrawal was initiated
    event WithdrawalInitiated(address indexed vault, address indexed withdrawer, string indexed btcAddress, uint256 withdrawalSats, uint256 netSatsAfterFee, uint64 uuid);

    // Indicates that a withdrawal was successfully challenged
    event WithdrawalChallengeSuccess(address indexed vault, address indexed withdrawer, uint64 indexed uuid);

    /**
     * The onlyVaultCaller modifier is used on all functions that should *only* be callable by the
     * vaults managed by this Bitcoin Tunnel Manager.
    */
    modifier onlyVaultCaller() {
        require(vaultList[msg.sender] == true);
        _;
    }

    // The GlobalConfig which manages permissions for vault custodianship implementation upgrades
    // (IVaultFactory used), global vault creation pausing and whitelisting, and withdrawal pausing
    // and whitelisting.
    GlobalConfig public globalConfig;

    // The original bitcoinKitContract the BitcoinTunnelManager is created with, which will always
    // be available as a fall-back to prevent upgrades to the IBitcoinKit implementation from being
    // able to block conversions of BTC addresses to locking scripts in the event of a malicious or
    // erroneous upgrade to the BitcoinKit implementation.
    IBitcoinKit public originalBitcoinKitContract;

    // The hBTC token contract deployed by this Bitcoin Tunnel Manager
    BTCToken public btcTokenContract;

    // Counter for each vault created under this Bitcoin Tunnel Manager
    uint32 public vaultCounter = 0;

    // Mapping storing all vaults created
    mapping(uint32 => IBitcoinVault) public vaults;

    // Mapping storing the address of each created vault to lookup whether a particular address
    // refers to a vault deployment created by and managed under this Bitcoin Tunnel Manager.
    mapping(address => bool) public vaultList;


    constructor(address initialAdmin,
                uint256 initialVaultFactoryUpgradeDelay,
                uint256 minimumVaultFactoryUpgradeDelay,
                uint256 initialBitcoinKitUpgradeDelay,
                uint256 initialGlobalConfigAdminUpgradeDelay,
                IBitcoinKit bitcoinKitAddr) {
        require(initialAdmin != address(0), "initial admin not specified");
        require(address(bitcoinKitAddr) != address(0), "bitcoin kit address not specified");
        
        // Deploy a new GlobalConfig
        globalConfig = new GlobalConfig(
            initialAdmin, 
            initialVaultFactoryUpgradeDelay,
            minimumVaultFactoryUpgradeDelay,
            initialBitcoinKitUpgradeDelay,
            initialGlobalConfigAdminUpgradeDelay,
            bitcoinKitAddr);

        // Deploy a new BTCToken which is the ERC20 contract for hBTC that this BitcoinTunnelManager
        // will mint/burn
        btcTokenContract = new BTCToken(address(this));

        originalBitcoinKitContract = bitcoinKitAddr;
    }

    /**
     * Called by vaults to burn hBTC that the vault itself has collected during liquidation that
     * should be burnt. Only callable by vaults to prevent user mistakes, and the vault collects the
     * hBTC first using standard ERC20 transferFrom() to prevent a vault implementation from being
     * able to burn hBTC directly as an extra layer of authority separation.
     *
     * @param amount The amount of hBTC held by the vault to burn
    */
    function burnLiquidatedBTC(uint256 amount) external onlyVaultCaller {
        btcTokenContract.burnBTC(msg.sender, amount);
    }


    /**
     * Called by anyone who wants to deploy a new vault that will be used under this Bitcoin Tunnel
     * Manager. The code implementation of the vault that will be deployed depends on the current
     * IVaultFactory contract that this BitcoinTunnelManager is configured to use.
     *
     * Caller specifies a vaultType which is passed through to the IVaultFactory to allow users to
     * specify one of several vault types if the IVaultFactory supports creation of multiple
     * different vaults based on different custodianship model implementations.
     *
     * @param setupAdmin The setup admin to set in the newly created vault
     * @param operatorAdmin The operator admin to set in the newly created vault 
     * @param vaultType The type of vault to deploy using the vault factory
     * @param extraInfo Additional extra bytes required for setting up a particular vault implementation
     */
    function createVault(address setupAdmin, address operatorAdmin, uint256 vaultType, bytes memory extraInfo) external {
        require(!globalConfig.vaultCreationPaused(), "vault creation is paused");

        if (globalConfig.vaultCreationWhitelistEnabled()) {
            require(globalConfig.isAddressPermittedToCreateVault(msg.sender), "vault creation whitelisting enabled and caller is not whitelisted");
        }

        IVaultFactory factory = globalConfig.vaultFactory();

        // Deploy the vault by passing through setup parameters along with this Bitcoin
        // Tunnel Manager's address as the tunnel admin
        IBitcoinVault vault = factory.createVault(setupAdmin, address(this), operatorAdmin, vaultType, extraInfo);

        // Store vault and update counter
        vaults[vaultCounter] = vault;
        vaultList[address(vault)] = true;
        vaultCounter++;

        emit VaultCreated(setupAdmin, operatorAdmin, address(vault));
    }

    /**
     * Preconfirms a deposit if required by the underlying vault implementation. The preconfirm
     * deposit function can be called directly on the IBitcoinVault implementation, but we provide a
     * pass-through here so users only have to interact with the BitcoinTunnelManager for all
     * deposit needs.
     *
     * Anyone can call this function for any BTC deposit that needs to be preconfirmed.
     *
     * Reverts if the vault reports the preconfirmation failed.
     *
     * @param vaultIndex The index of the vault to preconfirm the deposit on
     * @param txid The txid of the deposit transaction on Bitcoin to preconfirm
     * @param outputIndex The output index of the deposit txid
     * @param extraInfo Any additional data required by the vault implementation to process the deposit preconfirmation
    */
    function preconfirmDeposit(uint32 vaultIndex, bytes32 txid, uint256 outputIndex, bytes memory extraInfo) external {
        require(vaultIndex < vaultCounter, "vault does not exist");
        IBitcoinVault vault = vaults[vaultIndex];

        require(vault.getStatus() == CommonStructs.Status.LIVE, 
        "vault must be live to accept predeposits");

        bool result = vault.preconfirmDeposit(txid, outputIndex, extraInfo);
        require(result, "preconfirmation failed");
    }

    /**
     * Confirms a deposit transaction on Bitcoin to the corresponding vault. If vault confirms that
     * the deposit was accepted, mint the appropriate amount of hBTC to the EVM address extracted
     * from or otherwise associated with the confirmed deposit that the vault returns.
     *
     * If the vault custodianship implementation requries predeposit, the txid used for
     * preconfirmation can be different than the one used for confirmation, allowing implementations
     * that preconfirm a deposit to an initial holding UTXO which is then swept to the vault in a
     * separate transaction which is used for confirmation.
     *
     * @param vaultIndex The index of the vault to confirm the deposit with
     * @param txid The transaction ID of the BTC transaction on Bitcoin to confirm
     * @param outputIndex The output index of the specified BTC transaction which deposits to the vault
     * @param extraInfo Any additional data required by the vault implementation to process the deposit confirmation
     *
     * @return successful Whether the deposit was confirmed successfully
    */
    function confirmDeposit(uint32 vaultIndex, bytes32 txid, uint256 outputIndex, bytes memory extraInfo) public returns (bool successful) {
        require(vaultIndex < vaultCounter, "vault does not exist");
        IBitcoinVault vault = vaults[vaultIndex];

        require(vault.getStatus() == CommonStructs.Status.LIVE, "vault must be live to accept deposits");

        (bool success, uint256 totalDeposit, uint256 netDeposit, address tunnelDestination) = vault.confirmDeposit(txid, outputIndex, extraInfo);

        if (success) {
            // The net deposit amount of hBTC is minted, which will be less than the totalDeposit based on BTC chain data
            btcTokenContract.mintBTC(tunnelDestination, netDeposit);

            emit DepositConfirmed(address(vault), tunnelDestination, txid, totalDeposit, netDeposit);
        }

        return success;
    }

    /**
     * Initiates a withdrawal on the specified vault. The corresponding amount of hBTC that matches
     * the withdrawal request will be burned from the sender, and the vault will calculate a fee to
     * charge and return whether the initialization was successful, the fees charged, and a 32-bit
     * UUID specific to the vault.
     *
     * This function will calculate a 64-bit UUID, comprised of the vault index in the higher 32
     * bits, and the vault-returned uuid in the lower 32 bits, creating a UUID that can be used to
     * track the withdrawal status and be decomposed to convert it to a vault-specific UUID.
     *
     * @param vaultIndex The index of the vault to initiate the withdrawal with
     * @param btcAddress The Bitcoin address to withdraw BTC to from the vault
     * @param amount The amount to withdraw - actual amount received on BTC will be this minus fees charged
     *
     * @return feeSats The fees (in sats) charged by the vault on the withdrawal
     * @return uuid A UUID that can be used to track the withdrawal going forward
    */
    function initiateWithdrawal(uint32 vaultIndex, string memory btcAddress, uint256 amount) external returns (uint256 feeSats, uint64 uuid) {
        require(!globalConfig.withdrawalsPaused(), "withdrawals are paused");
        require(vaultIndex < vaultCounter, "vault does not exist");

        if (globalConfig.withdrawalWhitelistEnabled()) {
            require(globalConfig.isAddressPermittedToWithdraw(msg.sender), 
            "withdrawal whitelisting enabled and caller is not whitelisted");
        }

        IBitcoinVault vault = vaults[vaultIndex];

        Status status = vault.getStatus();

        require(status == Status.LIVE || status == Status.CLOSING_INIT, 
        "can only withdraw from a vault that is LIVE or CLOSING_INIT");

        // Convert the BTC address to a script. Vaults support withdrawing to arbitrary script
        // (within size bounds), but BitcoinTunnelManager only supports addresses to protect against
        // user error. The original BitcoinKit contract is always used first, with a fallback to the
        // IBitcoinKit implementation set in the GlobalConfig if and only if the original contract
        // is unable to convert the address. This ensures that addresses supported by the original
        // BitcoinKit will always continue to work correctly.
        bytes memory btcWithdrawalScript = new bytes(0);
        if (originalBitcoinKitContract.isAddressValid(btcAddress)) {
            btcWithdrawalScript = originalBitcoinKitContract.getScriptForAddress(btcAddress);
        } else if (globalConfig.bitcoinKitAddr().isAddressValid(btcAddress)) {
            btcWithdrawalScript = globalConfig.bitcoinKitAddr().getScriptForAddress(btcAddress);
        }

        // Ensure that one of the IBitcoinKit implementations returned a non-zero withdrawal script
        require(btcWithdrawalScript.length > 0, "btc address could not be converted to a valid withdrawal script");

        btcTokenContract.burnBTC(msg.sender, amount);

        (bool success, uint256 fee, uint32 vaultSpecificUUID) = vault.initiateWithdrawal(btcWithdrawalScript, amount, msg.sender);

        require(success, "withdrawal initialization failed");

        uuid = (uint64(vaultIndex) << 32) | uint64(vaultSpecificUUID);

        emit WithdrawalInitiated(address(vault), msg.sender, btcAddress, amount, (amount - fee), uuid);

        return (feeSats, uuid);
    }

    /**
    * Challenges a withdrawal based on the global uuid (which is vault index + vault specific UUID).
    *
    * If the vault reports that the challenge was successful, mint the corresponding amount of hBTC
    * back to the original withdrawer (provided by the vault) to replace the hBTC burned when withdrawal
    * was first requested.
    *
    * @param uuid The global uuid of the withdrawal which was originally returned from initiateWithdrawal
    * @param extraInfo Any extra info required by the vault implementation to challenge a withdrawal
    *
    * @return success Whether challenging the withdrawal was successful or not
    */
    function challengeWithdrawal(uint64 uuid, bytes memory extraInfo) external returns (bool success) {
        uint32 vaultIndex = uint32((uuid & 0xFFFF0000) >> 32);
        require(vaultIndex < vaultCounter, "vault does not exist");

        IBitcoinVault vault = vaults[vaultIndex];
        uint32 vaultSpecificUUID = (uint32(uuid & 0x0000FFFF));

        (bool challengeSuccess, uint256 satsToCredit, address originalWithdrawer) = 
        vault.challengeWithdrawal(vaultSpecificUUID, extraInfo);

        if (challengeSuccess) {
            btcTokenContract.mintBTC(originalWithdrawer, satsToCredit);
            emit WithdrawalChallengeSuccess(address(vault), originalWithdrawer, uuid);
        }

        return challengeSuccess;
    }

    /**
     * Mints collected fees as hBTC for an operator for a specific vault.
     *
     * Note that this function passes through msg.sender to the mintOperatorFees function on the
     * vault, which the vault trusts the BitcoinTunnelManager to correctly relay.
     *
     * Callable by anyone, but will only succeed when called by a an address that has the right to
     * mint fees on the corresponding vault. Vaults can implement the ability for multiple different
     * operators to mint their own fees, for custodianship mechanisms that support multiple
     * operators participating in a single vault.
     *
     * @param vaultIndex The index of the vault in the Bitcoin Tunnel Manager
     * @param amountToMint The amount of hBTC to mint from pending collected fees, in sats
     *
     * @return amountMinted The amount actually minted, which may be smaller than the requested amount if supported by the vault
    */
    function mintOperatorFees(uint32 vaultIndex, uint256 amountToMint) external returns (uint256 amountMinted) {
        IBitcoinVault vault = vaults[vaultIndex];
        (bool success, uint256 amountMintable) = vault.mintOperatorFees(msg.sender, amountToMint);
        require(success, "vault does not permit minting the specified amount of assets");

        btcTokenContract.mintBTC(msg.sender, amountMintable);
        return amountMintable;
    }
}