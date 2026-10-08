import { ArrowDownToLine, ExternalLink, GitFork, LoaderCircle, SendHorizontal } from "lucide-react";
import { BOTCHAIN_DEPLOYMENT } from "@/lib/chain";

export type ActivityItem = { id: string; hash: string; type: "created" | "deposited" | "distributed"; title: string; detail: string; timestamp: number };
const activityIcon = { created: GitFork, deposited: ArrowDownToLine, distributed: SendHorizontal };

export function TransactionHistory({ items, loading }: { items: ActivityItem[]; loading: boolean }) {
  return (
    <section className="history-card" aria-labelledby="history-heading">
      <div className="history-header">
        <div><p className="eyebrow">On-chain</p><h2 id="history-heading">Transaction history</h2></div>
        <span className="network-pill"><i /> {BOTCHAIN_DEPLOYMENT.chainName}</span>
      </div>
      {loading ? (
        <div className="empty-history"><span className="empty-history-icon"><LoaderCircle className="spin" size={22} /></span><div><strong>Loading on-chain activity</strong><p>Reading recent SplitChain events from {BOTCHAIN_DEPLOYMENT.chainName}.</p></div></div>
      ) : items.length === 0 ? (
        <div className="empty-history">
          <span className="empty-history-icon"><GitFork size={22} /></span>
          <div><strong>No on-chain activity found</strong><p>Confirmed split transactions from this wallet will appear here.</p></div>
        </div>
      ) : (
        <div className="activity-list">
          {items.map((item) => {
            const Icon = activityIcon[item.type];
            return (
              <a key={item.id} href={`${BOTCHAIN_DEPLOYMENT.explorerUrl}/tx/${item.hash}`} target="_blank" rel="noreferrer" className="activity-row">
                <span className={`activity-icon activity-${item.type}`}><Icon size={17} /></span>
                <span className="activity-copy"><strong>{item.title}</strong><small>{item.detail}</small></span>
                <span className="activity-time">{new Date(item.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                <ExternalLink size={15} aria-hidden="true" />
              </a>
            );
          })}
        </div>
      )}
    </section>
  );
}
