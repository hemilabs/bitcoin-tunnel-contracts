// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "../vaults/IVaultFactory.sol";
import "./AddressWhitelist.sol";
import "../bitcoinkit/IBitcoinKit.sol";

/** 
* The GlobalConfig contract serves to hold all of the configuration settings
* that should be applied globally to an instance of a Bitcoin Tunnel system.
* This includes:
*  - The vault factory that the Bitcoin Tunnel should be using for new vaults
*    (which in turn defines Vault implementation and specific configuration).
*  - Whether a global pause is in place for new vault creation
*  - Whether an address whitelist is in place for new vault creation, and if so
*    whether a particular address is permitted to create new vaults
*  - Whether an address whitelist is in place for withdrawals, and if so
*    whether a particular address is permitted to process withdrawals.
*
* Only the globalConfigAdmin is allowed to make changes to the other admins
* (no self-updating).
*/
contract GlobalConfig {
    // Global Config Admin upgrade events
    event GlobalConfigAdminUpgradeInitiated(address indexed newGlobalConfigAdmin);
    event GlobalConfigAdminUpgradeCompleted(address indexed newGlobalConfigAdmin);
    event GlobalConfigAdminUpgradeRejected(address indexed newGlobalConfigAdmin);
    event GlobalConfigAdminUpgradeDelayIncreased(uint256 indexed newDelay);

    // Vault factory upgrade events
    event VaultFactoryUpgradeInitiated(address indexed newVaultFactory);
    event VaultFactoryUpgradeCompleted(address indexed newVaultFactory);
    event VaultFactoryUpgradeRejected(address indexed rejectedVaultFactory);

    // Admin address upgrade events
    event VaultFactoryUpgradeAdminUpdated(address indexed newVaultFactoryAdmin);
    event VaultFactoryUpgradeBypassAdminUpdated(address indexed newVaultFactoryUpgradeBypassAdmin);
    event VaultCreationPauseAdminUpdated(address indexed newVaultCreationPauseAdmin);
    event VaultCreationUnpauseAdminUpdated(address indexed newVaultCreationUnpauseAdmin);
    event VaultCreationWhitelistEnableAdminUpdated(address indexed newVaultCreationWhitelistEnableAdmin);
    event VaultCreationWhitelistDisableAdminUpdated(address indexed newVaultCreationWhitelistDisableAdmin);
    event VaultCreationWhitelistModificationAdminUpdated(address indexed newVaultCreationWhitelistModificationAdmin);
    event VaultCreationWhitelistAdditionAdminUpdated(address indexed newVaultCreationWhitelistAdditionAdmin);
    event WithdrawalPauseAdminUpdated(address indexed newWithdrawalPauseAdmin);
    event WithdrawalUnpauseAdminUpdated(address indexed newWithdrawalUnpauseAdmin);
    event WithdrawalWhitelistEnableAdminUpdated(address indexed newWithdrawalWhitelistEnableAdmin);
    event WithdrawalWhitelistDisableAdminUpdated(address indexed newWithdrawalWhitelistDisableAdmin);
    event WithdrawalWhitelistModificationAdminUpdated(address indexed newWithdrawalWhitelistModificationAdmin);
    event WithdrawalWhitelistAdditionAdminUpdated(address indexed newWithdrawalWhitelistAdditionAdmin);
    event BitcoinKitAdminUpdated(address indexed newBitcoinKitAdmin);

    // Vault creation rule update events
    event VaultCreationPaused();
    event VaultCreationUnpaused();
    event VaultCreationWhitelistEnabled();
    event VaultCreationWhitelistDisabled();
    event VaultCreationWhitelistAddressAdded(address indexed whitelistedAddress);
    event VaultCreationWhitelistAddressRemoved(address indexed whitelistedAddressRemoved);

    // Withdrawal rule update events
    event WithdrawalsPaused();
    event WithdrawalsUnpaused();
    event WithdrawalWhitelistEnabled();
    event WithdrawalWhitelistDisabled();
    event WithdrawalWhitelistAddressAdded(address indexed whitelistedAddress);
    event WithdrawalWhitelistAddressRemoved(address indexed whitelistedAddressRemoved);

    // BitcoinKit implementation upgrade events
    event BitcoinKitAddrUpgradeInitiated(address indexed newBitcoinKitAddr);
    event BitcoinKitAddrUpgradeCompleted(address indexed newBitcoinKitAddr);
    event BitcoinKitAddrUpgradeRejected(address indexed rejectedBitcoinKitAddr);
    event BitcoinKitUpgradeDelayIncreased(uint256 indexed newDelay);

    /**
     * The onlyGlobalConfigAdmin modifier is used on all functions that should *only* be callable by
     * the globalConfigAdmin.
    */
    modifier onlyGlobalConfigAdmin() {
        require(msg.sender == globalConfigAdmin, "only global config admin allowed");
        _;
    }

    /**
     * The notZeroAddress modifier is used on all functions where a check that an address argument
     * is not the zero address.
    */
    modifier notZeroAddress(address addr) {
        require(addr != address(0), "zero address not allowed");
        _;
    }

    /**
     * The senderPermissionCheck modifier is used on all functions that should be callable by either
     * the globalConfigAdmin *or* a specific address.
     *
     * It is used by passing in the other specific address which is permitted.
    */
    modifier senderPermissionCheck(address permittedAddr) {
        require(msg.sender == globalConfigAdmin || msg.sender == permittedAddr, 
        "sender does not have permission");
        _;
    }

    // The globalConfigAdmin can update permissions for who can update all other config values, and
    // can update all other config values themselves.
    address public globalConfigAdmin;

    // The globalConfigAdmin that an upgrade to has been initiated for but not completed yet
    address public pendingActivationGlobalConfigAdmin;

    // The timestamp at which an upgrade to the globalConfigAdmin was initiated
    uint256 public globalConfigAdminUpgradeStartTime;

    // Delay in seconds for upgrading the global config admin to a new address
    uint256 public globalConfigAdminUpgradeDelay;

    // A one-time latch to prohibit future updates to the globalConfigAdmin. Unlike some other perm
    // disable latches, setting this to true will disable in-progress upgrades as well.
    bool public globalConfigAdminUpgradePermDisabled;



    /**** [BEGIN VAULT IMPLEMENTATION (FACTORY) PERMISSION VARIABLES] ****/

    // How many seconds between when an upgrade of the VaultFactory is initiated and when the new
    // VaultFactory goes into effect (meaning a new custodianship mechanism begins to be used by the
    // BitcoinTunnelManager).
    uint256 public vaultFactoryUpgradeDelay;

    // The minimum vaultFactoryUpgradeDelay that can ever be set. This is set once at initialization
    // and remains in force for the duration of the GlobalConfig's lifespan, which should be the
    // entire time a particular Bitcoin Tunnel system is in use.
    uint256 public minimumVaultFactoryUpgradeDelay;

    // Set when the vaultFactoryUpgradeDelay is lowered, to the current time at lowering plus the
    // former vaultFactoryUpgradeDelay, to ensure that lowering a delay cannot be used to perform an
    // upgrade without users having the original expected time to respond to the change in vault
    // upgrade governance. 
    // For example if delay was 7 days and is changed to 5 days, this is set to current+7 days and
    // no vault upgrade can happen before that current+7 days timestamp, even if a vault factory
    // upgrade was queued immediately after lowering the delay to 5 days.
    uint256 public grandfatheredMinVaultFactoryUpgradeTime;

    // The VaultFactory that the BitcoinTunnelManager can use to allow creation of new BitcoinVaults
    // - this defines both the permitted BitcoinVault implementation(s) as well as the
    // IGlobalVaultConfig implementation that will be used for all instances.
    IVaultFactory public vaultFactory;

    // The VaultFactory that an admin has started an upgrade to which hasn't gone into effect yet
    IVaultFactory public pendingActivationVaultFactory;

    // A count of how many times the vault factory has been upgraded
    uint32 public vaultFactoryUpgradeCount;

    // A mapping storing deprecated vaults. Not used in any of the Bitcoin Tunnel System contracts,
    // only provided for external contracts/services to easily check previous vault factories and
    // the status of each vault that they deployed.
    mapping(uint32 => IVaultFactory) deprecatedVaultFactories;

    // The timestamp at which a new VaultFactory was added by an admin
    uint256 public vaultUpgradeStartTime;

    // The vaultFactoryUpgradeAdmin can upgrade the VaultFactory implementation (kicks off waiting
    // period)
    address public vaultFactoryUpgradeAdmin;

    // The vaultFactoryUpgradeBypassAdmin can force an upgrade to occur without the required delay
    // elapsing
    address public vaultFactoryUpgradeBypassAdmin;

    // A one-time latch that only globalConfigAdmin can set to permanently disable all future vault
    // upgrades. Only applies to future vault upgrade initiations, a vault upgrade in progress will
    // be allowed to complete.
    bool public vaultUpgradePermDisabled = false;

    // A one-time latch that only globalConfigAdmin can set to permanently disable future vault
    // upgrade delay bypasses.
    bool public vaultUpgradeBypassPermDisabled = false;

    /**** [END VAULT IMPLEMENTATION (FACTORY) PERMISSION VARIABLES] ****/



    /**** [BEGIN VAULT CREATION PERMISSION VARIABLES] ****/

    // Whether Vault creation is paused
    bool public vaultCreationPaused;

    // Whether the whitelist should be consulted for who can create vaults
    bool public vaultCreationWhitelistEnabled;

    // The whitelist for vault creation
    AddressWhitelist public vaultCreationWhitelist;

    // The vaultCreationPauseAdmin can pause vault creation, but is unable to unpause it
    address public vaultCreationPauseAdmin;

    // The vaultCreationUnpauseAdmin can unpause vault creation, but is unable to pause it
    address public vaultCreationUnpauseAdmin;

    // The vaultCreationWhitelistEnableAdmin can enable whitelisting. Enabling whitelisting will
    // deploy a new AddressWhitelist contract that has no addresses whitelisted initially.
    address public vaultCreationWhitelistEnableAdmin;

    // The vaultCreationWhitelistDisableAdmin can disable an enabled whitelisting requirement for
    // vault creation, but can not enable whitelisting.
    address public vaultCreationWhitelistDisableAdmin;

    // The vaultCreationWhitelistModificationAdmin can add *and* remove addresses to/from the vault
    // creation whitelist if and when it is enabled.
    address public vaultCreationWhitelistModificationAdmin;

    // The vaultCreationWhitelistAdditionAdmin can *only* add addresses to the vault creation
    // whitelist, but is unable to remove addresses from the whitelist.
    // Permissions are a subset of permissions of the vaultCreationWhitelistModificationAdmin.
    address public vaultCreationWhitelistAdditionAdmin;

    // A one-time latch that only globalConfigAdmin can set to permanently disable future vault
    // creation whitelisting
    bool public vaultWhitelistingPermDisabled = false;

    // A one-time latch that only globalConfigAdmin can set to permanently disable future vault
    // creation pausing
    bool public vaultPausingPermDisabled = false;

    /**** [END VAULT CREATION PERMISSION VARIABLES] ****/



    /**** [BEGIN VAULT WITHDRAWAL PERMISSION VARIABLES] ****/

    // Whether withdrawals are paused
    bool public withdrawalsPaused;

    // Whether the whitelist should be consulted for who can withdraw
    bool public withdrawalWhitelistEnabled;

    // The whitelist for withdrawals
    AddressWhitelist public withdrawalWhitelist;

    // The withdrawalPauseAdmin can pause withdrawals from vaults globally, but is unable to unpause
    // them
    address public withdrawalPauseAdmin;

    // The withdrawalUnpauseAdmin can unpause withdrawals from vaults globally, but is unable to
    // pause them
    address public withdrawalUnpauseAdmin;

    // the withdrawalWhitelistEnableAdmin can enable whitelisting. Enabling whitelisting will deploy
    // a new AddressWhitelist contract that has no addresses whitelisted initially.
    address public withdrawalWhitelistEnableAdmin;

    // The withdrawalWhitelistDisableAdmin can disable an enabled whitelisting requirement for
    // withdrawals, but can not enable whitelisting.
    address public withdrawalWhitelistDisableAdmin;

    // The withdrawalWhitelistModificationAdmin can add *and* remove addresses to/from the
    // withdrawal whitelist if and when it is enabled.
    address public withdrawalWhitelistModificationAdmin;

    // The withdrawalWhitelistAdditionAdmin can *only* add addresses to the withdrawal whitelist,
    // but is unable to remove addresses from the whitelist.
    // Permissions are a subset of permissions of the withdrawalWhitelistModificationAdmin.
    address public withdrawalWhitelistAdditionAdmin;

    // A one-time latch that only globalConfigAdmin can set to permanently disable future withdrawal
    // whitelisting
    bool public withdrawalWhitelistingPermDisabled = false;

    // A one-time latch that only globalConfigAdmin can set to permanently disable future withdrawal
    // pausing
    bool public withdrawalPausingPermDisabled = false;

    /**** [END VAULT WITHDRAWAL PERMISSION VARIABLES] ****/


    /**** [BEGIN BITCOIN KIT PERMISSION VARIABLES] ****/

    // The bitcoinKitAddr is the IBitcoinKit implementation contract that the BitcoinTunnelManager
    // itself uses.
    IBitcoinKit public bitcoinKitAddr;

    // How many seconds between when an upgrade of the BitcoinKit is initiated and when the new
    // BitcoinKit goes into effect for the BitcoinTunnelManager to fall back to if its original
    // Bitcoin Kit implementation is unable to convert an address to a script. This delay can be
    // increased but never decreased.
    uint256 public bitcoinKitUpgradeDelay;

    // The bitcoinKitAddr that will be activated after bitcoinKitUpgradeTime, if set
    IBitcoinKit public pendingActivationBitcoinKitAddr;

    // The initial time when an upgrade to the Bitcoin Kit implementation was registered
    uint256 public bitcoinKitUpgradeStartTime;

    // A one-time latch that only globalConfigAdmin can set to permanently disable future Bitcoin Kit upgrades
    bool public bitcoinKitUpgradePermDisabled = false;

    // The bitcoinKitAdmin can update the IBitcoinKit implementation contract that the
    // BitcoinTunnelManager itself uses. Note that this is *not* the implementation of IBitcoinKit
    // that particular vault custodian mechanisms use - it is only for the BitcoinTunnelManager
    // itself, and only uses as a fallback if its original IBitcoinKit implementation is unable to
    // resolve a particular address to its corresponding script.
    address public bitcoinKitAdmin;


    /**
     * Create a new GlobalConfig with an initial single admin set for all update permissions, along
     * with an initial upgrade delay for factory implementations and an absolute minimum upgrade
     * delay that can ever be set, along with an initial vault factory to use.
     *
     * The globalConfigAdmin set in the constructor can never be updated, as the GlobalConfig should
     * only ever be deployed and used by a single BitcoinTunnelManager.
     *
     * It is permitted to create a GlobalConfig with a 0-second upgrade delay.
     *
     * The GlobalConfig is not setup with a vault factory initially, so that it can be deployed
     * during the BitcoinTunnelManager deployment. Then the address of the GlobalConfig is known and
     * can be used for setting up the initial vault factory which later gets set in this
     * GlobalConfig.
    *
    * @param globalConfigAdminToSet The global config admin and initial assigned admin for all other roles
    * @param initialVaultFactoryUpgradeDelay The initial delay in seconds for upgrading the vault factory
    * @param minimumVaultFactoryUpgradeDelayToSet The minimum delay in seconds for future upgrade delays
    * @param initialBitcoinKitUpgradeDelay The initial upgrade delay for updates to IBitcoinKit implementation
    * @param initialGlobalConfigAdminUpgradeDelay The initial upgrade delay for updating the global config admin
    * @param bitcoinKitAddrToSet The initial IBitcoinKit implementation to set
    */
    constructor(address globalConfigAdminToSet, 
                uint256 initialVaultFactoryUpgradeDelay, 
                uint256 minimumVaultFactoryUpgradeDelayToSet,
                uint256 initialBitcoinKitUpgradeDelay,
                uint256 initialGlobalConfigAdminUpgradeDelay,
                IBitcoinKit bitcoinKitAddrToSet) notZeroAddress(globalConfigAdminToSet) {
        require(initialVaultFactoryUpgradeDelay >= minimumVaultFactoryUpgradeDelayToSet, 
        "initial factory upgrade delay must be >= minimum specified delay");

        globalConfigAdmin =             globalConfigAdminToSet;
        globalConfigAdminUpgradeDelay = initialGlobalConfigAdminUpgradeDelay;

        // Vault factory upgrade delays
        vaultFactoryUpgradeDelay =        initialVaultFactoryUpgradeDelay;
        minimumVaultFactoryUpgradeDelay = minimumVaultFactoryUpgradeDelayToSet;

        // Bitcoin kit upgrade delay
        bitcoinKitUpgradeDelay = initialBitcoinKitUpgradeDelay;

        // Vault Implementation (Factory) Upgrade Permissions
        vaultFactoryUpgradeAdmin =       globalConfigAdminToSet;
        vaultFactoryUpgradeBypassAdmin = globalConfigAdminToSet;

        // Vault Creation Limitation Permissions
        vaultCreationPauseAdmin =                 globalConfigAdminToSet;
        vaultCreationUnpauseAdmin =               globalConfigAdminToSet;
        vaultCreationWhitelistEnableAdmin =       globalConfigAdminToSet;
        vaultCreationWhitelistDisableAdmin =      globalConfigAdminToSet;
        vaultCreationWhitelistModificationAdmin = globalConfigAdminToSet;
        vaultCreationWhitelistAdditionAdmin =     globalConfigAdminToSet;

        // Vault Withdrawal Limitation Permissions
        withdrawalPauseAdmin =                 globalConfigAdminToSet;
        withdrawalUnpauseAdmin =               globalConfigAdminToSet;
        withdrawalWhitelistEnableAdmin =       globalConfigAdminToSet;
        withdrawalWhitelistDisableAdmin =      globalConfigAdminToSet;
        withdrawalWhitelistModificationAdmin = globalConfigAdminToSet;
        withdrawalWhitelistAdditionAdmin =     globalConfigAdminToSet;

        bitcoinKitAdmin = globalConfigAdminToSet;

        bitcoinKitAddr = bitcoinKitAddrToSet;
    }

    /**
     * Sets the initial vault factory after construction, callable by either the globalConfigAdmin
     * or the vaultFactoryUpgradeAdmin.
     *
     * After initial deployment of the GlobalConfig, the vaultFactoryUpgradeAdmin could be changed
     * from the default (same as globalConfigAdmin) to delegate this initialization.
     *
     * The initial vault factory is set instantly as it's part of the overall initialization process
     * and there is no existing vault system that needs to be phased out.
    *
    * @param initialVaultFactory The initial vault factory to set
    */
    function setInitialVaultFactory(IVaultFactory initialVaultFactory) external notZeroAddress(address(initialVaultFactory)) senderPermissionCheck(vaultFactoryUpgradeAdmin) {
        // Check that there is no vault factory already set
        require(address(vaultFactory) == address(0), "vault factory already initialized");
        
        // Validate that the factory has the correct configuration
        validateVaultFactoryConfig(initialVaultFactory);

        vaultFactory = initialVaultFactory;

        vaultFactory.activateFactory();
    }

    /**
     * Performs the sanity checks on a vault factory before accepting it as the new vault factory.
     * This does not protect against a malicious implementation of IVaultFactory, and is only a
     * sanity check to protect against accidental misconfiguration.
    *
    * Sanity Checks:
    *   - Ensure this GlobalConfig is the status admin so that this contract
    *     can properly deprecate it during a future upgrade.
    *   - VaultFactory has not already deployed any vaults
    *   - VaultFactory is not already active
    *   - VaultFactory is not deprecated
    *
    * @param vaultFactoryToCheck The vault factory to perform sanity checks on
    */
    function validateVaultFactoryConfig(IVaultFactory vaultFactoryToCheck) private view {
        require(vaultFactoryToCheck.getFactoryStatusAdmin() == address(this), 
        "vault factory does not have this global config set as status admin");

        require(vaultFactoryToCheck.getChildrenCount() == 0, 
        "vault factory already deployed vaults");

        require(!vaultFactoryToCheck.isFactoryActive(), 
        "vault factory is already active");

        require(!vaultFactoryToCheck.isFactoryDeprecated(),
        "vault factory is already deprecated");
    }


    /**** [BEGIN ALL ONE-TIME LATCH SETTING FUNCTIONS] ****/

    /**
     * Permanently disable future vault upgrades, only callable by globalConfigAdmin. Will only
     * disable initializing future vault upgrades, and will permit an in-progress vault upgrade to
     * finish.
    */
    function permDisableVaultUpgrades() external onlyGlobalConfigAdmin {
        vaultUpgradePermDisabled = true;
    }

    /**
     * Permanently disable bypassing future vault upgrade activation delays, only callable by
     * globalConfigAdmin.
    */
    function permDisableVaultUpgradeBypass() external onlyGlobalConfigAdmin {
        vaultUpgradeBypassPermDisabled = true;
    }

    /**
     * Permanently prevent enabling the address whitelist for vault creation, only callable by
     * globalConfigAdmin.
    */
    function permDisableVaultCreationWhitelisting() external onlyGlobalConfigAdmin {
        vaultWhitelistingPermDisabled = true;
    }

    /**
    * Permanently prevent pausing of vault creation, only callable by globalConfigAdmin.
    */
    function permDisableVaultCreationPausing() external onlyGlobalConfigAdmin {
        vaultPausingPermDisabled = true;
    }

    /**
     * Permanently prevent enabling the address whitelist for withdrawal initiation, only callable
     * by globalConfigAdmin.
    */
    function permDisableWithdrawalWhitelisting() external onlyGlobalConfigAdmin {
        withdrawalWhitelistingPermDisabled = true;
    }

    /**
     * Permanently prevent pausing of withdrawal initiation, only callable by globalConfigAdmin.
    */
    function permDisableWithdrawalPausing() external onlyGlobalConfigAdmin {
        withdrawalPausingPermDisabled = true;
    }

    /**
     * Permanently disable future Bitcoin Kit upgrades, only callable by globalConfigAdmin. Will
     * only disable initializing future Bitcoin Kit upgrades, and will permit an in-progress Bitcoin
     * Kit upgrade to finish.
    */
    function permDisableBitcoinKitUpgrades() external onlyGlobalConfigAdmin {
        bitcoinKitUpgradePermDisabled = true;
    }

    /**
     * Permanently disable future Global Config Admin upgrades, only callable by globalConfigAdmin.
     * Will stop in-progress Global Config Admin upgrades.
    */
    function permDisableGlobalConfigAdminUpgrades() external onlyGlobalConfigAdmin {
        globalConfigAdminUpgradePermDisabled = true;
    }

    /**** [END ALL ONE-TIME LATCH SETTING FUNCTIONS] ***/



    /**** [BEGIN ALL CONFIG ADMIN UPDATE FUNCTIONS] ***/

    /**
     * Sets a new vaultFactoryUpgradeAdmin
     *
     * @param newVaultFactoryUpgradeAdmin The new vaultFactoryAdmin to set.
    */
    function updateVaultFactoryUpgradeAdmin(address newVaultFactoryUpgradeAdmin) external onlyGlobalConfigAdmin notZeroAddress(newVaultFactoryUpgradeAdmin) {
        vaultFactoryUpgradeAdmin = newVaultFactoryUpgradeAdmin;
        emit VaultFactoryUpgradeAdminUpdated(newVaultFactoryUpgradeAdmin);
    }

    /**
     * Sets a new vaultFactoryUpgradeBypassAdmin
     * 
     * @param newVaultFactoryUpgradeBypassAdmin The new vaultFactoryUpgradeBypassAdmin to set.
    */
    function updateVaultFactoryUpgradeBypassAdmin(address newVaultFactoryUpgradeBypassAdmin) external onlyGlobalConfigAdmin notZeroAddress(newVaultFactoryUpgradeBypassAdmin) {
        vaultFactoryUpgradeBypassAdmin = newVaultFactoryUpgradeBypassAdmin;
        emit VaultFactoryUpgradeBypassAdminUpdated(newVaultFactoryUpgradeBypassAdmin);
    }

    /**
     * Sets a new vaultCreationPauseAdmin
     * 
     * @param newVaultCreationPauseAdmin The new vaultCreationPauseAdmin to set.
    */
    function updateVaultCreationPauseAdmin(address newVaultCreationPauseAdmin) external onlyGlobalConfigAdmin notZeroAddress(newVaultCreationPauseAdmin) {
        vaultCreationPauseAdmin = newVaultCreationPauseAdmin;
        emit VaultCreationPauseAdminUpdated(newVaultCreationPauseAdmin);
    }

    /**
     * Sets a new vaultCreationUnpauseAdmin
     * 
     * @param newVaultCreationUnpauseAdmin The new vaultCreationUnpauseAdmin to set.
    */
    function updateVaultCreationUnpauseAdmin(address newVaultCreationUnpauseAdmin) external onlyGlobalConfigAdmin notZeroAddress(newVaultCreationUnpauseAdmin) {
        vaultCreationUnpauseAdmin = newVaultCreationUnpauseAdmin;
        emit VaultCreationUnpauseAdminUpdated(newVaultCreationUnpauseAdmin);
    }

    /**
     * Sets a new vaultCreationWhitelistEnableAdmin
     * 
     * @param newVaultCreationWhitelistEnableAdmin The new vaultCreationWhitelistEnableAdmin to set.
    */
    function updateVaultCreationWhitelistEnableAdmin(address newVaultCreationWhitelistEnableAdmin) external onlyGlobalConfigAdmin notZeroAddress(newVaultCreationWhitelistEnableAdmin) {
        vaultCreationWhitelistEnableAdmin = newVaultCreationWhitelistEnableAdmin;
        emit VaultCreationWhitelistEnableAdminUpdated(newVaultCreationWhitelistEnableAdmin);
    }

    /**
     * Sets a new vaultCreationWhitelistDisableAdmin
     * 
     * @param newVaultCreationWhitelistDisableAdmin The new vaultCreationWhitelistDisableAdmin to set.
    */
    function updateVaultCreationWhitelistDisableAdmin(address newVaultCreationWhitelistDisableAdmin) external onlyGlobalConfigAdmin notZeroAddress(newVaultCreationWhitelistDisableAdmin) {
        vaultCreationWhitelistDisableAdmin = newVaultCreationWhitelistDisableAdmin;
        emit VaultCreationWhitelistDisableAdminUpdated(newVaultCreationWhitelistDisableAdmin);
    }

    /**
     * Sets a new vaultCreationWhitelistModificationAdmin
     * 
     * @param newVaultCreationWhitelistModificationAdmin The new vaultCreationWhitelistModificationAdmin to set.
    */
    function updateVaultCreationWhitelistModificationAdmin(address newVaultCreationWhitelistModificationAdmin) external onlyGlobalConfigAdmin notZeroAddress(newVaultCreationWhitelistModificationAdmin) {
        vaultCreationWhitelistModificationAdmin = newVaultCreationWhitelistModificationAdmin;
        emit VaultCreationWhitelistModificationAdminUpdated(newVaultCreationWhitelistModificationAdmin);
    }

    /**
     * Sets a new vaultCreationWhitelistAdditionAdmin
     * 
     * @param newVaultCreationWhitelistAdditionAdmin The new vaultCreationWhitelistAdditionAdmin to set.
    */
    function updateVaultCreationWhitelistAdditionAdmin(address newVaultCreationWhitelistAdditionAdmin) external onlyGlobalConfigAdmin notZeroAddress(newVaultCreationWhitelistAdditionAdmin) {
        vaultCreationWhitelistAdditionAdmin = newVaultCreationWhitelistAdditionAdmin;
        emit VaultCreationWhitelistAdditionAdminUpdated(newVaultCreationWhitelistAdditionAdmin);
    }

    /**
     * Sets a new withdrawalPauseAdmin
     * 
     * @param newWithdrawalPauseAdmin The new withdrawalPauseAdmin to set.
    */
    function updateWithdrawalPauseAdmin(address newWithdrawalPauseAdmin) external onlyGlobalConfigAdmin notZeroAddress(newWithdrawalPauseAdmin) {
        withdrawalPauseAdmin = newWithdrawalPauseAdmin;
        emit WithdrawalPauseAdminUpdated(newWithdrawalPauseAdmin);
    }

    /**
     * Sets a new withdrawalUnpauseAdmin
     * 
     * @param newWithdrawalUnpauseAdmin The new withdrawalUnpauseAdmin to set.
    */
    function updateWithdrawalUnpauseAdmin(address newWithdrawalUnpauseAdmin) external onlyGlobalConfigAdmin notZeroAddress(newWithdrawalUnpauseAdmin) {
        withdrawalUnpauseAdmin = newWithdrawalUnpauseAdmin;
        emit WithdrawalUnpauseAdminUpdated(newWithdrawalUnpauseAdmin);
    }

    /**
     * Sets a new withdrawalWhitelistEnableAdmin
     * 
     * @param newWithdrawalWhitelistEnableAdmin The new withdrawalWhitelistEnableAdmin to set.
    */
    function updateWithdrawalWhitelistEnableAdmin(address newWithdrawalWhitelistEnableAdmin) external onlyGlobalConfigAdmin notZeroAddress(newWithdrawalWhitelistEnableAdmin) {
        withdrawalWhitelistEnableAdmin = newWithdrawalWhitelistEnableAdmin;
        emit WithdrawalWhitelistEnableAdminUpdated(newWithdrawalWhitelistEnableAdmin);
    }

    /**
     * Sets a new withdrawalWhitelistDisableAdmin
     * 
     * @param newWithdrawalWhitelistDisableAdmin The new withdrawalWhitelistDisableAdmin to set.
    */
    function updateWithdrawalWhitelistDisableAdmin(address newWithdrawalWhitelistDisableAdmin) external onlyGlobalConfigAdmin notZeroAddress(newWithdrawalWhitelistDisableAdmin) {
        withdrawalWhitelistDisableAdmin = newWithdrawalWhitelistDisableAdmin;
        emit WithdrawalWhitelistDisableAdminUpdated(newWithdrawalWhitelistDisableAdmin);
    }

    /**
     * Sets a new withdrawalWhitelistModificationAdmin
     * 
     * @param newWithdrawalWhitelistModificationAdmin The new withdrawalWhitelistModificationAdmin to set.
    */
    function updateWithdrawalWhitelistModificationAdmin(address newWithdrawalWhitelistModificationAdmin) external onlyGlobalConfigAdmin notZeroAddress(newWithdrawalWhitelistModificationAdmin) {
        withdrawalWhitelistModificationAdmin = newWithdrawalWhitelistModificationAdmin;
        emit WithdrawalWhitelistModificationAdminUpdated(newWithdrawalWhitelistModificationAdmin);
    }

    /**
     * Sets a new withdrawalWhitelistAdditionAdmin
     * 
     * @param newWithdrawalWhitelistAdditionAdmin The new withdrawalWhitelistAdditionAdmin to set.
    */
    function updateWithdrawalWhitelistAdditionAdmin(address newWithdrawalWhitelistAdditionAdmin) external onlyGlobalConfigAdmin notZeroAddress(newWithdrawalWhitelistAdditionAdmin) {
        withdrawalWhitelistAdditionAdmin = newWithdrawalWhitelistAdditionAdmin;
        emit WithdrawalWhitelistAdditionAdminUpdated(newWithdrawalWhitelistAdditionAdmin);
    }

    /**
     * Sets a new bitcoinKitAdmin
     * 
     * @param newBitcoinKitAdmin The new bitcoinKitAdmin to set.
    */
    function updateBitcoinKitAdmin(address newBitcoinKitAdmin) external onlyGlobalConfigAdmin notZeroAddress(newBitcoinKitAdmin) {
        bitcoinKitAdmin = newBitcoinKitAdmin;
        emit BitcoinKitAdminUpdated(newBitcoinKitAdmin);
    }


    /**** [END ALL CONFIG ADMIN UPDATE FUNCTIONS] ***/



    /**** [BEGIN VAULT FACTORY UPGRADE FUNCTIONS] ****/

    /**
     * Returns whether a vault factory upgrade is in progress, determined by whether there is a
     * non-zero pendingActivationVaultFactory set.
     * 
     * @return upgradeInProgress Whether there is a vault factory upgrade in progress
    */
    function isVaultFactoryUpgradeInProgress() public view returns (bool upgradeInProgress) {
        return address(pendingActivationVaultFactory) != address(0);
    }

    /**
     * Begins the upgrade process for the VaultFactory implementation, which sets
     * pendingActivationVaultFactory and sets the vaultUpgradeStartTime to the current time.
     * 
     * If there is already a pending VaultFactory upgrade, it will be replaced with this new
     * VaultFactory and the countdown to upgrade activation will be reset (meaning the previous
     * not-yet-activated VaultFactory will never become active).
     * 
     * @param newVaultFactory The new IVaultFactory implementation to upgrade to after the upgrade delay
    */
    function initiateVaultFactoryUpgrade(IVaultFactory newVaultFactory) external notZeroAddress(address(newVaultFactory)) senderPermissionCheck(vaultFactoryUpgradeAdmin) {
        require(!vaultUpgradePermDisabled, "vault upgrades are permanently disabled");
        validateVaultFactoryConfig(newVaultFactory);
        pendingActivationVaultFactory = newVaultFactory;
        vaultUpgradeStartTime = block.timestamp;
        emit VaultFactoryUpgradeInitiated(address(newVaultFactory));
    }

    /**
     * Reject (delete) a pending vault factory upgrade. Can be called by globalConfigAdmin or the
     * vaultFactoryUpgradeAdmin.
    */
    function rejectPendingVaultFactoryUpgrade() external senderPermissionCheck(vaultFactoryUpgradeAdmin) {
        address temp = address(pendingActivationVaultFactory);
        pendingActivationVaultFactory = IVaultFactory(address(0));
        vaultUpgradeStartTime = 0;
        emit VaultFactoryUpgradeRejected(temp);
    }

    /**
     * Performs the actual work that updates the vaultFactory to the pendingActivationVaultFactory.
     * Assumes that the upgrade is allowed (caller must check that either the activation time window
     * has passed, or is allowed to be bypassed).
    */
    function finalizeVaultFactoryUpgradeInternal() private notZeroAddress(address(pendingActivationVaultFactory)) {
        // When a vault factory upgrade is finalized, deprecate the old vault factory
        vaultFactory.deprecate();

        // Set the vault factory to the new implementation
        vaultFactory = pendingActivationVaultFactory;
        vaultFactory.activateFactory();
        pendingActivationVaultFactory = IVaultFactory(address(0));
        vaultUpgradeStartTime = 0;
        emit VaultFactoryUpgradeCompleted(address(vaultFactory));
    }

    /**
     * Processes the VaultFactory upgrade after the activation time has been reached. Can be called
     * by anyone.
    * 
    * @param force Whether the caller intends to force an upgrade even if sufficient time
    *        has not elapsed. Only used if caller is globalConfigAdmin or 
    *        vaultUpgradeBypassAdmin, and provided as an additional sanity check that caller
    *        intends to bypass the normal upgrade delay if required.
    */
    function finalizeVaultFactoryUpgrade(bool force) external {
        if (vaultUpgradeStartTime == 0) {
                revert("vaultUpdateStartTime is set to zero");
        }

        uint256 elapsed = block.timestamp - vaultUpgradeStartTime;

        // Ensure that the minimum elapsed time based on current delay has passed, and also that the
        // current timestamp is past the grandfatheredMinVaultFactoryUpgradeTime, which is set to
        // prevent a change which lowers the upgrade delay from allowing an upgrade sooner than
        // would have been otherwise possible without the upgrade delay modification.
        if (elapsed >= vaultFactoryUpgradeDelay && block.timestamp >= grandfatheredMinVaultFactoryUpgradeTime) {
            // Do not need to check that pendingActivationVaultFactory is set, as this is checked by
            // the finalizeVaultFactoryUpgradeInternal function we call.
            finalizeVaultFactoryUpgradeInternal();
            return;
        } 

        // Special bypass - if enough time has not elapsed but the sender is either the
        // globalConfigAdmin or the vaultUpgradeBypassAdmin and the vaultUpgradeBypassPermDisabled
        // latch has not been set, then the activation time window can be bypassed.
        if (msg.sender == globalConfigAdmin || msg.sender == vaultFactoryUpgradeBypassAdmin) {
            if (force) {
                if (!vaultUpgradeBypassPermDisabled) {
                    finalizeVaultFactoryUpgradeInternal();
                    return;
                } else {
                    revert("vaultUpgradeBypassPermDisabled latch has been set, no activation bypass permitted");
                }
            } else {
                revert("the caller has upgrade delay bypass permissions but did not specify force=true to bypass");
            }
        } else {
            revert("the upgrade delay has not elapsed and caller does not have permission to bypass the delay");
        }
    }

    /**
     * Updates the set vaultFactoryUpgradeDelay to a new delay in seconds. Only callable by the
     * globalConfigAdmin or the vaultFactoryUpgradeAdmin.
     * 
     * @param newVaultFactoryUpgradeDelay The new delay to set for Vault Factory upgrades
    */
    function updateVaultFactoryUpgradeDelay(uint256 newVaultFactoryUpgradeDelay) external senderPermissionCheck(vaultFactoryUpgradeAdmin) {
        require(newVaultFactoryUpgradeDelay >= minimumVaultFactoryUpgradeDelay, 
        "new upgrade delay must be >= the set minimum upgrade delay");

        // Make sure that no vault factory upgrades can go into effect faster than otherwise
        // possible from this update. This means:
        //   1. If an upgrade is already in progress, set the grandfathered end time to the
        //      original end time of the upgrade when initiated, or
        //   2. If an upgrade is not in progress, set the grandfathered end time to the current
        //      time plus the former vaultFactoryUpgradeDelay
        if (isVaultFactoryUpgradeInProgress()) {
            grandfatheredMinVaultFactoryUpgradeTime = vaultUpgradeStartTime + vaultFactoryUpgradeDelay;
        } else {
            grandfatheredMinVaultFactoryUpgradeTime = block.timestamp + vaultFactoryUpgradeDelay;
        }

        // Set the updated upgrade delay moving forward
        vaultFactoryUpgradeDelay = newVaultFactoryUpgradeDelay;
    }

    /**** [END VAULT FACTORY UPGRADE FUNCTIONS] ****/



    /**** [BEGIN VAULT CREATION PERMISSION FUNCTIONS] ****/

    /**
     * Pauses creation of new vaults, only callable by globalConfigAdmin and vaultCreationPauseAdmin
    */
    function pauseVaultCreation() external senderPermissionCheck(vaultCreationPauseAdmin) {
        require(!vaultPausingPermDisabled, "vault creation pausing is permanently disabled");

        // if check so that we don't emit an event if vault creation already paused
        if (!vaultCreationPaused) {
            vaultCreationPaused = true;
            emit VaultCreationPaused();
        }
    }

    /**
     * Unpauses creation of new vaults, only callable by globalConfigAdmin and
     * vaultCreationUnpauseAdmin
    */
    function unpauseVaultCreation() external senderPermissionCheck(vaultCreationUnpauseAdmin) {
        // if check so that we don't emit an event if vault creation already unpaused
        if (vaultCreationPaused) {
            vaultCreationPaused = false;
            emit VaultCreationUnpaused();
        }
    }

    /**
     * Enables the whitelist for addresses permitted to create new vaults, only callable by
     * globalConfigAdmin and vaultCreationWhitelistEnableAdmin.
    */
    function enableVaultCreationWhitelist() external senderPermissionCheck(vaultCreationWhitelistEnableAdmin) {
        require(!vaultWhitelistingPermDisabled, "vault whitelisting permanently disabled");
        if (!vaultCreationWhitelistEnabled) {
            vaultCreationWhitelist = new AddressWhitelist(address(this));
            vaultCreationWhitelistEnabled = true;
            emit VaultCreationWhitelistEnabled();
        }
    }

    /**
     * Disables the whitelist for addresses permitted to create new vaults, only callable by
     * globalConfigAdmin and vaultCreationWhitelistDisableAdmin.
    */
    function disableVaultCreationWhitelist() external senderPermissionCheck(vaultCreationWhitelistDisableAdmin) {
        if (vaultCreationWhitelistEnabled) {
            vaultCreationWhitelist = AddressWhitelist(address(0));
            vaultCreationWhitelistEnabled = false;
            emit VaultCreationWhitelistDisabled();
        }
    }

    /**
     * Adds an address to the whitelist of addresses permitted to create new vaults, only callable
     * by globalConfigAdmin, vaultCreationWhitelistModificationAdmin, and
     * vaultCreationWhitelistAdditionAdmin
     *
     * @param addrToWhitelist The address to whitelist for vault creation
    */
    function addAddressToVaultCreationWhitelist(address addrToWhitelist) external {
        // Not using senderPermissionCheck modifier as need to check 2 addresses other than globalConfigAdmin
        require (
            msg.sender == globalConfigAdmin ||
            msg.sender == vaultCreationWhitelistModificationAdmin ||
            msg.sender == vaultCreationWhitelistAdditionAdmin, "caller not authorized for action");
        if (vaultCreationWhitelistEnabled) {
            if (vaultCreationWhitelist.isAddressWhitelisted(addrToWhitelist)) {
                revert("address is already whitelisted");
            }
            vaultCreationWhitelist.addToWhitelist(addrToWhitelist);
            emit VaultCreationWhitelistAddressAdded(addrToWhitelist);
        } else {
            revert("vault creation whitelist is not enabled, cannot whitelist an address");
        }
    }

    /**
     * Removes an address from the whitelist of addresses permitted to create new vaults, only
     * callable by globalConfigAdmin or vaultCreationWhitelistModificationAdmin.
     *
     * @param addrToRemoveFromWhitelist The address to remove from the whitelist for vault creation
    */
    function removeAddressFromVaultCreationWhitelist(address addrToRemoveFromWhitelist) external senderPermissionCheck(vaultCreationWhitelistModificationAdmin) {
        if (vaultCreationWhitelistEnabled) {
            if (!vaultCreationWhitelist.isAddressWhitelisted(addrToRemoveFromWhitelist)) {
                revert("address to remove was not whitelisted");
            }
            vaultCreationWhitelist.removeFromWhitelist(addrToRemoveFromWhitelist);
            emit VaultCreationWhitelistAddressRemoved(addrToRemoveFromWhitelist);
        } else {
            revert("vault creation whitelist is not enabled, cannot remove an address from whitelist");
        }
    }

    /**
     * Checks whether an address is permitted to create a vault.
     * If vault creation is paused, no addresses are permitted.
     * If the vault creation whitelist is disabled and vault creation is not paused, all addresses are permitted.
     * Otherwise if vault creation is not paused but whitelist is enabled, check the whitelist.
     *
     * @param addressToCheck The address to check for whether vault creation is permitted
     *
     * @return addressPermittedToCreateVault Whether the address is permitted to create a vault
    */
    function isAddressPermittedToCreateVault(address addressToCheck) external view notZeroAddress(addressToCheck) returns (bool addressPermittedToCreateVault)  {
        if (vaultCreationPaused) {
            return false;
        }
        if (!vaultCreationWhitelistEnabled) {
            // Whitelist is not enabled, so all addresses permitted
            return true;
        } else {
            return vaultCreationWhitelist.isAddressWhitelisted(addressToCheck);
        }
    }

    /**** [END VAULT CREATION PERMISSION FUNCTIONS] ****/



    /**** [BEGIN WITHDRAWAL PERMISSION FUNCTIONS] ****/

    /**
     * Pauses withdrawals, only callable by globalConfigAdmin and withdrawalPauseAdmin
    */
    function pauseWithdrawals() external senderPermissionCheck(withdrawalPauseAdmin) {
        require(!withdrawalPausingPermDisabled, "withdrawal pausing is permanently disabled");

        // if check so that we don't emit an event if withdrwaals are already paused
        if (!withdrawalsPaused) {
            withdrawalsPaused = true;
            emit WithdrawalsPaused();
        }
    }

    /**
     * Unpauses withdrawals, only callable by globalConfigAdmin and withdrawalUnpauseAdmin
    */
    function unpauseWithdrawals() external senderPermissionCheck(withdrawalUnpauseAdmin) {
        // if check so that we don't emit an event if withdrawals are already unpaused
        if (withdrawalsPaused) {
            withdrawalsPaused = false;
            emit WithdrawalsUnpaused();
        }
    }

    /**
     * Enables the whitelist for addresses permitted to withdraw, only callable by globalConfigAdmin
     * and withdrawalWhitelistEnableAdmin.
    */
    function enableWithdrawalWhitelist() external senderPermissionCheck(withdrawalWhitelistEnableAdmin) {
        require(!withdrawalWhitelistingPermDisabled, "vwithdrawal whitelisting is permanently disabled");

        if (!withdrawalWhitelistEnabled) {
            withdrawalWhitelist = new AddressWhitelist(address(this));
            withdrawalWhitelistEnabled = true;
            emit WithdrawalWhitelistEnabled();
        }
    }

    /**
     * Disables the whitelist for addresses permitted to withdraw, only callable by
     * globalConfigAdmin and withdrawalWhitelistDisableAdmin.
    */
    function disableWithdrawalWhitelist() external senderPermissionCheck(withdrawalWhitelistDisableAdmin) {
        if (withdrawalWhitelistEnabled) {
            withdrawalWhitelist = AddressWhitelist(address(0));
            withdrawalWhitelistEnabled = false;
            emit WithdrawalWhitelistDisabled();
        }
    }

    /**
     * Adds an address to the whitelist of addresses permitted to withdraw, only callable by
     * globalConfigAdmin, withdrawalWhitelistModificationAdmin, and withdrawalWhitelistAdditionAdmin
     *
     * @param addrToWhitelist The address to whitelist for withdrawals
    */
    function addAddressToWithdrawalWhitelist(address addrToWhitelist) external {
        // Not using senderPermissionCheck modifier as need to check 2 addresses other than globalConfigAdmin
        require (
            msg.sender == globalConfigAdmin ||
            msg.sender == withdrawalWhitelistModificationAdmin ||
            msg.sender == withdrawalWhitelistAdditionAdmin, "caller not authorized for action");

        if (withdrawalWhitelistEnabled) {
            if (withdrawalWhitelist.isAddressWhitelisted(addrToWhitelist)) {
                revert("address is already whitelisted");
            }

            withdrawalWhitelist.addToWhitelist(addrToWhitelist);
            emit WithdrawalWhitelistAddressAdded(addrToWhitelist);
        } else {
            revert("withdrawal whitelist is not enabled, cannot whitelist an address");
        }
    }

    /**
     * Removes an address from the whitelist of addresses permitted to withdraw, only callable by
     * globalConfigAdmin or withdrawalWhitelistModificationAdmin.
     *
     * @param addrToRemoveFromWhitelist The address to remove from the whitelist for withdrawals
    */
    function removeAddressFromWithdrawalWhitelist(address addrToRemoveFromWhitelist) external senderPermissionCheck(withdrawalWhitelistModificationAdmin) {
        if (withdrawalWhitelistEnabled) {
            if (!withdrawalWhitelist.isAddressWhitelisted(addrToRemoveFromWhitelist)) {
                revert("address to remove was not whitelisted");
            }
            withdrawalWhitelist.removeFromWhitelist(addrToRemoveFromWhitelist);
            emit WithdrawalWhitelistAddressRemoved(addrToRemoveFromWhitelist);
        } else {
            revert("withdrawal whitelist is not enabled, cannot remove an address from whitelist");
        }
    }

    /**
     * Checks whether an address is permitted to withdraw.
     * If withdrawals are paused, no addresses are permitted.
     * If the withdrawal whitelist is disabled and withdrawals are not paused, all addresses are permitted.
     * Otherwise if withdrawals are not paused but whitelist is enabled, check the whitelist.
     *
     * @param addressToCheck The address to check for whether withdrawals are permitted
     *
     * @return addressPermittedToWithdraw Whether the address is permitted to withdraw
    */
    function isAddressPermittedToWithdraw(address addressToCheck) external view notZeroAddress(addressToCheck) returns (bool addressPermittedToWithdraw)  {
        if (withdrawalsPaused) {
            return false;
        }
        if (!withdrawalWhitelistEnabled) {
            // Whitelist is not enabled, so all addresses permitted
            return true;
        } else {
            return withdrawalWhitelist.isAddressWhitelisted(addressToCheck);
        }
    }

    /**** [END WITHDRAWAL PERMISSION FUNCTIONS] ****/


    /**
     * Begins the upgrade process for the IBitcoinKit implementation, which sets
     * pendingActivationBitcoinKitAddr and sets the bitcoinKitUpgradeStartTime to the current time.
     * 
     * If there is already a pending bitcoinKitAddr upgrade, it will be replaced with this new
     * IBitcoinKit implementation and the countdown to upgrade activation will be reset (meaning the
     * previous not-yet-activated IBitcoinKit implmenetation will never become active).
     * 
     * @param newBitcoinKitAddr The new IBitcoinKit implementation to upgrade to after the upgrade delay
    */
    function initiateBitcoinKitAddrUpgrade(IBitcoinKit newBitcoinKitAddr) external notZeroAddress(address(newBitcoinKitAddr)) senderPermissionCheck(bitcoinKitAdmin) {
        require(!bitcoinKitUpgradePermDisabled, "bitcoin kit upgrading perm disabled");
        pendingActivationBitcoinKitAddr = newBitcoinKitAddr;
        bitcoinKitUpgradeStartTime = block.timestamp;
        emit BitcoinKitAddrUpgradeInitiated(address(newBitcoinKitAddr));
    }

    /**
     * Reject (delete) a pending Bitcoin Kit upgrade. Can be called by globalConfigAdmin or the
     * bitcoinKitAdmin.
    */
    function rejectBitcoinAddrKitUpgrade() external senderPermissionCheck(bitcoinKitAdmin) {
        address temp = address(pendingActivationBitcoinKitAddr);
        pendingActivationBitcoinKitAddr = IBitcoinKit(address(0));
        bitcoinKitUpgradeStartTime = 0;
        emit BitcoinKitAddrUpgradeRejected(temp);
    }

    /**
     * Processes the bitcoinKitAddr upgrade after the activation time has been reached. Can be
     * called by anyone, as it only enacts a previously initiated upgrade after the required time
     * emapsed.
    */
    function finalizeBitcoinKitAddrUpgrade() external {
        require(bitcoinKitUpgradeStartTime != 0, "a bitcoin kit upgrade is not in progress");

        require(address(pendingActivationBitcoinKitAddr) != address(0), 
        "pendingActivationBitcoinKitAddr is set to the zero address");

        uint256 elapsed = block.timestamp - bitcoinKitUpgradeStartTime;

        require(elapsed >= bitcoinKitUpgradeDelay, 
        "the required bitcoin kit upgrade delay has not elapsed");

        bitcoinKitAddr = pendingActivationBitcoinKitAddr;
        pendingActivationBitcoinKitAddr = IBitcoinKit(address(0));
        bitcoinKitUpgradeStartTime = 0;
        emit BitcoinKitAddrUpgradeCompleted(address(bitcoinKitAddr));
    }

    /**
     * Increases the delay for Bitcoin Kit upgrades. Note that the delay can only be increased to a
     * higher value than was already set, and cannot be reduced. Only callable by the
     * globalConfigAdmin.
     * 
     * @param newDelay The new delay in seconds to set for Bitcoin Kit upgrades
    */
    function increaseBitcoinKitUpgradeDelay(uint256 newDelay) external onlyGlobalConfigAdmin {
        require(!bitcoinKitUpgradePermDisabled, 
        "bitcoin kit upgrading perm disabled, increasing delay would have no effect");

        require(newDelay > bitcoinKitUpgradeDelay, "new delay must be longer than current delay");
        bitcoinKitUpgradeDelay = newDelay;

        emit BitcoinKitUpgradeDelayIncreased(newDelay);
    }

    /**
     * Begins the upgrade process for the globalConfigAdmin address, which sets
     * pendingActivationBitcoinKitAddr and sets the bitcoinKitUpgradeStartTime to the current time.
     *
     * If there is already a pending globalConfigAdmin upgrade, it will be replaced with this new
     * global config admin and the countdown to upgrade activation will be reset (meaning the
     * previous not-yet-updated globalConfigAdmin address will never be used).
     * 
     * @param newGlobalConfigAdminAddr The new IBitcoinKit implementation to upgrade to after the upgrade delay
    */
    function initiateGlobalConfigAdminUpgrade(address newGlobalConfigAdminAddr) external notZeroAddress(address(newGlobalConfigAdminAddr)) onlyGlobalConfigAdmin {
        require(!globalConfigAdminUpgradePermDisabled, "global config admin upgrade perm disabled");
        pendingActivationGlobalConfigAdmin = newGlobalConfigAdminAddr;
        globalConfigAdminUpgradeStartTime = block.timestamp;
        emit GlobalConfigAdminUpgradeInitiated(newGlobalConfigAdminAddr);
    }

   /**
     * Reject (delete) a pending globalConfigAdmin upgrade. Can be called by globalConfigAdmin or
     * the address that the upgrade will update the globalConfigAdmin to in the future.
    */
    function rejectGlobalConfigAdminUpgrade() external senderPermissionCheck(pendingActivationGlobalConfigAdmin) {
        address temp = address(pendingActivationGlobalConfigAdmin);
        pendingActivationGlobalConfigAdmin = address(0);
        globalConfigAdminUpgradeStartTime = 0;
        emit GlobalConfigAdminUpgradeRejected(temp);
    }

    /**
     * Processes the globalConfigAdmin upgrade after the activation time has been reached. Can only
     * be called by the soon-to-be globalConfigAdmin as a form of accepting the global config admin
     * role.
     */
    function finalizeGlobalConfigAdminUpgrade() external {
        // Require the pending new global config admin to call this function to "accept" ownership
        require(msg.sender == pendingActivationGlobalConfigAdmin);
        require(globalConfigAdminUpgradeStartTime != 0, "a global config admin upgrade is not in progress");

        // Unlike other upgrades, if perm disable is set then the upgrade will be rejected
        require(!globalConfigAdminUpgradePermDisabled, "global config admin upgrades perm disabled");

        uint256 elapsed = block.timestamp - globalConfigAdminUpgradeStartTime;

        require(elapsed >= globalConfigAdminUpgradeDelay, 
        "the required global config admin upgrade delay has not elapsed");

        globalConfigAdmin = pendingActivationGlobalConfigAdmin;
        pendingActivationGlobalConfigAdmin = address(0);
        globalConfigAdminUpgradeStartTime = 0;
        emit GlobalConfigAdminUpgradeCompleted(globalConfigAdmin);
    }

    /**
     * Increases the delay for Global Config Admin upgrades. Note that the delay can only
     * be increased to a higher value than was already set, and cannot be reduced.
     * Only callable by the globalConfigAdmin.
     * 
     * @param newDelay The new delay in seconds to set for Global Config Admin upgrades
    */
    function increaseGlobalConfigAdminUpgradeDelay(uint256 newDelay) external onlyGlobalConfigAdmin {
        require(!globalConfigAdminUpgradePermDisabled, 
        "global config admin upgrading perm disabled, increasing delay would have no effect");

        require(newDelay > globalConfigAdminUpgradeDelay, "new delay must be longer than current delay");
        globalConfigAdminUpgradeDelay = newDelay;

        emit GlobalConfigAdminUpgradeDelayIncreased(newDelay);
    }
}