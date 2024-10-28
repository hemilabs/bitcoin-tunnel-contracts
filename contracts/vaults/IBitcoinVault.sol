// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "./CommonStructs.sol";

interface IBitcoinVault is CommonStructs {

    /**
    * Returns the current status of the vault.
    *
    * @return status The status of the vault.
    */
    function getStatus() external view returns (Status status);


    /**
    * Returns whether the particular vault implementation requires a preconfirmation step
    * for a deposit.
    *
    * @return requiresPreconfirmation Whether deposits to this vault require a preconfirmation step.
    */
    function requiresDepositPreconfirmation() external view returns (bool requiresPreconfirmation);


    /**
    * Pre-confirms a deposit, used only on vaults where requiresDepositPreconfirmation()
    * returns true. Vaults can use this if they need a two-phase deposit process, such as
    * a user revealing the script behind a deposit address the user themselves generated,
    * and the vault operators having to take an on-Bitcoin action with this information
    * before the deposit is considered finalized and BTC representative tokens should be minted.
    *
    * @param txid The transaction ID of the deposit transaction on Bitcoin
    * @param outputIndex The index of the output in the transaction which constitutes the deposit
    * @param extraInfo Arbitrary bytes that can contain additional data necessary to confirm a deposit
    *
    * @return success Whether the preconfirmation was successful, and a follup confirmation may be successful.
    */
    function preconfirmDeposit(bytes32 txid, uint256 outputIndex, bytes memory extraInfo) external returns (bool success);


    /** 
    * Process an incoming deposit, returning whether the deposit was successful,
    * the number of sats to credit, and the recipient to credit them to.
    * This function should only be called by the BitcoinTunnelManager, who will
    * mint the corresponding BTC tokens in response to the deposit being confirmed.
    *
    * Security Note:
    * Implementations should only allow the tunnelAdmin (generally a BitcoinTunnelManager) 
    * to call this function, as it is the contract responsible for minting hBTC based 
    * on a confirmed deposit.
    *
    * @param txid The transaction ID of the deposit transaction on Bitcoin
    * @param outputIndex The index of the output in the transaction which constitutes the deposit
    * @param extraInfo Arbitrary bytes that can contain additional data necessary to confirm a deposit
    *
    * @return success Whether the deposit was successful (the depositor should be credited)
    * @return totalDeposit The amount of sats that were deposited to the vault *before* fees are charged
    * @return netDeposit The net amount of hBTC to credit the depositor with, is netDeposit minus charged fees
    * @return depositor The EVM address that should be credited for the deposit
    */
    function confirmDeposit(bytes32 txid, uint256 outputIndex, bytes memory extraInfo) external returns (bool success, uint256 totalDeposit, uint256 netDeposit, address depositor);

    /**
    * Optional - only implemented by a IBitcoinVault implementation that permits its operators to
    * mint collected fees as hBTC. 
    *
    * Returns an amount of sats to mint that can be different than amountToMint to give vaults flexibility,
    * for example ignoring amountToMint if for some reason an operator should always mint all available fees.
    * 
    * Security Note:
    * Implementations should only allow the tunnelAdmin (generally a BitcoinTunnelManager) 
    * to call this function, as it is the contract responsible for minting the corresponding
    * hBTC.
    * 
    * @param operator The address of the operator to process a collected fee mintage for (passed through)
    * @param amountToMint The amount of collected fees to mint
    */
    function mintOperatorFees(address operator, uint256 amountToMint) external returns (bool success, uint256 sats);


    /**
    * Initiates a withdrawal from the vault which must be sent to the specified destinationScript.
    * The actual amount of the withdrawal will be lower than amountSats to account for the transaction
    * fee, which each implementation will determine independently.
    *
    * Security Note:
    * Implementations should only allow the tunnelAdmin (generally a BitcoinTunnelManager)
    * to call this function, as it is the contract responsible for burning hBTC corresponding
    * to the withdrawal.
    *
    * @param destinationScript The unlocking script that the withdrawn BTC must be sent to
    * @param amountSats The number of sats withdrawn (BTC representative token burnt) by the withdrawer
    * @param originator The EVM address of the originator, who hBTC should be recredited to if withdrawal fails
    *
    * @return success Whether the withdrawal *initialization* was successful
    * @return feeSats The fee charged in sats
    * @return uuid A unique UUID that will be used to manage the withdrawal through its lifecycle.
    */
    function initiateWithdrawal(bytes memory destinationScript, uint256 amountSats, address originator) external returns (bool success, uint256 feeSats, uint32 uuid);


    /**
    * Challenges a withdrawal, used by a withdrawer (via the BitcoinTunnel) to indicate that a withdrawal
    * was not processed by the vault as expected. If the challenge is successful (the vault agrees that
    * the withdrawal has not been processed as expected), it will return the number of sats to credit back
    * to the harmed withdrawer along with the withdrawer address these sats should be credited back to.
    *
    * Security Note:
    * Implementations should only allow the tunnelAdmin (generally a BitcoinTunnelManager)
    * to call this function, as it is the contract responsible for reminting hBTC based on a successful
    * withdrawal challenge.
    *
    * @param uuid The uuid of the withdrawal to be challenged
    * @param extraInfo Arbitrary bytes that can contain additional data necessary to challenge if required by vault implementation.
    *
    * @return success Whether the challenge was successful (the vault did misbehave)
    * @return satsToCredit How many sats the harmed withdrawer should be re-credited with
    * @return withdrawer The EVM address of the harmed withdrawer who the satsToCredit should be credited to
    */
    function challengeWithdrawal(uint32 uuid, bytes memory extraInfo) external returns (bool success, uint256 satsToCredit, address withdrawer);


    /**
    * Returns whether the vault is currently accepting deposits.
    *
    * @return acceptingDeposits Whether the vault is currently accepting deposits.
    */
    function isAcceptingDeposits() external view returns (bool acceptingDeposits);

    /**
    * Returns whether the vault is currently capable of processing another withdrawal.
    * This function returning true means that *some* withdrawal is possible, but does not
    * guarantee that a withdrawal of any particular size will be accepted.
    *
    * @return withdrawalAvailable Whether any withdrawal is currently possible
    */
    function isWithdrawalAvailable() external view returns (bool withdrawalAvailable);

    /**
    * Returns the lower and upper bounds of withdrawal amounts the vault will accept.
    * Function must revert if no withdrawal will be accepted.
    *
    * @return minWithdrawal The minimum amount in satoshis of a withdrawal the vault will currently accept
    * @return maxWithdrawal The maximum amount in satoshis of a withdrawal the vault will currently accept
    */
    function getWithdrawalLimits() external view returns (uint256 minWithdrawal, uint256 maxWithdrawal);
}