import type { PaginatedResult } from "@/types/product";

export type WalletTxnType = "CREDIT" | "DEBIT";

export interface WalletTransaction {
  id: string;
  type: WalletTxnType;
  amount: string;
  reason: string;
  referenceOrderId: string | null;
  createdAt: string;
}

export interface WalletSummary {
  balance: string;
  currency: string;
  transactions: PaginatedResult<WalletTransaction>;
}

export type RewardTxnType = "EARN" | "REDEEM" | "EXPIRE";

export interface RewardLedgerEntry {
  id: string;
  points: number;
  type: RewardTxnType;
  sourceOrderId: string | null;
  createdAt: string;
}

export interface RewardSummary {
  balance: number;
  ledger: PaginatedResult<RewardLedgerEntry>;
}

export interface ReferralSummary {
  code: string;
  totalReferred: number;
  totalRewardsEarned: number;
}
