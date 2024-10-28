// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "../IBitcoinVault.sol";
import "./SimpleGlobalVaultConfig.sol";
import "./SimpleBitcoinVault.sol";
import "../VaultUtils.sol";
import "../../oracles/IAssetPriceOracle.sol";
import "./SimpleBitcoinVaultStructs.sol";

/**
* The SimpleBitcoinVaultState offloads holding and updating much of the
* state requierd for operation of a SimpleBitcoinVault:
*   - Minimum collateral amount in atomic units (fixed at construction based on config at time)
*   - Soft and hard collateralization thresholds
*   - Updates to soft collateralization threshold
*   - Minimum and bps-based deposit/withdrawal fees
*   - Pending collateral withdrawals
*/

contract SimpleBitcoinVaultState is SimpleBitcoinVaultStructs {
    event MinDepositFeeSatsUpdated(uint256 indexed newMinDepositFeeSats);
    event DepositFeeBpsUpdated(uint256 indexed newDepositFeeBps);

    event MinWithdrawalFeeSatsUpdated(uint256 indexed newMinWithdrawalFeeSats);
    event WithdrawalFeeBpsUpdated(uint256 indexed newWIthdrawalFeeBps);

    /**
    * The onlyParentVault modifier is used on all functions that should
    * *only* be callable by the SimpleBitcoinVault that owns this SimpleBitcoinVaultState.
    */
    modifier onlyParentVault() {
        require(msg.sender == address(parentVault));
        _;
    }

    /**
    * The onlyOperatorAdmin modifier is used on all functions that should
    * *only* be callable by the operatorAdmin.
    */
    modifier onlyOperatorAdmin() {
        require(msg.sender == operatorAdmin);
        _;
    }

    // The activation time for softCollateralizationThreshold increases
    uint256 public constant SOFT_COLLATERALIZATION_THRESHOLD_INCREASE_DELAY_SECONDS = 4 * 60 * 60; // 4 hours

    // The activation time for increases to deposit fees
    // Set to 4 hours to give time for on-Bitcoin activity to clear before increases affect deposits
    uint256 public constant DEPOSIT_FEE_INCREASE_DELAY_SECONDS = 4 * 60 * 60; // 4 hours

    // The activation time for increases to withdrawal fees
    // Set to 5 minutes to give time for on-Hemi activity to clear before increases affect withdrawals
    uint256 public constant WITHDRAWAL_FEE_INCREASE_DELAY_SECONDS = 1 * 60 * 60; // 1 hour

    // The operatorAdmin is stored here as well as in the parent for efficiency.
    // For many vault administration tasks like modifying soft collateralization thresholds,
    // updating minimum fees, and initiating partial collateral withdrawals, the operator
    // will interact directly with the SimpleBitcoinVaultState contract. An update to operatorAdmin
    // can only be initiated at the SimpleBitcoinVault level which will call the update function
    // here to perform the corersponding update.
    address public operatorAdmin;

    // The SimpleBitcoinVault that this SimpleBitcoinVaultState holds and updates state for
    SimpleBitcoinVault parentVault;

    // The same vaultConfig that is applied globally across all instances of SimpleBitcoinVault
    // and their corresponding instances of SimpleBitcoinVaultState
    SimpleGlobalVaultConfig vaultConfig;


    // The softCollateralizationThreshold this vault uses; must be >= the one
    // provided by SimpleGlobalVaultConfig.
    uint256 public softCollateralizationThreshold;

    // A pending change to the softCollateralizationThreshold this vault uses,
    // requires 4 hours before activation to be applied so that user deposits
    // made based on a lower threshold will be deposited before lower threshold
    // goes into effect. Not used if the collaterization threshold is lowered
    // (more deposits can be handled) as that will not affect user deposits in
    // progress.
    uint256 public pendingSoftCollateralizationThreshold;

    // The timestamp when the soft collateralization threshold increase was 
    // requested. Used to finalize the collateralization threshold update.
    uint256 public pendingSoftCollateralizationThresholdUpdateTime;

    // The hardCollateralizationThreshold this vault uses; is set at construction
    // to the value provided by SimpleGlobalVaultConfig and cannot be changed.
    uint256 public hardCollateralizationThreshold;

    // The minimum cost of a deposit regardless of size in sats
    uint256 public minDepositFeeSats;

    // A pending increase to minDepositFeeSats
    uint256 public pendingMinDepositFeeSats;

    // The timestamp when the increase to minDepositFeeSats was requested.
    uint256 public pendingMinDepositFeeSatsUpdateTime;

    // The cost of a deposit based on its size (in basis points)
    uint256 public depositFeeBps;

    // A pending increase to depositFeeBps
    uint256 public pendingDepositFeeBps;

    // The timestamp when the increase to depositFeeBps was requested.
    uint256 public pendingDepositFeeBpsUpdateTime;

    // The minimum cost of a withdrawal regardless of size in sats
    uint256 public minWithdrawalFeeSats;

    // A pending increase to minWithdrawalFeeSats
    uint256 public pendingMinWithdrawalFeeSats;

    // The timestamp when the increase to minWithdrawalFeeSats was requested.
    uint256 public pendingMinWithdrawalFeeSatsUpdateTime;

    // The cost of a withdrawal based on its size (in basis points)
    uint256 public withdrawalFeeBps;

    // A pending increase to withdrawalFeeBps
    uint256 public pendingWithdrawalFeeBps;

    // The timestamp when the increase to withdrawalFeeBps was requested.
    uint256 public pendingWithdrawalFeeBpsUpdateTime;


    // Total count of all pending withdrawals
    uint256 public pendingWithdrawalCount;

    // Total amount (in sat) of all pending withdrawals
    uint256 public pendingWithdrawalAmountSat;

    // Count of all requested withdrawals
    uint32 public withdrawalCounter;

    // All the BTC TxIDs of successfully credited deposits
    mapping(bytes32 => bool) public acknowledgedDeposits;

    // The BTC TxID of an acknowledged deposit to the output index that was credited
    mapping(bytes32 => uint256) public acknowledgedDepositOutputIndexes;

    // The BTC TxID of an acknowledged deposit to the amount of fees which can be collected when sweeping.
    // Set to non-zero when deposit is acknowledged, then set to 0 after swept.
    mapping(bytes32 => uint256) public acknowledgedDepositsToFees;

    // All of the withdrawals by UUID mapped to the TxID that fulfilled them, or if
    // not yet fulfilled to bytes32(0).
    mapping(uint32 => bytes32) public withdrawalsToStatus;

    // All the requested withdrawals
    mapping(uint32 => Withdrawal) public withdrawals;
    
    constructor (SimpleBitcoinVault _parentVault, SimpleGlobalVaultConfig _vaultConfig) {
        parentVault = _parentVault;
        vaultConfig = _vaultConfig;
        operatorAdmin = _parentVault.operatorAdmin();

        softCollateralizationThreshold = _vaultConfig.getSoftCollateralizationThreshold();
        hardCollateralizationThreshold = _vaultConfig.getHardCollateralizationThreshold();
    }

    /**
    * Gets the parent SimpleBitcoinVault that this child SimpleBitcoinVaultState manages 
    * state for.
    *
    * @return _parentVault The parent SimpleBitcoinVault that this child SimpleBitcoinVaultState manages state for.
    */
    function getParentSimpleBitcoinVault() external view returns (SimpleBitcoinVault _parentVault) {
        return parentVault;
    }

    /**
    * Updates the operator admin, only callable by the parent vault's updateOperatorAdmin
    * function which in turn is only callable by the operatorAdmin.
    *
    * Unlike most state variables which are only stored in either SimpleBitcoinVault or
    * SimpleBitcoinVaultState, the operatorAdmin is stored in both and updated at the same
    * time across both so that it can be used more efficiently for gating function access.
    *
    * @param newOperatorAdmin The new operatorAdmin to set, passed along from upstream
    */
    function updateOperatorAdmin(address newOperatorAdmin) onlyParentVault external {
        operatorAdmin = newOperatorAdmin;
    }

    /**
    * Initiates a change to the softCollateralizationThreshold, only callable by the operatorAdmin.
    *
    * If the threshold is being decreased (meaning the vault can custody more BTC) then the change goes
    * into effect immediately.
    *
    * If the threshold is being increaesd (meaning the vault can custody less BTC) then the change is
    * queued and must be finalized later after the soft collateralization threshold increase delay has
    * elapsed, otherwise the change could unfairly effect pending deposits made based on the previous
    * higher amount of BTC the vault was able to custody.
    *
    * @param newSoftCollateralizationThreshold the new softCollateralizationThreshold to set
    */
    function changeSoftCollateralizationThreshold(uint256 newSoftCollateralizationThreshold) external onlyOperatorAdmin {
        require(newSoftCollateralizationThreshold >= vaultConfig.getSoftCollateralizationThreshold(), "new soft collateralization threshold must be higher than or equal to minimum from config");
        require(newSoftCollateralizationThreshold != softCollateralizationThreshold, "new soft collateralization threshold is not different");

        if (!parentVault.hasGoneLive()) {
            // Update to soft collateralization threshold allowed immediately
            softCollateralizationThreshold = newSoftCollateralizationThreshold;
            return;
        }

        if (newSoftCollateralizationThreshold < softCollateralizationThreshold) {
            // The threshold is being lowered which increases the deposits this vault can accept,
            // so can be applied immediately as it does not affect in-progress user deposits.
             softCollateralizationThreshold = newSoftCollateralizationThreshold;

             // Clear any other pending update
             pendingSoftCollateralizationThreshold = 0;
             pendingSoftCollateralizationThresholdUpdateTime = 0;
        } else {
            // The threshold is being raised, which lowers the deposits this vault can accept,
            // so has to be applied after an activation period.
            pendingSoftCollateralizationThreshold = newSoftCollateralizationThreshold;
            pendingSoftCollateralizationThresholdUpdateTime = block.timestamp;
        }
    }

    /**
    * Finalizes a pending softCollateralizationThreshold update.
    * Callable by anyone since it's just putting into effect an update the operator requested.
    *
    * Note that a change to the softCollateralizationThreshold could cause the vault to
    * be over the new softCollateralizationThreshold, but this is acceptable behavior as
    * it will only prevent *additional* deposits, and this threshold is only to protect
    * vault operators from liquidation, user fund security is protected by the hard
    * collateralization threshold at which liquidation occurs.
    *
    * When a vault operator submits an update to the soft collateralization threshold,
    * the old threshold will still be in force during the activation delay. Once activated,
    * the updated soft collateralization threshold is applied to new deposits, but
    * requires withdrawals or additional collateral deposits to bring the vault down
    * to the operator's desired true collateralzation utilization.
    */
    function finalizeSoftCollateralizationThresholdUpdate() public {
        require(pendingSoftCollateralizationThresholdUpdateTime != 0, "no pending soft collateralization update is in progress");

        require(pendingSoftCollateralizationThresholdUpdateTime + SOFT_COLLATERALIZATION_THRESHOLD_INCREASE_DELAY_SECONDS <= block.timestamp, 
        "not enough time has elapsed for collateralization threshold increase");

        // Check again for extra protection, should never be possible.
        require(pendingSoftCollateralizationThreshold > vaultConfig.getSoftCollateralizationThreshold(),
         "new soft collateralization threshold must be higher than or equal to minimum from config");

         softCollateralizationThreshold = pendingSoftCollateralizationThreshold;
         pendingSoftCollateralizationThresholdUpdateTime = 0;
         pendingSoftCollateralizationThreshold = 0;
    }

    /**
    * Initiates a change to the minDepositFeeSats, only callable by the operatorAdmin.
    *
    * IF the fee is being decreased, then the change goes into effect immediately.
    *
    * If the fee is being increased, then the change is queued and must be finalized later
    * after the deposit fee update delay has elapsed to provide enough time for deposits
    * awaiting confirmation on Bitcoin to have time to clear with the fees that were expected
    * when the user initiated the deposit transaction on Bitcoin.
    *
    * @param newMinDepositFeeSats The new minDepositFeeSats
    */
    function changeMinDepositFeeSats(uint256 newMinDepositFeeSats) external onlyOperatorAdmin {
        require(newMinDepositFeeSats >= vaultConfig.getMinDepositFeeSats(), "new min deposit fee in sats must be >= the minimum deposit fee in sats from config");
        require(newMinDepositFeeSats <= vaultConfig.getMaxDepositFeeSats(), "new min deposit fee in sats must be <= the maximum deposit fee in sats from config");
        require(newMinDepositFeeSats != minDepositFeeSats, "new min deposit fee sats is not different");

        if (!parentVault.hasGoneLive()) {
            // Update to min deposit fee allowed immediately
            minDepositFeeSats = newMinDepositFeeSats;
            return;
        }

        // deposit fee is being lowered, which can be implemented immediately
        if (newMinDepositFeeSats < minDepositFeeSats) {
            minDepositFeeSats = newMinDepositFeeSats;
            
            // Clear any other pending update
            pendingMinDepositFeeSats = 0;
            pendingMinDepositFeeSatsUpdateTime = 0;
            emit MinDepositFeeSatsUpdated(newMinDepositFeeSats);
        } else {
            // Fee is being raised, so requires activation period to elapse
            pendingMinDepositFeeSats = newMinDepositFeeSats;
            pendingMinDepositFeeSatsUpdateTime = block.timestamp;
        }
    }

    /**
    * Finalizes a pending minDepositFeeSats update.
    * Callable by anyone since it's just putting into effect an update the operator requested.
    */
    function finalizeMinDepositFeeSatsUpdate() public {
        require(pendingMinDepositFeeSatsUpdateTime != 0, "no pending min deposit fee in sats is in progress");

        require(pendingMinDepositFeeSatsUpdateTime + DEPOSIT_FEE_INCREASE_DELAY_SECONDS <= block.timestamp,
        "not enough time has elapsed for min deposit fee sats update");

        minDepositFeeSats = pendingMinDepositFeeSats;
        pendingMinDepositFeeSatsUpdateTime = 0;
        pendingMinDepositFeeSats = 0;
        emit MinDepositFeeSatsUpdated(minDepositFeeSats);
    }

    /**
    * Initiates a change to the depositFeeBps, only callable by the operatorAdmin.
    *
    * IF the fee is being decreased, then the change goes into effect immediately.
    *
    * If the fee is being increased, then the change is queued and must be finalized later
    * after the deposit fee update delay has elapsed to provide enough time for deposits
    * awaiting confirmation on Bitcoin to have time to clear with the fees that were expected
    * when the user initiated the deposit transaction on Bitcoin.
    *
    * @param newDepositFeeBps The new depositFeeBps
    */
    function changeDepositFeeBps(uint256 newDepositFeeBps) external onlyOperatorAdmin {
        require(newDepositFeeBps >= vaultConfig.getMinDepositFeeBasisPoints(), "new deposit fee in bps must be >= the minimum deposit fee in bps from config");
        require(newDepositFeeBps <= vaultConfig.getMaxDepositFeeBasisPoints(), "new deposit fee in bps must be <= the maximum deposit fee in bps from config");
        require(newDepositFeeBps != depositFeeBps, "new min deposit fee in bps is not different");

        if (!parentVault.hasGoneLive()) {
            // Update to bps deposit fee allowed immediately
            depositFeeBps = newDepositFeeBps;
            return;
        }

        // deposit fee is being lowered, which can be implemented immediately
        if (newDepositFeeBps < depositFeeBps) {
            depositFeeBps = newDepositFeeBps;
            
            // Clear any other pending update
            pendingDepositFeeBps = 0;
            pendingDepositFeeBpsUpdateTime = 0;
            emit DepositFeeBpsUpdated(newDepositFeeBps);
        } else {
            // Fee is being raised, so requires activation period to elapse
            pendingDepositFeeBps = newDepositFeeBps;
            pendingDepositFeeBpsUpdateTime = block.timestamp;
        }
    }

    /**
    * Finalizes a pending depositFeeBps update.
    * Callable by anyone since it's just putting into effect an update the operator requested.
    */
    function finalizeDepositFeeBpsUpdate() public {
        require(pendingDepositFeeBpsUpdateTime != 0, "no pending deposit fee in bps is in progress");

        require(pendingDepositFeeBpsUpdateTime + DEPOSIT_FEE_INCREASE_DELAY_SECONDS <= block.timestamp,
        "not enough time has elapsed for deposit fee bps update");

        depositFeeBps = pendingDepositFeeBps;
        pendingDepositFeeBpsUpdateTime = 0;
        pendingDepositFeeBps = 0;
        emit DepositFeeBpsUpdated(depositFeeBps);
    }

    /**
    * Initiates a change to the minWithdrawalFeeSats, only callable by the operatorAdmin.
    *
    * IF the fee is being decreased, then the change goes into effect immediately.
    *
    * If the fee is being increased, then the change is queued and must be finalized later
    * after the withdrawal fee update delay has elapsed to provide enough time for withdrawals
    * awaiting confirmation on Hemi to have time to clear with the fees that were expected
    * when the user initiated the withdrawal transaction on Hemi.
    *
    * @param newMinWithdrawalFeeSats The new minWithdrawalFeeSats
    */
    function changeMinWithdrawalFeeSats(uint256 newMinWithdrawalFeeSats) external onlyOperatorAdmin {
        require(newMinWithdrawalFeeSats >= vaultConfig.getMinWithdrawalFeeSats(), "new min withdrawal fee in sats must be >= the minimum withdrawal fee in sats from config");
        require(newMinWithdrawalFeeSats <= vaultConfig.getMaxWithdrawalFeeSats(), "new min withdrawal fee in sats must be <= the maximum withdrawal fee in sats from config");
        require(newMinWithdrawalFeeSats != minWithdrawalFeeSats, "new min withdrawal fee sats is not different");

        if (!parentVault.hasGoneLive()) {
            // Update to min withdrawal fee allowed immediately
            minWithdrawalFeeSats = newMinWithdrawalFeeSats;
            return;
        }

        // withdrawal fee is being lowered, which can be implemented immediately
        if (newMinWithdrawalFeeSats < minWithdrawalFeeSats) {
            minWithdrawalFeeSats = newMinWithdrawalFeeSats;
            
            // Clear any other pending update
            pendingMinWithdrawalFeeSats = 0;
            pendingMinWithdrawalFeeSatsUpdateTime = 0;
            emit MinWithdrawalFeeSatsUpdated(newMinWithdrawalFeeSats);
        } else {
            // Fee is being raised, so requires activation period to elapse
            pendingMinWithdrawalFeeSats = newMinWithdrawalFeeSats;
            pendingMinWithdrawalFeeSatsUpdateTime = block.timestamp;
        }
    }

    /**
    * Finalizes a pending minWithdrawalFeeSats update.
    * Callable by anyone since it's just putting into effect an update the operator requested.
    */
    function finalizeMinWithdrawalFeeSatsUpdate() public {
        require(pendingMinWithdrawalFeeSatsUpdateTime != 0, "no pending min withdrawal fee in sats is in progress");

        require(pendingMinWithdrawalFeeSatsUpdateTime + WITHDRAWAL_FEE_INCREASE_DELAY_SECONDS <= block.timestamp,
        "not enough time has elapsed for min withdrawal fee sats update");

        minWithdrawalFeeSats = pendingMinWithdrawalFeeSats;
        pendingMinWithdrawalFeeSatsUpdateTime = 0;
        pendingMinWithdrawalFeeSats = 0;
        emit MinWithdrawalFeeSatsUpdated(minWithdrawalFeeSats);
    }

    /**
    * Initiates a change to the withdrawalFeeBps, only callable by the operatorAdmin.
    *
    * IF the fee is being decreased, then the change goes into effect immediately.
    *
    * If the fee is being increased, then the change is queued and must be finalized later
    * after the withdrawal fee update delay has elapsed to provide enough time for withdrawals
    * awaiting confirmation on Hemi to have time to clear with the fees that were expected
    * when the user initiated the deposit transaction on Hemi.
    *
    * @param newWithdrawalFeeBps The new withdrawalFeeBps
    */
    function changeWithdrawalFeeBps(uint256 newWithdrawalFeeBps) external onlyOperatorAdmin {
        require(newWithdrawalFeeBps >= vaultConfig.getMinWithdrawalFeeBasisPoints(), "new withdrawal fee in bps must be >= the minimum withdrawal fee in bps from config");
        require(newWithdrawalFeeBps <= vaultConfig.getMaxWithdrawalFeeBasisPoints(), "new withdrawal fee in bps must be <= the maximum withdrawal fee in bps from config");
        require(newWithdrawalFeeBps != withdrawalFeeBps, "new min withdrawal fee in bps is not different");

        if (!parentVault.hasGoneLive()) {
            // Update to bps withdrawal fee allowed immediately
            withdrawalFeeBps = newWithdrawalFeeBps;
            return;
        }

        // withdrawal fee is being lowered, which can be implemented immediately
        if (newWithdrawalFeeBps < withdrawalFeeBps) {
            withdrawalFeeBps = newWithdrawalFeeBps;
            
            // Clear any other pending update
            pendingWithdrawalFeeBps = 0;
            pendingWithdrawalFeeBpsUpdateTime = 0;
            emit WithdrawalFeeBpsUpdated(newWithdrawalFeeBps);
        } else {
            // Fee is being raised, so requires activation period to elapse
            pendingWithdrawalFeeBps = newWithdrawalFeeBps;
            pendingWithdrawalFeeBpsUpdateTime = block.timestamp;
        }
    }

    /**
    * Finalizes a pending withdrawalFeeBps update.
    * Callable by anyone since it's just putting into effect an update the operator requested.
    */
    function finalizeWithdrawalFeeBpsUpdate() public {
        require(pendingWithdrawalFeeBpsUpdateTime != 0, "no pending withdrawal fee in bps is in progress");

        require(pendingWithdrawalFeeBpsUpdateTime + WITHDRAWAL_FEE_INCREASE_DELAY_SECONDS <= block.timestamp,
        "not enough time has elapsed for withdrawal fee bps update");

        withdrawalFeeBps = pendingWithdrawalFeeBps;
        pendingWithdrawalFeeBpsUpdateTime = 0;
        pendingWithdrawalFeeBps = 0;
        emit WithdrawalFeeBpsUpdated(withdrawalFeeBps);
    }

    /**
    * Calculates the deposit fee for a given deposit amount based on the higher of either
    * the minimum deposit fee in sats, or the deposit fee in bps.
    *
    * @return depositFeeSats The calculated deposit fee in sats
    */
    function calculateDepositFee(uint256 depositAmount) external view returns (uint256 depositFeeSats) {
        uint256 depositFee = depositAmount * depositFeeBps / 10000;
        if (depositFee < minDepositFeeSats) {
            depositFee = minDepositFeeSats;
        }
        return depositFee;
    }

    /**
    * Calculates the withdrawal fee for a given withdrawal amount based on the higher of either
    * the minimum withdrawal fee in sats, or the withdrawal fee in bps.
    *
    * @return withdrawalFeeSats The calculated withdrawal fee in sats
    */
    function calculateWithdrawalFee(uint256 withdrawalAmount) external view returns (uint256 withdrawalFeeSats) {
        uint256 withdrawalFee = withdrawalAmount * withdrawalFeeBps / 10000;
        if (withdrawalFee < minWithdrawalFeeSats) {
            withdrawalFee = minWithdrawalFeeSats;
        }
        return withdrawalFee;
    }

    /**
    * Determines whether a Bitcoin deposit identified by its TxId has been acknowledged.
    *
    * @param txid The TxId of the Bitcoin transaction to check for acknowledgement of
    *
    * @return isAcknowledged Whether the deposit has been acknowledged
    */
    function isDepositAcknowledged(bytes32 txid) external view returns (bool isAcknowledged) {
        return acknowledgedDeposits[txid];
    }

    /**
    * Acknowledge a deposit by its txid and the output index of that transaction which was credited.
    */
    function acknowledgeDeposit(bytes32 txid, uint256 outputIndex, uint256 feesCollected) external onlyParentVault {
        acknowledgedDeposits[txid] = true;
        acknowledgedDepositOutputIndexes[txid] = outputIndex;
        acknowledgedDepositsToFees[txid] = feesCollected;
    }

    /**
    * Stores a withdrawal in the vault's state, assumes all checks have been performed by calling parent.
    * Only callable by parent owner SimpleBitcoinVault.
    *
    * @param amount The full amount of the withdrawal in sats
    * @param fee The fee to be charged in sats for the withdrawal
    * @param timestampRequested The time at which the withdrawal was requested
    * @param destinationScript The BTC destination script of the withdrawal
    * @param evmOriginator The EVM address which originated the withdrawal
    *
    * @return withdrawalNum The index of the withdrawal
    * @return pendingWithdrawalAmount How much is pending withdrawals in sats
    */
    function internalInitializeWithdrawal(uint256 amount, uint256 fee, uint256 timestampRequested, bytes memory destinationScript, address evmOriginator) external onlyParentVault returns (uint32 withdrawalNum, uint256 pendingWithdrawalAmount) {
        Withdrawal memory withdrawal = Withdrawal(withdrawalCounter, amount, fee, block.timestamp, destinationScript, evmOriginator);
        withdrawals[withdrawalCounter] = withdrawal;
        pendingWithdrawalAmountSat += amount;
        withdrawalCounter++;
        return (withdrawalCounter - 1, pendingWithdrawalAmountSat);
    }

    /**
    * Retrieves the withdrawal struct at the index identified by the UUID
    *
    * @param uuid The UUID of the withdrawal to return
    *
    * @return storedWithdrawal The withdrawal stored at that index. If the withdrawal does not exist, will return a zero-filled struct.
    */
    function getWithdrawal(uint32 uuid) external returns (Withdrawal memory storedWithdrawal) {
        return withdrawals[uuid];
    }

    /**
    * Associates a withdrawal (identified by UUID) with the TxId of the Bitcoin transaction that fulfills the withdrawal.
    * Assumes all checks have been performed by calling parent, specifically that the provided TxId does appropriately fulfill
    * the requested withdrawal.
    * Only callable by parent owner SimpleBitcoinVault.
    *
    * The withdrawalAmount is passed in rather than acquired from the withdrawal mapping to save gas, since it is already known
    * by parent for performing checks.
    *
    * @param uuid The uuid (index of the withdrawal)
    * @param fulfillmentTxId The TxId of the transaction on Bitcoin that fulfills the withdrawal
    * @param withdrawalAmount The amount of the withdrawal in satoshis
    */
    function saveWithdrawalFulfillment(uint32 uuid, bytes32 fulfillmentTxId, uint256 withdrawalAmount) external onlyParentVault {
        // Save the association between the withdrawal and the txid which properly fulfilled it
        withdrawalsToStatus[uuid] = fulfillmentTxId;
        pendingWithdrawalAmountSat = pendingWithdrawalAmountSat - withdrawalAmount;
    }

    /**
    * Determines whether a withdrawal is fulfilled by checking whether the withdrawal is associated with a non-zero fulfillment TxId.
    * Callable by anyone as this does not mutate any state.
    * Will return false even for withdrawals that do not exist (uuid refers to a withdrawal that has not been created).
    * 
    * @return isFulfilled Whether the withdrawal identified by UUID has been fulfilled with a Bitcoin transaction
    */
    function isWithdrawalFulfilled(uint32 uuid) external view returns (bool isFulfilled) {
        // If a TxId is returned (!= bytes32(0)), then the withdrawal is fulfilled.
        return (withdrawalsToStatus[uuid] != bytes32(0));
    }

    /**
    * Gets the fees that can be collected by sweeping a deposit identified by the provided TxId.
    * Callable by anyone as this does not mutate any state.
    *
    * @param depositTxId The deposit TxId to check for collectable fees
    * 
    * @return collectableFees The amount of fees in satoshis that can be collected by the operator when they sweep the deposit TxId
    */
    function getCollectableFees(bytes32 depositTxId) external view returns (uint256 collectableFees) {
        return acknowledgedDepositsToFees[depositTxId];
    }

    /**
    * Records that the fees for a particular acknowledged deposit TxId have been collected.
    * Only callable by the parent owner SimpleBitcoinVault.
    *
    * @param depositTxId The deposit TxId to record that fees have been collected for
    */
    function saveFeesCollected(bytes32 depositTxId) external onlyParentVault {
        acknowledgedDepositsToFees[depositTxId] = 0;
    }

    /**
    * Gets the output index of an acknowledged BTC deposit identified by the provided TxId.
    * Callable by anyone as this does not mutate any state.
    *
    * @param depositTxId The deposit TxId to look up the associated output index
    * 
    * @return outputIndex The output index of the specified TxId that constituted the acknowledged deposit
    */
    function getDepositOutputIndex(bytes32 depositTxId) external view returns (uint256 outputIndex) {
        return acknowledgedDepositOutputIndexes[depositTxId];
    }
}