"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowDownToLine,
  Check,
  CircleDollarSign,
  ExternalLink,
  LoaderCircle,
  LockKeyhole,
  Network,
  Plus,
  SendHorizontal,
  ShieldCheck,
} from "lucide-react";
import {
  createPublicClient,
  createWalletClient,
  custom,
  decodeEventLog,
  formatEther,
  http,
  isAddress,
  parseEther,
  type Address,
  type Hash,
} from "viem";
import { BrandMark } from "@/components/brand-mark";
import { RecipientBuilder, type RecipientDraft } from "@/components/recipient-builder";
import { SiteFooter } from "@/components/site-footer";
import { TransactionHistory, type ActivityItem } from "@/components/transaction-history";
import { shortAddress } from "@/hooks/use-wallet";
import { botchainTestnet, CONTRACT_READY, SPLITCHAIN_ADDRESS } from "@/lib/chain";
import { splitChainAbi } from "@/lib/contract";
import { toUserMessage } from "@/lib/errors";

type ActiveSplit = {
  id: bigint;
  owner: Address;
  name: string;
  recipients: readonly Address[];
  sharesBps: readonly number[];
  balance: bigint;
  totalDeposited: bigint;
  totalDistributed: bigint;
  distributionCount: bigint;
};

type PendingActivity = Omit<ActivityItem, "timestamp"> & { blockNumber: bigint };

const emptyRecipients: RecipientDraft[] = [
  { id: "recipient-1", label: "", address: "", percentage: "" },
  { id: "recipient-2", label: "", address: "", percentage: "" },
];
const previewColors = ["#7C5CFC", "#2BB673", "#F3A63B", "#377CF6", "#E55574"];
const publicClient = createPublicClient({ chain: botchainTestnet, transport: http() });

