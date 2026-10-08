import { BOTCHAIN_DEPLOYMENT } from "@/lib/chain";

const userMessages: Array<[string, string]> = [
  ["User rejected", "You cancelled the request in your wallet."],
  ["user rejected", "You cancelled the request in your wallet."],
  ["rejected the request", "You cancelled the request in your wallet."],
  ["insufficient funds", "Your wallet does not have enough BOT for this transaction and its network fee."],
  ["InvalidTotalPercentage", "Recipient shares must total exactly 100%."],
  ["DuplicateRecipient", "Each recipient must use a different wallet address."],
  ["ZeroAddress", "A recipient has an empty wallet address. Enter a valid address."],
  ["InvalidShare", "Every recipient needs a share greater than 0%."],
  ["InvalidRecipientCount", "A split needs between 2 and 50 recipients."],
  ["Unauthorized", "Only the wallet that created this split can distribute its balance."],
  ["NothingToDistribute", "This split has no BOT available to distribute."],
  ["SplitNotFound", `That split ID does not exist on ${BOTCHAIN_DEPLOYMENT.chainName}.`],
  ["TransferFailed", "A recipient wallet could not receive BOT. No funds were distributed."],
  ["network changed", "Your wallet changed networks. Please try again."],
  ["could not coalesce", "Your wallet could not process the request. Check the network and try again."],
];

export function toUserMessage(error: unknown, fallback = "Something went wrong. Please try again.") {
  if (!(error instanceof Error)) return fallback;
  const match = userMessages.find(([needle]) => error.message.includes(needle));
  return match?.[1] ?? fallback;
}
