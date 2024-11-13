// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "../vaults/IVaultFactory.sol";

/** 
* An implementation of a simple whitelist system for addresses.
* 
* Used when a whitelist is enabled for either vault creation or withdrawals.
* 
* The AddressWhitelist is initialized with an owner that can update the
* whitelist. It is up to the caller to determine whether to consult the whitelist
* for gating a certain upstream action.
* 
*/
contract AddressWhitelist {
    /**
    * The notZeroAddress modifier is used on all functions where a check that an
    * address argument is not the zero address.
    */
    modifier notZeroAddress(address addr) {
        require(addr != address(0), "cannot use zero address");
        _;
    }

    /**
    * The onlyOwner modifier is used on all functions where a check that the caller
    * is the owner is required.
    */
    modifier onlyOwner() {
        require(msg.sender == owner, "requires caller to be owner");
        _;
    }

    // The owner who is able to update the whitelist. Should always be an owning
    // contract that can manage permissions upstream.
    address public owner;

    // The whitelist itself, initially all addresses map to false
    mapping(address => bool) public whitelist;

    constructor(address ownerAddr) notZeroAddress(ownerAddr) {
        owner = ownerAddr;
    }

    /**
    * Adds an address to the whitelist. Does not check if address was already whitelisted,
    * as end result is the same. Whitelisting the zero address is not permitted, to avoid
    * unintended behavior / potential vulnerabilities from upstream callers that do not
    * perform zero-address checks correctly when checking the whitelist.
    * 
    * @param addr Address to add to the whitelist
    */
    function addToWhitelist(address addr) onlyOwner() notZeroAddress(addr) external {
        whitelist[addr] = true;
    }

    /**
    * Removes an address from the whitelist. Does not check if address was already whitelisted,
    * as end result is the same. No check for removing the zero address as the zero address
    * should never be whitelisted anyway, so will always be false regardless.
    *
    * @param addr Address to remove from the whitelist
    */
    function removeFromWhitelist(address addr) onlyOwner() external {
        whitelist[addr] = false;
    }

    /**
    * Checks whether an address is currently in the whitelist. This will always return false
    * for the zero address because the zero address is prevented from being whitelisted by the
    * addToWhitelist() function.
    * 
    * @param addr The address to check the whitelist for.
    * 
    * @return isWhitelisted Whether the supplied address is currently in the whitelist.
    */
    function isAddressWhitelisted(address addr) public view returns (bool isWhitelisted) {
        return whitelist[addr];
    }
}