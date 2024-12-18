// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "../IBitcoinVault.sol";
import "./SimpleGlobalVaultConfig.sol";
import "./SimpleBitcoinVault.sol";
import "../VaultUtils.sol";
import "../../oracles/IAssetPriceOracle.sol";
import "./SimpleBitcoinVaultStructs.sol";
import "../../BTCToken.sol";

/**
 * The SimpleBitcoinVaultState offloads holding and updating much of the state requierd for
 * operation of a SimpleBitcoinVault:
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

    struct PartialLiquidation {
        uint256 amountSatsToRecover;
        uint256 startTimestamp;
        uint256 currentBidAmount;
        uint256 currentBidTime;
        address currentBidder;
        bool finished;
    }

    /**
     * The onlyParentVault modifier is used on all functions that should *only* be callable by the
     * SimpleBitcoinVault that owns this SimpleBitcoinVaultState.
    */
    modifier onlyParentVault() {
        require(msg.sender == address(parentVault));
        _;
    }

    /**
     * The onlyOperatorAdmin modifier is used on all functions that should *only* be callable by the
     * operatorAdmin.
    */
    modifier onlyOperatorAdmin() {
        require(msg.sender == operatorAdmin);
        _;
    }

    // How long the operator has to wait between initiating and finalizing a partial collateral
    // withdrawal
    uint256 public constant PARTIAL_COLLATERAL_WITHDRAWAL_DELAY = 60 * 60 * 4; // 4 hours

    // Time in seconds after a full liquidation is started after which deposits are not accepted
    uint256 public constant FULL_LIQUIDATION_DEPOSIT_GRACE_PERIOD = 60 * 60 * 4; // 4 hours

    // Time in seconds for a partial liquidation bid to survive being out-bid to be accepted
    uint256 public constant PARTIAL_LIQUIDATION_BID_TIME = 60 * 15; // 15 minutes

    // During a full liquidation, how often to increase the price (linear increase)
    uint256 public constant FULL_LIQUIDATION_INCREASE_TIME = 60; // 60 seconds

    // Increase by 0.03% every increment. At 60 seconds per increment, that's 1.8% per hour.
    uint256 public constant FULL_LIQUIDATION_INCREASE_INCREMENT_BPS = 3; 

    // The activation time for softCollateralizationThreshold increases
    uint256 public constant SOFT_COLLATERALIZATION_THRESHOLD_INCREASE_DELAY_SECONDS = 4 * 60 * 60; // 4 hours

    // The activation time for increases to deposit fees
    // Set to 4 hours to give time for on-Bitcoin activity to clear before increases affect deposits
    uint256 public constant DEPOSIT_FEE_INCREASE_DELAY_SECONDS = 4 * 60 * 60; // 4 hours

    // The activation time for increases to withdrawal fees
    // Set to 5 minutes to give time for on-Hemi activity to clear before increases affect withdrawals
    uint256 public constant WITHDRAWAL_FEE_INCREASE_DELAY_SECONDS = 1 * 60 * 60; // 1 hour

    // At most 10 withdrawals can be pending at a time
    uint256 public constant MAX_WITHDRAWAL_QUEUE_SIZE = 10;

    // The operatorAdmin is stored here as well as in the parent for efficiency. For many vault
    // administration tasks like modifying soft collateralization thresholds, updating minimum fees,
    // and initiating partial collateral withdrawals, the operator will interact directly with the
    // SimpleBitcoinVaultState contract. An update to operatorAdmin can only be initiated at the
    // SimpleBitcoinVault level which will call the update function here to perform the
    // corersponding update.
    address public operatorAdmin;

    // The SimpleBitcoinVault that this SimpleBitcoinVaultState holds and updates state for
    SimpleBitcoinVault parentVault;

    // The same vaultConfig that is applied globally across all instances of SimpleBitcoinVault and
    // their corresponding instances of SimpleBitcoinVaultState
    SimpleGlobalVaultConfig vaultConfig;

    // The contract of the hBTC token
    BTCToken btcTokenContract;


    // The softCollateralizationThreshold this vault uses; must be >= the one provided by
    // SimpleGlobalVaultConfig.
    uint256 public softCollateralizationThreshold;

    // A pending change to the softCollateralizationThreshold this vault uses, requires 4 hours
    // before activation to be applied so that user deposits made based on a lower threshold will be
    // deposited before lower threshold goes into effect. Not used if the collaterization threshold
    // is lowered (more deposits can be handled) as that will not affect user deposits in progress.
    uint256 public pendingSoftCollateralizationThreshold;

    // The timestamp when the soft collateralization threshold increase was requested. Used to
    // finalize the collateralization threshold update.
    uint256 public pendingSoftCollateralizationThresholdUpdateTime;

    // The hardCollateralizationThreshold this vault uses; is set at construction to the value
    // provided by SimpleGlobalVaultConfig and cannot be changed.
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


    // All pending withdrawals (initiated but not finalized by operator). This structure is
    // maintained so that an invalid outgoing transaction from the vault can be cross-referenced
    // against a bounded number of pending withdrawals, rather than requiring a challenge-response
    // system.
    Withdrawal[MAX_WITHDRAWAL_QUEUE_SIZE] pendingWithdrawals;

    // All of the withdrawals by UUID mapped to the TxID that fulfilled them, or if not yet
    // fulfilled to bytes32(0).
    mapping(uint32 => bytes32) public withdrawalsToStatus;

    // All of the withdrawals by UUID mapped to a boolean of whether they have already been
    // successfully challenged.
    mapping(uint32 => bool) public withdrawalsChallenged;

    // All of the txids which have been successfully recognized as valid withdrawal fulfillments
    mapping(bytes32 => bool) public acknowledgedWithdrawalTxids;

    // All the requested withdrawals
    mapping(uint32 => Withdrawal) public withdrawals;

    // Total count of all pending withdrawals
    uint256 public pendingWithdrawalCount;

    // Total amount (in sat) of all pending withdrawals
    uint256 public pendingWithdrawalAmountSat;

    // Count of all requested withdrawals
    uint32 public withdrawalCounter;



    // The total BTC deposits in sats this vault currently holds
    uint256 totalDepositsHeld;

    // All the BTC TxIDs of successfully credited deposits
    mapping(bytes32 => bool) public acknowledgedDeposits;

    // The BTC TxID of an acknowledged deposit to the output index that was credited
    mapping(bytes32 => uint256) public acknowledgedDepositOutputIndexes;

    // The BTC TxID of an acknowledged deposit to the amount of fees which can be collected when sweeping.
    // Set to non-zero when deposit is acknowledged, then set to 0 after swept.
    mapping(bytes32 => uint256) public acknowledgedDepositsToFees;



    // Amount of ERC20 collateral deposited
    uint256 depositedCollateralBalance;

    // Amount of collateral asset (in atomic units) pending potential withdrawal by operator
    uint256 pendingCollateralWithdrawal;

    // The timestamp when the pending withdrawal of collatearl was requested.
    uint256 pendingCollateralWithdrawalRequestTime;



    // Set to true if the operator misbehaves and the vault should be fully liquidated
    bool fullLiquidationAllowed;

    // Set to true once a full liquidation has been started
    bool fullLiquidationStarted;

    // Set to true once a full liquidation has been completed
    bool fullLiquidationDone;

    // The time at which a full liquidation was started
    uint256 fullLiquidationStartTime;

    // Store the starting price of the full liquidation
    uint256 fullLiquidationStartingPrice;

    // The amount of sats that need to be repurchased that are not yet being actively liquidated
    uint256 pendingPartialLiquidationSats;

    // The counter of partial liquidations started
    uint32 partialLiquidationCounter;

    // Whether a partial liquidation is already in progress
    bool partialLiquidationInProgress;

    // Mapping of each partial liquidation index to its current state
    mapping(uint32 => PartialLiquidation) public partialLiquidationStatus;
    
    constructor (SimpleBitcoinVault _parentVault, address _operatorAdmin, SimpleGlobalVaultConfig _vaultConfig, BTCToken _btcTokenContract) {
        parentVault = _parentVault;
        vaultConfig = _vaultConfig;
        btcTokenContract = _btcTokenContract;
        operatorAdmin = _operatorAdmin;

        softCollateralizationThreshold = _vaultConfig.getSoftCollateralizationThreshold();
        hardCollateralizationThreshold = _vaultConfig.getHardCollateralizationThreshold();
    }

    /**
     * Gets the parent SimpleBitcoinVault that this child SimpleBitcoinVaultState manages state for.
     *
     * @return _parentVault The parent SimpleBitcoinVault that this child SimpleBitcoinVaultState manages state for.
    */
    function getParentSimpleBitcoinVault() external view returns (SimpleBitcoinVault _parentVault) {
        return parentVault;
    }

    /**
     * Updates the operator admin, only callable by the parent vault's updateOperatorAdmin function
     * which in turn is only callable by the operatorAdmin.
     *
     * Unlike most state variables which are only stored in either SimpleBitcoinVault or
     * SimpleBitcoinVaultState, the operatorAdmin is stored in both and updated at the same time
     * across both so that it can be used more efficiently for gating function access.
     *
    * @param newOperatorAdmin The new operatorAdmin to set, passed along from upstream
    */
    function updateOperatorAdmin(address newOperatorAdmin) onlyParentVault external {
        operatorAdmin = newOperatorAdmin;
    }

    /**
     * Gets the soft collateralization threshold.
     * 
     * @return The soft collateralization threshold currently set
     */
    function getSoftCollateralizationThreshold() external view returns (uint256) {
        return softCollateralizationThreshold;
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

        if (parentVault.hasNeverGoneLive()) {
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
     * Finalizes a pending softCollateralizationThreshold update. Callable by anyone since it's just
     * putting into effect an update the operator requested.
     *
     * Note that a change to the softCollateralizationThreshold could cause the vault to be over the
     * new softCollateralizationThreshold, but this is acceptable behavior as it will only prevent
     * *additional* deposits, and this threshold is only to protect vault operators from
     * liquidation, user fund security is protected by the hard collateralization threshold at which
     * liquidation occurs.
     *
     * When a vault operator submits an update to the soft collateralization threshold, the old
     * threshold will still be in force during the activation delay. Once activated, the updated
     * soft collateralization threshold is applied to new deposits, but requires withdrawals or
     * additional collateral deposits to bring the vault down to the operator's desired true
     * collateralzation utilization.
    */
    function finalizeSoftCollateralizationThresholdUpdate() external {
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
     * If the fee is being decreased, then the change goes into effect immediately.
     *
     * If the fee is being increased, then the change is queued and must be finalized later after
     * the deposit fee update delay has elapsed to provide enough time for deposits awaiting
     * confirmation on Bitcoin to have time to clear with the fees that were expected when the user
     * initiated the deposit transaction on Bitcoin.
     *
     * @param newMinDepositFeeSats The new minDepositFeeSats
    */
    function changeMinDepositFeeSats(uint256 newMinDepositFeeSats) external onlyOperatorAdmin {
        require(newMinDepositFeeSats >= vaultConfig.getMinDepositFeeSats(), "new min deposit fee in sats must be >= the minimum deposit fee in sats from config");
        require(newMinDepositFeeSats <= vaultConfig.getMaxDepositFeeSats(), "new min deposit fee in sats must be <= the maximum deposit fee in sats from config");
        require(newMinDepositFeeSats != minDepositFeeSats, "new min deposit fee sats is not different");

        if (parentVault.hasNeverGoneLive()) {
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
    function finalizeMinDepositFeeSatsUpdate() external {
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
     * If the fee is being decreased, then the change goes into effect immediately.
     *
     * If the fee is being increased, then the change is queued and must be finalized later after
     * the deposit fee update delay has elapsed to provide enough time for deposits awaiting
     * confirmation on Bitcoin to have time to clear with the fees that were expected when the user
     * initiated the deposit transaction on Bitcoin.
     *
     * @param newDepositFeeBps The new depositFeeBps
    */
    function changeDepositFeeBps(uint256 newDepositFeeBps) external onlyOperatorAdmin {
        require(newDepositFeeBps >= vaultConfig.getMinDepositFeeBasisPoints(), 
        "new deposit fee in bps must be >= the minimum deposit fee in bps from config");
        
        require(newDepositFeeBps <= vaultConfig.getMaxDepositFeeBasisPoints(), 
        "new deposit fee in bps must be <= the maximum deposit fee in bps from config");

        require(newDepositFeeBps != depositFeeBps, "new min deposit fee in bps is not different");

        if (parentVault.hasNeverGoneLive()) {
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
    function finalizeDepositFeeBpsUpdate() external {
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
     * If the fee is being decreased, then the change goes into effect immediately.
     *
     * If the fee is being increased, then the change is queued and must be finalized later after
     * the withdrawal fee update delay has elapsed to provide enough time for withdrawals awaiting
     * confirmation on Hemi to have time to clear with the fees that were expected when the user
     * initiated the withdrawal transaction on Hemi.
     *
     * @param newMinWithdrawalFeeSats The new minWithdrawalFeeSats
    */
    function changeMinWithdrawalFeeSats(uint256 newMinWithdrawalFeeSats) external onlyOperatorAdmin {
        require(newMinWithdrawalFeeSats >= vaultConfig.getMinWithdrawalFeeSats(), 
        "new min withdrawal fee in sats must be >= the minimum withdrawal fee in sats from config");

        require(newMinWithdrawalFeeSats <= vaultConfig.getMaxWithdrawalFeeSats(),
         "new min withdrawal fee in sats must be <= the maximum withdrawal fee in sats from config");

        require(newMinWithdrawalFeeSats != minWithdrawalFeeSats, "new min withdrawal fee sats is not different");

        if (parentVault.hasNeverGoneLive()) {
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
     * Finalizes a pending minWithdrawalFeeSats update. Callable by anyone since it's just putting
     * into effect an update the operator requested.
    */
    function finalizeMinWithdrawalFeeSatsUpdate() external {
        require(pendingMinWithdrawalFeeSatsUpdateTime != 0, 
        "no pending min withdrawal fee in sats is in progress");

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
     * If the fee is being decreased, then the change goes into effect immediately.
     *
     * If the fee is being increased, then the change is queued and must be finalized later after
     * the withdrawal fee update delay has elapsed to provide enough time for withdrawals awaiting
     * confirmation on Hemi to have time to clear with the fees that were expected when the user
     * initiated the deposit transaction on Hemi.
     *
     * @param newWithdrawalFeeBps The new withdrawalFeeBps
    */
    function changeWithdrawalFeeBps(uint256 newWithdrawalFeeBps) external onlyOperatorAdmin {
        require(newWithdrawalFeeBps >= vaultConfig.getMinWithdrawalFeeBasisPoints(), 
        "new withdrawal fee in bps must be >= the minimum withdrawal fee in bps from config");

        require(newWithdrawalFeeBps <= vaultConfig.getMaxWithdrawalFeeBasisPoints(), 
        "new withdrawal fee in bps must be <= the maximum withdrawal fee in bps from config");

        require(newWithdrawalFeeBps != withdrawalFeeBps, "new min withdrawal fee in bps is not different");

        if (parentVault.hasNeverGoneLive()) {
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
     * Finalizes a pending withdrawalFeeBps update. Callable by anyone since it's just putting into
     * effect an update the operator requested.
    */
    function finalizeWithdrawalFeeBpsUpdate() external {
        require(pendingWithdrawalFeeBpsUpdateTime != 0, "no pending withdrawal fee in bps is in progress");

        require(pendingWithdrawalFeeBpsUpdateTime + WITHDRAWAL_FEE_INCREASE_DELAY_SECONDS <= block.timestamp,
        "not enough time has elapsed for withdrawal fee bps update");

        withdrawalFeeBps = pendingWithdrawalFeeBps;
        pendingWithdrawalFeeBpsUpdateTime = 0;
        pendingWithdrawalFeeBps = 0;
        emit WithdrawalFeeBpsUpdated(withdrawalFeeBps);
    }

    /**
     * Calculates the deposit fee for a given deposit amount based on the higher of either the
     * minimum deposit fee in sats, or the deposit fee in bps.
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
     * Calculates the withdrawal fee for a given withdrawal amount based on the higher of either the
     * minimum withdrawal fee in sats, or the withdrawal fee in bps.
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
     * Acknowledge a deposit by its txid and the output index of that transaction which was
     * credited.
    */
    function acknowledgeDeposit(bytes32 txid, uint256 outputIndex, uint256 feesCollected) external onlyParentVault {
        acknowledgedDeposits[txid] = true;
        acknowledgedDepositOutputIndexes[txid] = outputIndex;
        acknowledgedDepositsToFees[txid] = feesCollected;
    }

    /**
     * Stores a withdrawal in the vault's state, assumes all checks have been performed by calling
     * parent. Only callable by parent owner SimpleBitcoinVault.
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
        require(pendingWithdrawalCount < MAX_WITHDRAWAL_QUEUE_SIZE, 
        "there are too many pending withdrawals in this vault");

        Withdrawal memory withdrawal = Withdrawal(withdrawalCounter, 
        amount, fee, timestampRequested, destinationScript, evmOriginator);

        withdrawals[withdrawalCounter] = withdrawal;
        pendingWithdrawalAmountSat += amount;
        withdrawalCounter++;
        pendingWithdrawalCount++;
        saveWithdrawalInQueue(withdrawal);
        return (withdrawalCounter - 1, pendingWithdrawalAmountSat);
    }

    /**
      * Saves a withdrawal in the pending withdrawals bounded array.
      * 
      * @param withdrawal The withdrawal to save in pending withdrawals
      * 
      * @return index The index in the pending withdrawals array where the withdrawal was saved
     */
    function saveWithdrawalInQueue(Withdrawal memory withdrawal) private returns (uint32 index) {
        for (uint32 i = 0; i < MAX_WITHDRAWAL_QUEUE_SIZE; i++) {
            // Amount can only be zero when the index returns a 0-value struct (does not exist).
            if (pendingWithdrawals[i].amount == 0) {
                pendingWithdrawals[i] = withdrawal;
                return i;
            }
        }
    }

    /**
      * Removes a withdrawal, identified by the withdrawal's unique counter/uuid from the queue.
      * 
      * @param uniqueWithdrawalCounter The unique counter of the withdrawal to remove
     */
    function removeWithdrawalFromQueue(uint32 uniqueWithdrawalCounter) private {
        for (uint32 i = 0; i < MAX_WITHDRAWAL_QUEUE_SIZE; i++) {
            if (pendingWithdrawals[i].withdrawalCounter == uniqueWithdrawalCounter) {
                delete(pendingWithdrawals[i]);
                return;
            }
        }

        // This should be impossible as this function is only called once per withdrawal which must
        // be already in the queue
        revert("unable to remove withdrawal from queue");
    }

    /**
     * Checks all of the pending withdrawals to determine if one of them fits a specific script hash
     * and output amount. Used for checking whether a transaction could not fulfill any pending
     * transactions, and thus the operator misbehaved.
     * 
     * @param scriptHash The keccak256 hash of the output script to check for a match against the requested output script of any pending withdrawal
     * @param outputAmount The amount of the Bitcoin output, to compare against the expected Bitcoin output amount of any pending withdrawal
     * 
     * @return matchFound Whether the scriptHash and outputAmount match at least one pending withdrawal
    */
    function checkPendingWithdrawalsForMatch(bytes32 scriptHash, uint256 outputAmount) external view returns (bool matchFound) {
        for (uint32 i = 0; i < MAX_WITHDRAWAL_QUEUE_SIZE; i++) {
            Withdrawal memory toCheck = pendingWithdrawals[i];
            if (toCheck.amount != 0) {
                // This is an actual withdrawal, not an empty withdrawal struct.

                // Calculate the value the output should have by subtracting fees
                uint256 expectedNet = toCheck.amount - toCheck.fee;

                // Do the cheap check (amount matches) first, so we only do expensive check (script
                // matches) if this condition is met first
                if (expectedNet == outputAmount) {
                    bytes32 toCheckScriptHash = keccak256(toCheck.destinationScript);
                    if (scriptHash == toCheckScriptHash) {
                        // If amount and destination script match, then a match has been found
                        return true;
                    }
                }
            }
        }

        // No match was found
        return false;
    }

    /**
     * Retrieves the withdrawal struct at the index identified by the UUID
     *
     * @param uuid The UUID of the withdrawal to return
     *
     * @return storedWithdrawal The withdrawal stored at that index. If the withdrawal does not exist, will return a zero-filled struct.
    */
    function getWithdrawal(uint32 uuid) external view returns (Withdrawal memory storedWithdrawal) {
        require(uuid < withdrawalCounter, "withdrawal does not exist");
        return withdrawals[uuid];
    }

    /**
     * Associates a withdrawal (identified by UUID) with the TxId of the Bitcoin transaction that
     * fulfills the withdrawal. Assumes all checks have been performed by calling parent,
     * specifically that the provided TxId does appropriately fulfill the requested withdrawal.
     *
     * Only callable by parent owner SimpleBitcoinVault.
     *
     * The withdrawalAmount is passed in rather than acquired from the withdrawal mapping to save
     * gas, since it is already known by parent for performing checks.
     *
     * @param uuid The uuid (index of the withdrawal)
     * @param fulfillmentTxId The TxId of the transaction on Bitcoin that fulfills the withdrawal
     * @param withdrawalAmount The amount of the withdrawal in satoshis
    */
    function saveWithdrawalFulfillment(uint32 uuid, bytes32 fulfillmentTxId, uint256 withdrawalAmount) external onlyParentVault {
        // Save the association between the withdrawal and the txid which properly fulfilled it
        pendingWithdrawalCount--;
        withdrawalsToStatus[uuid] = fulfillmentTxId;
        acknowledgedWithdrawalTxids[fulfillmentTxId] = true;

        // Remove the withdrawal from the pending withdrawals queue
        removeWithdrawalFromQueue(uuid);

        // Decrease the amount of sats pending withdrawal by the withdrawal amount (including paid
        // fees)
        pendingWithdrawalAmountSat -= withdrawalAmount;

        // Decrease the total deposits held by this vault on behalf of the protocol by the
        // withdrawal amount (including paid fees)
        totalDepositsHeld -= withdrawalAmount;
    }

    /**
     * Saves that a withdrawal has been successfully challenged to prevent repeat challenges.
     * If this is called, then upstream will immediately allow a liquidation to occur if it
     * it not already underway from previous operator misbehavior.
     * However, we still remove the pending withdrawal and make the appropriate state updates
     * to reflect that the withdrawal is no longer oustanding.
     */
    function saveSuccessfulWithdrawalChallenge(uint32 uuid) external onlyParentVault {
        withdrawalsChallenged[uuid] = true;
        pendingWithdrawalCount--;
        removeWithdrawalFromQueue(uuid);
        pendingWithdrawalAmountSat -= withdrawals[uuid].amount;

    }

    /**
     * Checks whether a Bitcoin transaction has been acknowledged as a withdrawal fulfillment
     * 
     * @param txid The TxID of the Bitcoin transaction to check
    */
    function isTransactionAcknowledgedWithdrawalFulfillment(bytes32 txid) external view returns (bool isAcknowledgedWithdrawalFulfillment) {
        return acknowledgedWithdrawalTxids[txid];
    }

    /**
     * Determines whether a withdrawal is fulfilled by checking whether the withdrawal is associated
     * with a non-zero fulfillment TxId. Callable by anyone as this does not mutate any state. Will
     * return false even for withdrawals that do not exist (uuid refers to a withdrawal that has not
     * been created).
     * 
     * Note that a withdrawal fulfillment transaction could exist on Bitcoin, but this returns false
     * because the operator has not yet communicated it to this contract, which is expected
     * behavior.
     * 
     * @return isFulfilled Whether the withdrawal identified by UUID has been fulfilled with a Bitcoin transaction
    */
    function isWithdrawalFulfilled(uint32 uuid) external view returns (bool isFulfilled) {
        // If a TxId is returned (!= bytes32(0)), then the withdrawal is fulfilled.
        return (withdrawalsToStatus[uuid] != bytes32(0));
    }

    /**
     * Determines whether a withdrawal has already been marked as successfully challenged.
     * Callable by anyone as this does not mutute any state. Will return false even for withdrawals
     * that do not exist (uuid refers to a withdrawal that has not been created).
     * 
     * Note that this function does not check whether the transaction *can* be challenged,
     * only whether a successful challenge has been successfully fulfilled due to this
     * withdrawal not being processed by the Operator within the permitted time window.
     */
    function isWithdrawalAlreadyChallenged(uint32 uuid) external view returns (bool isChallenged) {
        return withdrawalsChallenged[uuid];
    }

    /**
     * Processes a decrease in totalDepositsHeld due to operator burning hBTC
     * 
     * @param amount The amount of hBTC that the operator burnt which should be removed from totalDepositsHeld
    */
    function decreaseTotalDepositsHeldFromOperatorBurning(uint256 amount) private {
        require(amount <= totalDepositsHeld, "cannot decrease totalDepositsHeld by more than its entire value");
        totalDepositsHeld -= amount;
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
     * 
     * Only callable by the parent owner SimpleBitcoinVault.
     *
     * @param depositTxId The deposit TxId to record that fees have been collected for
    */
    function saveFeesCollected(bytes32 depositTxId) external onlyParentVault {
        acknowledgedDepositsToFees[depositTxId] = 0;
    }

    /**
     * Increases the total deposits (in sats) held by this vault on behalf of the protocol.
     * 
     * Only callable by the parent owner SimpleBitcoinVault.
     * 
     * @param increase Amount to increase total deposits held by
    */
    function increaseTotalDepositsHeld(uint256 increase) external onlyParentVault {
        totalDepositsHeld = totalDepositsHeld + increase;
    }

    /**
     * Returns the total deposits (in sats) held by this vault on behalf of the protocol.
     * 
     * @return depositsHeld The total deposits (in sats) held by this vault on behalf of the protocol
    */
    function getTotalDepositsHeld() external view returns (uint256 depositsHeld) {
        return totalDepositsHeld;
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

    /**
     * Returns the pending withdrawal amount in sats.
     * 
     * @return The pending withdrawal amount in sats.
    */
    function getPendingWithdrawalAmountSat() external view returns (uint256) {
        return pendingWithdrawalAmountSat;
    }

    /**
     * Credit operator for deposited collateral asset deposits.
     * 
     * Only callable by the parent SimpleBitcoinVault.
     * 
     * @param depositedCollateral Atomic units of collateral deposited to credit operator for
     * 
     * @return totalCollateral The total atomic units of collateral deposited after adding the new deposit
    */
    function creditOperatorCollateralDeposit(uint256 depositedCollateral) external onlyParentVault returns (uint256 totalCollateral) {
        depositedCollateralBalance = depositedCollateralBalance + depositedCollateral;
        return depositedCollateralBalance;
    }

    /**
     * Check how much collateral the operator has deposited, in atomic units.
     * 
     * @return totalCollateral The total atomic units of collateral that the operator has deposited
    */
    function getOperatorCollateralDeposited() external view returns (uint256 totalCollateral) {
        return depositedCollateralBalance;
    }

    /**
     * Determines whether the operator can initiate a new collateral withdrawal.
     * 
     * @return collateralWithdrawalAllowed Whether the operator can initiate a new collateral withdrawal
    */
    function canOperatorInitiateCollateralWithdraw() external view returns (bool collateralWithdrawalAllowed) {
        if (isPendingPartialCollateralWithdrawal()) {
            return false; // Cannot withdraw collateral if a partial collateral withdrawal is already in progress
        }

        if (partialLiquidationInProgress || pendingPartialLiquidationSats > 0) {
            return false; // Cannot withdraw collateral if a partial liquidation is possible or in progress
        }

        // Should never be a state where fullLiquidationAllowed = false but fullLiquidationStarted = true, but check both
        // as extra sanity check
        if (fullLiquidationAllowed || fullLiquidationStarted) {
            if (fullLiquidationDone) {
                 return true;
            } else {
            return false; // Cannot withdraw collateral if a full liquidation is allowed/started but not completed
            }
        }

        return true;
    }

    /**
    * Checks whether a withdrawal of collateral by the vault operator is pending.
    *
    * @return isPendingWithdrawal Whether there is a pending withdrawal of collateral by the vault operator pending
    */
    function isPendingPartialCollateralWithdrawal() public view returns (bool isPendingWithdrawal) {
        return pendingCollateralWithdrawal != 0;
    }


    /**
     * Calculates how much collateral (in atomic units) is available which is over the current
     * softCollateralizationThreshold based on the current price reported by the price oracle.
     *
     * For example, if:
     *   - 100_000_000 units of an ERC20 are deposited as collateral
     *   - The price oracle reports that 10_000_000 units of that ERC20 = 1 BTC
     *   - The softCollateralizationThreshold is 130 (%)
     *   - The vault currently holds 5 BTC
     *
     * Then:
     *   - The vault must keep 5 * 10_000_000 * 130 / 100 = 65_000_000 units of collateral
     *     (note that this is 6.5 BTC worth of collateral, and 6.5/5 = 1.3 which corresponds
     *     to the softCollateralizationThreshold of 130 (%)).
     *   - Meaning 100_000_000 - 65_000_000 = 35_000_000 units of collateral are free
     *
     * This function takes into account any pending withdrawals of collateral; if an operator has
     * initiated a pending collateral withdrawal then this function will subtract the maximum
     * potential pending withdrawal.
     *
     * @return freeCollateralAtomicUnits The amount of free collateral in atomic units
    */
    function getFreeCollateral() public view returns (uint256 freeCollateralAtomicUnits) {
        uint256 utilizedCollateral = getUtilizedCollateralSoft();

        // Calculate the remaining collateral if the operator's full pendingCollateralWithdrawal is
        // accepted
        uint256 conservativeTotalCollateral = depositedCollateralBalance - pendingCollateralWithdrawal;

        if (utilizedCollateral > conservativeTotalCollateral) {
            // This can happen on an edge case where the pendingCollateralWithdrawal would decrease
            // the total collateral below what is requied to be kept. This pending withdrawal wound
            // not be permitted to happen in its entirety, so the actual withdrawal will either be
            // trimmed down to what is permitted or disallowed entirely. Either way, there is no
            // free collateral.
            return 0;
        }

        return conservativeTotalCollateral - utilizedCollateral;
    }

    /**
     * Determines whether an additional deposit of depositAmount will result in exceeding the
     * soft collateralization threshold for deposit acceptance. Does not take into account
     * pending collateral withdrawals as accepting a deposit will change the utilized collateral
     * which will change the actual permitted collateral withdrawal amount.
     * 
     * @param depositAmount Additional deposit amount in satoshis
     * 
     * @return exceedsCollateral Whether the additional deposit would result in exceeding the 
     *                           soft collateralization threshold.
     */
    function doesDepositExceedSoftCollateralThreshold(uint256 depositAmount) public view returns (bool exceedsCollateral) {
        uint256 simulatedDepositsHeld = totalDepositsHeld + depositAmount;

        // Calculate how much collateral would be required to accept the deposit
        // at the soft collateralization threshold
        uint256 simulatedUtilizedCollateral = calculateCollateralUtilization(simulatedDepositsHeld, softCollateralizationThreshold);

        // If the amount of utilized collateral assuming the deposit was accepted
        // exceeds the deposited collateral balance, then the deposit cannot
        // be accepted.
        return (simulatedUtilizedCollateral > depositedCollateralBalance);
    }

    /**
     * Calculate how much of the current collateral is utilized to maintain the current active
     * softCollateralizationThreshold.
     *
     * For example, if:
     *   - 100_000_000 units of an ERC20 are deposited as collateral
     *   - The price oracle reports that 10_000_000 units of that ERC20 = 1 BTC
     *   - The softCollateralizationThreshold is 130 (%)
     *   - The vault currently holds 5 BTC
     *
     * Then:
     *   - The vault must keep 5 * 10_000_000 * 130 / 100 = 65_000_000 units of collateral
     *     (note that this is 6.5 BTC worth of collateral, and 6.5/5 = 1.3 which corresponds
     *     to the softCollateralizationThreshold of 130 (%)).
     * 
     * @return utilizedCollateralAtomicUnits The amount of atomic units of collateral that are utilized
    */
    function getUtilizedCollateralSoft() public view returns (uint256 utilizedCollateralAtomicUnits) {
        uint256 utilizedCollateral = calculateCollateralUtilization(totalDepositsHeld, softCollateralizationThreshold);

        // If the utilized collateral (calculated at the soft collateralization threshold) is 
        // more than the deposited collateral balance, then it means the vault is undercollateralized
        // considering the soft collateralization threshold.
        //
        // If this does occur, no action is taken in this function, but since only the total
        // deposited collateral balance could be "utilized", return that value instead.
        if (utilizedCollateral > depositedCollateralBalance) {
            return depositedCollateralBalance;
        }

        return utilizedCollateral;
    }

    /**
     * An internal utility method to calculate collateral utilization based on a specific
     * totalDeposits value (which can either be the current totalDepositsHeld value or a simulated
     * value) along with a collateralization ratio.
     * 
     * @param totalDeposits The amount of BTC deposits in atomic units (sats)
     */
    function calculateCollateralUtilization(uint256 totalDeposits, uint256 collateralizationRatio) internal view returns (uint256 utilizedCollateralAtomicUnits) {
        IAssetPriceOracle oracle = vaultConfig.getPriceOracle();
        // deposits held (in sats) times quantity of collateral in atomic units for 1 BTC times the
        // soft collateralization threshold, divided by 100 since the collateralization threshold is
        // a percentage (ex: 130 = 130%), divided by 100_000_000 to cancel out the price being
        // denominated in Bitcoin rather than sats.
        return ((totalDeposits * oracle.getAssetQuantityToBTC() * collateralizationRatio) / 100) / 100_000_000;
    }


    /**
     * When a vault has excess collateral over the set soft collateralization threshold, the
     * operator can withdraw the excess. However, users may be making deposits on Bitcoin with the
     * expectation of the vault's current excess collateral, so the withdrawal must be executed in
     * two parts:
     *   1. Initiate the collateral withdrawal with the amount of units they desire to withdraw
     *   2. After a delay, withdraw actual excess collateral up to the specified withdrawal amount
     *      if possible.
     *
     * Once a collateral withdrawal is initiated, the amount of collateral that *could* be withdrawn
     * (assuming conditions at finalization permit) is available information to depositors, who can
     * use the time until that collateral will be withdrawn to determine whether their deposit will
     * be successful.
     *
     * The delay in withdrawing collateral also ensures that any depositor who initiated a deposit
     * transaction on Bitcoin with reasonable fees to get into the Bitcoin blockchain in a timely
     * manner will not be subject to the pending potential collateral change.
     *
     * The amount that can actually be withdrawn at the end will be based on:
     *   1. The price of the asset at the time of withdrawal (decreases in the price between
     *      initiating the withdrawal and finalizing the withdrawal will cause the collateral
     *      utilization to increase, and the requested withdrawal amount may no longer be 
     *      possible to withdraw without falling below the soft collateralization threshold)
     *   2. Net changes to the BTC custodied by the vault (if there is a net increase
     *      in BTC custodied by the vault between initiating the withdrawal and finalizing
     *      the withdrawal, then the collateral utilization will also increase)
     *
     * It is possible that the price of the collateral asset increases relative to BTC *and* there
     * is a net increase in the BTC custodied by the vault, and the balance between the two will
     * determine whether the net effect is an increase or decrease in the collateral utilization.
     *
     * For example, if a withdrawal is initiated when:
     *   - A vault has 100_000 units of collateral
     *   - The collateral value is 10_000 units of collateral to 1 BTC
     *   - The vault holds 2 BTC
     *   - The soft collateralization threshold is 200 (%)
     *
     * Then the amount of collateral needed to satisfy the 200% soft threshold is 40_000 units, so
     * up to 60_000 could be withdrawn, so the operator's desiredWithdrawalAmount could be anything
     * <= 60_000 units.
     *
     * But if at the time of finalization (due to net BTC inflows and/or changes in collateral
     * value) there are only 55_000 units available, then if the operator specified a quantity >=
     * 55_000, they would only be able to withdraw 55_000 during finalization.
     * 
     * @param desiredWithdrawalAmount The amount of collateral the operator wants to withdaw, in atomic units
     * 
    */
    function initiatePartialCollateralWithdrawal(uint256 desiredWithdrawalAmount) external onlyOperatorAdmin {
        // Cannot withdraw zero atomic units
        require(desiredWithdrawalAmount > 0, "withdrawal amount must not be zero");

        // Ensure there is not already a pending withdrawal
        require(!isPendingPartialCollateralWithdrawal(), "cannot initiate a partial collateral withdrawal when one is already pending");

        uint256 freeCollateral = getFreeCollateral();

        // Ensure that the desired withdrawal amount does not exceed the amount
        // of free collateral currently available in the vault.
        // This behavior could be loosened to allow larger requests that will
        // be eventually be modified based on the actual free collateral available
        // at withdrawal finalization.
        require(desiredWithdrawalAmount <= freeCollateral, "desired withdrawal amount must be less than free collateral");

        pendingCollateralWithdrawal = desiredWithdrawalAmount;
        pendingCollateralWithdrawalRequestTime = block.timestamp;
    }


    /**
     * Finalizes a partial collateral withdrawal, returning collateral to the operator admin.
     *
     * Allows withdrawal of the lower of:
     *   - The *current* available collateral under the soft collateralization threshold, OR
     *   - The originally requested withdrawal amount
    */
    function finalizePartialCollateralWithdrawal() external onlyOperatorAdmin {
        // Cannot perform a partial collateral withdrawal unless one has already been initiated
        require(isPendingPartialCollateralWithdrawal(), "there is no pending collateral withdrawal to finalize");

        // Cannot perform a partial collateral withdrawal if a partial liquidation is in progress or
        // could be triggered
        require(!partialLiquidationInProgress && (pendingPartialLiquidationSats == 0), 
        "there is a partial liquidation authorized or in progress");

        // Cannot perform a partial collateral withdrawal if a full liquidation is active.
        // fullLiquidationAllowed should never be false if fullLiquidationStarted is true, but check
        // both as extra sanity check.
        require(!fullLiquidationAllowed && !fullLiquidationStarted, 
        "there is a full liquidation authorized or in progress");

        // Ensure that sufficient time has elapsed from when the partial collateral withdrawal was
        // requested
        require(pendingCollateralWithdrawalRequestTime + PARTIAL_COLLATERAL_WITHDRAWAL_DELAY <= block.timestamp, 
        "the waiting period for a partial collateral withdrawal has not elapsed");

        // Only allow operator to withdraw free collateral OR the requested withdrawal amount,
        // whichever is lower
        uint256 withdrawalAmount = getFreeCollateral();
        if (pendingCollateralWithdrawal < withdrawalAmount) {
            withdrawalAmount = pendingCollateralWithdrawal;
        }

        // Transfter the collateral to the operator admin (same as msg.sender)
        // Must instruct the parent vault to fulfill this collateral transfer as this contract does
        // not hold the collateral directly
        bool withdrawalSuccess = parentVault.transferCollateralForChild(operatorAdmin, withdrawalAmount);
        require(withdrawalSuccess, "unable to transfer the specified amount of collateral");

        // Deduct withdrawal amount from deposited collateral balance
        depositedCollateralBalance = depositedCollateralBalance - withdrawalAmount;
    }


    /**
     * Begins a full collateral liquidation. Anyone can call this function and it will only be
     * successful if a full liquidation is either allowed due to operator misbehavior or vault
     * under-collateralization.
     *
     * If a pending liquidation is in progress, the pending liquidation is halted and the hBTC sent
     * by the current bidder is returned.
     *
     * The full collateral liquidation starts by setting an initial price for the collateral in
     * hBTC, and then over time the price increases.
     *
     * The liquidation must run for at least 4 hours (FULL_LIQUIDATION_DEPOSIT_GRACE_PERIOD) to
     * allow any straggler deposits to be processed and the corresponding hBTC also liquidated.
    */
    function beginFullCollateralLiquidation() external {
        // First, check the collateralization ratio
        IAssetPriceOracle oracle = vaultConfig.getPriceOracle();
        uint256 collateralUnitsToBTC = oracle.getAssetQuantityToBTC();

        if (!fullLiquidationAllowed) {
            // A full liquidation hasn't already been allowed due to operator misbehavior, so
            // check whether a full liquidation is allowed based on collateral asset value versus
            // deposits held on behalf of the protocol.
            // Get the value of the current deposited BTC priced in the collateral asset
            uint256 collateralCostOfDepositedBTC = collateralUnitsToBTC * totalDepositsHeld / 100_000_000; 

            uint256 collateralRatio = (depositedCollateralBalance * 100) / collateralCostOfDepositedBTC;
            if (collateralRatio >= vaultConfig.getHardCollateralizationThreshold()) {
                revert("no operator misbheavior and hard collateral threshold has not been surpassed");
            }
            fullLiquidationAllowed = true;
        }

        // Check if a partial liquidation is in progress, and if so stop it and return held bid funds
        if (partialLiquidationInProgress) {
                PartialLiquidation storage pl = partialLiquidationStatus[partialLiquidationCounter - 1];
                btcTokenContract.transferFrom(address(this), pl.currentBidder, pl.amountSatsToRecover);
                pl.finished = true;
                partialLiquidationInProgress = false;
        }

        // Vault liquidation is allowed, set the starting price to 5% higher than oracle reports,
        // and set starting timestamp for liquidation.
        fullLiquidationStarted = true;
        fullLiquidationStartTime = block.timestamp;
        fullLiquidationStartingPrice = (collateralUnitsToBTC * 105) / 100;
    }


    /**
     * Begins a partial liquidation based on the current value of pendingPartialLiquidationSats.
     * 
     * Callable by anyone, as anyone should be able to start a partial liquidation if there are
     * funds that are eligible to be liquidated.
     *
     * To begin a partial liquidation, the caller triggering the partial liquidation must submit a
     * starting bid, which is the amount of collateral they request in return for the required
     * amount of hBTC.
     *
     * Caller passes in the bid along with the amount of hBTC they are expecting to pay, which is
     * provided as a sanity check to make sure the caller's bid is only submitted and a liquidation
     * is kicked off when the amount of hBTC they are bidding with is what they expect.
     *
     * Caller also passes in a timestamp before which the bid must be processed to be accepted, so
     * that a signed partial liquidation initiation transaction can't be replayed later.
     *
     * The vault transfers the hBTC to itself, and will only return it to the sender if someone else
     * outbids them OR a full vault liquidation is triggered and the partial liquidation is rolled
     * into the full liquidation.
     *
     * If pendingPartialLiquidationSats > 0, then previous withdrawal finalizations or sweep
     * confirmations have increased this value based on the amount of BTC fees overpaid for on-BTC
     * actions that the operator must make the vault whole for.
     *
     * When a partial liqudation is started, 2x the amount of collateral that is equivalent to the
     * value of the hBTC to be recovered is reserved and an auction for the partial liquidation
     * begins.
     *
     * If the operator misbehaves in a way that allows a full liquidation to be performed, the
     * pending partial liquidation is halted and all pending liquidations are rolled into the full
     * liquidation.
     *
     * @param startingBid The amount of collateral asset the bidder wants to receive for their hBTC
     * @param hBTCQuantity The amount of hBTC the bidder will purchase (must match the amount to be liquidated)
     * @param maxAcceptanceTimestamp The timestamp after which this bid is invalid
     * 
    */
    function beginPartialLiquidation(uint256 startingBid, uint256 hBTCQuantity, uint256 maxAcceptanceTimestamp) external {
        require(!partialLiquidationInProgress, 
        "there is already a partial liquidation in progress");

        require(pendingPartialLiquidationSats > 0, 
        "there must be a nonzero pending liquidation amount");

        require(pendingPartialLiquidationSats == hBTCQuantity, 
        "the provided hBTC quantity is not the amount of sats to be liquidated");

        require(block.timestamp <= maxAcceptanceTimestamp, 
        "this bid is no longer valid based on the max acceptance timestamp");

        require(!fullLiquidationAllowed, "a full liquidation is permitted");

        if (partialLiquidationCounter > 0) {
            // A partial liquidation has been conducted previously, ensure that it has finished
            PartialLiquidation memory previousLiquidation = partialLiquidationStatus[partialLiquidationCounter - 1];

            require(previousLiquidation.finished, "a partial liquidation is already in progress");
        }

        // Transfer the spedified amount of hBTC to this contract to submit a bona-fide bid
        bool transferResult = btcTokenContract.transferFrom(msg.sender, address(this), hBTCQuantity);
        require(transferResult, "specified hBTC could not be collected");

        PartialLiquidation memory pl = 
        PartialLiquidation(pendingPartialLiquidationSats, block.timestamp, startingBid,
         block.timestamp, msg.sender, false);

        partialLiquidationStatus[partialLiquidationCounter] = pl;

        // Increment counter
        partialLiquidationCounter++;

        // Set pending liquidation sats to 0 as it has been cleared out with this pending partial
        // liquidation
        pendingPartialLiquidationSats = 0;

        // A partial liquidation is now in progress
        partialLiquidationInProgress = true;
    }

    /**
     * When a partial collateal liquication is already in progress, outbid the current best bidder
     * for the amount of hBTC being liquidated.
     * 
     * Callable by anyone because anyone should be able to build on collateral during a partial
     * liquidation.
     *
     * @param newBid The amount of collateral asset the bidder wants to receive for their hBTC
     * @param hBTCQuantity The  amount of hBTC the bidder will purchase (must match the amount to be liquidated)
     * @param maxAcceptanceTimestamp The timestamp after which this bid is invalid
    */
    function bidOnPartialCollateralLiquidation(uint256 newBid, uint256 hBTCQuantity, uint256 maxAcceptanceTimestamp) external {
        require(partialLiquidationInProgress, "no partial liquidation is in progress");

        require(block.timestamp <= maxAcceptanceTimestamp, 
        "this bid is no longer valid based on the max acceptance timestamp");

        PartialLiquidation storage pl = partialLiquidationStatus[partialLiquidationCounter - 1];

        // Make sure that this bid is for a smaller amount of collateral
        require(newBid < pl.currentBidAmount, "new bid is not low enough");
        require(hBTCQuantity == pl.amountSatsToRecover, "amount of hBTC is incorrect");

        // Transfer the spedified amount of hBTC to this contract to submit a bona-fide bid

        bool transferResult = btcTokenContract.transferFrom(msg.sender, address(this), hBTCQuantity);
        require(transferResult, "specified hBTC count could not be collected");

        // Transfer the original hBTC back to the previous bidder
        bool returnTransferResult = btcTokenContract.transfer(pl.currentBidder, hBTCQuantity);

        // This should be impossible, as this vault should always have sufficient hBTC which was
        // sent by the previous bidder that we are returning.
        require(returnTransferResult, 
        "specified hBTC could not be returned to previous bidder"); 

        pl.currentBidAmount = newBid;
        pl.currentBidTime = block.timestamp;
        pl.currentBidder = msg.sender;
    }

    /**
     * Called by a partial liquidator when enough time has elapsed since the last bid for their bid
     * to be accepted. Transfers the bid-for amount of the collateral asset to the partial
     * liquidator, and burns the collected hBTC.
     * 
     * Callable by anyone, but in practice only the winning bidder generally has a reason to
     * call this function and finalize the bid.
    */
    function finalizePartialCollateralLiquidation() external {
        require(partialLiquidationInProgress, "no partial liquidation is in progress");

        PartialLiquidation storage pl = partialLiquidationStatus[partialLiquidationCounter - 1];

        require(pl.finished == false, "partial liquidation already completed");

        require(pl.currentBidTime + PARTIAL_LIQUIDATION_BID_TIME <= block.timestamp, 
        "bid is not old enough");

        // Transfer the hBTC to burn to the parent vault who can call the burn method on
        // BitcoinTunnelManager
        bool intermediateTransferResult = btcTokenContract.transferFrom(address(this), address(parentVault), pl.amountSatsToRecover);

        require(intermediateTransferResult, 
        "unable to transfer hBTC to burn to the parent contract");

        parentVault.burnLiquidatedBTC(pl.amountSatsToRecover);

        // Decrease the total BTC deposits held by this vault by the amount that was burnt
        totalDepositsHeld = totalDepositsHeld - pl.amountSatsToRecover;

        vaultConfig.getPermittedCollateralAssetContract().transfer(pl.currentBidder, pl.currentBidAmount);
        depositedCollateralBalance = depositedCollateralBalance - pl.currentBidAmount;

        pl.finished = true;
        partialLiquidationInProgress = false;
    }

    /**
     * Buys collateral in exchange for hBTC during a full liquidation process.
     *
     * The price that collateral is sold at is based on the starting price, updated based on how
     * long it has been since the liquidation process began.
     *
     * @param hBTCQuantity The quantity of hBTC the buyer wants to sell in exchange for collateral at the current price
     * @param recipient The recipient of the collateral. Optional, if not provided will default to msg.sender.
    */
    function purchaseCollateralDuringFullLiquidation(uint256 hBTCQuantity, address recipient) external {
        require(fullLiquidationStarted, "there is not an ongoing liquidation");
        require(totalDepositsHeld > 0, "there are no deposits to bid on currently");

        if (recipient == address(0)) {
            recipient = msg.sender;
        }

        if (hBTCQuantity > totalDepositsHeld) {
            // Limit buyer to the amount of hBTC the vault needs to liquidate
            hBTCQuantity = totalDepositsHeld;
        }

        // First transfer hBTC from the buyer to this contract, then to the parent which can burn it.
        // We do not permit a direct call to a BitcoinTunnelManager function which can burn to ensure that a
        // vault implementation could not burn hBTC in an unauthorized manner.
        bool hBTCDepositSuccess = btcTokenContract.transferFrom(msg.sender, address(this), hBTCQuantity);
        require(hBTCDepositSuccess, "unable to transfer the specified amount of hBTC from the caller");

        // Transfer the hBTC to burn to the parent vault who can call the burn method on BitcoinTunnelManager
        bool intermediateTransferResult = btcTokenContract.transferFrom(address(this), address(parentVault), hBTCQuantity);
        require(intermediateTransferResult, "unable to transfer hBTC to burn to the parent contract");
        parentVault.burnLiquidatedBTC(hBTCQuantity);

        uint256 currentPricePerBTC = getCurrentFullLiquidationCollateralPrice();
        uint256 collateralAmountOfSale = hBTCQuantity * currentPricePerBTC / 100_000_000;
        
        bool collateralTransferSuccess = parentVault.transferCollateralForChild(recipient, collateralAmountOfSale);
        require(collateralTransferSuccess, "transferring collateral to the buyer failed");

        depositedCollateralBalance = depositedCollateralBalance - collateralAmountOfSale;
        totalDepositsHeld = totalDepositsHeld - hBTCQuantity;

        // Not setting the vault to closed yet, because we could be still within the full liquidation
        // grace period meaning more deposits could be accepted which would require further liquidation.
        // Operator must close the vault themselves which will check that condition.
    }

    /**
     * Calculates the current price (in atomic units of collateral asset) per BTC (100M sats) based
     * on the current time versus when the liquidation was started.
     * 
     * @return collateralAtomicUnitsPerBTC The amount of atomic units of collateral which a full liquidation should buy 1 hBTC for
    */
    function getCurrentFullLiquidationCollateralPrice() public view returns (uint256 collateralAtomicUnitsPerBTC) {
        uint256 secondsSinceLiquidationStart = block.timestamp - fullLiquidationStartTime;
        uint256 increasePerPeriod = (fullLiquidationStartingPrice * FULL_LIQUIDATION_INCREASE_INCREMENT_BPS / 10000);
        uint256 incrementPeriods = secondsSinceLiquidationStart / FULL_LIQUIDATION_INCREASE_TIME;

        return fullLiquidationStartingPrice + (increasePerPeriod * incrementPeriods);
    }

    /**
     * Called by the parent SimpleBitcoinVault when a full liquidation should be allowed.
    */
    function setFullCollateralLiquidationAllowed() external onlyParentVault {
        fullLiquidationAllowed = true;
    }

    /**
     * Check whether a full liquidation is allowed. This will return true if a full liquidation has
     * ever been allowed, regardless of whether it is also in progress or already finished (all cases return true).
     * 
     * @return Whether a full liquidation is allowed (returns true even if it has already been started or completed)
    */
    function isFullCollateralLiquidationAllowed() external view returns (bool) {
        return fullLiquidationAllowed;
    }

    /**
     * Called by the parent SimpleBitcoinVault when operator actions led to a number of hBTC sats
     * that need to be liquidated in a partial vault liquidation.
     * 
     * @param additionalSats The number of sats to add to the existing pending partial liquidation sats quantity
    */
    function creditPartialPendingLiquidationSats(uint256 additionalSats) external onlyParentVault {
        pendingPartialLiquidationSats = pendingPartialLiquidationSats + additionalSats;
    }

    /**
     * Gets the amount of sats that are pending partial liquidation.
     * Note that this does not include sats that are actively being liquidated in an ongoing partial
     * liquidation round.
     * 
     * @return The amount of sats pending a partial liquidation
    */
    function getPendingPartialLiquidationSats() external view returns (uint256) {
        return pendingPartialLiquidationSats;
    }

    /**
     * Subtracts fees collected by an operator from any pending partial liquidation if any, and
     * returns the remaining fees which can be credited to the operator.
     * 
     * @param fees The collected operator fees
     * 
     * @return remainingFees The fees remaining after counting fees against any pending partial liquidations
    */
    function processCollectedFeesToDecrementPartialPendingLiquidation(uint256 fees) public onlyParentVault returns (uint256 remainingFees) {
        return permissionedDecrementPartialPendingLiquidationImpl(fees);
    }

    /**
     * Decreases the partial pending liquidation sats by up to the provided amount in sats, returning
     * any excess sats which were left over beyond the total pendingPartialLiquidationSats if applicable.
     * 
     * Private and only callable by functions in this contract which themselves must guard to make sure
     * the reduction is appropriately authorized.
     * 
     * @param maxReduction The maximum number of satoshis to reduce the partial pending liquidation by
     * 
     * @return unused The remaining sats if any above and beyond what was required to zero out the partial
     *                pending liquidation
     */
    function permissionedDecrementPartialPendingLiquidationImpl(uint256 maxReduction) private returns (uint256 unused) {
        if (pendingPartialLiquidationSats > 0) {
            if (maxReduction > pendingPartialLiquidationSats) {
                uint256 temp = pendingPartialLiquidationSats;
                pendingPartialLiquidationSats = 0;
                return maxReduction - temp;
            } else {
                pendingPartialLiquidationSats = pendingPartialLiquidationSats - maxReduction;
                return 0;
            }
        }
        return maxReduction;
    }

    /**
     * Returns whether a full liquidation has been started.
     * Note that this will always return true if a full liquidation has been started, even if the
     * full liquidation is over.
     * 
     * @return Whether a full liquidation for this vault has ever been started
    */
    function isFullLiquidationStarted() public view returns (bool) {
        return fullLiquidationStarted;
    }

    /**
     * Determine whether the full liquidation deposit grace period has elapsed.
     * If called before a full liquidation has been started, this will always return false.
     * Otherwise, will check the current timestamp against the timestamp when the full liquidation
     * was started plus the grace period.
     * 
     * @return gracePeriodElapsed Whether the full liquidation deposit grace period has elapsed
    */
    function hasFullLiquidationDepositGracePeriodElapsed() external view returns (bool gracePeriodElapsed) {
        // Full liquidation has not been started, so impossible for grace period to elapse
        if (!isFullLiquidationStarted()) {
            return false;
        }

        if (fullLiquidationStartTime + FULL_LIQUIDATION_DEPOSIT_GRACE_PERIOD >= block.timestamp) {
            return false; // Liquidation has been started but grace period has not elapsed
        }

        return true;
    }


    /**
     * Burns hBTC voluntarily by the operator which lowers the effective deposits held by this
     * vault. For example if a vault holds 1 BTC on behalf of the protocol and the operator wants to
     * lower this amount to 0.9, they could use this function to burn 0.1 hBTC.
     *
     * This could be done for several reasons: to lower the collateralization threshold, to
     * self-liquidate before a partial liquidation is kicked off, to self-liquidate during a full
     * liquidation, or in the event that the vault still holds some hBTC that nobody is withdrawing
     * and the operator wants to close the vault and retrieve their collateral.
     * 
     * @param amountSats Amount of hBTC to burn from operator and credit towards vault's custodianship
    */
    function voluntaryhBTCBurn(uint256 amountSats) onlyOperatorAdmin external {
        bool success = btcTokenContract.transferFrom(operatorAdmin, address(parentVault), amountSats);
        require(success, "unable to transfer specified amount of hBTC from the operator");

        parentVault.burnLiquidatedBTC(amountSats);

        // First, burned amount is removed from any pending but not-yet-active partial liquidations.
        // If no partial liquidation is waiting, this will return the full amount back as remaining.
        uint256 remaining = permissionedDecrementPartialPendingLiquidationImpl(amountSats);

        // Then, burned hBTC is compared against the net deposits.
        // The operator cannot burn more hBTC than the net deposits, and can not be used
        // to get out of having to process withdrawals that have already been requested
        // which is why we check net deposits rather than total deposits held.
        require(remaining <= (totalDepositsHeld - pendingWithdrawalAmountSat), 
        "cannot burn more hBTC than needed to zero out net deposits");
        
        decreaseTotalDepositsHeldFromOperatorBurning(remaining);
    }
}