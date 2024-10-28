// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../structs/BitcoinKitStructs.sol";

interface IBitcoinKit {
  function getUTXOsForBitcoinAddress(string calldata btcAddress, uint256 pageNumber, uint256 pageSize) external view returns (UTXO[] memory);
  function getTxConfirmations(bytes32 txId) external view returns (uint32 confirmations);
  function getBitcoinAddressBalance(string calldata btcAddress) external view returns (uint256 balance);
  function getScriptForAddress(string calldata btcAddress) external view returns (bytes memory script);
  function getTransactionByTxId(bytes32 txId) external view returns (Transaction memory);
  function getTransactionInputsByTxId(bytes32 txId) external view returns (Input[] memory);
  function getTransactionOutputsByTxId(bytes32 txId) external view returns (Output[] memory);
  function getLastHeader() external view returns (BitcoinHeader memory);
  function getHeaderN(uint32) external view returns (BitcoinHeader memory);
}