const {
    time,
    loadFixture,
  } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
    const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
    const { expect } = require("chai");

    const txid1 = "0x0011001100110011001100110011001100110011001100110011001100110011";
    const txid2 = "0x0022002200220022002200220022002200220022002200220022002200220022";
    const txid3 = "0x0033003300330033003300330033003300330033003300330033003300330033";
    const txid4 = "0x0044004400440044004400440044004400440044004400440044004400440044";
    const txid5 = "0x0055005500550055005500550055005500550055005500550055005500550055";
    const txid6 = "0x0066006600660066006600660066006600660066006600660066006600660066";
    const txid7 = "0x0077007700770077007700770077007700770077007700770077007700770077";
    const txid8 = "0x0088008800880088008800880088008800880088008800880088008800880088";
    const txid9 = "0x0099009900990099009900990099009900990099009900990099009900990099";

    const currentSweepUTXOTxid = "0x1A1B1C1D1E1F1011000000000000000022222222222222223333333333333333"

    const emptyHash = "0x0000000000000000000000000000000000000000000000000000000000000000";


    const input1 = {
        inValue: 100000,
        inputTxId: "0x1111111111111111111111111111111111111111111111111111111111111111",
        sourceIndex: 0,
        scriptSig: "0xaabbccddeeffaabbccddeeff001122334455",
        sequence: 0,
        fullScriptSigLength: 18,
        containsFullScriptSig: true
    }

    const input2 = {
        inValue: 80000,
        inputTxId: "0x1111111111111111111111111111111111111111111111111111111111111111",
        sourceIndex: 1,
        scriptSig: "0xaabbccddeeffaabbccddeeff0011223344001122",
        sequence: 0,
        fullScriptSigLength: 20,
        containsFullScriptSig: true
    }

    const input3 = {
        inValue: 500000,
        inputTxId: "0x2222222222222222222222222222222222222222222222222222222222222222",
        sourceIndex: 4,
        scriptSig: "0xaabbccddeeffaabbccddeeff001122334400557799ffaa",
        sequence: 0,
        fullScriptSigLength: 23,
        containsFullScriptSig: true
    }

    const input4 = {
        inValue: 250000,
        inputTxId: "0x3333333333333333333333333333333333333333333333333333333333333333",
        sourceIndex: 19,
        scriptSig: "0xaabbccddeeffaabbccddeeff001122334400557799ffaabbcc",
        sequence: 0,
        fullScriptSigLength: 25,
        containsFullScriptSig: true
    }

    const input5 = {
        inValue: 190000,
        inputTxId: "0x3333333333333333333333333333333333333333333333333333333333333333",
        sourceIndex: 16,
        scriptSig: "0xaabbccddeeffaabbccddeeff001122334400557799ffaabbdd",
        sequence: 0,
        fullScriptSigLength: 25,
        containsFullScriptSig: true
    }

    const input6 = {
        inValue: 190000,
        inputTxId: "0x3333333333333333333333333333333333333333333333333333333333333333",
        sourceIndex: 29,
        scriptSig: "0xaabbccddeeffaabbccddeeff001122334400557799ffaabbdd",
        sequence: 0,
        fullScriptSigLength: 25,
        containsFullScriptSig: true
    }

    const input7 = {
        inValue: 10000000,
        inputTxId: "0x4444444444444444444444444444444444444444444444444444444444444444",
        sourceIndex: 2,
        scriptSig: "0xaabbccddeeffaabbccddeeff001122334400557799ffaabbdd",
        sequence: 0,
        fullScriptSigLength: 25,
        containsFullScriptSig: true
    }

    const input8 = {
        inValue: 500,
        inputTxId: "0x4444444444444444444444444444444444444444444444444444444444444444",
        sourceIndex: 6,
        scriptSig: "0xaabbccddeeffaabbccddeeff001122334400557799ffaabbeeff",
        sequence: 0,
        fullScriptSigLength: 26,
        containsFullScriptSig: true
    }

    const input9 = {
        inValue: 43111,
        inputTxId: "0x4444444444444444444444444444444444444444444444444444444444444444",
        sourceIndex: 91,
        scriptSig: "0xaabbccddeeffaabbccddeeff001122334400",
        sequence: 0,
        fullScriptSigLength: 18,
        containsFullScriptSig: true
    }

    const sweepUTXO1 = "0xbb33bb33aa22aa22bb33bb33aa22aa22bb33bb33aa22aa22bb33bb33aa22aa22";
    const sweepUTXO1Output = 0;

    const sweepUTXO2 = "0x00aabbcc77ee44ffff44ee77ccbbaa0000aabbcc77ee44ffff44ee77ccbbaa00";
    const sweepUTXO2Output = 2;

    const sweepUTXOInput1 = {
        inValue: 50000,
        inputTxId: sweepUTXO1,
        sourceIndex: 0,
        scriptSig: "0xaabbccddeeffaabbccddeeff001122334400",
        sequence: 0,
        fullScriptSigLength: 24,
        containsFullScriptSig: true
    }


    const sweepInput1 = {
        inValue: 40000,
        inputTxId: txid2,
        sourceIndex: 0,
        scriptSig: "0xaabbccddeeffaabbccddeeff001122334401",
        sequence: 0,
        fullScriptSigLength: 25,
        containsFullScriptSig: true
    }

    const sweepInput2 = {
        inValue: 60000,
        inputTxId: txid3,
        sourceIndex: 2,
        scriptSig: "0xaabbccddeeffaabbccddeeff001122334402",
        sequence: 0,
        fullScriptSigLength: 25,
        containsFullScriptSig: true
    }

    const sweepInput3 = {
        inValue: 20000,
        inputTxId: txid4,
        sourceIndex: 3,
        scriptSig: "0xaabbccddeeffaabbccddeeff001122334403",
        sequence: 0,
        fullScriptSigLength: 25,
        containsFullScriptSig: true
    }

    const sweepInput4 = {
        inValue: 30000,
        inputTxId: txid5,
        sourceIndex: 4,
        scriptSig: "0xaabbccddeeffaabbccddeeff001122334404",
        sequence: 0,
        fullScriptSigLength: 25,
        containsFullScriptSig: true
    }

    const sweepInput5 = {
        inValue: 70000,
        inputTxId: txid6,
        sourceIndex: 1,
        scriptSig: "0xaabbccddeeffaabbccddeeff001122334405",
        sequence: 0,
        fullScriptSigLength: 25,
        containsFullScriptSig: true
    }

    const sweepInput6 = {
        inValue: 20000,
        inputTxId: txid7,
        sourceIndex: 3,
        scriptSig: "0xaabbccddeeffaabbccddeeff001122334406",
        sequence: 0,
        fullScriptSigLength: 25,
        containsFullScriptSig: true
    }

    const sweepInput7 = {
        inValue: 90000,
        inputTxId: txid8,
        sourceIndex: 3,
        scriptSig: "0xaabbccddeeffaabbccddeeff001122334407",
        sequence: 0,
        fullScriptSigLength: 25,
        containsFullScriptSig: true
    }

    const sweepInput8 = {
        inValue: 80000,
        inputTxId: txid8,
        sourceIndex: 2,
        scriptSig: "0xaabbccddeeffaabbccddeeff001122334408",
        sequence: 0,
        fullScriptSigLength: 25,
        containsFullScriptSig: true
    }

    const confirmedDepositInput1 = {
        inValue: 90000,
        inputTxId: txid2,
        sourceIndex: 0,
        scriptSig: "0xaabbccddeeffaabbccddeeff001122335500",
        sequence: 0,
        fullScriptSigLength: 25,
        containsFullScriptSig: true
    }

    const confirmedDepositInput2 = {
        inValue: 70000,
        inputTxId: txid3,
        sourceIndex: 5,
        scriptSig: "0xaabbccddeeffaabbccddeeff001122335501",
        sequence: 0,
        fullScriptSigLength: 25,
        containsFullScriptSig: true
    }


    const confirmedDepositInput3 = {
        inValue: 40000,
        inputTxId: txid4,
        sourceIndex: 0,
        scriptSig: "0xaabbccddeeffaabbccddeeff001122335502",
        sequence: 0,
        fullScriptSigLength: 25,
        containsFullScriptSig: true
    }


    const confirmedDepositInput4 = {
        inValue: 20000,
        inputTxId: txid5,
        sourceIndex: 2,
        scriptSig: "0xaabbccddeeffaabbccddeeff001122335503",
        sequence: 0,
        fullScriptSigLength: 25,
        containsFullScriptSig: true
    }


    const confirmedDepositInput5 = {
        inValue: 190000,
        inputTxId: txid6,
        sourceIndex: 5,
        scriptSig: "0xaabbccddeeffaabbccddeeff001122335504",
        sequence: 0,
        fullScriptSigLength: 25,
        containsFullScriptSig: true
    }


    const confirmedDepositInput6 = {
        inValue: 500000,
        inputTxId: txid7,
        sourceIndex: 7,
        scriptSig: "0xaabbccddeeffaabbccddeeff001122335505",
        sequence: 0,
        fullScriptSigLength: 25,
        containsFullScriptSig: true
    }


    const confirmedDepositInput7 = {
        inValue: 70000,
        inputTxId: txid8,
        sourceIndex: 11,
        scriptSig: "0xaabbccddeeffaabbccddeeff001122335506",
        sequence: 0,
        fullScriptSigLength: 25,
        containsFullScriptSig: true
    }


    const confirmedDepositInput8 = {
        inValue: 320000,
        inputTxId: txid9,
        sourceIndex: 2,
        scriptSig: "0xaabbccddeeffaabbccddeeff001122335507",
        sequence: 0,
        fullScriptSigLength: 25,
        containsFullScriptSig: true
    }

    const inputSpendingSweep1 = {
        inValue: 200000,
        inputTxId: sweepUTXO1,
        sourceIndex: sweepUTXO1Output,
        scriptSig: "0xaabbccddeeffaabbccddeeff001122334400",
        sequence: 0,
        fullScriptSigLength: 18,
        containsFullScriptSig: true
    }

    const spentDetail1 = {
        spendingTxId: emptyHash,
        inputIndex: 0
    }

    const spentDetail2 = {
        spendingTxId: emptyHash,
        inputIndex: 0
    }

    const spentDetail3 = {
        spendingTxId: emptyHash,
        inputIndex: 0
    }

    const spentDetail4 = {
        spendingTxId: emptyHash,
        inputIndex: 0
    }

    const spentDetail5 = {
        spendingTxId: "0xaabbccddaabbccddaabbccddaabbccddaabbccddaabbccddaabbccddaabbccdd",
        inputIndex: 4
    }

    const spentDetail6 = {
        spendingTxId: "0xaabbccddaabbccddaabbccddaabbccddaabbccddaabbccddaabbccddaabbccdd",
        inputIndex: 3
    }

    const custodianScript1 = "0xaabbaabbccddeeff0066004400330011aabbffee"
    const nonCustodianScript1 = "0xffaabb77eedd99ccaabbcc0033991133ccddeeff"

    const evmDepositorAddress1 = /* 0x */ "aaffaaff00110011bbddaabbccddeeff00000000";
    const evmDepositorAddress1HexToAsciiLC = "61616666616166663030313130303131626264646161626263636464656566663030303030303030" // this is hex for aaffaaff00110011bbddaabbccddeeff00000000
    const evmDepositorAddress1HexToAsciiMC = "61616646616146463030313130303131626244446161426243634444456566463030303030303030"; // this is hex for aafFaaFF00110011bbDDaaBbCcDDEefF00000000
    const output1 = {
        outValue: 90000,
        script: "0xffeeddccbbaaffeeddccbbaa99887766554433221100aa",
        outputAddress: "bc1addraddraddraddraddraddr1",
        isOpReturn: false,
        opReturnData: "0x",
        isSpent: false,
        fullScriptLength: 23,
        containsFullScript: true,
        spentDetail: spentDetail1
    }

    const output2 = {
        outValue: 50000,
        script: "0xffeeddccbbaaffeeddccbbaa99887766554433221100bbccdd",
        outputAddress: "bc1addraddraddraddraddraddr2",
        isOpReturn: false,
        opReturnData: "0x",
        isSpent: false,
        fullScriptLength: 25,
        containsFullScript: true,
        spentDetail: spentDetail2
    }

    const output3 = {
        outValue: 30000,
        script: "0xffeeddccbbaaffeeddccbbaa99887766554433221100aaaaaacccccc",
        outputAddress: "bc1addraddraddraddraddraddr3",
        isOpReturn: false,
        opReturnData: "0x",
        isSpent: false,
        fullScriptLength: 28,
        containsFullScript: true,
        spentDetail: spentDetail3
    }

    const output4 = {
        outValue: 2000,
        script: "0xffeeddccbbaaffeeddccbbaa99887766554433221100aaaaaaccccddee",
        outputAddress: "bc1addraddraddraddraddraddr4",
        isOpReturn: false,
        opReturnData: "0x",
        isSpent: false,
        fullScriptLength: 29,
        containsFullScript: true,
        spentDetail: spentDetail4
    }

    const output5 = {
        outValue: 5000,
        script: "0xffeeddccbbaaffeeddccbbaa99887766554433221100aaaaaacccc00",
        outputAddress: "bc1addraddraddraddraddraddr5",
        isOpReturn: false,
        opReturnData: "0x",
        isSpent: true,
        fullScriptLength: 28,
        containsFullScript: true,
        spentDetail: spentDetail5
    }

    const output6 = {
        outValue: 51000,
        script: "0xffeeddccbbaaffeeddccbbaa99887766554433221100aaaaaacccc1122",
        outputAddress: "bc1addraddraddraddraddraddr5",
        isOpReturn: false,
        opReturnData: "0x",
        isSpent: true,
        fullScriptLength: 29,
        containsFullScript: true,
        spentDetail: spentDetail6
    }


    const withdrawalCustodian1Script = "0xaacc005588eeff99aaccee33dd8866ccaa4422";
    const withdrawalCustodian2Script = "0xff00aa55cc443377ccaabb4499aa220011";

    const withdrawalUser1Script = "0x8888888855449911aabb77cc33ddee00cc88aa1100cc55dd";
    const withdrawalUser1EVMAddress = "0xff00aaaaff00aaaaff00aaaaff00aaaaff00aaaa"

    const withdrawalUser2Script = "0x7777777755449911aabb77cc33ddee00cc88aa1100cc55dd";
    const withdrawalUser2EVMAddress = "0xdd00aaaadd00aaaadd00aaaadd00aaaadd00aaaa"

    const outputWithOpReturnWithdrawalIndex0 = {
        outValue: 0,
        script: "0x6a0400000000",
        outputAddress: "",
        isOpReturn: true,
        opReturnData: "0x00000000",
        isSpent: false,
        fullScriptLength: 6,
        containsFullScript: true,
        spentDetail: spentDetail1
    }

    const outputWithOpReturnWithdrawalIndex1 = {
        outValue: 0,
        script: "0x6a0400000001",
        outputAddress: "",
        isOpReturn: true,
        opReturnData: "0x00000001",
        isSpent: false,
        fullScriptLength: 6,
        containsFullScript: true,
        spentDetail: spentDetail1
    }


    const outputWithOpReturnWithdrawalIndex4041265344 = {
        outValue: 0,
        script: "0x6a04f0e0d0c0",
        outputAddress: "",
        isOpReturn: true,
        opReturnData: "0xf0e0d0c0",
        isSpent: false,
        fullScriptLength: 6,
        containsFullScript: true,
        spentDetail: spentDetail1
    }

    const outputToWithdrawalUser1_1 = {
        outValue: 50000,
        script: withdrawalUser1Script,
        outputAddress: "bc1user1addraddraddraddraddraddr",
        isOpReturn: false,
        opReturnData: "0x",
        isSpent: false,
        fullScriptLength: 24,
        containsFullScript: true,
        spentDetail: spentDetail1
    }

    const outputToWithdrawalUser1_2 = {
        outValue: 180000,
        script: withdrawalUser1Script,
        outputAddress: "bc1user1addraddraddraddraddraddr",
        isOpReturn: false,
        opReturnData: "0x",
        isSpent: false,
        fullScriptLength: 24,
        containsFullScript: true,
        spentDetail: spentDetail1
    }

    const outputToWithdrawalUser2_1 = {
        outValue: 50000,
        script: withdrawalUser2Script,
        outputAddress: "bc1user1addraddraddraddraddraddr",
        isOpReturn: false,
        opReturnData: "0x",
        isSpent: false,
        fullScriptLength: 24,
        containsFullScript: true,
        spentDetail: spentDetail1
    }

    const withdrawalOutputToCustodian1_1 = {
        outValue: 120000,
        script: withdrawalCustodian1Script,
        outputAddress: "bc1user1addraddraddraddraddraddr",
        isOpReturn: false,
        opReturnData: "0x",
        isSpent: false,
        fullScriptLength: 24,
        containsFullScript: true,
        spentDetail: spentDetail1
    }

    const withdrawalOutputToCustodian2_1 = {
        outValue: 120000,
        script: withdrawalCustodian2Script,
        outputAddress: "bc1user1addraddraddraddraddraddr",
        isOpReturn: false,
        opReturnData: "0x",
        isSpent: false,
        fullScriptLength: 24,
        containsFullScript: true,
        spentDetail: spentDetail1
    }

    const opReturnOutputWithEVMAddress1_1 = {
        outValue: 0,
        script: "0x6a00" + evmDepositorAddress1, // byte after 6a (OP_RETURN) doesn't matter for our contracts,
        outputAddress: "",
        isOpReturn: true,
        opReturnData: "0x" + evmDepositorAddress1,
        isSpent: false,
        fullScriptLength: 28,
        containsFullScript: true,
        spentDetail: spentDetail3
    }

    const opReturnOutputWithEVMAddress1AsciiLC_1 = {
        outValue: 0,
        script: "0x6a00" + evmDepositorAddress1HexToAsciiLC, // byte after 6a (OP_RETURN) doesn't matter for our contracts,
        outputAddress: "",
        isOpReturn: true,
        opReturnData: "0x" + evmDepositorAddress1HexToAsciiLC,
        isSpent: false,
        fullScriptLength: 28,
        containsFullScript: true,
        spentDetail: spentDetail3
    }

    const opReturnOutputWithEVMAddress1AsciiMC_1 = {
        outValue: 0,
        script: "0x6a00" + evmDepositorAddress1HexToAsciiMC, // byte after 6a (OP_RETURN) doesn't matter for our contracts,
        outputAddress: "",
        isOpReturn: true,
        opReturnData: "0x" + evmDepositorAddress1HexToAsciiMC,
        isSpent: false,
        fullScriptLength: 28,
        containsFullScript: true,
        spentDetail: spentDetail3
    }

    const outputToCustodian1_1 = {
        outValue: 30000,
        script: custodianScript1,
        outputAddress: "bc1addraddraddraddraddraddr",
        isOpReturn: false,
        opReturnData: "0x",
        isSpent: false,
        fullScriptLength: 28,
        containsFullScript: true,
        spentDetail: spentDetail3
    }

    const outputToCustodian1_2 = {
        outValue: 28000,
        script: custodianScript1,
        outputAddress: "bc1addraddraddraddraddraddr",
        isOpReturn: false,
        opReturnData: "0x",
        isSpent: false,
        fullScriptLength: 28,
        containsFullScript: true,
        spentDetail: spentDetail3
    }

    const outputToCustodian1_3 = {
        outValue: 26000,
        script: custodianScript1,
        outputAddress: "bc1addraddraddraddraddraddr",
        isOpReturn: false,
        opReturnData: "0x",
        isSpent: false,
        fullScriptLength: 28,
        containsFullScript: true,
        spentDetail: spentDetail3
    }

    const outputToCustodian1_21 = {
        outValue: 25000,
        script: custodianScript1,
        outputAddress: "bc1addraddraddraddraddraddr",
        isOpReturn: false,
        opReturnData: "0x",
        isSpent: false,
        fullScriptLength: 28,
        containsFullScript: true,
        spentDetail: spentDetail3
    }

    const outputToCustodianForSweep1 = {
        outValue: 85000,
        script: custodianScript1,
        outputAddress: "bc1addraddraddraddraddraddr",
        isOpReturn: false,
        opReturnData: "0x",
        isSpent: false,
        fullScriptLength: 28,
        containsFullScript: true,
        spentDetail: spentDetail3
    }

    const outputToCustodianForSweep2 = {
        outValue: 88000,
        script: custodianScript1,
        outputAddress: "bc1addraddraddraddraddraddr",
        isOpReturn: false,
        opReturnData: "0x",
        isSpent: false,
        fullScriptLength: 28,
        containsFullScript: true,
        spentDetail: spentDetail3
    }

    const outputToCustodianForSweep3 = {
        outValue: 82000,
        script: custodianScript1,
        outputAddress: "bc1addraddraddraddraddraddr",
        isOpReturn: false,
        opReturnData: "0x",
        isSpent: false,
        fullScriptLength: 28,
        containsFullScript: true,
        spentDetail: spentDetail3
    }

    const outputToCustodianForSweep4 = {
        outValue: 50000,
        script: custodianScript1,
        outputAddress: "bc1addraddraddraddraddraddr",
        isOpReturn: false,
        opReturnData: "0x",
        isSpent: false,
        fullScriptLength: 28,
        containsFullScript: true,
        spentDetail: spentDetail3
    }

    const outputToCustodianForSweep5 = {
        outValue: 138000,
        script: custodianScript1,
        outputAddress: "bc1addraddraddraddraddraddr",
        isOpReturn: false,
        opReturnData: "0x",
        isSpent: false,
        fullScriptLength: 28,
        containsFullScript: true,
        spentDetail: spentDetail3
    }


    const outputToCustodianForSweep6 = {
        outValue: 142000,
        script: custodianScript1,
        outputAddress: "bc1addraddraddraddraddraddr",
        isOpReturn: false,
        opReturnData: "0x",
        isSpent: false,
        fullScriptLength: 28,
        containsFullScript: true,
        spentDetail: spentDetail3
    }

    const outputToCustodianForSweep7 = {
        outValue: 350000,
        script: custodianScript1,
        outputAddress: "bc1addraddraddraddraddraddr",
        isOpReturn: false,
        opReturnData: "0x",
        isSpent: false,
        fullScriptLength: 28,
        containsFullScript: true,
        spentDetail: spentDetail3
    }

    const outputToNonCustodian1 = {
        outValue: 350000,
        script: nonCustodianScript1,
        outputAddress: "bc1adadadadddrrddrrddrrddrr",
        isOpReturn: false,
        opReturnData: "0x",
        isSpent: false,
        fullScriptLength: 28,
        containsFullScript: true,
        spentDetail: spentDetail3
    }

    const withdrawalToUser1_1 = {
        withdrawalCounter: 4041265344,
        amount: 220000,
        fee: 40000,
        timestampRequested: 600,
        destinationScript: withdrawalUser1Script,
        evmOriginator: withdrawalUser1EVMAddress
    }

    const withdrawalToUser1_2 = {
        withdrawalCounter: 4041265344,
        amount: 200000,
        fee: 20000,
        timestampRequested: 625,
        destinationScript: withdrawalUser1Script,
        evmOriginator: withdrawalUser1EVMAddress
    }

    const withdrawalToUser1_3 = {
        withdrawalCounter: 4041265344,
        amount: 195000,
        fee: 15000,
        timestampRequested: 630,
        destinationScript: withdrawalUser1Script,
        evmOriginator: withdrawalUser1EVMAddress
    }

    const withdrawalToUser2_1 = {
        withdrawalCounter: 0,
        amount: 60000,
        fee: 10000,
        timestampRequested: 500,
        destinationScript: withdrawalUser2Script,
        evmOriginator: withdrawalUser2EVMAddress
    }

    const withdrawalToUser2_2 = {
        withdrawalCounter: 0,
        amount: 150000,
        fee: 10000,
        timestampRequested: 750,
        destinationScript: withdrawalUser2Script,
        evmOriginator: withdrawalUser2EVMAddress
    }

    const withdrawalToUser2_3 = {
        withdrawalCounter: 0,
        amount: 80001,
        fee: 30001,
        timestampRequested: 750,
        destinationScript: withdrawalUser2Script,
        evmOriginator: withdrawalUser2EVMAddress
    }

    const withdrawalToUser2_4 = {
        withdrawalCounter: 0,
        amount: 80000,
        fee: 30000,
        timestampRequested: 800,
        destinationScript: withdrawalUser2Script,
        evmOriginator: withdrawalUser2EVMAddress
    }

    const btcTx1 = {
        containingBlockHash: emptyHash,
        transactionVersion: 0,
        size: 150,
        vSize: 150,
        lockTime: 0,
        inputs: [input1],
        outputs: [output1],
        totalInputs: 1,
        totalOutputs: 1,
        containsAllInputs: true,
        containsAllOutputs: true
    }

    const btcTx2 = {
        containingBlockHash: emptyHash,
        transactionVersion: 0,
        size: 250,
        vSize: 250,
        lockTime: 0,
        inputs: [input1, input2, input3],
        outputs: [output1],
        totalInputs: 3,
        totalOutputs: 1,
        containsAllInputs: true,
        containsAllOutputs: true
    }

    const btcTx3 = {
        containingBlockHash: emptyHash,
        transactionVersion: 0,
        size: 250,
        vSize: 250,
        lockTime: 0,
        inputs: [input1, input2, input3],
        outputs: [output1, output2, output3],
        totalInputs: 3,
        totalOutputs: 3,
        containsAllInputs: true,
        containsAllOutputs: true
    }

    const depositBtcTxToBadCustodianForEVMAddress1_1 = {
        containingBlockHash: emptyHash,
        transactionVersion: 0,
        size: 250,
        vSize: 250,
        lockTime: 0,
        inputs: [input1, input2],
        outputs: [opReturnOutputWithEVMAddress1_1, output3], // output3 doesn't output to a script we use for any custodian
        totalInputs: 2,
        totalOutputs: 2,
        containsAllInputs: true,
        containsAllOutputs: true
    }

    const depositBtcTxToBadCustodianForEVMAddress1_2 = {
        containingBlockHash: emptyHash,
        transactionVersion: 0,
        size: 250,
        vSize: 250,
        lockTime: 0,
        inputs: [input1, input2],
        outputs: [output2, opReturnOutputWithEVMAddress1_1], // output3 doesn't output to a script we use for any custodian
        totalInputs: 2,
        totalOutputs: 2,
        containsAllInputs: true,
        containsAllOutputs: true
    }

    const depositBtcTxToBadCustodianForEVMAddressAsciiLC1_1 = {
        containingBlockHash: emptyHash,
        transactionVersion: 0,
        size: 250,
        vSize: 250,
        lockTime: 0,
        inputs: [input1, input2, input3],
        outputs: [output1, opReturnOutputWithEVMAddress1AsciiLC_1], // output3 doesn't output to a script we use for any custodian
        totalInputs: 2,
        totalOutputs: 2,
        containsAllInputs: true,
        containsAllOutputs: true
    }

    const depositBtcTxToBadCustodianForEVMAddressAsciiMC1_1 = {
        containingBlockHash: emptyHash,
        transactionVersion: 0,
        size: 250,
        vSize: 250,
        lockTime: 0,
        inputs: [input1, input2, input3],
        outputs: [output1, opReturnOutputWithEVMAddress1AsciiMC_1], // output3 doesn't output to a script we use for any custodian
        totalInputs: 2,
        totalOutputs: 2,
        containsAllInputs: true,
        containsAllOutputs: true
    }

    const depositBtcTxToCustodian1ForEVMAddress1_1 = {
        containingBlockHash: emptyHash,
        transactionVersion: 0,
        size: 250,
        vSize: 250,
        lockTime: 0,
        inputs: [input1, input2],
        outputs: [opReturnOutputWithEVMAddress1_1, outputToCustodian1_1], // EVM address first, then output to custodian
        totalInputs: 2,
        totalOutputs: 2,
        containsAllInputs: true,
        containsAllOutputs: true
    }

    const depositBtcTxToCustodian1ForEVMAddress1_2 = {
        containingBlockHash: emptyHash,
        transactionVersion: 0,
        size: 250,
        vSize: 250,
        lockTime: 0,
        inputs: [input1, input2],
        outputs: [outputToCustodian1_1, opReturnOutputWithEVMAddress1_1], // Output to custodian first, then EVM address
        totalInputs: 2,
        totalOutputs: 2,
        containsAllInputs: true,
        containsAllOutputs: true
    }

    const depositBtcTxToCustodian1ForEVMAddress1_3 = {
        containingBlockHash: emptyHash,
        transactionVersion: 0,
        size: 200,
        vSize: 200,
        lockTime: 0,
        inputs: [input3],
        outputs: [opReturnOutputWithEVMAddress1_1, outputToCustodian1_1], // EVM address first, then output to custodian
        totalInputs: 2,
        totalOutputs: 2,
        containsAllInputs: true,
        containsAllOutputs: true
    }

    const depositBtcTxToCustodian1ForEVMAddress1_4 = {
        containingBlockHash: emptyHash,
        transactionVersion: 0,
        size: 200,
        vSize: 200,
        lockTime: 0,
        inputs: [input3],
        outputs: [outputToCustodian1_1, opReturnOutputWithEVMAddress1_1], // output first, then EVM address
        totalInputs: 2,
        totalOutputs: 2,
        containsAllInputs: true,
        containsAllOutputs: true
    }

    const depositBtcTxToCustodian1ForEVMAddress1_5 = {
        containingBlockHash: emptyHash,
        transactionVersion: 0,
        size: 240,
        vSize: 240,
        lockTime: 0,
        inputs: [input2, input3],
        outputs: [outputToCustodian1_1, opReturnOutputWithEVMAddress1_1], // output first, then EVM address
        totalInputs: 2,
        totalOutputs: 2,
        containsAllInputs: true,
        containsAllOutputs: true
    }

    const depositBtcTxToCustodian1ForEVMAddress1_6 = {
        containingBlockHash: emptyHash,
        transactionVersion: 0,
        size: 240,
        vSize: 240,
        lockTime: 0,
        inputs: [input2, input3, input6, input4],
        outputs: [output1, output2, output5, outputToCustodian1_1, output6, opReturnOutputWithEVMAddress1_1, output6],
        totalInputs: 4,
        totalOutputs: 7,
        containsAllInputs: true,
        containsAllOutputs: true
    }

    const depositBtcTxToCustodian1ForEVMAddress1_7 = {
        containingBlockHash: emptyHash,
        transactionVersion: 0,
        size: 350,
        vSize: 350,
        lockTime: 0,
        inputs: [input2, input3, input6, input4],
        outputs: [output5, output1, output6, opReturnOutputWithEVMAddress1_1, output4, outputToCustodian1_1, output3],
        totalInputs: 4,
        totalOutputs: 7,
        containsAllInputs: true,
        containsAllOutputs: true
    }

    const depositBtcTxToCustodian1ForEVMAddress1_8 = {
        containingBlockHash: emptyHash,
        transactionVersion: 0,
        size: 500,
        vSize: 500,
        lockTime: 0,
        inputs: [input2, input3, input6, input4, input9, input5, input1, input8, input7],
        outputs: [output5, output1, output6, output2, output5, output4, opReturnOutputWithEVMAddress1_1, outputToCustodian1_1],
        totalInputs: 9,
        totalOutputs: 8,
        containsAllInputs: true,
        containsAllOutputs: true
    }

    const depositBtcTxToCustodian1ForEVMAddress1_9 = {
        containingBlockHash: emptyHash,
        transactionVersion: 0,
        size: 500,
        vSize: 500,
        lockTime: 0,
        inputs: [input2, input3, input6, input4, input9, input5, input1, input8, input7],
        outputs: [output5, output1, output6, output2, output5, output4, outputToCustodian1_1, opReturnOutputWithEVMAddress1_1],
        totalInputs: 9,
        totalOutputs: 8,
        containsAllInputs: true,
        containsAllOutputs: true
    }

    const depositBtcTxToCustodian1ForEVMAddress1_10 = {
        containingBlockHash: emptyHash,
        transactionVersion: 0,
        size: 672,
        vSize: 672,
        lockTime: 0,
        inputs: [input2, input3, input6, input4, input9, input5, input1, input8, input7],
        outputs: [output5, output1, output6, output2, output5, output4, outputToCustodian1_1, opReturnOutputWithEVMAddress1_1],
        totalInputs: 9,
        totalOutputs: 10, // Only 8 are provided by the transaction we mock BitcoinKit to return, but indicate 10 exist
        containsAllInputs: true,
        containsAllOutputs: false // only contains 8 out of the supposed 10 existing outputs
    }


    const depositBtcTxToCustodian1ForEVMAddressAsciiLC1_1 = {
        containingBlockHash: emptyHash,
        transactionVersion: 0,
        size: 250,
        vSize: 250,
        lockTime: 0,
        inputs: [input1, input2, input3],
        outputs: [output1, output2, outputToCustodian1_1, output3, opReturnOutputWithEVMAddress1AsciiLC_1], // Add some other irrelevant outputs as well
        totalInputs: 2,
        totalOutputs: 2,
        containsAllInputs: true,
        containsAllOutputs: true
    }

    const depositBtcTxToCustodian1ForEVMAddressAsciiLC1_3 = {
        containingBlockHash: emptyHash,
        transactionVersion: 0,
        size: 200,
        vSize: 200,
        lockTime: 0,
        inputs: [input3],
        outputs: [opReturnOutputWithEVMAddress1AsciiLC_1, outputToCustodian1_1], // EVM address first, then output to custodian
        totalInputs: 2,
        totalOutputs: 2,
        containsAllInputs: true,
        containsAllOutputs: true
    }

    const depositBtcTxToCustodian1ForEVMAddressAsciiLC1_4 = {
        containingBlockHash: emptyHash,
        transactionVersion: 0,
        size: 200,
        vSize: 200,
        lockTime: 0,
        inputs: [input3],
        outputs: [outputToCustodian1_1, opReturnOutputWithEVMAddress1AsciiLC_1], // output first, then EVM address
        totalInputs: 2,
        totalOutputs: 2,
        containsAllInputs: true,
        containsAllOutputs: true
    }

    const depositBtcTxToCustodian1ForEVMAddressAsciiLC1_5 = {
        containingBlockHash: emptyHash,
        transactionVersion: 0,
        size: 250,
        vSize: 250,
        lockTime: 0,
        inputs: [input1, input3],
        outputs: [opReturnOutputWithEVMAddress1AsciiLC_1, outputToCustodian1_1], // output first, then EVM address
        totalInputs: 2,
        totalOutputs: 2,
        containsAllInputs: true,
        containsAllOutputs: true
    }


    const depositBtcTxToCustodian1ForEVMAddressAsciiMC1_3 = {
        containingBlockHash: emptyHash,
        transactionVersion: 0,
        size: 200,
        vSize: 200,
        lockTime: 0,
        inputs: [input3],
        outputs: [opReturnOutputWithEVMAddress1AsciiMC_1, outputToCustodian1_1], // EVM address first, then output to custodian
        totalInputs: 2,
        totalOutputs: 2,
        containsAllInputs: true,
        containsAllOutputs: true
    }

    const depositBtcTxToCustodian1ForEVMAddressAsciiMC1_4 = {
        containingBlockHash: emptyHash,
        transactionVersion: 0,
        size: 200,
        vSize: 200,
        lockTime: 0,
        inputs: [input3],
        outputs: [outputToCustodian1_1, opReturnOutputWithEVMAddress1AsciiMC_1], // output first, then EVM address
        totalInputs: 2,
        totalOutputs: 2,
        containsAllInputs: true,
        containsAllOutputs: true
    }

    const depositBtcTxToCustodian1ForEVMAddressAsciiMC1_5 = {
        containingBlockHash: emptyHash,
        transactionVersion: 0,
        size: 250,
        vSize: 250,
        lockTime: 0,
        inputs: [input3, input2],
        outputs: [outputToCustodian1_1, opReturnOutputWithEVMAddress1AsciiMC_1], // output first, then EVM address
        totalInputs: 2,
        totalOutputs: 2,
        containsAllInputs: true,
        containsAllOutputs: true
    }

    const withdrawTransactionSpendingInvalidSweep_1 = {
        containingBlockHash: emptyHash,
        transactionVersion: 0,
        size: 200,
        vSize: 200,
        lockTime: 0,
        inputs: [input3], // This is just a random input that doesn't spend the sweep UTXOs we identify for tests
        outputs: [output1, opReturnOutputWithEVMAddress1AsciiMC_1, output4], // too many outputs as well
        totalInputs: 1,
        totalOutputs: 2,
        containsAllInputs: true,
        containsAllOutputs: true
    }

    const withdrawTransactionNoOutputs_1 = {
        containingBlockHash: emptyHash,
        transactionVersion: 0,
        size: 150,
        vSize: 150,
        lockTime: 0,
        inputs: [inputSpendingSweep1], // This is just a random input that doesn't spend the sweep UTXOs we identify for tests
        outputs: [], // not allowed by bitcoin protocol but test it anyway
        totalInputs: 1,
        totalOutputs: 0,
        containsAllInputs: true,
        containsAllOutputs: true
    }

    const withdrawTransactionTooManyOutputs_1 = {
        containingBlockHash: emptyHash,
        transactionVersion: 0,
        size: 150,
        vSize: 150,
        lockTime: 0,
        inputs: [inputSpendingSweep1],
        outputs: [output1, output2, output3, output4],
        totalInputs: 1,
        totalOutputs: 3,
        containsAllInputs: true,
        containsAllOutputs: true
    }

    const withdrawTransactionTooManyOutputs_2 = {
        containingBlockHash: emptyHash,
        transactionVersion: 0,
        size: 400,
        vSize: 400,
        lockTime: 0,
        inputs: [inputSpendingSweep1],
        outputs: [output1, output2, output3, output4, output5],
        totalInputs: 1,
        totalOutputs: 5,
        containsAllInputs: true,
        containsAllOutputs: true
    }

    const withdrawTransactionTooManyOutputs_3 = {
        containingBlockHash: emptyHash,
        transactionVersion: 0,
        size: 900,
        vSize: 900,
        lockTime: 0,
        inputs: [inputSpendingSweep1],
        outputs: [output1, output2, output3, output4, output5, output6, opReturnOutputWithEVMAddress1_1, opReturnOutputWithEVMAddress1AsciiLC_1],
        totalInputs: 1,
        totalOutputs: 10,
        containsAllInputs: true,
        containsAllOutputs: false
    }

    const withdrawTransactionWithOutputToUser1NoChange_1 = {
        containingBlockHash: emptyHash,
        transactionVersion: 0,
        size: 150,
        vSize: 150,
        lockTime: 0,
        inputs: [inputSpendingSweep1], // 200000 in
        outputs: [outputToWithdrawalUser1_1, outputWithOpReturnWithdrawalIndex0], // 50000 out
        totalInputs: 1,
        totalOutputs: 1,
        containsAllInputs: true,
        containsAllOutputs: true
    }

    const withdrawTransactionWithOutputToUser1NoChange_2 = {
        containingBlockHash: emptyHash,
        transactionVersion: 0,
        size: 150,
        vSize: 150,
        lockTime: 0,
        inputs: [inputSpendingSweep1], // 200000 in
        outputs: [outputToWithdrawalUser1_2, outputWithOpReturnWithdrawalIndex4041265344], // 180000 out
        totalInputs: 1,
        totalOutputs: 1,
        containsAllInputs: true,
        containsAllOutputs: true
    }

    const withdrawTransactionWithOutputToUser1WithSweepChange_1 = {
        containingBlockHash: emptyHash,
        transactionVersion: 0,
        size: 150,
        vSize: 150,
        lockTime: 0,
        inputs: [inputSpendingSweep1], // 200000 in
        outputs: [outputToWithdrawalUser1_1, withdrawalOutputToCustodian1_1, outputWithOpReturnWithdrawalIndex0], // 50000 to user 1 120000 back to vault as sweep
        totalInputs: 1,
        totalOutputs: 2,
        containsAllInputs: true,
        containsAllOutputs: true
    }

    const withdrawTransactionWithOutputToUser2NoChange_1 = {
        containingBlockHash: emptyHash,
        transactionVersion: 0,
        size: 150,
        vSize: 150,
        lockTime: 0,
        inputs: [inputSpendingSweep1], // 200000 in
        outputs: [outputToWithdrawalUser2_1, outputWithOpReturnWithdrawalIndex0], // 50000 out
        totalInputs: 1,
        totalOutputs: 1,
        containsAllInputs: true,
        containsAllOutputs: true
    }

    const withdrawTransactionWithOutputToUser2WithSweepChange_1 = {
        containingBlockHash: emptyHash,
        transactionVersion: 0,
        size: 150,
        vSize: 150,
        lockTime: 0,
        inputs: [inputSpendingSweep1], // 200000 in
        outputs: [outputToWithdrawalUser2_1, withdrawalOutputToCustodian1_1, outputWithOpReturnWithdrawalIndex0], // 50000 to user 2 120000 back to vault as sweep
        totalInputs: 1,
        totalOutputs: 2,
        containsAllInputs: true,
        containsAllOutputs: true
    }

    const withdrawTransactionWithOutputToUser2WithChangeToCustodian1_1 = {
        containingBlockHash: emptyHash,
        transactionVersion: 0,
        size: 150,
        vSize: 150,
        lockTime: 0,
        inputs: [inputSpendingSweep1], // 200000 in
        outputs: [outputToWithdrawalUser2_1, withdrawalOutputToCustodian1_1, outputWithOpReturnWithdrawalIndex0], // 50000 to user 2 120000 back to vault as sweep
        totalInputs: 1,
        totalOutputs: 2,
        containsAllInputs: true,
        containsAllOutputs: true
    }

    const withdrawTransactionWithOutputToUser2WithSweepChangeWrongOrder_1 = {
        containingBlockHash: emptyHash,
        transactionVersion: 0,
        size: 150,
        vSize: 150,
        lockTime: 0,
        inputs: [inputSpendingSweep1], // 200000 in
        outputs: [withdrawalOutputToCustodian1_1, outputToWithdrawalUser2_1], // 50000 to user 2 120000 back to vault as sweep, but in wrong order
        totalInputs: 1,
        totalOutputs: 2,
        containsAllInputs: true,
        containsAllOutputs: true
    }

    const invalidSweepTransactionWith1Input = {
        containingBlockHash: emptyHash,
        transactionVersion: 0,
        size: 150,
        vSize: 150,
        lockTime: 0,
        inputs: [sweepInput1], // 50000 in
        outputs: [outputToCustodian1_21], // 25000 out (fee: 25000)
        totalInputs: 1,
        totalOutputs: 1,
        containsAllInputs: true,
        containsAllOutputs: true
    }

    const invalidSweepTransactionWith9Inputs = {
        containingBlockHash: emptyHash,
        transactionVersion: 0,
        size: 150,
        vSize: 150,
        lockTime: 0,
        inputs: [sweepInput1, input1, input2, input3, input4, input5, input6, input7, input8],
        outputs: [outputToCustodian1_21],
        totalInputs: 9,
        totalOutputs: 1,
        containsAllInputs: true,
        containsAllOutputs: true
    }

    const invalidSweepTransactionWith1Output = {
        containingBlockHash: emptyHash,
        transactionVersion: 0,
        size: 150,
        vSize: 150,
        lockTime: 0,
        inputs: [sweepInput1, input1, input2, input3, input4, input5, input6, input7],
        outputs: [outputToCustodian1_21, withdrawalOutputToCustodian2_1],
        totalInputs: 8,
        totalOutputs: 2,
        containsAllInputs: true,
        containsAllOutputs: true
    }

    const validSweep1 = {
        containingBlockHash: emptyHash,
        transactionVersion: 0,
        size: 220,
        vSize: 220,
        lockTime: 0,
        inputs: [sweepUTXOInput1, sweepInput1],
        outputs: [outputToCustodianForSweep1],
        totalInputs: 2,
        totalOutputs: 1,
        containsAllInputs: true,
        containsAllOutputs: true
    }

    const validSweep2 = {
        containingBlockHash: emptyHash,
        transactionVersion: 0,
        size: 220,
        vSize: 220,
        lockTime: 0,
        inputs: [sweepUTXOInput1, sweepInput1],
        outputs: [outputToCustodianForSweep2],
        totalInputs: 2,
        totalOutputs: 1,
        containsAllInputs: true,
        containsAllOutputs: true
    }

    const validSweep3 = {
        containingBlockHash: emptyHash,
        transactionVersion: 0,
        size: 220,
        vSize: 220,
        lockTime: 0,
        inputs: [sweepUTXOInput1, sweepInput1],
        outputs: [outputToCustodianForSweep3],
        totalInputs: 2,
        totalOutputs: 1,
        containsAllInputs: true,
        containsAllOutputs: true
    }

    const validSweep4 = {
        containingBlockHash: emptyHash,
        transactionVersion: 0,
        size: 220,
        vSize: 220,
        lockTime: 0,
        inputs: [sweepUTXOInput1, sweepInput1],
        outputs: [outputToCustodianForSweep4],
        totalInputs: 2,
        totalOutputs: 1,
        containsAllInputs: true,
        containsAllOutputs: true
    }

    const validSweep5 = {
        containingBlockHash: emptyHash,
        transactionVersion: 2,
        size: 275,
        vSize: 275,
        lockTime: 50,
        inputs: [sweepUTXOInput1, sweepInput1, sweepInput2],
        outputs: [outputToCustodianForSweep5],
        totalInputs: 3,
        totalOutputs: 1,
        containsAllInputs: true,
        containsAllOutputs: true
    }

    const validSweep6 = {
        containingBlockHash: emptyHash,
        transactionVersion: 2,
        size: 275,
        vSize: 275,
        lockTime: 50,
        inputs: [sweepUTXOInput1, sweepInput1, sweepInput2],
        outputs: [outputToCustodianForSweep6],
        totalInputs: 3,
        totalOutputs: 1,
        containsAllInputs: true,
        containsAllOutputs: true
    }

    const validSweep7 = {
        containingBlockHash: emptyHash,
        transactionVersion: 2,
        size: 275,
        vSize: 275,
        lockTime: 50,
        inputs: [sweepUTXOInput1, sweepInput1, sweepInput2],
        outputs: [outputToCustodianForSweep6],
        totalInputs: 3,
        totalOutputs: 1,
        containsAllInputs: true,
        containsAllOutputs: true
    }

    const validSweep8 = {
        containingBlockHash: emptyHash,
        transactionVersion: 2,
        size: 800,
        vSize: 800,
        lockTime: 75,
        inputs: [sweepUTXOInput1, sweepInput1, sweepInput2, sweepInput3, sweepInput4, sweepInput5, sweepInput6, sweepInput7],
        outputs: [outputToCustodianForSweep7],
        totalInputs: 8,
        totalOutputs: 1,
        containsAllInputs: true,
        containsAllOutputs: true
    }

    // "Valid" as it's an invalid deposit spend, making it valid for checking for an invalid spend
    const validConfirmedDepositInvalidSpend1 = {
        containingBlockHash: emptyHash,
        transactionVersion: 2,
        size: 220,
        vSize: 220,
        lockTime: 50,
        inputs: [confirmedDepositInput1],
        outputs: [outputToNonCustodian1],
        totalInputs: 1,
        totalOutputs: 1,
        containsAllInputs: true,
        containsAllOutputs: true
    }

    const validConfirmedDepositInvalidSpend2 = {
        containingBlockHash: emptyHash,
        transactionVersion: 2,
        size: 220,
        vSize: 220,
        lockTime: 50,
        inputs: [sweepUTXOInput1, confirmedDepositInput1],
        outputs: [outputToNonCustodian1],
        totalInputs: 2,
        totalOutputs: 1,
        containsAllInputs: true,
        containsAllOutputs: true
    }

    const validConfirmedDepositInvalidSpend3 = {
        containingBlockHash: emptyHash,
        transactionVersion: 2,
        size: 560,
        vSize: 560,
        lockTime: 50,
        inputs: [sweepUTXOInput1, confirmedDepositInput2, confirmedDepositInput3, confirmedDepositInput4, confirmedDepositInput5, confirmedDepositInput6, confirmedDepositInput7, confirmedDepositInput8],
        outputs: [outputToNonCustodian1],
        totalInputs: 9, // Only gave 8 outputs, but 9th will be set in BitcoinKit to return confirmedDepositInput1
        totalOutputs: 1, 
        containsAllInputs: true,
        containsAllOutputs: false
    }

    const validConfirmedDepositInvalidSpend4 = {
        containingBlockHash: emptyHash,
        transactionVersion: 2,
        size: 490,
        vSize: 490,
        lockTime: 30,
        inputs: [sweepUTXOInput1, confirmedDepositInput1, confirmedDepositInput2, confirmedDepositInput3, confirmedDepositInput4, confirmedDepositInput5, confirmedDepositInput6, confirmedDepositInput7],
        outputs: [outputToNonCustodian1],
        totalInputs: 8, // Has all 8 inputs
        totalOutputs: 1, 
        containsAllInputs: true,
        containsAllOutputs: true
    }


    const validConfirmedDepositInvalidSpend5 = {
        containingBlockHash: emptyHash,
        transactionVersion: 2,
        size: 292,
        vSize: 292,
        lockTime: 507000,
        inputs: [sweepUTXOInput1, confirmedDepositInput1, input4], // input4 will not be marked as a valid confirmed deposit
        outputs: [outputToNonCustodian1],
        totalInputs: 3,
        totalOutputs: 1,
        containsAllInputs: true,
        containsAllOutputs: true
    }

    const invalidWithdrawalSpendOfSweepUtxo1_1_txid = "0xaabbccddaabbccddaabbccddaabbccddaabbccddaabbccddaabbccddaabbccdd";
    const invalidWithdrawalSpendOfSweepUtxo1_2_txid = "0xaabbccddaabbccddaabbccddaabbccddaabbccddaabbccddaabbccddaabbccee";
    const invalidWithdrawalSpendOfSweepUtxo1_3_txid = "0xaabbccddaabbccddaabbccddaabbccddaabbccddaabbccddaabbccddaabbccff";

    const invalidWithdrawalSpendOfSweepUtxo1_1 = { // Used for invalidating a confirmed deposit spend that walks back to this invalid withdrawal while crawling for current sweep utxo connectivity
        containingBlockHash: emptyHash,
        transactionVersion: 2,
        size: 292,
        vSize: 292,
        lockTime: 507000,
        inputs: [sweepUTXOInput1], // Only one input so can only (possibly) be a withdrawal
        outputs: [outputToCustodian1_1], // But only one output, so not a withdrawal
        totalInputs: 1,
        totalOutputs: 1,
        containsAllInputs: true,
        containsAllOutputs: true
    }

    const inputSpendingInvalidWithdrawalSpendOfSweepUTXO1_1 = { // spend output of above invalid withdrawal spend
        inValue: 30000,
        inputTxId: invalidWithdrawalSpendOfSweepUtxo1_1_txid,
        sourceIndex: 0,
        scriptSig: "0xaabbccddeeffaabbccddeeff001122334400",
        sequence: 0,
        fullScriptSigLength: 24,
        containsFullScriptSig: true
    }

    const invalidWithdrawalSpendOfSweepUtxo1_2 = { // Used for invalidating a confirmed deposit spend that walks back to this invalid withdrawal while crawling for current sweep utxo connectivity
        containingBlockHash: emptyHash,
        transactionVersion: 2,
        size: 292,
        vSize: 292,
        lockTime: 507000,
        inputs: [sweepUTXOInput1], // Only one input so can only (possibly) be a withdrawal
        outputs: [outputToCustodian1_1, outputToCustodian1_21, outputToCustodian1_2], // But has three outputs, so not a withdrawal
        totalInputs: 1,
        totalOutputs: 3,
        containsAllInputs: true,
        containsAllOutputs: true
    }

    const inputSpendingInvalidWithdrawalSpendOfSweepUTXO1_2 = { // spend output of above invalid withdrawal spend
        inValue: 30000,
        inputTxId: invalidWithdrawalSpendOfSweepUtxo1_2_txid,
        sourceIndex: 0,
        scriptSig: "0xaabbccddeeffaabbccddeeff001122334400",
        sequence: 0,
        fullScriptSigLength: 24,
        containsFullScriptSig: true
    }

    const invalidWithdrawalSpendOfSweepUtxo1_3 = { // Used for invalidating a confirmed deposit spend that walks back to this invalid withdrawal while crawling for current sweep utxo connectivity
        containingBlockHash: emptyHash,
        transactionVersion: 2,
        size: 292,
        vSize: 292,
        lockTime: 507000,
        inputs: [sweepUTXOInput1], // Only one input so can only (possibly) be a withdrawal
        outputs: [outputToCustodian1_1, output3], // Has two outputs, but potential sweep is at index 0 which is not allowed
        totalInputs: 1,
        totalOutputs: 2,
        containsAllInputs: true,
        containsAllOutputs: true
    }

    const inputSpendingInvalidWithdrawalSpendOfSweepUTXO1_3 = { // spend output of above invalid withdrawal spend
        inValue: 30000,
        inputTxId: invalidWithdrawalSpendOfSweepUtxo1_3_txid,
        sourceIndex: 0, // Spends a plausible sweep, but sweep for withdrawal cannot output at that index
        scriptSig: "0xaabbccddeeffaabbccddeeff001122334400",
        sequence: 0,
        fullScriptSigLength: 24,
        containsFullScriptSig: true
    }

    const validConfirmedDepositInvalidSpend6 = { // Spends an input which is an invalid withdrawal of sweep UTXO 1
        containingBlockHash: emptyHash,
        transactionVersion: 2,
        size: 292,
        vSize: 292,
        lockTime: 42,
        inputs: [inputSpendingInvalidWithdrawalSpendOfSweepUTXO1_1, confirmedDepositInput1],
        outputs: [outputToCustodian1_2],
        totalInputs: 2,
        totalOutputs: 1,
        containsAllInputs: true,
        containsAllOutputs: true
    }

    const validConfirmedDepositInvalidSpend7 = { // Spends an input which is an invalid withdrawal of sweep UTXO 1
        containingBlockHash: emptyHash,
        transactionVersion: 2,
        size: 292,
        vSize: 292,
        lockTime: 42,
        inputs: [inputSpendingInvalidWithdrawalSpendOfSweepUTXO1_2, confirmedDepositInput1],
        outputs: [outputToCustodian1_2],
        totalInputs: 2,
        totalOutputs: 1,
        containsAllInputs: true,
        containsAllOutputs: true
    }

    const validConfirmedDepositInvalidSpend8 = { // Spends an input which is an invalid withdrawal of sweep UTXO 1
        containingBlockHash: emptyHash,
        transactionVersion: 2,
        size: 292,
        vSize: 292,
        lockTime: 42,
        inputs: [inputSpendingInvalidWithdrawalSpendOfSweepUTXO1_3, confirmedDepositInput1],
        outputs: [outputToCustodian1_2],
        totalInputs: 2,
        totalOutputs: 1,
        containsAllInputs: true,
        containsAllOutputs: true
    }

    const invalidSweepSpendOfSweepUtxo1_1_txid = "0xaabbccddaabbccddaabbccddaabbccddaabbccddaabbccddaabbccddaabbdd00";
    const invalidSweepSpendOfSweepUtxo1_2_txid = "0xaabbccddaabbccddaabbccddaabbccddaabbccddaabbccddaabbccddaabbdd11";

    const invalidSweepSpendOfSweepUtxo1_1 = { // Used for invalidating a confirmed deposit spend that walks back to this invalid sweep while crawling for current sweep utxo connectivity
        containingBlockHash: emptyHash,
        transactionVersion: 2,
        size: 292,
        vSize: 292,
        lockTime: 507000,
        inputs: [sweepUTXOInput1, confirmedDepositInput2, confirmedDepositInput3, confirmedDepositInput4, confirmedDepositInput5, confirmedDepositInput6, confirmedDepositInput7, confirmedDepositInput8], // 8 inputs here but 9 reported below (not all given by BitcoinKit)
        outputs: [outputToCustodian1_1], // Only one output, which would be correct if not for input count
        totalInputs: 9,
        totalOutputs: 1,
        containsAllInputs: false,
        containsAllOutputs: true
    }

    const inputSpendingInvalidSweepSpendOfSweepUTXO1_1 = { // spend output of above invalid sweep spend
        inValue: 30000,
        inputTxId: invalidSweepSpendOfSweepUtxo1_1_txid,
        sourceIndex: 0,
        scriptSig: "0xaabbccddeeffaabbccddeeff001122334400",
        sequence: 0,
        fullScriptSigLength: 24,
        containsFullScriptSig: true
    }

    const invalidSweepSpendOfSweepUtxo1_2 = { // Used for invalidating a confirmed deposit spend that walks back to this invalid sweep while crawling for current sweep utxo connectivity
        containingBlockHash: emptyHash,
        transactionVersion: 2,
        size: 292,
        vSize: 292,
        lockTime: 507000,
        inputs: [sweepUTXOInput1, confirmedDepositInput2, confirmedDepositInput5, confirmedDepositInput7, confirmedDepositInput8], // 5 inputs is fine for sweep
        outputs: [outputToCustodian1_1, outputToCustodian1_2], // Two outputs which is invalid, even if both go to custodian
        totalInputs: 5,
        totalOutputs: 2,
        containsAllInputs: true,
        containsAllOutputs: true
    }

    const inputSpendingInvalidSweepSpendOfSweepUTXO1_2 = { // spend output of above invalid sweep spend
        inValue: 30000,
        inputTxId: invalidSweepSpendOfSweepUtxo1_2_txid,
        sourceIndex: 0,
        scriptSig: "0xaabbccddeeffaabbccddeeff001122334400",
        sequence: 0,
        fullScriptSigLength: 24,
        containsFullScriptSig: true
    }

    const validConfirmedDepositInvalidSpend9 = { // Spends an input which is an invalid sweep of sweep UTXO 1
        containingBlockHash: emptyHash,
        transactionVersion: 2,
        size: 292,
        vSize: 292,
        lockTime: 42,
        inputs: [inputSpendingInvalidSweepSpendOfSweepUTXO1_1, confirmedDepositInput1],
        outputs: [outputToCustodian1_2],
        totalInputs: 2,
        totalOutputs: 1,
        containsAllInputs: true,
        containsAllOutputs: true
    }

    const validConfirmedDepositInvalidSpend10 = { // Spends an input which is an invalid sweep of sweep UTXO 1
        containingBlockHash: emptyHash,
        transactionVersion: 2,
        size: 292,
        vSize: 292,
        lockTime: 42,
        inputs: [inputSpendingInvalidSweepSpendOfSweepUTXO1_2, confirmedDepositInput1],
        outputs: [outputToCustodian1_3],
        totalInputs: 2,
        totalOutputs: 1,
        containsAllInputs: true,
        containsAllOutputs: true
    }

    // These invalid confirmed deposit invalid spends are used in tests in ways that they should not be accepted
    // as invalid, to ensure that false positives can't be used to punish operator. For example blaming a transaction
    // that appears invalid but doesn't actually spend a confirmed deposit.
    const invalidConfirmedDepositInvalidSpend1 = { // Has more than 8 inputs, by definition wrong
        containingBlockHash: emptyHash,
        transactionVersion: 2,
        size: 220,
        vSize: 220,
        lockTime: 50,
        inputs: [sweepUTXOInput1, sweepInput1, sweepInput2, sweepInput3, sweepInput4, sweepInput5, sweepInput6, sweepInput7, sweepInput8],
        outputs: [outputToNonCustodian1],
        totalInputs: 9,
        totalOutputs: 1,
        containsAllInputs: true,
        containsAllOutputs: true
    }

    const invalidConfirmedDepositInvalidSpend2 = { // Has more than 8 inputs, by definition wrong
        containingBlockHash: emptyHash,
        transactionVersion: 2,
        size: 220,
        vSize: 220,
        lockTime: 50,
        inputs: [sweepUTXOInput1, sweepInput1, sweepInput2, sweepInput3, sweepInput4, sweepInput5, sweepInput6, sweepInput7],
        outputs: [outputToNonCustodian1],
        totalInputs: 9,
        totalOutputs: 1,
        containsAllInputs: false,
        containsAllOutputs: true
    }

    const invalidConfirmedDepositInvalidSpend3 = { // Has more than 1 output, by definition wrong
        containingBlockHash: emptyHash,
        transactionVersion: 2,
        size: 220,
        vSize: 220,
        lockTime: 50,
        inputs: [sweepUTXOInput1, sweepInput1],
        outputs: [outputToCustodianForSweep1, outputToNonCustodian1],
        totalInputs: 2,
        totalOutputs: 2,
        containsAllInputs: true,
        containsAllOutputs: true
    }

    const invalidConfirmedDepositInvalidSpend4 = { // Has more than 1 output, by definition wrong even though its not included in default outputs returned
        containingBlockHash: emptyHash,
        transactionVersion: 2,
        size: 220,
        vSize: 220,
        lockTime: 50,
        inputs: [sweepUTXOInput1, sweepInput1],
        outputs: [outputToCustodianForSweep1],
        totalInputs: 2,
        totalOutputs: 2,
        containsAllInputs: true,
        containsAllOutputs: false
    }


    const invalidConfirmedDepositInvalidSpend5 = { // Completely valid sweep, so should not be accepted as invalid if utxo and confirmed deposit are set correctly
        containingBlockHash: emptyHash,
        transactionVersion: 2,
        size: 220,
        vSize: 220,
        lockTime: 50,
        inputs: [sweepUTXOInput1, confirmedDepositInput1],
        outputs: [outputToCustodian1_1],
        totalInputs: 2,
        totalOutputs: 1,
        containsAllInputs: true,
        containsAllOutputs: true
    }

    const validWithdrawalSpendOfSweepUtxo1_1_txid = "0xaabbccddaabbccddaabbccddaabbccddaabbccddaabbccddaabbccddaabbee00";

    const validWithdrawalSpendOfSweepUtxo1_1 = {
        containingBlockHash: emptyHash,
        transactionVersion: 2,
        size: 292,
        vSize: 292,
        lockTime: 507000,
        inputs: [sweepUTXOInput1], // 1 input is correct withdrawal input count
        outputs: [output2, outputToCustodian1_1], // First output is (plausibly) a withdrawal output to withdrawee, second is sweep
        totalInputs: 1,
        totalOutputs: 2,
        containsAllInputs: true,
        containsAllOutputs: true
    }

    const inputSpendingValidWithdrawalSpendOfSweepUTXO1_1 = { // Spends the valid withdrawal spend of current sweep UTXO
        inValue: 30000,
        inputTxId: validWithdrawalSpendOfSweepUtxo1_1_txid,
        sourceIndex: 1,
        scriptSig: "0xaabbccddeeffaabbccddeeff001122334400",
        sequence: 0,
        fullScriptSigLength: 24,
        containsFullScriptSig: true
    }

    const validSweepSpendOfSweepUtxo1_1_txid = "0xaabbccddaabbccddaabbccddaabbccddaabbccddaabbccddaabbccddaabbff00";

    const validSweepSpendOfSweepUtxo1_1 = {
        containingBlockHash: emptyHash,
        transactionVersion: 2,
        size: 292,
        vSize: 292,
        lockTime: 507000,
        inputs: [sweepUTXOInput1, confirmedDepositInput2, confirmedDepositInput4, confirmedDepositInput6], // 4 inputs is valid sweep
        outputs: [outputToCustodian1_1], // One output is valid sweep
        totalInputs: 4,
        totalOutputs: 1,
        containsAllInputs: true,
        containsAllOutputs: true
    }

    const inputSpendingValidSweepSpendOfSweepUTXO1_1 = { // Spends the valid withdrawal spend of current sweep UTXO
        inValue: 30000,
        inputTxId: validSweepSpendOfSweepUtxo1_1_txid,
        sourceIndex: 0,
        scriptSig: "0xaabbccddeeffaabbccddeeff001122334400",
        sequence: 0,
        fullScriptSigLength: 24,
        containsFullScriptSig: true
    }


    const invalidConfirmedDepositInvalidSpend6 = { // Completely valid sweep which spends a plausibly valid withdrawal for crawlback checks
        containingBlockHash: emptyHash,
        transactionVersion: 2,
        size: 220,
        vSize: 220,
        lockTime: 50,
        inputs: [inputSpendingValidWithdrawalSpendOfSweepUTXO1_1, confirmedDepositInput1],
        outputs: [outputToCustodian1_2],
        totalInputs: 2,
        totalOutputs: 1,
        containsAllInputs: true,
        containsAllOutputs: true
    }


    const invalidConfirmedDepositInvalidSpend7 = { // Completely valid sweep which spends a plausibly valid sweep for crawlback checks
        containingBlockHash: emptyHash,
        transactionVersion: 2,
        size: 220,
        vSize: 220,
        lockTime: 50,
        inputs: [inputSpendingValidSweepSpendOfSweepUTXO1_1, confirmedDepositInput1],
        outputs: [outputToCustodian1_2],
        totalInputs: 2,
        totalOutputs: 1,
        containsAllInputs: true,
        containsAllOutputs: true
    }


    const sweepTransactionWith2Inputs = {
        containingBlockHash: emptyHash,
        transactionVersion: 0,
        size: 150,
        vSize: 150,
        lockTime: 0,
        inputs: [inputSpendingSweep1], // 200000 in
        outputs: [withdrawalOutputToCustodian1_1, outputToWithdrawalUser2_1], // 50000 to user 2 120000 back to vault as sweep, but in wrong order
        totalInputs: 1,
        totalOutputs: 2,
        containsAllInputs: true,
        containsAllOutputs: true
    }

  
  describe("SimpleBitcoinVaultUTXOLogicHelper", function () {
    async function deploySimpleBitcoinVaultUTXOLogicHelper() {
      const [owner] = await ethers.getSigners();
  
      const SimpleBitcoinVaultUTXOLogicHelper = await ethers.getContractFactory("SimpleBitcoinVaultUTXOLogicHelper");
      const utxoLogicHelperContract = await SimpleBitcoinVaultUTXOLogicHelper.deploy();
  
      return { utxoLogicHelperContract };
    }

    async function deployTestUtils() {
        const TestUtils = await ethers.getContractFactory("TestUtils");
        const testUtilsContract = await TestUtils.deploy();
    
        return { testUtilsContract };
    }

    async function deployMockSimpleBitcoinVaultState() {
        // const [owner] = await ethers.getSigners();
    
        const MockSimpleBitcoinVaultState = await ethers.getContractFactory("MockSimpleBitcoinVaultState");
        const mockSimpleBitcoinVaultStateContract = await MockSimpleBitcoinVaultState.deploy();
    
        return { mockSimpleBitcoinVaultStateContract };
    }

    async function deployMockBitcoinKit() {
        const MockBitcoinKit = await ethers.getContractFactory("MockBitcoinKit");
        const mockBitcoinKitContract = await MockBitcoinKit.deploy();
    
        return { mockBitcoinKitContract };
    }

    async function deployUTXOHelperWithSupportingContracts() {
        const [deployer, notOwner1, notOwner2] = await ethers.getSigners();

        const { utxoLogicHelperContract } = await deploySimpleBitcoinVaultUTXOLogicHelper(); 

        const { mockSimpleBitcoinVaultStateContract } = await deployMockSimpleBitcoinVaultState();

        const { testUtilsContract } = await deployTestUtils();

        const { mockBitcoinKitContract } = await deployMockBitcoinKit();

        // console.log("Deployer in test: " + deployer.address);
    
        return { utxoLogicHelperContract, mockSimpleBitcoinVaultStateContract, mockBitcoinKitContract, 
            testUtilsContract, deployer, notOwner1, notOwner2 };
    }
  
    describe("Deployment", function () {
      it("Should expose MAX_SWEEP_UTXO_WALKBACK", async function () {
        const { utxoLogicHelperContract } = await loadFixture(deploySimpleBitcoinVaultUTXOLogicHelper);

        expect(await utxoLogicHelperContract.MAX_SWEEP_UTXO_WALKBACK(), 10);
      });
    });


    describe("Extract Withdrawal Index From OP_RETURN", function () {
        it("Should extract indexes correctly from 6-byte OP_RETURN", async function () {
          const { utxoLogicHelperContract } = await loadFixture(deploySimpleBitcoinVaultUTXOLogicHelper);
  
          // 1-byte encoded index
          expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a0400000000"), 0);
          expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a0400000001"), 1);
          expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a0400000005"), 5);
          expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a040000007f"), 127);
          expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a0400000080"), 128);
          expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a04000000f0"), 240);
          expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a04000000ff"), 255);

          // 2-byte encoded index
          expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a0400000100"), 256);
          expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a0400000101"), 257);
          expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a040000017f"), 383);
          expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a0400000180"), 384);
          expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a0400000181"), 385);
          expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a04000001ff"), 511);
          expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a0400007f00"), 33512);
          expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a0400007fff"), 33767);
          expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a0400008000"), 32768);
          expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a0400008001"), 32769);
          expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a040000807f"), 32895);
          expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a04000080ff"), 33023);
          expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a040000fcfd"), 64765);
          expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a040000ffff"), 65535);

          // 3-byte encoded index
          expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a0400010000"), 65536);
          expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a0400010001"), 65537);
          expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a040001007f"), 65663);
          expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a0400017e7f"), 97919);
          expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a040001feff"), 130815);
          expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a040001fffe"), 131070);
          expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a040001ffff"), 131071);
          expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a04007f0000"), 8323072);
          expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a04007f0001"), 8323073);
          expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a04007f007e"), 8323198);
          expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a04007f7d7e"), 8355198);
          expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a0400800000"), 8388608);
          expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a0400800001"), 8388609);
          expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a040080007f"), 8388735);
          expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a0400807f7f"), 8421247);
          expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a0400808080"), 8421504);
          expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a040080ffff"), 8454143);
          expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a0400eeffff"), 15663103);
          expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a0400ffffff"), 16777215);

          // 4-byte encoded index
          expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a0401000000"), 16777216);
          expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a0401000001"), 16777217);
          expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a040100007f"), 16777343);
          expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a0401000080"), 16777344);
          expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a04010000ff"), 16777471);
          expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a0401000100"), 16777472);
          expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a040100017f"), 16777599);
          expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a0401007f7e"), 16809854);
          expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a0401007fff"), 16809983);
          expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a0401008000"), 16809984);
          expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a040100807f"), 16810111);
          expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a04010080ff"), 16810239);
          expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a040100ff00"), 16842496);
          expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a040100ff7f"), 16842623);
          expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a040100ff80"), 16842624);
          expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a040100fffe"), 16842750);
          expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a040100ffff"), 16842751);
          expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a04017f0000"), 25100288);
          expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a04017f007d"), 25100413);
          expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a04017f0080"), 25100416);
          expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a04017f00ff"), 25100543);
          expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a04017f7f00"), 25132800);
          expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a04017f7f7f"), 25132927);
          expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a04017f7fff"), 25133055);
          expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a04017fffff"), 25165823);
          expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a0401ffffff"), 33554431);
          expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a047f000000"), 2130706432);
          expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a047f0000ff"), 2130706687);
          expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a047f00feff"), 2130771711);
          expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a047ffdfeff"), 2147352319);
          expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a047fffffff"), 2147483647);
          expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a0480000000"), 2147483648);
          expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a048000007f"), 2147483775);
          expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a0480007fff"), 2147516415);
          expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a04800080ff"), 2147516671);
          expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a048000ffff"), 2147549183);
          expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a04807fffff"), 2155872255);
          expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a048080ffff"), 2155937791);
          expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a0480fffefd"), 2164260605);
          expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a0480ffffff"), 2164260863);
          expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a04fe000000"), 4261412864);
          expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a04fefdfcfb"), 4278058235);
          expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a04feffffff"), 4278190079);
          expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a04ff000000"), 4278190080);
          expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a04ff7d7e7f"), 4286414463);
          expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a04ff808182"), 4286611842);
          expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a04fffefdfc"), 4294901244);
          expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a04ffffffff"), 4294967295);
        });

        it("Should extract indexes correctly from 7-byte OP_RETURN", async function () {
            const { utxoLogicHelperContract } = await loadFixture(deploySimpleBitcoinVaultUTXOLogicHelper);
    
            // 1-byte encoded index
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a0500000000ff"), 0);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a0500000001fe"), 1);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a0500000005fa"), 5);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a050000007f7f"), 127);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a050000008000"), 128);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a05000000f0ab"), 240);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a05000000ffc9"), 255);
  
            // 2-byte encoded index
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a0500000100ab"), 256);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a0500000101ff"), 257);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a050000017fce"), 383);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a05000001803d"), 384);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a05000001815f"), 385);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a05000001fffa"), 511);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a0500007f00ad"), 33512);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a0500007fffca"), 33767);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a050000800000"), 32768);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a0500008001f1"), 32769);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a050000807fc3"), 32895);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a05000080ff3d"), 33023);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a050000fcfd8a"), 64765);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a050000ffff7f"), 65535);
  
            // 3-byte encoded index
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a0500010000ab"), 65536);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a0500010001ca"), 65537);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a050001007fc1"), 65663);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a0500017e7fdf"), 97919);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a050001feff99"), 130815);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a050001fffe81"), 131070);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a050001ffff32"), 131071);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a05007f000061"), 8323072);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a05007f000172"), 8323073);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a05007f007eab"), 8323198);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a05007f7d7ecc"), 8355198);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a0500800000ef"), 8388608);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a0500800001ab"), 8388609);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a050080007fa4"), 8388735);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a0500807f7f4e"), 8421247);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a050080808076"), 8421504);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a050080ffff90"), 8454143);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a0500eeffff21"), 15663103);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a0500ffffff0f"), 16777215);
  
            // 4-byte encoded index
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a050100000000"), 16777216);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a0501000001af"), 16777217);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a050100007fed"), 16777343);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a050100008011"), 16777344);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a05010000ff33"), 16777471);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a050100010055"), 16777472);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a050100017ff1"), 16777599);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a0501007f7eff"), 16809854);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a0501007ffff7"), 16809983);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a050100800051"), 16809984);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a050100807f32"), 16810111);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a05010080ffae"), 16810239);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a050100ff00f4"), 16842496);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a050100ff7fd3"), 16842623);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a050100ff80c9"), 16842624);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a050100fffeaf"), 16842750);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a050100ffffed"), 16842751);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a05017f0000e9"), 25100288);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a05017f007d7d"), 25100413);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a05017f008000"), 25100416);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a05017f00ff00"), 25100543);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a05017f7f0001"), 25132800);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a05017f7f7f02"), 25132927);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a05017f7fffff"), 25133055);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a05017ffffffe"), 25165823);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a0501fffffffa"), 33554431);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a057f000000f7"), 2130706432);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a057f0000ffef"), 2130706687);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a057f00feffab"), 2130771711);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a057ffdfeff91"), 2147352319);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a057fffffff58"), 2147483647);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a058000000049"), 2147483648);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a058000007f7f"), 2147483775);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a0580007ffff7"), 2147516415);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a05800080ffff"), 2147516671);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a058000ffffab"), 2147549183);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a05807fffff7c"), 2155872255);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a058080ffff61"), 2155937791);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a0580fffefd92"), 2164260605);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a0580ffffffba"), 2164260863);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a05fe00000033"), 4261412864);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a05fefdfcfb65"), 4278058235);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a05feffffff6f"), 4278190079);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a05ff0000009f"), 4278190080);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a05ff7d7e7f80"), 4286414463);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a05ff80818200"), 4286611842);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a05fffefdfcff"), 4294901244);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a05ffffffffea"), 4294967295);
          });

        it("Should extract indexes correctly from 75-byte OP_RETURN", async function () {
            const { utxoLogicHelperContract } = await loadFixture(deploySimpleBitcoinVaultUTXOLogicHelper);
    
            // 1-byte encoded index
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a4b00000000683f7930e9402a7806ef427f835c96c7f5f1908302b9dc67760961beb2a88bcc2c006d97195f545e1c08c4eca0a417648490d3cf059341303b3dab8d4ad24f8cea29f1fd9eb707"), 0);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a4b0000007f683f7930e9402a7806ef427f835c96c7f5f1908302b9dc67760961beb2a88bcc2c006d97195f545e1c08c4eca0a417648490d3cf059341303b3dab8d4ad24f8cea29f1fd9eb707"), 127);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a4b000000ff683f7930e9402a7806ef427f835c96c7f5f1908302b9dc67760961beb2a88bcc2c006d97195f545e1c08c4eca0a417648490d3cf059341303b3dab8d4ad24f8cea29f1fd9eb707"), 255);
  
            // 2-byte encoded index
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a4b00000100683f7930e9402a7806ef427f835c96c7f5f1908302b9dc67760961beb2a88bcc2c006d97195f545e1c08c4eca0a417648490d3cf059341303b3dab8d4ad24f8cea29f1fd9eb707"), 256);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a4b0000017f683f7930e9402a7806ef427f835c96c7f5f1908302b9dc67760961beb2a88bcc2c006d97195f545e1c08c4eca0a417648490d3cf059341303b3dab8d4ad24f8cea29f1fd9eb707"), 383);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a4b000001ff683f7930e9402a7806ef427f835c96c7f5f1908302b9dc67760961beb2a88bcc2c006d97195f545e1c08c4eca0a417648490d3cf059341303b3dab8d4ad24f8cea29f1fd9eb707"), 511);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a4b00000200683f7930e9402a7806ef427f835c96c7f5f1908302b9dc67760961beb2a88bcc2c006d97195f545e1c08c4eca0a417648490d3cf059341303b3dab8d4ad24f8cea29f1fd9eb707"), 512);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a4b00007f7e683f7930e9402a7806ef427f835c96c7f5f1908302b9dc67760961beb2a88bcc2c006d97195f545e1c08c4eca0a417648490d3cf059341303b3dab8d4ad24f8cea29f1fd9eb707"), 32638);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a4b0000ff00683f7930e9402a7806ef427f835c96c7f5f1908302b9dc67760961beb2a88bcc2c006d97195f545e1c08c4eca0a417648490d3cf059341303b3dab8d4ad24f8cea29f1fd9eb707"), 65280);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a4b0000fffe683f7930e9402a7806ef427f835c96c7f5f1908302b9dc67760961beb2a88bcc2c006d97195f545e1c08c4eca0a417648490d3cf059341303b3dab8d4ad24f8cea29f1fd9eb707"), 65534);
  
            // 3-byte encoded index
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a4b00010000683f7930e9402a7806ef427f835c96c7f5f1908302b9dc67760961beb2a88bcc2c006d97195f545e1c08c4eca0a417648490d3cf059341303b3dab8d4ad24f8cea29f1fd9eb707"), 65536);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a4b000100fe683f7930e9402a7806ef427f835c96c7f5f1908302b9dc67760961beb2a88bcc2c006d97195f545e1c08c4eca0a417648490d3cf059341303b3dab8d4ad24f8cea29f1fd9eb707"), 65790);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a4b0001fffe683f7930e9402a7806ef427f835c96c7f5f1908302b9dc67760961beb2a88bcc2c006d97195f545e1c08c4eca0a417648490d3cf059341303b3dab8d4ad24f8cea29f1fd9eb707"), 131070);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a4b007ffffe683f7930e9402a7806ef427f835c96c7f5f1908302b9dc67760961beb2a88bcc2c006d97195f545e1c08c4eca0a417648490d3cf059341303b3dab8d4ad24f8cea29f1fd9eb707"), 8388606);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a4b0080fffe683f7930e9402a7806ef427f835c96c7f5f1908302b9dc67760961beb2a88bcc2c006d97195f545e1c08c4eca0a417648490d3cf059341303b3dab8d4ad24f8cea29f1fd9eb707"), 8454142);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a4b00fffefd683f7930e9402a7806ef427f835c96c7f5f1908302b9dc67760961beb2a88bcc2c006d97195f545e1c08c4eca0a417648490d3cf059341303b3dab8d4ad24f8cea29f1fd9eb707"), 16776957);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a4b00ffffff683f7930e9402a7806ef427f835c96c7f5f1908302b9dc67760961beb2a88bcc2c006d97195f545e1c08c4eca0a417648490d3cf059341303b3dab8d4ad24f8cea29f1fd9eb707"), 16777215);
  
            // 4-byte encoded index
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a4b01000000683f7930e9402a7806ef427f835c96c7f5f1908302b9dc67760961beb2a88bcc2c006d97195f545e1c08c4eca0a417648490d3cf059341303b3dab8d4ad24f8cea29f1fd9eb707"), 16777216);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a4b0100007f683f7930e9402a7806ef427f835c96c7f5f1908302b9dc67760961beb2a88bcc2c006d97195f545e1c08c4eca0a417648490d3cf059341303b3dab8d4ad24f8cea29f1fd9eb707"), 16777343);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a4b0100fefd683f7930e9402a7806ef427f835c96c7f5f1908302b9dc67760961beb2a88bcc2c006d97195f545e1c08c4eca0a417648490d3cf059341303b3dab8d4ad24f8cea29f1fd9eb707"), 16842493);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a4b01fffafc683f7930e9402a7806ef427f835c96c7f5f1908302b9dc67760961beb2a88bcc2c006d97195f545e1c08c4eca0a417648490d3cf059341303b3dab8d4ad24f8cea29f1fd9eb707"), 33553148);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a4b7f000000683f7930e9402a7806ef427f835c96c7f5f1908302b9dc67760961beb2a88bcc2c006d97195f545e1c08c4eca0a417648490d3cf059341303b3dab8d4ad24f8cea29f1fd9eb707"), 133169152);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a4b7f0000ff683f7930e9402a7806ef427f835c96c7f5f1908302b9dc67760961beb2a88bcc2c006d97195f545e1c08c4eca0a417648490d3cf059341303b3dab8d4ad24f8cea29f1fd9eb707"), 2130706687);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a4b7f00ffff683f7930e9402a7806ef427f835c96c7f5f1908302b9dc67760961beb2a88bcc2c006d97195f545e1c08c4eca0a417648490d3cf059341303b3dab8d4ad24f8cea29f1fd9eb707"), 2130771967);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a4b7ffefdfc683f7930e9402a7806ef427f835c96c7f5f1908302b9dc67760961beb2a88bcc2c006d97195f545e1c08c4eca0a417648490d3cf059341303b3dab8d4ad24f8cea29f1fd9eb707"), 2147417596);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a4b80000000683f7930e9402a7806ef427f835c96c7f5f1908302b9dc67760961beb2a88bcc2c006d97195f545e1c08c4eca0a417648490d3cf059341303b3dab8d4ad24f8cea29f1fd9eb707"), 2147483648);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a4bfffefdfc683f7930e9402a7806ef427f835c96c7f5f1908302b9dc67760961beb2a88bcc2c006d97195f545e1c08c4eca0a417648490d3cf059341303b3dab8d4ad24f8cea29f1fd9eb707"), 4294901244);
          });

          // 76+ byte OP_RETURN have an extra byte because there is no OP_PUSHBYTES_76+, so OP_PUSHDATA1 + (length) is used
        it("Should extract indexes correctly from 76-byte OP_RETURN", async function () {
            const { utxoLogicHelperContract } = await loadFixture(deploySimpleBitcoinVaultUTXOLogicHelper);
    
            // 1-byte encoded index
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a4c4c00000000683f7930e9402a7806ef427f835c96c7f5f1908302b9dc67760961beb2a88bcc2c006d97195f545e1c08c4eca0a417648490d3cf059341303b3dab8d4ad24f8cea29f1fd9eb70701"), 0);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a4c4c0000007f683f7930e9402a7806ef427f835c96c7f5f1908302b9dc67760961beb2a88bcc2c006d97195f545e1c08c4eca0a417648490d3cf059341303b3dab8d4ad24f8cea29f1fd9eb70702"), 127);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a4c4c000000ff683f7930e9402a7806ef427f835c96c7f5f1908302b9dc67760961beb2a88bcc2c006d97195f545e1c08c4eca0a417648490d3cf059341303b3dab8d4ad24f8cea29f1fd9eb707af"), 255);
  
            // 2-byte encoded index
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a4c4c00000100683f7930e9402a7806ef427f835c96c7f5f1908302b9dc67760961beb2a88bcc2c006d97195f545e1c08c4eca0a417648490d3cf059341303b3dab8d4ad24f8cea29f1fd9eb707ff"), 256);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a4c4c0000017f683f7930e9402a7806ef427f835c96c7f5f1908302b9dc67760961beb2a88bcc2c006d97195f545e1c08c4eca0a417648490d3cf059341303b3dab8d4ad24f8cea29f1fd9eb707b1"), 383);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a4c4c000001ff683f7930e9402a7806ef427f835c96c7f5f1908302b9dc67760961beb2a88bcc2c006d97195f545e1c08c4eca0a417648490d3cf059341303b3dab8d4ad24f8cea29f1fd9eb707c2"), 511);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a4c4c00000200683f7930e9402a7806ef427f835c96c7f5f1908302b9dc67760961beb2a88bcc2c006d97195f545e1c08c4eca0a417648490d3cf059341303b3dab8d4ad24f8cea29f1fd9eb707e4"), 512);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a4c4c00007f7e683f7930e9402a7806ef427f835c96c7f5f1908302b9dc67760961beb2a88bcc2c006d97195f545e1c08c4eca0a417648490d3cf059341303b3dab8d4ad24f8cea29f1fd9eb707f5"), 32638);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a4c4c0000ff00683f7930e9402a7806ef427f835c96c7f5f1908302b9dc67760961beb2a88bcc2c006d97195f545e1c08c4eca0a417648490d3cf059341303b3dab8d4ad24f8cea29f1fd9eb707ab"), 65280);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a4c4c0000fffe683f7930e9402a7806ef427f835c96c7f5f1908302b9dc67760961beb2a88bcc2c006d97195f545e1c08c4eca0a417648490d3cf059341303b3dab8d4ad24f8cea29f1fd9eb70777"), 65534);
  
            // 3-byte encoded index
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a4c4c00010000683f7930e9402a7806ef427f835c96c7f5f1908302b9dc67760961beb2a88bcc2c006d97195f545e1c08c4eca0a417648490d3cf059341303b3dab8d4ad24f8cea29f1fd9eb707ff"), 65536);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a4c4c000100fe683f7930e9402a7806ef427f835c96c7f5f1908302b9dc67760961beb2a88bcc2c006d97195f545e1c08c4eca0a417648490d3cf059341303b3dab8d4ad24f8cea29f1fd9eb70766"), 65790);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a4c4c0001fffe683f7930e9402a7806ef427f835c96c7f5f1908302b9dc67760961beb2a88bcc2c006d97195f545e1c08c4eca0a417648490d3cf059341303b3dab8d4ad24f8cea29f1fd9eb70755"), 131070);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a4c4c007ffffe683f7930e9402a7806ef427f835c96c7f5f1908302b9dc67760961beb2a88bcc2c006d97195f545e1c08c4eca0a417648490d3cf059341303b3dab8d4ad24f8cea29f1fd9eb70744"), 8388606);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a4c4c0080fffe683f7930e9402a7806ef427f835c96c7f5f1908302b9dc67760961beb2a88bcc2c006d97195f545e1c08c4eca0a417648490d3cf059341303b3dab8d4ad24f8cea29f1fd9eb70733"), 8454142);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a4c4c00fffefd683f7930e9402a7806ef427f835c96c7f5f1908302b9dc67760961beb2a88bcc2c006d97195f545e1c08c4eca0a417648490d3cf059341303b3dab8d4ad24f8cea29f1fd9eb70722"), 16776957);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a4c4c00ffffff683f7930e9402a7806ef427f835c96c7f5f1908302b9dc67760961beb2a88bcc2c006d97195f545e1c08c4eca0a417648490d3cf059341303b3dab8d4ad24f8cea29f1fd9eb707fa"), 16777215);
  
            // 4-byte encoded index
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a4c4c01000000683f7930e9402a7806ef427f835c96c7f5f1908302b9dc67760961beb2a88bcc2c006d97195f545e1c08c4eca0a417648490d3cf059341303b3dab8d4ad24f8cea29f1fd9eb707ab"), 16777216);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a4c4c0100007f683f7930e9402a7806ef427f835c96c7f5f1908302b9dc67760961beb2a88bcc2c006d97195f545e1c08c4eca0a417648490d3cf059341303b3dab8d4ad24f8cea29f1fd9eb707ac"), 16777343);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a4c4c0100fefd683f7930e9402a7806ef427f835c96c7f5f1908302b9dc67760961beb2a88bcc2c006d97195f545e1c08c4eca0a417648490d3cf059341303b3dab8d4ad24f8cea29f1fd9eb707ad"), 16842493);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a4c4c01fffafc683f7930e9402a7806ef427f835c96c7f5f1908302b9dc67760961beb2a88bcc2c006d97195f545e1c08c4eca0a417648490d3cf059341303b3dab8d4ad24f8cea29f1fd9eb70701"), 33553148);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a4c4c7f000000683f7930e9402a7806ef427f835c96c7f5f1908302b9dc67760961beb2a88bcc2c006d97195f545e1c08c4eca0a417648490d3cf059341303b3dab8d4ad24f8cea29f1fd9eb70722"), 133169152);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a4c4c7f0000ff683f7930e9402a7806ef427f835c96c7f5f1908302b9dc67760961beb2a88bcc2c006d97195f545e1c08c4eca0a417648490d3cf059341303b3dab8d4ad24f8cea29f1fd9eb70736"), 2130706687);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a4c4c7f00ffff683f7930e9402a7806ef427f835c96c7f5f1908302b9dc67760961beb2a88bcc2c006d97195f545e1c08c4eca0a417648490d3cf059341303b3dab8d4ad24f8cea29f1fd9eb70798"), 2130771967);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a4c4c7ffefdfc683f7930e9402a7806ef427f835c96c7f5f1908302b9dc67760961beb2a88bcc2c006d97195f545e1c08c4eca0a417648490d3cf059341303b3dab8d4ad24f8cea29f1fd9eb70778"), 2147417596);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a4c4c80000000683f7930e9402a7806ef427f835c96c7f5f1908302b9dc67760961beb2a88bcc2c006d97195f545e1c08c4eca0a417648490d3cf059341303b3dab8d4ad24f8cea29f1fd9eb70776"), 2147483648);
            expect(await utxoLogicHelperContract.extractWithdrawalIndexFromOpReturn("0x6a4c4cfffefdfc683f7930e9402a7806ef427f835c96c7f5f1908302b9dc67760961beb2a88bcc2c006d97195f545e1c08c4eca0a417648490d3cf059341303b3dab8d4ad24f8cea29f1fd9eb70775"), 4294901244);
          });
      });

    describe("Check Deposit Confirmation Validity", function () {
        it("Should reject deposit that is already acknowledged", async function () {
          const { utxoLogicHelperContract, mockSimpleBitcoinVaultStateContract, 
            mockBitcoinKitContract, deployer, notOwner1, notOwner2 } = await loadFixture(deployUTXOHelperWithSupportingContracts);

          await mockSimpleBitcoinVaultStateContract.setDepositAcknowledged(txid1, true);
  
          await expect(utxoLogicHelperContract.checkDepositConfirmationValidity(
            txid1,
            0,
            await mockBitcoinKitContract.getAddress(),
            emptyHash,
            await mockSimpleBitcoinVaultStateContract.getAddress(),
            100
          )).to.be.revertedWith("txid has already been confirmed");
        });

        it("Should reject deposit with a claimed output index >= 8", async function () {
            const { utxoLogicHelperContract, mockSimpleBitcoinVaultStateContract, 
              mockBitcoinKitContract, deployer, notOwner1, notOwner2 } = await loadFixture(deployUTXOHelperWithSupportingContracts);
  
            await expect(utxoLogicHelperContract.checkDepositConfirmationValidity(
              txid1,
              8,
              await mockBitcoinKitContract.getAddress(),
              emptyHash,
              await mockSimpleBitcoinVaultStateContract.getAddress(),
              100
            )).to.be.revertedWith("output index must be one of the first 8 outputs");

            await expect(utxoLogicHelperContract.checkDepositConfirmationValidity(
                txid1,
                9,
                await mockBitcoinKitContract.getAddress(),
                emptyHash,
                await mockSimpleBitcoinVaultStateContract.getAddress(),
                100
              )).to.be.revertedWith("output index must be one of the first 8 outputs");

              await expect(utxoLogicHelperContract.checkDepositConfirmationValidity(
                txid1,
                12,
                await mockBitcoinKitContract.getAddress(),
                emptyHash,
                await mockSimpleBitcoinVaultStateContract.getAddress(),
                100
              )).to.be.revertedWith("output index must be one of the first 8 outputs");
          });

        it("Should reject deposit where bitcoin transaction does not have enough outputs for claimed output index", async function () {
            const { utxoLogicHelperContract, mockSimpleBitcoinVaultStateContract, 
            mockBitcoinKitContract, deployer, notOwner1, notOwner2 } = await loadFixture(deployUTXOHelperWithSupportingContracts);

            await mockBitcoinKitContract.setTransactionByTxId(txid1, btcTx1);
            await mockBitcoinKitContract.setTransactionByTxId(txid2, btcTx2);
            await mockBitcoinKitContract.setTransactionByTxId(txid3, btcTx3);

            await expect(utxoLogicHelperContract.checkDepositConfirmationValidity(
                txid1,
                1,
                await mockBitcoinKitContract.getAddress(),
                emptyHash,
                await mockSimpleBitcoinVaultStateContract.getAddress(),
                100
            )).to.be.revertedWith("claimed outputIndex is greater than the number of outputs accessible in transaction");

            await expect(utxoLogicHelperContract.checkDepositConfirmationValidity(
                txid1,
                2,
                await mockBitcoinKitContract.getAddress(),
                emptyHash,
                await mockSimpleBitcoinVaultStateContract.getAddress(),
                100
            )).to.be.revertedWith("claimed outputIndex is greater than the number of outputs accessible in transaction");

            await expect(utxoLogicHelperContract.checkDepositConfirmationValidity(
                txid1,
                3,
                await mockBitcoinKitContract.getAddress(),
                emptyHash,
                await mockSimpleBitcoinVaultStateContract.getAddress(),
                100
            )).to.be.revertedWith("claimed outputIndex is greater than the number of outputs accessible in transaction");

            await expect(utxoLogicHelperContract.checkDepositConfirmationValidity(
                txid2,
                1,
                await mockBitcoinKitContract.getAddress(),
                emptyHash,
                await mockSimpleBitcoinVaultStateContract.getAddress(),
                100
            )).to.be.revertedWith("claimed outputIndex is greater than the number of outputs accessible in transaction");

            await expect(utxoLogicHelperContract.checkDepositConfirmationValidity(
                txid2,
                5,
                await mockBitcoinKitContract.getAddress(),
                emptyHash,
                await mockSimpleBitcoinVaultStateContract.getAddress(),
                100
            )).to.be.revertedWith("claimed outputIndex is greater than the number of outputs accessible in transaction");

            await expect(utxoLogicHelperContract.checkDepositConfirmationValidity(
                txid2,
                7,
                await mockBitcoinKitContract.getAddress(),
                emptyHash,
                await mockSimpleBitcoinVaultStateContract.getAddress(),
                100
            )).to.be.revertedWith("claimed outputIndex is greater than the number of outputs accessible in transaction");

            await expect(utxoLogicHelperContract.checkDepositConfirmationValidity(
                txid3,
                3,
                await mockBitcoinKitContract.getAddress(),
                emptyHash,
                await mockSimpleBitcoinVaultStateContract.getAddress(),
                100
            )).to.be.revertedWith("claimed outputIndex is greater than the number of outputs accessible in transaction");

            await expect(utxoLogicHelperContract.checkDepositConfirmationValidity(
                txid3,
                4,
                await mockBitcoinKitContract.getAddress(),
                emptyHash,
                await mockSimpleBitcoinVaultStateContract.getAddress(),
                100
            )).to.be.revertedWith("claimed outputIndex is greater than the number of outputs accessible in transaction");

            await expect(utxoLogicHelperContract.checkDepositConfirmationValidity(
                txid3,
                6,
                await mockBitcoinKitContract.getAddress(),
                emptyHash,
                await mockSimpleBitcoinVaultStateContract.getAddress(),
                100
            )).to.be.revertedWith("claimed outputIndex is greater than the number of outputs accessible in transaction");
        });

        it("Should reject deposit without an op_return containing an extractable evm address", async function () {
            const { utxoLogicHelperContract, mockSimpleBitcoinVaultStateContract, 
            mockBitcoinKitContract, deployer, notOwner1, notOwner2 } = await loadFixture(deployUTXOHelperWithSupportingContracts);

            await mockBitcoinKitContract.setTransactionByTxId(txid1, btcTx1);
            await mockBitcoinKitContract.setTransactionByTxId(txid2, btcTx2);
            await mockBitcoinKitContract.setTransactionByTxId(txid3, btcTx3);

            await expect(utxoLogicHelperContract.checkDepositConfirmationValidity(
                txid1,
                0,
                await mockBitcoinKitContract.getAddress(),
                emptyHash,
                await mockSimpleBitcoinVaultStateContract.getAddress(),
                100
            )).to.be.revertedWith("could not extract an EVM address to credit from deposit");

            await expect(utxoLogicHelperContract.checkDepositConfirmationValidity(
                txid2,
                0,
                await mockBitcoinKitContract.getAddress(),
                emptyHash,
                await mockSimpleBitcoinVaultStateContract.getAddress(),
                100
            )).to.be.revertedWith("could not extract an EVM address to credit from deposit");

            await expect(utxoLogicHelperContract.checkDepositConfirmationValidity(
                txid3,
                0,
                await mockBitcoinKitContract.getAddress(),
                emptyHash,
                await mockSimpleBitcoinVaultStateContract.getAddress(),
                100
            )).to.be.revertedWith("could not extract an EVM address to credit from deposit");

            await expect(utxoLogicHelperContract.checkDepositConfirmationValidity(
                txid3,
                1,
                await mockBitcoinKitContract.getAddress(),
                emptyHash,
                await mockSimpleBitcoinVaultStateContract.getAddress(),
                100
            )).to.be.revertedWith("could not extract an EVM address to credit from deposit");

            await expect(utxoLogicHelperContract.checkDepositConfirmationValidity(
                txid3,
                2,
                await mockBitcoinKitContract.getAddress(),
                emptyHash,
                await mockSimpleBitcoinVaultStateContract.getAddress(),
                100
            )).to.be.revertedWith("could not extract an EVM address to credit from deposit");
        });

        it("Should reject deposit where claimed deposit utxo does not deposit funds to the vault custodianship script hash", async function () {
            const { utxoLogicHelperContract, mockSimpleBitcoinVaultStateContract, 
            mockBitcoinKitContract, testUtilsContract } = await loadFixture(deployUTXOHelperWithSupportingContracts);

            // These transactions have an OP_RETURN that contains an extractable EVM address, but it outputs to a script we don't use for a custodian.
            // Transactions have EVM address and incorrect "deposit" output at different indexes, and one has the ASCII encoding rather than byte encoding
            // of the EVM address.
            await mockBitcoinKitContract.setTransactionByTxId(txid1, depositBtcTxToBadCustodianForEVMAddress1_1);
            await mockBitcoinKitContract.setTransactionByTxId(txid2, depositBtcTxToBadCustodianForEVMAddress1_2);
            await mockBitcoinKitContract.setTransactionByTxId(txid3, depositBtcTxToBadCustodianForEVMAddressAsciiLC1_1);

            custodian1ScriptHash = await testUtilsContract.calculateScriptHash(custodianScript1);

            await expect(utxoLogicHelperContract.checkDepositConfirmationValidity(
                txid1,
                1,
                await mockBitcoinKitContract.getAddress(),
                custodian1ScriptHash,
                await mockSimpleBitcoinVaultStateContract.getAddress(),
                100
            )).to.be.revertedWith("claimed deposit output script must match vault holding pen script");


            await expect(utxoLogicHelperContract.checkDepositConfirmationValidity(
                txid2,
                0,
                await mockBitcoinKitContract.getAddress(),
                custodian1ScriptHash,
                await mockSimpleBitcoinVaultStateContract.getAddress(),
                100
            )).to.be.revertedWith("claimed deposit output script must match vault holding pen script");


            await expect(utxoLogicHelperContract.checkDepositConfirmationValidity(
                txid3,
                0,
                await mockBitcoinKitContract.getAddress(),
                custodian1ScriptHash,
                await mockSimpleBitcoinVaultStateContract.getAddress(),
                100
            )).to.be.revertedWith("claimed deposit output script must match vault holding pen script");
        });

        it("Should reject deposit where the deposited sats are lower than the minimum deposit sat amount", async function () {
            const { utxoLogicHelperContract, mockSimpleBitcoinVaultStateContract, 
            mockBitcoinKitContract, testUtilsContract } = await loadFixture(deployUTXOHelperWithSupportingContracts);

            // These transactions contain outputs at the specified index that pay out to the custodian address, but the output
            // amounts are lower than we request as a minimum deposit amount
            await mockBitcoinKitContract.setTransactionByTxId(txid1, depositBtcTxToCustodian1ForEVMAddress1_1);
            await mockBitcoinKitContract.setTransactionByTxId(txid2, depositBtcTxToCustodian1ForEVMAddress1_2);
            await mockBitcoinKitContract.setTransactionByTxId(txid3, depositBtcTxToCustodian1ForEVMAddressAsciiLC1_1);

            custodian1ScriptHash = await testUtilsContract.calculateScriptHash(custodianScript1);

            await expect(utxoLogicHelperContract.checkDepositConfirmationValidity(
                txid1,
                1,
                await mockBitcoinKitContract.getAddress(),
                custodian1ScriptHash,
                await mockSimpleBitcoinVaultStateContract.getAddress(),
                40000 // Output is only 30000 sats
            )).to.be.revertedWith("deposit must meet the minimum deposit size threshold");


            await expect(utxoLogicHelperContract.checkDepositConfirmationValidity(
                txid2,
                0,
                await mockBitcoinKitContract.getAddress(),
                custodian1ScriptHash,
                await mockSimpleBitcoinVaultStateContract.getAddress(),
                40000 // Output is only 30000 sats
            )).to.be.revertedWith("deposit must meet the minimum deposit size threshold");


            await expect(utxoLogicHelperContract.checkDepositConfirmationValidity(
                txid3,
                2,
                await mockBitcoinKitContract.getAddress(),
                custodian1ScriptHash,
                await mockSimpleBitcoinVaultStateContract.getAddress(),
                40000 // Output is only 30000 sats
            )).to.be.revertedWith("deposit must meet the minimum deposit size threshold");
        });

        it("Should reject deposit where the calculated deposit fee is higher than the deposited sats", async function () {
            const { utxoLogicHelperContract, mockSimpleBitcoinVaultStateContract, 
            mockBitcoinKitContract, testUtilsContract } = await loadFixture(deployUTXOHelperWithSupportingContracts);

            // Set our mock vaultStateChild to return 30001 sats deposit fee for a deposit of size 30000
            // In reality, this would be because the amount deposited is lower than the minimum deposit amount
            await mockSimpleBitcoinVaultStateContract.setDepositFee(30000, 30001);

            await mockBitcoinKitContract.setTransactionByTxId(txid1, depositBtcTxToCustodian1ForEVMAddress1_1);
            await mockBitcoinKitContract.setTransactionByTxId(txid2, depositBtcTxToCustodian1ForEVMAddress1_2);
            await mockBitcoinKitContract.setTransactionByTxId(txid3, depositBtcTxToCustodian1ForEVMAddressAsciiLC1_1);

            custodian1ScriptHash = await testUtilsContract.calculateScriptHash(custodianScript1);

            await expect(utxoLogicHelperContract.checkDepositConfirmationValidity(
                txid1,
                1,
                await mockBitcoinKitContract.getAddress(),
                custodian1ScriptHash,
                await mockSimpleBitcoinVaultStateContract.getAddress(),
                30000
            )).to.be.revertedWith("the amount of sats deposited must exceed the fees charged by the vault");


            await expect(utxoLogicHelperContract.checkDepositConfirmationValidity(
                txid2,
                0,
                await mockBitcoinKitContract.getAddress(),
                custodian1ScriptHash,
                await mockSimpleBitcoinVaultStateContract.getAddress(),
                30000
            )).to.be.revertedWith("the amount of sats deposited must exceed the fees charged by the vault");


            await expect(utxoLogicHelperContract.checkDepositConfirmationValidity(
                txid3,
                2,
                await mockBitcoinKitContract.getAddress(),
                custodian1ScriptHash,
                await mockSimpleBitcoinVaultStateContract.getAddress(),
                30000
            )).to.be.revertedWith("the amount of sats deposited must exceed the fees charged by the vault");
        });

        it("Should accept 1-input 2-output deposit with address bytes in output 0 and deposit in output 1", async function () {
            const { utxoLogicHelperContract, mockSimpleBitcoinVaultStateContract, 
            mockBitcoinKitContract, testUtilsContract } = await loadFixture(deployUTXOHelperWithSupportingContracts);

            depositFee = 10000;
            await mockSimpleBitcoinVaultStateContract.setDepositFee(30000, depositFee);
            custodian1ScriptHash = await testUtilsContract.calculateScriptHash(custodianScript1);

            // Test transaction where EVM address is encoded as bytes
            await mockBitcoinKitContract.setTransactionByTxId(txid1, depositBtcTxToCustodian1ForEVMAddress1_3);
            [success, netDepositSats, depositFeeSats, depositor] = 
            await utxoLogicHelperContract.checkDepositConfirmationValidity(
                txid1,
                1,
                await mockBitcoinKitContract.getAddress(),
                custodian1ScriptHash,
                await mockSimpleBitcoinVaultStateContract.getAddress(),
                30000
            );

            expect(success).to.equal(true);
            expect(netDepositSats).to.equal(30000 - depositFee);
            expect(depositFeeSats).to.equal(depositFee);
            expect(depositor.toLowerCase()).to.equal("0x" + evmDepositorAddress1);
        });

        it("Should accept 1-input 2-output deposit with address lower-case hex in output 0 and deposit in output 1", async function () {
            const { utxoLogicHelperContract, mockSimpleBitcoinVaultStateContract, 
            mockBitcoinKitContract, testUtilsContract } = await loadFixture(deployUTXOHelperWithSupportingContracts);

            depositFee = 10000;
            await mockSimpleBitcoinVaultStateContract.setDepositFee(30000, depositFee);
            custodian1ScriptHash = await testUtilsContract.calculateScriptHash(custodianScript1);

            // Test transaction where EVM address is encoded as hex representing lower-case hex
            await mockBitcoinKitContract.setTransactionByTxId(txid1, depositBtcTxToCustodian1ForEVMAddressAsciiLC1_3);
            [success, netDepositSats, depositFeeSats, depositor] = 
            await utxoLogicHelperContract.checkDepositConfirmationValidity(
                txid1,
                1,
                await mockBitcoinKitContract.getAddress(),
                custodian1ScriptHash,
                await mockSimpleBitcoinVaultStateContract.getAddress(),
                30000
            );

            expect(success).to.equal(true);
            expect(netDepositSats).to.equal(30000 - depositFee);
            expect(depositFeeSats).to.equal(depositFee);
            expect(depositor.toLowerCase()).to.equal("0x" + evmDepositorAddress1);
        });

        it("Should accept 1-input 2-output deposit with address mixed-case hex in output 0 and deposit in output 1", async function () {
            const { utxoLogicHelperContract, mockSimpleBitcoinVaultStateContract, 
            mockBitcoinKitContract, testUtilsContract } = await loadFixture(deployUTXOHelperWithSupportingContracts);

            depositFee = 10000;
            await mockSimpleBitcoinVaultStateContract.setDepositFee(30000, depositFee);
            custodian1ScriptHash = await testUtilsContract.calculateScriptHash(custodianScript1);

            // Test transaction where EVM address is encoded as hex representing mixed-case hex
            await mockBitcoinKitContract.setTransactionByTxId(txid1, depositBtcTxToCustodian1ForEVMAddressAsciiMC1_3);
            [success, netDepositSats, depositFeeSats, depositor] = 
            await utxoLogicHelperContract.checkDepositConfirmationValidity(
                txid1,
                1,
                await mockBitcoinKitContract.getAddress(),
                custodian1ScriptHash,
                await mockSimpleBitcoinVaultStateContract.getAddress(),
                30000
            );

            expect(success).to.equal(true);
            expect(netDepositSats).to.equal(30000 - depositFee);
            expect(depositFeeSats).to.equal(depositFee);
            expect(depositor.toLowerCase()).to.equal("0x" + evmDepositorAddress1);
        });

        it("Should accept 1-input 2-output deposit with deposit in output 0 and address bytes in output 1", async function () {
            const { utxoLogicHelperContract, mockSimpleBitcoinVaultStateContract, 
            mockBitcoinKitContract, testUtilsContract } = await loadFixture(deployUTXOHelperWithSupportingContracts);

            depositFee = 10000;
            await mockSimpleBitcoinVaultStateContract.setDepositFee(30000, depositFee);
            custodian1ScriptHash = await testUtilsContract.calculateScriptHash(custodianScript1);

            // Test transaction where EVM address is encoded as bytes
            await mockBitcoinKitContract.setTransactionByTxId(txid2, depositBtcTxToCustodian1ForEVMAddress1_4);
            [success, netDepositSats, depositFeeSats, depositor] = 
            await utxoLogicHelperContract.checkDepositConfirmationValidity(
                txid2,
                0,
                await mockBitcoinKitContract.getAddress(),
                custodian1ScriptHash,
                await mockSimpleBitcoinVaultStateContract.getAddress(),
                30000
            );

            expect(success).to.equal(true);
            expect(netDepositSats).to.equal(30000 - depositFee);
            expect(depositFeeSats).to.equal(depositFee);
            expect(depositor.toLowerCase()).to.equal("0x" + evmDepositorAddress1);
        });

        it("Should accept 1-input 2-output deposit with deposit in output 0 and address lower-case hex in output 1", async function () {
            const { utxoLogicHelperContract, mockSimpleBitcoinVaultStateContract, 
            mockBitcoinKitContract, testUtilsContract } = await loadFixture(deployUTXOHelperWithSupportingContracts);

            depositFee = 10000;
            await mockSimpleBitcoinVaultStateContract.setDepositFee(30000, depositFee);
            custodian1ScriptHash = await testUtilsContract.calculateScriptHash(custodianScript1);

            // Test transaction where EVM address is encoded as hex representing lower-case hex
            await mockBitcoinKitContract.setTransactionByTxId(txid3, depositBtcTxToCustodian1ForEVMAddressAsciiLC1_4);
            [success, netDepositSats, depositFeeSats, depositor] = 
            await utxoLogicHelperContract.checkDepositConfirmationValidity(
                txid3,
                0,
                await mockBitcoinKitContract.getAddress(),
                custodian1ScriptHash,
                await mockSimpleBitcoinVaultStateContract.getAddress(),
                30000
            );

            expect(success).to.equal(true);
            expect(netDepositSats).to.equal(30000 - depositFee);
            expect(depositFeeSats).to.equal(depositFee);
            expect(depositor.toLowerCase()).to.equal("0x" + evmDepositorAddress1);
        });

        it("Should accept 1-input 2-output deposit with deposit in output 0 and address mixed-case hex in output 1", async function () {
            const { utxoLogicHelperContract, mockSimpleBitcoinVaultStateContract, 
            mockBitcoinKitContract, testUtilsContract } = await loadFixture(deployUTXOHelperWithSupportingContracts);

            depositFee = 10000;
            await mockSimpleBitcoinVaultStateContract.setDepositFee(30000, depositFee);
            custodian1ScriptHash = await testUtilsContract.calculateScriptHash(custodianScript1);

            // Test transaction where EVM address is encoded as hex representing mixed-case hex
            await mockBitcoinKitContract.setTransactionByTxId(txid2, depositBtcTxToCustodian1ForEVMAddressAsciiMC1_4);
            [success, netDepositSats, depositFeeSats, depositor] = 
            await utxoLogicHelperContract.checkDepositConfirmationValidity(
                txid2,
                0,
                await mockBitcoinKitContract.getAddress(),
                custodian1ScriptHash,
                await mockSimpleBitcoinVaultStateContract.getAddress(),
                30000
            );

            expect(success).to.equal(true);
            expect(netDepositSats).to.equal(30000 - depositFee);
            expect(depositFeeSats).to.equal(depositFee);
            expect(depositor.toLowerCase()).to.equal("0x" + evmDepositorAddress1);
        });


        it("Should accept 2-input 2-output deposit with deposit in output 0 and address bytes in output 1", async function () {
            const { utxoLogicHelperContract, mockSimpleBitcoinVaultStateContract, 
            mockBitcoinKitContract, testUtilsContract } = await loadFixture(deployUTXOHelperWithSupportingContracts);

            depositFee = 10000;
            await mockSimpleBitcoinVaultStateContract.setDepositFee(30000, depositFee);
            custodian1ScriptHash = await testUtilsContract.calculateScriptHash(custodianScript1);

            // Test transaction where EVM address is encoded as bytes
            await mockBitcoinKitContract.setTransactionByTxId(txid2, depositBtcTxToCustodian1ForEVMAddress1_5);
            [success, netDepositSats, depositFeeSats, depositor] = 
            await utxoLogicHelperContract.checkDepositConfirmationValidity(
                txid2,
                0,
                await mockBitcoinKitContract.getAddress(),
                custodian1ScriptHash,
                await mockSimpleBitcoinVaultStateContract.getAddress(),
                30000
            );

            expect(success).to.equal(true);
            expect(netDepositSats).to.equal(30000 - depositFee);
            expect(depositFeeSats).to.equal(depositFee);
            expect(depositor.toLowerCase()).to.equal("0x" + evmDepositorAddress1);
        });

        it("Should accept 2-input 2-output deposit with address lower-case hex in output 0 and deposit in output 1", async function () {
            const { utxoLogicHelperContract, mockSimpleBitcoinVaultStateContract, 
            mockBitcoinKitContract, testUtilsContract } = await loadFixture(deployUTXOHelperWithSupportingContracts);

            depositFee = 10000;
            await mockSimpleBitcoinVaultStateContract.setDepositFee(30000, depositFee);
            custodian1ScriptHash = await testUtilsContract.calculateScriptHash(custodianScript1);

            // Test transaction where EVM address is encoded as hex representing lower-case hex
            await mockBitcoinKitContract.setTransactionByTxId(txid3, depositBtcTxToCustodian1ForEVMAddressAsciiLC1_5);
            [success, netDepositSats, depositFeeSats, depositor] = 
            await utxoLogicHelperContract.checkDepositConfirmationValidity(
                txid3,
                1,
                await mockBitcoinKitContract.getAddress(),
                custodian1ScriptHash,
                await mockSimpleBitcoinVaultStateContract.getAddress(),
                30000
            );

            expect(success).to.equal(true);
            expect(netDepositSats).to.equal(30000 - depositFee);
            expect(depositFeeSats).to.equal(depositFee);
            expect(depositor.toLowerCase()).to.equal("0x" + evmDepositorAddress1);
        });

        it("Should accept 2-input 2-output deposit with deposit in output 0 and address mixed-case hex in output 1", async function () {
            const { utxoLogicHelperContract, mockSimpleBitcoinVaultStateContract, 
            mockBitcoinKitContract, testUtilsContract } = await loadFixture(deployUTXOHelperWithSupportingContracts);

            depositFee = 10000;
            await mockSimpleBitcoinVaultStateContract.setDepositFee(30000, depositFee);
            custodian1ScriptHash = await testUtilsContract.calculateScriptHash(custodianScript1);

            // Test transaction where EVM address is encoded as hex representing mixed-case hex
            await mockBitcoinKitContract.setTransactionByTxId(txid2, depositBtcTxToCustodian1ForEVMAddressAsciiMC1_5);
            [success, netDepositSats, depositFeeSats, depositor] = 
            await utxoLogicHelperContract.checkDepositConfirmationValidity(
                txid2,
                0,
                await mockBitcoinKitContract.getAddress(),
                custodian1ScriptHash,
                await mockSimpleBitcoinVaultStateContract.getAddress(),
                30000
            );

            expect(success).to.equal(true);
            expect(netDepositSats).to.equal(30000 - depositFee);
            expect(depositFeeSats).to.equal(depositFee);
            expect(depositor.toLowerCase()).to.equal("0x" + evmDepositorAddress1);
        });

        it("Should accept 4-input 7-output deposit with deposit in output 3 and address bytes in output 5", async function () {
            const { utxoLogicHelperContract, mockSimpleBitcoinVaultStateContract, 
            mockBitcoinKitContract, testUtilsContract } = await loadFixture(deployUTXOHelperWithSupportingContracts);

            depositFee = 20000;
            await mockSimpleBitcoinVaultStateContract.setDepositFee(30000, depositFee);
            custodian1ScriptHash = await testUtilsContract.calculateScriptHash(custodianScript1);

            // Test transaction where EVM address is encoded as bytes
            await mockBitcoinKitContract.setTransactionByTxId(txid2, depositBtcTxToCustodian1ForEVMAddress1_6);
            [success, netDepositSats, depositFeeSats, depositor] = 
            await utxoLogicHelperContract.checkDepositConfirmationValidity(
                txid2,
                3,
                await mockBitcoinKitContract.getAddress(),
                custodian1ScriptHash,
                await mockSimpleBitcoinVaultStateContract.getAddress(),
                30000
            );

            expect(success).to.equal(true);
            expect(netDepositSats).to.equal(30000 - depositFee);
            expect(depositFeeSats).to.equal(depositFee);
            expect(depositor.toLowerCase()).to.equal("0x" + evmDepositorAddress1);
        });

        it("Should accept 4-input 7-output deposit with address bytes in output 3 and deposit in output 5", async function () {
            const { utxoLogicHelperContract, mockSimpleBitcoinVaultStateContract, 
            mockBitcoinKitContract, testUtilsContract } = await loadFixture(deployUTXOHelperWithSupportingContracts);

            depositFee = 25000;
            await mockSimpleBitcoinVaultStateContract.setDepositFee(30000, depositFee);
            custodian1ScriptHash = await testUtilsContract.calculateScriptHash(custodianScript1);

            // Test transaction where EVM address is encoded as bytes
            await mockBitcoinKitContract.setTransactionByTxId(txid2, depositBtcTxToCustodian1ForEVMAddress1_7);
            [success, netDepositSats, depositFeeSats, depositor] = 
            await utxoLogicHelperContract.checkDepositConfirmationValidity(
                txid2,
                5,
                await mockBitcoinKitContract.getAddress(),
                custodian1ScriptHash,
                await mockSimpleBitcoinVaultStateContract.getAddress(),
                30000
            );

            expect(success).to.equal(true);
            expect(netDepositSats).to.equal(30000 - depositFee);
            expect(depositFeeSats).to.equal(depositFee);
            expect(depositor.toLowerCase()).to.equal("0x" + evmDepositorAddress1);
        });

        it("Should accept 9-input 8-output deposit with address bytes in output 6 and deposit in output 7", async function () {
            const { utxoLogicHelperContract, mockSimpleBitcoinVaultStateContract, 
            mockBitcoinKitContract, testUtilsContract } = await loadFixture(deployUTXOHelperWithSupportingContracts);

            depositFee = 25000;
            await mockSimpleBitcoinVaultStateContract.setDepositFee(30000, depositFee);
            custodian1ScriptHash = await testUtilsContract.calculateScriptHash(custodianScript1);

            // Test transaction where EVM address is encoded as bytes
            await mockBitcoinKitContract.setTransactionByTxId(txid2, depositBtcTxToCustodian1ForEVMAddress1_8);
            [success, netDepositSats, depositFeeSats, depositor] = 
            await utxoLogicHelperContract.checkDepositConfirmationValidity(
                txid2,
                7,
                await mockBitcoinKitContract.getAddress(),
                custodian1ScriptHash,
                await mockSimpleBitcoinVaultStateContract.getAddress(),
                30000
            );

            expect(success).to.equal(true);
            expect(netDepositSats).to.equal(30000 - depositFee);
            expect(depositFeeSats).to.equal(depositFee);
            expect(depositor.toLowerCase()).to.equal("0x" + evmDepositorAddress1);
        });

        it("Should accept 9-input 8-output deposit with deposit in output 6 and address bytes in output 7", async function () {
            const { utxoLogicHelperContract, mockSimpleBitcoinVaultStateContract, 
            mockBitcoinKitContract, testUtilsContract } = await loadFixture(deployUTXOHelperWithSupportingContracts);

            depositFee = 22000;
            await mockSimpleBitcoinVaultStateContract.setDepositFee(30000, depositFee);
            custodian1ScriptHash = await testUtilsContract.calculateScriptHash(custodianScript1);

            // Test transaction where EVM address is encoded as bytes
            await mockBitcoinKitContract.setTransactionByTxId(txid2, depositBtcTxToCustodian1ForEVMAddress1_9);
            [success, netDepositSats, depositFeeSats, depositor] = 
            await utxoLogicHelperContract.checkDepositConfirmationValidity(
                txid2,
                6,
                await mockBitcoinKitContract.getAddress(),
                custodian1ScriptHash,
                await mockSimpleBitcoinVaultStateContract.getAddress(),
                30000
            );

            expect(success).to.equal(true);
            expect(netDepositSats).to.equal(30000 - depositFee);
            expect(depositFeeSats).to.equal(depositFee);
            expect(depositor.toLowerCase()).to.equal("0x" + evmDepositorAddress1);
        });


        it("Should accept 9-input 10-output deposit where only 8 outputs are given with deposit in output 6 and address bytes in output 7", async function () {
            const { utxoLogicHelperContract, mockSimpleBitcoinVaultStateContract, 
            mockBitcoinKitContract, testUtilsContract } = await loadFixture(deployUTXOHelperWithSupportingContracts);

            depositFee = 22000;
            await mockSimpleBitcoinVaultStateContract.setDepositFee(30000, depositFee);
            custodian1ScriptHash = await testUtilsContract.calculateScriptHash(custodianScript1);

            // Test transaction where EVM address is encoded as bytes
            await mockBitcoinKitContract.setTransactionByTxId(txid2, depositBtcTxToCustodian1ForEVMAddress1_10);
            [success, netDepositSats, depositFeeSats, depositor] = 
            await utxoLogicHelperContract.checkDepositConfirmationValidity(
                txid2,
                6,
                await mockBitcoinKitContract.getAddress(),
                custodian1ScriptHash,
                await mockSimpleBitcoinVaultStateContract.getAddress(),
                30000
            );

            expect(success).to.equal(true);
            expect(netDepositSats).to.equal(30000 - depositFee);
            expect(depositFeeSats).to.equal(depositFee);
            expect(depositor.toLowerCase()).to.equal("0x" + evmDepositorAddress1);
        });
      });

      describe("Check Withdrawal Finalization Validity", function () {
        it("Should reject withdrawal fulfillment for btc tx that is not available in hVM yet", async function () {
            const { utxoLogicHelperContract, mockSimpleBitcoinVaultStateContract, 
              mockBitcoinKitContract, deployer, notOwner1, notOwner2 } = await loadFixture(deployUTXOHelperWithSupportingContracts);
    
            await expect(utxoLogicHelperContract.checkWithdrawalFinalizationValidity(
              txid1,
              0,
              await mockBitcoinKitContract.getAddress(),
              emptyHash, // custody script hash is empty
              emptyHash, // current sweep UTXO is empty
              0, // current sweep output is 0
              await mockSimpleBitcoinVaultStateContract.getAddress()
            )).to.be.revertedWith("withdrawal transaction must only have one input"); // return transaction will be all zeros so will fail as it has 0 inputs
          });

        it("Should reject withdrawal fulfillment for btc tx that has more than one input", async function () {
        const { utxoLogicHelperContract, mockSimpleBitcoinVaultStateContract, 
            mockBitcoinKitContract, deployer, notOwner1, notOwner2 } = await loadFixture(deployUTXOHelperWithSupportingContracts);

            // Use some transactions that have more than one input from our deposit tests
            await mockBitcoinKitContract.setTransactionByTxId(txid1, depositBtcTxToCustodian1ForEVMAddressAsciiMC1_5);
            await mockBitcoinKitContract.setTransactionByTxId(txid2, depositBtcTxToCustodian1ForEVMAddress1_9);
            await mockBitcoinKitContract.setTransactionByTxId(txid3, depositBtcTxToCustodian1ForEVMAddress1_5);

            await expect(utxoLogicHelperContract.checkWithdrawalFinalizationValidity(
                txid1,
                0,
                await mockBitcoinKitContract.getAddress(),
                emptyHash, // custody script hash is empty
                sweepUTXO1, // set a real sweep UTXO
                sweepUTXO1Output,
                await mockSimpleBitcoinVaultStateContract.getAddress()
            )).to.be.revertedWith("withdrawal transaction must only have one input");


            await expect(utxoLogicHelperContract.checkWithdrawalFinalizationValidity(
                txid2,
                0,
                await mockBitcoinKitContract.getAddress(),
                emptyHash, // custody script hash is empty
                sweepUTXO1, // set a real sweep UTXO
                sweepUTXO1Output,
                await mockSimpleBitcoinVaultStateContract.getAddress()
            )).to.be.revertedWith("withdrawal transaction must only have one input");


            await expect(utxoLogicHelperContract.checkWithdrawalFinalizationValidity(
                txid3,
                0,
                await mockBitcoinKitContract.getAddress(),
                emptyHash, // custody script hash is empty
                sweepUTXO1, // set a real sweep UTXO
                sweepUTXO1Output,
                await mockSimpleBitcoinVaultStateContract.getAddress()
            )).to.be.revertedWith("withdrawal transaction must only have one input");
        });

        it("Should reject withdrawal fulfillment for btc tx that does not spend current sweep utxo", async function () {
        const { utxoLogicHelperContract, mockSimpleBitcoinVaultStateContract, 
            mockBitcoinKitContract, deployer, notOwner1, notOwner2 } = await loadFixture(deployUTXOHelperWithSupportingContracts);

            await mockBitcoinKitContract.setTransactionByTxId(txid2, withdrawTransactionSpendingInvalidSweep_1);

            await expect(utxoLogicHelperContract.checkWithdrawalFinalizationValidity(
                txid2,
                0,
                await mockBitcoinKitContract.getAddress(),
                emptyHash, // custody script hash is empty
                sweepUTXO1, // set a real sweep UTXO
                sweepUTXO1Output,
                await mockSimpleBitcoinVaultStateContract.getAddress()
            )).to.be.revertedWith("withdrawal transaction must consume the current sweep utxo");
        });

        // Not something that's allowed by the Bitcoin protocol, but mind as well check anyway as it should not be allowed
        it("Should reject withdrawal fulfillment for btc tx that has no outputs", async function () {
            const { utxoLogicHelperContract, mockSimpleBitcoinVaultStateContract, 
            mockBitcoinKitContract, deployer, notOwner1, notOwner2 } = await loadFixture(deployUTXOHelperWithSupportingContracts);

            await mockBitcoinKitContract.setTransactionByTxId(txid3, withdrawTransactionNoOutputs_1);

            await expect(utxoLogicHelperContract.checkWithdrawalFinalizationValidity(
                txid3,
                0,
                await mockBitcoinKitContract.getAddress(),
                emptyHash, // custody script hash is empty
                sweepUTXO1, // set a real sweep UTXO
                sweepUTXO1Output,
                await mockSimpleBitcoinVaultStateContract.getAddress()
            )).to.be.revertedWith("withdrawal transaction must have at least two outputs and no more than three");
        });

        it("Should reject withdrawal fulfillment for btc tx that has more than three outputs", async function () {
            const { utxoLogicHelperContract, mockSimpleBitcoinVaultStateContract, 
            mockBitcoinKitContract, deployer, notOwner1, notOwner2 } = await loadFixture(deployUTXOHelperWithSupportingContracts);

            await mockBitcoinKitContract.setTransactionByTxId(txid1, withdrawTransactionTooManyOutputs_1);
            await mockBitcoinKitContract.setTransactionByTxId(txid2, withdrawTransactionTooManyOutputs_2);
            await mockBitcoinKitContract.setTransactionByTxId(txid3, withdrawTransactionTooManyOutputs_3);

            await expect(utxoLogicHelperContract.checkWithdrawalFinalizationValidity(
                txid1,
                0,
                await mockBitcoinKitContract.getAddress(),
                emptyHash, // custody script hash is empty
                sweepUTXO1, // set a real sweep UTXO
                sweepUTXO1Output,
                await mockSimpleBitcoinVaultStateContract.getAddress()
            )).to.be.revertedWith("withdrawal transaction must have at least two outputs and no more than three");

            await expect(utxoLogicHelperContract.checkWithdrawalFinalizationValidity(
                txid2,
                0,
                await mockBitcoinKitContract.getAddress(),
                emptyHash, // custody script hash is empty
                sweepUTXO1, // set a real sweep UTXO
                sweepUTXO1Output,
                await mockSimpleBitcoinVaultStateContract.getAddress()
            )).to.be.revertedWith("withdrawal transaction must have at least two outputs and no more than three");

            await expect(utxoLogicHelperContract.checkWithdrawalFinalizationValidity(
                txid3,
                0,
                await mockBitcoinKitContract.getAddress(),
                emptyHash, // custody script hash is empty
                sweepUTXO1, // set a real sweep UTXO
                sweepUTXO1Output,
                await mockSimpleBitcoinVaultStateContract.getAddress()
            )).to.be.revertedWith("withdrawal transaction must have at least two outputs and no more than three");
        });

        it("Should reject withdrawal fulfillment for withdrawal that does not exist", async function () {
            const { utxoLogicHelperContract, mockSimpleBitcoinVaultStateContract, 
            mockBitcoinKitContract, deployer, notOwner1, notOwner2 } = await loadFixture(deployUTXOHelperWithSupportingContracts);

            await mockBitcoinKitContract.setTransactionByTxId(txid1, withdrawTransactionWithOutputToUser1NoChange_1);
            await mockBitcoinKitContract.setTransactionByTxId(txid2, withdrawTransactionWithOutputToUser1WithSweepChange_1);

            await expect(utxoLogicHelperContract.checkWithdrawalFinalizationValidity(
                txid1,
                0, // We haven't set any withdrawals in the vault state child yet
                await mockBitcoinKitContract.getAddress(),
                emptyHash, // custody script hash is empty
                sweepUTXO1, // set a real sweep UTXO
                sweepUTXO1Output,
                await mockSimpleBitcoinVaultStateContract.getAddress()
            )).to.be.revertedWith("withdrawal does not exist");

            await expect(utxoLogicHelperContract.checkWithdrawalFinalizationValidity(
                txid2,
                0, // We haven't set any withdrawals in the vault state child yet
                await mockBitcoinKitContract.getAddress(),
                emptyHash, // custody script hash is empty
                sweepUTXO1, // set a real sweep UTXO
                sweepUTXO1Output,
                await mockSimpleBitcoinVaultStateContract.getAddress()
            )).to.be.revertedWith("withdrawal does not exist");
        });

        it("Should reject withdrawal fulfillment for btc tx that does not send to the correct withdrawal script in output 0", async function () {
            const { utxoLogicHelperContract, mockSimpleBitcoinVaultStateContract, 
            mockBitcoinKitContract, deployer, notOwner1, notOwner2 } = await loadFixture(deployUTXOHelperWithSupportingContracts);

            await mockBitcoinKitContract.setTransactionByTxId(txid1, withdrawTransactionWithOutputToUser1NoChange_1);
            await mockBitcoinKitContract.setTransactionByTxId(txid2, withdrawTransactionWithOutputToUser1NoChange_1);

            // This one sends to the correct user but in the wrong output, which should also fail because the correct script
            // is not detected in output 0
            await mockBitcoinKitContract.setTransactionByTxId(txid3, withdrawTransactionWithOutputToUser2WithSweepChangeWrongOrder_1);
            

            // Set the withdrawal to go to user 2, but the transactions we are using withdraws to user 1's script instead
            await mockSimpleBitcoinVaultStateContract.setWithdrawal(0, withdrawalToUser2_1);

            await expect(utxoLogicHelperContract.checkWithdrawalFinalizationValidity(
                txid1,
                0,
                await mockBitcoinKitContract.getAddress(),
                emptyHash, // custody script hash is empty
                sweepUTXO1, // set a real sweep UTXO
                sweepUTXO1Output,
                await mockSimpleBitcoinVaultStateContract.getAddress()
            )).to.be.revertedWith("script of first output of withdrawal tx must match script of requested withdrawal");

            await expect(utxoLogicHelperContract.checkWithdrawalFinalizationValidity(
                txid2,
                0,
                await mockBitcoinKitContract.getAddress(),
                emptyHash, // custody script hash is empty
                sweepUTXO1, // set a real sweep UTXO
                sweepUTXO1Output,
                await mockSimpleBitcoinVaultStateContract.getAddress()
            )).to.be.revertedWith("script of first output of withdrawal tx must match script of requested withdrawal");


            await expect(utxoLogicHelperContract.checkWithdrawalFinalizationValidity(
                txid3,
                0,
                await mockBitcoinKitContract.getAddress(),
                emptyHash, // custody script hash is empty
                sweepUTXO1, // set a real sweep UTXO
                sweepUTXO1Output,
                await mockSimpleBitcoinVaultStateContract.getAddress()
            )).to.be.revertedWith("script of first output of withdrawal tx must match script of requested withdrawal");
        });

        it("Should reject withdrawal fulfillment for btc tx that does not send the correct amount", async function () {
            const { utxoLogicHelperContract, mockSimpleBitcoinVaultStateContract, 
            mockBitcoinKitContract, deployer, notOwner1, notOwner2 } = await loadFixture(deployUTXOHelperWithSupportingContracts);

            await mockBitcoinKitContract.setTransactionByTxId(txid1, withdrawTransactionWithOutputToUser2WithSweepChange_1);
            await mockBitcoinKitContract.setTransactionByTxId(txid2, withdrawTransactionWithOutputToUser2NoChange_1);

            // Set the withdrawal to the withdrawal expecting 140000 sats (after fees), but our transaction only pays 50000 sats
            await mockSimpleBitcoinVaultStateContract.setWithdrawal(0, withdrawalToUser2_2);

            await expect(utxoLogicHelperContract.checkWithdrawalFinalizationValidity(
                txid1,
                0,
                await mockBitcoinKitContract.getAddress(),
                emptyHash, // custody script hash is empty
                sweepUTXO1, // set a real sweep UTXO
                sweepUTXO1Output,
                await mockSimpleBitcoinVaultStateContract.getAddress()
            )).to.be.revertedWith("amount of first withdrawal tx output must exactly match expected net after fees");

            await expect(utxoLogicHelperContract.checkWithdrawalFinalizationValidity(
                txid2,
                0,
                await mockBitcoinKitContract.getAddress(),
                emptyHash, // custody script hash is empty
                sweepUTXO1, // set a real sweep UTXO
                sweepUTXO1Output,
                await mockSimpleBitcoinVaultStateContract.getAddress()
            )).to.be.revertedWith("amount of first withdrawal tx output must exactly match expected net after fees");
        });

        it("Should reject withdrawal fulfillment for btc tx that outputs change to the wrong custodian", async function () {
            const { utxoLogicHelperContract, mockSimpleBitcoinVaultStateContract, 
            mockBitcoinKitContract, testUtilsContract } = await loadFixture(deployUTXOHelperWithSupportingContracts);

            // We will use the custodian 2 script hash, but have a transaction that outputs to custodian 1
            custodian2ScriptHash = await testUtilsContract.calculateScriptHash(withdrawalCustodian2Script);

            await mockBitcoinKitContract.setTransactionByTxId(txid1, withdrawTransactionWithOutputToUser2WithChangeToCustodian1_1);

            await mockSimpleBitcoinVaultStateContract.setWithdrawal(0, withdrawalToUser2_1);

            await expect(utxoLogicHelperContract.checkWithdrawalFinalizationValidity(
                txid1,
                0,
                await mockBitcoinKitContract.getAddress(),
                custodian2ScriptHash, // use custodian 2
                sweepUTXO1, // set a real sweep UTXO
                sweepUTXO1Output,
                await mockSimpleBitcoinVaultStateContract.getAddress()
            )).to.be.revertedWith("withdrawal transaction has 2nd output but it does not return change to this vault's BTC address");
        });

        it("Should accept withdrawal fulfillment for valid btc withdrawal tx with change that paid btc fees lower than withdrawal fees collected", async function () {
            const { utxoLogicHelperContract, mockSimpleBitcoinVaultStateContract, 
            mockBitcoinKitContract, testUtilsContract } = await loadFixture(deployUTXOHelperWithSupportingContracts);

            custodian1ScriptHash = await testUtilsContract.calculateScriptHash(withdrawalCustodian1Script);

            // This transaction has 200000 input, 50000 to user2, 120000 back to vault for a BTC fee of 30000
            await mockBitcoinKitContract.setTransactionByTxId(txid1, withdrawTransactionWithOutputToUser2WithChangeToCustodian1_1);

            // This withdrawal is for 80001 sats and charges 30001 in fees
            await mockSimpleBitcoinVaultStateContract.setWithdrawal(0, withdrawalToUser2_3);

            [feesOverpaid, feesCollected, withdrawalAmount, createdOutput, outputValue] = 
            await utxoLogicHelperContract.checkWithdrawalFinalizationValidity(
                txid1,
                0,
                await mockBitcoinKitContract.getAddress(),
                custodian1ScriptHash, // use the correct custodian 1
                sweepUTXO1, // set a real sweep UTXO
                sweepUTXO1Output,
                await mockSimpleBitcoinVaultStateContract.getAddress()
            );

            expect(feesOverpaid).to.equal(0);
            expect(feesCollected).to.equal(1);
            expect(withdrawalAmount).to.equal(80001);
            expect(createdOutput).to.equal(true); // There is a change sweep
            expect(outputValue).to.equal(120000);
        });

        it("Should accept withdrawal fulfillment for valid btc withdrawal tx with change that paid btc fees exactly equal to withdrawal fees collected", async function () {
            const { utxoLogicHelperContract, mockSimpleBitcoinVaultStateContract, 
            mockBitcoinKitContract, testUtilsContract } = await loadFixture(deployUTXOHelperWithSupportingContracts);

            custodian1ScriptHash = await testUtilsContract.calculateScriptHash(withdrawalCustodian1Script);

            // This transaction has 200000 input, 50000 to user2, 120000 back to vault for a BTC fee of 30000
            await mockBitcoinKitContract.setTransactionByTxId(txid1, withdrawTransactionWithOutputToUser2WithChangeToCustodian1_1);

            // This withdrawal is for 80000 sats and charges 30000 in fees
            await mockSimpleBitcoinVaultStateContract.setWithdrawal(0, withdrawalToUser2_4);

            [feesOverpaid, feesCollected, withdrawalAmount, createdOutput, outputValue] = 
            await utxoLogicHelperContract.checkWithdrawalFinalizationValidity(
                txid1,
                0,
                await mockBitcoinKitContract.getAddress(),
                custodian1ScriptHash, // use the correct custodian 1
                sweepUTXO1, // set a real sweep UTXO
                sweepUTXO1Output,
                await mockSimpleBitcoinVaultStateContract.getAddress()
            );

            expect(feesOverpaid).to.equal(0);
            expect(feesCollected).to.equal(0); // collected and paid fees are exactly the same
            expect(withdrawalAmount).to.equal(80000);
            expect(createdOutput).to.equal(true); // There is a change sweep
            expect(outputValue).to.equal(120000);
        });

        it("Should accept withdrawal fulfillment for valid btc withdrawal tx with change that paid btc fees higher than withdrawal fees collected", async function () {
            const { utxoLogicHelperContract, mockSimpleBitcoinVaultStateContract, 
            mockBitcoinKitContract, testUtilsContract } = await loadFixture(deployUTXOHelperWithSupportingContracts);

            // We will use the custodian 2 script hash, but have a transaction that outputs to custodian 1
            custodian1ScriptHash = await testUtilsContract.calculateScriptHash(withdrawalCustodian1Script);

            // This transaction has 200000 input, 50000 to user2, 120000 back to vault for a BTC fee of 30000
            await mockBitcoinKitContract.setTransactionByTxId(txid1, withdrawTransactionWithOutputToUser2WithChangeToCustodian1_1);

            // This withdrawal is for 60000 sats and charges 10000 in fees
            await mockSimpleBitcoinVaultStateContract.setWithdrawal(0, withdrawalToUser2_1);

            [feesOverpaid, feesCollected, withdrawalAmount, createdOutput, outputValue] = 
            await utxoLogicHelperContract.checkWithdrawalFinalizationValidity(
                txid1,
                0,
                await mockBitcoinKitContract.getAddress(),
                custodian1ScriptHash, // use the correct custodian 1
                sweepUTXO1, // set a real sweep UTXO
                sweepUTXO1Output,
                await mockSimpleBitcoinVaultStateContract.getAddress()
            );

            expect(feesOverpaid).to.equal(20000); // collected 10000 fees but paid 30000 on Bitcoin
            expect(feesCollected).to.equal(0);
            expect(withdrawalAmount).to.equal(60000);
            expect(createdOutput).to.equal(true); // There is a change sweep
            expect(outputValue).to.equal(120000);
        });

        it("Should accept withdrawal fulfillment for valid btc withdrawal tx without change that paid btc fees lower than withdrawal fees collected", async function () {
            const { utxoLogicHelperContract, mockSimpleBitcoinVaultStateContract, 
            mockBitcoinKitContract, testUtilsContract } = await loadFixture(deployUTXOHelperWithSupportingContracts);

            // A withdrawal where the fees charged plus output amount is more than the total sweep is
            // a realistic test, because it's possible that the vault custodies more BTC than the sweep
            // represents because the operator has not performed a sweep yet.
            // For example, the sweep in this test has 200000 sats, and the user withdraws 220000 sats
            // and pays a 40000 sat fee, meaning if the operator can fulfill the withdrawal by paying
            // a 20000 sat fee on Bitcoin and get the transaction processed, then they can do so and
            // not return any sweep. The user could have 220000 sats because they just deposited 220000
            // net sats in a deposit transaction which has not yet been swept.

            // We will use the custodian 2 script hash, but have a transaction that outputs to custodian 1
            custodian1ScriptHash = await testUtilsContract.calculateScriptHash(withdrawalCustodian1Script);

            // This transaction has 200000 input and sends 180000 to user1, paying 20000 in fees on Bitcoin
            await mockBitcoinKitContract.setTransactionByTxId(txid1, withdrawTransactionWithOutputToUser1NoChange_2);

            // This withdrawal is for 220000 sats and charges 40000 in fees
            await mockSimpleBitcoinVaultStateContract.setWithdrawal(4041265344, withdrawalToUser1_1);

            [feesOverpaid, feesCollected, withdrawalAmount, createdOutput, outputValue] = 
            await utxoLogicHelperContract.checkWithdrawalFinalizationValidity(
                txid1,
                4041265344, // We don't need to set lower withdrawal indexes because we are just mocking.
                await mockBitcoinKitContract.getAddress(),
                custodian1ScriptHash, // use the correct custodian 1
                sweepUTXO1, // set a real sweep UTXO
                sweepUTXO1Output,
                await mockSimpleBitcoinVaultStateContract.getAddress()
            );

            expect(feesOverpaid).to.equal(0);
            expect(feesCollected).to.equal(20000); // collected 40000 fees and paid 20000 on Bitcoin
            expect(withdrawalAmount).to.equal(220000);
            expect(createdOutput).to.equal(false); // There is no change sweep
            expect(outputValue).to.equal(0);
        });

        it("Should accept withdrawal fulfillment for valid btc withdrawal tx without change that paid btc fees exactly equal to withdrawal fees collected", async function () {
            const { utxoLogicHelperContract, mockSimpleBitcoinVaultStateContract, 
            mockBitcoinKitContract, testUtilsContract } = await loadFixture(deployUTXOHelperWithSupportingContracts);

            // We will use the custodian 2 script hash, but have a transaction that outputs to custodian 1
            custodian1ScriptHash = await testUtilsContract.calculateScriptHash(withdrawalCustodian1Script);

            // This transaction has 200000 input and sends 180000 to user1, paying 20000 in fees on Bitcoin
            await mockBitcoinKitContract.setTransactionByTxId(txid1, withdrawTransactionWithOutputToUser1NoChange_2);

            // This withdrawal is for 200000 sats and charges 20000 in fees
            await mockSimpleBitcoinVaultStateContract.setWithdrawal(4041265344, withdrawalToUser1_2);

            [feesOverpaid, feesCollected, withdrawalAmount, createdOutput, outputValue] = 
            await utxoLogicHelperContract.checkWithdrawalFinalizationValidity(
                txid1,
                4041265344, // Using withdrawal seven in this example, we don't need to set [0,6] because we are just mocking.
                await mockBitcoinKitContract.getAddress(),
                custodian1ScriptHash, // use the correct custodian 1
                sweepUTXO1, // set a real sweep UTXO
                sweepUTXO1Output,
                await mockSimpleBitcoinVaultStateContract.getAddress()
            );

            expect(feesOverpaid).to.equal(0);
            expect(feesCollected).to.equal(0); // collected and paid fees are exactly the same
            expect(withdrawalAmount).to.equal(200000);
            expect(createdOutput).to.equal(false); // There is no change sweep
            expect(outputValue).to.equal(0);
        });

        it("Should accept withdrawal fulfillment for valid btc withdrawal tx without change that paid btc fees higher than withdrawal fees collected", async function () {
            const { utxoLogicHelperContract, mockSimpleBitcoinVaultStateContract, 
            mockBitcoinKitContract, testUtilsContract } = await loadFixture(deployUTXOHelperWithSupportingContracts);

            // We will use the custodian 2 script hash, but have a transaction that outputs to custodian 1
            custodian1ScriptHash = await testUtilsContract.calculateScriptHash(withdrawalCustodian1Script);

            // This transaction has 200000 input and sends 180000 to user1, paying 20000 in fees on Bitcoin
            await mockBitcoinKitContract.setTransactionByTxId(txid1, withdrawTransactionWithOutputToUser1NoChange_2);

            // This withdrawal is for 195000 sats and charges 15000 in fees
            await mockSimpleBitcoinVaultStateContract.setWithdrawal(4041265344, withdrawalToUser1_3);

            [feesOverpaid, feesCollected, withdrawalAmount, createdOutput, outputValue] = 
            await utxoLogicHelperContract.checkWithdrawalFinalizationValidity(
                txid1,
                4041265344, // Using withdrawal seven in this example, we don't need to set [0,7] because we are just mocking.
                await mockBitcoinKitContract.getAddress(),
                custodian1ScriptHash, // use the correct custodian 1
                sweepUTXO1, // set a real sweep UTXO
                sweepUTXO1Output,
                await mockSimpleBitcoinVaultStateContract.getAddress()
            );

            expect(feesOverpaid).to.equal(5000);
            expect(feesCollected).to.equal(0);
            expect(withdrawalAmount).to.equal(195000);
            expect(createdOutput).to.equal(false); // There is no change sweep
            expect(outputValue).to.equal(0);
        });
      });

      describe("Check Sweep Validity", function () {
        it("Should reject empty sweep txid", async function () {
            const { utxoLogicHelperContract, mockSimpleBitcoinVaultStateContract, 
                mockBitcoinKitContract, testUtilsContract } = await loadFixture(deployUTXOHelperWithSupportingContracts);

            await expect(utxoLogicHelperContract.checkSweepValidity(
                emptyHash,
                mockBitcoinKitContract.getAddress(),
                emptyHash,
                emptyHash,
                0,
                mockSimpleBitcoinVaultStateContract.getAddress()
                )).to.be.revertedWith("sweep txid cannot be zero");
        });

        it("Should reject missing sweep transaction", async function () {
            const { utxoLogicHelperContract, mockSimpleBitcoinVaultStateContract, 
                mockBitcoinKitContract, testUtilsContract } = await loadFixture(deployUTXOHelperWithSupportingContracts);

            await expect(utxoLogicHelperContract.checkSweepValidity(
                txid1,
                mockBitcoinKitContract.getAddress(),
                emptyHash,
                emptyHash,
                0,
                mockSimpleBitcoinVaultStateContract.getAddress()
                )).to.be.revertedWith("sweep transaction is not known by hVM");
        });

        it("Should reject sweep transaction with one input", async function () {
            const { utxoLogicHelperContract, mockSimpleBitcoinVaultStateContract, 
                mockBitcoinKitContract, testUtilsContract } = await loadFixture(deployUTXOHelperWithSupportingContracts);

            await mockBitcoinKitContract.setTransactionByTxId(txid1, invalidSweepTransactionWith1Input);

            await expect(utxoLogicHelperContract.checkSweepValidity(
                txid1,
                mockBitcoinKitContract.getAddress(),
                emptyHash,
                emptyHash,
                0,
                mockSimpleBitcoinVaultStateContract.getAddress()
                )).to.be.revertedWith("a sweep transaction must have at least two inputs and no more than eight");
        });

        it("Should reject sweep transaction with more than 8 inputs", async function () {
            const { utxoLogicHelperContract, mockSimpleBitcoinVaultStateContract, 
                mockBitcoinKitContract, testUtilsContract } = await loadFixture(deployUTXOHelperWithSupportingContracts);

            await mockBitcoinKitContract.setTransactionByTxId(txid1, invalidSweepTransactionWith9Inputs);

            await expect(utxoLogicHelperContract.checkSweepValidity(
                txid1,
                mockBitcoinKitContract.getAddress(),
                emptyHash,
                emptyHash,
                0,
                mockSimpleBitcoinVaultStateContract.getAddress()
                )).to.be.revertedWith("a sweep transaction must have at least two inputs and no more than eight");
        });

        it("Should reject sweep transaction with more than 1 output", async function () {
            const { utxoLogicHelperContract, mockSimpleBitcoinVaultStateContract, 
                mockBitcoinKitContract, testUtilsContract } = await loadFixture(deployUTXOHelperWithSupportingContracts);

            await mockBitcoinKitContract.setTransactionByTxId(txid1, invalidSweepTransactionWith1Output);

            await expect(utxoLogicHelperContract.checkSweepValidity(
                txid1,
                mockBitcoinKitContract.getAddress(),
                emptyHash,
                emptyHash,
                0,
                mockSimpleBitcoinVaultStateContract.getAddress()
                )).to.be.revertedWith("a sweep transaction must have a single output");
        });

        it("Should reject sweep transaction that doesn't match current sweep utxo", async function () {
            const { utxoLogicHelperContract, mockSimpleBitcoinVaultStateContract, 
                mockBitcoinKitContract, testUtilsContract } = await loadFixture(deployUTXOHelperWithSupportingContracts);

            await mockBitcoinKitContract.setTransactionByTxId(txid1, validSweep1);

            await expect(utxoLogicHelperContract.checkSweepValidity(
                txid1,
                mockBitcoinKitContract.getAddress(),
                emptyHash,
                sweepUTXO2, // Does not match validSweep1's spend of sweepUTXO1
                0,
                mockSimpleBitcoinVaultStateContract.getAddress()
                )).to.be.revertedWith("first input of sweep must consume old sweep UTXO");
        });

        it("Should reject sweep with output to script that does not match custodian", async function () {
            const { utxoLogicHelperContract, mockSimpleBitcoinVaultStateContract, 
                mockBitcoinKitContract, testUtilsContract } = await loadFixture(deployUTXOHelperWithSupportingContracts);

            await mockBitcoinKitContract.setTransactionByTxId(txid1, validSweep1);

            await expect(utxoLogicHelperContract.checkSweepValidity(
                txid1,
                mockBitcoinKitContract.getAddress(),
                emptyHash,
                sweepUTXO1,
                0,
                mockSimpleBitcoinVaultStateContract.getAddress()
                )).to.be.revertedWith("sweep transaction must output funds to this vault's BTC custodianship address");
        });

        it("Should reject sweep with sweep input that is not an acknowledged deposit", async function () {
            const { utxoLogicHelperContract, mockSimpleBitcoinVaultStateContract, 
                mockBitcoinKitContract, testUtilsContract } = await loadFixture(deployUTXOHelperWithSupportingContracts);

            await mockBitcoinKitContract.setTransactionByTxId(txid1, validSweep1);

            // Did not set collectable fee for the sweep input of validSweep1

            await expect(utxoLogicHelperContract.checkSweepValidity(
                txid1,
                mockBitcoinKitContract.getAddress(),
                await testUtilsContract.calculateScriptHash(custodianScript1),
                sweepUTXO1,
                0,
                mockSimpleBitcoinVaultStateContract.getAddress()
                )).to.be.revertedWith("deposit fee must be greater than zero, either not acknowledged or already swept");
        });


        it("Should reject sweep with sweep input that does not match acknowledged deposit output index", async function () {
            const { utxoLogicHelperContract, mockSimpleBitcoinVaultStateContract, 
                mockBitcoinKitContract, testUtilsContract } = await loadFixture(deployUTXOHelperWithSupportingContracts);

            await mockBitcoinKitContract.setTransactionByTxId(txid1, validSweep1);

            await mockSimpleBitcoinVaultStateContract.setCollectableFees(validSweep1.inputs[1].inputTxId, 5000);

            await mockSimpleBitcoinVaultStateContract.setDepositOutputIndex(validSweep1.inputs[1].inputTxId, validSweep1.inputs[1].sourceIndex + 1);

            await expect(utxoLogicHelperContract.checkSweepValidity(
                txid1,
                mockBitcoinKitContract.getAddress(),
                await testUtilsContract.calculateScriptHash(custodianScript1),
                sweepUTXO1,
                validSweep1.inputs[0].sourceIndex, // 0
                mockSimpleBitcoinVaultStateContract.getAddress()
                )).to.be.revertedWith("sweep must spend the input using an input index that matches the output index of the confirmed deposit");
        });

        it("Should calculate return values correctly with 1 input where all collectable fees are spent on btc tx fee", async function () {
            const { utxoLogicHelperContract, mockSimpleBitcoinVaultStateContract, 
                mockBitcoinKitContract, testUtilsContract } = await loadFixture(deployUTXOHelperWithSupportingContracts);

            await mockBitcoinKitContract.setTransactionByTxId(txid1, validSweep1);

            await mockSimpleBitcoinVaultStateContract.setCollectableFees(validSweep1.inputs[1].inputTxId, 5000);

            await mockSimpleBitcoinVaultStateContract.setDepositOutputIndex(validSweep1.inputs[1].inputTxId, validSweep1.inputs[1].sourceIndex);

            // Old sweep UTXO had 50000 sat
            // Swept deposit had 40000 sat
            // Set 5000 sat in fees to collect from swept deposit
            // Output has 85000 sat (so the 5000 in collectable fees are all spent on the btc tx fee: 50K + 40K = 5K)
            // Therefore, swept value should be 35000, as that was the amount output minus the original sweep utxo
            // Net deposit value should also be 35000 as that is the amount collected from swept inputs after collectable fees
            // The new sweep output value should be 85000 as that's the actual on-chain size of the new sweep output
            // The swept dpeosits returned should only contain the swept deposit (input at index 1)

            [sweptValue, netDepositValue, newSweepOutputValue, sweptDeposits] = 
            await utxoLogicHelperContract.checkSweepValidity(
                txid1,
                mockBitcoinKitContract.getAddress(),
                await testUtilsContract.calculateScriptHash(custodianScript1),
                sweepUTXO1,
                validSweep1.inputs[0].sourceIndex, // 0
                mockSimpleBitcoinVaultStateContract.getAddress()
            );

            expect(sweptValue).to.equal(35000);
            expect(netDepositValue).to.equal(35000);
            expect(newSweepOutputValue).to.equal(85000);
            expect(sweptDeposits[0]).to.equal(validSweep1.inputs[1].inputTxId);
        });

        it("Should calculate return values correctly with 1 input where operator collects nonzero fees", async function () {
            const { utxoLogicHelperContract, mockSimpleBitcoinVaultStateContract, 
                mockBitcoinKitContract, testUtilsContract } = await loadFixture(deployUTXOHelperWithSupportingContracts);

            await mockBitcoinKitContract.setTransactionByTxId(txid1, validSweep2);

            await mockSimpleBitcoinVaultStateContract.setCollectableFees(validSweep2.inputs[1].inputTxId, 5000);

            await mockSimpleBitcoinVaultStateContract.setDepositOutputIndex(validSweep2.inputs[1].inputTxId, validSweep2.inputs[1].sourceIndex);

            // Old sweep UTXO had 50000 sat
            // Swept deposit had 40000 sat
            // Set 5000 sat in fees to collect from swept deposit
            // Output has 88000 sat (so 2k of 5k fees are spent on bitcoin, 3k go to operator)
            // Therefore, swept value should be 38000, as that was the amount output minus the original sweep utxo
            // Net deposit value should be 35000 as that is the amount collected from swept inputs after collectable fees
            // The new sweep output value should be 88000 as that's the actual on-chain size of the new sweep output
            // The swept dpeosits returned should only contain the swept deposit (input at index 1)

            [sweptValue, netDepositValue, newSweepOutputValue, sweptDeposits] = 
            await utxoLogicHelperContract.checkSweepValidity(
                txid1,
                mockBitcoinKitContract.getAddress(),
                await testUtilsContract.calculateScriptHash(custodianScript1),
                sweepUTXO1,
                validSweep2.inputs[0].sourceIndex, // 0
                mockSimpleBitcoinVaultStateContract.getAddress()
            );

            expect(sweptValue).to.equal(38000);
            expect(netDepositValue).to.equal(35000);
            expect(newSweepOutputValue).to.equal(88000);
            expect(sweptDeposits[0]).to.equal(validSweep2.inputs[1].inputTxId);
        });

        it("Should calculate return values correctly with 1 input where more fees paid on btc fees than collected", async function () {
            const { utxoLogicHelperContract, mockSimpleBitcoinVaultStateContract, 
                mockBitcoinKitContract, testUtilsContract } = await loadFixture(deployUTXOHelperWithSupportingContracts);

            await mockBitcoinKitContract.setTransactionByTxId(txid1, validSweep3);

            await mockSimpleBitcoinVaultStateContract.setCollectableFees(validSweep3.inputs[1].inputTxId, 5000);

            await mockSimpleBitcoinVaultStateContract.setDepositOutputIndex(validSweep3.inputs[1].inputTxId, validSweep3.inputs[1].sourceIndex);

            // Old sweep UTXO had 50000 sat
            // Swept deposit had 40000 sat
            // Set 5000 sat in fees to collect from swept deposit
            // Output has 82000 sat (so all 5k collectable fees are spent on bitcoin, and another 3k above allowed was spent)
            // Therefore, swept value should be 32000, as that was the amount output minus the original sweep utxo
            // Net deposit value should be 35000 as that is the amount collected from swept inputs after collectable fees
            // The new sweep output value should be 82000 as that's the actual on-chain size of the new sweep output
            // The swept dpeosits returned should only contain the swept deposit (input at index 1)

            [sweptValue, netDepositValue, newSweepOutputValue, sweptDeposits] = 
            await utxoLogicHelperContract.checkSweepValidity(
                txid1,
                mockBitcoinKitContract.getAddress(),
                await testUtilsContract.calculateScriptHash(custodianScript1),
                sweepUTXO1,
                validSweep3.inputs[0].sourceIndex, // 0
                mockSimpleBitcoinVaultStateContract.getAddress()
            );

            expect(sweptValue).to.equal(32000);
            expect(netDepositValue).to.equal(35000);
            expect(newSweepOutputValue).to.equal(82000);
            expect(sweptDeposits[0]).to.equal(validSweep3.inputs[1].inputTxId);
        });

        it("Should calculate return values correctly with 1 input where entire deposit input is spent on btc tx fees", async function () {
            const { utxoLogicHelperContract, mockSimpleBitcoinVaultStateContract, 
                mockBitcoinKitContract, testUtilsContract } = await loadFixture(deployUTXOHelperWithSupportingContracts);

            await mockBitcoinKitContract.setTransactionByTxId(txid1, validSweep4);

            await mockSimpleBitcoinVaultStateContract.setCollectableFees(validSweep4.inputs[1].inputTxId, 5000);

            await mockSimpleBitcoinVaultStateContract.setDepositOutputIndex(validSweep4.inputs[1].inputTxId, validSweep4.inputs[1].sourceIndex);

            // Old sweep UTXO had 50000 sat
            // Swept deposit had 40000 sat
            // Set 5000 sat in fees to collect from swept deposit
            // Output has 50000 sat (so all 5k collectable fees are spent on bitcoin, and another 45k above allowed was spent)
            // Therefore, swept value should be 0, as that was the amount output minus the original sweep utxo
            // Net deposit value should be 35000 as that is the amount collected from swept inputs after collectable fees
            // The new sweep output value should be 50000 as that's the actual on-chain size of the new sweep output
            // The swept dpeosits returned should only contain the swept deposit (input at index 1)

            [sweptValue, netDepositValue, newSweepOutputValue, sweptDeposits] = 
            await utxoLogicHelperContract.checkSweepValidity(
                txid1,
                mockBitcoinKitContract.getAddress(),
                await testUtilsContract.calculateScriptHash(custodianScript1),
                sweepUTXO1,
                validSweep4.inputs[0].sourceIndex, // 0
                mockSimpleBitcoinVaultStateContract.getAddress()
            );

            expect(sweptValue).to.equal(0);
            expect(netDepositValue).to.equal(35000);
            expect(newSweepOutputValue).to.equal(50000);
            expect(sweptDeposits[0]).to.equal(validSweep4.inputs[1].inputTxId);
        });

        it("Should calculate return values correctly with 2 inputs where all collectable fees are spent on btc tx fee", async function () {
            const { utxoLogicHelperContract, mockSimpleBitcoinVaultStateContract, 
                mockBitcoinKitContract, testUtilsContract } = await loadFixture(deployUTXOHelperWithSupportingContracts);

            await mockBitcoinKitContract.setTransactionByTxId(txid1, validSweep5);

            await mockSimpleBitcoinVaultStateContract.setCollectableFees(validSweep5.inputs[1].inputTxId, 5000);
            await mockSimpleBitcoinVaultStateContract.setCollectableFees(validSweep5.inputs[2].inputTxId, 7000);

            await mockSimpleBitcoinVaultStateContract.setDepositOutputIndex(validSweep5.inputs[1].inputTxId, validSweep5.inputs[1].sourceIndex);
            await mockSimpleBitcoinVaultStateContract.setDepositOutputIndex(validSweep5.inputs[2].inputTxId, validSweep5.inputs[2].sourceIndex);

            [sweptValue, netDepositValue, newSweepOutputValue, sweptDeposits] = 
            await utxoLogicHelperContract.checkSweepValidity(
                txid1,
                mockBitcoinKitContract.getAddress(),
                await testUtilsContract.calculateScriptHash(custodianScript1),
                sweepUTXO1,
                validSweep5.inputs[0].sourceIndex, // 0
                mockSimpleBitcoinVaultStateContract.getAddress()
            );

            expect(sweptValue).to.equal(88000);
            expect(netDepositValue).to.equal(88000); // 40k and 60k inputs paid 5k and 7k collectable fees respectively
            expect(newSweepOutputValue).to.equal(138000);
            expect(sweptDeposits[0]).to.equal(validSweep5.inputs[1].inputTxId);
            expect(sweptDeposits[1]).to.equal(validSweep5.inputs[2].inputTxId);
        });

        it("Should calculate return values correctly with 2 inputs where operator collects nonzero fees", async function () {
            const { utxoLogicHelperContract, mockSimpleBitcoinVaultStateContract, 
                mockBitcoinKitContract, testUtilsContract } = await loadFixture(deployUTXOHelperWithSupportingContracts);

            await mockBitcoinKitContract.setTransactionByTxId(txid1, validSweep6);

            await mockSimpleBitcoinVaultStateContract.setCollectableFees(validSweep6.inputs[1].inputTxId, 6000);
            await mockSimpleBitcoinVaultStateContract.setCollectableFees(validSweep6.inputs[2].inputTxId, 6000);

            await mockSimpleBitcoinVaultStateContract.setDepositOutputIndex(validSweep6.inputs[1].inputTxId, validSweep6.inputs[1].sourceIndex);
            await mockSimpleBitcoinVaultStateContract.setDepositOutputIndex(validSweep6.inputs[2].inputTxId, validSweep6.inputs[2].sourceIndex);

            [sweptValue, netDepositValue, newSweepOutputValue, sweptDeposits] = 
            await utxoLogicHelperContract.checkSweepValidity(
                txid1,
                mockBitcoinKitContract.getAddress(),
                await testUtilsContract.calculateScriptHash(custodianScript1),
                sweepUTXO1,
                validSweep6.inputs[0].sourceIndex, // 0
                mockSimpleBitcoinVaultStateContract.getAddress()
            );

            expect(sweptValue).to.equal(92000); // only 8k sats in btc fees were paid
            expect(netDepositValue).to.equal(88000); // 40k and 60k inputs paid 6k collectable fees each
            expect(newSweepOutputValue).to.equal(142000);
            expect(sweptDeposits[0]).to.equal(validSweep6.inputs[1].inputTxId);
            expect(sweptDeposits[1]).to.equal(validSweep6.inputs[2].inputTxId);
        });

        it("Should calculate return values correctly with 2 inputs where more fees paid on btc than collected", async function () {
            const { utxoLogicHelperContract, mockSimpleBitcoinVaultStateContract, 
                mockBitcoinKitContract, testUtilsContract } = await loadFixture(deployUTXOHelperWithSupportingContracts);

            await mockBitcoinKitContract.setTransactionByTxId(txid1, validSweep7);

            await mockSimpleBitcoinVaultStateContract.setCollectableFees(validSweep7.inputs[1].inputTxId, 6000);
            await mockSimpleBitcoinVaultStateContract.setCollectableFees(validSweep7.inputs[2].inputTxId, 5000);

            await mockSimpleBitcoinVaultStateContract.setDepositOutputIndex(validSweep7.inputs[1].inputTxId, validSweep7.inputs[1].sourceIndex);
            await mockSimpleBitcoinVaultStateContract.setDepositOutputIndex(validSweep7.inputs[2].inputTxId, validSweep7.inputs[2].sourceIndex);

            [sweptValue, netDepositValue, newSweepOutputValue, sweptDeposits] = 
            await utxoLogicHelperContract.checkSweepValidity(
                txid1,
                mockBitcoinKitContract.getAddress(),
                await testUtilsContract.calculateScriptHash(custodianScript1),
                sweepUTXO1,
                validSweep7.inputs[0].sourceIndex, // 0
                mockSimpleBitcoinVaultStateContract.getAddress()
            );

            expect(sweptValue).to.equal(92000); // only 10k sats in fees were paid
            expect(netDepositValue).to.equal(89000); // 40k and 60k inputs paid 6k and 5k collectable fees respectively
            expect(newSweepOutputValue).to.equal(142000);
            expect(sweptDeposits[0]).to.equal(validSweep7.inputs[1].inputTxId);
            expect(sweptDeposits[1]).to.equal(validSweep7.inputs[2].inputTxId);
        });

        it("Should calculate return values correctly with 7 inputs where all collectable fees are spent on btc tx fee", async function () {
            const { utxoLogicHelperContract, mockSimpleBitcoinVaultStateContract, 
                mockBitcoinKitContract, testUtilsContract } = await loadFixture(deployUTXOHelperWithSupportingContracts);

            await mockBitcoinKitContract.setTransactionByTxId(txid1, validSweep8);

            await mockSimpleBitcoinVaultStateContract.setCollectableFees(validSweep8.inputs[1].inputTxId, 4000);
            await mockSimpleBitcoinVaultStateContract.setCollectableFees(validSweep8.inputs[2].inputTxId, 6000);
            await mockSimpleBitcoinVaultStateContract.setCollectableFees(validSweep8.inputs[3].inputTxId, 5000);
            await mockSimpleBitcoinVaultStateContract.setCollectableFees(validSweep8.inputs[4].inputTxId, 5000);
            await mockSimpleBitcoinVaultStateContract.setCollectableFees(validSweep8.inputs[5].inputTxId, 2000);
            await mockSimpleBitcoinVaultStateContract.setCollectableFees(validSweep8.inputs[6].inputTxId, 5000);
            await mockSimpleBitcoinVaultStateContract.setCollectableFees(validSweep8.inputs[7].inputTxId, 3000);  // total = 30k sats

            await mockSimpleBitcoinVaultStateContract.setDepositOutputIndex(validSweep8.inputs[1].inputTxId, validSweep8.inputs[1].sourceIndex);
            await mockSimpleBitcoinVaultStateContract.setDepositOutputIndex(validSweep8.inputs[2].inputTxId, validSweep8.inputs[2].sourceIndex);
            await mockSimpleBitcoinVaultStateContract.setDepositOutputIndex(validSweep8.inputs[3].inputTxId, validSweep8.inputs[3].sourceIndex);
            await mockSimpleBitcoinVaultStateContract.setDepositOutputIndex(validSweep8.inputs[4].inputTxId, validSweep8.inputs[4].sourceIndex);
            await mockSimpleBitcoinVaultStateContract.setDepositOutputIndex(validSweep8.inputs[5].inputTxId, validSweep8.inputs[5].sourceIndex);
            await mockSimpleBitcoinVaultStateContract.setDepositOutputIndex(validSweep8.inputs[6].inputTxId, validSweep8.inputs[6].sourceIndex);
            await mockSimpleBitcoinVaultStateContract.setDepositOutputIndex(validSweep8.inputs[7].inputTxId, validSweep8.inputs[7].sourceIndex);

            [sweptValue, netDepositValue, newSweepOutputValue, sweptDeposits] = 
            await utxoLogicHelperContract.checkSweepValidity(
                txid1,
                mockBitcoinKitContract.getAddress(),
                await testUtilsContract.calculateScriptHash(custodianScript1),
                sweepUTXO1,
                validSweep8.inputs[0].sourceIndex, // 0
                mockSimpleBitcoinVaultStateContract.getAddress()
            );

            expect(sweptValue).to.equal(300000); // entire 30k collectable fees spent on btc fees
            expect(netDepositValue).to.equal(300000);
            expect(newSweepOutputValue).to.equal(350000);
            expect(sweptDeposits[0]).to.equal(validSweep8.inputs[1].inputTxId);
            expect(sweptDeposits[1]).to.equal(validSweep8.inputs[2].inputTxId);
            expect(sweptDeposits[2]).to.equal(validSweep8.inputs[3].inputTxId);
            expect(sweptDeposits[3]).to.equal(validSweep8.inputs[4].inputTxId);
            expect(sweptDeposits[4]).to.equal(validSweep8.inputs[5].inputTxId);
            expect(sweptDeposits[5]).to.equal(validSweep8.inputs[6].inputTxId);
            expect(sweptDeposits[6]).to.equal(validSweep8.inputs[7].inputTxId);
        });

        it("Should calculate return values correctly with 7 inputs where operator collects nonzero fees", async function () {
            const { utxoLogicHelperContract, mockSimpleBitcoinVaultStateContract, 
                mockBitcoinKitContract, testUtilsContract } = await loadFixture(deployUTXOHelperWithSupportingContracts);

            await mockBitcoinKitContract.setTransactionByTxId(txid1, validSweep8);

            await mockSimpleBitcoinVaultStateContract.setCollectableFees(validSweep8.inputs[1].inputTxId, 5000);
            await mockSimpleBitcoinVaultStateContract.setCollectableFees(validSweep8.inputs[2].inputTxId, 7000);
            await mockSimpleBitcoinVaultStateContract.setCollectableFees(validSweep8.inputs[3].inputTxId, 5000);
            await mockSimpleBitcoinVaultStateContract.setCollectableFees(validSweep8.inputs[4].inputTxId, 5000);
            await mockSimpleBitcoinVaultStateContract.setCollectableFees(validSweep8.inputs[5].inputTxId, 2000);
            await mockSimpleBitcoinVaultStateContract.setCollectableFees(validSweep8.inputs[6].inputTxId, 5000);
            await mockSimpleBitcoinVaultStateContract.setCollectableFees(validSweep8.inputs[7].inputTxId, 3000);  // total = 32k sats

            await mockSimpleBitcoinVaultStateContract.setDepositOutputIndex(validSweep8.inputs[1].inputTxId, validSweep8.inputs[1].sourceIndex);
            await mockSimpleBitcoinVaultStateContract.setDepositOutputIndex(validSweep8.inputs[2].inputTxId, validSweep8.inputs[2].sourceIndex);
            await mockSimpleBitcoinVaultStateContract.setDepositOutputIndex(validSweep8.inputs[3].inputTxId, validSweep8.inputs[3].sourceIndex);
            await mockSimpleBitcoinVaultStateContract.setDepositOutputIndex(validSweep8.inputs[4].inputTxId, validSweep8.inputs[4].sourceIndex);
            await mockSimpleBitcoinVaultStateContract.setDepositOutputIndex(validSweep8.inputs[5].inputTxId, validSweep8.inputs[5].sourceIndex);
            await mockSimpleBitcoinVaultStateContract.setDepositOutputIndex(validSweep8.inputs[6].inputTxId, validSweep8.inputs[6].sourceIndex);
            await mockSimpleBitcoinVaultStateContract.setDepositOutputIndex(validSweep8.inputs[7].inputTxId, validSweep8.inputs[7].sourceIndex);

            [sweptValue, netDepositValue, newSweepOutputValue, sweptDeposits] = 
            await utxoLogicHelperContract.checkSweepValidity(
                txid1,
                mockBitcoinKitContract.getAddress(),
                await testUtilsContract.calculateScriptHash(custodianScript1),
                sweepUTXO1,
                validSweep8.inputs[0].sourceIndex, // 0
                mockSimpleBitcoinVaultStateContract.getAddress()
            );

            expect(sweptValue).to.equal(300000); 
            expect(netDepositValue).to.equal(298000);
            expect(newSweepOutputValue).to.equal(350000);
            expect(sweptDeposits[0]).to.equal(validSweep8.inputs[1].inputTxId);
            expect(sweptDeposits[1]).to.equal(validSweep8.inputs[2].inputTxId);
            expect(sweptDeposits[2]).to.equal(validSweep8.inputs[3].inputTxId);
            expect(sweptDeposits[3]).to.equal(validSweep8.inputs[4].inputTxId);
            expect(sweptDeposits[4]).to.equal(validSweep8.inputs[5].inputTxId);
            expect(sweptDeposits[5]).to.equal(validSweep8.inputs[6].inputTxId);
            expect(sweptDeposits[6]).to.equal(validSweep8.inputs[7].inputTxId);
        });


        it("Should calculate return values correctly with 7 inputs where more fees paid on btc than collected", async function () {
            const { utxoLogicHelperContract, mockSimpleBitcoinVaultStateContract, 
                mockBitcoinKitContract, testUtilsContract } = await loadFixture(deployUTXOHelperWithSupportingContracts);

            await mockBitcoinKitContract.setTransactionByTxId(txid1, validSweep8);

            await mockSimpleBitcoinVaultStateContract.setCollectableFees(validSweep8.inputs[1].inputTxId, 3000);
            await mockSimpleBitcoinVaultStateContract.setCollectableFees(validSweep8.inputs[2].inputTxId, 5000);
            await mockSimpleBitcoinVaultStateContract.setCollectableFees(validSweep8.inputs[3].inputTxId, 5000);
            await mockSimpleBitcoinVaultStateContract.setCollectableFees(validSweep8.inputs[4].inputTxId, 5000);
            await mockSimpleBitcoinVaultStateContract.setCollectableFees(validSweep8.inputs[5].inputTxId, 2000);
            await mockSimpleBitcoinVaultStateContract.setCollectableFees(validSweep8.inputs[6].inputTxId, 5000);
            await mockSimpleBitcoinVaultStateContract.setCollectableFees(validSweep8.inputs[7].inputTxId, 3000);  // total = 28k sats

            await mockSimpleBitcoinVaultStateContract.setDepositOutputIndex(validSweep8.inputs[1].inputTxId, validSweep8.inputs[1].sourceIndex);
            await mockSimpleBitcoinVaultStateContract.setDepositOutputIndex(validSweep8.inputs[2].inputTxId, validSweep8.inputs[2].sourceIndex);
            await mockSimpleBitcoinVaultStateContract.setDepositOutputIndex(validSweep8.inputs[3].inputTxId, validSweep8.inputs[3].sourceIndex);
            await mockSimpleBitcoinVaultStateContract.setDepositOutputIndex(validSweep8.inputs[4].inputTxId, validSweep8.inputs[4].sourceIndex);
            await mockSimpleBitcoinVaultStateContract.setDepositOutputIndex(validSweep8.inputs[5].inputTxId, validSweep8.inputs[5].sourceIndex);
            await mockSimpleBitcoinVaultStateContract.setDepositOutputIndex(validSweep8.inputs[6].inputTxId, validSweep8.inputs[6].sourceIndex);
            await mockSimpleBitcoinVaultStateContract.setDepositOutputIndex(validSweep8.inputs[7].inputTxId, validSweep8.inputs[7].sourceIndex);

            [sweptValue, netDepositValue, newSweepOutputValue, sweptDeposits] = 
            await utxoLogicHelperContract.checkSweepValidity(
                txid1,
                mockBitcoinKitContract.getAddress(),
                await testUtilsContract.calculateScriptHash(custodianScript1),
                sweepUTXO1,
                validSweep8.inputs[0].sourceIndex, // 0
                mockSimpleBitcoinVaultStateContract.getAddress()
            );

            expect(sweptValue).to.equal(300000); 
            expect(netDepositValue).to.equal(302000);
            expect(newSweepOutputValue).to.equal(350000);
            expect(sweptDeposits[0]).to.equal(validSweep8.inputs[1].inputTxId);
            expect(sweptDeposits[1]).to.equal(validSweep8.inputs[2].inputTxId);
            expect(sweptDeposits[2]).to.equal(validSweep8.inputs[3].inputTxId);
            expect(sweptDeposits[3]).to.equal(validSweep8.inputs[4].inputTxId);
            expect(sweptDeposits[4]).to.equal(validSweep8.inputs[5].inputTxId);
            expect(sweptDeposits[5]).to.equal(validSweep8.inputs[6].inputTxId);
            expect(sweptDeposits[6]).to.equal(validSweep8.inputs[7].inputTxId);
        });
      });

        
    describe("Check Confirmed Deposit Spend Invalidity", function () {
        it("Should reject invalid spend claim of missing current sweep utxo spend transaction", async function () {
            const { utxoLogicHelperContract, mockSimpleBitcoinVaultStateContract, 
                mockBitcoinKitContract, testUtilsContract } = await loadFixture(deployUTXOHelperWithSupportingContracts);

            // Did not set txid1 to be known by BitcoinKit

            await expect(utxoLogicHelperContract.checkConfirmedDepositSpendInvalidity(
                txid1,
                0,
                mockBitcoinKitContract.getAddress(),
                emptyHash,
                sweepUTXO1,
                0,
                mockSimpleBitcoinVaultStateContract.getAddress()
            )).to.be.revertedWith("transaction is not known by hVM");
        });

        it("Should reject invalid spend claim where identified input index does not exist", async function () {
            const { utxoLogicHelperContract, mockSimpleBitcoinVaultStateContract, 
                mockBitcoinKitContract, testUtilsContract } = await loadFixture(deployUTXOHelperWithSupportingContracts);

            await mockBitcoinKitContract.setTransactionByTxId(txid1, validConfirmedDepositInvalidSpend1);

            await expect(utxoLogicHelperContract.checkConfirmedDepositSpendInvalidity(
                txid1,
                1,
                mockBitcoinKitContract.getAddress(),
                emptyHash,
                sweepUTXO1,
                0,
                mockSimpleBitcoinVaultStateContract.getAddress()
            )).to.be.revertedWith("input does not exist in transaction");
        });

        it("Should reject invalid spend claim where identified input is not a confirmed deposit", async function () {
            const { utxoLogicHelperContract, mockSimpleBitcoinVaultStateContract, 
                mockBitcoinKitContract, testUtilsContract } = await loadFixture(deployUTXOHelperWithSupportingContracts);

            await mockBitcoinKitContract.setTransactionByTxId(txid1, validConfirmedDepositInvalidSpend1);

            // Did not set collectable fees for input so it is not a confirmed deposit
            await expect(utxoLogicHelperContract.checkConfirmedDepositSpendInvalidity(
                txid1,
                0,
                mockBitcoinKitContract.getAddress(),
                emptyHash,
                sweepUTXO1,
                0,
                mockSimpleBitcoinVaultStateContract.getAddress()
            )).to.be.revertedWith("claimed input is not a confirmed but unswept deposit");
        });

        it("Should reject invalid spend claim where identified input is a confirmed deposit but wrong index is spent", async function () {
            const { utxoLogicHelperContract, mockSimpleBitcoinVaultStateContract, 
                mockBitcoinKitContract, testUtilsContract } = await loadFixture(deployUTXOHelperWithSupportingContracts);

            await mockBitcoinKitContract.setTransactionByTxId(txid1, validConfirmedDepositInvalidSpend1);

            await mockSimpleBitcoinVaultStateContract.setCollectableFees(validConfirmedDepositInvalidSpend1.inputs[0].inputTxId, 3000);

            await mockSimpleBitcoinVaultStateContract.setDepositOutputIndex(validConfirmedDepositInvalidSpend1.inputs[0].inputTxId, validConfirmedDepositInvalidSpend1.inputs[0].sourceIndex + 1); // Wrong deposit output

            // Spent output index is wrong
            await expect(utxoLogicHelperContract.checkConfirmedDepositSpendInvalidity(
                txid1,
                0,
                mockBitcoinKitContract.getAddress(),
                emptyHash,
                sweepUTXO1,
                0,
                mockSimpleBitcoinVaultStateContract.getAddress()
            )).to.be.revertedWith("claimed input spends the wrong output of a confirmed but unswept deposit");
        });

        it("Should reject invalid spend claim where transaction has more than 8 inputs available in tx list but input is not a confirmed deposit", async function () {
            const { utxoLogicHelperContract, mockSimpleBitcoinVaultStateContract, 
                mockBitcoinKitContract, testUtilsContract } = await loadFixture(deployUTXOHelperWithSupportingContracts);

            await mockBitcoinKitContract.setTransactionByTxId(txid1, invalidConfirmedDepositInvalidSpend1);
            // Never set collectable fees, therefore not confirmed deposit

            await expect(utxoLogicHelperContract.checkConfirmedDepositSpendInvalidity(
                txid1,
                0,
                mockBitcoinKitContract.getAddress(),
                emptyHash,
                sweepUTXO1,
                0,
                mockSimpleBitcoinVaultStateContract.getAddress()
            )).to.be.revertedWith("claimed input is not a confirmed but unswept deposit");
        });

        it("Should reject invalid spend claim where transaction has more than 8 inputs available in tx list but input is a confirmed deposit but wrong index is spent", async function () {
            const { utxoLogicHelperContract, mockSimpleBitcoinVaultStateContract, 
                mockBitcoinKitContract, testUtilsContract } = await loadFixture(deployUTXOHelperWithSupportingContracts);

            await mockBitcoinKitContract.setTransactionByTxId(txid1, invalidConfirmedDepositInvalidSpend1);
            await mockSimpleBitcoinVaultStateContract.setCollectableFees(invalidConfirmedDepositInvalidSpend1.inputs[1].inputTxId, 3000);
            await mockSimpleBitcoinVaultStateContract.setDepositOutputIndex(invalidConfirmedDepositInvalidSpend1.inputs[1].inputTxId, invalidConfirmedDepositInvalidSpend1.inputs[1].sourceIndex + 1);

            await expect(utxoLogicHelperContract.checkConfirmedDepositSpendInvalidity(
                txid1,
                1,
                mockBitcoinKitContract.getAddress(),
                emptyHash,
                sweepUTXO1,
                0,
                mockSimpleBitcoinVaultStateContract.getAddress()
            )).to.be.revertedWith("claimed input spends the wrong output of a confirmed but unswept deposit");
        });

        it("Should reject invalid spend claim where transaction has more than 1 output available in tx list but input is not a confirmed deposit", async function () {
            const { utxoLogicHelperContract, mockSimpleBitcoinVaultStateContract, 
                mockBitcoinKitContract, testUtilsContract } = await loadFixture(deployUTXOHelperWithSupportingContracts);

            await mockBitcoinKitContract.setTransactionByTxId(txid1, invalidConfirmedDepositInvalidSpend3);
            // Collectable fees never set

            await expect(utxoLogicHelperContract.checkConfirmedDepositSpendInvalidity(
                txid1,
                0,
                mockBitcoinKitContract.getAddress(),
                emptyHash,
                sweepUTXO1,
                0,
                mockSimpleBitcoinVaultStateContract.getAddress()
            )).to.be.revertedWith("claimed input is not a confirmed but unswept deposit");
        });

        it("Should reject invalid spend claim where transaction has more than 1 output with only 1 in tx list and input is a confirmed deposit but wrong index is spent", async function () {
            const { utxoLogicHelperContract, mockSimpleBitcoinVaultStateContract, 
                mockBitcoinKitContract, testUtilsContract } = await loadFixture(deployUTXOHelperWithSupportingContracts);

            await mockBitcoinKitContract.setTransactionByTxId(txid1, invalidConfirmedDepositInvalidSpend4);
            await mockSimpleBitcoinVaultStateContract.setCollectableFees(invalidConfirmedDepositInvalidSpend4.inputs[1].inputTxId, 3000);
            await mockSimpleBitcoinVaultStateContract.setDepositOutputIndex(invalidConfirmedDepositInvalidSpend4.inputs[1].inputTxId, invalidConfirmedDepositInvalidSpend4.inputs[1].sourceIndex + 1);
            
            await expect(utxoLogicHelperContract.checkConfirmedDepositSpendInvalidity(
                txid1,
                1,
                mockBitcoinKitContract.getAddress(),
                emptyHash,
                sweepUTXO1,
                0,
                mockSimpleBitcoinVaultStateContract.getAddress()
            )).to.be.revertedWith("claimed input spends the wrong output of a confirmed but unswept deposit");
        });

        it("Should accept invalid spend claim where transaction has more than 8 inputs available in tx list and confirmed deposit is spent", async function () {
            const { utxoLogicHelperContract, mockSimpleBitcoinVaultStateContract, 
                mockBitcoinKitContract, testUtilsContract } = await loadFixture(deployUTXOHelperWithSupportingContracts);

            await mockBitcoinKitContract.setTransactionByTxId(txid1, invalidConfirmedDepositInvalidSpend1);
            await mockSimpleBitcoinVaultStateContract.setCollectableFees(invalidConfirmedDepositInvalidSpend1.inputs[1].inputTxId, 3000);
            await mockSimpleBitcoinVaultStateContract.setDepositOutputIndex(invalidConfirmedDepositInvalidSpend1.inputs[1].inputTxId, invalidConfirmedDepositInvalidSpend1.inputs[1].sourceIndex);

            result = await utxoLogicHelperContract.checkConfirmedDepositSpendInvalidity(
                txid1,
                1,
                mockBitcoinKitContract.getAddress(),
                emptyHash,
                sweepUTXO1,
                0,
                mockSimpleBitcoinVaultStateContract.getAddress()
            );

            expect(result).to.equal(true);
        });

        it("Should accept invalid spend claim where transaction has more than 8 inputs with only 8 in tx list and confirmed deposit at index 1 is spent", async function () {
            const { utxoLogicHelperContract, mockSimpleBitcoinVaultStateContract, 
                mockBitcoinKitContract, testUtilsContract } = await loadFixture(deployUTXOHelperWithSupportingContracts);

            await mockBitcoinKitContract.setTransactionByTxId(txid1, validConfirmedDepositInvalidSpend3);

            // Set the invalid confirmed deposit spend at index 8 above index 0-7 which are returned normally getting the transaction
            await mockBitcoinKitContract.setTransactionSpecificInputByTxId(txid1, 8, confirmedDepositInput1);

            // Set all the other inputs as confirmed deposits to ensure the rejection is not due to any other inputs not being seen as confirmed deposits
            await mockSimpleBitcoinVaultStateContract.setCollectableFees(validConfirmedDepositInvalidSpend3.inputs[1].inputTxId, 3000);
            await mockSimpleBitcoinVaultStateContract.setDepositOutputIndex(validConfirmedDepositInvalidSpend3.inputs[1].inputTxId, validConfirmedDepositInvalidSpend3.inputs[1].sourceIndex);
            await mockSimpleBitcoinVaultStateContract.setCollectableFees(validConfirmedDepositInvalidSpend3.inputs[2].inputTxId, 4000);
            await mockSimpleBitcoinVaultStateContract.setDepositOutputIndex(validConfirmedDepositInvalidSpend3.inputs[2].inputTxId, validConfirmedDepositInvalidSpend3.inputs[2].sourceIndex);
            await mockSimpleBitcoinVaultStateContract.setCollectableFees(validConfirmedDepositInvalidSpend3.inputs[3].inputTxId, 3000);
            await mockSimpleBitcoinVaultStateContract.setDepositOutputIndex(validConfirmedDepositInvalidSpend3.inputs[3].inputTxId, validConfirmedDepositInvalidSpend3.inputs[3].sourceIndex);
            await mockSimpleBitcoinVaultStateContract.setCollectableFees(validConfirmedDepositInvalidSpend3.inputs[4].inputTxId, 7000);
            await mockSimpleBitcoinVaultStateContract.setDepositOutputIndex(validConfirmedDepositInvalidSpend3.inputs[4].inputTxId, validConfirmedDepositInvalidSpend3.inputs[4].sourceIndex);
            await mockSimpleBitcoinVaultStateContract.setCollectableFees(validConfirmedDepositInvalidSpend3.inputs[5].inputTxId, 3000);
            await mockSimpleBitcoinVaultStateContract.setDepositOutputIndex(validConfirmedDepositInvalidSpend3.inputs[5].inputTxId, validConfirmedDepositInvalidSpend3.inputs[5].sourceIndex);
            await mockSimpleBitcoinVaultStateContract.setCollectableFees(validConfirmedDepositInvalidSpend3.inputs[6].inputTxId, 1000);
            await mockSimpleBitcoinVaultStateContract.setDepositOutputIndex(validConfirmedDepositInvalidSpend3.inputs[6].inputTxId, validConfirmedDepositInvalidSpend3.inputs[6].sourceIndex);
            await mockSimpleBitcoinVaultStateContract.setCollectableFees(validConfirmedDepositInvalidSpend3.inputs[7].inputTxId, 13000);
            await mockSimpleBitcoinVaultStateContract.setDepositOutputIndex(validConfirmedDepositInvalidSpend3.inputs[7].inputTxId, validConfirmedDepositInvalidSpend3.inputs[7].sourceIndex);

            // Set our input not contained in the normal transaction as a confirmed deposit
            await mockSimpleBitcoinVaultStateContract.setCollectableFees(confirmedDepositInput1.inputTxId, 3000);
            await mockSimpleBitcoinVaultStateContract.setDepositOutputIndex(confirmedDepositInput1.inputTxId, confirmedDepositInput1.sourceIndex);

            result = await utxoLogicHelperContract.checkConfirmedDepositSpendInvalidity(
                txid1,
                1,
                mockBitcoinKitContract.getAddress(),
                emptyHash,
                sweepUTXO1,
                0,
                mockSimpleBitcoinVaultStateContract.getAddress()
            );

            expect(result).to.equal(true);
        });

        it("Should accept invalid spend claim where transaction has more than 8 inputs with only 8 in default tx list but targeted confirmed deposit is 9th input", async function () {
            const { utxoLogicHelperContract, mockSimpleBitcoinVaultStateContract, 
                mockBitcoinKitContract, testUtilsContract } = await loadFixture(deployUTXOHelperWithSupportingContracts);

            await mockBitcoinKitContract.setTransactionByTxId(txid1, validConfirmedDepositInvalidSpend3);

            // Set the invalid confirmed deposit spend at index 8 above index 0-7 which are returned normally getting the transaction
            await mockBitcoinKitContract.setTransactionSpecificInputByTxId(txid1, 8, confirmedDepositInput1);

            // Set all the other inputs as confirmed deposits to ensure the rejection is due to the specific confirmed deposit being spent at index >= 8
            await mockSimpleBitcoinVaultStateContract.setCollectableFees(validConfirmedDepositInvalidSpend3.inputs[1].inputTxId, 3000);
            await mockSimpleBitcoinVaultStateContract.setDepositOutputIndex(validConfirmedDepositInvalidSpend3.inputs[1].inputTxId, validConfirmedDepositInvalidSpend3.inputs[1].sourceIndex);
            await mockSimpleBitcoinVaultStateContract.setCollectableFees(validConfirmedDepositInvalidSpend3.inputs[2].inputTxId, 4000);
            await mockSimpleBitcoinVaultStateContract.setDepositOutputIndex(validConfirmedDepositInvalidSpend3.inputs[2].inputTxId, validConfirmedDepositInvalidSpend3.inputs[2].sourceIndex);
            await mockSimpleBitcoinVaultStateContract.setCollectableFees(validConfirmedDepositInvalidSpend3.inputs[3].inputTxId, 3000);
            await mockSimpleBitcoinVaultStateContract.setDepositOutputIndex(validConfirmedDepositInvalidSpend3.inputs[3].inputTxId, validConfirmedDepositInvalidSpend3.inputs[3].sourceIndex);
            await mockSimpleBitcoinVaultStateContract.setCollectableFees(validConfirmedDepositInvalidSpend3.inputs[4].inputTxId, 7000);
            await mockSimpleBitcoinVaultStateContract.setDepositOutputIndex(validConfirmedDepositInvalidSpend3.inputs[4].inputTxId, validConfirmedDepositInvalidSpend3.inputs[4].sourceIndex);
            await mockSimpleBitcoinVaultStateContract.setCollectableFees(validConfirmedDepositInvalidSpend3.inputs[5].inputTxId, 3000);
            await mockSimpleBitcoinVaultStateContract.setDepositOutputIndex(validConfirmedDepositInvalidSpend3.inputs[5].inputTxId, validConfirmedDepositInvalidSpend3.inputs[5].sourceIndex);
            await mockSimpleBitcoinVaultStateContract.setCollectableFees(validConfirmedDepositInvalidSpend3.inputs[6].inputTxId, 1000);
            await mockSimpleBitcoinVaultStateContract.setDepositOutputIndex(validConfirmedDepositInvalidSpend3.inputs[6].inputTxId, validConfirmedDepositInvalidSpend3.inputs[6].sourceIndex);
            await mockSimpleBitcoinVaultStateContract.setCollectableFees(validConfirmedDepositInvalidSpend3.inputs[7].inputTxId, 13000);
            await mockSimpleBitcoinVaultStateContract.setDepositOutputIndex(validConfirmedDepositInvalidSpend3.inputs[7].inputTxId, validConfirmedDepositInvalidSpend3.inputs[7].sourceIndex);

            // Set our input not contained in the normal transaction as a confirmed deposit
            await mockSimpleBitcoinVaultStateContract.setCollectableFees(confirmedDepositInput1.inputTxId, 3000);
            await mockSimpleBitcoinVaultStateContract.setDepositOutputIndex(confirmedDepositInput1.inputTxId, confirmedDepositInput1.sourceIndex);

            result = await utxoLogicHelperContract.checkConfirmedDepositSpendInvalidity(
                txid1,
                8, // Contract should get this input specifically from BitcoinKit as it is blamed even though it isn't available in the regular returned transaction
                mockBitcoinKitContract.getAddress(),
                emptyHash,
                sweepUTXO1,
                0,
                mockSimpleBitcoinVaultStateContract.getAddress()
            );

            expect(result).to.equal(true);
        });

        it("Should accept invalid spend claim where transaction has more than 1 output available in tx list and confirmed deposit is spent", async function () {
            const { utxoLogicHelperContract, mockSimpleBitcoinVaultStateContract, 
                mockBitcoinKitContract, testUtilsContract } = await loadFixture(deployUTXOHelperWithSupportingContracts);

            await mockBitcoinKitContract.setTransactionByTxId(txid1, invalidConfirmedDepositInvalidSpend3);
            await mockSimpleBitcoinVaultStateContract.setCollectableFees(invalidConfirmedDepositInvalidSpend3.inputs[1].inputTxId, 3000);
            await mockSimpleBitcoinVaultStateContract.setDepositOutputIndex(invalidConfirmedDepositInvalidSpend3.inputs[1].inputTxId, invalidConfirmedDepositInvalidSpend3.inputs[1].sourceIndex);

            result = await utxoLogicHelperContract.checkConfirmedDepositSpendInvalidity(
                txid1,
                1,
                mockBitcoinKitContract.getAddress(),
                emptyHash,
                sweepUTXO1,
                0,
                mockSimpleBitcoinVaultStateContract.getAddress()
            );

            expect(result).to.equal(true);
        });

        it("Should accept invalid spend claim where transaction has more than 1 output with only 1 in tx list and confirmed deposit is spent", async function () {
            const { utxoLogicHelperContract, mockSimpleBitcoinVaultStateContract, 
                mockBitcoinKitContract, testUtilsContract } = await loadFixture(deployUTXOHelperWithSupportingContracts);

            await mockBitcoinKitContract.setTransactionByTxId(txid1, invalidConfirmedDepositInvalidSpend4);
            await mockSimpleBitcoinVaultStateContract.setCollectableFees(invalidConfirmedDepositInvalidSpend4.inputs[1].inputTxId, 3000);
            await mockSimpleBitcoinVaultStateContract.setDepositOutputIndex(invalidConfirmedDepositInvalidSpend4.inputs[1].inputTxId, invalidConfirmedDepositInvalidSpend4.inputs[1].sourceIndex);

            result = await utxoLogicHelperContract.checkConfirmedDepositSpendInvalidity(
                txid1,
                1,
                mockBitcoinKitContract.getAddress(),
                emptyHash,
                sweepUTXO1,
                0,
                mockSimpleBitcoinVaultStateContract.getAddress()
            );

            expect(result).to.equal(true);
        });

        it("Should accept invalid spend claim where transaction spends a confirmed deposit as first and only input", async function () {
            const { utxoLogicHelperContract, mockSimpleBitcoinVaultStateContract, 
                mockBitcoinKitContract, testUtilsContract } = await loadFixture(deployUTXOHelperWithSupportingContracts);

            await mockBitcoinKitContract.setTransactionByTxId(txid1, validConfirmedDepositInvalidSpend1);
            await mockSimpleBitcoinVaultStateContract.setCollectableFees(validConfirmedDepositInvalidSpend1.inputs[0].inputTxId, 3000);
            await mockSimpleBitcoinVaultStateContract.setDepositOutputIndex(validConfirmedDepositInvalidSpend1.inputs[0].inputTxId, invalidConfirmedDepositInvalidSpend4.inputs[0].sourceIndex);

            custodian1ScriptHash = await testUtilsContract.calculateScriptHash(custodianScript1);

            result = await utxoLogicHelperContract.checkConfirmedDepositSpendInvalidity(
                txid1,
                0,
                mockBitcoinKitContract.getAddress(),
                custodian1ScriptHash, // Single output of tx does not match this script hash
                sweepUTXO1,
                0,
                mockSimpleBitcoinVaultStateContract.getAddress()
            );

            expect(result).to.equal(true);
        });

        it("Should accept invalid spend claim where transaction spends a confirmed deposit after sweep utxo input but outputs to a different script than the custodian", async function () {
            const { utxoLogicHelperContract, mockSimpleBitcoinVaultStateContract, 
                mockBitcoinKitContract, testUtilsContract } = await loadFixture(deployUTXOHelperWithSupportingContracts);

            await mockBitcoinKitContract.setTransactionByTxId(txid1, validConfirmedDepositInvalidSpend2);
            await mockSimpleBitcoinVaultStateContract.setCollectableFees(validConfirmedDepositInvalidSpend2.inputs[1].inputTxId, 3000);
            await mockSimpleBitcoinVaultStateContract.setDepositOutputIndex(validConfirmedDepositInvalidSpend2.inputs[1].inputTxId, validConfirmedDepositInvalidSpend2.inputs[1].sourceIndex);

            custodian1ScriptHash = await testUtilsContract.calculateScriptHash(custodianScript1);

            result = await utxoLogicHelperContract.checkConfirmedDepositSpendInvalidity(
                txid1,
                1,
                mockBitcoinKitContract.getAddress(),
                custodian1ScriptHash,
                sweepUTXO1,
                0,
                mockSimpleBitcoinVaultStateContract.getAddress()
            );

            expect(result).to.equal(true);
        });

        it("Should accept invalid spend claim where transaction spends a confirmed deposit at index 1", async function () {
            const { utxoLogicHelperContract, mockSimpleBitcoinVaultStateContract, 
                mockBitcoinKitContract, testUtilsContract } = await loadFixture(deployUTXOHelperWithSupportingContracts);

            await mockBitcoinKitContract.setTransactionByTxId(txid1, validConfirmedDepositInvalidSpend2);
            await mockSimpleBitcoinVaultStateContract.setCollectableFees(validConfirmedDepositInvalidSpend2.inputs[1].inputTxId, 3000);
            await mockSimpleBitcoinVaultStateContract.setDepositOutputIndex(validConfirmedDepositInvalidSpend2.inputs[1].inputTxId, validConfirmedDepositInvalidSpend2.inputs[1].sourceIndex);

            custodian1ScriptHash = await testUtilsContract.calculateScriptHash(custodianScript1);

            result = await utxoLogicHelperContract.checkConfirmedDepositSpendInvalidity(
                txid1,
                1,
                mockBitcoinKitContract.getAddress(),
                custodian1ScriptHash,
                sweepUTXO1,
                0,
                mockSimpleBitcoinVaultStateContract.getAddress()
            );

            expect(result).to.equal(true);
        });

        it("Should accept invalid spend claim where transaction spends a confirmed deposit at index 8", async function () {
            const { utxoLogicHelperContract, mockSimpleBitcoinVaultStateContract, 
                mockBitcoinKitContract, testUtilsContract } = await loadFixture(deployUTXOHelperWithSupportingContracts);

            await mockBitcoinKitContract.setTransactionByTxId(txid1, validConfirmedDepositInvalidSpend4);
            await mockSimpleBitcoinVaultStateContract.setCollectableFees(validConfirmedDepositInvalidSpend4.inputs[1].inputTxId, 3000);
            await mockSimpleBitcoinVaultStateContract.setDepositOutputIndex(validConfirmedDepositInvalidSpend4.inputs[1].inputTxId, validConfirmedDepositInvalidSpend4.inputs[1].sourceIndex);
            await mockSimpleBitcoinVaultStateContract.setCollectableFees(validConfirmedDepositInvalidSpend4.inputs[2].inputTxId, 3000);
            await mockSimpleBitcoinVaultStateContract.setDepositOutputIndex(validConfirmedDepositInvalidSpend4.inputs[2].inputTxId, validConfirmedDepositInvalidSpend4.inputs[2].sourceIndex);
            await mockSimpleBitcoinVaultStateContract.setCollectableFees(validConfirmedDepositInvalidSpend4.inputs[3].inputTxId, 3000);
            await mockSimpleBitcoinVaultStateContract.setDepositOutputIndex(validConfirmedDepositInvalidSpend4.inputs[3].inputTxId, validConfirmedDepositInvalidSpend4.inputs[3].sourceIndex);
            await mockSimpleBitcoinVaultStateContract.setCollectableFees(validConfirmedDepositInvalidSpend4.inputs[4].inputTxId, 3000);
            await mockSimpleBitcoinVaultStateContract.setDepositOutputIndex(validConfirmedDepositInvalidSpend4.inputs[4].inputTxId, validConfirmedDepositInvalidSpend4.inputs[4].sourceIndex);
            await mockSimpleBitcoinVaultStateContract.setCollectableFees(validConfirmedDepositInvalidSpend4.inputs[5].inputTxId, 3000);
            await mockSimpleBitcoinVaultStateContract.setDepositOutputIndex(validConfirmedDepositInvalidSpend4.inputs[5].inputTxId, validConfirmedDepositInvalidSpend4.inputs[5].sourceIndex);
            await mockSimpleBitcoinVaultStateContract.setCollectableFees(validConfirmedDepositInvalidSpend4.inputs[6].inputTxId, 3000);
            await mockSimpleBitcoinVaultStateContract.setDepositOutputIndex(validConfirmedDepositInvalidSpend4.inputs[6].inputTxId, validConfirmedDepositInvalidSpend4.inputs[6].sourceIndex);
            await mockSimpleBitcoinVaultStateContract.setCollectableFees(validConfirmedDepositInvalidSpend4.inputs[7].inputTxId, 3000);
            await mockSimpleBitcoinVaultStateContract.setDepositOutputIndex(validConfirmedDepositInvalidSpend4.inputs[7].inputTxId, validConfirmedDepositInvalidSpend4.inputs[7].sourceIndex);

            custodian1ScriptHash = await testUtilsContract.calculateScriptHash(custodianScript1);

            result = await utxoLogicHelperContract.checkConfirmedDepositSpendInvalidity(
                txid1,
                7,
                mockBitcoinKitContract.getAddress(),
                custodian1ScriptHash,
                sweepUTXO1,
                0,
                mockSimpleBitcoinVaultStateContract.getAddress()
            );

            expect(result).to.equal(true);
        });

        it("Should accept invalid spend claim where transaction spends an input which is not a confirmed deposit but a valid confirmed deposit spend is blamed", async function () {
            const { utxoLogicHelperContract, mockSimpleBitcoinVaultStateContract, 
                mockBitcoinKitContract, testUtilsContract } = await loadFixture(deployUTXOHelperWithSupportingContracts);

            await mockBitcoinKitContract.setTransactionByTxId(txid1, validConfirmedDepositInvalidSpend5);


            // Set input2[1] (confirmedDepositInput1) as a confirmed deposit, but not inputs[2] (input4), so the spend of input4 is what causes invalidity
            await mockSimpleBitcoinVaultStateContract.setCollectableFees(validConfirmedDepositInvalidSpend5.inputs[1].inputTxId, 10000);
            await mockSimpleBitcoinVaultStateContract.setDepositOutputIndex(validConfirmedDepositInvalidSpend5.inputs[1].inputTxId, validConfirmedDepositInvalidSpend5.inputs[1].sourceIndex);

            custodian1ScriptHash = await testUtilsContract.calculateScriptHash(custodianScript1);

            result = await utxoLogicHelperContract.checkConfirmedDepositSpendInvalidity(
                txid1,
                1, // Blame index 1, but code should iterate through other inputs and fail because input at index 2 is not a valid confirmed deposit
                mockBitcoinKitContract.getAddress(),
                custodian1ScriptHash,
                sweepUTXO1,
                0,
                mockSimpleBitcoinVaultStateContract.getAddress()
            );

            expect(result).to.equal(true);
        });

        it("Should accept invalid spend claim where transaction spends an input which spends a confirmed deposit txid but uses the wrong index and a valid confirmed deposit spend is blamed", async function () {
            const { utxoLogicHelperContract, mockSimpleBitcoinVaultStateContract, 
                mockBitcoinKitContract, testUtilsContract } = await loadFixture(deployUTXOHelperWithSupportingContracts);

            await mockBitcoinKitContract.setTransactionByTxId(txid1, validConfirmedDepositInvalidSpend5);

            // Set both inputs as a confirmed deposit, but with the wrong output index for the output at index 2
            await mockSimpleBitcoinVaultStateContract.setCollectableFees(validConfirmedDepositInvalidSpend5.inputs[1].inputTxId, 10000);
            await mockSimpleBitcoinVaultStateContract.setDepositOutputIndex(validConfirmedDepositInvalidSpend5.inputs[1].inputTxId, validConfirmedDepositInvalidSpend5.inputs[1].sourceIndex);
            await mockSimpleBitcoinVaultStateContract.setCollectableFees(validConfirmedDepositInvalidSpend5.inputs[2].inputTxId, 8000);
            await mockSimpleBitcoinVaultStateContract.setDepositOutputIndex(validConfirmedDepositInvalidSpend5.inputs[2].inputTxId, validConfirmedDepositInvalidSpend5.inputs[2].sourceIndex + 1);

            custodian1ScriptHash = await testUtilsContract.calculateScriptHash(custodianScript1);

            result = await utxoLogicHelperContract.checkConfirmedDepositSpendInvalidity(
                txid1,
                1, // Blame index 1, but code should iterate through other inputs and fail because input at index 2 is not spending the right output index of confirmed deposit
                mockBitcoinKitContract.getAddress(),
                custodian1ScriptHash,
                sweepUTXO1,
                0,
                mockSimpleBitcoinVaultStateContract.getAddress()
            );

            expect(result).to.equal(true);
        });

        it("Should reject invalid spend claim where all self-contained validity checks pass and input index 0 is the current sweep utxo", async function () {
            const { utxoLogicHelperContract, mockSimpleBitcoinVaultStateContract, 
                mockBitcoinKitContract, testUtilsContract } = await loadFixture(deployUTXOHelperWithSupportingContracts);

            await mockBitcoinKitContract.setTransactionByTxId(txid1, invalidConfirmedDepositInvalidSpend5);

            await mockSimpleBitcoinVaultStateContract.setCollectableFees(invalidConfirmedDepositInvalidSpend5.inputs[1].inputTxId, 10000);
            await mockSimpleBitcoinVaultStateContract.setDepositOutputIndex(invalidConfirmedDepositInvalidSpend5.inputs[1].inputTxId, invalidConfirmedDepositInvalidSpend5.inputs[1].sourceIndex);

            custodian1ScriptHash = await testUtilsContract.calculateScriptHash(custodianScript1);

            result = await utxoLogicHelperContract.checkConfirmedDepositSpendInvalidity(
                txid1,
                1,
                mockBitcoinKitContract.getAddress(),
                custodian1ScriptHash,
                sweepUTXOInput1.inputTxId,
                sweepUTXOInput1.sourceIndex,
                mockSimpleBitcoinVaultStateContract.getAddress()
            );

            expect(result).to.equal(false); // This transaction should be rejected (NOT invalid) as it is a completely valid sweep
        });

        it("Should accept invalid spend claim where all self-contained validity checks pass but input index 0 spends the sweep utxo with the wrong source index", async function () {
            const { utxoLogicHelperContract, mockSimpleBitcoinVaultStateContract, 
                mockBitcoinKitContract, testUtilsContract } = await loadFixture(deployUTXOHelperWithSupportingContracts);

            await mockBitcoinKitContract.setTransactionByTxId(txid1, invalidConfirmedDepositInvalidSpend5);

            await mockSimpleBitcoinVaultStateContract.setCollectableFees(invalidConfirmedDepositInvalidSpend5.inputs[1].inputTxId, 10000);
            await mockSimpleBitcoinVaultStateContract.setDepositOutputIndex(invalidConfirmedDepositInvalidSpend5.inputs[1].inputTxId, invalidConfirmedDepositInvalidSpend5.inputs[1].sourceIndex);

            custodian1ScriptHash = await testUtilsContract.calculateScriptHash(custodianScript1);

            result = await utxoLogicHelperContract.checkConfirmedDepositSpendInvalidity(
                txid1,
                1,
                mockBitcoinKitContract.getAddress(),
                custodian1ScriptHash,
                sweepUTXOInput1.inputTxId,
                sweepUTXOInput1.sourceIndex + 1,
                mockSimpleBitcoinVaultStateContract.getAddress()
            );

            expect(result).to.equal(true); // This transaction should be accepted as invalid because it spends the wrong source index of the sweep UTXO
        });

        it("Should accept invalid spend claim where all self-contained validity checks pass but input 0 is from a transaction with 1 input but only 1 output so cannot be valid withdrawal (or sweep)", async function () {
            const { utxoLogicHelperContract, mockSimpleBitcoinVaultStateContract, 
                mockBitcoinKitContract, testUtilsContract } = await loadFixture(deployUTXOHelperWithSupportingContracts);

            await mockBitcoinKitContract.setTransactionByTxId(invalidWithdrawalSpendOfSweepUtxo1_1_txid, invalidWithdrawalSpendOfSweepUtxo1_1);

            await mockBitcoinKitContract.setTransactionByTxId(txid1, validConfirmedDepositInvalidSpend6);

            await mockSimpleBitcoinVaultStateContract.setCollectableFees(validConfirmedDepositInvalidSpend6.inputs[1].inputTxId, 10000);
            await mockSimpleBitcoinVaultStateContract.setDepositOutputIndex(validConfirmedDepositInvalidSpend6.inputs[1].inputTxId, validConfirmedDepositInvalidSpend6.inputs[1].sourceIndex);

            custodian1ScriptHash = await testUtilsContract.calculateScriptHash(custodianScript1);

            result = await utxoLogicHelperContract.checkConfirmedDepositSpendInvalidity(
                txid1,
                1,
                mockBitcoinKitContract.getAddress(),
                custodian1ScriptHash,
                sweepUTXOInput1.inputTxId,
                sweepUTXOInput1.sourceIndex,
                mockSimpleBitcoinVaultStateContract.getAddress()
            );

            // This transaction should be accepted as invalid because it's first input must be connected to the current sweep
            // through traversal, but it spends a previous output from a transaction that despite spending the current sweep UTXO
            // correctly only has one input meaning it could only be a withdrawal, but only has one output meaning it could not
            // be a valid withdrawal.
            expect(result).to.equal(true); 
        });

        it("Should accept invalid spend claim where all self-contained validity checks pass but input 0 is from a transaction with 1 input but 3 outputs so cannot be valid withdrawal (or sweep)", async function () {
            const { utxoLogicHelperContract, mockSimpleBitcoinVaultStateContract, 
                mockBitcoinKitContract, testUtilsContract } = await loadFixture(deployUTXOHelperWithSupportingContracts);

            await mockBitcoinKitContract.setTransactionByTxId(invalidWithdrawalSpendOfSweepUtxo1_2_txid, invalidWithdrawalSpendOfSweepUtxo1_2);

            await mockBitcoinKitContract.setTransactionByTxId(txid1, validConfirmedDepositInvalidSpend7);

            await mockSimpleBitcoinVaultStateContract.setCollectableFees(validConfirmedDepositInvalidSpend7.inputs[1].inputTxId, 10000);
            await mockSimpleBitcoinVaultStateContract.setDepositOutputIndex(validConfirmedDepositInvalidSpend7.inputs[1].inputTxId, validConfirmedDepositInvalidSpend7.inputs[1].sourceIndex);

            custodian1ScriptHash = await testUtilsContract.calculateScriptHash(custodianScript1);

            result = await utxoLogicHelperContract.checkConfirmedDepositSpendInvalidity(
                txid1,
                1,
                mockBitcoinKitContract.getAddress(),
                custodian1ScriptHash,
                sweepUTXOInput1.inputTxId,
                sweepUTXOInput1.sourceIndex,
                mockSimpleBitcoinVaultStateContract.getAddress()
            );

            // This transaction should be accepted as invalid because it's first input must be connected to the current sweep
            // through traversal, but it spends a previous output from a transaction that despite spending the current sweep UTXO
            // correctly only has one input meaning it could only be a withdrawal, but has three outputs meaning it could not
            // be a valid withdrawal.
            expect(result).to.equal(true); 
        });

        it("Should accept invalid spend claim where all self-contained validity checks pass but input 0 is from a transaction with withdrawal geometry but input index is 0 which isn't withdrawal sweep output index", async function () {
            const { utxoLogicHelperContract, mockSimpleBitcoinVaultStateContract, 
                mockBitcoinKitContract, testUtilsContract } = await loadFixture(deployUTXOHelperWithSupportingContracts);

            await mockBitcoinKitContract.setTransactionByTxId(invalidWithdrawalSpendOfSweepUtxo1_3_txid, invalidWithdrawalSpendOfSweepUtxo1_3);

            await mockBitcoinKitContract.setTransactionByTxId(txid1, validConfirmedDepositInvalidSpend8);

            await mockSimpleBitcoinVaultStateContract.setCollectableFees(validConfirmedDepositInvalidSpend8.inputs[1].inputTxId, 10000);
            await mockSimpleBitcoinVaultStateContract.setDepositOutputIndex(validConfirmedDepositInvalidSpend8.inputs[1].inputTxId, validConfirmedDepositInvalidSpend8.inputs[1].sourceIndex);

            custodian1ScriptHash = await testUtilsContract.calculateScriptHash(custodianScript1);

            result = await utxoLogicHelperContract.checkConfirmedDepositSpendInvalidity(
                txid1,
                1,
                mockBitcoinKitContract.getAddress(),
                custodian1ScriptHash,
                sweepUTXOInput1.inputTxId,
                sweepUTXOInput1.sourceIndex,
                mockSimpleBitcoinVaultStateContract.getAddress()
            );

            // This transaction should be accepted as invalid because it's first input must be connected to the current sweep
            // through traversal, but it spends a previous output from a transaction that despite spending the current sweep UTXO
            // correctly only has one input and two outputs meaning it could only be a withdrawal, but the spent sweep has a
            // source index of 0
            expect(result).to.equal(true); 
        });

        it("Should accept invalid spend claim where all self-contained validity checks pass but input 0 is from a transaction with more than 8 inputs", async function () {
            const { utxoLogicHelperContract, mockSimpleBitcoinVaultStateContract, 
                mockBitcoinKitContract, testUtilsContract } = await loadFixture(deployUTXOHelperWithSupportingContracts);

            await mockBitcoinKitContract.setTransactionByTxId(invalidSweepSpendOfSweepUtxo1_1_txid, invalidSweepSpendOfSweepUtxo1_1);

            await mockBitcoinKitContract.setTransactionByTxId(txid1, validConfirmedDepositInvalidSpend9);

            await mockSimpleBitcoinVaultStateContract.setCollectableFees(validConfirmedDepositInvalidSpend9.inputs[1].inputTxId, 5000);
            await mockSimpleBitcoinVaultStateContract.setDepositOutputIndex(validConfirmedDepositInvalidSpend9.inputs[1].inputTxId, validConfirmedDepositInvalidSpend9.inputs[1].sourceIndex);

            custodian1ScriptHash = await testUtilsContract.calculateScriptHash(custodianScript1);

            result = await utxoLogicHelperContract.checkConfirmedDepositSpendInvalidity(
                txid1,
                1,
                mockBitcoinKitContract.getAddress(),
                custodian1ScriptHash,
                sweepUTXOInput1.inputTxId,
                sweepUTXOInput1.sourceIndex,
                mockSimpleBitcoinVaultStateContract.getAddress()
            );

            // This transaction should be accepted as invalid because it's first input must be connected to the current sweep
            // through traversal, but it spends a previous output from a transaction that despite spending the current sweep UTXO
            // has 9 inputs which could not be a valid sweep transaction
            expect(result).to.equal(true); 
        });

        it("Should accept invalid spend claim where all self-contained validity checks pass but input 0 is from a transaction with more than 1 input and more than 1 output", async function () {
            const { utxoLogicHelperContract, mockSimpleBitcoinVaultStateContract, 
                mockBitcoinKitContract, testUtilsContract } = await loadFixture(deployUTXOHelperWithSupportingContracts);

            await mockBitcoinKitContract.setTransactionByTxId(invalidSweepSpendOfSweepUtxo1_2_txid, invalidSweepSpendOfSweepUtxo1_2);

            await mockBitcoinKitContract.setTransactionByTxId(txid1, validConfirmedDepositInvalidSpend10);

            await mockSimpleBitcoinVaultStateContract.setCollectableFees(validConfirmedDepositInvalidSpend10.inputs[1].inputTxId, 5000);
            await mockSimpleBitcoinVaultStateContract.setDepositOutputIndex(validConfirmedDepositInvalidSpend10.inputs[1].inputTxId, validConfirmedDepositInvalidSpend10.inputs[1].sourceIndex);

            custodian1ScriptHash = await testUtilsContract.calculateScriptHash(custodianScript1);

            result = await utxoLogicHelperContract.checkConfirmedDepositSpendInvalidity(
                txid1,
                1,
                mockBitcoinKitContract.getAddress(),
                custodian1ScriptHash,
                sweepUTXOInput1.inputTxId,
                sweepUTXOInput1.sourceIndex,
                mockSimpleBitcoinVaultStateContract.getAddress()
            );

            // This transaction should be accepted as invalid because it's first input must be connected to the current sweep
            // through traversal, but it spends a previous output from a transaction that despite spending the current sweep UTXO
            // correctly has 5 inputs but has two outputs making it an invalid potential sweep
            expect(result).to.equal(true); 
        });

        it("Should reject invalid spend claim where all self-contained validity checks pass and input 0 is from a potentially valid withdrawal transaction", async function () {
            const { utxoLogicHelperContract, mockSimpleBitcoinVaultStateContract, 
                mockBitcoinKitContract, testUtilsContract } = await loadFixture(deployUTXOHelperWithSupportingContracts);

            await mockBitcoinKitContract.setTransactionByTxId(validWithdrawalSpendOfSweepUtxo1_1_txid, validWithdrawalSpendOfSweepUtxo1_1);

            await mockBitcoinKitContract.setTransactionByTxId(txid1, invalidConfirmedDepositInvalidSpend6);

            await mockSimpleBitcoinVaultStateContract.setCollectableFees(invalidConfirmedDepositInvalidSpend6.inputs[1].inputTxId, 5000);
            await mockSimpleBitcoinVaultStateContract.setDepositOutputIndex(invalidConfirmedDepositInvalidSpend6.inputs[1].inputTxId, invalidConfirmedDepositInvalidSpend6.inputs[1].sourceIndex);

            custodian1ScriptHash = await testUtilsContract.calculateScriptHash(custodianScript1);

            result = await utxoLogicHelperContract.checkConfirmedDepositSpendInvalidity(
                txid1,
                1,
                mockBitcoinKitContract.getAddress(),
                custodian1ScriptHash,
                sweepUTXOInput1.inputTxId,
                sweepUTXOInput1.sourceIndex,
                mockSimpleBitcoinVaultStateContract.getAddress()
            );

            // This transaction should be accepted as invalid because it's first input must be connected to the current sweep
            // through traversal, but it spends a previous output from a transaction that despite spending the current sweep UTXO
            // correctly has 5 inputs but has two outputs making it an invalid potential sweep
            expect(result).to.equal(false); 
        });


        it("Should reject invalid spend claim where all self-contained validity checks pass and input 0 is from a potentially valid sweep transaction", async function () {
            const { utxoLogicHelperContract, mockSimpleBitcoinVaultStateContract, 
                mockBitcoinKitContract, testUtilsContract } = await loadFixture(deployUTXOHelperWithSupportingContracts);

            await mockBitcoinKitContract.setTransactionByTxId(validSweepSpendOfSweepUtxo1_1_txid, validSweepSpendOfSweepUtxo1_1);

            await mockBitcoinKitContract.setTransactionByTxId(txid1, invalidConfirmedDepositInvalidSpend7);

            await mockSimpleBitcoinVaultStateContract.setCollectableFees(invalidConfirmedDepositInvalidSpend7.inputs[1].inputTxId, 5000);
            await mockSimpleBitcoinVaultStateContract.setDepositOutputIndex(invalidConfirmedDepositInvalidSpend7.inputs[1].inputTxId, invalidConfirmedDepositInvalidSpend7.inputs[1].sourceIndex);

            custodian1ScriptHash = await testUtilsContract.calculateScriptHash(custodianScript1);

            result = await utxoLogicHelperContract.checkConfirmedDepositSpendInvalidity(
                txid1,
                1,
                mockBitcoinKitContract.getAddress(),
                custodian1ScriptHash,
                sweepUTXOInput1.inputTxId,
                sweepUTXOInput1.sourceIndex,
                mockSimpleBitcoinVaultStateContract.getAddress()
            );

            // This transaction should be accepted as invalid because it's first input must be connected to the current sweep
            // through traversal, but it spends a previous output from a transaction that despite spending the current sweep UTXO
            // correctly has 5 inputs but has two outputs making it an invalid potential sweep
            expect(result).to.equal(false); 
        });
      });
  });
  