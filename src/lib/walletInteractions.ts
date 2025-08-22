import { parseUnits } from "viem";
import { writeContract, waitForTransactionReceipt } from "wagmi/actions";
import { USDB_ABI } from "@/lib/abis/usdb";
import { config as wagmiConfig } from "@/lib/wagmi";
import { config } from "@/lib/config";

/**
 * Approve USDB tokens for BlindPay transfer
 */
export async function approveUSDBTokens(
  contractAddress: string,
  spenderAddress: string,
  amount: string
): Promise<string> {
  try {
    // Execute the approval transaction using the contract address from BlindPay quote
    const hash = await writeContract(wagmiConfig, {
      address: contractAddress as `0x${string}`,
      abi: USDB_ABI,
      functionName: "approve",
      args: [spenderAddress as `0x${string}`, BigInt(amount)],
    });

    // Wait for transaction confirmation
    await waitForTransactionReceipt(wagmiConfig, {
      hash,
    });

    return hash;
  } catch (error) {
    throw new Error(
      `Failed to approve tokens: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Transfer USDB tokens to a specific address
 */
export async function transferUSDBTokens(
  amount: number,
  toAddress: string
): Promise<string> {
  try {
    // Convert amount to proper decimals
    const amountInTokens = parseUnits(amount.toString(), 6);

    // Execute the transfer transaction
    const hash = await writeContract(wagmiConfig, {
      address: config.contracts.usdb,
      abi: USDB_ABI,
      functionName: "transfer",
      args: [toAddress as `0x${string}`, amountInTokens],
    });

    // Wait for transaction confirmation
    await waitForTransactionReceipt(wagmiConfig, {
      hash,
    });

    return hash;
  } catch (error) {
    throw new Error(
      `Failed to transfer tokens: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Check if user has sufficient USDB balance and allowance
 * 🚨 NOT IMPLEMENTED - This function needs proper contract reading
 */
export async function checkTokenAllowanceAndBalance(
  userAddress: string,
  spenderAddress: string,
  requiredAmount: number
): Promise<{
  hasBalance: boolean;
  hasAllowance: boolean;
  balance: string;
  allowance: string;
}> {
  throw new Error(
    "checkTokenAllowanceAndBalance not implemented - use readContract from wagmi to implement this"
  );
}
