const {
    time,
    loadFixture,
  } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
  const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
  const { expect } = require("chai");



  const withdrawal1Script = "0x7777777755449911aabb77cc33ddee00cc88aa1100cc55dd";
  const withdrawalUser1EVMAddress = "0xdd00aaaadd00aaaadd00aaaadd00aaaadd00aaaa";
  const withdrawal1FulfillmentTxid = "0x0101010101010101010101010101010101010101010101010101010101010101";


  const withdrawal2Script = "0xab78a8cd3e7f8ca24986befaced89745accc0011339944";
  const withdrawalUser2EVMAddress = "0xaa0011bbeeffddcc99000099ccddffeebb1100aa";
  const withdrawal2FulfillmentTxid = "0x0202020202020202020202020202020202020202020202020202020202020202";

  const withdrawal3Script = "0x2dad66a570db3dcd9648b44496fd83ba89bfc6ea29f792402e38f96c";
  const withdrawalUser3EVMAddress = "0xc4f271d72f7ed3196e8716020f277a2216dc487f";
  const withdrawal3FulfillmentTxid = "0x0303030303030303030303030303030303030303030303030303030303030303";
  
  const withdrawal1 = {
    withdrawalCounter: 0,
    amount: 10000000,
    fee: 30000,
    timestampRequested: 100,
    destinationScript: withdrawal1Script,
    evmOriginator: withdrawalUser1EVMAddress
  }

  const withdrawal2 = {
    withdrawalCounter: 1,
    amount: 20000000,
    fee: 60000,
    timestampRequested: 150,
    destinationScript: withdrawal2Script,
    evmOriginator: withdrawalUser2EVMAddress
  }

  const withdrawal3 = {
    withdrawalCounter: 2,
    amount: 489560798,
    fee: 1468682,
    timestampRequested: 400,
    destinationScript: withdrawal3Script,
    evmOriginator: withdrawalUser3EVMAddress
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

      await mockSimpleBitcoinVaultContract.setVaultStateChild(simpleBitcoinVaultStateContract);
  
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

    describe("Vault Administration", function () {
        it("Should update operator admin from parent vault correctly", async function () {
          const { mockSimpleBitcoinVaultContract, simpleGlobalVaultConfigContract, mockBitcoinKitContract,
              dummyPriceOracleContract, mockCollateralTokenContract, configAdmin, oracleAdmin, priceAdmin,
              BTCTokenContract, hBTCTokenMinter, simpleBitcoinVaultStateContract, vaultOperatorAdmin, notOwner1,
              testUtilsContract }
               = await loadFixture(deploySimpleBitcoinVaultStateWithSupportingContracts);

          operatorBefore = await simpleBitcoinVaultStateContract.operatorAdmin();
          expect(operatorBefore).to.equal(vaultOperatorAdmin);

          await mockSimpleBitcoinVaultContract.callUpdateOperatorAdmin(notOwner1);

          operatorAfter = await simpleBitcoinVaultStateContract.operatorAdmin();
          expect(operatorAfter).to.equal(notOwner1);
        });

        it("Should not allow an account other than operator admin to change soft collateralization threshold", async function () {
          const { mockSimpleBitcoinVaultContract, simpleGlobalVaultConfigContract, mockBitcoinKitContract,
              dummyPriceOracleContract, mockCollateralTokenContract, configAdmin, oracleAdmin, priceAdmin,
              BTCTokenContract, hBTCTokenMinter, simpleBitcoinVaultStateContract, vaultOperatorAdmin, notOwner1,
              testUtilsContract }
               = await loadFixture(deploySimpleBitcoinVaultStateWithSupportingContracts);

          await expect(simpleBitcoinVaultStateContract.connect(notOwner1)
          .changeSoftCollateralizationThreshold(140)).to.be.reverted;
        });

        it("Should not allow operator admin to set soft collateralization threshold lower than threshold set in shared config", async function () {
          const { mockSimpleBitcoinVaultContract, simpleGlobalVaultConfigContract, mockBitcoinKitContract,
              dummyPriceOracleContract, mockCollateralTokenContract, configAdmin, oracleAdmin, priceAdmin,
              BTCTokenContract, hBTCTokenMinter, simpleBitcoinVaultStateContract, vaultOperatorAdmin, notOwner1,
              testUtilsContract }
               = await loadFixture(deploySimpleBitcoinVaultStateWithSupportingContracts);

          await expect(simpleBitcoinVaultStateContract.connect(vaultOperatorAdmin)
          .changeSoftCollateralizationThreshold(129))
          .to.be.revertedWith("new soft collateralization threshold must be higher than or equal to minimum from config");
        });

        it("Should not allow operator admin to set soft collateralization threshold that is same as current", async function () {
          const { mockSimpleBitcoinVaultContract, simpleGlobalVaultConfigContract, mockBitcoinKitContract,
              dummyPriceOracleContract, mockCollateralTokenContract, configAdmin, oracleAdmin, priceAdmin,
              BTCTokenContract, hBTCTokenMinter, simpleBitcoinVaultStateContract, vaultOperatorAdmin, notOwner1,
              testUtilsContract }
               = await loadFixture(deploySimpleBitcoinVaultStateWithSupportingContracts);

          await expect(simpleBitcoinVaultStateContract.connect(vaultOperatorAdmin)
          .changeSoftCollateralizationThreshold(130))
          .to.be.revertedWith("new soft collateralization threshold is not different");
        });

        it("Should allow operator to raise and lower soft collateralization threshold immediately if vault is not live", async function () {
          const { mockSimpleBitcoinVaultContract, simpleGlobalVaultConfigContract, mockBitcoinKitContract,
              dummyPriceOracleContract, mockCollateralTokenContract, configAdmin, oracleAdmin, priceAdmin,
              BTCTokenContract, hBTCTokenMinter, simpleBitcoinVaultStateContract, vaultOperatorAdmin, notOwner1,
              testUtilsContract }
               = await loadFixture(deploySimpleBitcoinVaultStateWithSupportingContracts);

          // Set to "CREATING"
          await mockSimpleBitcoinVaultContract.setVaultStatus(0);

          expect(await mockSimpleBitcoinVaultContract.hasNeverGoneLive()).to.equal(true);

          // We first have to set it higher to then set it lower again, since at initialization it defaults
          // to the (minimum) values from the vault config
          await simpleBitcoinVaultStateContract.connect(vaultOperatorAdmin).changeSoftCollateralizationThreshold(140);

          // Sanity check that our mock parent contract return false for hasNeverGoneLive()
          expect(await mockSimpleBitcoinVaultContract.hasNeverGoneLive()).to.equal(true);

          // Make sure our change to 140 was actually accepted
          expect(await simpleBitcoinVaultStateContract.getSoftCollateralizationThreshold()).to.equal(140);

          await simpleBitcoinVaultStateContract.connect(vaultOperatorAdmin).changeSoftCollateralizationThreshold(135);

          // Make sure our lowering was accepted
          expect(await simpleBitcoinVaultStateContract.getSoftCollateralizationThreshold()).to.equal(135);

          // Raise it again
          await simpleBitcoinVaultStateContract.connect(vaultOperatorAdmin).changeSoftCollateralizationThreshold(150);

          // Make sure our final increase was accepted
          expect(await simpleBitcoinVaultStateContract.getSoftCollateralizationThreshold()).to.equal(150);
        });

        it("Should allow operator to immediately set a lower soft collateralization update when vault is live", async function () {
          const { mockSimpleBitcoinVaultContract, simpleGlobalVaultConfigContract, mockBitcoinKitContract,
              dummyPriceOracleContract, mockCollateralTokenContract, configAdmin, oracleAdmin, priceAdmin,
              BTCTokenContract, hBTCTokenMinter, simpleBitcoinVaultStateContract, vaultOperatorAdmin, notOwner1,
              testUtilsContract }
               = await loadFixture(deploySimpleBitcoinVaultStateWithSupportingContracts);

          // Set to "CREATING"
          await mockSimpleBitcoinVaultContract.setVaultStatus(0);

          expect(await mockSimpleBitcoinVaultContract.hasNeverGoneLive()).to.equal(true);

          // We first have to set it higher to then set it lower again, since at initialization it defaults
          // to the (minimum) values from the vault config
          await simpleBitcoinVaultStateContract.connect(vaultOperatorAdmin).changeSoftCollateralizationThreshold(140);

          // Make sure our change to 140 was actually accepted
          expect(await simpleBitcoinVaultStateContract.getSoftCollateralizationThreshold()).to.equal(140);

          // Now set to "LIVE"
          await mockSimpleBitcoinVaultContract.setVaultStatus(2);

          // Sanity check that our mock parent contract now returns true for hasNeverGoneLive()
          expect(await mockSimpleBitcoinVaultContract.hasNeverGoneLive()).to.equal(false);

          // Set a lower collateralization threshold
          await simpleBitcoinVaultStateContract.connect(vaultOperatorAdmin).changeSoftCollateralizationThreshold(135);

          // Make sure our lowering was accepted immediately
          expect(await simpleBitcoinVaultStateContract.getSoftCollateralizationThreshold()).to.equal(135);
        });

        it("Should allow operator to initiate a pending higher soft collateralization update when vault is live", async function () {
          const { mockSimpleBitcoinVaultContract, simpleGlobalVaultConfigContract, mockBitcoinKitContract,
              dummyPriceOracleContract, mockCollateralTokenContract, configAdmin, oracleAdmin, priceAdmin,
              BTCTokenContract, hBTCTokenMinter, simpleBitcoinVaultStateContract, vaultOperatorAdmin, notOwner1,
              testUtilsContract }
               = await loadFixture(deploySimpleBitcoinVaultStateWithSupportingContracts);

          // Set to "LIVE"
          await mockSimpleBitcoinVaultContract.setVaultStatus(2);

          expect(await mockSimpleBitcoinVaultContract.hasNeverGoneLive()).to.equal(false);

          timeBeforeIncrease = await time.latest();

          // Attempt an increase
          await simpleBitcoinVaultStateContract.connect(vaultOperatorAdmin).changeSoftCollateralizationThreshold(140);

          // Make sure our change to 140 was not yet accepted
          expect(await simpleBitcoinVaultStateContract.getSoftCollateralizationThreshold()).to.equal(130);

          // Make sure the pending change is set to our new value
          expect(await simpleBitcoinVaultStateContract.pendingSoftCollateralizationThreshold()).to.equal(140);

          // Make sure the update time is set
          expect(await simpleBitcoinVaultStateContract.pendingSoftCollateralizationThresholdUpdateTime()).to.be.greaterThan(0);

          activationDelay = await simpleBitcoinVaultStateContract.SOFT_COLLATERALIZATION_THRESHOLD_INCREASE_DELAY_SECONDS();

          // Make sure that soft collateralization threshold increase delay seconds is set as expected
          expect(activationDelay).to.be.equal(4 * 60 * 60);
          
          // Increase time to 15 seconds before the activation
          await time.increaseTo(timeBeforeIncrease + Number(activationDelay) - 15);

          // Ensure finalization fails since we are too early
          await expect(simpleBitcoinVaultStateContract.finalizeSoftCollateralizationThresholdUpdate())
          .to.be.revertedWith("not enough time has elapsed for collateralization threshold increase");

          // Make sure our change to 140 was STILL not yet accepted
          expect(await simpleBitcoinVaultStateContract.getSoftCollateralizationThreshold()).to.equal(130);

          // Increase time by 15 seconds, which should now allow activation
          await time.increaseTo(timeBeforeIncrease + Number(activationDelay));

          await simpleBitcoinVaultStateContract.finalizeSoftCollateralizationThresholdUpdate();

          // Make sure our update to 140 was now accepted
          expect(await simpleBitcoinVaultStateContract.getSoftCollateralizationThreshold()).to.equal(140);
        });

        it("Should allow operator to initiate a pending higher soft collateralization update then replace with lower update", async function () {
          const { mockSimpleBitcoinVaultContract, simpleGlobalVaultConfigContract, mockBitcoinKitContract,
              dummyPriceOracleContract, mockCollateralTokenContract, configAdmin, oracleAdmin, priceAdmin,
              BTCTokenContract, hBTCTokenMinter, simpleBitcoinVaultStateContract, vaultOperatorAdmin, notOwner1,
              testUtilsContract }
               = await loadFixture(deploySimpleBitcoinVaultStateWithSupportingContracts);

          // Set to "CREATING"
          await mockSimpleBitcoinVaultContract.setVaultStatus(0);

          expect(await mockSimpleBitcoinVaultContract.hasNeverGoneLive()).to.equal(true);

          // Increase threshold before activation when it is immediately allowed
          await simpleBitcoinVaultStateContract.connect(vaultOperatorAdmin).changeSoftCollateralizationThreshold(140);

          // Set to "LIVE"
          await mockSimpleBitcoinVaultContract.setVaultStatus(2);

          expect(await mockSimpleBitcoinVaultContract.hasNeverGoneLive()).to.equal(false);

          timeBeforeIncrease = await time.latest();
          activationDelay = await simpleBitcoinVaultStateContract.SOFT_COLLATERALIZATION_THRESHOLD_INCREASE_DELAY_SECONDS();

          // Attempt an increase to 145
          await simpleBitcoinVaultStateContract.connect(vaultOperatorAdmin).changeSoftCollateralizationThreshold(145);

          // Make sure our change to 145 was not yet accepted
          expect(await simpleBitcoinVaultStateContract.getSoftCollateralizationThreshold()).to.equal(140);

          // Make sure the pending change is set to our new value
          expect(await simpleBitcoinVaultStateContract.pendingSoftCollateralizationThreshold()).to.equal(145);

          // Make sure the update time is set
          expect(await simpleBitcoinVaultStateContract.pendingSoftCollateralizationThresholdUpdateTime()).to.be.greaterThan(0);

          // Attempt a decrease to 135 which should be immediately accepted
          await simpleBitcoinVaultStateContract.connect(vaultOperatorAdmin).changeSoftCollateralizationThreshold(135);

          // Make sure the decrease was immediately applied
          expect(await simpleBitcoinVaultStateContract.getSoftCollateralizationThreshold()).to.equal(135);

          // Make sure there is no pending update (previous increase to 145) set
          expect(await simpleBitcoinVaultStateContract.pendingSoftCollateralizationThreshold()).to.equal(0);
          expect(await simpleBitcoinVaultStateContract.pendingSoftCollateralizationThresholdUpdateTime()).to.equal(0);

          // Increase time to 30 seconds after the activation would have been allowed
          await time.increaseTo(timeBeforeIncrease + Number(activationDelay) + 30);

          // Ensure finalization fails since we are too early
          await expect(simpleBitcoinVaultStateContract.finalizeSoftCollateralizationThresholdUpdate())
          .to.be.revertedWith("no pending soft collateralization update is in progress");

          // Make sure the pending soft collateralization threshold is still set to 135
          expect(await simpleBitcoinVaultStateContract.getSoftCollateralizationThreshold()).to.equal(135);
        });

        it("Should reject operator setting min deposit fee sats lower than minimum in config", async function () {
          const { mockSimpleBitcoinVaultContract, simpleGlobalVaultConfigContract, mockBitcoinKitContract,
              dummyPriceOracleContract, mockCollateralTokenContract, configAdmin, oracleAdmin, priceAdmin,
              BTCTokenContract, hBTCTokenMinter, simpleBitcoinVaultStateContract, vaultOperatorAdmin, notOwner1,
              testUtilsContract }
               = await loadFixture(deploySimpleBitcoinVaultStateWithSupportingContracts);

          // Set to "CREATING"
          await mockSimpleBitcoinVaultContract.setVaultStatus(0);

          expect(await mockSimpleBitcoinVaultContract.hasNeverGoneLive()).to.equal(true);

          minConfig = await simpleGlobalVaultConfigContract.getMinDepositFeeSats();

          expect(minConfig).to.equal(10000);

          // Attempt to set too low
          await expect(simpleBitcoinVaultStateContract.connect(vaultOperatorAdmin).changeMinDepositFeeSats(9999))
          .to.be.revertedWith("new min deposit fee in sats must be >= the minimum deposit fee in sats from config");
        });

        it("Should reject operator setting min deposit fee sats higher than maximum in config", async function () {
          const { mockSimpleBitcoinVaultContract, simpleGlobalVaultConfigContract, mockBitcoinKitContract,
              dummyPriceOracleContract, mockCollateralTokenContract, configAdmin, oracleAdmin, priceAdmin,
              BTCTokenContract, hBTCTokenMinter, simpleBitcoinVaultStateContract, vaultOperatorAdmin, notOwner1,
              testUtilsContract }
               = await loadFixture(deploySimpleBitcoinVaultStateWithSupportingContracts);

          // Set to "CREATING"
          await mockSimpleBitcoinVaultContract.setVaultStatus(0);

          expect(await mockSimpleBitcoinVaultContract.hasNeverGoneLive()).to.equal(true);

          maxConfig = await simpleGlobalVaultConfigContract.getMaxDepositFeeSats();

          // By default min and max are the same
          expect(maxConfig).to.equal(10000);

          // Attempt to set too high
          await expect(simpleBitcoinVaultStateContract.connect(vaultOperatorAdmin).changeMinDepositFeeSats(10001))
          .to.be.revertedWith("new min deposit fee in sats must be <= the maximum deposit fee in sats from config");
        });

        it("Should reject operator setting min deposit fee sats to its existing value", async function () {
          const { mockSimpleBitcoinVaultContract, simpleGlobalVaultConfigContract, mockBitcoinKitContract,
              dummyPriceOracleContract, mockCollateralTokenContract, configAdmin, oracleAdmin, priceAdmin,
              BTCTokenContract, hBTCTokenMinter, simpleBitcoinVaultStateContract, vaultOperatorAdmin, notOwner1,
              testUtilsContract }
               = await loadFixture(deploySimpleBitcoinVaultStateWithSupportingContracts);

          // Set to "CREATING"
          await mockSimpleBitcoinVaultContract.setVaultStatus(0);

          expect(await mockSimpleBitcoinVaultContract.hasNeverGoneLive()).to.equal(true);

          currentValue = await simpleBitcoinVaultStateContract.minDepositFeeSats();

          expect(currentValue).to.equal(10000);

          // Attempt to set to current value
          await expect(simpleBitcoinVaultStateContract.connect(vaultOperatorAdmin).changeMinDepositFeeSats(currentValue))
          .to.be.revertedWith("new min deposit fee sats is not different");
        });

        it("Should reject non-operator attempting to change min deposit fee sats", async function () {
          const { mockSimpleBitcoinVaultContract, simpleGlobalVaultConfigContract, mockBitcoinKitContract,
              dummyPriceOracleContract, mockCollateralTokenContract, configAdmin, oracleAdmin, priceAdmin,
              BTCTokenContract, hBTCTokenMinter, simpleBitcoinVaultStateContract, vaultOperatorAdmin, notOwner1,
              testUtilsContract }
               = await loadFixture(deploySimpleBitcoinVaultStateWithSupportingContracts);

          // Set to "CREATING"
          await mockSimpleBitcoinVaultContract.setVaultStatus(0);

          expect(await mockSimpleBitcoinVaultContract.hasNeverGoneLive()).to.equal(true);

          // Should revert with no message due to precondition check
          await expect(simpleBitcoinVaultStateContract.connect(notOwner1).changeMinDepositFeeSats(10000))
          .to.be.reverted;
        });

        it("Should allow operator to immediately increase min deposit fee sats before vault is live", async function () {
          const { mockSimpleBitcoinVaultContract, simpleGlobalVaultConfigContract, mockBitcoinKitContract,
              dummyPriceOracleContract, mockCollateralTokenContract, configAdmin, oracleAdmin, priceAdmin,
              BTCTokenContract, hBTCTokenMinter, simpleBitcoinVaultStateContract, vaultOperatorAdmin, notOwner1,
              testUtilsContract }
               = await loadFixture(deploySimpleBitcoinVaultStateWithSupportingContracts);

          // Set to "CREATING"
          await mockSimpleBitcoinVaultContract.setVaultStatus(0);

          originalMaxDepFeeSat = await simpleGlobalVaultConfigContract.maxDepositFeeSats();
          expect(originalMaxDepFeeSat).to.equal(10000);

          originalMaxDepFeeBP = await simpleGlobalVaultConfigContract.maxDepositFeeBasisPoints();
          expect(originalMaxDepFeeBP).to.equal(100);

          expect(await mockSimpleBitcoinVaultContract.hasNeverGoneLive()).to.equal(true);

          // Set maximum allowed min deposit fee sats higher in config
          await simpleGlobalVaultConfigContract.connect(configAdmin).updateMaxDepositFees(20000, originalMaxDepFeeBP);

          // Attempt increase
          await simpleBitcoinVaultStateContract.connect(vaultOperatorAdmin).changeMinDepositFeeSats(19999);

          // Make sure update was accepted
          expect(await simpleBitcoinVaultStateContract.minDepositFeeSats()).to.equal(19999);
        });

        it("Should allow operator to immediately decrease min deposit fee sats before vault is live", async function () {
          const { mockSimpleBitcoinVaultContract, simpleGlobalVaultConfigContract, mockBitcoinKitContract,
              dummyPriceOracleContract, mockCollateralTokenContract, configAdmin, oracleAdmin, priceAdmin,
              BTCTokenContract, hBTCTokenMinter, simpleBitcoinVaultStateContract, vaultOperatorAdmin, notOwner1,
              testUtilsContract }
               = await loadFixture(deploySimpleBitcoinVaultStateWithSupportingContracts);

          // Set to "CREATING"
          await mockSimpleBitcoinVaultContract.setVaultStatus(0);

          originalMinDepFeeSat = await simpleGlobalVaultConfigContract.minDepositFeeSats();
          expect(originalMinDepFeeSat).to.equal(10000);

          originalMinDepFeeBP = await simpleGlobalVaultConfigContract.minDepositFeeBasisPoints();
          expect(originalMinDepFeeBP).to.equal(20);

          expect(await mockSimpleBitcoinVaultContract.hasNeverGoneLive()).to.equal(true);

          currentMinDepFeeBP = await simpleGlobalVaultConfigContract.minDepositFeeBasisPoints();

          // Set minimum allowed min deposit fee sats higher in config
          await simpleGlobalVaultConfigContract.connect(configAdmin).updateMinDepositFees(9000, originalMinDepFeeBP);

          // Attempt decrease
          await simpleBitcoinVaultStateContract.connect(vaultOperatorAdmin).changeMinDepositFeeSats(9500);

          // Make sure update was accepted
          expect(await simpleBitcoinVaultStateContract.minDepositFeeSats()).to.equal(9500);
        });

        it("Should allow operator to immediately decrease min deposit fee sats when vault is live", async function () {
          const { mockSimpleBitcoinVaultContract, simpleGlobalVaultConfigContract, mockBitcoinKitContract,
              dummyPriceOracleContract, mockCollateralTokenContract, configAdmin, oracleAdmin, priceAdmin,
              BTCTokenContract, hBTCTokenMinter, simpleBitcoinVaultStateContract, vaultOperatorAdmin, notOwner1,
              testUtilsContract }
               = await loadFixture(deploySimpleBitcoinVaultStateWithSupportingContracts);

          // Set to "LIVE"
          await mockSimpleBitcoinVaultContract.setVaultStatus(2);

          originalMinDepFeeSat = await simpleGlobalVaultConfigContract.minDepositFeeSats();
          expect(originalMinDepFeeSat).to.equal(10000);

          originalMinDepFeeBP = await simpleGlobalVaultConfigContract.minDepositFeeBasisPoints();
          expect(originalMinDepFeeBP).to.equal(20);

          expect(await mockSimpleBitcoinVaultContract.hasNeverGoneLive()).to.equal(false);

          currentMinDepFeeBP = await simpleGlobalVaultConfigContract.minDepositFeeBasisPoints();

          // Set minimum allowed min deposit fee sats lower in config
          await simpleGlobalVaultConfigContract.connect(configAdmin).updateMinDepositFees(9000, originalMinDepFeeBP);

          // Attempt decrease
          await simpleBitcoinVaultStateContract.connect(vaultOperatorAdmin).changeMinDepositFeeSats(9500);

          // Make sure update was accepted
          expect(await simpleBitcoinVaultStateContract.minDepositFeeSats()).to.equal(9500);
        });

        it("Should allow operator to increase min deposit fee sats after vault is live only after delay", async function () {
          const { mockSimpleBitcoinVaultContract, simpleGlobalVaultConfigContract, mockBitcoinKitContract,
              dummyPriceOracleContract, mockCollateralTokenContract, configAdmin, oracleAdmin, priceAdmin,
              BTCTokenContract, hBTCTokenMinter, simpleBitcoinVaultStateContract, vaultOperatorAdmin, notOwner1,
              testUtilsContract }
               = await loadFixture(deploySimpleBitcoinVaultStateWithSupportingContracts);

          // Set to "LIVE"
          await mockSimpleBitcoinVaultContract.setVaultStatus(2);

          originalMaxDepFeeSat = await simpleGlobalVaultConfigContract.maxDepositFeeSats();
          expect(originalMaxDepFeeSat).to.equal(10000);

          originalMaxDepFeeBP = await simpleGlobalVaultConfigContract.maxDepositFeeBasisPoints();
          expect(originalMaxDepFeeBP).to.equal(100);

          expect(await mockSimpleBitcoinVaultContract.hasNeverGoneLive()).to.equal(false);

          // Set maximum allowed min deposit fee sats higher in config
          await simpleGlobalVaultConfigContract.connect(configAdmin).updateMaxDepositFees(20000, originalMaxDepFeeBP);

          increaseDelay = await simpleBitcoinVaultStateContract.DEPOSIT_FEE_INCREASE_DELAY_SECONDS();
          expect(increaseDelay).to.equal(4 * 60 * 60);

          timeBeforeIncrease = await time.latest();

          // Make sure there is no pending update
          expect(await simpleBitcoinVaultStateContract.pendingMinDepositFeeSats()).to.equal(0);
          expect(await simpleBitcoinVaultStateContract.pendingMinDepositFeeSatsUpdateTime()).to.equal(0);

          // Initiate increase
          await simpleBitcoinVaultStateContract.connect(vaultOperatorAdmin).changeMinDepositFeeSats(19999);

          // Make sure pending update was saved
          expect(await simpleBitcoinVaultStateContract.pendingMinDepositFeeSats()).to.equal(19999);
          expect(await simpleBitcoinVaultStateContract.pendingMinDepositFeeSatsUpdateTime()).to.be.greaterThan(0);

          // Increase time to 15 seconds before the update should be allowed
          await time.increaseTo(timeBeforeIncrease + Number(increaseDelay) - 15);

          // Ensure update fails since we are too early
          await expect(simpleBitcoinVaultStateContract.finalizeMinDepositFeeSatsUpdate())
          .to.be.revertedWith("not enough time has elapsed for min deposit fee sats update");

          // Make sure update has not yet been applied
          expect(await simpleBitcoinVaultStateContract.minDepositFeeSats()).to.equal(10000);

          // Increase time to 15 seconds after the update should be allowed
          await time.increaseTo(timeBeforeIncrease + Number(increaseDelay) + 15);

          await simpleBitcoinVaultStateContract.finalizeMinDepositFeeSatsUpdate();

          // Make sure update has NOW been applied
          expect(await simpleBitcoinVaultStateContract.minDepositFeeSats()).to.equal(19999);

          // Make sure pending update was appropriately cleared
          expect(await simpleBitcoinVaultStateContract.pendingMinDepositFeeSats()).to.equal(0);
          expect(await simpleBitcoinVaultStateContract.pendingMinDepositFeeSatsUpdateTime()).to.equal(0);
        });

        it("Should reject min deposit fee sats finalization if no update is in progress", async function () {
          const { mockSimpleBitcoinVaultContract, simpleGlobalVaultConfigContract, mockBitcoinKitContract,
              dummyPriceOracleContract, mockCollateralTokenContract, configAdmin, oracleAdmin, priceAdmin,
              BTCTokenContract, hBTCTokenMinter, simpleBitcoinVaultStateContract, vaultOperatorAdmin, notOwner1,
              testUtilsContract }
               = await loadFixture(deploySimpleBitcoinVaultStateWithSupportingContracts);

          // Set to "LIVE"
          await mockSimpleBitcoinVaultContract.setVaultStatus(2);

          // Make sure there is no pending update
          expect(await simpleBitcoinVaultStateContract.pendingMinDepositFeeSats()).to.equal(0);
          expect(await simpleBitcoinVaultStateContract.pendingMinDepositFeeSatsUpdateTime()).to.equal(0);

          // Make sure finalization fails
          await expect(simpleBitcoinVaultStateContract.finalizeMinDepositFeeSatsUpdate())
          .to.be.revertedWith("no pending min deposit fee in sats is in progress");
        });

        it("Should reject operator setting min withdrawal fee sats lower than minimum in config", async function () {
          const { mockSimpleBitcoinVaultContract, simpleGlobalVaultConfigContract, mockBitcoinKitContract,
              dummyPriceOracleContract, mockCollateralTokenContract, configAdmin, oracleAdmin, priceAdmin,
              BTCTokenContract, hBTCTokenMinter, simpleBitcoinVaultStateContract, vaultOperatorAdmin, notOwner1,
              testUtilsContract }
               = await loadFixture(deploySimpleBitcoinVaultStateWithSupportingContracts);

          // Set to "CREATING"
          await mockSimpleBitcoinVaultContract.setVaultStatus(0);

          expect(await mockSimpleBitcoinVaultContract.hasNeverGoneLive()).to.equal(true);

          minConfig = await simpleGlobalVaultConfigContract.getMinWithdrawalFeeSats();

          expect(minConfig).to.equal(10000);

          // Attempt to set too low
          await expect(simpleBitcoinVaultStateContract.connect(vaultOperatorAdmin).changeMinWithdrawalFeeSats(9999))
          .to.be.revertedWith("new min withdrawal fee in sats must be >= the minimum withdrawal fee in sats from config");
        });

        it("Should reject operator setting min withdrawal fee sats higher than maximum in config", async function () {
          const { mockSimpleBitcoinVaultContract, simpleGlobalVaultConfigContract, mockBitcoinKitContract,
              dummyPriceOracleContract, mockCollateralTokenContract, configAdmin, oracleAdmin, priceAdmin,
              BTCTokenContract, hBTCTokenMinter, simpleBitcoinVaultStateContract, vaultOperatorAdmin, notOwner1,
              testUtilsContract }
               = await loadFixture(deploySimpleBitcoinVaultStateWithSupportingContracts);

          // Set to "CREATING"
          await mockSimpleBitcoinVaultContract.setVaultStatus(0);

          expect(await mockSimpleBitcoinVaultContract.hasNeverGoneLive()).to.equal(true);

          maxConfig = await simpleGlobalVaultConfigContract.getMaxWithdrawalFeeSats();

          // By default min and max are the same
          expect(maxConfig).to.equal(10000);

          // Attempt to set too high
          await expect(simpleBitcoinVaultStateContract.connect(vaultOperatorAdmin).changeMinWithdrawalFeeSats(10001))
          .to.be.revertedWith("new min withdrawal fee in sats must be <= the maximum withdrawal fee in sats from config");
        });

        it("Should reject operator setting min withdrawal fee sats to its existing value", async function () {
          const { mockSimpleBitcoinVaultContract, simpleGlobalVaultConfigContract, mockBitcoinKitContract,
              dummyPriceOracleContract, mockCollateralTokenContract, configAdmin, oracleAdmin, priceAdmin,
              BTCTokenContract, hBTCTokenMinter, simpleBitcoinVaultStateContract, vaultOperatorAdmin, notOwner1,
              testUtilsContract }
               = await loadFixture(deploySimpleBitcoinVaultStateWithSupportingContracts);

          // Set to "CREATING"
          await mockSimpleBitcoinVaultContract.setVaultStatus(0);

          expect(await mockSimpleBitcoinVaultContract.hasNeverGoneLive()).to.equal(true);

          currentValue = await simpleBitcoinVaultStateContract.minWithdrawalFeeSats();

          expect(currentValue).to.equal(10000);

          // Attempt to set to current value
          await expect(simpleBitcoinVaultStateContract.connect(vaultOperatorAdmin).changeMinWithdrawalFeeSats(currentValue))
          .to.be.revertedWith("new min withdrawal fee sats is not different");
        });

        it("Should reject non-operator attempting to change min withdrawal fee sats", async function () {
          const { mockSimpleBitcoinVaultContract, simpleGlobalVaultConfigContract, mockBitcoinKitContract,
              dummyPriceOracleContract, mockCollateralTokenContract, configAdmin, oracleAdmin, priceAdmin,
              BTCTokenContract, hBTCTokenMinter, simpleBitcoinVaultStateContract, vaultOperatorAdmin, notOwner1,
              testUtilsContract }
               = await loadFixture(deploySimpleBitcoinVaultStateWithSupportingContracts);

          // Set to "CREATING"
          await mockSimpleBitcoinVaultContract.setVaultStatus(0);

          expect(await mockSimpleBitcoinVaultContract.hasNeverGoneLive()).to.equal(true);

          // Should revert with no message due to precondition check
          await expect(simpleBitcoinVaultStateContract.connect(notOwner1).changeMinWithdrawalFeeSats(10000))
          .to.be.reverted;
        });

        it("Should allow operator to immediately increase min withdrawal fee sats before vault is live", async function () {
          const { mockSimpleBitcoinVaultContract, simpleGlobalVaultConfigContract, mockBitcoinKitContract,
              dummyPriceOracleContract, mockCollateralTokenContract, configAdmin, oracleAdmin, priceAdmin,
              BTCTokenContract, hBTCTokenMinter, simpleBitcoinVaultStateContract, vaultOperatorAdmin, notOwner1,
              testUtilsContract }
               = await loadFixture(deploySimpleBitcoinVaultStateWithSupportingContracts);

          // Set to "CREATING"
          await mockSimpleBitcoinVaultContract.setVaultStatus(0);

          originalMaxWithdrawalFeeSat = await simpleGlobalVaultConfigContract.maxWithdrawalFeeSats();
          expect(originalMaxWithdrawalFeeSat).to.equal(10000);

          originalMaxWithdrawalFeeBP = await simpleGlobalVaultConfigContract.maxWithdrawalFeeBasisPoints();
          expect(originalMaxWithdrawalFeeBP).to.equal(110);

          expect(await mockSimpleBitcoinVaultContract.hasNeverGoneLive()).to.equal(true);

          // Set maximum allowed min withdrawal fee sats higher in config
          await simpleGlobalVaultConfigContract.connect(configAdmin).updateMaxWithdrawalFees(20000, originalMaxWithdrawalFeeBP);

          // Attempt increase
          await simpleBitcoinVaultStateContract.connect(vaultOperatorAdmin).changeMinWithdrawalFeeSats(19999);

          // Make sure update was accepted
          expect(await simpleBitcoinVaultStateContract.minWithdrawalFeeSats()).to.equal(19999);
        });

        it("Should allow operator to immediately decrease min withdrawal fee sats before vault is live", async function () {
          const { mockSimpleBitcoinVaultContract, simpleGlobalVaultConfigContract, mockBitcoinKitContract,
              dummyPriceOracleContract, mockCollateralTokenContract, configAdmin, oracleAdmin, priceAdmin,
              BTCTokenContract, hBTCTokenMinter, simpleBitcoinVaultStateContract, vaultOperatorAdmin, notOwner1,
              testUtilsContract }
               = await loadFixture(deploySimpleBitcoinVaultStateWithSupportingContracts);

          // Set to "CREATING"
          await mockSimpleBitcoinVaultContract.setVaultStatus(0);

          originalMinWithdrawalFeeSat = await simpleGlobalVaultConfigContract.minWithdrawalFeeSats();
          expect(originalMinWithdrawalFeeSat).to.equal(10000);

          originalMinWithdrawalFeeBP = await simpleGlobalVaultConfigContract.minWithdrawalFeeBasisPoints();
          expect(originalMinWithdrawalFeeBP).to.equal(30);

          expect(await mockSimpleBitcoinVaultContract.hasNeverGoneLive()).to.equal(true);

          currentMinWithdrawalFeeBP = await simpleGlobalVaultConfigContract.minWithdrawalFeeBasisPoints();

          // Set minimum allowed min withdrawal fee sats higher in config
          await simpleGlobalVaultConfigContract.connect(configAdmin).updateMinWithdrawalFees(9000, originalMinWithdrawalFeeBP);

          // Attempt decrease
          await simpleBitcoinVaultStateContract.connect(vaultOperatorAdmin).changeMinWithdrawalFeeSats(9500);

          // Make sure update was accepted
          expect(await simpleBitcoinVaultStateContract.minWithdrawalFeeSats()).to.equal(9500);
        });

        it("Should allow operator to immediately decrease min withdrawal fee sats when vault is live", async function () {
          const { mockSimpleBitcoinVaultContract, simpleGlobalVaultConfigContract, mockBitcoinKitContract,
              dummyPriceOracleContract, mockCollateralTokenContract, configAdmin, oracleAdmin, priceAdmin,
              BTCTokenContract, hBTCTokenMinter, simpleBitcoinVaultStateContract, vaultOperatorAdmin, notOwner1,
              testUtilsContract }
               = await loadFixture(deploySimpleBitcoinVaultStateWithSupportingContracts);

          // Set to "LIVE"
          await mockSimpleBitcoinVaultContract.setVaultStatus(2);

          originalMinWithdrawalFeeSat = await simpleGlobalVaultConfigContract.minWithdrawalFeeSats();
          expect(originalMinWithdrawalFeeSat).to.equal(10000);

          originalMinWithdrawalFeeBP = await simpleGlobalVaultConfigContract.minWithdrawalFeeBasisPoints();
          expect(originalMinWithdrawalFeeBP).to.equal(30);

          expect(await mockSimpleBitcoinVaultContract.hasNeverGoneLive()).to.equal(false);

          currentMinWithdrawalFeeBP = await simpleGlobalVaultConfigContract.minWithdrawalFeeBasisPoints();

          // Set minimum allowed min withdrawal fee sats lower in config
          await simpleGlobalVaultConfigContract.connect(configAdmin).updateMinWithdrawalFees(9000, currentMinWithdrawalFeeBP);

          // Attempt decrease
          await simpleBitcoinVaultStateContract.connect(vaultOperatorAdmin).changeMinWithdrawalFeeSats(9500);

          // Make sure update was accepted
          expect(await simpleBitcoinVaultStateContract.minWithdrawalFeeSats()).to.equal(9500);
        });

        it("Should allow operator to increase min withdrawal fee sats after vault is live only after delay", async function () {
          const { mockSimpleBitcoinVaultContract, simpleGlobalVaultConfigContract, mockBitcoinKitContract,
              dummyPriceOracleContract, mockCollateralTokenContract, configAdmin, oracleAdmin, priceAdmin,
              BTCTokenContract, hBTCTokenMinter, simpleBitcoinVaultStateContract, vaultOperatorAdmin, notOwner1,
              testUtilsContract }
               = await loadFixture(deploySimpleBitcoinVaultStateWithSupportingContracts);

          // Set to "LIVE"
          await mockSimpleBitcoinVaultContract.setVaultStatus(2);

          originalMaxWithdrawalFeeSat = await simpleGlobalVaultConfigContract.maxWithdrawalFeeSats();
          expect(originalMaxWithdrawalFeeSat).to.equal(10000);

          originalMaxWithdrawalFeeBP = await simpleGlobalVaultConfigContract.maxWithdrawalFeeBasisPoints();
          expect(originalMaxWithdrawalFeeBP).to.equal(110);

          expect(await mockSimpleBitcoinVaultContract.hasNeverGoneLive()).to.equal(false);

          // Set maximum allowed min withdrawal fee sats higher in config
          await simpleGlobalVaultConfigContract.connect(configAdmin).updateMaxWithdrawalFees(20000, originalMaxWithdrawalFeeBP);

          increaseDelay = await simpleBitcoinVaultStateContract.WITHDRAWAL_FEE_INCREASE_DELAY_SECONDS();
          expect(increaseDelay).to.equal(1 * 60 * 60);

          timeBeforeIncrease = await time.latest();

          // Make sure there is no pending update
          expect(await simpleBitcoinVaultStateContract.pendingMinWithdrawalFeeSats()).to.equal(0);
          expect(await simpleBitcoinVaultStateContract.pendingMinWithdrawalFeeSatsUpdateTime()).to.equal(0);

          // Initiate increase
          await simpleBitcoinVaultStateContract.connect(vaultOperatorAdmin).changeMinWithdrawalFeeSats(19999);

          // Make sure pending update was saved
          expect(await simpleBitcoinVaultStateContract.pendingMinWithdrawalFeeSats()).to.equal(19999);
          expect(await simpleBitcoinVaultStateContract.pendingMinWithdrawalFeeSatsUpdateTime()).to.be.greaterThan(0);

          // Increase time to 15 seconds before the update should be allowed
          await time.increaseTo(timeBeforeIncrease + Number(increaseDelay) - 15);

          // Ensure update fails since we are too early
          await expect(simpleBitcoinVaultStateContract.finalizeMinWithdrawalFeeSatsUpdate())
          .to.be.revertedWith("not enough time has elapsed for min withdrawal fee sats update");

          // Make sure update has not yet been applied
          expect(await simpleBitcoinVaultStateContract.minWithdrawalFeeSats()).to.equal(10000);

          // Increase time to 15 seconds after the update should be allowed
          await time.increaseTo(timeBeforeIncrease + Number(increaseDelay) + 15);

          await simpleBitcoinVaultStateContract.finalizeMinWithdrawalFeeSatsUpdate();

          // Make sure update has NOW been applied
          expect(await simpleBitcoinVaultStateContract.minWithdrawalFeeSats()).to.equal(19999);

          // Make sure pending update was appropriately cleared
          expect(await simpleBitcoinVaultStateContract.pendingMinWithdrawalFeeSats()).to.equal(0);
          expect(await simpleBitcoinVaultStateContract.pendingMinWithdrawalFeeSatsUpdateTime()).to.equal(0);
        });

        it("Should reject min withdrawal fee sats finalization if no update is in progress", async function () {
          const { mockSimpleBitcoinVaultContract, simpleGlobalVaultConfigContract, mockBitcoinKitContract,
              dummyPriceOracleContract, mockCollateralTokenContract, configAdmin, oracleAdmin, priceAdmin,
              BTCTokenContract, hBTCTokenMinter, simpleBitcoinVaultStateContract, vaultOperatorAdmin, notOwner1,
              testUtilsContract }
               = await loadFixture(deploySimpleBitcoinVaultStateWithSupportingContracts);

          // Set to "LIVE"
          await mockSimpleBitcoinVaultContract.setVaultStatus(2);

          // Make sure there is no pending update
          expect(await simpleBitcoinVaultStateContract.pendingMinWithdrawalFeeSats()).to.equal(0);
          expect(await simpleBitcoinVaultStateContract.pendingMinWithdrawalFeeSatsUpdateTime()).to.equal(0);

          // Make sure finalization fails
          await expect(simpleBitcoinVaultStateContract.finalizeMinWithdrawalFeeSatsUpdate())
          .to.be.revertedWith("no pending min withdrawal fee in sats is in progress");
        });

        it("Should reject operator setting deposit fee bps lower than minimum in config", async function () {
          const { mockSimpleBitcoinVaultContract, simpleGlobalVaultConfigContract, mockBitcoinKitContract,
              dummyPriceOracleContract, mockCollateralTokenContract, configAdmin, oracleAdmin, priceAdmin,
              BTCTokenContract, hBTCTokenMinter, simpleBitcoinVaultStateContract, vaultOperatorAdmin, notOwner1,
              testUtilsContract }
               = await loadFixture(deploySimpleBitcoinVaultStateWithSupportingContracts);

          // Set to "CREATING"
          await mockSimpleBitcoinVaultContract.setVaultStatus(0);

          expect(await mockSimpleBitcoinVaultContract.hasNeverGoneLive()).to.equal(true);

          minConfig = await simpleGlobalVaultConfigContract.getMinDepositFeeBasisPoints();

          expect(minConfig).to.equal(20);

          // Attempt to set too low
          await expect(simpleBitcoinVaultStateContract.connect(vaultOperatorAdmin).changeDepositFeeBps(19))
          .to.be.revertedWith("new deposit fee in bps must be >= the minimum deposit fee in bps from config");
        });

        it("Should reject operator setting deposit fee bps higher than maximum in config", async function () {
          const { mockSimpleBitcoinVaultContract, simpleGlobalVaultConfigContract, mockBitcoinKitContract,
              dummyPriceOracleContract, mockCollateralTokenContract, configAdmin, oracleAdmin, priceAdmin,
              BTCTokenContract, hBTCTokenMinter, simpleBitcoinVaultStateContract, vaultOperatorAdmin, notOwner1,
              testUtilsContract }
               = await loadFixture(deploySimpleBitcoinVaultStateWithSupportingContracts);

          // Set to "CREATING"
          await mockSimpleBitcoinVaultContract.setVaultStatus(0);

          expect(await mockSimpleBitcoinVaultContract.hasNeverGoneLive()).to.equal(true);

          maxConfig = await simpleGlobalVaultConfigContract.getMaxDepositFeeBasisPoints();

          expect(maxConfig).to.equal(100);

          // Attempt to set too high
          await expect(simpleBitcoinVaultStateContract.connect(vaultOperatorAdmin).changeDepositFeeBps(101))
          .to.be.revertedWith("new deposit fee in bps must be <= the maximum deposit fee in bps from config");
        });

        it("Should reject operator setting deposit fee bps to its existing value", async function () {
          const { mockSimpleBitcoinVaultContract, simpleGlobalVaultConfigContract, mockBitcoinKitContract,
              dummyPriceOracleContract, mockCollateralTokenContract, configAdmin, oracleAdmin, priceAdmin,
              BTCTokenContract, hBTCTokenMinter, simpleBitcoinVaultStateContract, vaultOperatorAdmin, notOwner1,
              testUtilsContract }
               = await loadFixture(deploySimpleBitcoinVaultStateWithSupportingContracts);

          // Set to "CREATING"
          await mockSimpleBitcoinVaultContract.setVaultStatus(0);

          expect(await mockSimpleBitcoinVaultContract.hasNeverGoneLive()).to.equal(true);

          currentValue = await simpleBitcoinVaultStateContract.depositFeeBps();

          expect(currentValue).to.equal(20);

          // Attempt to set to current value
          await expect(simpleBitcoinVaultStateContract.connect(vaultOperatorAdmin).changeDepositFeeBps(currentValue))
          .to.be.revertedWith("new deposit fee in bps is not different");
        });

        it("Should reject non-operator attempting to change deposit fee bps", async function () {
          const { mockSimpleBitcoinVaultContract, simpleGlobalVaultConfigContract, mockBitcoinKitContract,
              dummyPriceOracleContract, mockCollateralTokenContract, configAdmin, oracleAdmin, priceAdmin,
              BTCTokenContract, hBTCTokenMinter, simpleBitcoinVaultStateContract, vaultOperatorAdmin, notOwner1,
              testUtilsContract }
               = await loadFixture(deploySimpleBitcoinVaultStateWithSupportingContracts);

          // Set to "CREATING"
          await mockSimpleBitcoinVaultContract.setVaultStatus(0);

          expect(await mockSimpleBitcoinVaultContract.hasNeverGoneLive()).to.equal(true);

          // Should revert with no message due to precondition check
          await expect(simpleBitcoinVaultStateContract.connect(notOwner1).changeDepositFeeBps(20))
          .to.be.reverted;
        });

        it("Should allow operator to immediately increase deposit fee bps before vault is live", async function () {
          const { mockSimpleBitcoinVaultContract, simpleGlobalVaultConfigContract, mockBitcoinKitContract,
              dummyPriceOracleContract, mockCollateralTokenContract, configAdmin, oracleAdmin, priceAdmin,
              BTCTokenContract, hBTCTokenMinter, simpleBitcoinVaultStateContract, vaultOperatorAdmin, notOwner1,
              testUtilsContract }
               = await loadFixture(deploySimpleBitcoinVaultStateWithSupportingContracts);

          // Set to "CREATING"
          await mockSimpleBitcoinVaultContract.setVaultStatus(0);

          expect(await mockSimpleBitcoinVaultContract.hasNeverGoneLive()).to.equal(true);

          // Check that it is set to expected default
          expect(await simpleBitcoinVaultStateContract.depositFeeBps()).to.equal(20);

          // Attempt increase
          await simpleBitcoinVaultStateContract.connect(vaultOperatorAdmin).changeDepositFeeBps(75);

          // Make sure update was accepted
          expect(await simpleBitcoinVaultStateContract.depositFeeBps()).to.equal(75);
        });

        it("Should allow operator to immediately decrease deposit fee bps before vault is live", async function () {
          const { mockSimpleBitcoinVaultContract, simpleGlobalVaultConfigContract, mockBitcoinKitContract,
              dummyPriceOracleContract, mockCollateralTokenContract, configAdmin, oracleAdmin, priceAdmin,
              BTCTokenContract, hBTCTokenMinter, simpleBitcoinVaultStateContract, vaultOperatorAdmin, notOwner1,
              testUtilsContract }
               = await loadFixture(deploySimpleBitcoinVaultStateWithSupportingContracts);

          // Set to "CREATING"
          await mockSimpleBitcoinVaultContract.setVaultStatus(0);

          expect(await mockSimpleBitcoinVaultContract.hasNeverGoneLive()).to.equal(true);

          // Check that it is set to expected default
          expect(await simpleBitcoinVaultStateContract.depositFeeBps()).to.equal(20);

          // Get current deposit fee sats to reuse
          currentMinDepFeeSats = await simpleGlobalVaultConfigContract.minDepositFeeSats();

          // Set a lower minimum value in config
          await simpleGlobalVaultConfigContract.connect(configAdmin).updateMinDepositFees(currentMinDepFeeSats, 10);

          // Attempt decrease
          await simpleBitcoinVaultStateContract.connect(vaultOperatorAdmin).changeDepositFeeBps(15);

          // Make sure update was accepted
          expect(await simpleBitcoinVaultStateContract.depositFeeBps()).to.equal(15);
        });

        it("Should allow operator to immediately decrease deposit fee bps when vault is live", async function () {
          const { mockSimpleBitcoinVaultContract, simpleGlobalVaultConfigContract, mockBitcoinKitContract,
              dummyPriceOracleContract, mockCollateralTokenContract, configAdmin, oracleAdmin, priceAdmin,
              BTCTokenContract, hBTCTokenMinter, simpleBitcoinVaultStateContract, vaultOperatorAdmin, notOwner1,
              testUtilsContract }
               = await loadFixture(deploySimpleBitcoinVaultStateWithSupportingContracts);

          // Set to "LIVE"
          await mockSimpleBitcoinVaultContract.setVaultStatus(2);

          expect(await mockSimpleBitcoinVaultContract.hasNeverGoneLive()).to.equal(false);

          // Check that it is set to expected default
          expect(await simpleBitcoinVaultStateContract.depositFeeBps()).to.equal(20);

          // Get current deposit fee sats to reuse
          currentMinDepFeeSats = await simpleGlobalVaultConfigContract.minDepositFeeSats();

          // Set a lower minimum value in config
          await simpleGlobalVaultConfigContract.connect(configAdmin).updateMinDepositFees(currentMinDepFeeSats, 10);

          // Attempt decrease
          await simpleBitcoinVaultStateContract.connect(vaultOperatorAdmin).changeDepositFeeBps(15);

          // Make sure update was accepted
          expect(await simpleBitcoinVaultStateContract.depositFeeBps()).to.equal(15);
        });

        it("Should allow operator to increase deposit fee bps after vault is live only after delay", async function () {
          const { mockSimpleBitcoinVaultContract, simpleGlobalVaultConfigContract, mockBitcoinKitContract,
              dummyPriceOracleContract, mockCollateralTokenContract, configAdmin, oracleAdmin, priceAdmin,
              BTCTokenContract, hBTCTokenMinter, simpleBitcoinVaultStateContract, vaultOperatorAdmin, notOwner1,
              testUtilsContract }
               = await loadFixture(deploySimpleBitcoinVaultStateWithSupportingContracts);

          // Set to "LIVE"
          await mockSimpleBitcoinVaultContract.setVaultStatus(2);

          originalMaxDepFeeSat = await simpleGlobalVaultConfigContract.maxDepositFeeSats();
          expect(originalMaxDepFeeSat).to.equal(10000);

          originalMaxDepFeeBP = await simpleGlobalVaultConfigContract.maxDepositFeeBasisPoints();
          expect(originalMaxDepFeeBP).to.equal(100);

          expect(await mockSimpleBitcoinVaultContract.hasNeverGoneLive()).to.equal(false);

          // Set maximum allowed deposit fee bps higher in config
          await simpleGlobalVaultConfigContract.connect(configAdmin).updateMaxDepositFees(originalMaxDepFeeSat, 120);

          increaseDelay = await simpleBitcoinVaultStateContract.DEPOSIT_FEE_INCREASE_DELAY_SECONDS();
          expect(increaseDelay).to.equal(4 * 60 * 60);

          timeBeforeIncrease = await time.latest();

          // Make sure there is no pending update
          expect(await simpleBitcoinVaultStateContract.pendingDepositFeeBps()).to.equal(0);
          expect(await simpleBitcoinVaultStateContract.pendingDepositFeeBpsUpdateTime()).to.equal(0);

          // Initiate increase
          await simpleBitcoinVaultStateContract.connect(vaultOperatorAdmin).changeDepositFeeBps(110);

          // Make sure pending update was saved
          expect(await simpleBitcoinVaultStateContract.pendingDepositFeeBps()).to.equal(110);
          expect(await simpleBitcoinVaultStateContract.pendingDepositFeeBpsUpdateTime()).to.be.greaterThan(0);

          // Increase time to 15 seconds before the update should be allowed
          await time.increaseTo(timeBeforeIncrease + Number(increaseDelay) - 15);

          // Ensure update fails since we are too early
          await expect(simpleBitcoinVaultStateContract.finalizeDepositFeeBpsUpdate())
          .to.be.revertedWith("not enough time has elapsed for deposit fee bps update");

          // Make sure update has not yet been applied
          expect(await simpleBitcoinVaultStateContract.depositFeeBps()).to.equal(20);

          // Increase time to 15 seconds after the update should be allowed
          await time.increaseTo(timeBeforeIncrease + Number(increaseDelay) + 15);

          await simpleBitcoinVaultStateContract.finalizeDepositFeeBpsUpdate();

          // Make sure update has NOW been applied
          expect(await simpleBitcoinVaultStateContract.depositFeeBps()).to.equal(110);

          // Make sure pending update was appropriately cleared
          expect(await simpleBitcoinVaultStateContract.pendingDepositFeeBps()).to.equal(0);
          expect(await simpleBitcoinVaultStateContract.pendingDepositFeeBpsUpdateTime()).to.equal(0);
        });

        it("Should reject deposit fee bps finalization if no update is in progress", async function () {
          const { mockSimpleBitcoinVaultContract, simpleGlobalVaultConfigContract, mockBitcoinKitContract,
              dummyPriceOracleContract, mockCollateralTokenContract, configAdmin, oracleAdmin, priceAdmin,
              BTCTokenContract, hBTCTokenMinter, simpleBitcoinVaultStateContract, vaultOperatorAdmin, notOwner1,
              testUtilsContract }
               = await loadFixture(deploySimpleBitcoinVaultStateWithSupportingContracts);

          // Set to "LIVE"
          await mockSimpleBitcoinVaultContract.setVaultStatus(2);

          // Make sure there is no pending update
          expect(await simpleBitcoinVaultStateContract.pendingDepositFeeBps()).to.equal(0);
          expect(await simpleBitcoinVaultStateContract.pendingDepositFeeBpsUpdateTime()).to.equal(0);

          // Make sure finalization fails
          await expect(simpleBitcoinVaultStateContract.finalizeDepositFeeBpsUpdate())
          .to.be.revertedWith("no pending deposit fee in bps is in progress");
        });

        it("Should reject operator setting withdrawal fee bps lower than minimum in config", async function () {
          const { mockSimpleBitcoinVaultContract, simpleGlobalVaultConfigContract, mockBitcoinKitContract,
              dummyPriceOracleContract, mockCollateralTokenContract, configAdmin, oracleAdmin, priceAdmin,
              BTCTokenContract, hBTCTokenMinter, simpleBitcoinVaultStateContract, vaultOperatorAdmin, notOwner1,
              testUtilsContract }
               = await loadFixture(deploySimpleBitcoinVaultStateWithSupportingContracts);

          // Set to "CREATING"
          await mockSimpleBitcoinVaultContract.setVaultStatus(0);

          expect(await mockSimpleBitcoinVaultContract.hasNeverGoneLive()).to.equal(true);

          minConfig = await simpleGlobalVaultConfigContract.getMinWithdrawalFeeBasisPoints();

          expect(minConfig).to.equal(30);

          // Attempt to set too low
          await expect(simpleBitcoinVaultStateContract.connect(vaultOperatorAdmin).changeWithdrawalFeeBps(29))
          .to.be.revertedWith("new withdrawal fee in bps must be >= the minimum withdrawal fee in bps from config");
        });

        it("Should reject operator setting withdrawal fee bps higher than maximum in config", async function () {
          const { mockSimpleBitcoinVaultContract, simpleGlobalVaultConfigContract, mockBitcoinKitContract,
              dummyPriceOracleContract, mockCollateralTokenContract, configAdmin, oracleAdmin, priceAdmin,
              BTCTokenContract, hBTCTokenMinter, simpleBitcoinVaultStateContract, vaultOperatorAdmin, notOwner1,
              testUtilsContract }
               = await loadFixture(deploySimpleBitcoinVaultStateWithSupportingContracts);

          // Set to "CREATING"
          await mockSimpleBitcoinVaultContract.setVaultStatus(0);

          expect(await mockSimpleBitcoinVaultContract.hasNeverGoneLive()).to.equal(true);

          maxConfig = await simpleGlobalVaultConfigContract.getMaxWithdrawalFeeBasisPoints();

          expect(maxConfig).to.equal(110);

          // Attempt to set too low
          await expect(simpleBitcoinVaultStateContract.connect(vaultOperatorAdmin).changeWithdrawalFeeBps(111))
          .to.be.revertedWith("new withdrawal fee in bps must be <= the maximum withdrawal fee in bps from config");
        });

        it("Should reject operator setting withdrawal fee bps to its existing value", async function () {
          const { mockSimpleBitcoinVaultContract, simpleGlobalVaultConfigContract, mockBitcoinKitContract,
              dummyPriceOracleContract, mockCollateralTokenContract, configAdmin, oracleAdmin, priceAdmin,
              BTCTokenContract, hBTCTokenMinter, simpleBitcoinVaultStateContract, vaultOperatorAdmin, notOwner1,
              testUtilsContract }
               = await loadFixture(deploySimpleBitcoinVaultStateWithSupportingContracts);

          // Set to "CREATING"
          await mockSimpleBitcoinVaultContract.setVaultStatus(0);

          expect(await mockSimpleBitcoinVaultContract.hasNeverGoneLive()).to.equal(true);

          currentValue = await simpleBitcoinVaultStateContract.withdrawalFeeBps();

          expect(currentValue).to.equal(30);

          // Attempt to set to current value
          await expect(simpleBitcoinVaultStateContract.connect(vaultOperatorAdmin).changeWithdrawalFeeBps(currentValue))
          .to.be.revertedWith("new min withdrawal fee in bps is not different");
        });

        it("Should reject non-operator attempting to change withdrawal fee bps", async function () {
          const { mockSimpleBitcoinVaultContract, simpleGlobalVaultConfigContract, mockBitcoinKitContract,
              dummyPriceOracleContract, mockCollateralTokenContract, configAdmin, oracleAdmin, priceAdmin,
              BTCTokenContract, hBTCTokenMinter, simpleBitcoinVaultStateContract, vaultOperatorAdmin, notOwner1,
              testUtilsContract }
               = await loadFixture(deploySimpleBitcoinVaultStateWithSupportingContracts);

          // Set to "CREATING"
          await mockSimpleBitcoinVaultContract.setVaultStatus(0);

          expect(await mockSimpleBitcoinVaultContract.hasNeverGoneLive()).to.equal(true);

          // Should revert with no message due to precondition check
          await expect(simpleBitcoinVaultStateContract.connect(notOwner1).changeWithdrawalFeeBps(30))
          .to.be.reverted;
        });

        it("Should allow operator to immediately increase withdrawal fee bps before vault is live", async function () {
          const { mockSimpleBitcoinVaultContract, simpleGlobalVaultConfigContract, mockBitcoinKitContract,
              dummyPriceOracleContract, mockCollateralTokenContract, configAdmin, oracleAdmin, priceAdmin,
              BTCTokenContract, hBTCTokenMinter, simpleBitcoinVaultStateContract, vaultOperatorAdmin, notOwner1,
              testUtilsContract }
               = await loadFixture(deploySimpleBitcoinVaultStateWithSupportingContracts);

          // Set to "CREATING"
          await mockSimpleBitcoinVaultContract.setVaultStatus(0);

          expect(await mockSimpleBitcoinVaultContract.hasNeverGoneLive()).to.equal(true);

          // Check that it is set to expected default
          expect(await simpleBitcoinVaultStateContract.withdrawalFeeBps()).to.equal(30);

          // Attempt increase
          await simpleBitcoinVaultStateContract.connect(vaultOperatorAdmin).changeWithdrawalFeeBps(85);

          // Make sure update was accepted
          expect(await simpleBitcoinVaultStateContract.withdrawalFeeBps()).to.equal(85);
        });

        it("Should allow operator to immediately decrease withdrawal fee bps before vault is live", async function () {
          const { mockSimpleBitcoinVaultContract, simpleGlobalVaultConfigContract, mockBitcoinKitContract,
              dummyPriceOracleContract, mockCollateralTokenContract, configAdmin, oracleAdmin, priceAdmin,
              BTCTokenContract, hBTCTokenMinter, simpleBitcoinVaultStateContract, vaultOperatorAdmin, notOwner1,
              testUtilsContract }
               = await loadFixture(deploySimpleBitcoinVaultStateWithSupportingContracts);

          // Set to "CREATING"
          await mockSimpleBitcoinVaultContract.setVaultStatus(0);

          expect(await mockSimpleBitcoinVaultContract.hasNeverGoneLive()).to.equal(true);

          // Check that it is set to expected default
          expect(await simpleBitcoinVaultStateContract.withdrawalFeeBps()).to.equal(30);

          // Get current withdrawal fee sats to reuse
          currentMinWithdrawalFeeSats = await simpleGlobalVaultConfigContract.minWithdrawalFeeSats();

          // Set a lower minimum value in config
          await simpleGlobalVaultConfigContract.connect(configAdmin).updateMinWithdrawalFees(currentMinWithdrawalFeeSats, 22);

          // Attempt decrease
          await simpleBitcoinVaultStateContract.connect(vaultOperatorAdmin).changeWithdrawalFeeBps(24);

          // Make sure update was accepted
          expect(await simpleBitcoinVaultStateContract.withdrawalFeeBps()).to.equal(24);
        });

        it("Should allow operator to immediately decrease withdrawal fee bps when vault is live", async function () {
          const { mockSimpleBitcoinVaultContract, simpleGlobalVaultConfigContract, mockBitcoinKitContract,
              dummyPriceOracleContract, mockCollateralTokenContract, configAdmin, oracleAdmin, priceAdmin,
              BTCTokenContract, hBTCTokenMinter, simpleBitcoinVaultStateContract, vaultOperatorAdmin, notOwner1,
              testUtilsContract }
               = await loadFixture(deploySimpleBitcoinVaultStateWithSupportingContracts);

          // Set to "LIVE"
          await mockSimpleBitcoinVaultContract.setVaultStatus(2);

          expect(await mockSimpleBitcoinVaultContract.hasNeverGoneLive()).to.equal(false);

          // Check that it is set to expected default
          expect(await simpleBitcoinVaultStateContract.withdrawalFeeBps()).to.equal(30);

          // Get current withdrawal fee sats to reuse
          currentMinWithdrawalFeeSats = await simpleGlobalVaultConfigContract.minWithdrawalFeeSats();

          // Set a lower minimum value in config
          await simpleGlobalVaultConfigContract.connect(configAdmin).updateMinWithdrawalFees(currentMinWithdrawalFeeSats, 22);

          // Attempt decrease
          await simpleBitcoinVaultStateContract.connect(vaultOperatorAdmin).changeWithdrawalFeeBps(24);

          // Make sure update was accepted
          expect(await simpleBitcoinVaultStateContract.withdrawalFeeBps()).to.equal(24);
        });

        it("Should allow operator to increase withdrawal fee bps after vault is live only after delay", async function () {
          const { mockSimpleBitcoinVaultContract, simpleGlobalVaultConfigContract, mockBitcoinKitContract,
              dummyPriceOracleContract, mockCollateralTokenContract, configAdmin, oracleAdmin, priceAdmin,
              BTCTokenContract, hBTCTokenMinter, simpleBitcoinVaultStateContract, vaultOperatorAdmin, notOwner1,
              testUtilsContract }
               = await loadFixture(deploySimpleBitcoinVaultStateWithSupportingContracts);

          // Set to "LIVE"
          await mockSimpleBitcoinVaultContract.setVaultStatus(2);

          originalMaxWithdrawalFeeSat = await simpleGlobalVaultConfigContract.maxWithdrawalFeeSats();
          expect(originalMaxWithdrawalFeeSat).to.equal(10000);

          originalMaxWithdrawalFeeBP = await simpleGlobalVaultConfigContract.maxWithdrawalFeeBasisPoints();
          expect(originalMaxWithdrawalFeeBP).to.equal(110);

          expect(await mockSimpleBitcoinVaultContract.hasNeverGoneLive()).to.equal(false);

          // Set maximum allowed withdrawal fee bps higher in config
          await simpleGlobalVaultConfigContract.connect(configAdmin).updateMaxWithdrawalFees(originalMaxWithdrawalFeeSat, 140);

          increaseDelay = await simpleBitcoinVaultStateContract.WITHDRAWAL_FEE_INCREASE_DELAY_SECONDS();
          expect(increaseDelay).to.equal(1 * 60 * 60);

          timeBeforeIncrease = await time.latest();

          // Make sure there is no pending update
          expect(await simpleBitcoinVaultStateContract.pendingWithdrawalFeeBps()).to.equal(0);
          expect(await simpleBitcoinVaultStateContract.pendingWithdrawalFeeBpsUpdateTime()).to.equal(0);

          // Initiate increase
          await simpleBitcoinVaultStateContract.connect(vaultOperatorAdmin).changeWithdrawalFeeBps(139);

          // Make sure pending update was saved
          expect(await simpleBitcoinVaultStateContract.pendingWithdrawalFeeBps()).to.equal(139);
          expect(await simpleBitcoinVaultStateContract.pendingWithdrawalFeeBpsUpdateTime()).to.be.greaterThan(0);

          // Increase time to 15 seconds before the update should be allowed
          await time.increaseTo(timeBeforeIncrease + Number(increaseDelay) - 15);

          // Ensure update fails since we are too early
          await expect(simpleBitcoinVaultStateContract.finalizeWithdrawalFeeBpsUpdate())
          .to.be.revertedWith("not enough time has elapsed for withdrawal fee bps update");

          // Make sure update has not yet been applied
          expect(await simpleBitcoinVaultStateContract.withdrawalFeeBps()).to.equal(30);

          // Increase time to 15 seconds after the update should be allowed
          await time.increaseTo(timeBeforeIncrease + Number(increaseDelay) + 15);

          await simpleBitcoinVaultStateContract.finalizeWithdrawalFeeBpsUpdate();

          // Make sure update has NOW been applied
          expect(await simpleBitcoinVaultStateContract.withdrawalFeeBps()).to.equal(139);

          // Make sure pending update was appropriately cleared
          expect(await simpleBitcoinVaultStateContract.pendingWithdrawalFeeBps()).to.equal(0);
          expect(await simpleBitcoinVaultStateContract.pendingWithdrawalFeeBpsUpdateTime()).to.equal(0);
        });
      });


    describe("Pending Withdrawal Storage", function () {
      it("Should save single withdrawal correctly", async function () {
        const { mockSimpleBitcoinVaultContract, simpleGlobalVaultConfigContract, mockBitcoinKitContract,
            dummyPriceOracleContract, mockCollateralTokenContract, configAdmin, oracleAdmin, priceAdmin,
            BTCTokenContract, hBTCTokenMinter, simpleBitcoinVaultStateContract, vaultOperatorAdmin, notOwner1,
            testUtilsContract }
             = await loadFixture(deploySimpleBitcoinVaultStateWithSupportingContracts);

        // Set exactly the amount of deposits held to allow the withdrawal
        await mockSimpleBitcoinVaultContract.callIncreaseTotalDepositsHeld(10000000);

        await mockSimpleBitcoinVaultContract.callInternalInitializeWithdrawal(
          10000000, 30000, 100, withdrawal1Script, withdrawalUser1EVMAddress);

        withdrawalFromIndex = await simpleBitcoinVaultStateContract.getWithdrawal(0);

        expect(withdrawalFromIndex.amount).to.equal(10000000);

        withdrawalScriptHash = await testUtilsContract.calculateScriptHash(withdrawal1Script);

        matchFound = await simpleBitcoinVaultStateContract.checkPendingWithdrawalsForMatch(withdrawalScriptHash, 10000000 - 30000);

        expect(matchFound).to.equal(true);

        expect(await simpleBitcoinVaultStateContract.pendingWithdrawalAmountSat()).to.equal(10000000);

        expect(await simpleBitcoinVaultStateContract.withdrawalCounter()).to.equal(1);

        expect(await simpleBitcoinVaultStateContract.pendingWithdrawalCount()).to.equal(1);
      });

      it("Should save multiple withdrawals correctly", async function () {
        const { mockSimpleBitcoinVaultContract, simpleGlobalVaultConfigContract, mockBitcoinKitContract,
            dummyPriceOracleContract, mockCollateralTokenContract, configAdmin, oracleAdmin, priceAdmin,
            BTCTokenContract, hBTCTokenMinter, simpleBitcoinVaultStateContract, vaultOperatorAdmin, notOwner1,
            testUtilsContract }
             = await loadFixture(deploySimpleBitcoinVaultStateWithSupportingContracts);

             // Set exactly the amount of deposits held to allow the withdrawal
             await mockSimpleBitcoinVaultContract.callIncreaseTotalDepositsHeld(30000000);

        await mockSimpleBitcoinVaultContract.callInternalInitializeWithdrawal(
          10000000, 30000, 100, withdrawal1Script, withdrawalUser1EVMAddress);

        await mockSimpleBitcoinVaultContract.callInternalInitializeWithdrawal(
          20000000, 60000, 100, withdrawal2Script, withdrawalUser2EVMAddress);

        withdrawalFromIndex0 = await simpleBitcoinVaultStateContract.getWithdrawal(0);
        expect(withdrawalFromIndex0.amount).to.equal(10000000);

        withdrawalFromIndex1 = await simpleBitcoinVaultStateContract.getWithdrawal(1);
        expect(withdrawalFromIndex1.amount).to.equal(20000000);

        withdrawal1ScriptHash = await testUtilsContract.calculateScriptHash(withdrawal1Script);

        matchFoundFor1 = await simpleBitcoinVaultStateContract.checkPendingWithdrawalsForMatch(withdrawal1ScriptHash, 10000000 - 30000);

        expect(matchFoundFor1).to.equal(true);

        withdrawal2ScriptHash = await testUtilsContract.calculateScriptHash(withdrawal2Script);

        matchFoundFor2 = await simpleBitcoinVaultStateContract.checkPendingWithdrawalsForMatch(withdrawal2ScriptHash, 20000000 - 60000);

        expect(matchFoundFor2).to.equal(true);

        expect(await simpleBitcoinVaultStateContract.pendingWithdrawalAmountSat()).to.equal(30000000);

        expect(await simpleBitcoinVaultStateContract.withdrawalCounter()).to.equal(2);

        expect(await simpleBitcoinVaultStateContract.pendingWithdrawalCount()).to.equal(2);
      });

      it("Should allow fulfillment of single withdrawal correctly", async function () {
        const { mockSimpleBitcoinVaultContract, simpleGlobalVaultConfigContract, mockBitcoinKitContract,
            dummyPriceOracleContract, mockCollateralTokenContract, configAdmin, oracleAdmin, priceAdmin,
            BTCTokenContract, hBTCTokenMinter, simpleBitcoinVaultStateContract, vaultOperatorAdmin, notOwner1,
            testUtilsContract }
             = await loadFixture(deploySimpleBitcoinVaultStateWithSupportingContracts);

        // Set exactly the amount of deposits held to allow the withdrawal
        await mockSimpleBitcoinVaultContract.callIncreaseTotalDepositsHeld(10000000);

        await mockSimpleBitcoinVaultContract.callInternalInitializeWithdrawal(
          10000000, 30000, 100, withdrawal1Script, withdrawalUser1EVMAddress);

        withdrawalFromIndex = await simpleBitcoinVaultStateContract.getWithdrawal(0);

        expect(withdrawalFromIndex.amount).to.equal(10000000);

        withdrawalScriptHash = await testUtilsContract.calculateScriptHash(withdrawal1Script);

        matchFound = await simpleBitcoinVaultStateContract.checkPendingWithdrawalsForMatch(withdrawalScriptHash, 10000000 - 30000);

        expect(matchFound).to.equal(true);

        expect(await simpleBitcoinVaultStateContract.pendingWithdrawalAmountSat()).to.equal(10000000);

        expect(await simpleBitcoinVaultStateContract.withdrawalCounter()).to.equal(1);

        expect(await simpleBitcoinVaultStateContract.pendingWithdrawalCount()).to.equal(1);


        await mockSimpleBitcoinVaultContract.callSaveWithdrawalFulfillment(
          0, withdrawal1FulfillmentTxid, 10000000);


        expect(await simpleBitcoinVaultStateContract.pendingWithdrawalAmountSat()).to.equal(0);

        // Counter should still be 1 (next withdrawal will be at index/uuid=1)
        expect(await simpleBitcoinVaultStateContract.withdrawalCounter()).to.equal(1);

        expect(await simpleBitcoinVaultStateContract.pendingWithdrawalCount()).to.equal(0);


        matchFoundAfterFinalization = await simpleBitcoinVaultStateContract.checkPendingWithdrawalsForMatch(withdrawalScriptHash, 10000000 - 30000);

        expect(matchFoundAfterFinalization).to.equal(false);

        expect(await simpleBitcoinVaultStateContract.acknowledgedWithdrawalTxids(withdrawal1FulfillmentTxid)).to.equal(true);

        expect(await simpleBitcoinVaultStateContract.getTotalDepositsHeld()).to.equal(0);
      });

      it("Should allow fulfillment of multiple withdrawals correctly", async function () {
        const { mockSimpleBitcoinVaultContract, simpleGlobalVaultConfigContract, mockBitcoinKitContract,
            dummyPriceOracleContract, mockCollateralTokenContract, configAdmin, oracleAdmin, priceAdmin,
            BTCTokenContract, hBTCTokenMinter, simpleBitcoinVaultStateContract, vaultOperatorAdmin, notOwner1,
            testUtilsContract }
             = await loadFixture(deploySimpleBitcoinVaultStateWithSupportingContracts);

        // Set exactly the amount of deposits held to allow the withdrawal
        await mockSimpleBitcoinVaultContract.callIncreaseTotalDepositsHeld(withdrawal1.amount + withdrawal2.amount + withdrawal3.amount);

        await mockSimpleBitcoinVaultContract.callInternalInitializeWithdrawal(
          withdrawal1.amount, withdrawal1.fee, withdrawal1.timestampRequested, withdrawal1.destinationScript, withdrawal1.evmOriginator);

        await mockSimpleBitcoinVaultContract.callInternalInitializeWithdrawal(
          withdrawal2.amount, withdrawal2.fee, withdrawal2.timestampRequested, withdrawal2.destinationScript, withdrawal2.evmOriginator);

        await mockSimpleBitcoinVaultContract.callInternalInitializeWithdrawal(
          withdrawal3.amount, withdrawal3.fee, withdrawal3.timestampRequested, withdrawal3.destinationScript, withdrawal3.evmOriginator);

        withdrawalFromIndex1 = await simpleBitcoinVaultStateContract.getWithdrawal(0);
        expect(withdrawalFromIndex1.amount).to.equal(withdrawal1.amount);

        withdrawalFromIndex2 = await simpleBitcoinVaultStateContract.getWithdrawal(1);
        expect(withdrawalFromIndex2.amount).to.equal(withdrawal2.amount);

        withdrawalFromIndex3 = await simpleBitcoinVaultStateContract.getWithdrawal(2);
        expect(withdrawalFromIndex3.amount).to.equal(withdrawal3.amount);

        withdrawal1ScriptHash = await testUtilsContract.calculateScriptHash(withdrawal1Script);
        matchFound1 = await simpleBitcoinVaultStateContract.checkPendingWithdrawalsForMatch(withdrawal1ScriptHash, withdrawal1.amount - withdrawal1.fee);
        expect(matchFound1).to.equal(true);

        withdrawal2ScriptHash = await testUtilsContract.calculateScriptHash(withdrawal2Script);
        matchFound2 = await simpleBitcoinVaultStateContract.checkPendingWithdrawalsForMatch(withdrawal2ScriptHash, withdrawal2.amount - withdrawal2.fee);
        expect(matchFound2).to.equal(true);

        withdrawal3ScriptHash = await testUtilsContract.calculateScriptHash(withdrawal3Script);
        matchFound3 = await simpleBitcoinVaultStateContract.checkPendingWithdrawalsForMatch(withdrawal3ScriptHash, withdrawal3.amount - withdrawal3.fee);
        expect(matchFound3).to.equal(true);

        expect(await simpleBitcoinVaultStateContract.pendingWithdrawalAmountSat()).to.equal(withdrawal1.amount + withdrawal2.amount + withdrawal3.amount);
        expect(await simpleBitcoinVaultStateContract.withdrawalCounter()).to.equal(3);
        expect(await simpleBitcoinVaultStateContract.pendingWithdrawalCount()).to.equal(3);

        w1MatchFound = await simpleBitcoinVaultStateContract.checkPendingWithdrawalsForMatch(withdrawal1ScriptHash, withdrawal1.amount - withdrawal1.fee);
        expect(w1MatchFound).to.equal(true);
        w2MatchFound = await simpleBitcoinVaultStateContract.checkPendingWithdrawalsForMatch(withdrawal2ScriptHash, withdrawal2.amount - withdrawal2.fee);
        expect(w2MatchFound).to.equal(true);
        w3MatchFound = await simpleBitcoinVaultStateContract.checkPendingWithdrawalsForMatch(withdrawal3ScriptHash, withdrawal3.amount - withdrawal3.fee);
        expect(w3MatchFound).to.equal(true);

        // Fulfill withdrawals in different order than they were created in
        await mockSimpleBitcoinVaultContract.callSaveWithdrawalFulfillment(
          1, withdrawal2FulfillmentTxid, withdrawal2.amount);

        expect(await simpleBitcoinVaultStateContract.pendingWithdrawalAmountSat()).to.equal(withdrawal1.amount + withdrawal3.amount);
        expect(await simpleBitcoinVaultStateContract.withdrawalCounter()).to.equal(3);
        expect(await simpleBitcoinVaultStateContract.pendingWithdrawalCount()).to.equal(2);
        w1MatchFound = await simpleBitcoinVaultStateContract.checkPendingWithdrawalsForMatch(withdrawal1ScriptHash, withdrawal1.amount - withdrawal1.fee);
        expect(w1MatchFound).to.equal(true);
        w2MatchFound = await simpleBitcoinVaultStateContract.checkPendingWithdrawalsForMatch(withdrawal2ScriptHash, withdrawal2.amount - withdrawal2.fee);
        expect(w2MatchFound).to.equal(false);
        w3MatchFound = await simpleBitcoinVaultStateContract.checkPendingWithdrawalsForMatch(withdrawal3ScriptHash, withdrawal3.amount - withdrawal3.fee);
        expect(w3MatchFound).to.equal(true);
        expect(await simpleBitcoinVaultStateContract.acknowledgedWithdrawalTxids(withdrawal1FulfillmentTxid)).to.equal(false);
        expect(await simpleBitcoinVaultStateContract.acknowledgedWithdrawalTxids(withdrawal2FulfillmentTxid)).to.equal(true);
        expect(await simpleBitcoinVaultStateContract.acknowledgedWithdrawalTxids(withdrawal3FulfillmentTxid)).to.equal(false);
        expect(await simpleBitcoinVaultStateContract.getTotalDepositsHeld()).to.equal(withdrawal1.amount + withdrawal3.amount);
      

        await mockSimpleBitcoinVaultContract.callSaveWithdrawalFulfillment(
          2, withdrawal3FulfillmentTxid, withdrawal3.amount);

        expect(await simpleBitcoinVaultStateContract.pendingWithdrawalAmountSat()).to.equal(withdrawal1.amount);
        expect(await simpleBitcoinVaultStateContract.withdrawalCounter()).to.equal(3);
        expect(await simpleBitcoinVaultStateContract.pendingWithdrawalCount()).to.equal(1);
        w1MatchFound = await simpleBitcoinVaultStateContract.checkPendingWithdrawalsForMatch(withdrawal1ScriptHash, withdrawal1.amount - withdrawal1.fee);
        expect(w1MatchFound).to.equal(true);
        w2MatchFound = await simpleBitcoinVaultStateContract.checkPendingWithdrawalsForMatch(withdrawal2ScriptHash, withdrawal2.amount - withdrawal2.fee);
        expect(w2MatchFound).to.equal(false);
        w3MatchFound = await simpleBitcoinVaultStateContract.checkPendingWithdrawalsForMatch(withdrawal3ScriptHash, withdrawal3.amount - withdrawal3.fee);
        expect(w3MatchFound).to.equal(false);
        expect(await simpleBitcoinVaultStateContract.acknowledgedWithdrawalTxids(withdrawal1FulfillmentTxid)).to.equal(false);
        expect(await simpleBitcoinVaultStateContract.acknowledgedWithdrawalTxids(withdrawal2FulfillmentTxid)).to.equal(true);
        expect(await simpleBitcoinVaultStateContract.acknowledgedWithdrawalTxids(withdrawal3FulfillmentTxid)).to.equal(true);
        expect(await simpleBitcoinVaultStateContract.getTotalDepositsHeld()).to.equal(withdrawal1.amount);

        await mockSimpleBitcoinVaultContract.callSaveWithdrawalFulfillment(
          0, withdrawal1FulfillmentTxid, withdrawal1.amount);

        // Should be no withdrawals now
        expect(await simpleBitcoinVaultStateContract.pendingWithdrawalAmountSat()).to.equal(0);
        expect(await simpleBitcoinVaultStateContract.withdrawalCounter()).to.equal(3);
        expect(await simpleBitcoinVaultStateContract.pendingWithdrawalCount()).to.equal(0);
        w1MatchFound = await simpleBitcoinVaultStateContract.checkPendingWithdrawalsForMatch(withdrawal1ScriptHash, withdrawal1.amount - withdrawal1.fee);
        expect(w1MatchFound).to.equal(false);
        w2MatchFound = await simpleBitcoinVaultStateContract.checkPendingWithdrawalsForMatch(withdrawal2ScriptHash, withdrawal2.amount - withdrawal2.fee);
        expect(w2MatchFound).to.equal(false);
        w3MatchFound = await simpleBitcoinVaultStateContract.checkPendingWithdrawalsForMatch(withdrawal3ScriptHash, withdrawal3.amount - withdrawal3.fee);
        expect(w3MatchFound).to.equal(false);
        expect(await simpleBitcoinVaultStateContract.acknowledgedWithdrawalTxids(withdrawal1FulfillmentTxid)).to.equal(true);
        expect(await simpleBitcoinVaultStateContract.acknowledgedWithdrawalTxids(withdrawal2FulfillmentTxid)).to.equal(true);
        expect(await simpleBitcoinVaultStateContract.acknowledgedWithdrawalTxids(withdrawal3FulfillmentTxid)).to.equal(true);
        expect(await simpleBitcoinVaultStateContract.getTotalDepositsHeld()).to.equal(0);
      });

    });
  });
  