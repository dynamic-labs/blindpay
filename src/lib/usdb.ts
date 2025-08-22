import { parseUnits, formatUnits } from "viem";
import { USDB_ABI } from "./abis/usdb";
import { config } from "./config";

// USDB Token utility functions
export const USDB_DECIMALS = 6; // Standard for USDB (assuming 6 decimals like USDC)

export const usdbUtils = {
  // Convert human-readable amount to wei (token units)
  parseAmount: (amount: string | number): bigint => {
    return parseUnits(amount.toString(), USDB_DECIMALS);
  },

  // Convert wei (token units) to human-readable amount
  formatAmount: (amount: bigint, decimals: number = 2): string => {
    return parseFloat(formatUnits(amount, USDB_DECIMALS)).toFixed(decimals);
  },

  // Get contract details
  contract: {
    address: config.contracts.usdb,
    abi: USDB_ABI,
  },

  // Common contract calls
  getBalance: (address: `0x${string}`) => ({
    address: config.contracts.usdb,
    abi: USDB_ABI,
    functionName: "balanceOf" as const,
    args: [address],
  }),

  getAllowance: (owner: `0x${string}`, spender: `0x${string}`) => ({
    address: config.contracts.usdb,
    abi: USDB_ABI,
    functionName: "allowance" as const,
    args: [owner, spender],
  }),

  // Transaction functions
  transfer: (to: `0x${string}`, amount: bigint) => ({
    address: config.contracts.usdb,
    abi: USDB_ABI,
    functionName: "transfer" as const,
    args: [to, amount],
  }),

  approve: (spender: `0x${string}`, amount: bigint) => ({
    address: config.contracts.usdb,
    abi: USDB_ABI,
    functionName: "approve" as const,
    args: [spender, amount],
  }),
};
