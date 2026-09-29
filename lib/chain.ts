import { defineChain } from "viem";

export const BOTCHAIN_TESTNET_RPC_URL = "https://rpc.bohr.life";
export const BOTCHAIN_TESTNET_EXPLORER_URL = "https://scan.bohr.life";

export const botchainTestnet = defineChain({
  id: 968,
  name: "BOT Chain Testnet",
  nativeCurrency: { name: "BOT", symbol: "BOT", decimals: 18 },
  rpcUrls: { default: { http: [BOTCHAIN_TESTNET_RPC_URL] } },
  blockExplorers: { default: { name: "BOTCHAIN Explorer", url: BOTCHAIN_TESTNET_EXPLORER_URL } },
  testnet: true,
});

// The testnet deployment workflow replaces this value with the deployed address.
export const SPLITCHAIN_ADDRESS: "" | `0x${string}` = "0x3b61D35fB269Ea8e5368274Ed45326feadF928bE";
export const CONTRACT_READY = Boolean(SPLITCHAIN_ADDRESS && /^0x[a-fA-F0-9]{40}$/.test(SPLITCHAIN_ADDRESS));

export const addBotchainTestnetParams = {
  chainId: "0x3c8",
  chainName: "BOT Chain Testnet",
  nativeCurrency: { name: "BOT", symbol: "BOT", decimals: 18 },
  rpcUrls: [BOTCHAIN_TESTNET_RPC_URL],
  blockExplorerUrls: [BOTCHAIN_TESTNET_EXPLORER_URL],
};
