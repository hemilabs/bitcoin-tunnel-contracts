const {
    time,
    loadFixture,
  } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
  const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
  const { expect } = require("chai");



  const withdrawal1Script = "0x7777777755449911aabb77cc33ddee00cc88aa1100cc55dd";
  const withdrawalUser1EVMAddress = "0xdd00aaaadd00aaaadd00aaaadd00aaaadd00aaaa"
  
  const withdrawal1 = {
    withdrawalCounter: 0,
    amount: 10000000,
    fee: 30000,
    timestampRequested: 500,
    destinationScript: withdrawal1Script,
    evmOriginator: withdrawalUser1EVMAddress
}
  
  describe("SimpleBitcoinVaultState", function () {
    async function deployMockSimpleBitcoinVault() {
        const [owner] = await ethers.getSigners();
    
        const MockSimpleBitcoinVault = await ethers.getContractFactory("MockSimpleBitcoinVault");
        const mockSimpleBitcoinVaultContract = await MockSimpleBitcoinVault.deploy();
    
        return { mockSimpleBitcoinVaultContract };
    }

    async function deployMockBitcoinKit() {
        const MockBitcoinKit = await ethers.getContractFactory("MockBitcoinKit");
        const mockBitcoinKitContract = await MockBitcoinKit.deploy();
    
        return { mockBitcoinKitContract };
    }

    async function deployMockCollateralToken() {
        const MockCollateralToken = await ethers.getContractFactory("MockCollateralToken");
        const mockCollateralTokenContract = await MockCollateralToken.deploy();
    
        return { mockCollateralTokenContract };
    }


    async function deployDummyPriceOracle() {
        const [oracleAdmin, priceAdmin ] = await ethers.getSigners();

        const { mockCollateralTokenContract } = await deployMockCollateralToken();

        // ERC20 assetContract, uint256 initialPrice, address initialOracleAdmin, address initialPriceAdmin
        const DummyPriceOracle = await ethers.getContractFactory("DummyPriceOracle");
        const dummyPriceOracleContract = await DummyPriceOracle.deploy(
            mockCollateralTokenContract,
            "30000000000000000000", // 18 decimals, so 30 tokens = 1 BTC
            oracleAdmin,
            priceAdmin
        );
    
        return { dummyPriceOracleContract, mockCollateralTokenContract, oracleAdmin, priceAdmin };
    }

    async function deploySimpleGlobalVaultConfig() {
        const [configAdmin] = await ethers.getSigners();

        const { mockBitcoinKitContract } = await deployMockBitcoinKit();

        const { dummyPriceOracleContract, mockCollateralTokenContract, oracleAdmin, priceAdmin } = await deployDummyPriceOracle();
    
        const SimpleGlobalVaultConfig = await ethers.getContractFactory("SimpleGlobalVaultConfig");
        const simpleGlobalVaultConfigContract = await SimpleGlobalVaultConfig.deploy(
            configAdmin,
            configAdmin, // vault deprecation admin
            20, // min deposit fee bp
            100, // max deposit fee bps
            30, // min withdrawal fee bps
            110, // max withdrawal fee bps
            mockBitcoinKitContract,
            mockCollateralTokenContract,
            dummyPriceOracleContract,
            "60000000000000000000", // 60 tokens worth 2 BTC at initial oracle price
            130, // soft collateralization threshold
            110 // hard collateralization threshold
        );
    
        return { simpleGlobalVaultConfigContract, mockBitcoinKitContract, dummyPriceOracleContract,
             mockCollateralTokenContract, configAdmin, oracleAdmin, priceAdmin };
    }


    async function deployHBTCToken() {
        const [hBTCTokenMinter] = await ethers.getSigners();

        const BTCToken = await ethers.getContractFactory("BTCToken");
        const BTCTokenContract = await BTCToken.deploy(hBTCTokenMinter);
    
        return { BTCTokenContract, hBTCTokenMinter };
    }

    async function deployTestUtils() {
        const TestUtils = await ethers.getContractFactory("TestUtils");
        const testUtilsContract = await TestUtils.deploy();
    
        return { testUtilsContract };
    }


    async function deploySimpleBitcoinVaultStateWithSupportingContracts() {
      const [deployer, vaultOperatorAdmin, notOwner1] = await ethers.getSigners();

      const { mockSimpleBitcoinVaultContract } = await deployMockSimpleBitcoinVault();

      const { simpleGlobalVaultConfigContract, mockBitcoinKitContract, dummyPriceOracleContract,
        mockCollateralTokenContract, configAdmin, oracleAdmin, priceAdmin } = await deploySimpleGlobalVaultConfig()
    
      const { BTCTokenContract, hBTCTokenMinter } = await deployHBTCToken();

      const { testUtilsContract } = await deployTestUtils();

      const SimpleBitcoinVaultState = await ethers.getContractFactory("SimpleBitcoinVaultState");
      const simpleBitcoinVaultStateContract = await SimpleBitcoinVaultState.deploy(
        mockSimpleBitcoinVaultContract, // simulated parent vault
        vaultOperatorAdmin,
        simpleGlobalVaultConfigContract,
        BTCTokenContract
      );

      mockSimpleBitcoinVaultContract.setVaultStateChild(simpleBitcoinVaultStateContract);
  
      return { mockSimpleBitcoinVaultContract, simpleGlobalVaultConfigContract, mockBitcoinKitContract,
        dummyPriceOracleContract, mockCollateralTokenContract, configAdmin, oracleAdmin, priceAdmin,
        BTCTokenContract, hBTCTokenMinter, simpleBitcoinVaultStateContract, vaultOperatorAdmin, notOwner1,
        testUtilsContract };
    }
  
    describe("Deployment", function () {
      it("Should set operator admin correctly", async function () {
        const { mockSimpleBitcoinVaultContract, simpleGlobalVaultConfigContract, mockBitcoinKitContract,
            dummyPriceOracleContract, mockCollateralTokenContract, configAdmin, oracleAdmin, priceAdmin,
            BTCTokenContract, hBTCTokenMinter, simpleBitcoinVaultStateContract, vaultOperatorAdmin, notOwner1 }
             = await loadFixture(deploySimpleBitcoinVaultStateWithSupportingContracts);

        expect(await simpleBitcoinVaultStateContract.operatorAdmin()).to.equal(vaultOperatorAdmin);
      });

      it("Should set parent simple bitcoin vault correctly", async function () {
        const { mockSimpleBitcoinVaultContract, simpleGlobalVaultConfigContract, mockBitcoinKitContract,
            dummyPriceOracleContract, mockCollateralTokenContract, configAdmin, oracleAdmin, priceAdmin,
            BTCTokenContract, hBTCTokenMinter, simpleBitcoinVaultStateContract, vaultOperatorAdmin, notOwner1 }
             = await loadFixture(deploySimpleBitcoinVaultStateWithSupportingContracts);

        expect(await simpleBitcoinVaultStateContract.getParentSimpleBitcoinVault()).to.equal(mockSimpleBitcoinVaultContract);
      });

      it("Should set soft collateralization threshold correctly", async function () {
        const { mockSimpleBitcoinVaultContract, simpleGlobalVaultConfigContract, mockBitcoinKitContract,
            dummyPriceOracleContract, mockCollateralTokenContract, configAdmin, oracleAdmin, priceAdmin,
            BTCTokenContract, hBTCTokenMinter, simpleBitcoinVaultStateContract, vaultOperatorAdmin, notOwner1 }
             = await loadFixture(deploySimpleBitcoinVaultStateWithSupportingContracts);

        expect(await simpleBitcoinVaultStateContract.softCollateralizationThreshold()).to.equal(130);
      });

      it("Should not have pending soft collateralization threshold", async function () {
        const { mockSimpleBitcoinVaultContract, simpleGlobalVaultConfigContract, mockBitcoinKitContract,
            dummyPriceOracleContract, mockCollateralTokenContract, configAdmin, oracleAdmin, priceAdmin,
            BTCTokenContract, hBTCTokenMinter, simpleBitcoinVaultStateContract, vaultOperatorAdmin, notOwner1 }
             = await loadFixture(deploySimpleBitcoinVaultStateWithSupportingContracts);

        expect(await simpleBitcoinVaultStateContract.pendingSoftCollateralizationThreshold()).to.equal(0);
      });

      it("Should not have pending soft collateralization threshold update time", async function () {
        const { mockSimpleBitcoinVaultContract, simpleGlobalVaultConfigContract, mockBitcoinKitContract,
            dummyPriceOracleContract, mockCollateralTokenContract, configAdmin, oracleAdmin, priceAdmin,
            BTCTokenContract, hBTCTokenMinter, simpleBitcoinVaultStateContract, vaultOperatorAdmin, notOwner1 }
             = await loadFixture(deploySimpleBitcoinVaultStateWithSupportingContracts);

        expect(await simpleBitcoinVaultStateContract.pendingSoftCollateralizationThresholdUpdateTime()).to.equal(0);
      });

      it("Should set hard collateralization threshold correctly", async function () {
        const { mockSimpleBitcoinVaultContract, simpleGlobalVaultConfigContract, mockBitcoinKitContract,
            dummyPriceOracleContract, mockCollateralTokenContract, configAdmin, oracleAdmin, priceAdmin,
            BTCTokenContract, hBTCTokenMinter, simpleBitcoinVaultStateContract, vaultOperatorAdmin, notOwner1 }
             = await loadFixture(deploySimpleBitcoinVaultStateWithSupportingContracts);

        expect(await simpleBitcoinVaultStateContract.hardCollateralizationThreshold()).to.equal(110);
      });

      it("Should set min deposit fee sats correctly", async function () {
        const { mockSimpleBitcoinVaultContract, simpleGlobalVaultConfigContract, mockBitcoinKitContract,
            dummyPriceOracleContract, mockCollateralTokenContract, configAdmin, oracleAdmin, priceAdmin,
            BTCTokenContract, hBTCTokenMinter, simpleBitcoinVaultStateContract, vaultOperatorAdmin, notOwner1 }
             = await loadFixture(deploySimpleBitcoinVaultStateWithSupportingContracts);

        expect(await simpleBitcoinVaultStateContract.minDepositFeeSats()).to.equal(
            await simpleGlobalVaultConfigContract.minDepositFeeSats());
      });

      it("Should not have pending min deposit fee sats", async function () {
        const { mockSimpleBitcoinVaultContract, simpleGlobalVaultConfigContract, mockBitcoinKitContract,
            dummyPriceOracleContract, mockCollateralTokenContract, configAdmin, oracleAdmin, priceAdmin,
            BTCTokenContract, hBTCTokenMinter, simpleBitcoinVaultStateContract, vaultOperatorAdmin, notOwner1 }
             = await loadFixture(deploySimpleBitcoinVaultStateWithSupportingContracts);

        expect(await simpleBitcoinVaultStateContract.pendingMinDepositFeeSats()).to.equal(0);
      });

      it("Should not have pending min deposit fee sats update time", async function () {
        const { mockSimpleBitcoinVaultContract, simpleGlobalVaultConfigContract, mockBitcoinKitContract,
            dummyPriceOracleContract, mockCollateralTokenContract, configAdmin, oracleAdmin, priceAdmin,
            BTCTokenContract, hBTCTokenMinter, simpleBitcoinVaultStateContract, vaultOperatorAdmin, notOwner1 }
             = await loadFixture(deploySimpleBitcoinVaultStateWithSupportingContracts);

        expect(await simpleBitcoinVaultStateContract.pendingMinDepositFeeSatsUpdateTime()).to.equal(0);
      });

      it("Should set deposit fee bps correctly", async function () {
        const { mockSimpleBitcoinVaultContract, simpleGlobalVaultConfigContract, mockBitcoinKitContract,
            dummyPriceOracleContract, mockCollateralTokenContract, configAdmin, oracleAdmin, priceAdmin,
            BTCTokenContract, hBTCTokenMinter, simpleBitcoinVaultStateContract, vaultOperatorAdmin, notOwner1 }
             = await loadFixture(deploySimpleBitcoinVaultStateWithSupportingContracts);

        expect(await simpleBitcoinVaultStateContract.depositFeeBps()).to.equal(
            await simpleGlobalVaultConfigContract.minDepositFeeBasisPoints());
      });

      it("Should not have pending deposit fee bps", async function () {
        const { mockSimpleBitcoinVaultContract, simpleGlobalVaultConfigContract, mockBitcoinKitContract,
            dummyPriceOracleContract, mockCollateralTokenContract, configAdmin, oracleAdmin, priceAdmin,
            BTCTokenContract, hBTCTokenMinter, simpleBitcoinVaultStateContract, vaultOperatorAdmin, notOwner1 }
             = await loadFixture(deploySimpleBitcoinVaultStateWithSupportingContracts);

        expect(await simpleBitcoinVaultStateContract.pendingDepositFeeBps()).to.equal(0);
      });

      it("Should not have pending deposit fee bps update time", async function () {
        const { mockSimpleBitcoinVaultContract, simpleGlobalVaultConfigContract, mockBitcoinKitContract,
            dummyPriceOracleContract, mockCollateralTokenContract, configAdmin, oracleAdmin, priceAdmin,
            BTCTokenContract, hBTCTokenMinter, simpleBitcoinVaultStateContract, vaultOperatorAdmin, notOwner1 }
             = await loadFixture(deploySimpleBitcoinVaultStateWithSupportingContracts);

        expect(await simpleBitcoinVaultStateContract.pendingDepositFeeBpsUpdateTime()).to.equal(0);
      });

      it("Should set min withdrawal fee sats correctly", async function () {
        const { mockSimpleBitcoinVaultContract, simpleGlobalVaultConfigContract, mockBitcoinKitContract,
            dummyPriceOracleContract, mockCollateralTokenContract, configAdmin, oracleAdmin, priceAdmin,
            BTCTokenContract, hBTCTokenMinter, simpleBitcoinVaultStateContract, vaultOperatorAdmin, notOwner1 }
             = await loadFixture(deploySimpleBitcoinVaultStateWithSupportingContracts);

        expect(await simpleBitcoinVaultStateContract.minWithdrawalFeeSats()).to.equal(
            await simpleGlobalVaultConfigContract.minWithdrawalFeeSats());
      });

      it("Should not have pending min withdrawal fee sats", async function () {
        const { mockSimpleBitcoinVaultContract, simpleGlobalVaultConfigContract, mockBitcoinKitContract,
            dummyPriceOracleContract, mockCollateralTokenContract, configAdmin, oracleAdmin, priceAdmin,
            BTCTokenContract, hBTCTokenMinter, simpleBitcoinVaultStateContract, vaultOperatorAdmin, notOwner1 }
             = await loadFixture(deploySimpleBitcoinVaultStateWithSupportingContracts);

        expect(await simpleBitcoinVaultStateContract.pendingMinWithdrawalFeeSats()).to.equal(0);
      });

      it("Should not have pending min withdrawal fee sats update time", async function () {
        const { mockSimpleBitcoinVaultContract, simpleGlobalVaultConfigContract, mockBitcoinKitContract,
            dummyPriceOracleContract, mockCollateralTokenContract, configAdmin, oracleAdmin, priceAdmin,
            BTCTokenContract, hBTCTokenMinter, simpleBitcoinVaultStateContract, vaultOperatorAdmin, notOwner1 }
             = await loadFixture(deploySimpleBitcoinVaultStateWithSupportingContracts);

        expect(await simpleBitcoinVaultStateContract.pendingMinWithdrawalFeeSatsUpdateTime()).to.equal(0);
      });

      it("Should set withdrawal fee bps correctly", async function () {
        const { mockSimpleBitcoinVaultContract, simpleGlobalVaultConfigContract, mockBitcoinKitContract,
            dummyPriceOracleContract, mockCollateralTokenContract, configAdmin, oracleAdmin, priceAdmin,
            BTCTokenContract, hBTCTokenMinter, simpleBitcoinVaultStateContract, vaultOperatorAdmin, notOwner1 }
             = await loadFixture(deploySimpleBitcoinVaultStateWithSupportingContracts);

        expect(await simpleBitcoinVaultStateContract.withdrawalFeeBps()).to.equal(
            await simpleGlobalVaultConfigContract.minWithdrawalFeeBasisPoints());
      });

      it("Should not have pending withdrawal fee bps", async function () {
        const { mockSimpleBitcoinVaultContract, simpleGlobalVaultConfigContract, mockBitcoinKitContract,
            dummyPriceOracleContract, mockCollateralTokenContract, configAdmin, oracleAdmin, priceAdmin,
            BTCTokenContract, hBTCTokenMinter, simpleBitcoinVaultStateContract, vaultOperatorAdmin, notOwner1 }
             = await loadFixture(deploySimpleBitcoinVaultStateWithSupportingContracts);

        expect(await simpleBitcoinVaultStateContract.pendingWithdrawalFeeBps()).to.equal(0);
      });

      it("Should not have pending withdrawal fee bps update time", async function () {
        const { mockSimpleBitcoinVaultContract, simpleGlobalVaultConfigContract, mockBitcoinKitContract,
            dummyPriceOracleContract, mockCollateralTokenContract, configAdmin, oracleAdmin, priceAdmin,
            BTCTokenContract, hBTCTokenMinter, simpleBitcoinVaultStateContract, vaultOperatorAdmin, notOwner1 }
             = await loadFixture(deploySimpleBitcoinVaultStateWithSupportingContracts);

        expect(await simpleBitcoinVaultStateContract.pendingWithdrawalFeeBpsUpdateTime()).to.equal(0);
      });
    });

    describe("Fee Calculation", function () {
        it("Should calculate fee on small deposit to be minimum sats fee", async function () {
          const { mockSimpleBitcoinVaultContract, simpleGlobalVaultConfigContract, mockBitcoinKitContract,
              dummyPriceOracleContract, mockCollateralTokenContract, configAdmin, oracleAdmin, priceAdmin,
              BTCTokenContract, hBTCTokenMinter, simpleBitcoinVaultStateContract, vaultOperatorAdmin, notOwner1 }
               = await loadFixture(deploySimpleBitcoinVaultStateWithSupportingContracts);
  
          expect(await simpleBitcoinVaultStateContract.calculateDepositFee(1)).to.equal(
            await simpleBitcoinVaultStateContract.minDepositFeeSats()
          );
        });

        it("Should calculate fee on large deposit to be correct based on bps", async function () {
            const { mockSimpleBitcoinVaultContract, simpleGlobalVaultConfigContract, mockBitcoinKitContract,
                dummyPriceOracleContract, mockCollateralTokenContract, configAdmin, oracleAdmin, priceAdmin,
                BTCTokenContract, hBTCTokenMinter, simpleBitcoinVaultStateContract, vaultOperatorAdmin, notOwner1 }
                 = await loadFixture(deploySimpleBitcoinVaultStateWithSupportingContracts);

            deposit = 10000000;
            fee = deposit * 20 / 10000;
    
            expect(await simpleBitcoinVaultStateContract.calculateDepositFee(deposit)).to.equal(fee);
          });

        it("Should calculate fee on small withdrawal to be minimum sats fee", async function () {
            const { mockSimpleBitcoinVaultContract, simpleGlobalVaultConfigContract, mockBitcoinKitContract,
                dummyPriceOracleContract, mockCollateralTokenContract, configAdmin, oracleAdmin, priceAdmin,
                BTCTokenContract, hBTCTokenMinter, simpleBitcoinVaultStateContract, vaultOperatorAdmin, notOwner1 }
                 = await loadFixture(deploySimpleBitcoinVaultStateWithSupportingContracts);
    
            expect(await simpleBitcoinVaultStateContract.calculateDepositFee(1)).to.equal(
              await simpleBitcoinVaultStateContract.minWithdrawalFeeSats()
            );
          });

        it("Should calculate fee on large withdrawal to be correct based on bps", async function () {
            const { mockSimpleBitcoinVaultContract, simpleGlobalVaultConfigContract, mockBitcoinKitContract,
                dummyPriceOracleContract, mockCollateralTokenContract, configAdmin, oracleAdmin, priceAdmin,
                BTCTokenContract, hBTCTokenMinter, simpleBitcoinVaultStateContract, vaultOperatorAdmin, notOwner1 }
                 = await loadFixture(deploySimpleBitcoinVaultStateWithSupportingContracts);

            withdrawal = 10000000;
            fee = withdrawal * 30 / 10000;
    
            expect(await simpleBitcoinVaultStateContract.calculateWithdrawalFee(withdrawal)).to.equal(fee);
          });
      });



    describe("Pending Withdrawal Storage", function () {
        it("Should save single withdrawal correctly", async function () {
          const { mockSimpleBitcoinVaultContract, simpleGlobalVaultConfigContract, mockBitcoinKitContract,
              dummyPriceOracleContract, mockCollateralTokenContract, configAdmin, oracleAdmin, priceAdmin,
              BTCTokenContract, hBTCTokenMinter, simpleBitcoinVaultStateContract, vaultOperatorAdmin, notOwner1,
              testUtilsContract }
               = await loadFixture(deploySimpleBitcoinVaultStateWithSupportingContracts);

          await mockSimpleBitcoinVaultContract.setVaultStateChild(simpleBitcoinVaultStateContract);

          await mockSimpleBitcoinVaultContract.callInternalInitializeWithdrawal(
            10000000, 30000, 100, withdrawal1Script, withdrawalUser1EVMAddress);

          withdrawalFromIndex = await simpleBitcoinVaultStateContract.getWithdrawal(0);

          expect(withdrawalFromIndex.amount).to.equal(10000000);

          withdrawalScriptHash = await testUtilsContract.calculateScriptHash(withdrawal1Script);

          matchFound = await simpleBitcoinVaultStateContract.checkPendingWithdrawalsForMatch(withdrawalScriptHash, 10000000 - 30000);

          expect(matchFound).to.equal(true);
        });
      });
  });
  