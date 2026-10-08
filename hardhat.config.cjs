require("dotenv").config();
require("@nomicfoundation/hardhat-ethers");
require("@nomicfoundation/hardhat-chai-matchers");
require("@nomicfoundation/hardhat-verify");

const rawPrivateKey = process.env.PRIVATE_KEY || process.env.DEPLOYER_PRIVATE_KEY || "";
const normalizedPrivateKey = rawPrivateKey && !rawPrivateKey.startsWith("0x") ? `0x${rawPrivateKey}` : rawPrivateKey;
if (normalizedPrivateKey && !/^0x[a-fA-F0-9]{64}$/.test(normalizedPrivateKey)) {
  throw new Error("PRIVATE_KEY must be a 32-byte hexadecimal private key.");
}
const accounts = normalizedPrivateKey ? [normalizedPrivateKey] : [];

module.exports = {
  solidity: {
    version: "0.8.24",
    settings: { optimizer: { enabled: true, runs: 200 } },
  },
  paths: { sources: "./contracts", tests: "./test", cache: "./cache", artifacts: "./artifacts" },
  networks: {
    botchainTestnet: { url: "https://rpc.bohr.life", chainId: 968, accounts },
    botchainMainnet: { url: "https://rpc.botchain.ai", chainId: 677, accounts },
  },
  etherscan: {
    apiKey: {
      botchainTestnet: process.env.BLOCKSCOUT_API_KEY || "empty",
      botchainMainnet: process.env.BLOCKSCOUT_API_KEY || "empty",
    },
    customChains: [
      { network: "botchainTestnet", chainId: 968, urls: { apiURL: "https://scan.bohr.life/api", browserURL: "https://scan.bohr.life" } },
      { network: "botchainMainnet", chainId: 677, urls: { apiURL: "https://scan.botchain.ai/api", browserURL: "https://scan.botchain.ai" } },
    ],
  },
};
