import fs from "node:fs";
import path from "node:path";

const address = process.argv[2];
if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
  throw new Error("Provide a valid deployed contract address.");
}

const target = path.join(process.cwd(), "lib", "chain.ts");
const source = fs.readFileSync(target, "utf8");
const matcher = /^export const SPLITCHAIN_ADDRESS: "" \| `0x\$\{string\}` = ".*";$/m;
if (!matcher.test(source)) {
  throw new Error("Could not locate the SplitChain address constant.");
}

fs.writeFileSync(
  target,
  source.replace(matcher, `export const SPLITCHAIN_ADDRESS: "" | \`0x\${string}\` = "${address}";`),
);
console.log(`Frontend contract address set to ${address}`);
