// SPDX-License-Identifier: MIT

pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./IAssetPriceOracle.sol";

/**
* This DummyPriceOracle implements the IAssetPriceOracle interface
* and acts as a simple price oracle that is updated by a single admin.
*
* Not recommended for production use.
*/
contract DummyPriceOracle is IAssetPriceOracle {
    // The ERC20 contract of the asset this DummyPriceOracle reports pricing for
    ERC20 asset;

    // The last price that this DummyPriceOracle's admin pushed
    uint256 price;

    // The admin who can change the price admin and update prices directly
    address oracleAdmin;

    // The admin who can update price only
    address priceAdmin;


    constructor(ERC20 assetContract, uint256 initialPrice, address initialOracleAdmin, address initialPriceAdmin) {
        asset = assetContract;
        price = initialPrice;
        oracleAdmin = initialOracleAdmin;
        priceAdmin = initialPriceAdmin;
    }

    /**
    * Returns the ERC20 contract of the asset this oracle reports price for.
    *
    * @return assetContract The ERC20 contract of the asset this oracle reports price for.
    */
    function getAssetContract() external view returns (ERC20 assetContract) {
        return asset;
    }

    /**
    * Returns the quantity of atomic units of the tracked asset which equals
    * 1 BTC.
    *
    * @return pricePerBTC The quantity of atomic units of the tracked asset which equals 1 BTC.
    */
    function getAssetQuantityToBTC() external view returns (uint256 pricePerBTC) {
        return price;
    }

    /**
    * Updates the price that this oracle reports, only callable by the oracleAdmin.
    *
    * @param newPrice The new price to set
    */
    function updatePrice(uint256 newPrice) external {
        // Either the oracleAdmin or priceAdmin can update the price
        require (msg.sender == oracleAdmin || msg.sender == priceAdmin);
        price = newPrice;
    }

    /**
    * Updates the oracleAdmin to a new address
    */
    function updateOracleAdmin(address newOracleAdmin) external {
        require (msg.sender == oracleAdmin);
        oracleAdmin = newOracleAdmin;
    }

    /**
    * Updates the priceAdmin to a new address
    */
    function udpatePriceAdmin(address newPriceAdmin) external {
        require (msg.sender == oracleAdmin);
        priceAdmin = newPriceAdmin;
    }
}