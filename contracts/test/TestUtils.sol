// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

contract TestUtils {
    function calculateScriptHash(bytes memory script) external pure returns (bytes32 scriptHash) {
        return keccak256(script);
    }
}