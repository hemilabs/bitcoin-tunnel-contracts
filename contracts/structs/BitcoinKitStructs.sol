// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

struct UTXO {
  bytes32 txId;
  uint256 index;
  uint256 value; // in sats
  bytes scriptPubKey;
}

struct Transaction {
  // Bitflag1
  //bytes32 txHash;              // (bitflag1 - bit 7) Placeholder for includeTxHash (not implemented)
  bytes32 containingBlockHash;   // (bitflag1 - bit 6) For includeContainingBlock
  uint256 transactionVersion;    // (bitflag1 - bit 5) For includeVersion
  uint256 size;                  // (bitflag1 - bit 4) Transaction size
  uint256 vSize;                 // (bitflag1 - bit 4) Virtual size of the transaction
  // uint256 weight;             // (bitflag1 - bit 4) Transaction weight (not fully implemented)
  uint256 lockTime;              // (bitflag1 - bit 3) For includeLockTime
  Input[] inputs;                // (bitflag1 - bit 2) Array of inputs for includeInputs
  
  // Bitflag2
  Output[] outputs;              // (bitflag2 - bit 6) Array of outputs for includeOutputs

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

struct Input {
  uint256 inValue;               // (bitflag1 - bit 2) Sats spent by the input
  bytes32 inputTxId;             // (bitflag1 - bit 1) For includeInputSource
  uint256 sourceIndex;           // (bitflag1 - bit 1) Index of the input in its transaction
  bytes scriptSig;               // (bitflag1 - bit 0) For includeInputScriptSig
  uint256 sequence;              // (bitflag2 - bit 7) For includeInputSeq
  uint256 fullScriptSigLength;   // The full length of the scriptSig in the original transaction
  bool containsFullScriptSig;    // Whether the scriptSig is contained in its entirety, or was chopped due to size
}

struct Output {
  uint256 outValue;              // (bitflag2 - bit 6) In sats
  bytes script;                  // (bitflag2 - bit 5) For includeOutputScript
  string outputAddress;          // (bitflag2 - bit 4) For includeOutputAddress (if derivable)
  bool isOpReturn;               // (bitflag2 - bit 3) Indicates if this output is an OP_RETURN output
  bytes opReturnData;            // (bitflag2 - bit 3) Data contained in the OP_RETURN output, if applicable
  bool isSpent;                  // (bitflag2 - bit 2) For includeOutputSpent
  uint256 fullScriptLength;      // The full length of the output script in the original transaction
  bool containsFullScript;       // Whether the output script is contained in its entirety, or was chopped due to size
  SpentDetail spentDetail;       // (bitflag2 - bit 1) For includeOutputSpentBy
}

// TODO: Not implemented yet!
struct SpentDetail {
  bytes32 spendingTxId;          // (bitflag2 - bit 1) TxId of the transaction that spent this output
  uint256 inputIndex;            // (bitflag2 - bit 1) Index of the input in the spending transaction
}

struct BitcoinHeader {
  uint32 height;
  bytes32 blockHash;
  uint32 version;
  bytes32 previousBlockHash;
  bytes32 merkleRoot;
  uint32 timestamp;
  uint32 bits;
  uint32 nonce;
}