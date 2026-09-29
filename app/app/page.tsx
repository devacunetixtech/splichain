import type { Metadata } from "next";
import { AppAccess } from "@/components/app-access";

export const metadata: Metadata = {
  title: "App | SplitChain",
  description: "Create, fund, and distribute BOT payment splits on BOT Chain Testnet.",
};

export default function AppPage() {
  return <AppAccess />;
}
