// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "../vaults/IBitcoinVault.sol";
import "./MockBitcoinVault.sol";
import "../vaults/SimpleBitcoinVault/SimpleBitcoinVaultState.sol";
import "../vaults/CommonStructs.sol";


import "hardhat/console.sol";

contract MockSimpleBitcoinVault is MockBitcoinVault {
    uint256 public constant MINIMUM_WITHDRAWAL_SATS = 1000000;

    SimpleBitcoinVaultState public vaultStateChild;

    Status vaultStatus;

    function setVaultStateChild(SimpleBitcoinVaultState child) external {
        vaultStateChild = child;
    }

    function callInternalInitializeWithdrawal(uint256 amountSats, uint256 withdrawalFeeSats, uint256 timestampRequested, bytes memory destinationScript, address evmOriginator) external returns (uint32 withdrawalNum, uint256 pendingWithdrawalAmount) {
        (withdrawalNum, pendingWithdrawalAmount)  = vaultStateChild.internalInitializeWithdrawal(
            amountSats, withdrawalFeeSats, timestampRequested, destinationScript, evmOriginator);
        return (withdrawalNum, pendingWithdrawalAmount);
    }

    function callSaveWithdrawalFulfillment(uint32 uuid, bytes32 fulfillmentTxId, uint256 withdrawalAmount) external {
        vaultStateChild.saveWithdrawalFulfillment(uuid, fulfillmentTxId, withdrawalAmount);
    }

    function callIncreaseTotalDepositsHeld(uint256 increase) external {
        vaultStateChild.increaseTotalDepositsHeld(increase);
    }

    function callUpdateOperatorAdmin(address newOperatorAdmin) external {
        vaultStateChild.updateOperatorAdmin(newOperatorAdmin);
    }

    function setVaultStatus(Status status) external {
        vaultStatus = status;
    }

    function hasNeverGoneLive() external view returns (bool) {
        return (vaultStatus == Status.CREATED || vaultStatus == Status.INITIALIZING);
    }
}