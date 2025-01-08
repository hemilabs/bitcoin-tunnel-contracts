// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "../vaults/IVaultFactory.sol";
import "./MockBitcoinVault.sol";

contract MockVaultFactory is IVaultFactory {
    address factoryStatusAdminAddr; 

    mapping(uint256 => bool) allowedVaultTypes;

    mapping(uint32 => IBitcoinVault) children;
    uint32 childCount = 0;

    bool factoryActivated = false;

    bool factoryDeprecated = false;

    address public permittedVaultCreatorAddr;


    constructor(address factoryStatusAdmin) {
        factoryStatusAdminAddr = factoryStatusAdmin;
        setVaultTypeAllowed(1, true);
    }

    function setVaultTypeAllowed(uint256 typeInt, bool allowed) public {
        allowedVaultTypes[typeInt] = allowed;
    }

    function createVault(address,
                        address,
                        address,
                        uint256 vaultType,
                        bytes memory) 
                        external returns (IBitcoinVault createdVault) {
        require(allowedVaultTypes[vaultType]);
        require(factoryActivated);

        // None of the admin addresses or extra data are used, as that functionality is not tested
        // as part of the MockBitcoinVault interface itself, but rather specific implementations 
        // using some/all of those as they desire.
        MockBitcoinVault vault = new MockBitcoinVault();
        IBitcoinVault cast = IBitcoinVault(vault);

        children[childCount] = cast;

        emit VaultCreated(address(cast), childCount);
        childCount++;

        return cast;
    }

    /**
    * Returns a string representation of the type of vault this factory creates
    *
    * @return vaultType The type of vault this factory creates
    */
    function getVaultType() external pure returns (string memory vaultType) {
        return "MockBitcoinVault";
    }

    /**
    * Returns the number of children contracts that this factory has deployed.
    *
    * @return numChildren The number of children contracts
    */
    function getChildrenCount() external view returns (uint32 numChildren) {
        return childCount;
    }

    /**
    * Gets the child contract the factory created at the specified index.
    *
    * @return child The child at the specified index
    */
    function getChild(uint32 index) external view returns (IBitcoinVault child) {
        require(index < childCount);
        return children[index];
    }

    /**
    * Activates the factory, allowing vaults to be created. Used by GlobalConfig
    * to make sure vaults are not deployed before the factory is the activated
    * factory which should be used for vault deployments.
    *
    * Security note: should only be callable by the GlobalConfig
    */
    function activateFactory(address permittedVaultCreator) external {
        factoryActivated = true;
        permittedVaultCreatorAddr = permittedVaultCreator;
    }

    /**
    * Returns whether the factory is currently active.
    *
    * @return isActive Whether the factory is currently active.
    */
    function isFactoryActive() external view returns (bool isActive) {
        return factoryActivated;
    }

    /**
    * Marks an IVaultFactory as deprecated when it is being replaced.
    * Vault Factory implementation should make appropriate downstream global
    * config updates to global config shared across implementations of vaults
    * that were created using this vault factory.
    *
    * Security note: should only be callable by the GlobalConfig
    */
    function deprecate() external {
        factoryDeprecated = true;
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
    * Returns the admin of this factory which is able to activate and later
    * deprecate this vault factory.
    *
    * @return factoryStatusAdmin The status admin of this factory
    */
    function getFactoryStatusAdmin() external view returns (address factoryStatusAdmin) {
        return factoryStatusAdminAddr;
    }
}