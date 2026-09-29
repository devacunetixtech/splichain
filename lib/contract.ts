export const splitChainAbi = [
  { type: "function", name: "createSplit", stateMutability: "nonpayable", inputs: [{ name: "name", type: "string" }, { name: "recipients", type: "address[]" }, { name: "sharesBps", type: "uint16[]" }], outputs: [{ name: "splitId", type: "uint256" }] },
  { type: "function", name: "deposit", stateMutability: "payable", inputs: [{ name: "splitId", type: "uint256" }], outputs: [] },
  { type: "function", name: "distribute", stateMutability: "nonpayable", inputs: [{ name: "splitId", type: "uint256" }], outputs: [] },
  { type: "function", name: "getSplit", stateMutability: "view", inputs: [{ name: "splitId", type: "uint256" }], outputs: [{ name: "owner", type: "address" }, { name: "name", type: "string" }, { name: "recipients", type: "address[]" }, { name: "sharesBps", type: "uint16[]" }, { name: "balance", type: "uint256" }, { name: "totalDeposited", type: "uint256" }, { name: "totalDistributed", type: "uint256" }, { name: "distributionCount", type: "uint256" }] },
  { type: "event", name: "SplitCreated", inputs: [{ name: "splitId", type: "uint256", indexed: true }, { name: "owner", type: "address", indexed: true }, { name: "name", type: "string", indexed: false }] },
  { type: "event", name: "Deposited", inputs: [{ name: "splitId", type: "uint256", indexed: true }, { name: "sender", type: "address", indexed: true }, { name: "amount", type: "uint256", indexed: false }] },
  { type: "event", name: "Distributed", inputs: [{ name: "splitId", type: "uint256", indexed: true }, { name: "owner", type: "address", indexed: true }, { name: "amount", type: "uint256", indexed: false }, { name: "distributionNumber", type: "uint256", indexed: false }] },
] as const;
