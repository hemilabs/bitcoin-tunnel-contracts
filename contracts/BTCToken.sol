// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract BTCToken is ERC20 {
    // Indicates that the provided address is not a valid authorized minter
    error InvalidAuthorizedMinter(address invalidMinter);

    // Indicates that an unauthorized address attempted to mint tokens
    error MinterAddressNotAuthorized(address invalidMinter);

    address public minter;

    constructor(address authorizedMinter) ERC20("HemiBitcoin", "hBTC") {
        if (authorizedMinter == address(0)) {
            revert InvalidAuthorizedMinter(authorizedMinter);
        }

        minter = authorizedMinter;
    }

    function mintBTC(address recipient, uint256 amount) public {
        if (msg.sender != minter) {
            revert MinterAddressNotAuthorized(msg.sender);
        }

        _mint(recipient, amount);
    }

    function burnBTC(address burnFrom, uint256 amount) public {
        if (msg.sender != minter) {
            revert MinterAddressNotAuthorized(msg.sender);
        }

        _burn(burnFrom, amount);
    }

    // Override decimals to set 8 to follow native Bitcoin
    function decimals() override(ERC20) public view virtual returns (uint8) {
        return 8;
    }
}