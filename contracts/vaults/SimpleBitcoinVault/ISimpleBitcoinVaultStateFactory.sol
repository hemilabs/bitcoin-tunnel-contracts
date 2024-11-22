// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "./SimpleBitcoinVaultState.sol";
import "./SimpleBitcoinVault.sol";
import "./SimpleGlobalVaultConfig.sol";
import "../../BTCToken.sol";


interface ISimpleBitcoinVaultStateFactory {
    function createSimpleBitcoinVaultState(SimpleBitcoinVault parentVault, address operatorAdmin, SimpleGlobalVaultConfig vaultConfig, BTCToken btcTokenContract) external returns (SimpleBitcoinVaultState);
}