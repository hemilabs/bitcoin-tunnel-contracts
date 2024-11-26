const {
    time,
    loadFixture,
  } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
  const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
  const { expect } = require("chai");
  
  describe("AddressWhitelist", function () {
    async function deployAddressWhitelist() {
      // Contracts are deployed using the first signer/account by default
      const [owner, notOwner1, notOwner2] = await ethers.getSigners();
  
      const AddressWhitelist = await ethers.getContractFactory("AddressWhitelist");
      const addrWhitelistContract = await AddressWhitelist.deploy(owner);
  
      return { addrWhitelistContract, owner, notOwner1, notOwner2 };
    }
  
    describe("Deployment", function () {
      it("Should set the right owner", async function () {
        const { addrWhitelistContract, owner } = await loadFixture(deployAddressWhitelist);
  
        expect(await addrWhitelistContract.owner()).to.equal(owner.address);
      });

      it("No address should be whitelisted", async function () {
        // Check a few addresses that we will test whitelisting on later to make sure they aren't whitelisted immediately after deployment
        const { addrWhitelistContract, owner, notOwner1 } = await loadFixture(deployAddressWhitelist);
        
        expect(await addrWhitelistContract.isAddressWhitelisted(owner.address)).to.equal(false);
        expect(await addrWhitelistContract.isAddressWhitelisted(notOwner1.address)).to.equal(false);
        expect(await addrWhitelistContract.isAddressWhitelisted("0x0000000000000000000000000000000000000000")).to.equal(false);
      });

      it("Should fail if owner is zero address", async function () {
        
        const AddressWhitelist = await ethers.getContractFactory("AddressWhitelist");
        await expect(AddressWhitelist.deploy("0x0000000000000000000000000000000000000000")).to.be.revertedWith(
          "cannot use zero address"
        );
      });
    });
  
    describe("Whitelisting", function () {
      describe("Whitelist Additions", function () {
        it("Owner adding a regular address to whitelist should be accepted", async function () {
          const { addrWhitelistContract, owner, notOwner1 } = await loadFixture(deployAddressWhitelist);

          expect(await addrWhitelistContract.isAddressWhitelisted(notOwner1.address)).to.equal(false);

          await addrWhitelistContract.connect(owner).addToWhitelist(notOwner1.address);

          expect(await addrWhitelistContract.isAddressWhitelisted(notOwner1.address)).to.equal(true);
        });

        it("Owner adding a zero address to whitelist should be rejected", async function () {
          const { addrWhitelistContract, owner } = await loadFixture(deployAddressWhitelist);

          expect(await addrWhitelistContract.isAddressWhitelisted("0x0000000000000000000000000000000000000000")).to.equal(false);

          await expect(addrWhitelistContract.connect(owner).addToWhitelist("0x0000000000000000000000000000000000000000")).to.be.revertedWith(
            "cannot use zero address"
          );

          expect(await addrWhitelistContract.isAddressWhitelisted("0x0000000000000000000000000000000000000000")).to.equal(false);
        });
  
        it("Address other than owner adding a regular address to whitelist should be rejected", async function () {
          const { addrWhitelistContract, notOwner1 } = await loadFixture(deployAddressWhitelist);
  
          await expect(addrWhitelistContract.connect(notOwner1).addToWhitelist(notOwner1.address)).to.be.revertedWith(
            "requires caller to be owner"
          );
        });

        it("Any address should be able to check if an address is whitelisted", async function () {
          const { addrWhitelistContract, owner, notOwner1, notOwner2 } = await loadFixture(deployAddressWhitelist);

          expect(await addrWhitelistContract.isAddressWhitelisted(notOwner1.address)).to.equal(false);
          expect (await addrWhitelistContract.connect(notOwner2).isAddressWhitelisted(notOwner1.address)).to.equal(false);

          await addrWhitelistContract.connect(owner).addToWhitelist(notOwner1.address);

          expect(await addrWhitelistContract.isAddressWhitelisted(notOwner1.address)).to.equal(true);
          expect (await addrWhitelistContract.connect(notOwner2).isAddressWhitelisted(notOwner1.address)).to.equal(true);
        });

      });
  
      describe("Whitelist Removals", function () {
        it("Owner removing a regular address from whitelist should be removed", async function () {
          const { addrWhitelistContract, owner, notOwner1 } = await loadFixture(deployAddressWhitelist);

          expect(await addrWhitelistContract.isAddressWhitelisted(notOwner1.address)).to.equal(false);
          expect(await addrWhitelistContract.connect(notOwner1).isAddressWhitelisted(notOwner1.address)).to.equal(false);

          await addrWhitelistContract.connect(owner).addToWhitelist(notOwner1.address);

          expect(await addrWhitelistContract.isAddressWhitelisted(notOwner1.address)).to.equal(true);
          expect(await addrWhitelistContract.connect(notOwner1).isAddressWhitelisted(notOwner1.address)).to.equal(true);

          await addrWhitelistContract.connect(owner).removeFromWhitelist(notOwner1.address);

          expect(await addrWhitelistContract.isAddressWhitelisted(notOwner1.address)).to.equal(false);
          expect(await addrWhitelistContract.connect(notOwner1).isAddressWhitelisted(notOwner1.address)).to.equal(false);
        });

        it("Address other than owner should not be able to remove a whitelisted address", async function () {
          const { addrWhitelistContract, owner, notOwner1, notOwner2 } = await loadFixture(deployAddressWhitelist);

          expect(await addrWhitelistContract.isAddressWhitelisted(notOwner2.address)).to.equal(false);

          await addrWhitelistContract.connect(owner).addToWhitelist(notOwner2.address);

          expect(await addrWhitelistContract.isAddressWhitelisted(notOwner2.address)).to.equal(true);

          await expect(addrWhitelistContract.connect(notOwner1).addToWhitelist(notOwner2.address)).to.be.revertedWith(
            "requires caller to be owner"
          );

          // Should remain whitelisted after the removal was rejected
          expect(await addrWhitelistContract.isAddressWhitelisted(notOwner2.address)).to.equal(true);
        });
      });
    });
  });
  