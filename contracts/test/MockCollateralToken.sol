// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockCollateralToken is ERC20 {
    constructor() ERC20("MockToken", "MOCK") {
        // Do nothing
    }

    // Allow anyone to mint any amount of tokens for testing
    function mintTokens(address recipient, uint256 amount) public {
        _mint(recipient, amount);
    }

    // 18 decimal points as standard
    function decimals() override(ERC20) public view virtual returns (uint8) {
        return 18;
    }
}