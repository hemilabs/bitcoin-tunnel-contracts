// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "../bitcoinkit/IBitcoinKit.sol";

/**
 * Implementation of the IGlobalVaultConfig contract serves to hold all of the configuration
 * settings that should be applied globally across all instances of a particular implementation of
 * the IBitcoinVault interface within the context of a single Bitcoin Tunnel deployment.
 *
 * An instance of an implementation of IGlobalVaultConfig should be defined at initialization for
 * the IVaultFactory implementation which is responsible for deploying contracts based on a specific
 * implementation of IBitcoinVault.
 *
 * It is up to the implementation of IGlobalVaultConfig to determine if (and if so, how) values can
 * be updated.
 *
 * It is up to the IBitcoinVault implementation itself to properly consult the this contract for
 * appropriate configuration.
 * 
 * At a minimum, an implementation of IGlobalVaultConfig must provide:
 *  - The min/max deposit and withdrawal operator fees that vaults of a particular type can set
 *  - The maximum fee in sat/vB that operators can use to process a withdrawal
 *  - The BitcoinKit contract that each vault should use
*/
interface IGlobalVaultConfig {
    // Events which an implementation must emit when the returned value from the respective function
    // has changed.
    event MinDepositFeesUpdated(uint256 newMinDepositFeeSats, uint256 newMinDepositFeeBasisPoints);
    event MaxDepositFeesUpdated(uint256 newMaxDepositFeeSats, uint256 newMaxDepositFeeBasisPoints);
    event MinWithdrawalFeesUpdated(uint256 newMinWithdrawalFeeSats, uint256 newMinWithdrawalFeeBasisPoints);
    event MaxWithdrawalFeesUpdated(uint256 newMaxWithdrawalFeeSats, uint256 newMaxWithdrawalFeeBasisPoints);
    event BitcoinKitContractUpdated(address indexed newBitcoinKitContract);

    // Emitted by implementation when all vaults that this global config applies to should be deprecated
    event DeprecateAllVaults();

    /**
     * Gets the minimum deposit fee in basis points that a vault can charge
     *
     * @return minDepositFeeBasisPoints The minimum deposit fee in basis points that a vault can charge
    */
    function getMinDepositFeeBasisPoints() external returns (uint256 minDepositFeeBasisPoints);

    /**
     * Gets the minimum deposit fee in sats that a vault can charge
     *
     * @return minDepositFeeSats The minimum deposit fee in sats that a vault can charge
    */
    function getMinDepositFeeSats() external returns (uint256 minDepositFeeSats);

    /**
     * Gets the maximum deposit fee in basis points that a vault can charge
     *
     * @return maxDepositFeeBasisPoints The maximum deposit fee in basis points that a vault can charge
    */
    function getMaxDepositFeeBasisPoints() external returns (uint256 maxDepositFeeBasisPoints);

    /**
     * Gets the maximum deposit fee in sats that a vault can charge
     *
     * @return maxDepositFeeSats The maximum deposit fee in sats that a vault can charge
    */
    function getMaxDepositFeeSats() external returns (uint256 maxDepositFeeSats);

    /**
     * Gets the minimum withdrawal fee in basis points that a vault can charge
     *
     * @return minWithdrawalFeeBasisPoints The minimum withdrawal fee in basis points that a vault can charge
    */
    function getMinWithdrawalFeeBasisPoints() external returns (uint256 minWithdrawalFeeBasisPoints);

    /**
     * Gets the minimum withdrawal fee in sats that a vault can charge
     *
     * @return minWithdrawalFeeSats The minimum withdrawal fee in sats that a vault can charge
    */
    function getMinWithdrawalFeeSats() external returns (uint256 minWithdrawalFeeSats);

    /**
     * Gets the maximum withdrawal fee in basis points that a vault can charge
     *
     * @return maxWithdrawalFeeBasisPoints The maximum withdrawal fee in basis points that a vault can charge
    */
    function getMaxWithdrawalFeeBasisPoints() external returns (uint256 maxWithdrawalFeeBasisPoints);

    /**
     * Gets the maximum withdrawal fee in sats that a vault can charge
     *
     * @return maxWithdrawalFeeSats The maximum withdrawal fee in sats that a vault can charge
    */
    function getMaxWithdrawalFeeSats() external returns (uint256 maxWithdrawalFeeSats);

    /**
     * Gets the BitcoinKit contract that should be used by vaults
     *
     * @return bitcoinKitContract The BitcoinKit contract that should be used by vaults
    */
    function getBitcoinKitContract() external returns (IBitcoinKit bitcoinKitContract);

    /**
     * Gets whether the vault implementation that consult this global config are deprecated
     *
     * @return deprecated Whether the vault implementation that consult this global config are deprecated
    */
    function isVaultSystemDeprecated() external returns (bool deprecated);
}