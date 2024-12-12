// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "../vaults/IBitcoinVault.sol";
import "./MockBitcoinVault.sol";
import "../vaults/SimpleBitcoinVault/SimpleBitcoinVaultState.sol";


import "hardhat/console.sol";

contract MockSimpleBitcoinVault is MockBitcoinVault {
    SimpleBitcoinVaultState public vaultStateChild;

    function setVaultStateChild(SimpleBitcoinVaultState child) external {
        vaultStateChild = child;
    }

    function callInternalInitializeWithdrawal(uint256 amountSats, uint256 withdrawalFeeSats, uint256 timestampRequested, bytes memory destinationScript, address evmOriginator) external returns (uint32 withdrawalNum, uint256 pendingWithdrawalAmount) {
        (withdrawalNum, pendingWithdrawalAmount)  = vaultStateChild.internalInitializeWithdrawal(
            amountSats, withdrawalFeeSats, timestampRequested, destinationScript, evmOriginator);
        return (withdrawalNum, pendingWithdrawalAmount);
    }
}