export function SplitterApp({ account }: { account: Address }) {
  const [splitName, setSplitName] = useState("");
  const [amount, setAmount] = useState("");
  const [recipients, setRecipients] = useState(emptyRecipients);
  const [activeSplit, setActiveSplit] = useState<ActiveSplit | null>(null);
  const [lookupId, setLookupId] = useState("");
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(CONTRACT_READY);
  const [status, setStatus] = useState<"idle" | "creating" | "depositing" | "distributing" | "loading">("idle");
  const [notice, setNotice] = useState<{ tone: "success" | "error" | "info"; text: string } | null>(null);

  const totalBps = useMemo(
    () => recipients.reduce((sum, recipient) => sum + Math.round((Number(recipient.percentage) || 0) * 100), 0),
    [recipients],
  );
  const totalPercentage = totalBps / 100;
  const isCorrectTotal = totalBps === 10_000;
  const isBusy = status !== "idle";

  const formError = useMemo(() => {
    if (!splitName.trim()) return "Enter a name for this split.";
    if (!isCorrectTotal) return "Recipient shares must total exactly 100%.";
    const addresses = recipients.map((recipient) => recipient.address.toLowerCase());
    if (addresses.some((address) => !isAddress(address))) return "Enter a valid wallet address for every recipient.";
    if (new Set(addresses).size !== addresses.length) return "Each recipient must use a different wallet address.";
    if (recipients.some((recipient) => Math.round(Number(recipient.percentage) * 100) <= 0)) return "Every recipient needs a share greater than 0%.";
    return null;
  }, [isCorrectTotal, recipients, splitName]);

  function walletClient() {
    if (!window.ethereum) throw new Error("Wallet unavailable");
    return createWalletClient({ account, chain: botchainTestnet, transport: custom(window.ethereum as Parameters<typeof custom>[0]) });
  }

  async function confirm(hash: Hash) {
    return publicClient.waitForTransactionReceipt({ hash });
  }

  const loadSplit = useCallback(async (splitId: bigint) => {
    if (!CONTRACT_READY || !SPLITCHAIN_ADDRESS) throw new Error("Contract unavailable");
    const result = await publicClient.readContract({ address: SPLITCHAIN_ADDRESS, abi: splitChainAbi, functionName: "getSplit", args: [splitId] });
    const [owner, name, splitRecipients, sharesBps, balance, totalDeposited, totalDistributed, distributionCount] = result;
    setActiveSplit({ id: splitId, owner, name, recipients: splitRecipients, sharesBps: sharesBps.map(Number), balance, totalDeposited, totalDistributed, distributionCount });
  }, []);

  const loadActivity = useCallback(async () => {
    if (!CONTRACT_READY || !SPLITCHAIN_ADDRESS) {
      setActivity([]);
      setHistoryLoading(false);
      return;
    }
    try {
      const latestBlock = await publicClient.getBlockNumber();
      const fromBlock = latestBlock > 50_000n ? latestBlock - 50_000n : 0n;
      const [createdLogs, depositLogs, distributedLogs] = await Promise.all([
        publicClient.getContractEvents({ address: SPLITCHAIN_ADDRESS, abi: splitChainAbi, eventName: "SplitCreated", args: { owner: account }, fromBlock, toBlock: "latest" }),
        publicClient.getContractEvents({ address: SPLITCHAIN_ADDRESS, abi: splitChainAbi, eventName: "Deposited", args: { sender: account }, fromBlock, toBlock: "latest" }),
        publicClient.getContractEvents({ address: SPLITCHAIN_ADDRESS, abi: splitChainAbi, eventName: "Distributed", args: { owner: account }, fromBlock, toBlock: "latest" }),
      ]);

      const pending: PendingActivity[] = [
        ...createdLogs.map((log) => ({ id: `${log.transactionHash}-${log.logIndex}`, hash: log.transactionHash, type: "created" as const, title: `Split #${log.args.splitId} created`, detail: log.args.name ?? "New split", blockNumber: log.blockNumber })),
        ...depositLogs.map((log) => ({ id: `${log.transactionHash}-${log.logIndex}`, hash: log.transactionHash, type: "deposited" as const, title: `${formatEther(log.args.amount ?? 0n)} BOT deposited`, detail: `Split #${log.args.splitId}`, blockNumber: log.blockNumber })),
        ...distributedLogs.map((log) => ({ id: `${log.transactionHash}-${log.logIndex}`, hash: log.transactionHash, type: "distributed" as const, title: `${formatEther(log.args.amount ?? 0n)} BOT distributed`, detail: `Split #${log.args.splitId}`, blockNumber: log.blockNumber })),
      ];

      const blockNumbers = [...new Set(pending.map((item) => item.blockNumber))];
      const blocks = await Promise.all(blockNumbers.map((blockNumber) => publicClient.getBlock({ blockNumber })));
      const timestamps = new Map(blocks.map((block) => [block.number, Number(block.timestamp) * 1000]));
      setActivity(pending.map(({ blockNumber, ...item }) => ({ ...item, timestamp: timestamps.get(blockNumber) ?? 0 })).sort((a, b) => b.timestamp - a.timestamp).slice(0, 30));
    } catch {
      setNotice((current) => current ?? { tone: "error", text: "We could not load your recent on-chain activity. Try again in a moment." });
    } finally {
      setHistoryLoading(false);
    }
  }, [account]);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => void loadActivity(), 0);
    if (!CONTRACT_READY) return () => window.clearTimeout(initialLoad);
    const unwatch = publicClient.watchBlockNumber({ emitOnBegin: false, pollingInterval: 10_000, onBlockNumber: () => void loadActivity() });
    return () => { window.clearTimeout(initialLoad); unwatch(); };
  }, [loadActivity]);

  async function createSplit() {
    if (formError) { setNotice({ tone: "error", text: formError }); return; }
    if (!CONTRACT_READY || !SPLITCHAIN_ADDRESS) { setNotice({ tone: "info", text: "The SplitChain contract has not been connected yet. Deploy it and add its public address to the website configuration." }); return; }
    try {
      setStatus("creating");
      setNotice(null);
      const hash = await walletClient().writeContract({
        address: SPLITCHAIN_ADDRESS,
        abi: splitChainAbi,
        functionName: "createSplit",
        args: [splitName.trim(), recipients.map((recipient) => recipient.address as Address), recipients.map((recipient) => Math.round(Number(recipient.percentage) * 100))],
      });
      const receipt = await confirm(hash);
      let splitId: bigint | null = null;
      for (const log of receipt.logs) {
        try {
          const decoded = decodeEventLog({ abi: splitChainAbi, data: log.data, topics: log.topics });
          if (decoded.eventName === "SplitCreated") splitId = decoded.args.splitId;
        } catch { /* Ignore logs from other contracts. */ }
      }
      if (splitId === null) throw new Error("Missing split ID");
      await Promise.all([loadSplit(splitId), loadActivity()]);
      setLookupId(splitId.toString());
      setNotice({ tone: "success", text: `Split #${splitId} is confirmed on BOT Chain Testnet.` });
    } catch (error) {
      setNotice({ tone: "error", text: toUserMessage(error, "We could not create the split. Check your entries and try again.") });
    } finally {
      setStatus("idle");
    }
  }

  async function deposit() {
    if (!activeSplit) { setNotice({ tone: "error", text: "Create or load a split before making a deposit." }); return; }
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) { setNotice({ tone: "error", text: "Enter a BOT amount greater than zero." }); return; }
    if (!SPLITCHAIN_ADDRESS) return;
    try {
      setStatus("depositing");
      const hash = await walletClient().writeContract({ address: SPLITCHAIN_ADDRESS, abi: splitChainAbi, functionName: "deposit", args: [activeSplit.id], value: parseEther(amount) });
      await confirm(hash);
      await Promise.all([loadSplit(activeSplit.id), loadActivity()]);
      setNotice({ tone: "success", text: `${amount} BOT was deposited into Split #${activeSplit.id}.` });
    } catch (error) {
      setNotice({ tone: "error", text: toUserMessage(error, "We could not complete the deposit. Check your BOT balance and try again.") });
    } finally {
      setStatus("idle");
    }
  }

  async function distribute() {
    if (!activeSplit || !SPLITCHAIN_ADDRESS) return;
    try {
      setStatus("distributing");
      const hash = await walletClient().writeContract({ address: SPLITCHAIN_ADDRESS, abi: splitChainAbi, functionName: "distribute", args: [activeSplit.id] });
      await confirm(hash);
      await Promise.all([loadSplit(activeSplit.id), loadActivity()]);
      setNotice({ tone: "success", text: "The complete split balance was distributed successfully." });
    } catch (error) {
      setNotice({ tone: "error", text: toUserMessage(error, "We could not distribute this balance. Please try again.") });
    } finally {
      setStatus("idle");
    }
  }

  async function handleLookup() {
    if (!/^\d+$/.test(lookupId)) { setNotice({ tone: "error", text: "Enter a valid numeric split ID." }); return; }
    try {
      setStatus("loading");
      await loadSplit(BigInt(lookupId));
      setNotice({ tone: "success", text: `Split #${lookupId} is now loaded.` });
    } catch (error) {
      setNotice({ tone: "error", text: toUserMessage(error, "We could not find that split on BOT Chain Testnet.") });
    } finally {
      setStatus("idle");
    }
  }

  function changeRecipient(id: string, field: keyof Omit<RecipientDraft, "id">, value: string) {
    setRecipients((current) => current.map((recipient) => recipient.id === id ? { ...recipient, [field]: value } : recipient));
  }

  function addRecipient() {
    setRecipients((current) => [...current, { id: crypto.randomUUID(), label: "", address: "", percentage: "" }]);
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link href="/" className="brand-link"><BrandMark /></Link>
        <div className="header-network"><i /> BOT Chain Testnet</div>
        <div className="wallet-area">
          <a className="faucet-link" href="https://faucet.botchain.ai" target="_blank" rel="noreferrer">Get test BOT <ExternalLink size={13} /></a>
          <a className="connected-wallet" href={`https://scan.bohr.life/address/${account}`} target="_blank" rel="noreferrer"><i className="online" /><span>{shortAddress(account)}</span><ExternalLink size={14} /></a>
        </div>
      </header>

      <main id="main" className="workspace">
        <div className="page-intro">
          <div><p className="section-label">Payment splitter</p><h1>Create a split</h1><p>Define recipient wallets and shares, then store the split on BOT Chain Testnet.</p></div>
          <div className={`contract-status ${CONTRACT_READY ? "ready" : "not-ready"}`}><ShieldCheck size={17} /><span><strong>{CONTRACT_READY ? "Contract connected" : "Contract not configured"}</strong><small>{CONTRACT_READY ? shortAddress(SPLITCHAIN_ADDRESS as string) : "Add the deployed address"}</small></span></div>
        </div>

        {notice ? <div className={`notice notice-${notice.tone}`} role="status"><AlertCircle size={18} /><span>{notice.text}</span><button type="button" onClick={() => setNotice(null)} aria-label="Dismiss message">×</button></div> : null}

        <div className="workspace-grid">
          <div className="split-card">
            <section className="basics-section" aria-labelledby="basics-heading">
              <div className="section-heading-row"><div><p className="eyebrow">Step 1</p><h2 id="basics-heading">Split details</h2></div><span className="secure-note"><LockKeyhole size={14} /> Creator-controlled</span></div>
              <div className="basics-grid">
                <label><span>Split name</span><input value={splitName} onChange={(event) => setSplitName(event.target.value)} maxLength={64} placeholder="e.g. Design team" /></label>
                <label><span>BOT amount</span><div className="token-input"><input type="number" min="0" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0.00" /><span className="token-symbol"><i>B</i> BOT</span></div></label>
              </div>
            </section>

            <RecipientBuilder recipients={recipients} amount={amount} onChange={changeRecipient} onAdd={addRecipient} onRemove={(id) => setRecipients((current) => current.filter((recipient) => recipient.id !== id))} />

            <div className="split-footer">
              <div className="total-block">
                <div className="total-row"><span>Total allocated</span><strong className={isCorrectTotal ? "valid-total" : "invalid-total"}>{totalPercentage.toFixed(2)}%</strong></div>
                <div className="progress-track" aria-label={`${totalPercentage}% allocated`}><span style={{ width: `${Math.min(totalPercentage, 100)}%` }} /></div>
                <small className={isCorrectTotal ? "total-help valid-total" : "total-help invalid-total"}>{isCorrectTotal ? <><Check size={13} /> Shares total exactly 100%</> : `${Math.abs(100 - totalPercentage).toFixed(2)}% ${totalPercentage < 100 ? "left to assign" : "over-allocated"}`}</small>
              </div>
              <button className="primary-action" type="button" onClick={createSplit} disabled={isBusy || Boolean(formError) || !CONTRACT_READY}>{status === "creating" ? <LoaderCircle className="spin" size={18} /> : <Plus size={18} />}{status === "creating" ? "Confirming…" : "Create split"}</button>
            </div>
          </div>

          <aside className="side-panel">
            <section className="summary-card">
              <div className="summary-top"><span className="summary-icon"><CircleDollarSign size={21} /></span><span><small>Payment amount</small><strong>{amount && Number(amount) > 0 ? `${Number(amount).toLocaleString(undefined, { maximumFractionDigits: 6 })} BOT` : "Not entered"}</strong></span></div>
              {recipients.some((recipient) => Number(recipient.percentage) > 0) ? <><div className="distribution-bar" aria-hidden="true">{recipients.map((recipient, index) => <span key={recipient.id} style={{ width: `${Math.max(0, Number(recipient.percentage) || 0)}%`, backgroundColor: previewColors[index % previewColors.length] }} />)}</div><div className="summary-list">{recipients.map((recipient, index) => <div key={recipient.id}><span><i style={{ backgroundColor: previewColors[index % previewColors.length] }} />{recipient.label || `Recipient ${index + 1}`}</span><strong>{recipient.percentage || 0}%</strong></div>)}</div></> : <p className="summary-empty">Recipient shares will appear here as you enter them.</p>}
              <div className="gas-note"><Network size={16} /><span><strong>Native BOT</strong><small>No token approval is required</small></span></div>
            </section>

            <section className="manage-card">
              <div className="manage-heading"><div><p className="eyebrow">Manage</p><h2>{activeSplit ? `Split #${activeSplit.id}` : "Load a split"}</h2></div>{activeSplit ? <span className="active-pill">On-chain</span> : null}</div>
              <div className="lookup-row"><label className="sr-only" htmlFor="split-id">Split ID</label><input id="split-id" inputMode="numeric" value={lookupId} onChange={(event) => setLookupId(event.target.value)} placeholder="Enter split ID" /><button type="button" onClick={handleLookup} disabled={isBusy || !CONTRACT_READY}>Load</button></div>
              {activeSplit ? (
                <div className="active-details">
                  <div className="active-name"><strong>{activeSplit.name}</strong><small>Owner {shortAddress(activeSplit.owner)}</small></div>
                  <div className="active-stats"><span><small>Available</small><strong>{Number(formatEther(activeSplit.balance)).toLocaleString(undefined, { maximumFractionDigits: 6 })} BOT</strong></span><span><small>Distributed</small><strong>{Number(formatEther(activeSplit.totalDistributed)).toLocaleString(undefined, { maximumFractionDigits: 6 })} BOT</strong></span></div>
                  <button className="secondary-action" type="button" onClick={deposit} disabled={isBusy || !amount || Number(amount) <= 0}><ArrowDownToLine size={17} />{status === "depositing" ? "Confirming…" : "Deposit BOT"}</button>
                  <button className="distribute-action" type="button" onClick={distribute} disabled={isBusy || activeSplit.balance === 0n || account.toLowerCase() !== activeSplit.owner.toLowerCase()}><SendHorizontal size={17} />{status === "distributing" ? "Confirming…" : "Distribute balance"}</button>
                </div>
              ) : <p className="manage-empty">Enter an existing split ID to view its live balance and distribution controls.</p>}
            </section>
          </aside>
        </div>

        <TransactionHistory items={activity} loading={historyLoading} />
      </main>
      <SiteFooter />
    </div>
  );
}
