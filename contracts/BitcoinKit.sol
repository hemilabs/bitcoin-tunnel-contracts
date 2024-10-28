// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./interfaces/IBitcoinKit.sol";
import "./utils/Utils.sol";

contract BitcoinKit is Utils {

  function getBitcoinAddressBalance(string calldata btcAddress) public view returns (uint256 balance) {
    bytes memory converted = bytes(btcAddress);
    (bool ok, bytes memory out) = address(0x40).staticcall(converted);
    require(ok, "Static call to btcBalAddr precompile (0x40) contract failed");
    
    return uint64(bytes8(out));
  }

  function getScriptForAddress(string calldata btcAddress) public view returns (bytes memory script) {
    bytes memory converted = bytes(btcAddress);
    (bool ok, bytes memory out) = address(0x46).staticcall(converted);
    require(ok, "Static call to btcBalAddr precompile (0x46) contract failed");
    
    return out;
  }

  /**
  * @dev Retrieves Bitcoin UTXOs for a given address, page number, and page size. This method constructs a 36-byte array consisting of the Bitcoin address in bytes followed by a 3-byte page number and a 1-byte page size, which it then sends in a static call to a precompiled contract expected at address `0x41`. The response from this call is decoded into an array of UTXO structs, each representing an unspent transaction output.
  *
  * Input for the static call is structured as follows:
  * - Bytes 0-31: Bitcoin address in ASCII bytes.
  * - Bytes 32-34: Page number, starting at 0.
  * - Byte 35: Page size, with a default of 10.
  *
  * An example input to get the most recent 16 UTXOs for "tb1qers3x7frsy5qry6aag2kh63a4y904jqa3tnn8t" would be:
  * "74623171657273337837667273793571727936616167326b6836336134793930346a716133746e6e387400000010"
  * which breaks down as the Bitcoin address in bytes followed by "000000" for page 0 and "10" for a page size of 16.
  *
  * The response format expected is:
  * - First byte: Number of UTXOs returned (<= page size).
  * - Following bytes: Repeated pattern of 32-byte TxID, 2-byte index, and 8-byte value in sats.
  *
  * @param btcAddress The Bitcoin address for which to retrieve UTXOs.
  * @param pageNumber The page number for pagination, starting at 0.
  * @param pageSize The number of UTXOs to return per page.
  * @return utxos An array of UTXO structs, each containing details about an unspent transaction output.
  */
  function getUTXOsForBitcoinAddress(string calldata btcAddress, uint256 pageNumber, uint256 pageSize) public view returns (UTXO[] memory) {
    bytes memory addrMem = bytes(btcAddress);
    bytes memory parameter = new bytes(addrMem.length + 4); // Bitcoin address + Page number (3 bytes) + Page Size (1 byte)

    for (uint i = 0; i < addrMem.length; i++) {
      parameter[i] = addrMem[i];
    }

    // Convert pageNumber and pageSize to bytes and append
    bytes memory pageNumberBytes = abi.encodePacked(uint24(pageNumber));
    bytes memory pageSizeBytes = abi.encodePacked(uint8(pageSize));

    for (uint i = 0; i < 3; i++) {
      parameter[addrMem.length + i] = pageNumberBytes[i];
    }

    parameter[addrMem.length + 3] = pageSizeBytes[0];

    // Make staticcall to precompile
    (bool ok, bytes memory out) = address(0x41).staticcall(parameter);
    require(ok, "Static call to btcUtxosAddrList precompile (0x41) contract failed");

    // Grab precompile answer
    uint8 numUTXOs = uint8(out[0]);
    UTXO[] memory utxos = new UTXO[](numUTXOs);

    // Convert answer into UTXO data
    uint256 pos = 1;
    for (uint8 i = 0; i < numUTXOs; i++) {
      bytes32 txId = bytesToBytes32(slice(out, pos, 32));
      uint256 index = toUintFromSlice(slice(out, pos + 32, 2));
      uint256 value = toUintFromSlice(slice(out, pos + 34, 8));

      utxos[i] = UTXO(txId, index, value, new bytes(0)); // scriptPubKey ignored for now
      pos += 42;
    }

    return utxos;
  }

  function getTransactionByTxId(bytes32 txId) external view returns (Transaction memory) {
    // Configuring bitflag1
    uint8 bitflag1 = 0;
    
    // placeholder for includeTxHash
    bitflag1 |= (1 << 6); // Include containing block info
    bitflag1 |= (1 << 5); // Include transaction version
    bitflag1 |= (1 << 4); // Include size, vSize, and weight
    bitflag1 |= (1 << 3); // Include locktime
    bitflag1 |= (1 << 2); // Include inputs information
    bitflag1 |= (1 << 1); // Include TxID and source index for each input
    bitflag1 |= (1 << 0); // Include input scriptSig

    // Configuring bitflag2
    uint8 bitflag2 = 0;

    bitflag2 |= (1 << 7); // Include input sequence
    bitflag2 |= (1 << 6); // Include outputs
    bitflag2 |= (1 << 5); // Include output script information
    bitflag2 |= (1 << 4); // Include output address
    bitflag2 |= (1 << 3); // Include unspendable outputs (ex: OP_RETURN)
    bitflag2 |= (1 << 2); // Include output spent status
    bitflag2 |= (1 << 1); // Include information on where the output was spent
    
    // Setting bitflag3 with two 3-bit values for maxInputsExponent and maxOutputsExponent
    uint8 bitflag3 = 0;

    // To limit to 2^0 = 1 inputs/outputs, set X=0 for both maxInputsExponent and maxOutputsExponent
    uint8 maxInputsExponent = 5; // This example sets it to 2^5 = 32
    uint8 maxOutputsExponent = 5; // Similarly, for outputs

    // Assign the exponents to bitflag3, considering the first two bits are unused
    // maxInputsExponent occupies bits 3-5 (xxXXXxxx)
    // maxOutputsExponent occupies bits 0-2 (xxxxxxXXX)
    bitflag3 |= (maxInputsExponent << 3);
    bitflag3 |= maxOutputsExponent;

    // Setting bitflag4 with two 2-bit values for maxInputScriptSigSizeExponent and maxOutputScriptSizeExponent
    uint8 bitflag4 = 0;

    // To limit script sizes to 2^(0+4) = 16 bytes, set both exponents to 0
    uint8 maxInputScriptSigSizeExponent = 2; // Limits input scripts to 64 bytes
    uint8 maxOutputScriptSizeExponent = 2; // Limits output scripts to 64 bytes

    // Assign the exponents to bitflag4, considering the first four bits are unused
    // maxInputScriptSigSizeExponent occupies bits 2-3 (xxxxXXxx)
    // maxOutputScriptSizeExponent occupies bits 0-1 (xxxxxxXX)
    bitflag4 |= (maxInputScriptSigSizeExponent << 2);
    bitflag4 |= (maxOutputScriptSizeExponent << 0);

    (bool ok, bytes memory out) = address(0x42).staticcall(abi.encodePacked(txId, bitflag1, bitflag2, bitflag3, bitflag4));
    require(ok, "Static call to btcTxByTxid precompile (0x42) contract failed");
    require(out.length > 0, "Bitcoin transaction not found");

    uint256 offset = 0;

    Transaction memory txRet;

    txRet.containingBlockHash = bytesToBytes32(slice(out, offset, 32));
    offset += 32;
    txRet.transactionVersion = toUintFromSlice(slice(out, offset, 4));
    offset += 4;
    txRet.size = toUintFromSlice(slice(out, offset, 4));
    offset += 4;
    txRet.vSize = toUintFromSlice(slice(out, offset, 4));
    offset += 4;
    txRet.lockTime = toUintFromSlice(slice(out, offset, 4));
    offset += 4;

    (txRet.inputs, offset, txRet.totalInputs) = parseTransactionInputs(out, offset, uint8(0x01 << maxInputsExponent), uint8(0x01 << (4 + maxInputScriptSigSizeExponent)));
    (txRet.outputs, offset, txRet.totalOutputs) = parseTransactionOutputs(out, offset, uint8(0x01 << maxOutputsExponent), uint8(0x01 << (4 + maxOutputScriptSizeExponent)));

    if (txRet.totalInputs == txRet.inputs.length) {
      txRet.containsAllInputs = true;
    }
    if (txRet.totalOutputs == txRet.outputs.length) {
      txRet.containsAllOutputs = true;
    }

    return txRet;
  }

  function parseTransactionInputs(bytes memory data, uint256 offset, uint8 maxInputs, uint8 maxScriptSigSize) internal pure returns (Input[] memory, uint256, uint16) {
    uint16 numInputsTotal = uint16(toUintFromSlice(slice(data, offset, 2)));
    offset += 2;

    uint16 numInputsToRead = numInputsTotal;
    if (maxInputs < numInputsToRead) {
      numInputsToRead = maxInputs;
    }

    Input[] memory inputs = new Input[](numInputsToRead);

    for (uint256 i = 0; i < numInputsToRead; i++) {
        inputs[i].inValue = toUintFromSlice(slice(data, offset, 8));
        offset += 8;

        inputs[i].inputTxId = bytesToBytes32(slice(data, offset, 32));
        offset += 32;

        inputs[i].sourceIndex = toUintFromSlice(slice(data, offset, 2));
        offset += 2;

      uint16 fullScriptSigLength = uint16(toUintFromSlice(slice(data, offset, 2)));
      offset += 2;

      inputs[i].fullScriptSigLength = fullScriptSigLength;
      uint16 scriptSigSizeToRead = fullScriptSigLength;
      if (maxScriptSigSize < scriptSigSizeToRead) {
        scriptSigSizeToRead = maxScriptSigSize;
      } else {
        inputs[i].containsFullScriptSig = true;
      }
      inputs[i].scriptSig = slice(data, offset, scriptSigSizeToRead);
      offset += scriptSigSizeToRead;

      inputs[i].sequence = toUintFromSlice(slice(data, offset, 4));
      offset += 4;
    }

    return (inputs, offset, numInputsTotal);
  }

  function parseTransactionOutputs(bytes memory data, uint256 offset, uint8 maxOutputs, uint8 maxScriptSize) internal pure returns (Output[] memory, uint256, uint16) {
    uint16 numOutputsTotal = uint16(toUintFromSlice(slice(data, offset, 2)));
    offset += 2;

    uint16 numOutputsToRead = numOutputsTotal;
    if (maxOutputs < numOutputsToRead) {
      numOutputsToRead = maxOutputs;
    }

    Output[] memory outputs = new Output[](numOutputsToRead);

    for (uint256 i = 0; i < numOutputsToRead; i++) {
      outputs[i].outValue = toUintFromSlice(slice(data, offset, 8));
      offset += 8;

      uint16 fullScriptLength = uint16(toUintFromSlice(slice(data, offset, 2)));
      offset += 2;

      outputs[i].fullScriptLength = fullScriptLength;
      uint16 scriptSizeToRead = fullScriptLength;
      if (maxScriptSize < scriptSizeToRead) {
        scriptSizeToRead = maxScriptSize;
      } else {
        outputs[i].containsFullScript = true;
      }
      outputs[i].script = slice(data, offset, scriptSizeToRead);
      offset += scriptSizeToRead;

      // uint addressLength = uint8(data[offset++]);
      // outputs[i].outputAddress = string(slice(data, offset, addressLength));
      // offset += addressLength;

      outputs[i].isSpent = data[offset++] != 0;

      // if isSpent, populate spentDetail
      // if(outputs[i].isSpent) {
      //  outputs[i].spentDetail.spendingTxId = bytesToBytes32(slice(data, offset, 32));
      //  offset += 32;
      //  outputs[i].spentDetail.inputIndex = toUintFromSlice(slice(data, offset, 2));
      //  offset += 2;
      // }
    }

    return (outputs, offset, numOutputsTotal);
  }

  function getTxConfirmations(bytes32 txId) public view returns (uint32 confirmations) {
    (bool ok, bytes memory out) = address(0x43).staticcall(abi.encode(txId));
    require(ok, "Static call to btcTxConfirmations precompile (0x43) contract failed");
    require(out.length > 0, "Bitcoin transaction not found");
    return uint32(bytes4(out));
  }

  function parseHeader(bytes memory data) internal pure returns (BitcoinHeader memory) {
    uint256 offset = 0;
    uint32 height = uint32(toUintFromSlice(slice(data, offset, 4)));
    offset += 4;
    bytes32 blockHash = bytes32(slice(data, offset, 32));
    offset += 32;
    uint32 version = uint32(toUintFromSlice(slice(data, offset, 4)));
    offset += 4;
    bytes32 previousBlockHash = bytes32(slice(data, offset, 32));
    offset += 32;
    bytes32 merkleRoot = bytes32(slice(data, offset, 32));
    offset += 32;
    uint32 timestamp = uint32(toUintFromSlice(slice(data, offset, 4)));
    offset += 4;
    uint32 bits = uint32(toUintFromSlice(slice(data, offset, 4)));
    offset += 4;
    uint32 nonce = uint32(toUintFromSlice(slice(data, offset, 4)));
    offset += 4;


    BitcoinHeader memory header;
    header.height = height;
    header.blockHash = blockHash;
    header.version = version;
    header.previousBlockHash = previousBlockHash;
    header.merkleRoot = merkleRoot;
    header.timestamp = timestamp;
    header.bits = bits;
    header.nonce = nonce;

    return header;
  }

  function getLastHeader() public view returns (BitcoinHeader memory) {
    (bool ok, bytes memory out) = address(0x44).staticcall("");
    require(ok, "Static call to btcLastHeader precompile (0x44) contract failed");
    require(out.length > 0, "Failed to retrieve last Bitcoin header");

    return parseHeader(out);
  }

  function getHeaderN(uint32 height) public view returns (BitcoinHeader memory) {
    (bool ok, bytes memory out) = address(0x45).staticcall(abi.encodePacked(height));
    require(ok, "Static call to btcHeaderN precompile (0x45) contract failed");
    require(out.length > 0, "Failed to retrieve specified Bitcoin header");

    return parseHeader(out);
  }
}