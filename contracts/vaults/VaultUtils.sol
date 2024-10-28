// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

contract VaultUtils {
    /**
     * Convert bytes representing a hex string to the corresponding bytes.
     * For example, if called with the bytes [0x66, 0x65, 0x41, 0x38] which in ASCII is "feA8",
     * this method would return bytes [0xfe, 0xa8]
     *
     * TODO: Make this more efficient with lookup tables or something rather than fromHexChar().
     */
    function hexAsciiBytesToBytes(bytes memory source, uint startIndex, uint endIndex) public pure returns (bytes memory result) {
       result = new bytes((endIndex - startIndex) / 2);

        uint resultIndex = 0;
        for (uint i = startIndex; i < endIndex; i+=2) {
            result[resultIndex++] = bytes1(fromHexChar(uint8(source[i])) * 16 +
                                           fromHexChar(uint8(source[i+1])));
        }

        return result;
    }

    function fromHexChar(uint8 c) public pure returns (uint8) {
        if (bytes1(c) >= bytes1('0') && bytes1(c) <= bytes1('9')) {
            return c - uint8(bytes1('0'));
        }
        if (bytes1(c) >= bytes1('a') && bytes1(c) <= bytes1('f')) {
            return 10 + c - uint8(bytes1('a'));
        }
        if (bytes1(c) >= bytes1('A') && bytes1(c) <= bytes1('F')) {
            return 10 + c - uint8(bytes1('A'));
        }
        revert("Unable to convert to hex");
    }

    function bytesToAddress(bytes memory _input) public pure returns (address addr) {
        assembly {
            addr := mload(add(_input, 20))
        }
    }

    function bytesToAddressOffset(bytes memory _input, uint256 offset) public pure returns (address addr) {
        bytes32 out;

        for (uint i = 0; i < 20; i++) {
            out |= bytes32(_input[offset + i] & 0xFF) >> (i * 8);
        }

        return address(uint160(bytes20(out)));
    }
}