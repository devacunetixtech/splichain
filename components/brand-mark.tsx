import Image from "next/image";

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="brand-lockup" aria-label="SplitChain">
      <Image className="brand-icon" src="/favicon.svg" width={36} height={36} alt="" priority />
      {compact ? null : <span className="brand-name">SplitChain</span>}
    </span>
  );
}
