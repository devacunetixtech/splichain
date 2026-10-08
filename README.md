# SplitChain

**One payment. Everyone gets their share.**

SplitChain is a native-BOT payment splitter for BOT Chain. Users connect a real EVM wallet, create reusable on-chain splits, deposit BOT, and distribute the complete balance according to fixed recipient percentages.

## Product flow

- `/` — public landing page explaining the product, contract safeguards, and BOT Chain integration.
- `/app` — wallet-gated DApp. A connected wallet on the configured BOT Chain network is required before the splitter is shown.
- All split balances and transaction history are read directly from the deployed contract and BOT Chain events.
- No mock wallet, fake balance, sample transaction, or simulated confirmation is used.

## Contract safeguards

- Percentages must total exactly 10,000 basis points (100%).
- Recipient addresses cannot be zero or duplicated.
- Every share must be greater than zero.
- Each split supports 2–50 recipients.
- Only the split creator can distribute the balance.
- Reentrancy protection and checks-effects-interactions ordering are applied.
- If any recipient rejects a transfer, the complete distribution reverts.
- The final recipient receives the integer-division remainder, so no wei is stranded.

## Stack

- Next.js 16, React 19, TypeScript
- Viem for live wallet, RPC, contract, and event access
- Solidity 0.8.24
- Hardhat, Ethers, and Chai

## Install and run

```bash
pnpm install
cp .env.example .env
pnpm dev
```

Do not put secrets in `.env.example`. The real `.env` file is ignored by Git.

## Where to add deployment keys

Create a file named `.env` in the project root—the same directory as `package.json` and `hardhat.config.cjs`:

```env
PRIVATE_KEY=0xYOUR_PRIVATE_KEY
BLOCKSCOUT_API_KEY=YOUR_BLOCKSCOUT_API_KEY
```

Important:

- `PRIVATE_KEY` may be supplied with or without the `0x` prefix.
- The deployer wallet needs test BOT for testnet or real BOT for mainnet gas.
- Never commit `.env`, paste its values into source code, or place private keys in `NEXT_PUBLIC_*` variables.
- `BLOCKSCOUT_API_KEY` is read by the Hardhat verification plugin.
- BOT Chain RPC and explorer URLs are public constants in `lib/chain.ts` and `hardhat.config.cjs`.
- The deployed contract address is public and stored directly in `lib/chain.ts`.

## Compile and test

```bash
pnpm contract:compile
pnpm contract:test
```

## Deploy and verify on BOT Chain Testnet

```bash
pnpm contract:deploy:testnet
```

The deployment script:

1. Deploys `SplitChain.sol` through `https://rpc.bohr.life`.
2. Waits for five confirmations.
3. Uses `BLOCKSCOUT_API_KEY` from `.env` to verify the contract.
4. Prints the deployed contract address.

If verification needs to be retried:

```bash
pnpm exec hardhat verify --config hardhat.config.cjs \
  --network botchainTestnet \
  0xDEPLOYED_CONTRACT_ADDRESS
```

After a local deployment, write the printed public address into the frontend source:

```bash
pnpm contract:set-address 0xDEPLOYED_CONTRACT_ADDRESS
```

The repository also includes a manual **Deploy BOT Chain Testnet** GitHub Actions workflow. It reads only `PRIVATE_KEY` and `BLOCKSCOUT_API_KEY` from GitHub Secrets, runs the tests, deploys and verifies the contract, writes the real address into `lib/chain.ts`, and commits that public address back to `main`.

## Deploy, verify, and activate BOT Chain Mainnet

Add `PRIVATE_KEY` and `BLOCKSCOUT_API_KEY` as GitHub repository secrets, then run the manual **Deploy BOT Chain Mainnet** workflow from the `main` branch. It:

1. Runs the contract tests.
2. Deploys to chain ID 677 through `https://rpc.botchain.ai`.
3. Requires successful Blockscout verification.
4. Only after verification succeeds, replaces the frontend's testnet network and contract configuration with the mainnet values.
5. Commits the public mainnet address to `main`, which triggers the normal frontend deployment.

The app therefore stays on the working testnet contract if deployment or verification fails. To run the same operation locally:

```bash
REQUIRE_VERIFICATION=true pnpm contract:deploy:mainnet
pnpm contract:set-mainnet 0xDEPLOYED_CONTRACT_ADDRESS
```

## Six-wallet mainnet interaction

After the mainnet deployment workflow has completed, run **Interact with Six Mainnet Wallets**. The workflow generates six one-time wallets in memory, funds each with only the amount required for one contract call, and has each wallet deposit `1 wei` into a shared split. This is the smallest valid deposit accepted by the contract.

The Actions summary contains the six public wallet addresses and their transaction links. Private keys are never printed or saved, so these wallets are deliberately not recoverable. The workflow uses one contract transaction per wallet; the necessary native funding transfers and one shared split-creation transaction are additional transactions paid by the funded deployer.

## BOT Chain configuration

| Network | Chain ID | RPC | Explorer |
| --- | ---: | --- | --- |
| Testnet | 968 | `https://rpc.bohr.life` | <https://scan.bohr.life> |
| Mainnet | 677 | `https://rpc.botchain.ai` | <https://scan.botchain.ai> |

Official website: <https://botchain.ai>

## Push to GitHub

The repository ignores dependencies, build output, contract artifacts, TypeScript caches, local tooling state, deployment archives, logs, and every `.env*` file except `.env.example`.

```bash
git init
git add .
git status
git commit -m "feat: build SplitChain BOT payment splitter"
git branch -M main
git remote add origin https://github.com/devacunetixtech/splichain.git
git push -u origin main
```

Check `git status` before committing and confirm that `.env` is not listed.

## Brand assets

- `public/favicon.svg` — website favicon.
- `public/splitchain-profile-logo.svg` — vector profile logo.
- `public/splitchain-profile-logo.png` — 1024×1024 social-media profile image.

## Project structure

```text
app/                    Landing and wallet-gated app routes
components/             Product UI, wallet gate, footer, and history
contracts/              SplitChain Solidity contract
hooks/use-wallet.ts     Real browser-wallet connection state
lib/                    BOT Chain, ABI, and user-error configuration
scripts/deploy.cjs      Deployment and Blockscout verification
test/                   Contract tests
```

## Production note

This is an unaudited MVP. Complete an independent smart-contract security review before using meaningful mainnet funds.
