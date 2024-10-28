// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract Utils {
  // Helper function to slice bytes array
  function slice(bytes memory data, uint256 start, uint256 length) internal pure returns (bytes memory) {
    bytes memory part = new bytes(length);
    for (uint256 i = 0; i < length; i++) {
      part[i] = data[i + start];
    }
    return part;
  }

  // Helper function to convert bytes to bytes32
  function bytesToBytes32(bytes memory source) internal pure returns (bytes32 result) {
    if (source.length == 0) {
      return 0x0;
    }
    assembly {
      result := mload(add(source, 32))
    }
  }

  // Assumes parameter is right-aligned within a 32-byte input
  function toUintFromSlice(bytes memory source) internal pure returns (uint256 result) {
    require(source.length <= 32, "input exceeds 32 bytes");
    bytes memory temp = new bytes(32);
    for(uint256 i = 0; i < source.length; i++) {
        temp[32 - source.length + i] = source[i];
    }
    assembly {
        result := mload(add(temp, 32))
    }
  }
}