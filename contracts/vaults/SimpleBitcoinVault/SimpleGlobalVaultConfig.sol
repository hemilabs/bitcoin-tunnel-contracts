// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "../IGlobalVaultConfig.sol";
import "../../bitcoinkit/IBitcoinKit.sol";
import "../../bitcoinkit/BitcoinKit.sol";
import "../../oracles/IAssetPriceOracle.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
* The SimpleGlobalVaultConfig contract serves to hold all of the configuration settings
* that should be applied globally across all instances of a SimpleBitcoinVault.
* 
* The SimpleGlobalVaultConfig should be defined at initialization for the IVaultFactory implementation
* which is responsible for creating SimpleBitcoinVaults.
* 
* The SimpleGlobalVaultConfig's values can be updated by specific roles, allowing granular
* control over various configuration options, providing flexible governance of specific
* values. For example, it may be desirable for a specific contract to update the
* MAX_FEE_SAT_VB value based on BTC fee observations, and another contract controlled by
* an external governance mechanism that determines the min/max fees that a Vault Operator
* can set.
*
* The SimpleGlobalVaultConfig does not permit delegation of permission updates;
* only the configAdmin can update the address of other admins.
* 
* It is up to the SimpleBitcoinVault implementation itself to properly consult the this contract
* for appropriate configuration.
*
* Some values are only set at initial construction and cannot be changed.
*/
contract SimpleGlobalVaultConfig is IGlobalVaultConfig {
    event ConfigAdminUpdateCompleted(address indexed newConfigAdmin);
    event PriceOracleImplementationUpdated(address indexed newPriceOracle);
    event BitcoinKitUpgradesPermDisabled(address indexed currentBitcoinKit);
    event MinCollateralAssetAmountUpdated(uint256 oldMinCollateralAssetAmount, uint256 newMinCollateralAssetAmount);

    /**
    * The onlyConfigAdmin modifier is used on all functions that should
    * *only* be callable by the configAdmin.
    */
    modifier onlyConfigAdmin() {
        require(msg.sender == configAdmin);
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

    /**
    * The senderPermissionCheck modifier is used on all functions that should
    * be callable by either the configAdmin *or* a specific address.
    * 
    * It is used by passing in the other specific address which is permitted.
    */
    modifier senderPermissionCheck(address permittedAddr) {
        require(msg.sender == configAdmin || msg.sender == permittedAddr);
        _;
    }

    /**
    * The feeWithinBounds modifier is used on all functions that accept
    * an argument which is a fee. For SimpleGlobalVaultConfig the maximum
    * permitted fee is 10%, or 1000 basis points.
    */
    modifier feeWithinBounds(uint256 fee) {
        require (fee <= 10 * 100);
        _;
    }

    // The minimum deposit fee (in sats) that a vault can charge.
    uint256 public minDepositFeeSats;

    // The maximum deposit fee (in sats) that a vault can charge.
    uint256 public maxDepositFeeSats;

    // The minimum withdrawal fee (in sats) that a vault can charge.
    uint256 public minWithdrawalFeeSats;

    // The maximum withdrawal fee (in sats) that a vault can charge.
    uint256 public maxWithdrawalFeeSats;

    // The minimum deposit fee (in basis points) that a vault can charge.
    // For example, "10" means a minimum deposit fee of 0.10%
    uint256 public minDepositFeeBasisPoints;

    // The maximum deposit fee (in basis points) that a vault can charge.
    // For example, "20" means a maximum deposit fee of 0.20%
    uint256 public maxDepositFeeBasisPoints;

    // The minimum withdrawal fee (in basis points) that a vault can charge.
    // For example, "10" means a minimum withdrawal fee of 0.10%.
    uint256 public minWithdrawalFeeBasisPoints;

    // The maximum withdrawal fee (in basis points) that a vault can charge.
    // For example, "20" means a maximum withdrawal fee of 0.20%.
    uint256 public maxWithdrawalFeeBasisPoints;

    // A one-time latch that only configAdmin can set to permanently disable future
    // updates to the IBitcoinKit implementation.
    IBitcoinKit public bitcoinKitContract;

    // Permanently disable upgrading of Bitcoin Kit implementation
    bool public bitcoinKitUpgradePermDisabled;

    // The ERC20 contract which is permitted to act as collateral for SimpleBitcoinVaults.
    // This cannot be updated after initialization.
    ERC20 public permittedCollateralAssetContract;

    // The oracle which vaults will use to determine the value of the
    // permittedCollateralAssetContract relative to BTC.
    IAssetPriceOracle public priceOracle;

    // Whether the vault implementation that consults this global config is deprecated.
    bool public vaultSystemDeprecated;

    // The timestamp when the vault implementation that consults this global config was
    // deprecated, used to implement a delay between deprecation and blocking deposits.
    uint256 public vaultSystemDeprecationTime;

    // The minimum amount of permittedCollateralAssetContract atomic units to setup
    // a vault.
    uint256 public minCollateralAssetAmount;

    // The soft (over)collateralization threshold, above which deposits can
    // not be made and are instead returned. Interpreted as a percentage multiplier;
    // for example a value of 140 means that a for a deposit to be accepted, the
    // total value of BTC custodied by the vault after the deposit multiplied by 140%
    // must be less than or equal to the value of the collateral.
    // Value is set once at construction and cannot be updated.
    uint256 public softCollateralizationThreshold;

    // The hard (over)collateralization threshold, above which a vault is subject
    // to liquidation. Interpreted as a percentage multiplier; for example a value
    // of 110 means that if the value of BTC custodied by the vault falls below
    // 110% of the value of the collateral, the vault is subject to liquidation.
    // Value is set once at construction and cannot be updated.
    uint256 public hardCollateralizationThreshold;

    // The configAdmin can update permissions for who can update all other config values,
    // and can also update any config value themselves.
    address public configAdmin;

    // The address able to update the IAssetPriceOracle implementation used
    address public oracleImplementationAdmin;

    // The ability to adjust each min/max of deposit/withdrawal is broken up
    // to be granular as it may be desirable to have a different mechanism
    // for updating minimum fees (which guarantee some minimum revenue to operators)
    // versus maximum fees (which could be used to overcharge users).

    // The address able to update the minDepositFeeBasisPoints value.
    address public minDepositFeeAdmin;

    // The address able to update the maxDepositFeeBasisPoints value.
    address public maxDepositFeeAdmin;

    // The address able to update the minWithdrawalFeeBasisPoints value.
    address public minWithdrawalFeeAdmin;

    // The address able to update the maxWithdrawalFeeBasisPoints value.
    address public maxWithdrawalFeeAdmin;

    // The address able to update the bitcoinKitContract
    address public bitcoinKitContractAdmin;

    // The address able to update the minCollateralAssetAmount
    address public minCollateralAssetAmountAdmin;

    // The address able to deprecate vaults. Set at construction and not changed.
    address public vaultDeprecationAdmin;

    // The address of the factory which deploys vaults and will inform this
    // SimpleGlobalVaultConfig of new deployments
    address public vaultDeploymentAdmin;

    // Mapping storing all deployed vaults using this config
    mapping(address => bool) public deployedVaults;

    // Mapping of hashes of Bitcoin custodianship script hashes that are in use by vaults
    mapping(bytes32 => bool) public usedBtcCustodianshipScriptHashes;



    constructor(address configAdminToSet, 
                address vaultFactoryAddress,
                uint256 initialMinDepositFeeBasisPoints,
                uint256 initialMaxDepositFeeBasisPoints,
                uint256 initialMinWithdrawalFeeBasisPoints,
                uint256 initialMaxWithdrawalFeeBasisPoints,
                IBitcoinKit initialBitcoinKitContract,
                ERC20 _permittedCollateralAssetContract,
                IAssetPriceOracle initialPriceOracle,
                uint256 initialMinCollateralAssetAmount,
                uint256 permSoftCollateralizationThreshold,
                uint256 permHardCollateralizationThreshold) notZeroAddress(configAdminToSet) {
        if (initialMinDepositFeeBasisPoints > initialMaxDepositFeeBasisPoints) {
            revert("min initial deposit fee must be <= max initial deposit fee");
        }
        if (initialMinWithdrawalFeeBasisPoints > initialMaxWithdrawalFeeBasisPoints) {
            revert("min initial withdrawal fee must be <= max initial withdrawal fee");
        }

        configAdmin =                            configAdminToSet;
        oracleImplementationAdmin =              configAdminToSet;
        minDepositFeeAdmin =                     configAdminToSet;
        maxDepositFeeAdmin =                     configAdminToSet;
        minWithdrawalFeeAdmin =                  configAdminToSet;
        maxWithdrawalFeeAdmin =                  configAdminToSet;
        bitcoinKitContractAdmin =                configAdminToSet;
        minCollateralAssetAmountAdmin =          configAdminToSet;

        vaultDeprecationAdmin = vaultFactoryAddress;
        vaultDeploymentAdmin = vaultFactoryAddress;

        permittedCollateralAssetContract = _permittedCollateralAssetContract;
        minCollateralAssetAmount =          initialMinCollateralAssetAmount;
        priceOracle =                       initialPriceOracle;

        require(permSoftCollateralizationThreshold > 100, 
        "soft collateralization threshold must be greater than 100");

        require(permHardCollateralizationThreshold > 100, 
        "hard collateralization threshold must be greater than 100");

        // Allow creating vaults where the thresholds are the same.
        // Normally, soft threshold will be larger (ex: 130 soft, 110 hard
        // means deposits won't be accepted below 130% collateral, but liquidations
        // won't occur until 110%).
        require(permSoftCollateralizationThreshold >= permHardCollateralizationThreshold,
         "soft collateralization threshold must be >= hard");

        // The collateralization thresholds are set at construction and cannot be changed
        softCollateralizationThreshold = permSoftCollateralizationThreshold;
        hardCollateralizationThreshold = permHardCollateralizationThreshold;

        minDepositFeeBasisPoints =          initialMinDepositFeeBasisPoints;
        maxDepositFeeBasisPoints =          initialMaxDepositFeeBasisPoints;
        minWithdrawalFeeBasisPoints =       initialMinWithdrawalFeeBasisPoints;
        maxWithdrawalFeeBasisPoints =       initialMaxWithdrawalFeeBasisPoints;
        bitcoinKitContract =                initialBitcoinKitContract;
    }

    function markBtcCustodianshipScriptHashUsed(bytes32 scriptHash) external {
        require(deployedVaults[msg.sender] == true, "only deployed vaults can mark a BTC custodian script hash as used");
        require(scriptHash != bytes32(0), "script hash must not be zero");
        require(!usedBtcCustodianshipScriptHashes[scriptHash], "script hash is already in use");
        usedBtcCustodianshipScriptHashes[scriptHash] = true;
    }

    /**
     * When the SimpleBitcoinVaultFactory deploys a new vault, it calls this function
     * to inform this config contract of the new vault.
     * 
     * @param newVault Address of the newly deployed vault
     */
    function saveNewVaultDeployment(address newVault) external notZeroAddress(newVault) {
        require(msg.sender == vaultDeploymentAdmin, "only vault deployment admin can save new vaults in config");
        deployedVaults[newVault] = true;
    }

    /**
    * Updates the configAdmin to a new admin address, only callable by the current configAdmin.
    *
    * @param newConfigAdmin The new configAdmin to set
    */
    function updateConfigAdmin(address newConfigAdmin) external onlyConfigAdmin notZeroAddress(newConfigAdmin) {
        configAdmin = newConfigAdmin;
        emit ConfigAdminUpdateCompleted(configAdmin);
    }

    /**
    * Updates the oracleImplementationAdmin to a new admin address, only callable by the current configAdmin.
    *
    * @param newOracleImplementationAdmin The new oracleImplementationAdmin to set
    */
    function updateOracleImplementationAdmin(address newOracleImplementationAdmin) external onlyConfigAdmin notZeroAddress(newOracleImplementationAdmin) {
        oracleImplementationAdmin = newOracleImplementationAdmin;
    }

    /**
    * Updates the minDepositFeeAdmin to a new admin address, only callable by the current configAdmin.
    *
    * @param newMinDepositFeeAdmin The new minDepositFeeAdmin to set
    */
    function updateMinDepositFeeAdmin(address newMinDepositFeeAdmin) external onlyConfigAdmin notZeroAddress(newMinDepositFeeAdmin) {
        minDepositFeeAdmin = newMinDepositFeeAdmin;
    }

    /**
    * Updates the maxDepositFeeAdmin to a new admin address, only callable by the current configAdmin.
    *
    * @param newMaxDepositFeeAdmin The new maxDepositFeeAdmin to set
    */
    function updateMaxDepositFeeAdmin(address newMaxDepositFeeAdmin) external onlyConfigAdmin notZeroAddress(newMaxDepositFeeAdmin) {
        maxDepositFeeAdmin = newMaxDepositFeeAdmin;
    }

    /**
    * Updates the minWithdrawalFeeAdmin to a new admin address, only callable by the current configAdmin.
    *
    * @param newMinWithdrawalFeeAdmin The new minWithdrawalFeeAdmin to set
    */
    function updateMinWithdrawalFeeAdmin(address newMinWithdrawalFeeAdmin) external onlyConfigAdmin notZeroAddress(newMinWithdrawalFeeAdmin) {
        minWithdrawalFeeAdmin = newMinWithdrawalFeeAdmin;
    }

    /**
    * Updates the maxWithdrawalFeeAdmin to a new admin address, only callable by the current configAdmin.
    *
    * @param newMaxWithdrawalFeeAdmin The new maxWithdrawalFeeAdmin to set
    */
    function updateMaxWithdrawalFeeAdmin(address newMaxWithdrawalFeeAdmin) external onlyConfigAdmin notZeroAddress(newMaxWithdrawalFeeAdmin) {
        maxWithdrawalFeeAdmin = newMaxWithdrawalFeeAdmin;
    }

    /**
    * Updates the bitcoinKitContractAdmin to a new admin address, only callable by the current configAdmin.
    *
    * @param newBitcoinKitContractAdmin The new bitcoinKitContractAdmin to set
    */
    function updateBitcoinKitContractAdmin(address newBitcoinKitContractAdmin) external onlyConfigAdmin notZeroAddress(newBitcoinKitContractAdmin) {
        require(!bitcoinKitUpgradePermDisabled, "cannot update bitcoin kit admin when bitcoin kit upgrading is perm disabled");
        bitcoinKitContractAdmin = newBitcoinKitContractAdmin;
    }

    /**
    * Updates the minCollateralAssetAmountAdmin to a new admin address, only callable by the current configAdmin.
    *
    * @param newMinCollateralAssetAmountAdmin The new minAssetCollateralAmountAdmin to set
    */
    function updateMinAssetCollateralAmountAdmin(address newMinCollateralAssetAmountAdmin) external onlyConfigAdmin notZeroAddress(newMinCollateralAssetAmountAdmin) {
        minCollateralAssetAmountAdmin = newMinCollateralAssetAmountAdmin;
    }

    /**
    * Updates the IAssetPriceOracle implementation
    * 
    * @param newPriceOracle The new contract of an IAssetPriceOracle implementation for vaults to use to determine collateral asset value
    */
    function updatePriceOracleImplementation(IAssetPriceOracle newPriceOracle) external senderPermissionCheck(oracleImplementationAdmin) notZeroAddress(address(newPriceOracle)) {
        priceOracle = newPriceOracle;
        emit PriceOracleImplementationUpdated(address(newPriceOracle));
    }

    /**
    * Updates the minimum deposit fees (sats and bps)
    *
    * @param newMinDepositFeeSats The new minDepositFeeSats to set
    * @param newMinDepositFeeBasisPoints The new minDepositFeeBasisPoints to set
    */
    function updateMinDepositFees(uint256 newMinDepositFeeSats, uint256 newMinDepositFeeBasisPoints) external senderPermissionCheck(minDepositFeeAdmin) feeWithinBounds(newMinDepositFeeBasisPoints) {
        require(newMinDepositFeeSats <= maxDepositFeeSats, "new min deposit fee sats must be <= current max deposit fee sats");
        require(newMinDepositFeeBasisPoints <= maxDepositFeeBasisPoints, "new min deposit fee bps must be <= current max deposit fee bps");
        
        minDepositFeeSats = newMinDepositFeeSats;
        minDepositFeeBasisPoints = newMinDepositFeeBasisPoints;
        emit MinDepositFeesUpdated(newMinDepositFeeSats, newMinDepositFeeBasisPoints);
    }

    /**
    * Updates the maximum deposit fees (sats and bps)
    *
    * @param newMaxDepositFeeSats The new maxDepositFeeSats to set
    * @param newMaxDepositFeeBasisPoints The new maxDepositFeeBasisPoints to set
    */
    function updateMaxDepositFees(uint256 newMaxDepositFeeSats, uint256 newMaxDepositFeeBasisPoints) external senderPermissionCheck(maxDepositFeeAdmin) feeWithinBounds(newMaxDepositFeeBasisPoints) {
        require(newMaxDepositFeeSats >= minDepositFeeSats, "new max deposit fee sats must be >= current min deposit fee sats");
        require(newMaxDepositFeeBasisPoints >= minDepositFeeBasisPoints, "new max deposit fee bps must be >= current min deposit fee bps");
        
        maxDepositFeeSats = newMaxDepositFeeSats;
        maxDepositFeeBasisPoints = newMaxDepositFeeBasisPoints;
        emit MaxDepositFeesUpdated(newMaxDepositFeeSats, newMaxDepositFeeBasisPoints);
    }

    /**
    * Updates the minimum withdrawal fee (sats and bps)
    *
    * @param newMinWithdrawalFeeSats The new minWithdrawalFeeSats to set
    * @param newMinWithdrawalFeeBasisPoints The new minWithdrawalFeeBasisPoints to set
    */
    function updateMinWithdrawalFees(uint256 newMinWithdrawalFeeSats, uint256 newMinWithdrawalFeeBasisPoints) external senderPermissionCheck(minWithdrawalFeeAdmin) feeWithinBounds(newMinWithdrawalFeeBasisPoints) {
        require(newMinWithdrawalFeeSats <= maxWithdrawalFeeSats, "new min withdrawal fee sats must be <= current max withdrawal fee sats");
        require(newMinWithdrawalFeeBasisPoints <= maxWithdrawalFeeBasisPoints, "new max withdrawal fee bps must be <= current max withdrawal fee bps");

        minWithdrawalFeeSats = newMinWithdrawalFeeSats;
        minWithdrawalFeeBasisPoints = newMinWithdrawalFeeBasisPoints;
        emit MinWithdrawalFeesUpdated(newMinWithdrawalFeeSats, newMinWithdrawalFeeBasisPoints);
    }

    /**
    * Updates the maximum withdrawal fee (sats and bps)
    *
    * @param newMaxWithdrawalFeeSats The new maxWithdrawalFeeSats to set
    * @param newMaxWithdrawalFeeBasisPoints The new maxWithdrawalFeeBasisPoints to set
    */
    function updateMaxWithdrawalFees(uint256 newMaxWithdrawalFeeSats, uint256 newMaxWithdrawalFeeBasisPoints) external senderPermissionCheck(maxWithdrawalFeeAdmin) feeWithinBounds(newMaxWithdrawalFeeBasisPoints) {
        require(newMaxWithdrawalFeeSats >= minWithdrawalFeeSats, "new max withdrawal fee sats must be >= current min withdrawal fee sats");
        require(newMaxWithdrawalFeeBasisPoints >= minWithdrawalFeeBasisPoints, "new max withdrawal fee bps must be >= current min withdrawal fee bps");

        maxWithdrawalFeeSats = newMaxWithdrawalFeeSats;
        maxWithdrawalFeeBasisPoints = newMaxWithdrawalFeeBasisPoints;
        emit MaxWithdrawalFeesUpdated(newMaxWithdrawalFeeSats, newMaxWithdrawalFeeBasisPoints);
    }

    /**
    * Updates the bitcoinKitContract.
    *
    * @param newBitcoinKitContract The new bitcoinKitContract to set
    */
    function updateBitcoinKitContract(IBitcoinKit newBitcoinKitContract) external senderPermissionCheck(bitcoinKitContractAdmin) notZeroAddress(address(newBitcoinKitContract)) {
        require(!bitcoinKitUpgradePermDisabled, "bitcoin kit upgrades perm disabled");
        bitcoinKitContract = newBitcoinKitContract;
        emit BitcoinKitContractUpdated(address(newBitcoinKitContract));
    }

    function permDisableBitcoinKitUpgrades() external onlyConfigAdmin {
        bitcoinKitUpgradePermDisabled = true;
        emit BitcoinKitUpgradesPermDisabled(address(bitcoinKitContract));
    }

    /**
    * Updates the minimum asset collateral amount required for new vault creation.
    * The minAssetCollateralAmount can only be increased, and the increase will only apply to new vaults created after the increase.
    *
    * @param newMinCollateralAssetAmount The new minCollateralAssetAmount to set
    */
    function updateMinCollateralAssetAmount(uint256 newMinCollateralAssetAmount) external senderPermissionCheck(minCollateralAssetAmountAdmin) {
        require(newMinCollateralAssetAmount > minCollateralAssetAmount, "the minimum collateral asset amount can only be increased");
        uint256 oldMinCollateralAssetAmount = minCollateralAssetAmount;
        minCollateralAssetAmount = newMinCollateralAssetAmount;
        emit MinCollateralAssetAmountUpdated(oldMinCollateralAssetAmount, minCollateralAssetAmount);
    }

    /**
    * Deprecates all vaults that consult this configuration contract, only callable by deprecation admin.
    * This only sets the deprecation values, which must be read by the vaults themselves to detect the deprecation;
    * no deprecation call is done directly on the vaults themselves.
    */
    function deprecate() external {
        require(msg.sender == vaultDeprecationAdmin, "only deprecation admin can deprecate");
        vaultSystemDeprecated = true;
        vaultSystemDeprecationTime = block.timestamp;
        emit DeprecateAllVaults();
    }

    /**
    * Gets the priceOracle that vaults use for determining collateral asset value.
    *
    * @return _priceOracle The implementation of IAssetPriceOracle that vaults should use for determining collateral asset value.
    */
    function getPriceOracle() external view returns (IAssetPriceOracle _priceOracle) {
        return priceOracle;
    }

    /**
    * Gets the minimum deposit fee in basis points that a vault can charge
    *
    * @return _minDepositFeeBasisPoints The minimum deposit fee in basis points that a vault can charge
    */
    function getMinDepositFeeBasisPoints() external view returns (uint256 _minDepositFeeBasisPoints) {
        return minDepositFeeBasisPoints;
    }

    /**
    * Gets the minimum deposit fee in sats that a vault can charge
    *
    * @return _minDepositFeeSats The minimum deposit fee in sats that a vault can charge
    */
    function getMinDepositFeeSats() external view returns (uint256 _minDepositFeeSats) {
        return minDepositFeeSats;
    }

    /**
    * Gets the maximum deposit fee in basis points that a vault can charge
    *
    * @return _maxDepositFeeBasisPoints The maximum deposit fee in basis points that a vault can charge
    */
    function getMaxDepositFeeBasisPoints() external view returns (uint256 _maxDepositFeeBasisPoints) {
        return maxDepositFeeBasisPoints;
    }

    /**
    * Gets the maximum deposit fee in sats that a vault can charge
    *
    * @return _maxDepositFeeSats The maximum deposit fee in sats that a vault can charge
    */
    function getMaxDepositFeeSats() external view returns (uint256 _maxDepositFeeSats) {
        return maxDepositFeeSats;
    }

    /**
    * Gets the minimum withdrawal fee in basis points that a vault can charge
    *
    * @return _minWithdrawalFeeBasisPoints The minimum withdrawal fee in basis points that a vault can charge
    */
    function getMinWithdrawalFeeBasisPoints() external view returns (uint256 _minWithdrawalFeeBasisPoints) {
        return minWithdrawalFeeBasisPoints;
    }

    /**
    * Gets the minimum withdrawal fee in sats that a vault can charge
    *
    * @return _minWithdrawalFeeSats The minimum withdrawal fee in sats that a vault can charge
    */
    function getMinWithdrawalFeeSats() external view returns (uint256 _minWithdrawalFeeSats) {
        return minWithdrawalFeeSats;
    }

    /**
    * Gets the maximum withdrawal fee in basis points that a vault can charge
    *
    * @return _maxWithdrawalFeeBasisPoints The maximum withdrawal fee in basis points that a vault can charge
    */
    function getMaxWithdrawalFeeBasisPoints() external view returns (uint256 _maxWithdrawalFeeBasisPoints) {
        return maxWithdrawalFeeBasisPoints;
    }

    /**
    * Gets the maximum withdrawal fee in sats that a vault can charge
    *
    * @return _maxWithdrawalFeeSats The maximum withdrawal fee in sats that a vault can charge
    */
    function getMaxWithdrawalFeeSats() external view returns (uint256 _maxWithdrawalFeeSats) {
        return maxWithdrawalFeeSats;
    }

    /**
    * Gets the BitcoinKit contract that the SimpleBitcoinVault should use.
    *
    * @return _bitcoinKitContract The BitcoinKit contract that the SimpleBitcoinVault should use.
    */
    function getBitcoinKitContract() external view returns (IBitcoinKit _bitcoinKitContract) {
        return bitcoinKitContract;
    }

    /**
    * Gets the permitted ERC20 collateral token that the SimpleBitcoinVault should allow as colateral.
    *
    * @return _permittedCollateralAssetContract The permitted asset collateral contract.
    */
    function getPermittedCollateralAssetContract() external view returns (ERC20 _permittedCollateralAssetContract) {
        return permittedCollateralAssetContract;
    }
    
    /**
    * Gets the minimum ERC20 collateral asset amount for creating a vault.
    *
    * @return _minCollateralAssetAmount The minimum collateral asset amount required to create a vault.
    */
    function getMinCollateralAssetAmount() external view returns (uint256 _minCollateralAssetAmount) {
        return minCollateralAssetAmount;
    }

    /**
    * Gets the soft collateralization ratio below which vaults cannot accept additional deposits.
    *
    * @return _softCollateralizationThreshold The soft collateralization threshold below which vaults cannot accept additional deposits.
    */
    function getSoftCollateralizationThreshold() external view returns (uint256 _softCollateralizationThreshold) {
        return softCollateralizationThreshold;
    }

    /**
    * Gets the hard collateralization ratio below which vaults are subject to liquidation.
    *
    * @return _hardCollateralizationThreshold The hard collateralization threshold below which vaults are subject to liquidation.
    */
    function getHardCollateralizationThreshold() external view returns (uint256 _hardCollateralizationThreshold) {
        return hardCollateralizationThreshold;
    }

    /**
    * Gets whether the vault implementation that consult this global config are deprecated
    *
    * @return deprecated Whether the vault implementation that consult this global config are deprecated
    */
    function isVaultSystemDeprecated() external view returns (bool deprecated) {
        return vaultSystemDeprecated;
    }
}