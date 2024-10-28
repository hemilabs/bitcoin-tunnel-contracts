// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

interface SimpleBitcoinVaultStructs {
    struct Withdrawal {
        uint32 withdrawalCounter;
        uint256 amount;
        uint256 fee;
        uint256 timestampRequested;
        bytes destinationScript;
        address evmOriginator;
    }
}

