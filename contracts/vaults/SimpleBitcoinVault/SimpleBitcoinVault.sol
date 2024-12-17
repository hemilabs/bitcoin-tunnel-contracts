// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import "../IBitcoinVault.sol";
import "./SimpleGlobalVaultConfig.sol";
import "../VaultUtils.sol";
import "./SimpleBitcoinVaultState.sol";
import "./ISimpleBitcoinVaultStateFactory.sol";
import "../../BitcoinTunnelManager.sol";
import "../../BTCToken.sol";
import "./SimpleBitcoinVaultStructs.sol";
import "./SimpleBitcoinVaultUTXOLogicHelper.sol";

/**
* [SUMMARY]
 * The SimpleBitcoinVault is a vault which custodies BTC across multiple UTXOs held by a single
 * Bitcoin address.
 *
 * Periodically, the operator sweeps deposits together into a single UTXO, such that that the single
 * UTXO can be used for processing withdrawals with a predictable transaction size, and the
 * operators can time sweeps which are not as time-sensitive as withdrawals around preferable
 * Bitcoin fee market times.
 *
 * Each SimpleBitcoinVault is collateralized and secured by a single operator, who competes with
 * other SimpleBitcoinVault operators to provide deposits and withdrawals at competitive rates.
 * Operators can set and modify deposit and withdrawal fees dynamically to adjust to the overall
 * supply vs demand market for deposits and withdrawals, within certain thresholds maintained by the
 * protocol itself.
 *
 * SimpleBitcoinVault collateralization is dynamic - operators are free to increase or decrease
 * their collateral so long as minimum collateral thresholds for custodied assets are maintained.
 * 
 * When a SimpleBitcoinVault's collateral falls below the liquidation threshold, their collateral is
 * seized by the protocol and used to repurchase and burn the BTC custodied by the vault on behalf
 * of the protocol to ensure solvency. The end result of liquidation of a SimpleBitcoinVault is the
 * operator loses the collateral which was required to repurchase and burn the appropriate quantity
 * of hBTC to remove the vault from actively representing BTC custodianship for the protocol, and
 * the operator receives back the remaining unused collateral and keeps the Bitcoin stored in the
 * custodianship wallet they control.
 *
 * Vaults are also liquidated for misbehavior, such as unauthorized withdrawals or failure to
 * process a specific withdrawal within the specified timeframe.
 * 
 * It is possible for users to accidentally send funds to the vault in a way which does not
 * correlate with a valid deposit. Depending on the type of mistake, attempts will be made
 * automatically by the protocol to return the funds (minus fees) to the sender, however this will
 * not be possible in all scenarios.
 * 
 * It is the responsibility of users to interact with the SimpleBitcoinVault correctly,
 * meaning: 
 *   - Transaction contains an OP_RETURN that encodes their EVM address for minting hBTC,
 *     and this OP_RETURN output is the first OP_RETURN output in the transaction.
 *   - Transaction deposit output must be above the minimum deposit threshold
 *   - Transaction does not deposit more BTC than the vault's collateral can handle
 *   - OP_RETURN and output to the vault is within the first 16 outputs
 *
 *
 * [VAULT SETUP PROCESS]
 * Anyone can set up a SimpleBitcoinVault (assuming no global vault creation pause or
 * whitelisting is temporarily enabled at the BitcoinTunnelManager level) through the
 * BitcoinTunnelManager.
 *
 * Deploying the SimpleBitcoinVault through the BitcoinTunnelManager is required for the
 * vault to be recognized by the Bitcoin Tunnel protocol and usable.
 *
 * The setup steps are as follows:
 *   1. Call createVault() on the BitcoinTunnelManager with appropriate arguments
 *   2. Deposit sufficient collateral in the recognized ERC20 collateral token into the new vault
 *   3. Configure the vault with a new Bitcoin address that the operator holds the private key for
 *   4. Set initial parameters for deposit and withdrawal fees as desired
 *   5. When ready to begin processing deposits and withdrawals, change the vault status to LIVE
 *
 *
 * [VAULT MANAGEMENT PROCESS]
 * Once a Vault is live, the operator is responsible for performing the following duties:
 *   1. Maintaining a sufficient collateral threshold at all times (or face liquidation)
 *   2. Process withdrawals in a timely manner
 *   3. Actively modify deposit and withdrawal fees as desired, to ensure that enough fees
 *      are charged to properly account for on-chain fees the operator will have to pay at
 *      a minimum (or face partial liquidation seizure)
 *
 * The Vault can continue operating indefinitely so long as the operator behaves appropriately,
 * unless the SimpleBitcoinVault custodianship system is phased out by the protocol at which point
 * the Vault will no longer accept deposits and can only process withdrawals.
 *
 * By operating the Vault, the operator will collect fees charged on deposits and withdrawals which
 * are accounted for in a fee collection account, which the operator can claim by minting the
 * corresponding hBTC through the BitcoinTunnelManager.
 *
 *
 * [VAULT CLOSURE PROCESS]
 * If an operator desires to spin down their Vault, they can set their Vault to CLOSING_INIT mode
 * which will block future deposits, turning the vault into a withdrawal-only mode.
 *
 * Additionally, the operator can unwind their vault more quickly by providing the equivalent hBTC
 * that their Vault still represents custodianship for, which is burnt and the operator can then
 * withdraw their full collateral and keep the equivalent BTC remaining in the custodianship address
 * they used.
 *
 *
 * [COLLATERALIZATION SYSTEM]
 * Each Vault is collateralized by its respective operator with a quantity of the approved ERC20
 * token. Vault operators can deposit additional collateral or withdraw excess collateral at any
 * time.
 *
 * The value of the collateral versus the custodied BTC is determined by an Oracle, which is an
 * implementation of the IAssetPriceOracle which is configured in the SimpleGlobalVaultConfig,
 * meaning that the same Oracle implementation (and thus, price feeds) are used by all
 * SimpleBitcoinVaults.
 *
 * There are two collateralization thresholds:
 *   1. The "soft collateralization threshold", below which no additional deposits can be accepted
 *      (and any attempted deposits will be rejected and the operator will be required to send
 *      the deposit back to the originator minus fees)
 *   2. The "hard collateralization threshold", below which the vault is subject to liquidation.
 *
 * The soft collateralization threshold is by default set to the maximum allowed value at vault
 * construction, which is provided by the SimpleGlobalVaultConfig and used by the
 * SimpleBitcoinVaultFactory. Operators can optionally choose to increase this threshold to protect
 * against liquidations.
 *
 * For example, if the minimum soft collateralization threshold is 140, then an operator could set
 * it to 150, and deposits would not be accepted when the deposit would increase the value of BTC
 * custodied by the vault such that the value of the collateral is less than 150% that of the BTC
 * custodied.
 *
 * The hard collateralization threshold is set to a single value provided by the
 * SimpleGlobalVaultConfig and cannot be changed by the operator.
 *
 * 
 * [VAULT LIQUIDATION PROCESS]
 * When a Vault falls below the hardCollateralizationThreshold, the vault is immediately subject to
 * full liquidation. Anyone can begin the vault liquidation process if the vault's collateral value
 * is less than the hardCollateralizationThreshold multiplied by the BTC custodied by the vault. A
 * vault is also eligible for liquidation when the operator misbehaves by failing to process a
 * withdrawal within the requested time.
 *
 * The full liquidation process is an ascending auction where anyone can sell hBTC for the
 * underlying collateral at the current rate offered, and the current rate increases over time.
 *
 * The rate starts at 5% higher than the value of the collateral based on the oracle and then is
 * continually increased.
 *
 * Because the vault does not know about pending deposits that have not yet been confirmed,
 * additional deposits to the vault are permitted during the first 4 hours of liquidation and the
 * depositor will be credited with the appropriate hBTC if their deposit is otherwise valid and
 * doesn't cause the vault to exceed the soft collateralization threshold as usual (only applies
 * when vault is being liquidated due to operator misbehavior rather than collateralization).
 *
 * If additional deposits to the vault are confirmed during the liquidation process, the amount of
 * hBTC needing to be liquidated will be increased. This can result in selling collateral for higher
 * than usual, but is limited to the increase in price during the first 4 hours of liquidation,
 * after which new deposits cannot be accepted.
 *
 * The liquidation process is considered finished when 4 hours pass (meaning no more deposits can
 * come in) and the vault has recovered all of the hBTC it needs to recover.
 *
 * After the full liquidation is complete, the operator can withdraw any remaining collateral which
 * wasn't sold off, and also owns all of the native BTC left in the custody address.
 *
 * During the full liquidation process, the operator can also deposit the full amount of hBTC
 * required to end the liquidation process immediately and recover their entire collateral.
 *
 * When an operator reports a sweep or withdrawal transaction that paid on-BTC fees higher than the
 * fees collected from the user, the difference is subtracted from the operator's collected but
 * unclaimed fees. If the operator's collected but unclaimed fees are not sufficient, then a partial
 * liquidation is immediately triggered, starting by offering 2x the amount of collateral which
 * should be required based on the price oracle to unwind the BTC:hBTC discrepancy.
 *
 * Similar to the full liquidation procedure, the operator can provide the required amount of hBTC
 * to immediately close out the partial liquidation process.
 *
 *
 * [INCENTIVE MECHANISMS]
 * Operators are incentivized by the fees that they can collect on deposits and withdrawals, and
 * incentives are aligned such that they maximize revenue by competing with other operators to offer
 * the lowest fees to users.
 *
 * Operators are disincentivized from stealing assets because the collateral they post is worth more
 * than the BTC that they custody on behalf of the protocol during normal operation. Operators are
 * incentivized to maintain appropriate collateral ratios, because liquidations will generally
 * result in the operator losing some amount of value.
 *
 * Liquidators are incentivized by the opportunity to purchase assets at a discount in exchange for
 * de-risking the protocol. Liquidators submit irrevocable bids in a reverse auction, which
 * minimizes the value that operators lose while ensuring that as soon as a bid is received, the
 * vault is effectively de-risked.
 *
 *
 * [VAULT ACCOUNTING]
 * The Vault maintains accounting for:
 *   - The total BTC the vault is custodying on behalf of the protocol
 *   - The total operator fees collected which have not been claimed
 *
 * The total BTC that the vault is custodying on behalf of the protocol represents the total
 * circulating supply of hBTC in circulation which is backed by BTC held by the Vault. It is the sum
 * of all deposits (minus fees) minus withdrawals (minus fees) plus fees withdrawn by the operator
 * as hBTC.
 *
 * For example:
 *   1. Vault is initialized, holds 0 BTC and 0 collected fees
 *   2. User deposits 0.1 BTC, and 0.001 is charged in fees. User mints 0.099 hBTC, and the total
 *      hBTC represented by vault is 0.099 hBTC. There are 0.001 BTC in pending fees.
 *   3. ANother user deposits 0.2 BTC, and 0.002 is charged in fees. User mints 0.198 hBTC, and the
 *      total hBTC represented by vault is 0.297 hBTC. There are 0.003 BTC in pending fees.
 *   4. Operator processes the deposit sweep of both deposits, paying a total of 0.0005 in on-chain
 *      fees, and operator now has 0.003-0.0005=0.0025 BTC in collected but unclaimed fees.
 *      At this point, the Vault represents 0.297 hBTC in circulation, which is the vault
 *      custodianship value used for determining appropriate collateralization. The actual balance
 *      (sum of all UTXOs) of the Vault is 0.297+0.0025=0.2995 BTC, but 0.0025 of that is the
 *      Operator's, so is not of concern to the protocol from a custodianship security perspective.
 *   5. Operator mints hBTC representing their 0.0025 BTC in collected fees, at which point the
 *      Vault is now custodying 0.2995 BTC which is backing circulating hBTC, and this value is
 *      now used for determining appropriate collateralization. Operator has 0 pending collected
 *      but unclaimed fees.
 *   6. User submits a withdrawal for 0.15 BTC by burning 0.15 hBTC, and a pending fee for the
 *      withdrawal of 0.0015 BTC will be charged so user expects to receive 0.15-0.0015=0.1485
 *      BTC to their withdrawal address. Vault still holds 0.2995 BTC on behalf of the protocol, as
 *      the withdrawal has not been processed yet, and this value is still used for collateralization.
 *   7. Operator processes withdrawal, sending 0.1485 BTC and paying 0.0005 in on-chain fees. After
 *      proving the withdrawal to the vault, the Vault holds 0.2995-0.15=0.1495 BTC on behalf of
 *      the protocol, and the operator has 0.0015-0.0005=0.001 BTC in collected but unclaimed fees.
 *
 * Deposits are not counted towards the Vault's custodied balance until the deposit is claimed and
 * the corresponding hBTC is minted. Withdrawals continue to be counted towards the Vault's
 * custodied balance until the withdrawal transaction is proven to the vault.
 *
 * 
 * [PERMISSIONED ADDRESSES]
 * There are two addresses which play important roles in the operation of a SimpleBitcoinVault:
 *   - The tunnelAdmin is the BitcoinTunnelManager which deployed the SimpleBitcoinVault, and
 *     is the only actor able to call deposit and withdrawal related functions. Users call 
 *     deposit and withdrawal functions on the Vault via the BitcoinTunnelManager. All liquidation
 *     actions also go through the BitcoinTunnelManager, but the address of the original caller
 *     is passed through, so that special treatment during the liquidation process can be given
 *     to the operatorAdmin.
 *   - The operatorAdmin is the EVM address of the operator who deposits collateral and maintains
 *     the required collateral ratio, and submits proof of sweep and withdrawal transactions
 *     directly to the vault.
 *
 *
 * [DEPOSIT AND WITHDRAWAL FEES]
 *
 * As it costs BTC to perform these sweep transactions, each deposit is charged a fee, which is held
 * in a "virtual accounting escrow" until the sweep occurs, at which time the actual cost (in sats)
 * of the sweep transaction is removed from the virtual escrow and the remainder is released to the
 * operator's virtual revenue.
 *
 * Because the cost to process the sweep on Bitcoin is unrelated to the size of the deposit, but
 * larger deposits consume more of the operator's collateral, fees are charged in a 2-step system
 * which takes both costs into account.
 *
 * The operator of each vault sets two values (within min/max bounds enforced across all instances
 * of the SimpleBitcoinVault deployed):
 *   - minDepositFee (the minimum fee in sats that all deposits will be charged)
 *   - depositFeeBps (the fee in bps that a deposit will be charged)
 *
 * And the actual fee collected from each deposit will be the higher of minDepositFee or the
 * deposit's size multiplied by the bps cost.
 *
 * For example: 
 *   - The SimpleGlobalVaultConfig has a min deposit fee of 10,000 sat and max of 200,000 sat
 *   - The SimpleGlobalVaultConfig as a min bps of 20 (0.2%) and 100 (1%)
 *   - The operator set a min deposit fee of 25,000 sat (0.00025 BTC) which is within bounds
 *   - The operator sets a deposit bps fee of 30 (0.3%) which is within bounds
 *   - Therefore, a deposit of 100,000 sat will incur an effective 25% fee (because of the minimum 
 *     fee charged), and a deposit of 10,000,000 sat will incur an effective 0.3% fee (because the 
 *     bps fee of 30,000 sat is higher than the min deposit fee)
 *
 * Because users will make deposits that take time to confirm on Bitcoin, increases to either the
 * minDepositFee or depositFeeBps will take 4 hours to go into effect, ensuring depositors receive
 * the fee treatment they expected for their deposit as long as they pay the appropriate Bitcoin
 * transaction fees on their end to have their transaction included in the Bitcoin blockchain in a
 * timely manner.
 *
 * A similar mechanic is used for withdrawals, with minWithdrawalFee and withdrawalFeeBps.
 *
 * Because it is expected that multiple vaults will be competing for traffic from users in both the
 * deposit and withdrawal market, allowing these two rates to be different should not create
 * "ransom" scenarios (deposits are cheap but withdrawals are expensive and that withdrawal fee is
 * laid off on the user who ends up with the hBTC in the end) because operators are openly competing
 * with each other for both deposits and withdrawals.
 *
 * The end economic scenario should be that the cost charged by operators for deposits and
 * withdrawals aligns with the different economic costs associated with them and the demand
 * imbalance between deposits (requiring collateralization commitment) and withdrawals (which free
 * up collateral).
*/

