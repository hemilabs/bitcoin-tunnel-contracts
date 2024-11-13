// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "./SimpleBitcoinVault.sol";
import "./SimpleGlobalVaultConfig.sol";
import "./SimpleBitcoinVaultUTXOLogicHelper.sol";
import "../../BTCToken.sol";

/**
 * This ISimpleBitcoinVaultFactoryHelper is an interface for the SimpleBitcoinVaultFactoryHelper
 * to use, which allows us to extract away the code which creates Simple Bitcoin Vaults in order
 * to avoid importing SimpleBitcoinVault directly in the SimpleBitcoinVaultFactory and exceeding
 * the Spurious Dragon codesize limit.
 */
interface ISimpleBitcoinVaultFactoryHelper {
    function createSimpleBitcoinVault(address tunnelAdmin, address operatorAdmin, BTCToken bitcoinTokenContract, SimpleGlobalVaultConfig vaultConfig, ISimpleBitcoinVaultStateFactory vaultStateFactory, SimpleBitcoinVaultUTXOLogicHelper utxoLogicHelper) external returns (SimpleBitcoinVault vault);
}