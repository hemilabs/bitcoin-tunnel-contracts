require("@nomicfoundation/hardhat-toolbox");

const { vars } = require("hardhat/config");

const NODE_URL = "https://testnet.rpc.hemi.network/rpc";
const PRIVATE_KEY = "fc99cd97c45e50f100f8398418f1347f275bd9f92523b3c14d1b6245a663ea46";
// const NODE_URL = process.env.HEMI_NODE_URL;
// const PRIVATE_KEY = process.env.PRIVATE_KEY;


/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  networks: {
    hemiTestnet: {
      url: NODE_URL,
      accounts: [PRIVATE_KEY],
      chainId: 743111,
    },
  },
  solidity: {
    version: "0.8.27",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000,
      },
      // viaIR: true, // Uncomment to run test coverage
      evmVersion: "cancun",
    },
  },
};
