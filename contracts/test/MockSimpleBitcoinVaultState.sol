// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "../bitcoinkit/IBitcoinKit.sol";
import "../bitcoinkit/Utils.sol";
import "../vaults/SimpleBitcoinVault/SimpleBitcoinVaultStructs.sol";

import "hardhat/console.sol";

contract MockSimpleBitcoinVaultState is SimpleBitcoinVaultStructs {
    mapping(bytes32 => bool) acknowledgedDeposits;

    mapping(uint256 => uint256) depositFeeCalculations;

    mapping(uint32 => Withdrawal) withdrawals;

    mapping(bytes32 => uint256) acknowledgedDepositsToFees;

    mapping(bytes32 => uint256) acknowledgedDepositOutputIndexes;

    // key is keccak256(scriptHash + outValue)
    mapping(bytes32 => bool) withdrawalMatchFound;

    constructor() {
        // Do nothing
        // console.log("SimpleBitcoinVaultState deployer: %s", msg.sender);
    }

    function setDepositAcknowledged(bytes32 txid, bool acknowledged) external {
        acknowledgedDeposits[txid] = acknowledged;
    }

    function isDepositAcknowledged(bytes32 txid) external view returns (bool isAcknowledged) {
        return acknowledgedDeposits[txid];
    }

    function setDepositFee(uint256 depositAmount, uint256 feeToReturn) external {
        depositFeeCalculations[depositAmount] = feeToReturn;
    }

    function calculateDepositFee(uint256 depositAmount) external view returns (uint256 depositFeeSats) {
        return depositFeeCalculations[depositAmount];
    }

    function setWithdrawal(uint32 uuid, Withdrawal memory withdrawal) external {
        withdrawals[uuid] = withdrawal;
    }

    function getWithdrawal(uint32 uuid) external view returns (Withdrawal memory storedWithdrawal) {
        return withdrawals[uuid];
    }

    function setCollectableFees(bytes32 depositTxid, uint256 fees) external {
        acknowledgedDepositsToFees[depositTxid] = fees;
    }

    function getCollectableFees(bytes32 depositTxId) external view returns (uint256 collectableFees) {
        return acknowledgedDepositsToFees[depositTxId];
    }

    function setDepositOutputIndex(bytes32 depositTxid, uint256 outputIndex) external {
        acknowledgedDepositOutputIndexes[depositTxid] = outputIndex;
    }

    function getDepositOutputIndex(bytes32 depositTxId) external view returns (uint256 outputIndex) {
        return acknowledgedDepositOutputIndexes[depositTxId];
    }

    function calculateWithdrawalPendingMatchKey(bytes32 scriptHash, uint256 outputAmount) private pure returns (bytes32 key) {
        key = keccak256(abi.encodePacked(scriptHash, outputAmount));
        return key;
    }

    function setPendingWithdrawalMatch(bytes32 scriptHash, uint256 outputAmount, bool matchFound) external {
        bytes32 key = calculateWithdrawalPendingMatchKey(scriptHash, outputAmount);
        withdrawalMatchFound[key] = matchFound;
    }

    function checkPendingWithdrawalsForMatch(bytes32 scriptHash, uint256 outputAmount) external view returns (bool matchFound) {
        bytes32 key = calculateWithdrawalPendingMatchKey(scriptHash, outputAmount);
        return withdrawalMatchFound[key];
    }

}