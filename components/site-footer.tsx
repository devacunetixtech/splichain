import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-brand"><BrandMark compact /><span>SplitChain</span></div>
      <p>Native BOT payment splits with on-chain allocation rules.</p>
      <nav aria-label="Footer navigation">
        <Link href="/">Home</Link>
        <Link href="/app">App</Link>
        <a href="https://botchain.ai" target="_blank" rel="noreferrer">BOT Chain <ExternalLink size={13} /></a>
        <a href="https://scan.botchain.ai" target="_blank" rel="noreferrer">BOT Chain Explorer <ExternalLink size={13} /></a>
      </nav>
    </footer>
  );
}
