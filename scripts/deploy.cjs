const fs = require("node:fs");
const { ethers, network, run } = require("hardhat");

async function main() {
  const SplitChain = await ethers.getContractFactory("SplitChain");
  const splitChain = await SplitChain.deploy();
  await splitChain.waitForDeployment();
  const address = await splitChain.getAddress();
  console.log(`SplitChain deployed on ${network.name}`);
  console.log(`Contract address: ${address}`);
  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `contract_address=${address}\n`);
  }

  if (!process.env.BLOCKSCOUT_API_KEY) {
    console.log("Verification skipped: add BLOCKSCOUT_API_KEY to .env and run the verify command from README.md.");
    return;
  }

  console.log("Waiting for explorer confirmations...");
  await splitChain.deploymentTransaction().wait(5);
  try {
    await run("verify:verify", { address, constructorArguments: [] });
    console.log("Contract verified successfully on Blockscout.");
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes("already verified")) {
      console.log("Contract is already verified on Blockscout.");
      return;
    }
    throw error;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
