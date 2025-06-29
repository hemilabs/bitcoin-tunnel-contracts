// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "./ISimpleBitcoinVaultStateFactory.sol";
import "./SimpleBitcoinVaultState.sol";

contract SimpleBitcoinVaultStateFactory is ISimpleBitcoinVaultStateFactory {
    function createSimpleBitcoinVaultState(SimpleBitcoinVault parentVault, address operatorAdmin, SimpleGlobalVaultConfig vaultConfig, BTCToken btcTokenContract) external returns (SimpleBitcoinVaultState vaultState) {
        return new SimpleBitcoinVaultState(parentVault, operatorAdmin, vaultConfig, btcTokenContract);
    }
}