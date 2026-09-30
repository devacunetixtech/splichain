"use client";

import { useCallback, useEffect, useState } from "react";
import type { Address } from "viem";
import { addBotchainTestnetParams, botchainTestnet } from "@/lib/chain";
import { toUserMessage } from "@/lib/errors";

const DISCONNECTED_SESSION_KEY = "splitchain:wallet-disconnected";

export function shortAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function useWallet() {
  const [account, setAccount] = useState<Address | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [checking, setChecking] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sync = useCallback(async () => {
    if (window.sessionStorage.getItem(DISCONNECTED_SESSION_KEY) === "true") {
      setAccount(null);
      setChainId(null);
      setChecking(false);
      return;
    }
    if (!window.ethereum) {
      setChecking(false);
      return;
    }
    const checkTimeout = window.setTimeout(() => setChecking(false), 1800);
    try {
      const [accounts, rawChainId] = await Promise.all([
        window.ethereum.request({ method: "eth_accounts" }) as Promise<string[]>,
        window.ethereum.request({ method: "eth_chainId" }) as Promise<string>,
      ]);
      setAccount((accounts[0] as Address | undefined) ?? null);
      setChainId(Number.parseInt(rawChainId, 16));
    } catch {
      setAccount(null);
      setChainId(null);
    } finally {
      window.clearTimeout(checkTimeout);
      setChecking(false);
    }
  }, []);

  const switchNetwork = useCallback(async () => {
    if (!window.ethereum) throw new Error("Wallet unavailable");
    try {
      await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: "0x3c8" }] });
    } catch (networkError) {
      const code = typeof networkError === "object" && networkError !== null && "code" in networkError
        ? (networkError as { code?: number }).code
        : undefined;
      if (code !== 4902) throw networkError;
      await window.ethereum.request({ method: "wallet_addEthereumChain", params: [addBotchainTestnetParams] });
    }
    setChainId(botchainTestnet.id);
  }, []);

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      setError("No compatible wallet was found. Install Bitget Wallet or TokenPocket, then try again.");
      return null;
    }
    setConnecting(true);
    setError(null);
    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" }) as string[];
      const nextAccount = accounts[0] as Address | undefined;
      if (!nextAccount) throw new Error("No account selected");
      window.sessionStorage.removeItem(DISCONNECTED_SESSION_KEY);
      setAccount(nextAccount);
      await switchNetwork();
      return nextAccount;
    } catch (walletError) {
      setError(toUserMessage(walletError, "We could not connect your wallet. Check that it is unlocked and try again."));
      return null;
    } finally {
      setConnecting(false);
    }
  }, [switchNetwork]);

  const disconnect = useCallback(() => {
    window.sessionStorage.setItem(DISCONNECTED_SESSION_KEY, "true");
    setAccount(null);
    setChainId(null);
    setError(null);
    setConnecting(false);
  }, []);

  useEffect(() => {
    const initialSync = window.setTimeout(() => void sync(), 0);
    if (!window.ethereum?.on) return () => window.clearTimeout(initialSync);
    const handleChange = () => void sync();
    window.ethereum.on("accountsChanged", handleChange);
    window.ethereum.on("chainChanged", handleChange);
    return () => {
      window.clearTimeout(initialSync);
      window.ethereum?.removeListener?.("accountsChanged", handleChange);
      window.ethereum?.removeListener?.("chainChanged", handleChange);
    };
  }, [sync]);

  return {
    account,
    chainId,
    checking,
    connecting,
    error,
    isBotchain: chainId === botchainTestnet.id,
    connect,
    disconnect,
    switchNetwork,
    clearError: () => setError(null),
  };
}
