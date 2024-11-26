// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "../vaults/IBitcoinVault.sol";
import "hardhat/console.sol";

contract MockBitcoinVault is IBitcoinVault {

    Status public internalStatus;

    bool reqDepPreconfirm;

    mapping(bytes32 => bool) depositPreconfirmationCanBeAccepted;
    mapping(bytes32 => uint256) depositPreconfirmationAcceptanceOutputIndex;
    mapping(bytes32 => bytes32) depositPreconfirmationAcceptanceExtraInfoHash;


    mapping(bytes32 => bool) depositConfirmationCanBeAccepted;
    mapping(bytes32 => uint256) depositConfirmationAcceptanceOutputIndex;
    mapping(bytes32 => bytes32) depositConfirmationAcceptanceExtraInfoHash;
    mapping(bytes32 => uint256) depositConfirmationTotalAmount;
    mapping(bytes32 => uint256) depositConfirmationNetAmount;
    mapping(bytes32 => address) depositConfirmationDepositorAddress;

    mapping(address => uint256) operatorFeesToMint;
    bool partialOperatorFeeMint;
    bool mintOperatorFeesReturnFalseWithPositiveNumber;

    // Key for allowed initial withdrawal acceptance return values is the hash of (script + amount + address)
    mapping(bytes32 => bool) initiateWithdrawalAllowedInputs;
    mapping(bytes32 => uint256) initiateWithdrawalFeeSats;
    mapping(bytes32 => uint32) initiateWithdrawalUUID;

    mapping(uint32 => bool) canWithdrawalBeChallenged;
    mapping(uint32 => bytes32) withdrawalExtraDataHashForChallenge;

    bool initiateWithdrawalReturnFalseWithPositiveNumber;

    mapping(uint32 => bool) allowChallengingUUIDWithAnyData;
    mapping(bytes32 => bool) allowChallengingUUIDWithSpecificData;
    mapping(uint32 => uint256) challengedUUIDToSats;
    mapping(uint32 => address) challengedUUIDToAddress;

    bool challengeWithdrawalReturnFalseWithPositiveNumber;

    bool isVaultAcceptingDeposits;

    bool isVaultWithdrawalAvailable;

    uint256 minWithdrawalLimit;
    uint256 maxWithdrawalLimit;

    constructor() {
        // Do nothing
        // console.log("BitcoinVault deployer: %s", msg.sender);
    }


    function setStatus(uint statusNum) external {
        if (statusNum == 0) {
            internalStatus = Status.CREATED;
        } else if (statusNum == 1) {
            internalStatus = Status.INITIALIZING;
        } else if (statusNum == 2) {
            internalStatus = Status.LIVE;
        } else if (statusNum == 3) {
            internalStatus = Status.CLOSING_INIT;
        } else if (statusNum == 4) {
            internalStatus = Status.CLOSING_VERIF;
        } else if (statusNum == 5) {
            internalStatus = Status.CLOSED;
        }
    }

    function getStatus() external view returns (Status status) {
        return internalStatus;
    }

    function setRequiresDepositPreconfirmation(bool requiresPreconfirmation) external {
        reqDepPreconfirm = requiresPreconfirmation;
    }


    function requiresDepositPreconfirmation() external view returns (bool requiresPreconfirmation){ 
        return reqDepPreconfirm;
    }


    function setPreconfirmAccepted(bytes32 txid, uint256 outputIndex, bytes memory extraInfo) external {
        // Note: can only set one preconfirmation acceptance outputIndex and extraInfo at a time per txid,
        // this will override a previously set one for the same txid if one exists.
        depositPreconfirmationCanBeAccepted[txid] = true;
        depositPreconfirmationAcceptanceOutputIndex[txid] = outputIndex;
        depositPreconfirmationAcceptanceExtraInfoHash[txid] = keccak256(extraInfo);
    }

    function setPreconfirmRejected(bytes32 txid) public {
        depositPreconfirmationCanBeAccepted[txid] = false;

        // Set these to defaults, even though any use of them should be gated by acceptance boolean mapping
        depositPreconfirmationAcceptanceOutputIndex[txid] = 0;
        depositPreconfirmationAcceptanceExtraInfoHash[txid] = bytes32(0);
    }

    function preconfirmDeposit(bytes32 txid, uint256 outputIndex, bytes memory extraInfo) external returns (bool success) {
        if (depositPreconfirmationCanBeAccepted[txid] == false) {
            return false;
        }
        if (depositPreconfirmationAcceptanceOutputIndex[txid] != outputIndex) {
            return false;
        }
        bytes32 extraInfoHash = keccak256(extraInfo);
        if (depositPreconfirmationAcceptanceExtraInfoHash[txid] != extraInfoHash) {
            return false;
        }

        // Since the deposit has been preconfirmed, prevent it from being preconfirmed again (unless setPreconfirmAccepted is called again with same info)
        setPreconfirmRejected(txid);
        return true;
    }

    function setConfirmAccepted(bytes32 txid, uint256 outputIndex, bytes memory extraInfo, uint256 totalDeposit, uint256 netDeposit, address depositor) external {
        // Note: can only set one confirmation acceptance outputIndex and extraInfo at a time per txid
        // with a corresponding total and net amount and associated EVM address of depositor,
        // this will override a previously set one for the same txid if one exists.
        depositConfirmationCanBeAccepted[txid] = true;
        depositConfirmationAcceptanceOutputIndex[txid] = outputIndex;
        depositConfirmationAcceptanceExtraInfoHash[txid] = keccak256(extraInfo);
        depositConfirmationTotalAmount[txid] = totalDeposit;
        depositConfirmationNetAmount[txid] = netDeposit;
        depositConfirmationDepositorAddress[txid] = depositor;
    }


    function setConfirmRejected(bytes32 txid) public {
        depositConfirmationCanBeAccepted[txid] = false;

        // Set these to defaults, even though any use of them should be gated by acceptance boolean mapping
        depositConfirmationAcceptanceOutputIndex[txid] = 0;
        depositConfirmationAcceptanceExtraInfoHash[txid] = bytes32(0);
        depositConfirmationTotalAmount[txid] = 0;
        depositConfirmationNetAmount[txid] = 0;
        depositConfirmationDepositorAddress[txid] = address(0);
    }

    function confirmDeposit(bytes32 txid, uint256 outputIndex, bytes memory extraInfo) external returns (bool success, uint256 totalDeposit, uint256 netDeposit, address depositor) {
        if (depositConfirmationCanBeAccepted[txid] == false) {
            return (false, 0, 0, address(0));
        }
        if (depositConfirmationAcceptanceOutputIndex[txid] != outputIndex) {
            return (false, 0, 0, address(0));
        }
        bytes32 extraInfoHash = keccak256(extraInfo);
        if (depositConfirmationAcceptanceExtraInfoHash[txid] != extraInfoHash) {
            return (false, 0, 0, address(0));
        }

        // Since the deposit has been confirmed, prevent it from being confirmed again (unless setConfirmAccepted is called again with same info)
        uint256 totalDep = depositConfirmationTotalAmount[txid];
        uint256 netDep = depositConfirmationNetAmount[txid];
        address depAddr = depositConfirmationDepositorAddress[txid];
        setConfirmRejected(txid);
        return (true, totalDep, netDep, depAddr);
    }

    function setMintableOperatorFees(address operator, uint256 amountToMint) external {
        operatorFeesToMint[operator] = amountToMint;
    }

    function addMintableOperatorFees(address operator, uint256 additionalAmountToMint) external {
        operatorFeesToMint[operator] = operatorFeesToMint[operator] + additionalAmountToMint;
    }

    function setPartialOperatorFeeMintAllowed(bool allowed) external {
        partialOperatorFeeMint = allowed;
    }

    function setMintOperatorFeesToReturnFalseWithPositiveNumber(bool returnFalseWithPositiveNumber) external {
        // Return garbage data like (false, 100) where success is false but sats > 0.
        // Only applies when the mintOperatorFees function should have returned success=false.
        mintOperatorFeesReturnFalseWithPositiveNumber = returnFalseWithPositiveNumber;
    }


    function mintOperatorFees(address operator, uint256 amountToMint) external returns (bool success, uint256 sats) {
        uint256 mintable = operatorFeesToMint[operator];
        if (amountToMint >= mintable) {
            operatorFeesToMint[operator] = mintable - amountToMint;
            return (true, amountToMint);
        } else {
            if (partialOperatorFeeMint) {
                // Can mint a smaller amount than amountToMint
                operatorFeesToMint[operator] = 0;
                return (true, mintable);
            } else {
                if (mintOperatorFeesReturnFalseWithPositiveNumber) {
                    // Return garbage to make sure a bad IVaultImplementation returning bad data is caught upsteram
                    return (false, 100000000);
                } else {
                    return (false, 0);
                }
            }
        }
    }

    function calculateInitWithdrawalKey(bytes memory destinationScript, uint256 amountSats, address originator) public pure returns (bytes32) {
        bytes32 key = keccak256(abi.encodePacked(destinationScript, amountSats, originator));
        return key;
    }

    function setInitiateWithdrawalSucceeds(bytes memory destinationScript, uint256 amountSats, address originator, uint256 feeSats, uint32 uuid) external {
        bytes32 key = calculateInitWithdrawalKey(destinationScript, amountSats, originator);
        initiateWithdrawalAllowedInputs[key] = true;
        initiateWithdrawalFeeSats[key] = feeSats;
        initiateWithdrawalUUID[key] = uuid;
    }

    function setInitiateWithdrawalRejected(bytes memory destinationScript, uint256 amountSats, address originator) public {
        bytes32 key = calculateInitWithdrawalKey(destinationScript, amountSats, originator);
        initiateWithdrawalAllowedInputs[key] = false;

        // Set these to defaults, even though any use of them should be gated by acceptance boolean mapping
        initiateWithdrawalFeeSats[key] = 0;
        initiateWithdrawalUUID[key] = 0;
    }

    function setInitiateWithdrawalFailureReturnFalseWithPositiveNumbers(bool returnFalseWithPositiveNumbers) external {
        initiateWithdrawalReturnFalseWithPositiveNumber = returnFalseWithPositiveNumbers;
    }


    function initiateWithdrawal(bytes memory destinationScript, uint256 amountSats, address originator) external returns (bool success, uint256 feeSats, uint32 uuid) {
        bytes32 key = calculateInitWithdrawalKey(destinationScript, amountSats, originator);
        if (!initiateWithdrawalAllowedInputs[key]) {
            if (initiateWithdrawalReturnFalseWithPositiveNumber) {
                // Return garbage to make sure a bad IBitcoinVault implementation returning bad data is caught upsteram
                return (false, 250000000, 3);
            } else {
                return (false, 0, 0);
            }
        }

        uint256 feesRet = initiateWithdrawalFeeSats[key];
        uint32 uuidRet = initiateWithdrawalUUID[key];

        // Since the withdrawal has been confirmed, prevent it from being confirmed again (unless setInitiateWithdrawalSucceeds is called again with same info)
        // Note that this doesn't model normal vault behavior, but we are allowing caller to control returned uuids so this prevents accidental duplication.
        setInitiateWithdrawalRejected(destinationScript, amountSats, originator);

        return (true, feesRet, uuidRet);
    }

    function calculateChallengeWithdrawalKey(uint32 uuid, bytes memory extraInfo) public pure returns (bytes32) {
        bytes32 key = keccak256(abi.encodePacked(uuid, extraInfo));
        return key;
    }

    function setChallengeWithdrawalSucceeds(uint32 uuid, bytes memory extraInfo, bool anyExtraInfo, uint256 satsToCredit, address withdrawer) external {
        if (anyExtraInfo) {
            // UUID can be challenged regardless of the extraInfo provided
            allowChallengingUUIDWithAnyData[uuid] = true;
        } else {
            bytes32 key = calculateChallengeWithdrawalKey(uuid, extraInfo);
            allowChallengingUUIDWithSpecificData[key] = true;
        }


        challengedUUIDToSats[uuid] = satsToCredit;
        challengedUUIDToAddress[uuid] = withdrawer;
    }

    function setChallengeWithdrawalFails(uint32 uuid, bytes memory extraInfo, bool anyExtraInfo) public {
        // Always disable any challenge with the same uuid
        allowChallengingUUIDWithAnyData[uuid] = false;

        if (!anyExtraInfo) {
            bytes32 key = calculateChallengeWithdrawalKey(uuid, extraInfo);
            allowChallengingUUIDWithSpecificData[key] = false;
        }

        // Set these to defaults, even though any use of them should be gated by acceptance boolean mappings
        challengedUUIDToSats[uuid] = 0;
        challengedUUIDToAddress[uuid] = address(0);
    }

    function setChallengeWithdrawalFailureReturnsFalseWithNonzeroValues(bool returnFalseWithNonzeroValues) external {
        challengeWithdrawalReturnFalseWithPositiveNumber = returnFalseWithNonzeroValues;
    }

    function challengeWithdrawal(uint32 uuid, bytes memory extraInfo) external returns (bool success, uint256 satsToCredit, address withdrawer) {
        if (allowChallengingUUIDWithAnyData[uuid]) {
            uint256 sats = challengedUUIDToSats[uuid];
            address withdrawAddr = challengedUUIDToAddress[uuid];

            // Disable future successful challenges on this UUID unless allowed again by a call to setChallengeWithdrawalSucceeds
            setChallengeWithdrawalFails(uuid, extraInfo, extraInfo.length == 0);

            return (true, sats, withdrawAddr);
        } else {
            bytes32 key = calculateChallengeWithdrawalKey(uuid, extraInfo);
            if (allowChallengingUUIDWithSpecificData[key]) {
                uint256 sats = challengedUUIDToSats[uuid];
                address withdrawAddr = challengedUUIDToAddress[uuid];

                // Disable future successful challenges on this UUID unless allowed again by a call to setChallengeWithdrawalSucceeds
                setChallengeWithdrawalFails(uuid, extraInfo, true);

                return (true, sats, withdrawAddr);
            } else {
                if (challengeWithdrawalReturnFalseWithPositiveNumber) {
                    // Return garbage to make sure a bad IBitcoinVault implemntation returning bad data is caught upstream
                    return (false, 500000000, address(48409283));
                } else {
                    return (false, 0, address(0));
                }
            }
        }
    }

    function setIsAcceptingDeposits(bool isAcceptingDeps) external {
        isVaultAcceptingDeposits = isAcceptingDeps;
    }

    function isAcceptingDeposits() external view returns (bool acceptingDeposits) {
        return isVaultAcceptingDeposits;
    }

    function setIsWithdrawalAvailable(bool isWithdrawalAvail) external {
        isVaultWithdrawalAvailable = isWithdrawalAvail;
    }

    function isWithdrawalAvailable() external view returns (bool withdrawalAvailable) {
        return isVaultWithdrawalAvailable;
    }

    function setWithdrawalLimits(uint256 min, uint256 max) external {
        minWithdrawalLimit = min;
        maxWithdrawalLimit = max;
    }

    function getWithdrawalLimits() external view returns (uint256 minWithdrawal, uint256 maxWithdrawal) {
        return (minWithdrawalLimit, maxWithdrawalLimit);
    }
}