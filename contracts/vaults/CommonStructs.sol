// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

interface CommonStructs {
        enum Status {
        CREATED,
        INITIALIZING,
        LIVE,
        CLOSING_INIT,
        CLOSING_VERIF,
        CLOSED
    }
}