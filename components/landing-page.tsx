"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, LogOut, LockKeyhole, Network, Percent, ShieldCheck, Wallet } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { SiteFooter } from "@/components/site-footer";
import { useWallet } from "@/hooks/use-wallet";
import { BOTCHAIN_DEPLOYMENT } from "@/lib/chain";

export function LandingPage() {
  const router = useRouter();
  const wallet = useWallet();

  const openApp = () => router.push("/app");
  const connectWallet = () => void wallet.connect();

  return (
    <div className="landing-shell">
      <header className="landing-nav">
        <Link href="/" aria-label="SplitChain home"><BrandMark /></Link>
        <nav aria-label="Main navigation"><a href="#how-it-works">How it works</a><a href="#security">Security</a><a href="#network">BOT Chain</a></nav>
        <div className="landing-wallet-actions">
          {wallet.account ? <button className="nav-disconnect" type="button" onClick={wallet.disconnect} aria-label="Disconnect wallet"><LogOut size={16} />Disconnect</button> : null}
          <button className="nav-wallet" type="button" onClick={wallet.account ? openApp : connectWallet} disabled={wallet.connecting}>
            <Wallet size={17} />{wallet.connecting ? "Connecting…" : wallet.account ? "Open App" : "Connect wallet"}
          </button>
        </div>
      </header>

      <main>
        <section className="hero-section">
          <div className="hero-copy">
            <p className="section-label">Payment splitting on BOT Chain</p>
            <h1>One payment.<br />Everyone gets their share.</h1>
            <p className="hero-text">Create an on-chain split between multiple wallets, fund it with native BOT, and distribute the full balance using fixed percentages.</p>
            <div className="hero-actions">
              <button className="hero-primary" type="button" onClick={wallet.account ? openApp : connectWallet} disabled={wallet.connecting}><Wallet size={18} />{wallet.connecting ? "Connecting wallet…" : wallet.account ? "Open App" : "Connect wallet to start"}</button>
              {wallet.account ? <button className="hero-secondary" type="button" onClick={wallet.disconnect}><LogOut size={17} />Disconnect</button> : <a className="hero-secondary" href="#how-it-works">See how it works <ArrowRight size={17} /></a>}
            </div>
            {wallet.error ? <p className="wallet-error" role="alert">{wallet.error}</p> : null}
            <div className="hero-proof"><span><CheckCircle2 size={15} /> Exact 100% allocation</span><span><CheckCircle2 size={15} /> Native BOT payments</span><span><CheckCircle2 size={15} /> Creator-controlled release</span></div>
          </div>

          <div className="route-panel" aria-label="SplitChain payment flow">
            <div className="route-header"><span>Payment route</span><span className="route-network"><i /> {BOTCHAIN_DEPLOYMENT.chainName}</span></div>
            <div className="route-source"><span className="route-icon"><Wallet size={20} /></span><div><small>Split balance</small><strong>Native BOT</strong></div></div>
            <div className="route-line"><span /></div>
            <div className="route-rule"><Percent size={18} /><span><strong>Fixed allocation</strong><small>Shares must equal 100%</small></span></div>
            <div className="route-line split"><span /><span /><span /></div>
            <div className="route-recipients"><span>Wallet 1</span><span>Wallet 2</span><span>Wallet 3+</span></div>
            <div className="route-foot"><ShieldCheck size={16} /> Distribution follows the split stored in the contract.</div>
          </div>
        </section>

        <section id="how-it-works" className="content-section">
          <div className="section-intro"><p className="section-label">How it works</p><h2>Set the rules once. Reuse the split.</h2><p>Each split stores its recipients and basis-point shares on-chain. Deposits can arrive over time; the creator decides when to distribute the available balance.</p></div>
          <div className="step-grid">
            <article><span>01</span><h3>Create a split</h3><p>Add between 2 and 50 wallet addresses. Every address must be unique and every share must be greater than zero.</p></article>
            <article><span>02</span><h3>Fund with BOT</h3><p>Deposit native BOT directly into the selected split. No token approval transaction is required.</p></article>
            <article><span>03</span><h3>Distribute</h3><p>The creator releases the complete available balance. Every payment is recorded on BOT Chain.</p></article>
          </div>
        </section>

        <section id="security" className="security-section">
          <div><p className="section-label">Contract safeguards</p><h2>Invalid splits never reach the chain.</h2><p>The interface validates entries before asking for a signature, and the contract independently enforces the same rules.</p></div>
          <ul>
            <li><ShieldCheck size={18} /><span><strong>Exact totals</strong>Shares must equal 10,000 basis points.</span></li>
            <li><LockKeyhole size={18} /><span><strong>Controlled release</strong>Only the split creator can distribute funds.</span></li>
            <li><Network size={18} /><span><strong>Atomic payments</strong>If one transfer fails, the complete distribution reverts.</span></li>
          </ul>
        </section>

        <section id="network" className="network-section">
          <div><p className="section-label">Built on BOT Chain</p><h2>EVM-compatible settlement for native BOT.</h2></div>
          <div className="network-facts"><span><small>Network</small><strong>{BOTCHAIN_DEPLOYMENT.chainName}</strong></span><span><small>Chain ID</small><strong>{BOTCHAIN_DEPLOYMENT.chainId}</strong></span><span><small>Currency</small><strong>BOT</strong></span></div>
          <div className="network-links"><a href="https://botchain.ai" target="_blank" rel="noreferrer">BOT Chain website</a><a href={BOTCHAIN_DEPLOYMENT.explorerUrl} target="_blank" rel="noreferrer">{BOTCHAIN_DEPLOYMENT.isTestnet ? "Testnet explorer" : "Mainnet explorer"}</a></div>
        </section>

        <section className="landing-cta"><div><h2>Ready to create a split?</h2><p>{wallet.account ? "Your wallet is connected. Open the app when you are ready." : `Connect a wallet on ${BOTCHAIN_DEPLOYMENT.chainName} to access the app.`}</p></div><button className="hero-primary" type="button" onClick={wallet.account ? openApp : connectWallet} disabled={wallet.connecting}>{wallet.connecting ? "Connecting…" : wallet.account ? "Open App" : "Connect wallet"} <ArrowRight size={17} /></button></section>
      </main>
      <SiteFooter />
    </div>
  );
}
