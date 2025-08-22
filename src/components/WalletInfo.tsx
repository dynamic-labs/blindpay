"use client";

import { useDynamicContext } from "@/lib/dynamic";
import { useAccount, useBalance, useReadContract } from "wagmi";
import { truncateAddress, formatTokenAmount } from "@/lib/utils";
import { USDB_ABI } from "@/lib/abis/usdb";
import { formatEther, formatUnits } from "viem";
import { config } from "@/lib/config";

export default function WalletInfo() {
  const { primaryWallet } = useDynamicContext();
  const { address, isConnected } = useAccount();

  const { data: ethBalance } = useBalance({
    address: address,
  });

  const { data: usdbBalance } = useBalance({
    address: address,
    token: config.contracts.usdb,
  });

  const { data: usdbDecimals } = useReadContract({
    address: config.contracts.usdb,
    abi: USDB_ABI,
    functionName: "decimals",
  });

  const { data: usdbSymbol } = useReadContract({
    address: config.contracts.usdb,
    abi: USDB_ABI,
    functionName: "symbol",
  });

  const { data: usdbName } = useReadContract({
    address: config.contracts.usdb,
    abi: USDB_ABI,
    functionName: "name",
  });

  if (!isConnected || !primaryWallet) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Wallet</h3>
        <p className="text-gray-600 text-center py-8">
          Please connect your wallet to view balances and start converting.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Wallet Info</h3>

      {/* Wallet Address */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="text-sm text-gray-600 mb-1">Connected Wallet</div>
        <div className="font-mono text-sm text-gray-800">
          {truncateAddress(address || "", 10, 8)}
        </div>
      </div>

      {/* Balances */}
      <div className="space-y-3">
        <div className="text-sm font-medium text-gray-700 mb-2">Balances</div>

        {/* ETH Balance (Base Sepolia) */}
        <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
          <span className="text-gray-700">ETH (Base Sepolia)</span>
          <span className="font-medium">
            {ethBalance
              ? formatTokenAmount(formatEther(ethBalance.value), 4)
              : "0.0000"}
          </span>
        </div>

        {/* USDB Balance */}
        <div className="flex justify-between items-center py-2 px-3 bg-blue-50 rounded-lg">
          <span className="text-gray-700">
            {usdbSymbol || "USDB"} {usdbName && `(${usdbName})`}
          </span>
          <span className="font-medium">
            {usdbBalance && usdbDecimals
              ? formatTokenAmount(
                  formatUnits(usdbBalance.value, usdbDecimals),
                  2
                )
              : usdbBalance
              ? formatTokenAmount(formatEther(usdbBalance.value), 2)
              : "0.00"}
          </span>
        </div>
      </div>

      {/* Network Info */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <div className="text-sm text-blue-700">
          <div className="flex justify-between">
            <span>Network:</span>
            <span className="font-medium">Base Sepolia</span>
          </div>
          <div className="flex justify-between mt-1">
            <span>Connector:</span>
            <span className="font-medium">
              {primaryWallet.connector?.name || "Unknown"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