contract SimpleBitcoinVault is IBitcoinVault, VaultUtils, SimpleBitcoinVaultStructs, ReentrancyGuard {
    event CollateralDeposited(uint256 amountDeposited, uint256 totalCollateral);
    event CollateralWithdrawn(uint256 amountWithdrawn, uint256 totalCollateral);

    event VaultInitializing();
    event VaultLive();
    event VaultClosingInit();
    event VaultClosingVerif();
    event VaultClosed();

    event OperatorAdminUpdateInitiated(address indexed newOperatorAdmin);
    event OperatorAdminUpdateCompleted(address indexed newOperatorAdmin);
    event OperatorAdminUpdateRejected(address indexed newOperatorAdmin);
    /**
     * The onlyTunnelAdmin modifier is used on all functions that should *only* be callable by the
     * tunnelAdmin.
    */
    modifier onlyTunnelAdmin() {
        require(msg.sender == tunnelAdmin);
        _;
    }

    /**
     * The onlyOperatorAdmin modifier is used on all functions that should *only* be callable by the
     * operatorAdmin.
    */
    modifier onlyOperatorAdmin() {
        require(msg.sender == operatorAdmin);
        _;
    }

    /**
     * The onlyStateChild modifier is used on all functions that should *only* be callable by the
     * vaultStateChild (a SimpleBitcoinVaultState contract).
     */
    modifier onlyStateChild() {
        require (msg.sender == address(vaultStateChild));
        _;
    }


    /**
     * The onlyOperatorAdminPassthrough modifier is used on all functions that should *only* be
     * callable by the tunnelAdmin who passes through the original caller which should *only* be the
     * operatorAdmin.
    */
    modifier onlyOperatorAdminPassthrough(address passthroughAddr) {
        require(msg.sender == tunnelAdmin);
        require(passthroughAddr == operatorAdmin);
        _;
    }

    /**
    * The notZeroAddress modifier is used on all functions where a check that an
    * address argument is not the zero address.
    */
    modifier notZeroAddress(address addr) {
        require(addr != address(0));
        _;
    }

    // hVM already runs at least 2 blocks behind the Bitcoin tip, so these
    // are each 6 (2 + 4) confirmations in practice under normal hVM operation.
    uint32 public constant MIN_BITCOIN_CONFIRMATIONS = 4;

    // Limit the maximum number of pending withdrawals allowed, to limit worst-case gas costs when
    // analyzing the entire withdrawal queue is required (ex: confirming that a withdrawal is
    // malicious and does not pay out to any of the expected pending withdrawal lock scripts).
    uint256 public constant MAX_WITHDRAWAL_QUEUE_SIZE = 5;

    // How long the operator has to process a withdrawal before vault is subject to full liquidation
    uint256 public constant WITHDRAWAL_GRACE_PERIOD_SECONDS = 60 * 60 * 12; // 12 hours

    // Minimum deposit of 0.01 BTC
    uint256 public constant MINIMUM_DEPOSIT_SATS = 1000000;

    // Minimum withdrawal of 0.01 BTC
    uint256 public constant MINIMUM_WITHDRAWAL_SATS = 1000000;

    // Minimum valid script size is first line of defense against invalid scripts
    uint256 public constant MIN_VALID_BTC_SCRIPT_SIZE = 20;

    // Maximum valid script size prevents unreasonably long spend scripts
    uint256 public constant MAX_VALID_BTC_SCRIPT_SIZE = 64;

    // How long after initiating wind-down procedures until the vault enters CLOSING_INIT state
    uint256 public constant WIND_DOWN_DEPOSIT_GRACE_PERIOD = 60 * 60 * 4; // 4 hours

    // Status of the vault
    Status vaultStatus;
    
    // Global config shared among all SimpleBitcoinVaults made by the same factory
    SimpleGlobalVaultConfig public vaultConfig;

    // Address of the BitcoinTunnelManager that manages this vault
    address public tunnelAdmin;

    // Address of the operator who runs this vault
    address public operatorAdmin;

    // Address of the operator admin this vault is pending an update to
    address public pendingActivationOperatorAdmin;

    SimpleBitcoinVaultState public vaultStateChild;

    SimpleBitcoinVaultUTXOLogicHelper utxoLogicHelper;

    // The contract of the hBTC token
    BTCToken btcTokenContract;

    

    // Upon construction, this is set to the minCollateralAmount that is configured by the
    // SimpleGlobalVaultConfig. The value at construction will remain in force for the lifespan of
    // the vault, and will not change to reflect changes in the SimpleGlobalVaultConfig. This is to
    // prevent a future increase in the collateral amount required to effect vaults which were
    // created before the increase went into place.
    uint256 minCollateralAmount;

    // Bitcoin custodian address
    string public bitcoinCustodyAddress;

    // The keccak256 hash of the bitcoinCustodyAddress's corresponding BTC lock script
    bytes32 bitcoinCustodyAddressScriptHash;

    // Whether the Bitcoin custodian address has been set
    bool bitcoinCustodyAddressSet;

    // Total pending operator BTC fees in sats
    uint256 totalPendingFeesCollected;

    // The primary UTXO txid
    bytes32 currentSweepUTXO;

    // The primary UTXO index
    uint256 currentSweepUTXOOutput;

    // The value of the primary UTXO
    uint256 currentSweepUTXOValue;

    // When a vault wind-down procedure is initiated, this is set to the future time after which the
    // vault will enter CLOSING_INIT mode.
    uint256 public windDownTime;


    /**
     * The SimpleBitcoinVault does not require a setupAdmin, so it is not included in the
     * constructor arguments.
    */
    constructor (address _tunnelAdmin, 
                 address _operatorAdmin, 
                 BTCToken _btcTokenContract,
                 SimpleGlobalVaultConfig _vaultConfig,
                 ISimpleBitcoinVaultStateFactory vaultStateFactory,
                 SimpleBitcoinVaultUTXOLogicHelper _utxoLogicHelper) {
        tunnelAdmin = _tunnelAdmin;
        operatorAdmin = _operatorAdmin;
        vaultConfig = _vaultConfig;
        btcTokenContract = _btcTokenContract;
        vaultStatus = Status.CREATED;

        vaultStateChild = vaultStateFactory.createSimpleBitcoinVaultState(this, _operatorAdmin, _vaultConfig, _btcTokenContract);

        utxoLogicHelper = _utxoLogicHelper;
    }

    /**
    * Begins the update process for the operatorAdmin address. Only callable by the current operatorAdmin.
    *
    * @param newOperatorAdmin The new operatorAdmin to set.
    */
    function initiateOperatorAdminUpdate(address newOperatorAdmin) onlyOperatorAdmin notZeroAddress(newOperatorAdmin) external {
        pendingActivationOperatorAdmin = newOperatorAdmin;
        emit OperatorAdminUpdateInitiated(operatorAdmin);
    }

    /**
     * Reject (delete) a pending operatorAdmin update. Can be called by the current operatorAdmin or the
     * new operator admin that the update would change the operatorAdmin to.
     */
    function rejectOperatorAdminUpdate() external {
        require (msg.sender == operatorAdmin || msg.sender == pendingActivationOperatorAdmin,
         "no permissions for operator admin upgrade rejection");
         require(pendingActivationOperatorAdmin != address(0), "no operator update to reject");

         // For event
         address temp = pendingActivationOperatorAdmin; 
         pendingActivationOperatorAdmin = address(0);
         emit OperatorAdminUpdateRejected(temp);
    }


    /**
     * Finalizes the pending operatorAdmin update. Only callable by the new operator admin as a form
     * of accepting the role and proving that the address set for the upgrade was correct.
     */
    function finalizeOperatorAdminUpdate() external {
        require(msg.sender == pendingActivationOperatorAdmin, 
        "only pending new operator admin can finalize update");

        operatorAdmin = pendingActivationOperatorAdmin;
        vaultStateChild.updateOperatorAdmin(pendingActivationOperatorAdmin);
        pendingActivationOperatorAdmin = address(0);
        emit OperatorAdminUpdateCompleted(operatorAdmin);
    }

    /**
     * Used by operatorAdmin to deposit collateral in the permitted ERC20 collateral token. The
     * operatorAdmin must have approved this SimpleBitcoinVault in the ERC20 contract previously to
     * allow a call to ERC20.transferFrom.
     *
     * Operator can deposit any amount of collateral any number of times, even to meet the initial
     * minimum collateral deposit requirement.
     *
     * Collateral can only be deposited when the vault is in its initial CREATED state, an
     * INITIALIZING state (meaning that some collateral has already been deposited, but the vault is
     * not live yet), or in the LIVE state as long as the vault is not winding down (meaning it will
     * be set to CLOSING_INIT soon).
     *
     * When an operator initiates the closure of the vault or the vault is undergoing a full
     * liquidation, additional collateral cannot be deposited.
     *
     * @param amount The amount (in atomic units) of collateral to deposit
    */
    function depositCollateral(uint256 amount) public onlyOperatorAdmin nonReentrant returns (bool success) {
        // Make sure that a new vault cannot be initialized with less collateral than the config
        // requires
        if (vaultStatus == Status.CREATED) {
            require(amount > vaultConfig.getMinCollateralAssetAmount(), 
            "when depositing collateral into a new vault, the initial deposit must be at least the minimum collateral asset amount");
        }

        require(vaultStatus == Status.CREATED || vaultStatus == Status.INITIALIZING || vaultStatus == Status.LIVE,
        "can only deposit collateral to a vault that is in a created, initializing, ready, or live status");

        require(!isWindingDown(), "cannot deposit collateral to a vault that is winding down");

        uint256 expectedBalance = vaultConfig.getPermittedCollateralAssetContract().balanceOf(address(this)) + amount;

        // Do not check for minimum collateral amount here - allow multiple independent deposits to
        // add up to the minimum collateral amount if needed for going live.
        bool depositSuccessful = vaultConfig.getPermittedCollateralAssetContract().transferFrom(msg.sender, address(this), amount);

        require(depositSuccessful, "collateral deposit to vault was not successful");

        require(expectedBalance == vaultConfig.getPermittedCollateralAssetContract().balanceOf(address(this)),
        "collateral asset balance did not increase as expected from the collateral deposit");

        uint256 totalCollateral = vaultStateChild.creditOperatorCollateralDeposit(amount);

        if (vaultStatus == Status.CREATED) {
            // Created status means no assets are locked up to secure the vault, so update to
            // INITIALIZING if in CREATED state
            vaultStatus = Status.INITIALIZING;

            // Set the min collateral amount upon initial deposit (not done at construction)
            // as that would allow operators to pre-stage many vaults with lower collateral
            // requirements before an upgrade that they don't use until later allowing them
            // to effectively bypass increased minimum collateral requirements for new vaults
            minCollateralAmount = vaultConfig.getMinCollateralAssetAmount();
            emit VaultInitializing();
        }

        emit CollateralDeposited(amount, totalCollateral);
        return true;
    }

    /**
     * Called by the operatorAdmin to set the BTC address that this vault will use for BTC
     * custodianship for its lifetime. Can only be set once, and is required before setting the
     * vault to live. 
     *
     * @param btcAddress The Bitcoin address which the vault will use for custodianship
    */
    function setBtcCustodianshipAddress(string memory btcAddress) external onlyOperatorAdmin {
        require(!bitcoinCustodyAddressSet, "btc custodianship address can only be set once");

        IBitcoinKit bitcoinKit = vaultConfig.getBitcoinKitContract();

        bytes memory script = bitcoinKit.getScriptForAddress(btcAddress);

        // 15 is somewhat arbitrary but smaller than all current or reasonable future address types
        require(script.length >= 15, "bitcoin address must convert to a redeem script that is at least 15 bytes");

        // Check to make sure address does not have any existing UTXOs
        UTXO[] memory utxos = bitcoinKit.getUTXOsForBitcoinAddress(btcAddress, 0, 1);
        require(utxos.length == 0, "btc custodianship address cannot have any utxos");

        bitcoinCustodyAddressScriptHash = keccak256(script);

        // If the script hash corresponding to the BTC custodianship address is already used,
        // this call will revert.
        vaultConfig.markBtcCustodianshipScriptHashUsed(bitcoinCustodyAddressScriptHash);

        bitcoinCustodyAddress = btcAddress;
        bitcoinCustodyAddressSet = true;
    }


    /**
     * Used by the operator to set the vault to LIVE. Requires that the minimum collateral deposit
     * is met and a BTC address for custodianship is set.
    */
    function goLive() external onlyOperatorAdmin {
        require(bitcoinCustodyAddressSet, "btc custodianship address must be set before going live");
        require(vaultStateChild.getOperatorCollateralDeposited() >= minCollateralAmount, 
        "deposited collateral must be >= minimum collateral requirement");

        // Must be INITIALIZING (and not further progressed)
        require(vaultStatus == Status.INITIALIZING, "vault must be initializing before going live");

        vaultStatus = Status.LIVE;
        emit VaultLive();
    }

    /**
     * Used to determine whether the vault has gone LIVE. This is used for determining whether
     * config changes that normally require an activation window can be performed instantly because
     * the vault has not yet gone live.
     *
     * Returns "true" if the vault has *never* gone live, false otherwise (whether currently live or
     * progressed to a future closing/closed state).
     *
     * @return Whether the vault has ever gone live
    */
    function hasNeverGoneLive() external view returns (bool) {
        return (vaultStatus == Status.CREATED || vaultStatus == Status.INITIALIZING);
    }

    /**
    * Returns the current status of the vault.
    *
    * @return status The status of the vault
    */
    function getStatus() external view returns (Status status) {
        return vaultStatus;
    }

    /**
     * The SimpleBitcoinVault does not require a deposit preconfirmation step.
     * 
     * @return requiresPreconfirmation False indicating the SimpleBitcoinVault does not require a deposit preconfirmation step
    */
    function requiresDepositPreconfirmation() external pure returns (bool requiresPreconfirmation) {
        return false;
    }

    /**
     * The SimpleBitcoinVault does not use preconfirmations, but implements as an immediate revert
     * to satisfy the IBitcoinVault interface. Variables not named as they are not used.
    */
    function preconfirmDeposit(bytes32, uint256, bytes memory) external pure returns (bool) {
        revert("preconfirmations not used for SimpleBitcoinVault");
    }

    /**
     * Begins the vault wind-down procedure, which will set the vault to CLOSING_INIT state after
     * the wind-down delay. After the vault is set to CLOSING_INIT, no new deposits can be
     * confirmed.
    */
    function windDownVault() external onlyOperatorAdmin {
        // When called externally, use current timestamp plus the wind down grace period
        windDownVaultImpl(block.timestamp + WIND_DOWN_DEPOSIT_GRACE_PERIOD);
    }

    /**
     * Implementation for winding down vault, separated out to allow the operator admin to trigger
     * any time, or internal functions to call this directly and bypass the operator check.
     * 
     * @param _windDownTime The timestamp at which the vault will be considered wound down
    */
    function windDownVaultImpl(uint256 _windDownTime) private {
        require(windDownTime == 0, "vault is already winding down");
        windDownTime = _windDownTime;
    }

    /**
     * Returns whether the vault is currently winding down. Returns true if vault is in the process
     * of winding down or has already been wound down.
     * 
     * @return windingDown Whether this vault is winding down.
    */
    function isWindingDown() public view returns (bool windingDown) {
        // If the global config indicates that this vault is deprecated, then it is
        // winding down even if the actual wind-down procedure has not been started
        // on this particular vault yet.
        if (vaultConfig.isVaultSystemDeprecated()) {
            return true;
        }

        // Otherwise, check whether a wind down time has been set
        return (windDownTime != 0);
    }

    /**
     * Finalizes a wind down after the wind down waiting period has elapsed by setting the vault to
     * Status.CLOSING_INIT. Callable by anyone.
    */
    function finalizeWindDown() external {
        require(isWindingDown(), "vault must be winding down to finalize");
        require(block.timestamp >= windDownTime, "wind down time has not passed");
        require(vaultStatus == Status.LIVE, "can only wind down a live vault");
        vaultStatus = Status.CLOSING_INIT;
        emit VaultClosingInit();
    }

    /**
     * If a vault has been fully liquidated, operator calls this function instead
     * of going through the regular wind-down process.
    */
    function closeVaultAfterFullLiquidation() external onlyOperatorAdmin {
        require(vaultStateChild.isFullLiquidationStarted(), "a full liquidation has not yet started");
        require(vaultStateChild.hasFullLiquidationDepositGracePeriodElapsed(), "the full liquidation deposit grace period is ongoing");
        require(vaultStateChild.getTotalDepositsHeld() == 0, "there are unliquidated net deposits held by the vault");

        // If the above conditions have been met, then this vault no longer holds, and will
        // never again hold, BTC on behalf of the protocol so it can be set directly to closed.
        vaultStatus = Status.CLOSED;
        returnAllCollateralToOperatorAdmin();
        emit VaultClosed();
    }

    /**
     * Returns all collateral deposited by the operator back to the operator.
     * Assumes caller has checked that the entire collateral can be withdrawn (all obligations
     * related to BTC held on behalf of the protocol have been fulfilled and vault is CLOSED).
    */
    function returnAllCollateralToOperatorAdmin() private {
        // Withdraw entire deposited balance, which also returns collateral tokens the operator sent to the
        // contract directly by accident for which the operator was not credited.
        uint256 balance = vaultConfig.getPermittedCollateralAssetContract().balanceOf(address(this));

        bool success = vaultConfig.getPermittedCollateralAssetContract().transfer(operatorAdmin, balance);
        if (!success) {
            revert("unable to return collateral to operator");
        }
    }


    /**
     * Normally a vault will transition from CLOSING_INIT to CLOSING_VERIF as part of a withdrawal
     * initiation that increases the total pending withdrawal amount to be equal to the total
     * deposits held (meaning that if all withdrawals are successfully processed, the vault will 
     * have no remaining BTC it is custoding on behalf of the protocol), however there are other
     * scenarios where a vault could have no deposits held without a withdrawal initialization
     * occurring which accounts for the remaining custodied BTC:
     * 1. Vault never accepts deposits during it's entire lifespan
     * 2. Vault operator voluntarily liquidates enough hBTC to zero out the vault's custodianship
     *
     * If either of these scenarios occurs, the operator can use this function to check
     * whether the vault is eligible to transition to the CLOSING_VERIF state and set it accordingly.
     */
    function enterClosingVerif() external onlyOperatorAdmin {
        require(vaultStatus == Status.CLOSING_INIT, "can only enter CLOSING_VERIF if in CLOSING_INIT");

        // Operator could optionally liquidate hBTC to lower total deposits held to make this check pass
        require(vaultStateChild.getPendingWithdrawalAmountSat() == vaultStateChild.getTotalDepositsHeld(),
        "pending withdrawals do not match total deposits held");

        vaultStatus = Status.CLOSING_VERIF;
        emit VaultClosingVerif();
    }

    /**
     * Finalizes a vault to CLOSED when there is no more BTC custodied by the vault. Returns any
     * remaining ERC20 collateral to the vault operator. 
     * 
     * Note that the operator could (and generally will) have pending fees that they have not minted
     * yet. If the tunnel system minted those as hBTC then the vault could not be closed as it would
     * still be custodying BTC on behalf of the system (backing the hBTC that the operator minted),
     * so instead just zero out the pending fees, and the operator owns them on BTC directly.
    */
    function closeVault() external onlyOperatorAdmin {
        require(vaultStatus == Status.CLOSING_VERIF, 
        "can only close a vault that is in CLOSING_VERIF state");

        require(vaultStateChild.getTotalDepositsHeld() == 0, 
        "can not close a vault until it has no deposits held");

        vaultStatus = Status.CLOSED;

        returnAllCollateralToOperatorAdmin();
        totalPendingFeesCollected = 0;
        emit VaultClosed();
    }

    /** 
     * Process an incoming deposit, returning whether the deposit was successful, the number of sats
     * to credit, and the recipient to credit them to. This function should only be called by the
     * BitcoinTunnelManager, who will mint the corresponding BTC tokens in response to the deposit
     * being confirmed.
     *
     * Can only be called by the tunnel admin (the BitcoinTunnelManager who has the authority to
     * mint hBTC based on what this vault returns), as anyone else calling this function would result
     * in the deposit being confirmed from the vault's perspective but the corresponding hBTC never
     * being minted for the depositor.
     *
     * @param txid The transaction ID of the deposit transaction on Bitcoin
     * @param outputIndex The index of the output in the transaction which constitutes the deposit
     * Note: The parameter extraInfo from the IBitcoinVault interface is not used.
     *
     * @return success Whether the deposit was successful (the depositor should be credited)
     * @return totalDepositSats The amount of sats that were deposited to the vault *before* fees are charged
     * @return netDepositSats The net amount of hBTC to credit the depositor with, is netDeposit minus charged fees
     * @return depositor The EVM address that should be credited for the deposit
    */
    function confirmDeposit(bytes32 txid, uint256 outputIndex, bytes memory) external onlyTunnelAdmin returns (bool success, uint256 totalDepositSats, uint256 netDepositSats, address depositor) {
        if (vaultStateChild.isFullLiquidationStarted()) {
            require(!vaultStateChild.hasFullLiquidationDepositGracePeriodElapsed(), 
            "vault liquidation grace period elapsed");
        }

        // Check if the global config indicates that this vault should be deprecated, and if so
        // start the wind down
        if (vaultConfig.isVaultSystemDeprecated() && windDownTime == 0) {
            windDownVaultImpl(vaultConfig.vaultSystemDeprecationTime() + WIND_DOWN_DEPOSIT_GRACE_PERIOD);
        }

        if (isWindingDown() && block.timestamp >= windDownTime) {
            // Special case if we're past the windDownTime but the vault has not been set to
            // CLOSING_INIT yet. Set to CLOSING_INIT and return a failed deposit.
            vaultStatus = Status.CLOSING_INIT;
            emit VaultClosingInit();
            return (false, 0, 0, address(0));
        }

        IBitcoinKit bitcoinKit = vaultConfig.getBitcoinKitContract();

        require(bitcoinKit.getTxConfirmations(txid) >= MIN_BITCOIN_CONFIRMATIONS, 
        "btc deposit is not confirmed");

        uint256 depositFeeSats = 0;

        (success, netDepositSats, depositFeeSats, depositor) = 
        utxoLogicHelper.checkDepositConfirmationValidity(txid, outputIndex, bitcoinKit, 
        bitcoinCustodyAddressScriptHash, vaultStateChild, MINIMUM_DEPOSIT_SATS);

        // Should never happen as our implementation always reverts rather than returning false, but
        // including to protect against future code updates to the checkDepositConfirmationValidity
        // function returning a failure boolean and it not being caught appropriately here.
        require(success, "deposit confirmation was not successful for an unspecified reason");

        totalDepositSats = netDepositSats + depositFeeSats;

        // Ensure that this deposit does not cause the vault to exceed its soft collateralization
        // threshold (even after the fees are collected in future).
        require(!vaultStateChild.doesDepositExceedSoftCollateralThreshold(totalDepositSats), 
        "deposit would exceed soft collateralization threshold");

        // Total deposits held on behalf of the protocol is increased by the amount after fees, but
        // operator does not get their portion of fees until they sweep (if required - see special
        // case where no sweep UTXO exists right below)
        vaultStateChild.increaseTotalDepositsHeld(netDepositSats);

        // If this is the first deposit or a previous withdrawal completely consumed previous sweep,
        // consider this deposit the current sweep UTXO rather than requiring a sweep. Normally
        // setting a confirmed-but-not-swept UTXO as the current sweep UTXO requires the operator,
        // but if it is not set before a new deposit is confirmed it can be safelty set here as
        // operators are not permitted to do actions (like creating a new sweep or withdrawal) on
        // Bitcoin when they process a withdrawal that does not output a sweep until they select a
        // confirmed-but-not-swept deposit UTXO to use as the sweep, so a deposit confirmation
        // setting a new sweep UTXO will not cause operator misbehavior if they are following the
        // protocol rules correctly.
        if (currentSweepUTXO == bytes32(0)) {
            currentSweepUTXO = txid;
            currentSweepUTXOOutput = outputIndex;
            currentSweepUTXOValue = totalDepositSats;

            // Since no Bitcoin sweep tx is required, operator gets entire fee amount immediately
            creditOperatorWithFees(depositFeeSats);
            depositFeeSats = 0;
        }

        // Record that the deposit has been acknowledged
        vaultStateChild.acknowledgeDeposit(txid, outputIndex, depositFeeSats);

        return (true, totalDepositSats, netDepositSats, depositor);
    }

    /**
     * Used whenever an operator performs an action (sweep or withdrawal finalization) which credits
     * fees to the operator.
     *
     * If the operator is currently running a deficit that could lead to a partial liquidation that
     * has not yet been triggered, this credit function will decrease the deficit before crediting
     * the operator's pending fees.
     *
     * While a partial liquidation opportunity will likely be taken quickly by arbitrage seekers
     * (and that is the intended design, to always prioritize vault solvency), small deficits may
     * occur which are not worth arbitragers liquidating, and this mechanic provides a simple way
     * for regular vault operation to wipe out these dust liquidations in a way that also favors
     * operators.
     *
     * @param fees The fees to be credited to the operator
    */
    function creditOperatorWithFees(uint256 fees) private {
        uint256 remaining = vaultStateChild.processCollectedFeesToDecrementPartialPendingLiquidation(fees);
        totalPendingFeesCollected = totalPendingFeesCollected + remaining;
    }

    /**
     * The SimpleBitcoinVault permits its operators to mint collected fees as hBTC.
     *
     * Only callable by the tunnelAdmin (the BitcoinTunnelManager that created and owns this vault),
     * which passes in the originating caller to ensure that the original call was initiated by the
     * operator admin.
     * 
     * @param operator The address of the operator to process a collected fee mintage for (passed through)
     * @param amountToMint The amount of collected fees to mint
    */
    function mintOperatorFees(address operator, uint256 amountToMint) external onlyOperatorAdminPassthrough(operator) returns (bool success, uint256 sats) {
        if (vaultStatus == Status.CLOSED) {
            // Special case, when the vault is closed allow the operator to mint any remaining
            // full liquidation reserves that weren't consumed handling new deposits during the
            // grace period
            uint256 reserves = vaultStateChild.getFullLiquidationOperatorReserves();
            if (reserves > 0) {
                vaultStateChild.saveFullLiquidationOperatorReservesReminted();
                return (true, reserves);
            }
        }

        require(totalPendingFeesCollected > 0, "there must be a non-zero number of pending fees to mint operator fees");

        require(amountToMint <= totalPendingFeesCollected, "cannot mint more operator fees than have been collected");

        // Only permitted when the vault is live, otherwise vault is closing and operator will instead collect fees by owning
        // them directly on Bitcoin.
        require(vaultStatus == Status.LIVE, "can only mint fees on a vault that is live");

        // Because these fees were minted as hBTC, this vault now holds the equivalent BTC on behalf of the protocol.
        vaultStateChild.increaseTotalDepositsHeld(amountToMint);

        // Subtract minted fees from the pending fees that are collected but unminted
        totalPendingFeesCollected = totalPendingFeesCollected - amountToMint;
        return (true, amountToMint);
    }


    /**
     * Initiates a withdrawal from the vault which must be sent to the specified destinationScript.
     * The SimpleBitcoinVault will calculate the fee charged on the withdrawal based on either the
     * minimum withdrawal fee or the bps withdrawal fee, whichever is higher.
     *
     * The amount of the withdrawal minus the withdrawal fee (as calculated based on the settings of
     * the vault operator) is the exact amount in satoshis that will actually be paid to the
     * specified destination script.
    *
    * @param destinationScript The unlocking script that the withdrawn BTC must be sent to
    * @param amountSats The number of sats withdrawn (BTC representative token burnt) by the withdrawer
    *        (the amount actually paid to the specified destination script will be this value
    *        minus the calculated fees).
    * @param originator The originator EVM address of the withdrawal
    *
    * @return success Whether the withdrawal *initialization* was successful
    * @return feeSats The fee charged in sats on the withdrawal
    * @return uuid A unique UUID that will be used to manage the withdrawal through its lifecycle.
    */
    function initiateWithdrawal(bytes memory destinationScript, uint256 amountSats, address originator) external onlyTunnelAdmin returns (bool success, uint256 feeSats, uint32 uuid) {
        require(amountSats <= getNetDeposits(), 
        "withdrawal exceeds net deposits");

        require(amountSats >= MINIMUM_WITHDRAWAL_SATS, 
        "withdrawal is lower than minimum");

        require(destinationScript.length >= MIN_VALID_BTC_SCRIPT_SIZE, 
        "withdrawal destination script to small");

        require(destinationScript.length <= MAX_VALID_BTC_SCRIPT_SIZE, 
        "withdrawal destination script too large");

        require(vaultStatus == Status.LIVE || vaultStatus == Status.CLOSING_INIT, 
        "can only process a withdrawal on a live or closing_init vault");

        require(!vaultStateChild.isFullLiquidationStarted(), 
        "vault is being fully liquidated and cannot accept withdrawals");

        require(keccak256(destinationScript) != bitcoinCustodyAddressScriptHash, 
        "cannot initiate a withdrawal to this vault's address");

        uint256 depositsHeld = vaultStateChild.getTotalDepositsHeld();

        uint256 pendingWithdrawalAmount = vaultStateChild.getPendingWithdrawalAmountSat();

        require(pendingWithdrawalAmount + amountSats <= depositsHeld, 
        "cannot withdraw more sats than vault holds");

        uint256 withdrawalFeeSats = vaultStateChild.calculateWithdrawalFee(amountSats);

        uint256 pendingWithdrawalAmountAfterWithdrawal = 0;

        (uuid, pendingWithdrawalAmountAfterWithdrawal) = vaultStateChild.internalInitializeWithdrawal(
            amountSats, withdrawalFeeSats, block.timestamp, destinationScript, originator);

        if (vaultStatus == Status.CLOSING_INIT) {
            // If the vault is in closing mode, make sure that a withdrawal doesn't lower the
            // available withdrawal to below the MINIMUM_WITHDRAWAL_SATS threshold without fully
            // zeroing it out
            uint256 availableAfter = depositsHeld - (pendingWithdrawalAmount + amountSats);
            if (availableAfter < MINIMUM_WITHDRAWAL_SATS) {
                require(availableAfter == 0,
                "withdrawal would leave vault balance below the minimum withdrawal threshold");
            }

            // If the vault is in closing mode and the pending withdrawal amount is equal to the remaining
            // BTC custodied after all other pending withdrawals are processed, transition to CLOSING_VERIF
            // which will stay in force until all pending withdrawals are processed.
            if (pendingWithdrawalAmountAfterWithdrawal == depositsHeld) {
                vaultStatus = Status.CLOSING_VERIF;
                emit VaultClosingVerif();
            }
        }

        return (true, withdrawalFeeSats, uuid);
    }

    /**
     * Finalizes a withdrawal by proving to the vault that the withdrawal was processed properly.
     * All sweeps and withdrawals must be processed in the order they occurred on Bitcoin, because
     * it is possible to call this function with a valid withdrawal txid that can't be confirmed
     * because the vault's knowledge about the correct main sweep UTXO at the time of the withdrawal
     * being processed is not correct.
     * 
     * Anyone can call this function, so that an external party identifying operator misbehavior can
     * process valid withdrawal finalizations required to set the appropriate sweep to prove
     * misbehavior against. During normal operation, it is expected but not required that the
     * operator will be the only EOA interacting with this function, and operators may choose to
     * have a different address they control manage finalizations for security separation purposes
     * if desired.
     *
     * Withdrawal transactions must be as follows:
     *   - Only spends the main UTXO (no other inputs)
     *   - First output is the withdrawal
     *   - Second output is back to the vault (unless withdrawal spends UTXO entirely)
     *   - No other outputs exist
     *
     * @param txid The TxID of the Bitcoin transaction which is claimed by the operator to fulfill the withdrawal
     * @param withdrawalIndex The index of the withdrawal the operator claims this TxID fulfills
     *
     * @return success Whether or not the withdrawal was finalized correctly
    */
    function finalizeWithdrawal(bytes32 txid, uint32 withdrawalIndex) external returns (bool success) {
        require(!vaultStateChild.isWithdrawalFulfilled(withdrawalIndex), 
        "withdrawal must not already be mapped to a fulfilling txid");

        require(!vaultStateChild.isTransactionAcknowledgedWithdrawalFulfillment(txid), 
        "transaction was already finalized");

        IBitcoinKit bitcoinKit = vaultConfig.getBitcoinKitContract();

        require(bitcoinKit.getTxConfirmations(txid) >= MIN_BITCOIN_CONFIRMATIONS,
         "btc withdrawal not confirmed");

        (uint256 feesOverpaid, uint256 feesCollected, uint256 withdrawalAmount, 
        bool createdOutput, uint256 newSweepUTXOValue) =
        utxoLogicHelper.checkWithdrawalFinalizationValidity(txid, withdrawalIndex, bitcoinKit, 
        bitcoinCustodyAddressScriptHash, currentSweepUTXO, currentSweepUTXOOutput, vaultStateChild);


        if (feesOverpaid > 0) {
            // If more btc fees were paid than were collected, first try to deduct excess fees from
            // the operator's uncollected pending fees
            if (feesOverpaid <= totalPendingFeesCollected) {
                // Operator has collected enough pending fees to fully absorb the overpayment
                totalPendingFeesCollected = totalPendingFeesCollected - feesOverpaid;
                feesOverpaid = 0;
            } else {
                // Operator does not have enough pending fees collected to fully absorb the
                // overpayment
                uint256 temp = totalPendingFeesCollected;

                // Zero out whatever fees the operator does have
                totalPendingFeesCollected = 0;

                // Credit remainder of the not-absorbed overpayment as a pending partial liquidation
                vaultStateChild.creditPartialPendingLiquidationSats(feesOverpaid - temp);
            }
        } else {
            // feesOverpaid = 0 meaning feesCollected is > 0, so credit them to the operator. If
            // there is a nonzero number of sats pending a partial liquidation, this function will
            // subtract these fees from the partial liquidation before crediting the remainder (if
            // any) to the operator as collected fees.
            creditOperatorWithFees(feesCollected);
        }


        // Set the new sweep UTXO - will either be output 1 of this tx or an empty output if there
        // was no change sent back to this vault when processing the withdrawal
        if (createdOutput) {
            currentSweepUTXO = txid;
            currentSweepUTXOOutput = 1;
            currentSweepUTXOValue = newSweepUTXOValue;
        } else {
            currentSweepUTXO = bytes32(0);
            currentSweepUTXOOutput = 0;
            currentSweepUTXOValue = 0;
        }


        // Save the withdrawal TxId
        vaultStateChild.saveWithdrawalFulfillment(withdrawalIndex, txid, withdrawalAmount);
        return true;
    }

    /**
     * Under normal operation, the first confirmed deposit is automatically set as the sweep UTXO.
     * When additional deposits occur, they are swept together with the original sweep UTXO to
     * create subsequent sweep UTXOs. Withdrawals spend the sweep UTXO and create a new sweep UTXO.
     * 
     * Only callable by the operator, so that the operator can select the UTXO to use as the new
     * sweep UTXO which makes the most economic sense.
     *
     * In the rare event that an operator consumes the full sweep UTXO to process a withdrawal, the
     * next deposit which is confirmed would automatically be set as the sweep UTXO.
     *
     * However, an edge case can occur because anyone can call the confirmDeposit function via the
     * BitcoinTunnelManager, meaning an operator could process a withdrawal on BTC that spends the
     * entire sweep UTXO, and then a user could confirm a deposit before the operator finalizes the
     * withdrawal on Hemi. As a result, the deposit confirmation would not set the sweep UTXO to the
     * deposit because the vault believes the sweep UTXO is unspent due to out-of-date information,
     * but upon finalizing the withdrawal the vault would have no UTXO, and calling the normal
     * processSweep function would not work because it assumes the existence of a sweep UTXO as the
     * first input.
     *
     * Rather than handle this edge-case in the processSweep function which would introduce
     * unnecessary complexity/gas costs in the standard case, operators can call this function to
     * set one of the confirmed but unswept deposits as the sweep UTXO.
     *
     * Additionally, when the sweep UTXO only contains a dust amount which is lower than the BTC
     * fees required to consume it as an input in a sweep transaction, the operator can use this
     * function with abandonExistingUTXO=true to abandon the current sweep UTXO (subtracting the
     * abandoned UTXO's value from the operator's collected fees and allowing a partial liquidation
     * to recover additional fees if required). While abandoning a UTXO costs the operator, in some
     * cases it may be cheaper to abandon the UTXO than pay the fees required to spend it which also
     * comes out of the operator's revenue.
     *
     * If there is a sweep UTXO set, it cannot be abandoned unless there is a valid unswept
     * confirmed deposit UTXO to use.
     *
     * @param depositTxId The transaction ID of the unswept confirmed deposit to count as the sweep UTXO
     * @param abandonExistingUTXO Whether to forcibly abandon an existing sweep UTXO and charge the operator for the abandoned value.
    */
    function assignConfirmedDepositAsSweep(bytes32 depositTxId, bool abandonExistingUTXO) external onlyOperatorAdmin {
        uint256 depositFee = vaultStateChild.getCollectableFees(depositTxId);

        // depositFee is only non-zero for a txid after a deposit is confirmed and before it is swept
        require(depositFee > 0, "deposit txid either not confirmed or already swept");

        if (currentSweepUTXO != bytes32(0)) {
            // There is already a sweep UTXO set, so only replace it if abandoning is allowed.
            require(abandonExistingUTXO, 
            "sweep utxo exists and abandoning not permitted");

            uint256 abandonedUTXOValue = currentSweepUTXOValue;
            if (abandonedUTXOValue <= totalPendingFeesCollected) {
                totalPendingFeesCollected = totalPendingFeesCollected - abandonedUTXOValue;
            } else {
                // Subtract as much as possible from the pending operator fees, then satisfy the remainder with a partial liquidation
                uint256 temp = totalPendingFeesCollected;
                totalPendingFeesCollected = 0;
                vaultStateChild.creditPartialPendingLiquidationSats(abandonedUTXOValue - temp);
            }
        }

        IBitcoinKit bitcoinKit = vaultConfig.getBitcoinKitContract();

        // Get the actual deposit transaction from Bitcoin based on the txid so we can recover output value
        Transaction memory btcTx = bitcoinKit.getTransactionByTxId(depositTxId);

        // Do not have to check if outputIndex is within transaction bounds as this check was already
        // performed on deposit confirmation.
        currentSweepUTXO = depositTxId;
        currentSweepUTXOOutput = vaultStateChild.getDepositOutputIndex(depositTxId);
        currentSweepUTXOValue = btcTx.outputs[currentSweepUTXOOutput].outValue;

        // Credit operator with the full fees of the confirmed deposit as no sweep fee is required.
        // If a UTXO was abandoned, its value has already been accounted for above and if it resulted
        // in a pending partial liquidation that the collection of the deposit fees will cover, this
        // function will handle that.
        creditOperatorWithFees(depositFee);

        // Same as a regular sweep, set the fees to zero to indicate they have been collected
        vaultStateChild.saveFeesCollected(depositTxId);
    }

    /**
     * Processes a sweep transaction, which must consume the current sweep UTXO as the first input,
     * and can spend up to seven additional un-sweeped deposits as additional inputs to create a
     * single output which becomes the new sweep UTXO.
     * 
     * Callable by anyone so that someone who wants to report a vault's misbehavior has the ability
     * to process any valid sweeps the operator has performed on Bitcoin that the protocol is not
     * yet aware of to update knowledge of the current sweep UTXO to the correct one to prove future
     * misbehavior against.
     * 
     * If the operator has performed multiple sweeps which all need to be communicated to the
     * protocol, then these sweeps must be processed one-at-a-time in their native dependency order.
     * Additionally, withdrawals also affect the protocol's sweep UTXO knowledge, so withdrawals
     * must also be processed in their overall native dependency order along with sweeps.
     *
     * There is a possible edge case where a vault holding unswept confirmed deposits can have no
     * active sweep UTXO. If that occurs, the operator should call the
     * assignConfirmedDepositAsSweep() function first, and then process a sweep of other confirmed
     * but unswept deposits with this function if needed.
     * 
     * The fact that only the operator can call assignConfirmedDepositAsSweep() is fine, as the only
     * time anyone other than the operator would need to call this processSweep() function is if they
     * are trying to prove misbehavior, and if there is a sweep that depends on assigning a confirmed
     * deposit as a sweep, the reporter will be able to fully liquidate the vault by challenging the
     * sweep as an invalid spend of a confirmed deposit, since there will be no transaction dependency
     * path that function will find linking the invalid sweep to the current sweep UTXO.
     *
     * @param sweepTxId The transaction ID of the sweep transaction to process
    */
    function processSweep(bytes32 sweepTxId) external {
        IBitcoinKit bitcoinKit = vaultConfig.getBitcoinKitContract();

        (int256 sweptValue, uint256 netDepositValue, uint256 newSweepOutputValue, bytes32[] memory sweptDeposits) =
        utxoLogicHelper.checkSweepValidity(sweepTxId, bitcoinKit, bitcoinCustodyAddressScriptHash,
        currentSweepUTXO, currentSweepUTXOOutput, vaultStateChild);

        require(bitcoinKit.getTxConfirmations(sweepTxId) >= MIN_BITCOIN_CONFIRMATIONS,
         "btc sweep tx not confirmed");

        // Save fees collected for all consumed inputs, not done in checkSweepValidity so that
        // function doesn't mutate state (as it does not have permissions to call the
        // saveFeesCollected() function)
        for (uint32 idx = 0; idx < sweptDeposits.length; idx++) {
            // Mark the deposit as swept by setting the fees to zero
            vaultStateChild.saveFeesCollected(sweptDeposits[idx]);
        }


        // If the sweptValue is less than the netDepositValue, then the operator had to spend more
        // BTC fees than they charged users for, so try to take it out of the operator's collected
        // fees. If there are not enough collected fees to cover, then start a partial liquidation.
        if (sweptValue < int256(netDepositValue)) {
            // If sweptValue is negative, then it indicates that the output of the sweep was less
            // than the consumed sweep input, and this math will account for this difference.
            // For example if netDepositValue = 1000 sats and sweptValue = -100 (output was 100 sats
            // less than original sweep input), then (1000 - (-100)) = 1100 which is the net difference
            // we must make up for through taking fees and/or allowing a partial pending liquidation.
            uint256 diff = uint256(int256(netDepositValue) - sweptValue);
            if (diff <= totalPendingFeesCollected) {
                totalPendingFeesCollected = totalPendingFeesCollected - diff;
            } else {
                diff = diff - totalPendingFeesCollected;
                totalPendingFeesCollected = 0;

                // Remaining diff needs to be liquidated
                vaultStateChild.creditPartialPendingLiquidationSats(diff);
            }
        } else {
            // If the sweptValue is more than netDepositValue, then the difference is the operator's
            // collected fees (Bitcoin transaction fee already removed by sweptValue being
            // calculated from the actual output value).
            // Here sweptValue must always be positive as it was not less than netDepositValue which
            // is a uint256, so conversion is safe.
            creditOperatorWithFees(uint256(sweptValue) - netDepositValue);
        }

        currentSweepUTXO = sweepTxId;
        currentSweepUTXOOutput = 0; // Always zero as sweep tx only has one output which is the sweep output
        currentSweepUTXOValue = newSweepOutputValue;
    }


    /**
     * Gets the net deposits of this vault, which is the total deposits held minus all pending
     * withdrawals.
     * 
     * @return The net deposits of the vault in sats
    */
    function getNetDeposits() public view returns (uint256) {
        return vaultStateChild.getTotalDepositsHeld() - vaultStateChild.getPendingWithdrawalAmountSat();
    }

    /**
     * Challenges a withdrawal, used by a withdrawer (via the BitcoinTunnel) to indicate that a
     * withdrawal was not processed by the vault as expected. If the challenge is successful (the
     * vault agrees that the withdrawal has not been processed as expected), it will return the
     * number of sats to credit back to the harmed withdrawer along with the withdrawer address
     * these sats should be credited back to.
     * 
     * Only callable by the tunnel admin because if the challenge is successful, the Bitcoin Tunnel
     * Manager needs to re-mint the corresponding hBTC for the user who did not receive their
     * withdrawal.
     *
     * For SimpleBitcoinVault, a withdrawal can be challenged successfully if more than the
     * withdrawal grace period has elapsed and the operator has not proven that the withdrawal has
     * been fulfilled.
     *
     * @param uuid The uuid of the withdrawal to be challenged
     * Note: The parameter extraInfo from the IBitcoinVault interface is not used.
     *
     * @return success Whether the challenge was successful (the vault did misbehave)
     * @return satsToCredit How many sats the harmed withdrawer should be re-credited with
     * @return withdrawer The EVM address of the harmed withdrawer who the satsToCredit should be credited to
    */
    function challengeWithdrawal(uint32 uuid, bytes memory) external onlyTunnelAdmin returns (bool success, uint256 satsToCredit, address withdrawer) {
        Withdrawal memory withdrawal = vaultStateChild.getWithdrawal(uuid);

        require(!vaultStateChild.isWithdrawalFulfilled(uuid), "withdrawal was successfully processed");
        require(vaultStateChild.isWithdrawalAlreadyChallenged(uuid), "withdrawal has already been challenged");

        if (block.timestamp < withdrawal.timestampRequested + WITHDRAWAL_GRACE_PERIOD_SECONDS) {
            revert("the withdrawal grace period has not elapsed");
        }

        // The withdrawal has not been fulfilled and the time has elapsed, so sender should be
        // credited with hBTC and the vault needs to enter a full liquidation. Do not need to check
        // if a full liquidation is already allowed or in progress as it is a one-time latch.
        vaultStateChild.setFullCollateralLiquidationAllowed();
        vaultStateChild.saveSuccessfulWithdrawalChallenge(uuid);
        return (true, withdrawal.amount, withdrawal.evmOriginator);
    }

    /**
     * Reports misbehavior of a vault operator creating an unauthorized transaction that spends the
     * sweep UTXO. 
     * 
     * Callable by anyone so anyone can report an invalid sweep UTXO spend and enable this vault to
     * be fully liquidated.
     * 
     * The only valid reasons an operator has for spending the sweep UTXO are:
     *   1. Processing a sweep to create a new sweep UTXO
     *   2. Processing a withdrawal
     * 
     * To constitute an invalid sweep spend, the transaction MUST:
     *   1. Not be a transaction which was already identified as valid withdrawal fulfillment
     *   2. Spend the main sweep UTXO *as currently known*
     *   3. Send funds in a way which does not align with any pending withdrawal
     *   4. Send funds in a way which does not align with any potential valid sweep
     * 
     * The current main sweep UTXO is maintained by this contract based on deposits (which are swept
     * with the existing UTXO to create a new main sweep UTXO) and withdrawals which spend the main
     * UTXO and create a new main UTXO with the change.
     * 
     * @param txid The TxID of the Bitcoin transaction which contains the invalid sweep UTXO spend
     * @param inputIndexToBlame The index of the input which performs the invalid sweep UTXO spend
     * 
     * @return success Whether or not the TxID was determined to prove an improper outgoing transaction and the vault can be liquidated
     */
    function reportInvalidSweepSpend(bytes32 txid, uint32 inputIndexToBlame) external returns (bool success) {
        require(vaultStatus != Status.CLOSED, "vault is closed");

        require(!vaultStateChild.isFullCollateralLiquidationAllowed(), 
        "a full liquidation is already allowed");

        // Make sure this txid hasn't already been acknowledged as a valid withdrawal fulfillment
        require(!vaultStateChild.isTransactionAcknowledgedWithdrawalFulfillment(txid), 
        "transaction was accepted as valid withdrawal");

        // We do not check for confirmations as any transaction which is invalid leads to liquidation
        // even if it is later reorged out of the Bitcoin chain, because the operator misbehaved for it
        // to be there originally.

        IBitcoinKit bitcoinKit = vaultConfig.getBitcoinKitContract();

        bool isInvalid = utxoLogicHelper.checkSweepSpendInvalidity(txid, inputIndexToBlame, bitcoinKit, 
        bitcoinCustodyAddressScriptHash, currentSweepUTXO, currentSweepUTXOOutput, vaultStateChild);

        if (isInvalid) {
                vaultStateChild.setFullCollateralLiquidationAllowed();
        }
        return isInvalid;
    }

    /**
     * Reports that a confirmed deposit UTXO that has not yet been swept was spent in an
     * unauthorized way (not a valid sweep).
     *
     * Callable by anyone so anyone can report an invalid deposit spend and enable this vault to be
     * fully liquidated.
     *
     * The only valid reason an operator has for spending a confirmed deposit UTXO is to sweep it,
     * so if the transaction does not meet the validity rules for a sweep, it is invalid.
     *
     * If the transaction does meet the validity rules but it does not directly spend the current
     * sweep UTXO, walk backwards to attempt to find a connection through plausible withdrawals
     * and/or sweeps that connects it. If no connection exists or cannot be found within 10
     * transaction hops, the transaction is considered invalid and the vault is liquidated as the
     * operator has misbehaved.
     * 
     * @param txid The TxID of the Bitcoin transaction which contains the invalid confirmed deposit UTXO spend
     * @param inputIndexToBlame The index of the input which performs the invalid confirmed deposit UTXO spend
     */
    function reportInvalidConfirmedDepositSpend(bytes32 txid, uint32 inputIndexToBlame) external returns (bool success) {
        require(vaultStatus != Status.CLOSED, "vault is closed");

        require(!vaultStateChild.isFullCollateralLiquidationAllowed(), 
        "a full liquidation is already allowed");

        // We do not check for confirmations as any transaction which is invalid leads to
        // liquidation even if it is later reorged out of the Bitcoin chain, because the operator
        // misbehaved for it to be there originally.

        IBitcoinKit bitcoinKit = vaultConfig.getBitcoinKitContract();

        bool isInvalid = utxoLogicHelper.checkConfirmedDepositSpendInvalidity(txid, inputIndexToBlame, bitcoinKit,
        bitcoinCustodyAddressScriptHash, currentSweepUTXO, currentSweepUTXOOutput, vaultStateChild);

        if (isInvalid) {
            vaultStateChild.setFullCollateralLiquidationAllowed();
        }
        return isInvalid;
    }


    /**
     * Returns whether the vault is currently accepting deposits.
     * 
     * For a SimpleBitcoinVault, deposits are always accepted if the vault is live.
     * 
     * This function does not check whether a deposit (of any size) is possible based on current
     * collateral, only whether the status of the vault is such that deposits will be accepted *if*
     * collateral is below the soft collateralization threshold for a particular deposit at the time
     * of confirmation.
     *
     * @return acceptingDeposits Whether the vault is currently accepting deposits.
    */
    function isAcceptingDeposits() external view returns (bool acceptingDeposits) {
        return vaultStatus == Status.LIVE;
    }

    /**
     * Returns whether the vault is currently capable of processing another withdrawal. This
     * function returning true means that *some* withdrawal is possible, but does not guarantee that
     * a withdrawal of any particular size will be accepted.
     *
     * @return withdrawalAvailable Whether any withdrawal is currently possible
    */
    function isWithdrawalAvailable() external view returns (bool withdrawalAvailable) {
        if (vaultStatus == Status.LIVE || vaultStatus == Status.CLOSING_INIT) {
            uint256 available = getNetDeposits();
            if (available >= MINIMUM_WITHDRAWAL_SATS) {
                return true;
            }
            return false;
        }
        return false;
    }

    /**
     * Returns the lower and upper bounds of withdrawal amounts the vault will accept.
     *
     * @return minWithdrawal The minimum amount in satoshis of a withdrawal the vault will currently accept
     * @return maxWithdrawal The maximum amount in satoshis of a withdrawal the vault will currently accept
    */
    function getWithdrawalLimits() external view returns (uint256 minWithdrawal, uint256 maxWithdrawal) {
        uint256 available = getNetDeposits();
        if (available >= MINIMUM_WITHDRAWAL_SATS) {
            return (MINIMUM_WITHDRAWAL_SATS, available);
        } else {
            return (0, 0);
        }
    }

    /**
     * Burns the specified quantity of hBTC held by this contract.
     * 
     * When the SimpleBitcoinVaultState child performs a partial or full liquidation, it transfers
     * the hBTC to this vault and then calls this burnLiquidatedBTC function to perform the actual
     * burning logic, since the BitcoinTunnelManager only allows the vaults themselves to burn their
     * own held hBTC.
     * 
     * Only callable by this vault's own state child.
     * 
     * @param amountSats The amount of hBTC which was transferred to this contract and should be burned
    */
    function burnLiquidatedBTC(uint256 amountSats) external onlyStateChild {
        BitcoinTunnelManager mgr = BitcoinTunnelManager(tunnelAdmin);
        mgr.burnLiquidatedBTC(amountSats);
    }

    /**
     * Transfers some of the operator's collateral to the specified recipient.
     * 
     * Only callable by this vault's own state child.
     * 
     * @param recipient The address to receive the collateral
     * @param amount The amount of collateral in atomic units to send to the recipient
    */
    function transferCollateralForChild(address recipient, uint256 amount) external onlyStateChild returns (bool success) {
        success = vaultConfig.getPermittedCollateralAssetContract().transfer(recipient, amount);
        return success;
    }
}