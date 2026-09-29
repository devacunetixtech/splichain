import { GripVertical, Plus, Trash2, Wallet } from "lucide-react";

export type RecipientDraft = { id: string; label: string; address: string; percentage: string };

type Props = {
  recipients: RecipientDraft[];
  amount: string;
  onChange: (id: string, field: keyof Omit<RecipientDraft, "id">, value: string) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
};

const colors = ["#7C5CFC", "#2BB673", "#F3A63B", "#377CF6", "#E55574", "#15A0AE"];

function recipientAmount(amount: string, percentage: string) {
  const value = Number(amount);
  const share = Number(percentage);
  if (!value || !share || !Number.isFinite(value) || !Number.isFinite(share)) return "—";
  return ((value * share) / 100).toLocaleString(undefined, { maximumFractionDigits: 6 });
}

export function RecipientBuilder({ recipients, amount, onChange, onAdd, onRemove }: Props) {
  return (
    <section className="builder-section" aria-labelledby="recipients-heading">
      <div className="section-heading-row">
        <div><p className="eyebrow">Step 2</p><h2 id="recipients-heading">Recipients & shares</h2></div>
        <span className="recipient-count">{recipients.length} recipients</span>
      </div>
      <div className="recipient-labels" aria-hidden="true"><span>Recipient</span><span>Wallet address</span><span>Share</span><span>Receives</span><span /></div>
      <div className="recipient-list">
        {recipients.map((recipient, index) => (
          <div className="recipient-row" key={recipient.id}>
            <GripVertical className="drag-icon" size={17} aria-hidden="true" />
            <div className="recipient-identity">
              <span className="avatar" style={{ backgroundColor: colors[index % colors.length] }}>{(recipient.label || String(index + 1)).slice(0, 1).toUpperCase()}</span>
              <label className="sr-only" htmlFor={`label-${recipient.id}`}>Recipient name</label>
              <input id={`label-${recipient.id}`} value={recipient.label} onChange={(event) => onChange(recipient.id, "label", event.target.value)} placeholder={`Recipient ${index + 1}`} maxLength={32} />
            </div>
            <div className="address-field">
              <Wallet size={16} aria-hidden="true" />
              <label className="sr-only" htmlFor={`address-${recipient.id}`}>Wallet address</label>
              <input id={`address-${recipient.id}`} value={recipient.address} onChange={(event) => onChange(recipient.id, "address", event.target.value.trim())} placeholder="0x..." spellCheck={false} />
            </div>
            <div className="percent-field">
              <label className="sr-only" htmlFor={`percentage-${recipient.id}`}>Percentage share</label>
              <input id={`percentage-${recipient.id}`} type="number" min="0.01" max="100" step="0.01" value={recipient.percentage} onChange={(event) => onChange(recipient.id, "percentage", event.target.value)} />
              <span>%</span>
            </div>
            <output className="receives-amount">{recipientAmount(amount, recipient.percentage)} <small>BOT</small></output>
            <button className="icon-button remove-button" type="button" onClick={() => onRemove(recipient.id)} disabled={recipients.length <= 2} aria-label={`Remove ${recipient.label || `recipient ${index + 1}`}`}><Trash2 size={17} /></button>
          </div>
        ))}
      </div>
      <button className="add-recipient" type="button" onClick={onAdd} disabled={recipients.length >= 50}><Plus size={17} /> Add recipient</button>
    </section>
  );
}
