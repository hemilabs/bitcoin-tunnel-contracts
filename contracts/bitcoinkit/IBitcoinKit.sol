// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./BitcoinKitStructs.sol";

interface IBitcoinKit {
    function getUTXOsForBitcoinAddress(string calldata btcAddress, uint32 pageNumber, uint32 pageSize) external view returns (UTXO[] memory);
    function getTxConfirmations(bytes32 txId) external view returns (uint32 confirmations);
    function getBitcoinAddressBalance(string calldata btcAddress) external view returns (uint64 balance);
    function getScriptForAddress(string calldata btcAddress) external view returns (bytes memory script);
    function isAddressValid(string calldata btcAddress) external view returns (bool);
    function transactionExists(bytes32 txId) external view returns (bool exists);
    function getTransactionByTxId(bytes32 txId) external view returns (Transaction memory);
    function getTransactionInputsByTxId(bytes32 txId) external view returns (Input[] memory);
    function getTransactionOutputsByTxId(bytes32 txId) external view returns (Output[] memory);
    function getTxInputCount(bytes32 txId) external view returns (uint32 txInputCount);
    function getTxOutputCount(bytes32 txId) external view returns (uint32 txOutputCount);
    function getSpecificTxInput(bytes32 txId, uint32 inputIndex) external view returns (Input memory);
    function getSpecificTxOutput(bytes32 txId, uint32 outputIndex) external view returns (Output memory);
    function getLastHeader() external view returns (BitcoinHeader memory);
    function getHeaderN(uint32 height) external view returns (BitcoinHeader memory);
}