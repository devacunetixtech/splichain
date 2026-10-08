/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("node:fs");
const path = require("node:path");
const { ethers } = require("ethers");

const RPC_URL = "https://rpc.botchain.ai";
const EXPLORER_URL = "https://scan.botchain.ai";
const EXPECTED_CHAIN_ID = 677n;
const WALLET_COUNT = 6;

function privateKeyFromEnvironment() {
  const raw = process.env.PRIVATE_KEY || process.env.DEPLOYER_PRIVATE_KEY || "";
  const normalized = raw && !raw.startsWith("0x") ? `0x${raw}` : raw;
  if (!/^0x[a-fA-F0-9]{64}$/.test(normalized)) {
    throw new Error("PRIVATE_KEY must be a 32-byte hexadecimal private key.");
  }
  return normalized;
}

function configuredContractAddress() {
  if (process.env.SPLITCHAIN_ADDRESS) return process.env.SPLITCHAIN_ADDRESS;
  const chainSource = fs.readFileSync(path.join(process.cwd(), "lib", "chain.ts"), "utf8");
  if (!/chainId: 677,/.test(chainSource) || !/isTestnet: false,/.test(chainSource)) {
    throw new Error("The frontend has not been activated for BOT Chain mainnet yet.");
  }
  const match = chainSource.match(/contractAddress: "(0x[a-fA-F0-9]{40})"/);
  if (!match) throw new Error("Could not read the configured SplitChain address.");
  return match[1];
}

function appendSummary(lines) {
  if (!process.env.GITHUB_STEP_SUMMARY) return;
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${lines.join("\n")}\n`);
}

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL, Number(EXPECTED_CHAIN_ID), { staticNetwork: true });
  const network = await provider.getNetwork();
  if (network.chainId !== EXPECTED_CHAIN_ID) {
    throw new Error(`Refusing to continue: expected chain ID ${EXPECTED_CHAIN_ID}, received ${network.chainId}.`);
  }

  const contractAddress = configuredContractAddress();
  if (!ethers.isAddress(contractAddress)) throw new Error("The configured SplitChain address is invalid.");
  if (await provider.getCode(contractAddress) === "0x") throw new Error(`No contract exists at ${contractAddress}.`);

  const artifact = JSON.parse(fs.readFileSync(path.join(process.cwd(), "artifacts", "contracts", "SplitChain.sol", "SplitChain.json"), "utf8"));
  const deployer = new ethers.Wallet(privateKeyFromEnvironment(), provider);
  const contract = new ethers.Contract(contractAddress, artifact.abi, deployer);
  const wallets = Array.from({ length: WALLET_COUNT }, () => ethers.Wallet.createRandom().connect(provider));

  const splitId = await contract.nextSplitId();
  const createTransaction = await contract.createSplit(
    "6W",
    [wallets[0].address, wallets[1].address],
    [5000, 5000],
  );
  await createTransaction.wait();

  const feeData = await provider.getFeeData();
  if (!feeData.gasPrice) throw new Error("The RPC did not return a legacy gas price.");
  const gasPrice = feeData.gasPrice;
  const depositGasLimit = await contract.deposit.estimateGas(splitId, { value: 1n, gasPrice });
  const requiredWalletBalance = depositGasLimit * gasPrice + 1n;
  const interactions = [];

  for (const wallet of wallets) {
    const fundingTransaction = await deployer.sendTransaction({ to: wallet.address, value: requiredWalletBalance, gasPrice });
    await fundingTransaction.wait();
    const walletContract = contract.connect(wallet);
    const interactionTransaction = await walletContract.deposit(splitId, {
      value: 1n,
      gasLimit: depositGasLimit,
      gasPrice,
    });
    await interactionTransaction.wait();
    interactions.push({ address: wallet.address, hash: interactionTransaction.hash });
    console.log(`${wallet.address} -> ${interactionTransaction.hash}`);
  }

  appendSummary([
    "## Six-wallet mainnet interaction",
    "",
    `Contract: [${contractAddress}](${EXPLORER_URL}/address/${contractAddress})`,
    `Shared split ID: \`${splitId}\``,
    `Setup transaction: [${createTransaction.hash}](${EXPLORER_URL}/tx/${createTransaction.hash})`,
    `Each wallet deposited the minimum non-zero value: \`1 wei\`.`,
    "",
    "| Wallet | Interaction transaction |",
    "| --- | --- |",
    ...interactions.map(({ address, hash }) => `| [${address}](${EXPLORER_URL}/address/${address}) | [${hash}](${EXPLORER_URL}/tx/${hash}) |`),
    "",
    "> These are one-time interaction wallets. Their private keys were never logged or saved and cannot be recovered.",
  ]);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
