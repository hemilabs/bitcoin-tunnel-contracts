const {
    time,
    loadFixture,
  } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
  const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
  const { expect } = require("chai");
  
  describe("GlobalConfig", function () {
    // We define a fixture to reuse the same setup in every test.
    // We use loadFixture to run this setup once, snapshot that state,
    // and reset Hardhat Network to that snapshot in every test.

    const vaultFactoryDelay = 86400 * 7; // 7 days
    const minVaultFactoryDelay = 86400 * 5; // 5 days
    const bitcoinKitDelay = 86400 * 10; // 10 days
    const globalAdminDelay = 86400 * 14; // 14 days

    async function deployMockBitcoinKit() {
      const [bitcoinKitDeployer] = await ethers.getSigners();

      const MockBitcoinKit = await ethers.getContractFactory("MockBitcoinKit");
      const mockBitcoinKitContract = await MockBitcoinKit.deploy();

      return { bitcoinKitDeployer, mockBitcoinKitContract };
    }

    async function deployMockVaultFactory(factoryStatusAdmin) {
        const [vaultFactoryDeployer] = await ethers.getSigners();

        const MockVaultFactory = await ethers.getContractFactory("MockVaultFactory");
        const mockVaultFactoryContract = await MockVaultFactory.deploy(factoryStatusAdmin);

        return { vaultFactoryDeployer, mockVaultFactoryContract };
    }

    async function deployGlobalConfig() {
      const {bitcoinKitDeployer, mockBitcoinKitContract} = await deployMockBitcoinKit();
      // Hack to convert to the IBitcoinKit interface
      // const mockBitcoinKitContractAsInterface = await ethers.getContractAt("IBitcoinKit", mockBitcoinKitContract.getAddress(), bitcoinKitDeployer);

      // Contracts are deployed using the first signer/account by default
      const [globalConfigOwner, notOwner1, notOwner2, notOwner3, notOwner4] = await ethers.getSigners();
  
      const GlobalConfig = await ethers.getContractFactory("GlobalConfig");
      const globalConfigContract = await GlobalConfig.deploy(
        globalConfigOwner, 
        vaultFactoryDelay, // vault factory upgrade delay
        minVaultFactoryDelay, // minimum vault factory upgrade delay
        bitcoinKitDelay, // bitcoin kit upgrade delay
        globalAdminDelay, // global config admin upgrade delay
        mockBitcoinKitContract);
  
      return { globalConfigContract, mockBitcoinKitContract, vaultFactoryDelay,
         minVaultFactoryDelay, bitcoinKitDelay, globalAdminDelay,
         globalConfigOwner, notOwner1, notOwner2, notOwner3, notOwner4 };
    }

    async function deployGlobalConfigWithMockVaultFactory() {
        const {globalConfigContract, mockBitcoinKitContract, vaultFactoryDelay,
            minVaultFactoryDelay, bitcoinKitDelay, globalAdminDelay, globalConfigOwner,
            notOwner1, notOwner2, notOwner3, notOwner4} = await deployGlobalConfig();

        const { mockVaultFactoryContract } = await deployMockVaultFactory(globalConfigContract.getAddress());

        await globalConfigContract.connect(globalConfigOwner).setInitialVaultFactory(mockVaultFactoryContract);

        return { globalConfigContract, mockBitcoinKitContract, vaultFactoryDelay, 
            minVaultFactoryDelay, bitcoinKitDelay, globalAdminDelay, globalConfigOwner,
            notOwner1, notOwner2, notOwner3, notOwner4, mockVaultFactoryContract };
    }

    async function deployGlobalConfigWithMockVaultFactoryInitiated() {
        const {globalConfigContract, mockBitcoinKitContract, vaultFactoryDelay, 
            minVaultFactoryDelay, bitcoinKitDelay, globalAdminDelay, globalConfigOwner,
            notOwner1 : vaultUpgradeAdmin, notOwner2, notOwner3, notOwner4, mockVaultFactoryContract: originalVaultFactoryContract } = await deployGlobalConfigWithMockVaultFactory();

        const { mockVaultFactoryContract: newVaultFactoryContract } = await deployMockVaultFactory(globalConfigContract.getAddress());

        // Set vault factory upgrade admin to vaultUpgradeAdmin
        await globalConfigContract.connect(globalConfigOwner).updateVaultFactoryUpgradeAdmin(vaultUpgradeAdmin.address);

        // Now have vault upgrade admin initiate the vault factory upgrade
        await globalConfigContract.connect(vaultUpgradeAdmin).initiateVaultFactoryUpgrade(newVaultFactoryContract);

        return {globalConfigContract, mockBitcoinKitContract, vaultFactoryDelay, 
            minVaultFactoryDelay, bitcoinKitDelay, globalAdminDelay, globalConfigOwner,
            vaultUpgradeAdmin, notOwner2, notOwner3, notOwner4, originalVaultFactoryContract,
            newVaultFactoryContract };
    }

    async function deployGlobalConfigWithMockVaultFactoryUpgradeReady() {
        const { globalConfigContract, mockBitcoinKitContract, vaultFactoryDelay, 
            minVaultFactoryDelay, bitcoinKitDelay, globalAdminDelay, globalConfigOwner,
            vaultUpgradeAdmin, notOwner2, notOwner3, notOwner4, originalVaultFactoryContract,
            newVaultFactoryContract } = await deployGlobalConfigWithMockVaultFactoryInitiated();

        await time.increaseTo(await time.latest() + vaultFactoryDelay);

        return {globalConfigContract, mockBitcoinKitContract, vaultFactoryDelay, 
            minVaultFactoryDelay, bitcoinKitDelay, globalAdminDelay, globalConfigOwner,
            vaultUpgradeAdmin, notOwner2, notOwner3, notOwner4, originalVaultFactoryContract,
            newVaultFactoryContract };
    }
    
  
    describe("Deployment", function () {
      it("Should set the right initial admins", async function () {
        const { globalConfigContract, globalConfigOwner } = await loadFixture(deployGlobalConfig);
  
        // Check global config admin
        expect(await globalConfigContract.globalConfigAdmin()).to.equal(globalConfigOwner.address);

        // All vault-related admin checks
        expect(await globalConfigContract.vaultFactoryUpgradeAdmin()).to.equal(globalConfigOwner.address);
        expect(await globalConfigContract.vaultFactoryUpgradeBypassAdmin()).to.equal(globalConfigOwner.address);
        expect(await globalConfigContract.vaultCreationPauseAdmin()).to.equal(globalConfigOwner.address);
        expect(await globalConfigContract.vaultCreationUnpauseAdmin()).to.equal(globalConfigOwner.address);
        expect(await globalConfigContract.vaultCreationWhitelistEnableAdmin()).to.equal(globalConfigOwner.address);
        expect(await globalConfigContract.vaultCreationWhitelistDisableAdmin()).to.equal(globalConfigOwner.address);
        expect(await globalConfigContract.vaultCreationWhitelistModificationAdmin()).to.equal(globalConfigOwner.address);
        expect(await globalConfigContract.vaultCreationWhitelistAdditionAdmin()).to.equal(globalConfigOwner.address);

        // All withdrawal-related admin checks
        expect(await globalConfigContract.withdrawalPauseAdmin()).to.equal(globalConfigOwner.address);
        expect(await globalConfigContract.withdrawalUnpauseAdmin()).to.equal(globalConfigOwner.address);
        expect(await globalConfigContract.withdrawalWhitelistEnableAdmin()).to.equal(globalConfigOwner.address);
        expect(await globalConfigContract.withdrawalWhitelistDisableAdmin()).to.equal(globalConfigOwner.address);
        expect(await globalConfigContract.withdrawalWhitelistModificationAdmin()).to.equal(globalConfigOwner.address);
        expect(await globalConfigContract.withdrawalWhitelistAdditionAdmin()).to.equal(globalConfigOwner.address);

        // Bitcoin kit contract upgrade admin check
        expect(await globalConfigContract.bitcoinKitAdmin()).to.equal(globalConfigOwner.address);
      });

      it("Should set the right bitcoin kit address", async function () {
        const { globalConfigContract, mockBitcoinKitContract } = await loadFixture(deployGlobalConfig);
  
        // Check Bitcoin Kit address
        expect(await globalConfigContract.bitcoinKitAddr()).to.equal(await mockBitcoinKitContract.getAddress());
      });

      it("Should set the right upgrade delays", async function () {
        const { globalConfigContract, vaultFactoryDelay, minVaultFactoryDelay, bitcoinKitDelay, globalAdminDelay } = await loadFixture(deployGlobalConfig);
  
        // Check vault upgrade delays
        expect(await globalConfigContract.vaultFactoryUpgradeDelay()).to.equal(vaultFactoryDelay);
        expect(await globalConfigContract.minimumVaultFactoryUpgradeDelay()).to.equal(minVaultFactoryDelay);

        // Check Bitcoin Kit upgrade delay
        expect(await globalConfigContract.bitcoinKitUpgradeDelay()).to.equal(bitcoinKitDelay);

        // Check Global Config Admin upgrade delay
        expect(await globalConfigContract.globalConfigAdminUpgradeDelay()).to.equal(globalAdminDelay);
      });
    });

    describe("Vault Factory Modifications", function () {
        it("Should allow global config admin to set initial vault factory", async function () {
          const { globalConfigContract, globalConfigOwner } = await loadFixture(deployGlobalConfig);

          const { mockVaultFactoryContract } = await deployMockVaultFactory(globalConfigContract.getAddress());

          // Check vault factory address is NOT set
          expect(await globalConfigContract.vaultFactory()).to.equal("0x0000000000000000000000000000000000000000");

          await globalConfigContract.connect(globalConfigOwner).setInitialVaultFactory(mockVaultFactoryContract);
    
          // Check vault factory address is set
          expect(await globalConfigContract.vaultFactory()).to.equal(await mockVaultFactoryContract.getAddress());
        });

        it("Should allow global config admin to delegate setting of initial vault factory to vault factory upgrade admin", async function () {
            const { globalConfigContract, globalConfigOwner, notOwner1 } = await loadFixture(deployGlobalConfig);
  
            const { mockVaultFactoryContract } = await deployMockVaultFactory(globalConfigContract.getAddress());
  
            // Check vault factory address is NOT set
            expect(await globalConfigContract.vaultFactory()).to.equal("0x0000000000000000000000000000000000000000");

            // Check vault factory upgrade admin is NOT set
            expect(await globalConfigContract.vaultFactoryUpgradeAdmin()).to.equals(globalConfigOwner.address);

            await globalConfigContract.connect(globalConfigOwner).updateVaultFactoryUpgradeAdmin(notOwner1.address);

            // Check vault factory upgrade admin is now set
            expect(await globalConfigContract.vaultFactoryUpgradeAdmin()).to.equals(notOwner1.address);
  
            await globalConfigContract.connect(notOwner1).setInitialVaultFactory(mockVaultFactoryContract);
      
            // Check vault factory address is set
            expect(await globalConfigContract.vaultFactory()).to.equal(await mockVaultFactoryContract.getAddress());
        });

        it("Should not allow address that is not global config admin or vault factory upgrade admin to set initial vault factory", async function () {
            const { globalConfigContract, globalConfigOwner, notOwner1, notOwner2 } = await loadFixture(deployGlobalConfig);
  
            const { mockVaultFactoryContract } = await deployMockVaultFactory(globalConfigContract.getAddress());
  
            // Check vault factory address is NOT set
            expect(await globalConfigContract.vaultFactory()).to.equal("0x0000000000000000000000000000000000000000");

            // Check vault factory upgrade admin is NOT set
            expect(await globalConfigContract.vaultFactoryUpgradeAdmin()).to.equals(globalConfigOwner.address);

            // Set vault factory upgrade admin to notOwner1
            await globalConfigContract.connect(globalConfigOwner).updateVaultFactoryUpgradeAdmin(notOwner1.address);

            // Check vault factory upgrade admin is now set
            expect(await globalConfigContract.vaultFactoryUpgradeAdmin()).to.equals(notOwner1.address);
  
            // Try to set the initial vault factory with notOwner2 who is not authorized
            await expect(globalConfigContract.connect(notOwner2).setInitialVaultFactory(mockVaultFactoryContract)).to.be.revertedWith("sender does not have permission");
      
            // Check vault factory address is STILL not set
            expect(await globalConfigContract.vaultFactory()).to.equal("0x0000000000000000000000000000000000000000");

            // Ensure that error does not prevent the appropriate delegated admin to set initial vault factory
            await globalConfigContract.connect(notOwner1).setInitialVaultFactory(mockVaultFactoryContract);

            expect(await globalConfigContract.vaultFactory()).to.equal(await mockVaultFactoryContract.getAddress());
        });

        it("Should not allow global config admin to set initial vault factory twice", async function () {
          const { globalConfigContract, globalConfigOwner } = await loadFixture(deployGlobalConfig);

          const { mockVaultFactoryContract: mockVaultFactoryContract1 } = await deployMockVaultFactory(globalConfigContract.getAddress());

          await globalConfigContract.connect(globalConfigOwner).setInitialVaultFactory(mockVaultFactoryContract1);

          const { mockVaultFactoryContract : mockVaultFactoryContract2 } = await deployMockVaultFactory(globalConfigContract.getAddress());

          await expect(globalConfigContract.connect(globalConfigOwner).setInitialVaultFactory(mockVaultFactoryContract2)).to.be.revertedWith("vault factory already initialized");

          // Check vault factory address is set to first
          expect(await globalConfigContract.vaultFactory()).to.equal(await mockVaultFactoryContract1.getAddress());
        });

        it("Should check that vault factory's status admin is set correctly", async function () {
          const { globalConfigContract, globalConfigOwner } = await loadFixture(deployGlobalConfig);
  
          const { mockVaultFactoryContract } = await deployMockVaultFactory("0x1010101020202020303030304040404050505050");

          await expect(globalConfigContract.connect(globalConfigOwner).setInitialVaultFactory(mockVaultFactoryContract)).to.be.revertedWith("vault factory does not have this global config set as status admin");
      
          // Check vault factory address is NOT set
          expect(await globalConfigContract.vaultFactory()).to.equal("0x0000000000000000000000000000000000000000");
        });

        it("Should check that vault factory's children count is zero", async function () {
            const { globalConfigContract, globalConfigOwner } = await loadFixture(deployGlobalConfig);
    
            const { mockVaultFactoryContract} = await deployMockVaultFactory(globalConfigContract.getAddress());

            await mockVaultFactoryContract.activateFactory();

            await mockVaultFactoryContract.createVault("0x0000000000000000000000000000000000000000", 
                "0x0000000000000000000000000000000000000000",
                 "0x0000000000000000000000000000000000000000",
                 1,
                 "0x");
  
            await expect(globalConfigContract.connect(globalConfigOwner).setInitialVaultFactory(mockVaultFactoryContract)).to.be.revertedWith("vault factory already deployed vaults");
        
            // Check vault factory address is NOT set
            expect(await globalConfigContract.vaultFactory()).to.equal("0x0000000000000000000000000000000000000000");
        });

        it("Should check that vault factory is not active", async function () {
            const { globalConfigContract, globalConfigOwner } = await loadFixture(deployGlobalConfig);
    
            const { mockVaultFactoryContract} = await deployMockVaultFactory(globalConfigContract.getAddress());

            await mockVaultFactoryContract.activateFactory();
  
            await expect(globalConfigContract.connect(globalConfigOwner).setInitialVaultFactory(mockVaultFactoryContract)).to.be.revertedWith("vault factory is already active");
        
            // Check vault factory address is NOT set
            expect(await globalConfigContract.vaultFactory()).to.equal("0x0000000000000000000000000000000000000000");
        });

        it("Should check that vault factory is not deprecated", async function () {
            const { globalConfigContract, globalConfigOwner } = await loadFixture(deployGlobalConfig);
    
            const { mockVaultFactoryContract} = await deployMockVaultFactory(globalConfigContract.getAddress());

            await mockVaultFactoryContract.deprecate();
  
            await expect(globalConfigContract.connect(globalConfigOwner).setInitialVaultFactory(mockVaultFactoryContract)).to.be.revertedWith("vault factory is already deprecated");
        
            // Check vault factory address is NOT set
            expect(await globalConfigContract.vaultFactory()).to.equal("0x0000000000000000000000000000000000000000");
        });

        it("Should prevent an unpermitted address from initiating a vault factory upgrade", async function () {
            const { globalConfigContract, notOwner2 } = await loadFixture(deployGlobalConfigWithMockVaultFactory);
    
            const { mockVaultFactoryContract: newVaultFactoryContract } = await deployMockVaultFactory(globalConfigContract.getAddress());

            // Get existing factory for later comparison
            const existingVaultFactory = await globalConfigContract.vaultFactory();

            // Attempt to have an unapproved address initiate a vault factory upgrade
            await expect(globalConfigContract.connect(notOwner2).initiateVaultFactoryUpgrade(newVaultFactoryContract)).to.be.revertedWith("sender does not have permission");
        
            // Check vault factory address is NOT set to the new contract
            expect(await globalConfigContract.vaultFactory()).to.equal(existingVaultFactory);
        });

        it("Should allow global config admin to initiate a vault factory upgrade", async function () {
            const { globalConfigContract, globalConfigOwner } = await loadFixture(deployGlobalConfigWithMockVaultFactory);
    
            const { mockVaultFactoryContract: newVaultFactoryContract } = await deployMockVaultFactory(globalConfigContract.getAddress());

            // Get existing factory for later comparison
            const existingVaultFactory = await globalConfigContract.vaultFactory();

            // Have global config admin initiate the vault factory upgrade
            await expect(globalConfigContract.connect(globalConfigOwner).initiateVaultFactoryUpgrade(newVaultFactoryContract)).to.emit(globalConfigContract, "VaultFactoryUpgradeInitiated");

            // Check that the pending activation vault factory is set
            expect(await globalConfigContract.pendingActivationVaultFactory()).to.equal(await newVaultFactoryContract.getAddress());

            // Check that the upgrade start time is set to latest timestamp
            expect(await globalConfigContract.vaultUpgradeStartTime()).to.equal(await time.latest());
            
            // Check vault factory address is NOT set to the new contract yet (needs to wait for the upgrade waiting duration first)
            expect(await globalConfigContract.vaultFactory()).to.equal(existingVaultFactory);
        });

        it("Should allow global config admin to set vault upgrade admin who can initiate a vault factory upgrade", async function () {
            const { globalConfigContract, globalConfigOwner, notOwner1: vaultUpgradeAdmin } = await loadFixture(deployGlobalConfigWithMockVaultFactory);
    
            const { mockVaultFactoryContract: newVaultFactoryContract } = await deployMockVaultFactory(globalConfigContract.getAddress());

            // Attempt for soon-to-be-set vault upgrade admin to initiate upgrade which should fail
            await expect(globalConfigContract.connect(vaultUpgradeAdmin).initiateVaultFactoryUpgrade(newVaultFactoryContract)).to.be.revertedWith("sender does not have permission");

            // Set vault factory upgrade admin to vaultUpgradeAdmin
            await globalConfigContract.connect(globalConfigOwner).updateVaultFactoryUpgradeAdmin(vaultUpgradeAdmin.address);

            // Get existing factory for later comparison
            const existingVaultFactory = await globalConfigContract.vaultFactory();

            // Now have vault upgrade admin initiate the vault factory upgrade
            await expect(globalConfigContract.connect(vaultUpgradeAdmin).initiateVaultFactoryUpgrade(newVaultFactoryContract)).to.emit(globalConfigContract, "VaultFactoryUpgradeInitiated");

            // Check that the pending activation vault factory is set
            expect(await globalConfigContract.pendingActivationVaultFactory()).to.equal(await newVaultFactoryContract.getAddress());

            // Check that the upgrade start time is set to latest timestamp
            expect(await globalConfigContract.vaultUpgradeStartTime()).to.equal(await time.latest());
            
            // Check vault factory address is NOT set to the new contract yet (needs to wait for the upgrade waiting duration first)
            expect(await globalConfigContract.vaultFactory()).to.equal(existingVaultFactory);
        });

        it("Should allow global config admin to reject a pending vault factory upgrade", async function () {
            const { globalConfigContract, globalConfigOwner, originalVaultFactoryContract, newVaultFactoryContract }
             = await loadFixture(deployGlobalConfigWithMockVaultFactoryInitiated);

            // Check that the upgrade start time is set to latest timestamp
            expect(await globalConfigContract.vaultUpgradeStartTime()).to.equal(await time.latest());

            // Check that the pending activation vault factory is set
            expect(await globalConfigContract.pendingActivationVaultFactory()).to.equal(await newVaultFactoryContract.getAddress());

            // Have globalConfigAdmin reject the pending vault factory upgrade
            await expect(globalConfigContract.connect(globalConfigOwner).rejectPendingVaultFactoryUpgrade()).to.emit(globalConfigContract, "VaultFactoryUpgradeRejected");

            // Check vault factory address is NOT set to the new contract yet (needs to wait for the upgrade waiting duration first)
            expect(await globalConfigContract.vaultFactory()).to.equal(await originalVaultFactoryContract.getAddress());

            // Check that the upgrade start time is reset to 0
            expect(await globalConfigContract.vaultUpgradeStartTime()).to.equal(0);

            // Check that the pending activation vault factory is reset to address(0)
            expect(await globalConfigContract.pendingActivationVaultFactory()).to.equal("0x0000000000000000000000000000000000000000");
            
            // Check vault factory address is NOT set to the new contract
            expect(await globalConfigContract.vaultFactory()).to.equal(await originalVaultFactoryContract.getAddress());
        });

        it("Should allow vault upgrade admin admin to reject a pending vault factory upgrade", async function () {
            const { globalConfigContract, vaultUpgradeAdmin, originalVaultFactoryContract, newVaultFactoryContract }
             = await loadFixture(deployGlobalConfigWithMockVaultFactoryInitiated);

            // Check that the upgrade start time is set to latest timestamp
            expect(await globalConfigContract.vaultUpgradeStartTime()).to.equal(await time.latest());

            // Check that the pending activation vault factory is set
            expect(await globalConfigContract.pendingActivationVaultFactory()).to.equal(await newVaultFactoryContract.getAddress());

            // Have globalConfigAdmin reject the pending vault factory upgrade
            await expect(globalConfigContract.connect(vaultUpgradeAdmin).rejectPendingVaultFactoryUpgrade()).to.emit(globalConfigContract, "VaultFactoryUpgradeRejected");

            // Check vault factory address is NOT set to the new contract yet (needs to wait for the upgrade waiting duration first)
            expect(await globalConfigContract.vaultFactory()).to.equal(await originalVaultFactoryContract.getAddress());

            // Check that the upgrade start time is reset to 0
            expect(await globalConfigContract.vaultUpgradeStartTime()).to.equal(0);

            // Check that the pending activation vault factory is reset to address(0)
            expect(await globalConfigContract.pendingActivationVaultFactory()).to.equal("0x0000000000000000000000000000000000000000");
            
            // Check vault factory address is NOT set to the new contract
            expect(await globalConfigContract.vaultFactory()).to.equal(await originalVaultFactoryContract.getAddress());
        });

        it("Should prevent an unpermitted address from rejecting a pending vault factory upgrade", async function () {
            const { globalConfigContract, vaultUpgradeAdmin, originalVaultFactoryContract, newVaultFactoryContract, notOwner2 }
             = await loadFixture(deployGlobalConfigWithMockVaultFactoryInitiated);

            // Check that the upgrade start time is set to latest timestamp
            expect(await globalConfigContract.vaultUpgradeStartTime()).to.equal(await time.latest());

            // Check that the pending activation vault factory is set
            expect(await globalConfigContract.pendingActivationVaultFactory()).to.equal(await newVaultFactoryContract.getAddress());

            // Have globalConfigAdmin reject the pending vault factory upgrade
            await expect(globalConfigContract.connect(notOwner2).rejectPendingVaultFactoryUpgrade()).to.be.revertedWith("sender does not have permission");

            // Check vault factory address is NOT set to the new contract yet (needs to wait for the upgrade waiting duration first)
            expect(await globalConfigContract.vaultFactory()).to.equal(await originalVaultFactoryContract.getAddress());

            // Check that the upgrade start time has not been reset, subtract one from timestamp because the rejection advances the timestamp by 1 second
            expect(await globalConfigContract.vaultUpgradeStartTime()).to.equal((await time.latest()) - 1);

            // Check that the pending activation vault factory has not been reset
            expect(await globalConfigContract.pendingActivationVaultFactory()).to.equal(await newVaultFactoryContract.getAddress());

            // Make sure globalConfigAdmin can still reject the pending vault factory upgrade
            await expect(globalConfigContract.connect(vaultUpgradeAdmin).rejectPendingVaultFactoryUpgrade()).to.emit(globalConfigContract, "VaultFactoryUpgradeRejected");
            
            // Check that the upgrade start time is reset to 0
            expect(await globalConfigContract.vaultUpgradeStartTime()).to.equal(0);

            // Check that the pending activation vault factory is reset to address(0)
            expect(await globalConfigContract.pendingActivationVaultFactory()).to.equal("0x0000000000000000000000000000000000000000");
            
            // Check vault factory address is NOT set to the new contract
            expect(await globalConfigContract.vaultFactory()).to.equal(await originalVaultFactoryContract.getAddress());
        });

        it("Should allow a second vault factory upgrade to overwrite an existing pending vault factory upgrade", async function () {
            const { globalConfigContract, vaultUpgradeAdmin, newVaultFactoryContract }
             = await loadFixture(deployGlobalConfigWithMockVaultFactoryInitiated);

            // Check that the upgrade start time is set to latest timestamp
            expect(await globalConfigContract.vaultUpgradeStartTime()).to.equal(await time.latest());

            // Check that the pending activation vault factory is set
            expect(await globalConfigContract.pendingActivationVaultFactory()).to.equal(await newVaultFactoryContract.getAddress());

            const { mockVaultFactoryContract: newVaultFactoryContract2 } = await deployMockVaultFactory(globalConfigContract.getAddress());

            // Now have vault upgrade admin initiate the 2nd vault factory upgrade
            await expect(globalConfigContract.connect(vaultUpgradeAdmin).initiateVaultFactoryUpgrade(newVaultFactoryContract2)).to.emit(globalConfigContract, "VaultFactoryUpgradeInitiated");

            // Check that the new upgrade start time has been set
            expect(await globalConfigContract.vaultUpgradeStartTime()).to.equal(await time.latest());

            // Check that the new pending activation vault factory has been set
            expect(await globalConfigContract.pendingActivationVaultFactory()).to.equal(await newVaultFactoryContract2.getAddress());
        });

        it("Should reject a vault factory upgrade finalization if not enough time has elapsed", async function () {
            const { globalConfigContract, globalConfigOwner, vaultUpgradeAdmin, newVaultFactoryContract, originalVaultFactoryContract, notOwner2}
             = await loadFixture(deployGlobalConfigWithMockVaultFactoryInitiated);

            // Check that the upgrade start time is set to latest timestamp
            expect(await globalConfigContract.vaultUpgradeStartTime()).to.equal(await time.latest());

            // Attempt for a random address to finalize the upgrade
            await expect(globalConfigContract.connect(notOwner2).finalizeVaultFactoryUpgrade(false)).to.be.revertedWith("the upgrade delay has not elapsed and caller does not have permission to bypass the delay");

            // Check that the pending activation vault factory has not been changed
            expect(await globalConfigContract.pendingActivationVaultFactory()).to.equal(await newVaultFactoryContract.getAddress());

            // Check that the upgrade start time is still set (subtracting 1 because time has advanced with attempt to finalize vault factory upgrade)
            expect(await globalConfigContract.vaultUpgradeStartTime()).to.equal(await time.latest() - 1);
            
            // Check vault factory address is NOT set to the new contract yet
            expect(await globalConfigContract.vaultFactory()).to.equal(await originalVaultFactoryContract.getAddress());


            // Attempt for a random address to finalize the upgrade with setting force to true
            await expect(globalConfigContract.connect(notOwner2).finalizeVaultFactoryUpgrade(true)).to.be.revertedWith("the upgrade delay has not elapsed and caller does not have permission to bypass the delay");

            // Check that the pending activation vault factory has not been changed
            expect(await globalConfigContract.pendingActivationVaultFactory()).to.equal(await newVaultFactoryContract.getAddress());

            // Check that the upgrade start time is still set (subtracting 2 because time has advanced with attempts to finalize vault factory upgrade)
            expect(await globalConfigContract.vaultUpgradeStartTime()).to.equal(await time.latest() - 2);
            
            // Check vault factory address is NOT set to the new contract yet
            expect(await globalConfigContract.vaultFactory()).to.equal(await originalVaultFactoryContract.getAddress());


            // Attempt for the global config admin to finalize the upgrade
            await expect(globalConfigContract.connect(globalConfigOwner).finalizeVaultFactoryUpgrade(false)).to.be.revertedWith("the caller has upgrade delay bypass permissions but did not specify force=true to bypass");

            // Check that the pending activation vault factory has not been changed
            expect(await globalConfigContract.pendingActivationVaultFactory()).to.equal(await newVaultFactoryContract.getAddress());

            // Check that the upgrade start time is still set (subtracting 3 because time has advanced with attempts to finalize vault factory upgrade)
            expect(await globalConfigContract.vaultUpgradeStartTime()).to.equal(await time.latest() - 3);
            
            // Check vault factory address is NOT set to the new contract yet
            expect(await globalConfigContract.vaultFactory()).to.equal(await originalVaultFactoryContract.getAddress());


            // Attempt for the vault upgrade admin to finalize the upgrade
            await expect(globalConfigContract.connect(vaultUpgradeAdmin).finalizeVaultFactoryUpgrade(false)).to.be.revertedWith("the upgrade delay has not elapsed and caller does not have permission to bypass the delay");

            // Check that the pending activation vault factory has not been changed
            expect(await globalConfigContract.pendingActivationVaultFactory()).to.equal(await newVaultFactoryContract.getAddress());

            // Check that the upgrade start time is still set (subtracting 4 because time has advanced with attempts to finalize vault factory upgrade)
            expect(await globalConfigContract.vaultUpgradeStartTime()).to.equal(await time.latest() - 4);
            
            // Check vault factory address is NOT set to the new contract yet
            expect(await globalConfigContract.vaultFactory()).to.equal(await originalVaultFactoryContract.getAddress());


            // Attempt for the vault upgrade admin to finalize the upgrade with setting force to true
            await expect(globalConfigContract.connect(vaultUpgradeAdmin).finalizeVaultFactoryUpgrade(false)).to.be.revertedWith("the upgrade delay has not elapsed and caller does not have permission to bypass the delay");

            // Check that the pending activation vault factory has not been changed
            expect(await globalConfigContract.pendingActivationVaultFactory()).to.equal(await newVaultFactoryContract.getAddress());

            // Check that the upgrade start time is still set (subtracting 5 because time has advanced with attempts to finalize vault factory upgrade)
            expect(await globalConfigContract.vaultUpgradeStartTime()).to.equal(await time.latest() - 5);
            
            // Check vault factory address is NOT set to the new contract yet
            expect(await globalConfigContract.vaultFactory()).to.equal(await originalVaultFactoryContract.getAddress());
        });


        it("Should allow anyone to finalize the vault upgrade if enough time has elapsed", async function () {
            const { globalConfigContract, newVaultFactoryContract, originalVaultFactoryContract, notOwner2}
             = await loadFixture(deployGlobalConfigWithMockVaultFactoryInitiated);

            // Check that the upgrade start time is set to latest timestamp
            expect(await globalConfigContract.vaultUpgradeStartTime()).to.equal(await time.latest());

            // Check vault factory address is NOT set to the new contract yet
            expect(await globalConfigContract.vaultFactory()).to.equal(await originalVaultFactoryContract.getAddress());

            // Advance time to two seconds before upgrade (as finalizing will advance VM by one second) is allowed and make sure upgrade still fails
            await time.increaseTo(await globalConfigContract.vaultUpgradeStartTime() + BigInt(vaultFactoryDelay) - BigInt(2));

            // Upgrade should fail
            await expect(globalConfigContract.connect(notOwner2).finalizeVaultFactoryUpgrade(false)).to.be.revertedWith("the upgrade delay has not elapsed and caller does not have permission to bypass the delay");

            // Advance time to the activation timestamp
            await time.increaseTo(await globalConfigContract.vaultUpgradeStartTime() + BigInt(vaultFactoryDelay));

            // Attempt for a random address to finalize the upgrade
            await expect(globalConfigContract.connect(notOwner2).finalizeVaultFactoryUpgrade(false)).to.emit(globalConfigContract, "VaultFactoryUpgradeCompleted");

            // Check that the pending activation vault factory has been removed
            expect(await globalConfigContract.pendingActivationVaultFactory()).to.equal("0x0000000000000000000000000000000000000000");

            // Check that the upgrade start time has been set to 0
            expect(await globalConfigContract.vaultUpgradeStartTime()).to.equal(0);

            // Check that the vault factory address has NOW been set to the new contract
            expect(await globalConfigContract.vaultFactory()).to.equal(await newVaultFactoryContract.getAddress());
        });

        it("Should allow vault factory upgrade bypass admin to bypass the vault factory upgrade delay", async function () {
            const { globalConfigContract, globalConfigOwner, newVaultFactoryContract, originalVaultFactoryContract, notOwner2 : vaultFactoryUpgradeBypassAdmin}
             = await loadFixture(deployGlobalConfigWithMockVaultFactoryInitiated);

            // Check that the upgrade start time is set to latest timestamp
            expect(await globalConfigContract.vaultUpgradeStartTime()).to.equal(await time.latest());

            // Set the vault factory upgrade bypass admin address
            await globalConfigContract.connect(globalConfigOwner).updateVaultFactoryUpgradeBypassAdmin(vaultFactoryUpgradeBypassAdmin);

            // Check vault factory address is NOT set to the new contract yet
            expect(await globalConfigContract.vaultFactory()).to.equal(await originalVaultFactoryContract.getAddress());

            // Upgrade should fail as force=false
            await expect(globalConfigContract.connect(vaultFactoryUpgradeBypassAdmin).finalizeVaultFactoryUpgrade(false)).to.be.revertedWith("the caller has upgrade delay bypass permissions but did not specify force=true to bypass");

            // Upgrade should succeed as force=true
            await expect(globalConfigContract.connect(vaultFactoryUpgradeBypassAdmin).finalizeVaultFactoryUpgrade(true)).to.emit(globalConfigContract, "VaultFactoryUpgradeCompleted");

            // Check that the pending activation vault factory has been removed
            expect(await globalConfigContract.pendingActivationVaultFactory()).to.equal("0x0000000000000000000000000000000000000000");

            // Check that the upgrade start time has been set to 0
            expect(await globalConfigContract.vaultUpgradeStartTime()).to.equal(0);

            // Check that the vault factory address has NOW been set to the new contract
            expect(await globalConfigContract.vaultFactory()).to.equal(await newVaultFactoryContract.getAddress());
        });

        it("Should allow global config admin to bypass the vault factory upgrade delay", async function () {
            const { globalConfigContract, globalConfigOwner, newVaultFactoryContract, originalVaultFactoryContract }
             = await loadFixture(deployGlobalConfigWithMockVaultFactoryInitiated);

            // Check that the upgrade start time is set to latest timestamp
            expect(await globalConfigContract.vaultUpgradeStartTime()).to.equal(await time.latest());

            // Check vault factory address is NOT set to the new contract yet
            expect(await globalConfigContract.vaultFactory()).to.equal(await originalVaultFactoryContract.getAddress());

            // Upgrade should fail as force=false
            await expect(globalConfigContract.connect(globalConfigOwner).finalizeVaultFactoryUpgrade(false)).to.be.revertedWith("the caller has upgrade delay bypass permissions but did not specify force=true to bypass");

            // Upgrade should succeed as force=true
            await expect(globalConfigContract.connect(globalConfigOwner).finalizeVaultFactoryUpgrade(true)).to.emit(globalConfigContract, "VaultFactoryUpgradeCompleted");

            // Check that the pending activation vault factory has been removed
            expect(await globalConfigContract.pendingActivationVaultFactory()).to.equal("0x0000000000000000000000000000000000000000");

            // Check that the upgrade start time has been set to 0
            expect(await globalConfigContract.vaultUpgradeStartTime()).to.equal(0);

            // Check that the vault factory address has NOW been set to the new contract
            expect(await globalConfigContract.vaultFactory()).to.equal(await newVaultFactoryContract.getAddress());
        });

        it("Lowering vault factory upgrade delay should not apply to a vault upgrade already in progress", async function () {
            const { globalConfigContract, globalConfigOwner, vaultUpgradeAdmin, newVaultFactoryContract, originalVaultFactoryContract, vaultFactoryDelay: originalVaultFactoryDelay, minVaultFactoryDelay, notOwner2 }
             = await loadFixture(deployGlobalConfigWithMockVaultFactoryInitiated);

            const originalVaultUpgradeStartTime = await globalConfigContract.vaultUpgradeStartTime();

            // Check that the upgrade start time is set to latest timestamp
            expect(originalVaultUpgradeStartTime).to.equal(await time.latest());

            // Check vault factory address is NOT set to the new contract yet
            expect(await globalConfigContract.vaultFactory()).to.equal(await originalVaultFactoryContract.getAddress());

            // Update the vault factory upgrade delay
            await globalConfigContract.connect(globalConfigOwner).updateVaultFactoryUpgradeDelay(minVaultFactoryDelay);

            // Check that the grandfathered time is as expected
            const expectedGrandfatheredUpdateTime = originalVaultUpgradeStartTime + BigInt(originalVaultFactoryDelay);
            expect(await globalConfigContract.grandfatheredMinVaultFactoryUpgradeTime()).to.equal(expectedGrandfatheredUpdateTime);

            // Advance chain to be past the beginning of the upgrade plus the new shorter delay, but still below the grandfathered delay
            const timeInBetween = originalVaultUpgradeStartTime + BigInt(minVaultFactoryDelay + 1);
            await time.increaseTo(timeInBetween);

            // Ensure that factory upgrade isn't possible, try several different addresses but with force=false except for non-permissioned address
            await expect(globalConfigContract.connect(globalConfigOwner).finalizeVaultFactoryUpgrade(false)).to.be.revertedWith("the caller has upgrade delay bypass permissions but did not specify force=true to bypass");
            await expect(globalConfigContract.connect(vaultUpgradeAdmin).finalizeVaultFactoryUpgrade(false)).to.be.revertedWith("the upgrade delay has not elapsed and caller does not have permission to bypass the delay");
            await expect(globalConfigContract.connect(vaultUpgradeAdmin).finalizeVaultFactoryUpgrade(true)).to.be.revertedWith("the upgrade delay has not elapsed and caller does not have permission to bypass the delay");
            await expect(globalConfigContract.connect(notOwner2).finalizeVaultFactoryUpgrade(true)).to.be.revertedWith("the upgrade delay has not elapsed and caller does not have permission to bypass the delay");
            await expect(globalConfigContract.connect(notOwner2).finalizeVaultFactoryUpgrade(false)).to.be.revertedWith("the upgrade delay has not elapsed and caller does not have permission to bypass the delay");

            // Check that the pending activation vault factory has not been changed
            expect(await globalConfigContract.pendingActivationVaultFactory()).to.equal(await newVaultFactoryContract.getAddress());

            // Check that the upgrade start time is still set
            expect(await globalConfigContract.vaultUpgradeStartTime()).to.be.above(0);
            
            // Check vault factory address is NOT set to the new contract yet
            expect(await globalConfigContract.vaultFactory()).to.equal(await originalVaultFactoryContract.getAddress());

            // Advance chain to be past the original upgrade time
            const originalActivationTimestamp = originalVaultUpgradeStartTime + BigInt(originalVaultFactoryDelay);
            await time.increaseTo(originalActivationTimestamp - BigInt(6));

            // Ensure that factory upgrade still isn't possible even though time is close, try several different addresses but with force=false except for non-permissioned address

            await expect(globalConfigContract.connect(globalConfigOwner).finalizeVaultFactoryUpgrade(false)).to.be.revertedWith("the caller has upgrade delay bypass permissions but did not specify force=true to bypass");
            await expect(globalConfigContract.connect(vaultUpgradeAdmin).finalizeVaultFactoryUpgrade(false)).to.be.revertedWith("the upgrade delay has not elapsed and caller does not have permission to bypass the delay");
            await expect(globalConfigContract.connect(vaultUpgradeAdmin).finalizeVaultFactoryUpgrade(true)).to.be.revertedWith("the upgrade delay has not elapsed and caller does not have permission to bypass the delay");
            await expect(globalConfigContract.connect(notOwner2).finalizeVaultFactoryUpgrade(true)).to.be.revertedWith("the upgrade delay has not elapsed and caller does not have permission to bypass the delay");
            await expect(globalConfigContract.connect(notOwner2).finalizeVaultFactoryUpgrade(false)).to.be.revertedWith("the upgrade delay has not elapsed and caller does not have permission to bypass the delay");
            
            await time.increaseTo(originalActivationTimestamp);

            // Attempt for a random address to finalize the upgrade
            await expect(globalConfigContract.connect(notOwner2).finalizeVaultFactoryUpgrade(false)).to.emit(globalConfigContract, "VaultFactoryUpgradeCompleted");

            // Check that the pending activation vault factory has been removed
            expect(await globalConfigContract.pendingActivationVaultFactory()).to.equal("0x0000000000000000000000000000000000000000");

            // Check that the upgrade start time has been set to 0
            expect(await globalConfigContract.vaultUpgradeStartTime()).to.equal(0);

            // Check that the vault factory address has NOW been set to the new contract
            expect(await globalConfigContract.vaultFactory()).to.equal(await newVaultFactoryContract.getAddress());
        });
      });
  });
  