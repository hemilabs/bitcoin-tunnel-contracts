// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "./ISimpleBitcoinVaultFactoryHelper.sol";
import "./SimpleBitcoinVault.sol";

contract SimpleBitcoinVaultFactoryHelper is ISimpleBitcoinVaultFactoryHelper {
    function createSimpleBitcoinVault(address tunnelAdmin, address operatorAdmin, BTCToken bitcoinTokenContract, SimpleGlobalVaultConfig vaultConfig, ISimpleBitcoinVaultStateFactory vaultStateFactory, SimpleBitcoinVaultUTXOLogicHelper logicHelper) external returns (SimpleBitcoinVault vault) {
        return new SimpleBitcoinVault(tunnelAdmin, operatorAdmin, bitcoinTokenContract, vaultConfig, vaultStateFactory, logicHelper);
    }
}