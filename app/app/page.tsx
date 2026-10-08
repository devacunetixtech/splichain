import type { Metadata } from "next";
import { AppAccess } from "@/components/app-access";
import { BOTCHAIN_DEPLOYMENT } from "@/lib/chain";

export const metadata: Metadata = {
  title: "App | SplitChain",
  description: `Create, fund, and distribute BOT payment splits on ${BOTCHAIN_DEPLOYMENT.chainName}.`,
};

export default function AppPage() {
  return <AppAccess />;
}
