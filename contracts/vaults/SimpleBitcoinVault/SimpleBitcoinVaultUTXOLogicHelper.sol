// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "../IBitcoinVault.sol";
import "./SimpleGlobalVaultConfig.sol";
import "./SimpleBitcoinVault.sol";
import "../VaultUtils.sol";
import "../../oracles/IAssetPriceOracle.sol";
import "./SimpleBitcoinVaultStructs.sol";
import "../../BTCToken.sol";
import "./SimpleBitcoinVaultState.sol";

/**
 * The SimpleBitcoinVaultUTXOLogicHelper is a stateless utility function that abstracts some of the
 * logic for UTXO management tasks like confirming deposits, finalizing withdrawals, and checking
 * for misbehavior.
 *
 * Multiple SimpleBitcoinVaults can all use the same deployment of this contract; all functions
 * have all required state-related values passed in.
*/
contract SimpleBitcoinVaultUTXOLogicHelper is SimpleBitcoinVaultStructs, VaultUtils {
    uint32 public constant MAX_SWEEP_UTXO_WALKBACK = 10;

    function checkDepositConfirmationValidity(bytes32 txid,
                                              uint256 outputIndex,
                                              IBitcoinKit bitcoinKit,
                                              bytes32 vaultCustodyScriptHash,
                                              SimpleBitcoinVaultState vaultStateChild,
                                              uint256 minimumDepositSats) external view returns 
                                              (bool success,
                                              uint256 netDepositSats,
                                              uint256 depositFeeSats,
                                              address depositor) {
        // Only permit one deposit per TxID regardless of whether multiple outputs were to the
        // Vault's custodianship address.
        require (!vaultStateChild.isDepositAcknowledged(txid), "txid has already been confirmed");
        require (outputIndex < 8, "output index must be one of the first 8 outputs");

        // The depositor must format the deposit Bitcoin transaction to contain the Bitcoin output
        // corresponding to this vault and the OP_RETURN with their EVM address to credit for the
        // deposit within the number of outputs returned by the BitcoinKit's built-in
        // getTransactionByTxId.
        Transaction memory btcTx = bitcoinKit.getTransactionByTxId(txid);

        require(outputIndex < btcTx.outputs.length, 
        "claimed outputIndex is greater than the number of outputs accessible in transaction");

        depositor = address(0);

        uint256 outputMaxLen = btcTx.outputs.length;
        if (outputMaxLen > 8) {
            outputMaxLen = 8;
        }

        for (uint32 idx = 0; idx < outputMaxLen; idx++) {
            Output memory output = btcTx.outputs[idx];

            // The EVM address to credit for the deposit must be in an OP_RETURN. Permitted formats:
            //   1. The 20 bytes of the address (22 byte output total)
            //   2. 40 bytes representing a 20-byte address in ASCII (hex) (42 byte output total)
            if (output.script.length >= 22 && output.script[0] == 0x6a) {
                if (output.script.length == 22) {
                    // OP_RETURN OP_PUSHBYTES_40 <20 byte address>
                    depositor = bytesToAddressOffset(output.script, 2);
                    break;
                } else if (output.script.length == 42) {
                    bytes memory extractedAddress = hexAsciiBytesToBytes(output.script, 2, 42);
                    depositor = bytesToAddress(extractedAddress);
                    break;
                }
            }
        }

        // Ensure an EVM address to credit was properly extracted from OP_RETURN
        require(depositor != address(0), "could not extract an EVM address to credit from deposit");

        // Convert BTC custodianship address to the script and ensure the claimed deposit output
        // actually locked funds to this script
        Output memory claimedDepositOutput = btcTx.outputs[outputIndex];
        require(keccak256(claimedDepositOutput.script) == vaultCustodyScriptHash, 
        "claimed deposit output script must match vault holding pen script");

        // Check amount of sats deposited
        uint256 satsDepositedFromOutput = claimedDepositOutput.outValue;
        require(satsDepositedFromOutput >= minimumDepositSats, 
        "deposit must meet the minimum deposit size threshold");

        depositFeeSats = vaultStateChild.calculateDepositFee(satsDepositedFromOutput);

        require(satsDepositedFromOutput > depositFeeSats, 
        "the amount of sats deposited must exceed the fees charged by the vault");

        netDepositSats = satsDepositedFromOutput - depositFeeSats;

        return(true, netDepositSats, depositFeeSats, depositor);
    }

    /**
     * Extracts the first 4 bytes of the OP_RETURN script and converts to uint32 which
     * should be set by the operator as the vault-specific (32-bit) withdrawal uuid
     */
    function extractWithdrawalIndexFromOpReturn(bytes memory opReturnScript) public pure returns (uint32) {
        // Minimum of two bytes of scaffolding (0x6a + PUSHBYTES), then 4 bytes for uint32
        require(opReturnScript.length >= 6, "op return script not long enough");

        require(opReturnScript[0] == 0x6a, "not an op_return script");

        // For OP_RETURNs containing 75 bytes or less of extra data, the extra data starts at 3rd byte (index 2)
        uint8 cursor = 2;

        // Bitcoin has up to OP_PUSHBYTES_75, so if the length of opReturnScript is > 77, there is an extra
        // byte before the data starts (0x6a + OP_PUSHDATA1 + <LENGTH>)
        if (opReturnScript.length > 77) {
            cursor = 3;
        }

        return (uint32(uint8(opReturnScript[cursor])) << 24) | 
            (uint32(uint8(opReturnScript[cursor + 1])) << 16) | 
            (uint32(uint8(opReturnScript[cursor + 2])) << 8) |
            (uint32(uint8(opReturnScript[cursor + 3])));
    }

    function checkWithdrawalFinalizationValidity(bytes32 txid,
                                                 uint32 withdrawalIndex,
                                                 IBitcoinKit bitcoinKit,
                                                 bytes32 vaultCustodyScriptHash, 
                                                 bytes32 currentSweepUTXO, 
                                                 uint256 currentSweepUTXOOutput,
                                                 SimpleBitcoinVaultState vaultStateChild) external view returns 
                                                 (uint256 feesOverpaid, 
                                                 uint256 feesCollected,
                                                 uint256 withdrawalAmount,
                                                 bool createdOutput,
                                                 uint256 outputValue) {
        
        // Get the actual withdrawal transaction from Bitcoin based on the txid
        Transaction memory btcTx = bitcoinKit.getTransactionByTxId(txid);

        require(btcTx.inputs.length == 1, "withdrawal transaction must only have one input");
        require(btcTx.inputs[0].inputTxId == currentSweepUTXO && btcTx.inputs[0].sourceIndex == currentSweepUTXOOutput,
        "withdrawal transaction must consume the current sweep utxo");
        require(btcTx.outputs.length >= 2 && btcTx.outputs.length < 4, "withdrawal transaction must have at least two outputs and no more than three");

        Withdrawal memory withdrawal = vaultStateChild.getWithdrawal(withdrawalIndex);
        require(withdrawal.amount > 0, "withdrawal does not exist");

        Output memory withdrawalOutput = btcTx.outputs[0];
        require(keccak256(withdrawalOutput.script) == keccak256(withdrawal.destinationScript), 
        "script of first output of withdrawal tx must match script of requested withdrawal");

        require((withdrawal.amount - withdrawal.fee) == withdrawalOutput.outValue, 
        "amount of first withdrawal tx output must exactly match expected net after fees");

        uint256 outValue = withdrawalOutput.outValue;

        if (btcTx.outputs.length > 2) {
            // If the withdrawal transaction has three outputs, the 2nd output is the new sweep
            // and 3rd is the OP_RETURN identifying the withdrawal
            // If the withdrawal transaction has more than three outputs it is invalid.

            // Ensure the 2nd output pays to this vault's address
            require(vaultCustodyScriptHash == keccak256(btcTx.outputs[1].script), 
            "withdrawal transaction has 2nd output but it does not return change to this vault's BTC address");

            require(extractWithdrawalIndexFromOpReturn(btcTx.outputs[2].script) == withdrawalIndex,
            "extracted withdrawal index from op_return does not match withdrawal index");
            
            // Should never happen but check anyway
            require(btcTx.outputs[2].outValue == 0, "op_return must not have a nonzero output value");

            // At this point outValue = withdrawalOutput.outValue = btcTx.outputs[0].outValue
            outValue = outValue + btcTx.outputs[1].outValue;

            // Only one input, so input value of entire withdrawal is just the inValue of the first
            // input which spends the current sweep
            uint256 btcFeesPaid = btcTx.inputs[0].inValue - outValue;

            // Operator gets net of collected fees minus the fees actually paid on BTC
            feesCollected = 0;
            feesOverpaid = 0;
            if (withdrawal.fee > btcFeesPaid) {
                // Fee paid on Bitcoin is < fees paid by withdrawer, so collect fees
                feesCollected = withdrawal.fee - btcFeesPaid;
            } else {
                // If the fees paid on Bitcoin is exactly the same as the withdrawal fees, then
                // feesOverpaid = 0, otherwise the operator paid more in fees than were paid by the
                // withdrawer
                feesOverpaid = btcFeesPaid - withdrawal.fee;
            }

            // New sweep UTXO is the 2nd output (index 1) of this Bitcoin transaction
            return (feesOverpaid, feesCollected, withdrawal.amount, true, btcTx.outputs[1].outValue);
        } else {
            // There are only two outputs, which is only allowed if the output completely clears out
            // all BTC held by the vault based on confirmed deposits. This is a rare edge case
            // because it also means that the operator decided to pay exactly the remaining UTXO
            // value as the BTC fees so is unlikely to happen in practice, but an operator may elect
            // to pay more than the required BTC fees rather than create a dust transaction that
            // they would later have to abandon.
            //
            // If this occurs, then set the current sweep UTXO to nothing, and the next deposit will
            // set a new sweep as the deposit itself similar to the first deposit to a vault.
            //
            // First output is the withdrawal, and 2nd output is the OP_RETURN identifying the withdrawal.

            require(extractWithdrawalIndexFromOpReturn(btcTx.outputs[1].script) == withdrawalIndex,
            "extracted withdrawal index from op_return does not match withdrawal index");
            
            // Should never happen but check anyway
            require(btcTx.outputs[1].outValue == 0, "op_return must not have a nonzero output value");

            uint256 btcFeesPaid = btcTx.inputs[0].inValue - outValue;

            if (withdrawal.fee > btcFeesPaid) {
                // Fee paid on Bitcoin is < fees paid by withdrawer, so collect fees
                feesCollected = withdrawal.fee - btcFeesPaid;
            } else {
                // No change was returned as a new sweep, so there was an overpayment
                feesOverpaid = btcFeesPaid - withdrawal.fee;
            }

            // No sweep UTXO, so return a "null" UTXO
            return (feesOverpaid, feesCollected, withdrawal.amount, false, 0);
        }
    }

    /**
     * Checks the validity of a sweep TxId in the context of the provided vault custody script hash
     * (keccak256 of Bitcoin script where vault funds must be custodied), the current sweep UTXO
     * information, and the state of sweepable deposits provided by the vault's
     * SimpleBitcoinVaultState contract.
     * 
     * @param sweepTxId The transaction ID of the sweep transaction on Bitcoin to check
     * @param bitcoinKit The BitcoinKit implementation to use
     * @param vaultCustodyScriptHash The keccak256 hash of the BTC script used for vault custody
     * @param currentSweepUTXO The TxID of the current sweep UTXO which should be sweeped by sweepTxId into a new sweep UTXO
     * @param currentSweepUTXOOutput The output index of the current sweep UTXO which should be sweeped by sweepTxId into a new sweep UTXO
     * @param vaultStateChild The SimpleBitcoinVaultState contract relevant to the vault calling this function
     * 
     * @return sweptValue The net value in sats swept as part of the sweep transaction
     * @return netDepositValue The net value in sats of deposits that were swept after collected fees
     */
    function checkSweepValidity(bytes32 sweepTxId, 
                                IBitcoinKit bitcoinKit, 
                                bytes32 vaultCustodyScriptHash, 
                                bytes32 currentSweepUTXO, 
                                uint256 currentSweepUTXOOutput,
                                SimpleBitcoinVaultState vaultStateChild) external view returns (int256 sweptValue, uint256 netDepositValue, uint256 newSweepOutputValue, bytes32[] memory sweptDeposits) {
        require(sweepTxId != bytes32(0), "sweep txid cannot be zero");

        require(bitcoinKit.transactionExists(sweepTxId), "sweep transaction is not known by hVM");

        // Get the actual withdrawal transaction from Bitcoin based on the txid
        Transaction memory btcTx = bitcoinKit.getTransactionByTxId(sweepTxId);

        require(btcTx.totalInputs >= 2 && btcTx.totalInputs <= 8,
        "a sweep transaction must have at least two inputs and no more than eight");

        require(btcTx.totalOutputs == 1, "a sweep transaction must have a single output");

        Input memory oldSweep = btcTx.inputs[0];
        require(oldSweep.inputTxId == currentSweepUTXO && oldSweep.sourceIndex == currentSweepUTXOOutput,
        "first input of sweep must consume old sweep UTXO");

        // Ensures that the output of this sweep goes to the Bitcoin script associated with this
        // vault's BTC custodianship address
        require(vaultCustodyScriptHash == keccak256(btcTx.outputs[0].script),
        "sweep transaction must output funds to this vault's BTC custodianship address");

        uint256 oldSweepValue = btcTx.inputs[0].inValue;

        // The value of all swept deposits minus their respective charged fees
        netDepositValue = 0;

        // Total fees collected, before we remove BTC transaction fee paid to process sweep
        // transaction on Bitcoin
        uint256 totalFees = 0;

        // The deposit txids that are swept to mark as fees collected by caller
        sweptDeposits = new bytes32[](btcTx.inputs.length - 1);

        // Loop through all remaining inputs, checking that they are each a confirmed deposit that
        // has not already been swept
        for (uint32 idx = 1; idx < btcTx.inputs.length; idx++) {
            Input memory depositIn = btcTx.inputs[idx];

            uint256 depositFee = vaultStateChild.getCollectableFees(depositIn.inputTxId);

            // Deposit either not yet acknowledged or already swept. If already swept, the
            // depositFee is set to 0.
            require(depositFee > 0, "deposit fee must be greater than zero, either not acknowledged or already swept");

            // Make sure that the input index is the same as the output index of the deposit
            // transaction that was confirmed
            require(vaultStateChild.getDepositOutputIndex(depositIn.inputTxId) == depositIn.sourceIndex,
            "sweep must spend the input using an input index that matches the output index of the confirmed deposit");

            uint256 inValue = depositIn.inValue;
            uint256 net = inValue - depositFee;
            netDepositValue = netDepositValue + net;
            totalFees = totalFees + depositFee;

            sweptDeposits[idx-1] = depositIn.inputTxId;
        }

        Output memory newSweep = btcTx.outputs[0];

        // Calculate the net amount swept as the value of the output minus the original sweep value
        sweptValue = int256(newSweep.outValue) - int256(oldSweepValue);

        return (sweptValue, netDepositValue, newSweep.outValue, sweptDeposits);
    }

    /**
     * Checks whether a Bitcoin transaction that spends one or more confirmed deposits is invalid.
     * The only reason such a transacion can occur is for a sweep, and most of the validity checks
     * that the sweep is valid can be done on the transaction itself and the sweep can be
     * immediately rejected in most cases:
     *   - Transaction has <2 or >8 inputs
     *   - Transaction spends a UTXO that isn't a confirmed deposit as one of its sweep inputs
     *   - Transaction outputs funds to more than one output
     *   - Transaction has single output but that output is not to this vault's custodianship BTC script
     * 
     *
     * However as detailed later in this function, there is an possible case where the sweep is
     * plausible but validity is predicated on a specific sweep UTXO being valid in the future,
     * which cannot be determined without crawling through the chain and checking that a valid
     * combination of sweeps and withdrawals connect this possibly-correct sweep to the currently
     * known sweep.
     * 
     * For example:
     * [currentSweep]->[withdrawal1]->[sweep1]->[THIS BLAMED SWEEP]
     * 
     * Since we only know about [currentSweep], we need to check that [THIS BLAMED SWEEP] spends
     * what would be the sweep output of [sweep1], which in turn spends what would be the sweep
     * output of [withdrawal1], which in turn spends [currentSweep], thereby connecting the chain.
     *
     * Additionally, it is possible that a valid withdrawal will remove the sweep entirely and
     * require the operator to choose one of the confirmed deposits to treat as the new sweep, which
     * would mean a potentially valid future sweep transaction would not connect directly to the
     * purported future-valid sweep UTXO that this sweep consumes.
     * 
     * For example:
     * [currentSweep]->[withdrawal1_noChangeSweep] (*operator sets new sweep*) [manualSweep]->[THIS BLAMED SWEEP]
     * 
     * This is unsupported operator behavior, and this function will not attempt to walk
     * currentSweep forward to find a break where a new sweep could be set by the operator which
     * then makes the transaction chain that arrives at this blamed sweep transaction possible.
     * While this would be possible to calculate (only in the case there is a single disconnect), it
     * would give the operator the ability to steal funds in a way that evades detection for longer
     * than desired, as the operator could process a withdrawal that spends the full sweep UTXO,
     * then create a manual sweep of confirmed deposits which assumes a particular confirmed deposit
     * is set to the new sweep, and then steal the funds out of the sweep UTXO.
     *
     * This misbehavior would eventually be detected, but the operator could control this detection
     * timing by delaying updating the sweep after the withdrawal that doesn't output a sweep. They
     * could also potentially delay detection longer by claiming a different sweep than the one
     * needed to detect the misbehavior and then spend that sweep in another withdrawal that creates
     * a new disconnection.
     *
     * As a result, if an operator creates a withdrawal with no sweep outputs and then spends a
     * confirmed deposit in another Bitcoin transaction before they select a new confirmed deposit
     * UTXO to treat as the new sweep, their vault can be liquidated for misbehavior.
     *
     * In general, operators should instead sweep enough confirmed deposits FIRST, rather than
     * processing a withdrawal that requires a payout amount so close to (or exactly matching) the
     * current sweep UTXO's balance such that the operator does not want to (due to dust) or can't
     * process a withdrawal that returns some funds to the vault in a usable sweep.
     *
     * If the operator does process such a withdrawal, they must wait until they can communicate
     * that withdrawal to the protocol and select a new UTXO to use as the sweep before processing
     * additional sweeps.
     *
     * Additionally due to gas limitations, this function will only crawl through 10 transactions,
     * otherwise it would be possible for operators to create a long seemingly-valid chain that
     * disconnects and misbehaves far in its history and produce a false negative by exhausting the
     * gas available to the reporter to detect the misbehavior. As a result, operators must also be
     * careful not to create chains of sweeps and withdrawals unknown to the protocol that are
     * longer than this.
     * 
     * Note that the full validity check for each withdrawal or sweep is not performed when crawling
     * the chain - if one of these transactions is incorrect, then that will be provable by proving
     * that transaction specifically rather than blaming this later (also possibly incorrect) sweep.
     *
     * The purpose of this algorithm is to check whether a plausible link between the current sweep
     * UTXO and this transaction exists. If one of the intermediate transactions is the problem,
     * then the reporter can communicate all the transactions between the one that spends the
     * currently known sweep UTXO and the problematic transaction using a mix of
     * finalizeWithdrawal() and processSweep() and then prove that intermediate transaction is
     * invalid.
     * 
     * For example, if the following transaction graph exists:
     * [currentSweep]->[withdrawal1]->[sweep1]->[sweep2]->[withdrawal2]->[THIS BLAMED SWEEP]
     * 
     * Then crawling through the chain will be able to connect [currentSweep] to [THIS BLAMED SWEEP],
     * and either:
     *   1. [withdrawal1], [sweep1], [sweep2], [withdrawal2] are all valid, in which case 
     *      [THIS BLAMED SWEEP] will be valid (as its validity is only predicated on [withdrawal2]'s
     *      supposed sweep output being correct as all other checks have been accounted for by this 
     *      function), OR
     *   2. One of [withdrawal1], [sweep1], [sweep2], [withdrawal2] is invalid, and that can be 
     *      proven by anyone. If for example [sweep2] is the problem, the reporter could process 
     *      [withdrawal1] and [sweep1], and then call reportInvalidSweepSpend([sweep2]).
     * 
     * The algorithm for crawling through the chain is as follows:
     *   1. Walk backwards from the claimed-invalid transaction's first input (which if this
     *      transaction is valid must be the sweep spend input)
     *      a. For each transaction, check its input and output count to determine whether
     *         it is a plausible withdrawal, plausible sweep, or neither. (If neither, 
     *         then no plausible connection exists and this transaction is invalid).
     *      b. If the first input (index 0) of the plausible withdrawal or sweep matches the
     *         current sweep, then this transaction is plausibly valid, exit without misbehavior.
     *      c. If this first input is not the sweep:
     *         i. If the input index is >=2, transaction is invalid as a withdrawal will output
     *            sweep UTXO at index 1, and a sweep will output sweep UTXO at index 0. The only
     *            way a valid sweep UTXO could have an index >=2 is if it's a confirmed deposit
     *            which is directly set as the sweep UTXO to use, and if that is the case then
     *            that should be the current sweep UTXO (and 1.b would have caught) since we don't
     *            support a disconnected graph that would require the operator to set a new UTXO
     *            as the sweep.
     *        ii. If the input index is 1, check that the previous transaction is a plausible
     *            withdrawal (not plausible sweep), and if not this transaction is invalid.
     *       iii. If the input index is 0, check that the previous transaction is a plausible
     *            sweep (not plausible withdrawal) and if not this transaction is invalid.
     *        iv. If we have checked 10 transactions, transaction is invalid. Otherwise, go
     *            to 1.a using the previous transaction as the transaction to check. 
     * 
     * @param txid The transaction ID of the transaction the reporter is claiming spends a confirmed deposit UTXO incorrectly
     * @param inputIndexToBlame The input index the reporter claims spends the confirmed deposit UTXO incorrectly
     * @param bitcoinKit The BitcoinKit implementation to use
     * @param vaultCustodyScriptHash The keccak256 hash of the BTC script used for vault custody
     * @param currentSweepUTXO The TxID of the current sweep UTXO which should be sweeped by sweepTxId into a new sweep UTXO
     * @param currentSweepUTXOOutput The output index of the current sweep UTXO which should be sweeped by sweepTxId into a new sweep UTXO
     * @param vaultStateChild The SimpleBitcoinVaultState contract relevant to the vault calling this function
     * 
     * @return Whether the provided transaction is an invalid spend of a confirmed deposit UTXO
     */
    function checkConfirmedDepositSpendInvalidity(bytes32 txid,
                                                  uint32 inputIndexToBlame,
                                                  IBitcoinKit bitcoinKit,
                                                  bytes32 vaultCustodyScriptHash,
                                                  bytes32 currentSweepUTXO,
                                                  uint256 currentSweepUTXOOutput,
                                                  SimpleBitcoinVaultState vaultStateChild) external view returns (bool) {
        require(bitcoinKit.transactionExists(txid), "transaction is not known by hVM");

        uint32 txInputCount = bitcoinKit.getTxInputCount(txid);

        require(inputIndexToBlame < txInputCount, "input does not exist in transaction");

        uint32 txOutputCount = bitcoinKit.getTxOutputCount(txid);
        // Get the input the reporter is claiming spends the confirmed-but-unswept deposit UTXO
        Input memory sweepSpendInput = bitcoinKit.getSpecificTxInput(txid, inputIndexToBlame);

        // Make sure that the claimed input is actually a spend of a confirmed-but-unswept deposit UTXO
        require(vaultStateChild.getCollectableFees(sweepSpendInput.inputTxId) > 0, 
        "claimed input is not a confirmed but unswept deposit");

        // Make sure that the claimed input has a source index that matches the output index of the deposit UTXO
        require(vaultStateChild.getDepositOutputIndex(sweepSpendInput.inputTxId) == sweepSpendInput.sourceIndex,
        "claimed input spends the wrong output of a confirmed but unswept deposit");

        // At this point, the transaction has been confirmed to spend a confirmed-but-unswept deposit UTXO,
        // so begin checks to see if anything about this transaction itself would not constutite a valid sweep.

        if (txInputCount > 8) {
            // Sweeps cannot have more than 8 inputs (1 previous sweep and 7 confirmed-but-unswept deposit UTXOs)
            return true; 
        }

        if (txOutputCount != 1) {
            // Sweeps must only produce a single output which is the new sweep UTXO
            return true;
        }

        if (inputIndexToBlame == 0) {
            // Sweeps cannot spend a confirmed deposit as the first input (index 0). It is possible
            // for an operator to process a withdrawal that consumes the sweep UTXO entirely and requires
            // the operator to set a new confirmed deposit as the new sweep UTXO, but per the protocol they
            // must select this confirmed deposit as the new sweep with their tunnel contract before using
            // it as a sweep UTXO on Bitcoin, therefore if this code identifies a spend of a confirmed 
            // deposit the operator has misbehaved.
            return true;
        }

        Transaction memory fullTx = bitcoinKit.getTransactionByTxId(txid);
        if (vaultCustodyScriptHash != keccak256(fullTx.outputs[0].script)) {
            // Sweeps must send the swept funds to the vault's BTC custodianship address's corresponding script
            return true;
        }

        // Check that all inputs other than the sweep spend actually spend a confirmed deposit.
        // Assumes that BitcoinKit returns at least 8 inputs in the standard transaction call.
        // Even if BitcoinKit did not return all 8 inputs, it would be possible to call this
        // function with the other index which is an invalid spend, which would confirm invalid
        // confirmed deposit spending earlier in this function  rather than blaming a valid
        // confirmed deposit spend which is invalid because of another input in the same
        // transaction being invalid which this section handles. This section is included as
        // a convenience so a caller who saw their input spent in an invalid sweep that is not
        // confirmed can call this function and successfully demonstrate an incorrect confirmed
        // deposit spend without having to track down the other input to the transaction which
        // specifically makes it invalid.
        for (uint32 idx = 1; idx < fullTx.inputs.length; idx++) {
            Input memory depositIn = fullTx.inputs[idx];

            uint256 depositFee = vaultStateChild.getCollectableFees(depositIn.inputTxId);

            // If the deposit fee is zero, then this is not a confirmed-but-unswept deposit UTXO, so
            // this transaction must be invalid
            if (depositFee == 0) {
                return true;
            }

            // If the source index does not match the deposit output, then this transaction does not
            // spend a confirmed-but-unswept deposit UTXO, so this transaction must be invalid
            if (vaultStateChild.getDepositOutputIndex(depositIn.inputTxId) != depositIn.sourceIndex) {
                return true;
            }
        }

        // At this point, the transaction has passed all self-contained sweep validity checks,
        // so walk backwards and attempt to find a connection across plausible sweep and/or 
        // withdrawal transactions to the current sweep UTXO.
        bytes32 txToCheck = fullTx.inputs[0].inputTxId;
        uint256 outputIndexToCheck = fullTx.inputs[0].sourceIndex;

        for (uint32 idx = 0; idx < MAX_SWEEP_UTXO_WALKBACK; idx++) {
            // If we found the current sweep UTXO known by the protocol, then we found a plausible
            // connection and this sweep transaction is not invalid (or if it is invalid, it's due
            // to a previous withdrawal or sweep in the transaction graph we analyzed being invalid
            // and that should be reported separately).
            if (txToCheck == currentSweepUTXO) {
                if (outputIndexToCheck == currentSweepUTXOOutput) {
                     // Found the current sweep UTXO and output index matches what was spent downstream
                     // in our traversal.
                    return false;
                } else {
                    // Spends the wrong output from the right sweep-UTXO-containing transaction.
                    // It is not possible that continuing to traverse will get us to the known 
                    // sweep UTXO, because no withdrawal or sweep transaction could spend any other
                    // output of the sweep-UTXO-containing transaction that isn't the actual sweep
                    // UTXO as the sweep input (input index 0) and still be valid.
                    return true;
                }
            }

            txInputCount = bitcoinKit.getTxInputCount(txToCheck);
            txOutputCount = bitcoinKit.getTxOutputCount(txToCheck);

            if (txInputCount == 1) {
                // Must be a withdrawal or invalid

                if (txOutputCount != 3) {
                    // Can only traverse backwards through outputs which output a sweep UTXO,
                    // meaning they would have exactly three outputs. If not exactly three outputs,
                    // then this could be a valid withdrawal transaction but it would be one without
                    // a change output, meaning there is no connected sweep walkback chain and
                    // therefore the potential sweep we are analyzing must be invalid.
                    return true;
                }

                if (outputIndexToCheck != 1) {
                    // The output of this transaction which we traversed backwards through is
                    // not 1, and a withdrawal must always output its new sweep UTXO as output
                    // at index 1, therefore the previous tx we are analyzing must be invalid
                    // because it did not spend what should be the sweep UTXO from this potential
                    // withdrawal.
                    return true;
                }

                // At this point, this is a plausable withdrawal. It could be invalid, but it
                // has the right geometry so continue walking backwards. If it is invalid,
                // then if our traversal does not find any problems deeper, a reporter will
                // be able to communicate the transactions up to this withdrawal to the protocol
                // and then report this withdrawal for being invalid, rather than demonstrating
                // invalidity of the original potential sweep this function is analyzing.

                // Withdrawal only has one input which is the sweep, so check that transaction next.
                Input memory input = bitcoinKit.getSpecificTxInput(txToCheck, 0);
                txToCheck = input.inputTxId;
                outputIndexToCheck = input.sourceIndex;

            } else {
                // Must be a sweep or invalid

                if (txInputCount > 8) {
                    // No sweep transaction can have more than 8 inputs, so the potential sweep we
                    // are analyzing must be invalid.
                    return true;
                }

                if (txOutputCount != 1) {
                    // No sweep transaction can have more than 1 output, so the potential sweep we
                    // are analyzing must be invalid.
                    return true;
                }

                if (outputIndexToCheck != 0) {
                    // The output of this transaction which we traversed backwards through is
                    // not 0, and a sweep must always output its new sweep UTXO as output
                    // at index 0, therefore the previous tx we are analyzing must be invalid
                    // because it did not spend what should be the sweep UTXO from this potential
                    // sweep.
                    // Should not be possible due to previous check that the output count must be 1,
                    // but additional sanity check.
                    return true;
                }

                // At this point, this is a plausible sweep. It could be invalid, but it has the
                // right geometry so continue walking backwards. If it is invalid, then if our
                // traversal does not find any problems deeper, a reporter will be able to
                // communicate the transactions up to this withdrawal to the protocol and then
                // report this withdrawal for being invalid, rather than demonstrating invalidity of
                // the original potential sweep this function is analyzing.

                // Sweep always spends the sweep as its first input, so check that tarnsaction next.
                Input memory input = bitcoinKit.getSpecificTxInput(txToCheck, 0);
                txToCheck = input.inputTxId;
                outputIndexToCheck = input.sourceIndex;
            }
        }

        // Did not find the current sweep UTXO in the permitted number of backwards traversals, so
        // either sweep is completely invalid or operator violated the protocol rules by creating
        // too long of a chain of transactions that weren't communicated to the protocol. Either
        // way, the transaction is considered proof of operator misbehavior.
        return true;
    }

    /**
     * Checks whether a sweep spend is invalid (not a valid withdrawal fulfillment or sweep
     * transaction).
     *
     * This function will only detect invalidity if the transaction does in fact spend the known
     * current sweep. If there are withdrawal finalizations or sweeps that need to be processed to
     * progress the protocol's knowledge of the current sweep to the one misspent by this
     * transaction, those transactions must be processed by the reporter first, so that this
     * function can see that the misbehavior does occur in a transaction that actually spends a
     * sweep that the vault considers valid, otherwise false positives could occur.
     *
     * If the sweep UTXO is misspent for any reason, it will be possible to process for anyone to
     * process all of the transactions that provide context such that this function can detect it.
     *
     * It's also possible for the operator to misbehave by not sweeping confirmed deposits correctly
     * in the first place, which is reported and handled differently and does not relate to this
     * function's logic.
     *
     * @param txid The TxID of the Bitcoin transaction to check validity for 
     * @param inputIndexToBlame The input index the reporter claims spends the sweep UTXO incorrectly
     * @param bitcoinKit The BitcoinKit implementation to use 
     * @param vaultCustodyScriptHash The keccak256 hash of the Bitcoin locking script that sweep outputs must be sent to 
     * @param currentSweepUTXO The TxID of the current sweep UTXO which is purported to be mis-spent 
     * @param currentSweepUTXOOutput The output index of the current sweep UTXO which is purported to be mis-spent 
     * @param vaultStateChild The SimpleBitcoinVaultState contract relevant to the vault calling this function
     */
    function checkSweepSpendInvalidity(bytes32 txid, 
                                       uint32 inputIndexToBlame,
                                       IBitcoinKit bitcoinKit,
                                       bytes32 vaultCustodyScriptHash,
                                       bytes32 currentSweepUTXO,
                                       uint256 currentSweepUTXOOutput,
                                       SimpleBitcoinVaultState vaultStateChild) external view returns (bool) {
        require(bitcoinKit.transactionExists(txid), "transaction is not known by hVM");

        uint32 txInputCount = bitcoinKit.getTxInputCount(txid);

        require(inputIndexToBlame < txInputCount, "input does not exist in transaction");

        uint32 txOutputCount = bitcoinKit.getTxOutputCount(txid);

        // Get the input the reporter is claiming spends the sweep UTXO
        Input memory sweepSpendInput = bitcoinKit.getSpecificTxInput(txid, inputIndexToBlame);

        // Check that the claimed input actually spends the current sweep UTXO. This transaction
        // *could* be invalid but requires the reporter to process additional withdrawal
        // finalization of sweep transactions before the current sweep UTXO is updated
        require(sweepSpendInput.inputTxId == currentSweepUTXO && sweepSpendInput.sourceIndex == currentSweepUTXOOutput,
        "transaction does not spend the current sweep utxo");

        if (txInputCount > 8) {
            // Definitely invalid, as neither a withdrawal or sweep can consume more than 8 inputs
            return true;
        }

        if (txInputCount == 1) {
            // The only way this could be valid is as a withdrawal, so check if it aligns with any
            // pending withdrawal
            
            // A withdrawal cannot have less than two or more than tree outputs
            if (txOutputCount < 2 || txOutputCount > 3) {
                return true;
            }

            // Check if the transaction matches any pending withdrawal in the queue. Only need to
            // check the pending queue, because if this transaction is for a withdrawal that has
            // already been processed, then the input wouldn't match our current sweep UTXO, since
            // the sweep UTXO would have been replaced with the change from that finalized
            // withdrawal.

            // The 1st output (index=0) must be the output that fulfills the withdrawal itself, so
            // if it doesn't match any pending withdrawal it is invalid.
            Output memory withdrawalFulfillmentOutput = bitcoinKit.getSpecificTxOutput(txid, 0);

            bool matchesPendingWithdrawal = vaultStateChild.checkPendingWithdrawalsForMatch(
                keccak256(withdrawalFulfillmentOutput.script),
                withdrawalFulfillmentOutput.outValue);

            if (!matchesPendingWithdrawal) {
                return true;
            }

            // The 2nd output (index=1) should have the Bitcoin locking script corersponding to this
            // vault as the output destination, if it does not it is invalid
            Output memory sweepChangeOutput = bitcoinKit.getSpecificTxOutput(txid, 1);
            bytes32 changeOutputScriptHash = keccak256(sweepChangeOutput.script);
            if (vaultCustodyScriptHash != changeOutputScriptHash) {
                return true;
            }
        } else {
            // If more than one input, then this could only be a sweep transaction.

            // A sweep transaction cannot have more than one output, so if it does it is invalid
            if (txOutputCount != 1) {
                return true;
            }

            // Get full transaction which is more efficient for checking potentially many inputs
            Transaction memory fullTx = bitcoinKit.getTransactionByTxId(txid);

            // A sweep transaction must send funds to this vault's BTC address
            Output memory sweepOutput = fullTx.outputs[0];
            bytes32 sweepOutputScriptHash = keccak256(sweepOutput.script);
            if (vaultCustodyScriptHash != sweepOutputScriptHash) {
                // Sends to a destination other than this vault's BTC address
                return true;
            }

            // A sweep tranaction must spend only acknowledged but unswept deposits
            for (uint32 idx = 1; idx < fullTx.inputs.length; idx++) {
                bytes32 depositInputTxId = fullTx.inputs[idx].inputTxId;
                uint256 depositSourceIndex = fullTx.inputs[idx].sourceIndex;

                uint256 collectableFee = vaultStateChild.getCollectableFees(depositInputTxId);

                uint256 expectedSourceIndex = vaultStateChild.getDepositOutputIndex(depositInputTxId);

                if (collectableFee == 0 || depositSourceIndex != expectedSourceIndex) {
                    // If the fee is zero, this is either a deposit that was not yet confirmed (and
                    // the operator should not have swept before confirming), or this is a deposit
                    // that has already been swept.

                    // If the source index of this input doesn't match the output index for the
                    // corresponding deposit txid, then this is an invalid sweep because it spends a
                    // different input from the deposit transaction than the deposit UTXO which
                    // should have been swept.
                    return true;
                }
            }
        }

        // No misbehavior found
        return false;
    }
}