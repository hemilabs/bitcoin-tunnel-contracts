// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "../IVaultFactory.sol";
import "./SimpleBitcoinVault.sol";
import "./SimpleGlobalVaultConfig.sol";
import "./ISimpleBitcoinVaultFactoryHelper.sol";
import "./ISimpleBitcoinVaultStateFactory.sol";
import "./SimpleBitcoinVaultUTXOLogicHelper.sol";
import "../../bitcoinkit/IBitcoinKit.sol";

/**
 * The SimpleBitcoinVaultFactory is a vault factory which only creates SimpleBitcoinVaults.
 *
 * When deployed, the address of the GlobalConfig that will manage this factory must be set as the
 * factoryStatusAdmin so that the GlobalConfig can activate the vault factory when it becomes the
 * active factory system, and later deprecate it (and downstream vaults created by it) when it is
 * replaced with a new vault factory implementation.
*/
contract SimpleBitcoinVaultFactory is IVaultFactory {
    /**
     * The onlyFactoryStatusAdmin modifier is used on all functions that should *only* be callable
     * by the factoryStatusAdminAddr (a GlobalConfig contract).
    */
    modifier onlyFactoryStatusAdmin() {
        require(msg.sender == factoryStatusAdminAddr);
        _;
    }

    /**
     * The factoyActiveCheck modifier is used on all functions that should *only* be callable when
     * the factory is active (activated and not yet deprecated).
     *
     * factoryActive should always be false if factoryDeprecated is true, but checks both anyway.
    */
    modifier factoryActiveCheck() {
        require(factoryActive && !factoryDeprecated);
        _;
    }

    // The minimum soft collateralization threshold that a SimpleBitcoinVaultFactory can be
    // configured to use for vaults
    uint256 public constant MIN_SOFT_COLLATERALIZATION_THRESHOLD = 130; // 130%

    // The minimum hard collateralization threshold that a SimpleBitcoinVaultFactory can be
    // configured to use for vaults
    uint256 public constant MIN_HARD_COLLATERALIZATION_THRESHOLD = 110; // 110%

    // The admin, should be set to the GlobalConfig which will activate this vault factory when it
    // becomes the allowed factory system, and later deprecate it when replaced.
    address public factoryStatusAdminAddr;

    // The global config to be applied across all SimpleBitcoinVaults created by this factory
    SimpleGlobalVaultConfig public vaultConfig;

    // The factory helper for creating vault factories, separated out from this contract to fit
    // under the Spurious Dragon size limit because the factory helper code contains the entire
    // SimpleBitcoinVault code.
    ISimpleBitcoinVaultFactoryHelper public vaultFactoryHelper;

    // The factory for creating SimpleBitcoinVaultStates
    ISimpleBitcoinVaultStateFactory public vaultStateFactory;

    // Logic helper contract for SimpleBitcoinVault to offload some UTXO-related activities to
    SimpleBitcoinVaultUTXOLogicHelper public utxoLogicHelper;

    // Whether the factory is active. A factory is active after it has been activated until it has
    // been deprecated.
    bool factoryActive;

    // Whether the vault factory has been deprecated.
    bool factoryDeprecated;

    // The hBTC ERC20 contract (needed for vaults when liquidating hBTC)
    BTCToken public bitcoinTokenContract;

    // The number of vaults created by this factory
    uint32 public vaultCounter;

    // Mapping of all vaults based on their index
    mapping(uint32 => SimpleBitcoinVault) public vaults;

    /**
     * Used for deploying a new SimpleBitcoinVaultFactory, which in turn deploys a new
     * SimpleGlobalVaultConfig.
     *
     * @param _configAdmin The address which will control the deployed SimpleGlobalVaultConfig
     * @param factoryStatusAdmin The address which can activate and later deprecate the vault
     * @param _bitcoinKitContract The address of the BitcoinKit deployment to use
     * @param permittedCollateral The ERC20 contract of the asset permitted as collateral for vaults
     * @param priceOracle The initial price oracle to use to determine value of collateral against hBTC
     * @param initialMinCollateral The initial minimum collateral required for a vault
     * @param softCollateralizationThreshold The minimum soft collateralization threshold enforced on vaults in perpetuity
     * @param hardCollateralizationThreshold The minimum hard collateralization threshold enforced on vaults in perpetuity
     * @param _bitcoinTokenContract The ERC20 contract of the hBTC token that vaults will be representing BTC custodianship for
     * @param _vaultFactoryHelper The helper for the vault factory used to actually perform the creation of SimpleBitcoinVaults
     * @param _vaultStateFactory The factory for creating vault states
     * @param _utxoLogicHelper The UTXO Logic Helper contract deployment which assists the SimpleBitcoinVault in some UTXO-related tasks
    */
    constructor(address _configAdmin,
                address factoryStatusAdmin, 
                IBitcoinKit _bitcoinKitContract, 
                ERC20 permittedCollateral, 
                IAssetPriceOracle priceOracle, 
                uint256 initialMinCollateral, 
                uint256 softCollateralizationThreshold, 
                uint256 hardCollateralizationThreshold,
                BTCToken _bitcoinTokenContract,
                ISimpleBitcoinVaultFactoryHelper _vaultFactoryHelper,
                ISimpleBitcoinVaultStateFactory _vaultStateFactory,
                SimpleBitcoinVaultUTXOLogicHelper _utxoLogicHelper) {
        require(_configAdmin != address(0), "config admin not set");
        require(factoryStatusAdmin != address(0), "factory status admin not set");
        require(address(_bitcoinKitContract) != address(0), "bitcoin kit contract not set");
        require(address(permittedCollateral) != address(0), "permitted collateral contract not set");
        require(address(priceOracle) != address(0), "price oracle contract not set");

        require(initialMinCollateral > 0, "initial min collateral cannot be zero");
        require(softCollateralizationThreshold >= MIN_SOFT_COLLATERALIZATION_THRESHOLD, "soft collateralization threshold too low");
        require(hardCollateralizationThreshold >= MIN_HARD_COLLATERALIZATION_THRESHOLD, "hard collateralization threshold too low");

        require(address(_bitcoinTokenContract) != address(0), "bitcoin token contract not set");
        require(address(_vaultFactoryHelper) != address(0), "vault factory helper contract not set");
        require(address(_vaultStateFactory) != address(0), "vault state factory contract not set");
        require(address(_utxoLogicHelper) != address(0), "utxo logic helper contract not set");

        factoryStatusAdminAddr = factoryStatusAdmin;

        // Deploy a new SimpleGlobalVaultConfig with the provided pass-through values. Note that the
        // deprecationAdmin provided to this constructor is for calling the deprecation function on
        // this SimpleBitcoinVaultFactory, which in turn will call the deprecation function on the
        // vaultConfig. As a result, the SimpleGlobalVaultConfig is created with the address of this
        // SimpleBitcoinVaultFactory as the deprecation admin, not the factoryStatusAdmin which will
        // call the deprecate function on this SimpleBitcoinVaultFactory.
        vaultConfig = new SimpleGlobalVaultConfig(
            _configAdmin,
            address(this),
            20, // min deposit fee = 0.2%
            200, // max deposit fee = 2.0%
            20, // min withdrawal fee = 0.2%
            200, // max withdrawal fee = 2.0%
            _bitcoinKitContract,
            permittedCollateral,
            priceOracle,
            initialMinCollateral,
            softCollateralizationThreshold,
            hardCollateralizationThreshold
        );

        bitcoinTokenContract = _bitcoinTokenContract;
        vaultFactoryHelper = _vaultFactoryHelper;
        vaultStateFactory = _vaultStateFactory;
        utxoLogicHelper = _utxoLogicHelper;
    }

    /**
     * Creates a new vault for custodying Bitcoin. Can only be called if this factory is active (has
     * been activated and has not yet been deprecated).
     *
     * Some fields are not used (see params below) but are kept as part of signature for adherence
     * to the IBitcoinVault interface for future IBitcoinVault implementations that will need these
     * fields.
     * 
     * Note: The parameter setupAdmin from the IBitcoinVaultVactory interface is not used.
     * @param tunnelAdmin The address of the interaction admin, generally a BitcoinTunnelManager.
     * @param operatorAdmin The address of the operator admin
     * Note: The parameter vaultType from the IBitcoinVaultVactory interface is not used.
     * Note: The parameter extraInfo from the IBitcoinVaultVactory interface is not used.
     *
     * @return createdVault The vault that was created
    */
    function createVault(address,
                         address tunnelAdmin,
                         address operatorAdmin,
                         uint256,
                         bytes memory) 
                         factoryActiveCheck external returns (IBitcoinVault createdVault) {
        // Only one vault type (SimpleBitcoinVault) is supoprted by the SimpleBitcoinVaultFactory, 
        // so vaultType does not need to be checked to determine which vault implementation contract
        // to deploy.

        // Deploy a new SimpleBitcoinVault. setupAdmin and extraInfo are ignored as neither are used
        // by SimpleBitcoinVault.
        SimpleBitcoinVault vault = vaultFactoryHelper.createSimpleBitcoinVault(tunnelAdmin, operatorAdmin, bitcoinTokenContract, vaultConfig, vaultStateFactory, utxoLogicHelper);

        vaults[vaultCounter] = vault;
        vaultCounter++;

        // Convert to the implemented interface for use upstream
        return IBitcoinVault(address(vault));
    }

    /**
     * Returns a string representation of the type of vault this factory creates
     *
     * @return vaultType The type of vault this factory creates
    */
    function getVaultType() external pure returns (string memory vaultType) {
        return "SimpleBitcoinVault";
    }

    /**
     * Returns the number of children contracts that this factory has deployed.
     *
     * @return numChildren The number of children contracts
    */
    function getChildrenCount() external view returns (uint32 numChildren) {
        return vaultCounter;
    }

    /**
     * Gets the child contract the factory created at the specified index.
     *
     * @return child The child at the specified index
    */
    function getChild(uint32 index) external view returns (IBitcoinVault child) {
        return vaults[index];
    }

    /**
     * Activates the factory, allowing vaults to be created. Used by GlobalConfig to make sure
     * vaults are not deployed before the factory is the activated factory which should be used for
     * vault deployments.
     *
     * Can only be called when the vault has not yet been activated.
    */
    function activateFactory() external onlyFactoryStatusAdmin {
        // Ensure the factory isn't already active and is not deprecated. factoryActive is set to
        // false when the factory is deprecated, so both being false indicates pre-activation
        // initial state.
        require(!factoryActive && !factoryDeprecated, 
        "can only activate a factory that has not been activated yet");

        factoryActive = true;
    }

    /**
    * Returns whether the factory is currently active.
    *
    * @return isActive Whether the factory is currently active.
    */
    function isFactoryActive() external view returns (bool isActive) {
        return factoryActive;
    }

    /**
     * Marks this vault factory as deprecated when it is being replaced. Makes the appropriate
     * downstream deprecate call on the SImpleGlobalVaultConfig.
     *
     * Only callable by the factoryStatusAdmin which should be a GlobalConfig, and can only be
     * called while the factory is active.
    */
    function deprecate() external onlyFactoryStatusAdmin factoryActiveCheck {
        factoryActive = false;
        factoryDeprecated = true;

        // Mark the vaults deployed by this factory as deprecated in the
        // implementation-specific global vault config that they reference.
        vaultConfig.deprecate();
    }

    /**
     * Returns whether the factory has been deprecated.
     *
     * @return isDeprecated Whether the factory has been deprecated.
    */
    function isFactoryDeprecated() external view returns (bool isDeprecated) {
        return factoryDeprecated;
    }

    /**
     * Returns the admin of this factory which is able to deprecate vaults created by this factory
     * system.
     *
     * @return factoryStatusAdmin The admin who can activate and deprecate this factory
    */
    function getFactoryStatusAdmin() external view returns (address factoryStatusAdmin) {
        return factoryStatusAdminAddr;
    }
}