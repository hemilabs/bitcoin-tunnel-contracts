// SPDX-License-Identifier: MIT

pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
* An implementation if IAssetPriceOracle provides pricing for a specific
* ERC20 asset relative to BTC.
*
* Prices are returned as the quantity of the asset (in atomic units) worth
* 1 BTC (100_000_000 sats).
*
* For example:
*   - WETH has 18 decimals
*   - If exactly 25 ETH = 1 BTC, oracle would return 2.5*10^19.
*
* This interface provides a commmon way for Vault implementations to determine
* the value of collateral versus Bitcoin.
*
* This interface can be implemented in various ways; using different oracle providers,
* using on-chain data sources, etc.
*/
interface IAssetPriceOracle {
    /**
    * Returns the ERC20 contract of the asset this oracle reports price for.
    *
    * @return assetContract The ERC20 contract of the asset this oracle reports price for.
    */
    function getAssetContract() external view returns (ERC20 assetContract);

    /**
    * Returns the quantity of atomic units of the tracked asset which equals
    * 1 BTC.
    *
    * @return pricePerBTC The quantity of atomic units of the tracked asset which equals 1 BTC.
    */
    function getAssetQuantityToBTC() external view returns (uint256 pricePerBTC);
}