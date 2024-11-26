// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "../bitcoinkit/IBitcoinKit.sol";
import "../bitcoinkit/Utils.sol";
import "hardhat/console.sol";

contract MockBitcoinKit is IBitcoinKit, Utils {
    struct TransactionMetadata {
        bytes32 containingBlockHash;   // (bitflag1 - bit 6) For includeContainingBlock
        uint256 transactionVersion;    // (bitflag1 - bit 5) For includeVersion
        uint256 size;                  // (bitflag1 - bit 4) Transaction size
        uint256 vSize;                 // (bitflag1 - bit 4) Virtual size of the transaction
        uint256 lockTime;              // (bitflag1 - bit 3) For includeLockTime

        // How many inputs actually exist in the original transaction; can be larger than the length of the inputs array
        // if there were more inputs than allowed based on the maxInputsExponent passed to the precompile call
        uint256 totalInputs;

        // How many outputs actually exist in the original transaction; can be larger than the length of the outputs array
        // if there were more outputs than allowed based on the maxOutputsExponent passed to the precompile call
        uint256 totalOutputs;

        // Whether more inputs exist in the original transaction than in this parsed format
        bool containsAllInputs;

        // Whether more outputs exist in the original transaction than in this parsed format.
        // NOTE: If OP_RETURNs are disabled by bitflags, then this reflects the quantity of outputs excluding OP_RETURNs.
        bool containsAllOutputs;
    }

    uint32 public currentHeight;

    mapping(bytes32 => uint64) public addressToBalance;
    mapping(bytes32 => UTXO[]) public addressToUtxos;
    mapping(bytes32 => uint32) public addressToUtxosLen;

    mapping(bytes32 => uint32) public txToContainingBlockHeight;
    mapping(bytes32 => bool) public txExists;

    mapping(bytes32 => bytes) public addressToScript;

    mapping(bytes32 => bool) public addressValid;

    mapping(bytes32 => TransactionMetadata) public txidToTransactionMetadata;
    mapping(bytes32 => Input[]) public txidToTransactionInputs;
    mapping(bytes32 => uint256) public txidToTransactionInputsLength;
    mapping(bytes32 => Output[]) public txidToTransactionOutputs;
    mapping(bytes32 => uint256) public txidToTransactionOutputsLength;


    // For setting transaction inputs/outputs above the list given in a full transaction to
    // mock out BitcoinKit only returning a subset of transactions with the full transaction
    // call but providing higher-index inputs/outputs when specifically requested
    mapping(bytes32 => mapping(uint32 => Input)) public txidToTransactionInputsSpecific;
    mapping(bytes32 => mapping(uint32 => Output)) public txidToTransactionOutputsSpecific;

    mapping(uint32 => BitcoinHeader) public bitcoinHeaders;
    uint32 highestBitcoinHeaderHeight = 0;

    constructor() {
        // Do nothing
        // console.log("BitcoinKit deployer: %s", msg.sender);
    }

    function setUTXOsForBitcoinAddress(string calldata btcAddress, UTXO[] memory utxos) external {
        bytes32 key = keccak256(abi.encode(btcAddress));
        uint32 prevUtxosLen = addressToUtxosLen[key];
        if (prevUtxosLen > 0) {
            delete addressToUtxos[key];
        }
        for (uint32 i = 0; i < utxos.length; i++) {
            addressToUtxos[key].push(utxos[i]);
        }
        // addressToUtxos[keccak256(abi.encode(btcAddress))] = utxos;
        addressToUtxosLen[keccak256(abi.encode(btcAddress))] = uint32(utxos.length);
    }

    function getUTXOsForBitcoinAddress(string calldata btcAddress, uint32 pageNumber, uint32 pageSize) external view returns (UTXO[] memory) {
        uint32 startIndex = pageSize * pageNumber;
        uint32 endIndexExclusive = startIndex + pageSize;

        uint32 utxosLen = addressToUtxosLen[keccak256(abi.encode(btcAddress))];
        if (endIndexExclusive > utxosLen ) {
            endIndexExclusive = utxosLen;
        }

        if (endIndexExclusive < startIndex) {
            // Nothing to return
            return new UTXO[](0);
        }

        UTXO[] memory full = addressToUtxos[keccak256(abi.encode(btcAddress))];

        UTXO[] memory utxos = new UTXO[](endIndexExclusive - startIndex);
        for (uint32 count = startIndex; count < endIndexExclusive; count++) {
            utxos[count - startIndex] = full[count];
        }

        return utxos;
    }

    function setTxBlock(bytes32 txId, uint32 height) external {
        txToContainingBlockHeight[txId] = height;
        txExists[txId] = true;
    }

    function setCurrentBtcHeight(uint32 height) external {
        currentHeight = height;
    }

    function getTxConfirmations(bytes32 txId) external view returns (uint32 confirmations) {
        if (!txExists[txId]) {
            return 0;
        }
        uint32 height = txToContainingBlockHeight[txId];
        return (currentHeight - height);
    }

    function setBitcoinAddressBalance(string calldata btcAddress, uint64 balance) public {
        addressToBalance[keccak256(abi.encode(btcAddress))] = balance;
    }

    function getBitcoinAddressBalance(string calldata btcAddress) public view returns (uint64 balance) {
        return addressToBalance[keccak256(abi.encode(btcAddress))];
    }

    function setScriptForAddress(string calldata btcAddress, bytes calldata script) external {
        addressToScript[keccak256(abi.encode(btcAddress))] = script;
    }

    function getScriptForAddress(string calldata btcAddress) external view returns (bytes memory script) {
        return addressToScript[keccak256(abi.encode(btcAddress))];
    }

    function setAddressValid(string calldata btcAddress, bool validity) external {
        addressValid[keccak256(abi.encode(btcAddress))] = validity;
    }

    function isAddressValid(string calldata btcAddress) external view returns (bool) {
        return addressValid[keccak256(abi.encode(btcAddress))];
    }

    function transactionExists(bytes32 txId) external view returns (bool exists) {
        TransactionMetadata memory metadata = txidToTransactionMetadata[txId];
        if (metadata.totalInputs > 0 || metadata.totalOutputs > 0) {
            return true;
        }
        return false;
    }

    function setTransactionByTxId(bytes32 txId, Transaction memory txn) external {
        TransactionMetadata memory txCopy;

        txCopy.containingBlockHash = txn.containingBlockHash;
        txCopy.transactionVersion = txn.transactionVersion;
        txCopy.size = txn.size;
        txCopy.vSize = txn.vSize;
        txCopy.lockTime = txn.lockTime;

        // Input[] memory inputsCopy = new Input[](txn.inputs.length);
        // Output[] memory outputsCopy = new Output[](txn.outputs.length);

        for (uint32 i = 0; i < txn.inputs.length; i++) {
            txidToTransactionInputs[txId].push(txn.inputs[i]);
        }
        txidToTransactionInputsLength[txId] = txn.inputs.length;

        for (uint32 i = 0; i < txn.outputs.length; i++) {
            txidToTransactionOutputs[txId].push(txn.outputs[i]);
        }
        txidToTransactionOutputsLength[txId] = txn.outputs.length;

        txCopy.totalInputs = txn.totalInputs;
        txCopy.containsAllInputs = txn.containsAllInputs;
        
        txCopy.totalOutputs = txn.totalOutputs;
        txCopy.containsAllOutputs = txn.containsAllOutputs;

        txidToTransactionMetadata[txId] = txCopy;
    }

    function setTransactionSpecificInputByTxId(bytes32 txId, uint32 inputIndex, Input memory input) external {
        txidToTransactionInputsSpecific[txId][inputIndex] = input;
    }

    function setTransactionSpecificOutputByTxId(bytes32 txId, uint32 outputIndex, Output memory output) external {
        txidToTransactionOutputsSpecific[txId][outputIndex] = output;
    }

    function getTransactionByTxId(bytes32 txId) external view returns (Transaction memory) {
        Transaction memory reconstituted;
        TransactionMetadata memory metadata = txidToTransactionMetadata[txId];

        reconstituted.containingBlockHash = metadata.containingBlockHash;
        reconstituted.transactionVersion = metadata.transactionVersion;
        reconstituted.size = metadata.size;
        reconstituted.vSize = metadata.vSize;
        reconstituted.lockTime = metadata.lockTime;

        uint32 inputsLen = uint32(txidToTransactionInputsLength[txId]);

        Input[] memory inputs = new Input[](inputsLen);
        for (uint32 i = 0; i < inputsLen; i++) {
            inputs[i] = txidToTransactionInputs[txId][i];
        }

        uint32 outputsLen = uint32(txidToTransactionOutputsLength[txId]);
        Output[] memory outputs = new Output[](outputsLen);
        for (uint32 i = 0; i < outputsLen; i++) {
            outputs[i] = txidToTransactionOutputs[txId][i];
        }

        reconstituted.inputs = inputs;
        reconstituted.outputs = outputs;

        reconstituted.totalInputs = metadata.totalInputs;
        reconstituted.totalOutputs = metadata.totalOutputs;
        reconstituted.containsAllInputs = metadata.containsAllInputs;
        reconstituted.containsAllOutputs = metadata.containsAllOutputs;

        return reconstituted;
    }

    function getTransactionInputsByTxId(bytes32 txId) external view returns (Input[] memory) {
        return txidToTransactionInputs[txId];
    }

    function getTransactionOutputsByTxId(bytes32 txId) external view returns (Output[] memory) {
        return txidToTransactionOutputs[txId];
    }

    function getTxInputCount(bytes32 txId) external view returns (uint32 txInputCount) {
        TransactionMetadata memory metadata = txidToTransactionMetadata[txId];
        return uint32(metadata.totalInputs);
    }

    function getTxOutputCount(bytes32 txId) external view returns (uint32 txOutputCount) {
        TransactionMetadata memory metadata = txidToTransactionMetadata[txId];
        return uint32(metadata.totalOutputs);
    }

    function getSpecificTxInput(bytes32 txId, uint32 inputIndex) external view returns (Input memory) {
        if (inputIndex < txidToTransactionInputs[txId].length) {
            return txidToTransactionInputs[txId][inputIndex];
        } else {
            return txidToTransactionInputsSpecific[txId][inputIndex];
        }
    }

    function getSpecificTxOutput(bytes32 txId, uint32 outputIndex) external view returns (Output memory) {
        if (outputIndex < txidToTransactionOutputs[txId].length) {
            return txidToTransactionOutputs[txId][outputIndex];
        } else {
            return txidToTransactionOutputsSpecific[txId][outputIndex];
        }
    }

    function addHeader(uint32 height, BitcoinHeader memory header) external {
        bitcoinHeaders[height] = header;
        if (height > highestBitcoinHeaderHeight) {
            highestBitcoinHeaderHeight = height;
        }
    }


    function getLastHeader() external view returns (BitcoinHeader memory) {
        return bitcoinHeaders[highestBitcoinHeaderHeight];
    }


    function getHeaderN(uint32 height) external view returns (BitcoinHeader memory) {
        return bitcoinHeaders[height];
    }
}