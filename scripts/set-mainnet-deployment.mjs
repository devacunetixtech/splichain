import fs from "node:fs";
import path from "node:path";

const address = process.argv[2];
if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
  throw new Error("Provide a valid deployed contract address.");
}

const target = path.join(process.cwd(), "lib", "chain.ts");
const source = fs.readFileSync(target, "utf8");
const matcher = /\/\/ DEPLOYMENT_CONFIG_START[\s\S]*?\/\/ DEPLOYMENT_CONFIG_END/;
if (!matcher.test(source)) {
  throw new Error("Could not locate the BOT Chain deployment configuration block.");
}

const mainnetConfig = `// DEPLOYMENT_CONFIG_START
export const BOTCHAIN_DEPLOYMENT = {
  chainId: 677,
  chainName: "BOT Chain",
  rpcUrl: "https://rpc.botchain.ai",
  explorerUrl: "https://scan.botchain.ai",
  isTestnet: false,
  contractAddress: "${address}",
} as const;
// DEPLOYMENT_CONFIG_END`;

fs.writeFileSync(target, source.replace(matcher, mainnetConfig));
console.log(`Frontend activated on BOT Chain mainnet with contract ${address}`);
