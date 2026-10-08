import { defineChain } from "viem";

// DEPLOYMENT_CONFIG_START
export const BOTCHAIN_DEPLOYMENT = {
  chainId: 968,
  chainName: "BOT Chain Testnet",
  rpcUrl: "https://rpc.bohr.life",
  explorerUrl: "https://scan.bohr.life",
  isTestnet: true,
  contractAddress: "0x3b61D35fB269Ea8e5368274Ed45326feadF928bE",
} as const;
// DEPLOYMENT_CONFIG_END

export const botchain = defineChain({
  id: BOTCHAIN_DEPLOYMENT.chainId,
  name: BOTCHAIN_DEPLOYMENT.chainName,
  nativeCurrency: { name: "BOT", symbol: "BOT", decimals: 18 },
  rpcUrls: { default: { http: [BOTCHAIN_DEPLOYMENT.rpcUrl] } },
  blockExplorers: { default: { name: "BOT Chain Explorer", url: BOTCHAIN_DEPLOYMENT.explorerUrl } },
  testnet: BOTCHAIN_DEPLOYMENT.isTestnet,
});

export const SPLITCHAIN_ADDRESS: "" | `0x${string}` = BOTCHAIN_DEPLOYMENT.contractAddress;
export const CONTRACT_READY = Boolean(SPLITCHAIN_ADDRESS && /^0x[a-fA-F0-9]{40}$/.test(SPLITCHAIN_ADDRESS));

export const addBotchainParams = {
  chainId: `0x${BOTCHAIN_DEPLOYMENT.chainId.toString(16)}`,
  chainName: BOTCHAIN_DEPLOYMENT.chainName,
  nativeCurrency: { name: "BOT", symbol: "BOT", decimals: 18 },
  rpcUrls: [BOTCHAIN_DEPLOYMENT.rpcUrl],
  blockExplorerUrls: [BOTCHAIN_DEPLOYMENT.explorerUrl],
};
