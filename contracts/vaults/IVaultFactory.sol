// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "./IBitcoinVault.sol";

/**
 * Interface for a VaultFactory implementation, which allow the creation of a specific type of
 * vault. Each VaultFactory implementation will have its own internal state for what configuration
 * to use to setup the specific vault type.
 *
 * If it is desired to permit multiple different implementations of a vault custodianship system, a
 * single IVaultFactory implementation can be created which allowxs deployment of different
 * underlying vault custodianship systems using the vaultType specified at vault creation which is
 * passed through by the BitcoinTunnelManager.
*/
interface IVaultFactory {
    event VaultCreated(address indexed vaultAddress, uint256 indexed index);

    /**
     * Creates a new vault for custodying Bitcoin.
     *
     * @param setupAdmin The address of the admin performing setup operations, if required.
     * @param tunnelAdmin The address of the interaction admin, generally a BitcoinTunnelManager.
     * @param operatorAdmin The address of the operator admin, if required.
     * @param vaultType The vault type to be created; only used when an IVaultFactory permits multiple vault types.
     *        Meaning of the vaultType value (if any) is up to the IVaultFactory implementation and is
     *        not guaranteed to be consistent across multiple different IVaultFactories.
     * @param extraInfo Arbitrary bytes that can contain additional data if required by the vault implementation.
     *
     * @return createdVault The vault that was created
    */
    function createVault(address setupAdmin,
                         address tunnelAdmin,
                         address operatorAdmin,
                         uint256 vaultType,
                         bytes memory extraInfo) 
                         external returns (IBitcoinVault createdVault);

    /**
     * Returns a string representation of the type of vault this factory creates
     *
     * @return vaultType The type of vault this factory creates
    */
    function getVaultType() external view returns (string memory vaultType);

    /**
     * Returns the number of children contracts that this factory has deployed.
     *
     * @return numChildren The number of children contracts
    */
    function getChildrenCount() external view returns (uint32 numChildren);

    /**
     * Gets the child contract the factory created at the specified index.
     *
     * @return child The child at the specified index
    */
    function getChild(uint32 index) external view returns (IBitcoinVault child);

    /**
     * Activates the factory, allowing vaults to be created. Used by GlobalConfig to make sure
     * vaults are not deployed before the factory is the activated factory which should be used for
     * vault deployments.
     *
     * Security note: should only be callable by the GlobalConfig
     * 
     * @param permittedVaultCreator The address which will be permitted to create new vaults
    */
    function activateFactory(address permittedVaultCreator) external;

    /**
     * Returns whether the factory is currently active.
     *
     * @return isActive Whether the factory is currently active.
    */
    function isFactoryActive() external view returns (bool isActive);

    /**
     * Marks an IVaultFactory as deprecated when it is being replaced. Vault Factory implementation
     * should make appropriate downstream global config updates to global config shared across
     * implementations of vaults that were created using this vault factory.
     *
     * Security note: should only be callable by the GlobalConfig
    */
    function deprecate() external;

    /**
     * Returns whether the factory has been deprecated.
     *
     * @return isDeprecated Whether the factory has been deprecated.
    */
    function isFactoryDeprecated() external view returns (bool isDeprecated);

    /**
     * Returns the admin of this factory which is able to activate and later deprecate this vault
     * factory.
     *
     * @return factoryStatusAdmin The status admin of this factory
    */
    function getFactoryStatusAdmin() external view returns (address factoryStatusAdmin);
}