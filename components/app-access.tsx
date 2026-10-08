"use client";

import Link from "next/link";
import { LoaderCircle, Network, Wallet } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { SiteFooter } from "@/components/site-footer";
import { SplitterApp } from "@/components/splitter-app";
import { useWallet } from "@/hooks/use-wallet";
import { BOTCHAIN_DEPLOYMENT } from "@/lib/chain";

export function AppAccess() {
  const wallet = useWallet();

  if (wallet.checking) {
    return <div className="access-screen"><header className="access-header"><Link href="/"><BrandMark /></Link><Link href="/">Back to home</Link></header><main className="access-page"><section className="access-card"><span className="access-icon"><LoaderCircle className="spin" size={28} /></span><h1>Checking your wallet</h1><p>Reading the connection from your browser wallet.</p></section></main><SiteFooter /></div>;
  }

  if (!wallet.account) {
    return (
      <div className="access-screen">
        <header className="access-header"><Link href="/"><BrandMark /></Link><Link href="/">Back to home</Link></header>
        <main className="access-page"><section className="access-card"><span className="access-icon"><Wallet size={28} /></span><h1>Connect your wallet</h1><p>SplitChain reads and writes directly to {BOTCHAIN_DEPLOYMENT.chainName}. Connect a compatible wallet to access the app.</p><button className="hero-primary" type="button" onClick={wallet.connect} disabled={wallet.connecting}>{wallet.connecting ? "Waiting for wallet…" : "Connect wallet"}</button>{wallet.error ? <div className="access-error" role="alert">{wallet.error}</div> : null}<small>Recommended: Bitget Wallet or TokenPocket.</small></section></main>
        <SiteFooter />
      </div>
    );
  }

  if (!wallet.isBotchain) {
    return (
      <div className="access-screen">
        <header className="access-header"><Link href="/"><BrandMark /></Link><Link href="/">Back to home</Link></header>
        <main className="access-page"><section className="access-card"><span className="access-icon"><Network size={28} /></span><h1>Switch to {BOTCHAIN_DEPLOYMENT.chainName}</h1><p>Your wallet is connected, but it is on a different network. Switch networks before opening the app.</p><button className="hero-primary" type="button" onClick={() => void wallet.switchNetwork()}>Switch network</button><small>Chain ID {BOTCHAIN_DEPLOYMENT.chainId} · Native currency BOT</small></section></main>
        <SiteFooter />
      </div>
    );
  }

  return <SplitterApp account={wallet.account} onDisconnect={wallet.disconnect} />;
}
