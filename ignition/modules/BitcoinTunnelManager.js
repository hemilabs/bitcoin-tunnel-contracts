// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("BitcoinTunnelManagerModule", (m) => {
  // address initialAdmin, uint256 initialVaultFactoryUpgradeDelay, uint256 minimumVaultFactoryUpgradeDelayToSet, IBitcoinKit bitcoinKitAddr
  const bitcoinTunnelManager = m.contract("BitcoinTunnelManager", ["0x1111111111111111111111111111111111111111", 86400, 120, "0x2222222222222222222222222222222222222222"]);

  return { bitcoinTunnelManager };
});
