"use client";

import ConversionCard from "@/components/ConversionCard";
import BlindPayReceiverInvite from "@/components/BlindPayReceiverInvite";
import Nav from "@/components/nav";
import PaymentMethods from "@/components/PaymentMethods";
import TransactionHistory from "@/components/TransactionHistory";
import WalletInfo from "@/components/WalletInfo";
import { config } from "@/lib/config";
import { useDynamicContext } from "@/lib/dynamic";
import { useKYCStatus } from "@/lib/hooks/useKYCStatus";
import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { approveUSDBTokens } from "@/lib/walletInteractions";
import {
  ConversionData,
  ConversionResult,
  BankAccount,
  Currency,
  Network,
} from "@/types";

interface BlockchainWallet {
  id: string;
  name: string;
  network: string;
  address: string;
  is_account_abstraction: boolean;
  created_at: string;
}

export default function Main() {
  const { primaryWallet } = useDynamicContext();
  const { isConnected } = useAccount();
  const { receiverId, isKYCComplete, isLoading: kycLoading } = useKYCStatus();
  const [isConverting, setIsConverting] = useState(false);
  const [conversionResult, setConversionResult] =
    useState<ConversionResult | null>(null);
  const [hasPaymentMethods, setHasPaymentMethods] = useState(false);
  const [hasBankAccounts, setHasBankAccounts] = useState(false);
  const [hasBlockchainWallets, setHasBlockchainWallets] = useState(false);
  const [showBankSelection, setShowBankSelection] = useState(false);
  const [showWalletSelection, setShowWalletSelection] = useState(false);
  const [availableBankAccounts, setAvailableBankAccounts] = useState<
    BankAccount[]
  >([]);
  const [availableBlockchainWallets, setAvailableBlockchainWallets] = useState<
    BlockchainWallet[]
  >([]);
  const [selectedBankAccountId, setSelectedBankAccountId] =
    useState<string>("");
  const [selectedBlockchainWalletId, setSelectedBlockchainWalletId] =
    useState<string>("");
  const [pendingConversionData, setPendingConversionData] =
    useState<ConversionData | null>(null);

  const handleBankAccountSelection = async (bankAccountId: string) => {
    setSelectedBankAccountId(bankAccountId);
    setShowBankSelection(false);

    if (pendingConversionData) {
      await proceedWithStableToFiatConversion(
        pendingConversionData,
        bankAccountId
      );
    }
  };

  const handleBlockchainWalletSelection = async (
    blockchainWalletId: string
  ) => {
    setSelectedBlockchainWalletId(blockchainWalletId);
    setShowWalletSelection(false);

    if (pendingConversionData) {
      await proceedWithFiatToStableConversion(
        pendingConversionData,
        blockchainWalletId
      );
    }
  };

  const proceedWithStableToFiatConversion = async (
    data: ConversionData,
    bankAccountId: string
  ) => {
    setIsConverting(true);
    try {
      const quoteResponse = await fetch("/api/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromCurrency: data.fromCurrency,
          toCurrency: data.toCurrency,
          amount: data.fromAmount,
          walletAddress: primaryWallet!.address,
          useBlindPayPayout: true,
          bankAccountId,
          token: data.fromCurrency as Currency,
          network: config.blindpayDefaults.network as Network,
          currencyType: config.blindpayDefaults.currencyType,
          coverFees: config.blindpayDefaults.coverFees,
        }),
      });

      const quoteResult = await quoteResponse.json();

      // Log the payout quote response
      console.log("💱 Payout Quote Response:", {
        quoteId: quoteResult.quote?.id,
        contract: quoteResult.quote?.contract,
        fullResponse: quoteResult,
        timestamp: new Date().toISOString(),
      });

      if (!quoteResult.success) {
        alert("Quote creation failed. Please try again.");
        return;
      }

      if (quoteResult.step === "quote_created") {
        const spenderAddress =
          quoteResult.quote.contract?.blindpayContractAddress;
        const contractAddress = quoteResult.quote.quote.contract?.address;
        const approvalAmount = quoteResult.quote.quote.contract?.amount;

        if (!spenderAddress || !contractAddress || !approvalAmount) {
          alert("Missing required quote data");
          return;
        }

        const approvalTxHash = await approveUSDBTokens(
          contractAddress,
          spenderAddress,
          approvalAmount
        );
        alert(
          `Tokens approved! Transaction: ${approvalTxHash.slice(0, 10)}...`
        );

        const payoutResponse = await fetch("/api/convert", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fromCurrency: data.fromCurrency,
            toCurrency: data.toCurrency,
            amount: data.fromAmount,
            walletAddress: primaryWallet!.address,
            useBlindPayPayout: true,
            approvalTxHash,
            quoteId: quoteResult.quote.id,
            bankAccountId,
            token: data.fromCurrency as Currency,
            network: config.blindpayDefaults.network as Network,
            currencyType: config.blindpayDefaults.currencyType,
            coverFees: config.blindpayDefaults.coverFees,
          }),
        });

        const payoutResult = await payoutResponse.json();

        // Log the payout response
        console.log("🎯 Payout Response Completed:", {
          conversionId: payoutResult.conversion?.id,
          fullResponse: payoutResult,
          timestamp: new Date().toISOString(),
        });

        if (payoutResult.success) {
          setConversionResult(payoutResult.conversion);
          alert(`Conversion completed! ID: ${payoutResult.conversion.id}`);
          setPendingConversionData(null);
          setSelectedBankAccountId("");
        } else {
          alert("Payout failed. Please try again.");
        }
      }
    } catch {
      alert("Conversion failed. Please try again.");
    } finally {
      setIsConverting(false);
      setPendingConversionData(null);
      setSelectedBankAccountId("");
    }
  };

  const proceedWithFiatToStableConversion = async (
    data: ConversionData,
    blockchainWalletId: string
  ) => {
    setIsConverting(true);
    try {
      // Skip adding wallet - user already has blockchain wallets added through PaymentMethods
      // The blockchainWalletId parameter contains the ID of an existing wallet

      const quoteResponse = await fetch("/api/payin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: "create_quote",
          amount: data.fromAmount,
          receiverId: receiverId,
          token: data.toCurrency as Currency,
          paymentMethod: config.blindpayDefaults.paymentMethod,
          network: config.blindpayDefaults.network as Network,
          blockchainWalletId, // Pass the selected wallet ID
        }),
      });

      const quoteResult = await quoteResponse.json();

      // Log the quote response
      console.log("💱 Quote Response:", {
        quoteId: quoteResult.quote?.id,
        amount: quoteResult.quote?.amount,
        fullResponse: quoteResult,
        timestamp: new Date().toISOString(),
      });

      if (!quoteResult.success) {
        alert("Failed to create quote. Please try again.");
        return;
      }

      const payinResponse = await fetch("/api/payin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: "initiate_payin",
          quoteId: quoteResult.quote.id,
        }),
      });

      const payinResult = await payinResponse.json();

      // Log the completed payin response
      console.log("🎯 Payin Response Completed:", {
        payinId: payinResult.payin?.id,
        memoCode: payinResult.memoCode,
        bankingDetails: payinResult.bankingDetails,
        fullResponse: payinResult,
        timestamp: new Date().toISOString(),
      });

      if (payinResult.success) {
        setConversionResult({
          id: payinResult.payin.id,
          fromCurrency: data.fromCurrency,
          toCurrency: data.toCurrency,
          fromAmount: data.fromAmount,
          toAmount: parseFloat(quoteResult.quote.amount) / 100,
          status: "processing",
          blindpay: {
            payinId: payinResult.payin.id,
            memoCode: payinResult.memoCode,
            bankingDetails: payinResult.bankingDetails,
          },
        });
        alert(
          `Payin initiated! Use memo code: ${payinResult.memoCode} for your ACH transfer.`
        );
        setPendingConversionData(null);
        setSelectedBlockchainWalletId("");
      } else {
        alert("Payin failed. Please try again.");
      }
    } catch {
      alert("Conversion failed. Please try again.");
    } finally {
      setIsConverting(false);
      setPendingConversionData(null);
      setSelectedBlockchainWalletId("");
    }
  };

  const handleStableToFiatConversion = async (data: ConversionData) => {
    if (
      !isConnected ||
      !primaryWallet ||
      !isKYCComplete ||
      !receiverId ||
      !hasPaymentMethods
    ) {
      alert("Please complete setup first");
      return;
    }

    try {
      const bankAccountsResponse = await fetch(
        `/api/payment-methods/bank-accounts?receiverId=${receiverId}`
      );
      if (!bankAccountsResponse.ok)
        throw new Error("Failed to fetch bank accounts");

      const bankAccountsResult = await bankAccountsResponse.json();
      if (
        !bankAccountsResult.success ||
        !bankAccountsResult.bankAccounts?.length
      ) {
        throw new Error(
          "No bank accounts found. Please add a bank account first."
        );
      }

      setAvailableBankAccounts(bankAccountsResult.bankAccounts);
      setPendingConversionData(data);
      setShowBankSelection(true);
    } catch (error) {
      alert(
        error instanceof Error ? error.message : "Failed to fetch bank accounts"
      );
    }
  };

  const handleFiatToStableConversion = async (data: ConversionData) => {
    if (
      !isConnected ||
      !primaryWallet ||
      !isKYCComplete ||
      !receiverId ||
      !hasPaymentMethods
    ) {
      alert("Please complete setup first");
      return;
    }

    try {
      const walletsResponse = await fetch(
        `/api/payment-methods/blockchain-wallets?receiverId=${receiverId}`
      );
      if (!walletsResponse.ok)
        throw new Error("Failed to fetch blockchain wallets");

      const walletsResult = await walletsResponse.json();
      if (!walletsResult.success || !walletsResult.blockchainWallets?.length) {
        throw new Error(
          "No blockchain wallets found. Please add a blockchain wallet first."
        );
      }

      setAvailableBlockchainWallets(walletsResult.blockchainWallets);
      setPendingConversionData(data);
      setShowWalletSelection(true);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Failed to fetch blockchain wallets"
      );
    }
  };

  const checkPaymentMethods = async () => {
    if (!receiverId) return false;

    try {
      const bankAccountsResponse = await fetch(
        `/api/payment-methods/bank-accounts?receiverId=${receiverId}`
      );
      const bankAccountsData = await bankAccountsResponse.json();

      const walletsResponse = await fetch(
        `/api/payment-methods/blockchain-wallets?receiverId=${receiverId}`
      );
      const walletsData = await walletsResponse.json();

      const hasBankAccounts =
        bankAccountsData.success && bankAccountsData.bankAccounts?.length > 0;
      const hasWallets =
        walletsData.success && walletsData.blockchainWallets?.length > 0;

      const hasAnyPaymentMethod = hasBankAccounts || hasWallets;
      setHasPaymentMethods(hasAnyPaymentMethod);
      setHasBankAccounts(hasBankAccounts);
      setHasBlockchainWallets(hasWallets);
      return hasAnyPaymentMethod;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    if (isKYCComplete && receiverId) {
      checkPaymentMethods();
    }
  }, [isKYCComplete, receiverId]);

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-300 bg-gray-100 text-gray-800">
      <Nav />

      <main className="flex-1 pt-20 pb-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Welcome to BlindPay
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Convert between stablecoins and fiat currencies seamlessly with
              your Dynamic wallet
            </p>
          </div>

          {!isConnected ? (
            <div className="text-center py-12">
              <div className="bg-white rounded-xl shadow-lg p-8 max-w-md mx-auto">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                  Connect Your Wallet
                </h2>
                <p className="text-gray-600 mb-6">
                  Connect your wallet to start converting between stablecoins
                  and fiat currencies.
                </p>
                <div className="text-sm text-gray-500">
                  Click the &quot;Connect Wallet&quot; button in the top
                  navigation to get started.
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
                    Setup Progress
                  </h3>
                  <div className="flex items-center justify-center space-x-4">
                    <div
                      className={`flex items-center ${
                        isKYCComplete ? "text-green-600" : "text-gray-400"
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                          isKYCComplete
                            ? "border-green-600 bg-green-100"
                            : "border-gray-300"
                        }`}
                      >
                        {isKYCComplete ? "✓" : "1"}
                      </div>
                      <span className="ml-2 text-sm font-medium">
                        KYC Verification
                      </span>
                    </div>

                    <div
                      className={`w-16 h-0.5 ${
                        isKYCComplete ? "bg-green-600" : "bg-gray-300"
                      }`}
                    ></div>

                    <div
                      className={`flex items-center ${
                        hasPaymentMethods ? "text-green-600" : "text-gray-400"
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                          hasPaymentMethods
                            ? "border-green-600 bg-green-100"
                            : "border-gray-300"
                        }`}
                      >
                        {hasPaymentMethods ? "✓" : "2"}
                      </div>
                      <span className="ml-2 text-sm font-medium">
                        Payment Methods (1+)
                      </span>
                    </div>

                    <div
                      className={`w-16 h-0.5 ${
                        hasPaymentMethods ? "bg-green-600" : "bg-gray-300"
                      }`}
                    ></div>

                    <div
                      className={`flex items-center ${
                        hasPaymentMethods ? "text-green-600" : "text-gray-400"
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                          hasPaymentMethods
                            ? "border-green-600 bg-green-100"
                            : "border-gray-300"
                        }`}
                      >
                        {hasPaymentMethods ? "✓" : "3"}
                      </div>
                      <span className="ml-2 text-sm font-medium">
                        Ready to Convert
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {kycLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-600 mt-2">Checking KYC status...</p>
                </div>
              ) : !isKYCComplete ? (
                <div className="max-w-2xl mx-auto">
                  <BlindPayReceiverInvite />
                </div>
              ) : (
                <>
                  <div className="mb-8">
                    <PaymentMethods onUpdate={checkPaymentMethods} />
                  </div>

                  {hasPaymentMethods ? (
                    <div className="mb-6">
                      <div className="text-center mb-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">
                          Available Conversions
                        </h3>
                        <p className="text-gray-600">
                          {hasBankAccounts && hasBlockchainWallets
                            ? "You can convert in both directions - stablecoins to fiat and fiat to stablecoins"
                            : hasBankAccounts
                            ? "You can convert stablecoins to fiat (offramp)"
                            : "You can convert fiat to stablecoins (onramp)"}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {hasBankAccounts && (
                          <div className="flex justify-center">
                            <ConversionCard
                              title="Stablecoin to Fiat"
                              fromCurrency="USDB"
                              toCurrency="USD"
                              fromOptions={config.currencies.stablecoins}
                              toOptions={config.currencies.fiat}
                              onConvert={handleStableToFiatConversion}
                              isLoading={isConverting}
                            />
                          </div>
                        )}

                        {hasBlockchainWallets && (
                          <div className="flex justify-center">
                            <ConversionCard
                              title="Fiat to Stablecoin"
                              fromCurrency="USD"
                              toCurrency="USDB"
                              fromOptions={config.currencies.fiat}
                              toOptions={config.currencies.stablecoins}
                              onConvert={handleFiatToStableConversion}
                              isLoading={isConverting}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md mx-auto">
                        <h3 className="text-xl font-semibold text-gray-800 mb-4">
                          Almost Ready!
                        </h3>
                        <p className="text-gray-600 mb-4">
                          Your KYC verification is complete. Now you need to add
                          at least one payment method:
                        </p>
                        <ul className="text-left text-gray-600 mb-6 space-y-2">
                          <li>
                            • A bank account for receiving fiat payments
                            (enables offramping), OR
                          </li>
                          <li>
                            • A blockchain wallet for receiving stablecoins
                            (enables onramping)
                          </li>
                        </ul>
                        <p className="text-sm text-gray-500">
                          Use the Payment Methods section above to add at least
                          one payment method.
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <div className="lg:col-span-1 flex justify-center">
                  <WalletInfo />
                </div>
                <div className="lg:col-span-2">
                  {conversionResult && conversionResult.blindpay?.memoCode && (
                    <div className="mb-6">
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-lg font-semibold text-blue-800">
                            Payin Instructions - Complete Your ACH Transfer
                          </h3>
                          <button
                            onClick={() => setConversionResult(null)}
                            className="text-blue-400 hover:text-blue-600 text-lg"
                          >
                            ✕
                          </button>
                        </div>
                        <div className="text-blue-700 space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p>
                                <strong>Conversion ID:</strong>{" "}
                                {conversionResult.id}
                              </p>
                              <p>
                                <strong>From:</strong>{" "}
                                {conversionResult.fromAmount}{" "}
                                {conversionResult.fromCurrency}
                              </p>
                              <p>
                                <strong>To:</strong> {conversionResult.toAmount}{" "}
                                {conversionResult.toCurrency}
                              </p>
                              <p>
                                <strong>Status:</strong>{" "}
                                {conversionResult.status}
                              </p>
                            </div>

                            {conversionResult.blindpay?.bankingDetails && (
                              <div className="space-y-2">
                                <h4 className="font-semibold text-blue-800">
                                  Banking Details for ACH Transfer:
                                </h4>
                                <div className="bg-white p-3 rounded border text-sm space-y-1">
                                  <p>
                                    <strong>MEMO CODE:</strong>{" "}
                                    <span className="font-mono bg-yellow-100 px-2 py-1 rounded">
                                      {conversionResult.blindpay.memoCode}
                                    </span>
                                  </p>
                                  <p>
                                    <strong>Routing Number:</strong>{" "}
                                    {
                                      conversionResult.blindpay.bankingDetails
                                        .routing_number
                                    }
                                  </p>
                                  <p>
                                    <strong>Account Number:</strong>{" "}
                                    {
                                      conversionResult.blindpay.bankingDetails
                                        .account_number
                                    }
                                  </p>
                                  <p>
                                    <strong>Account Type:</strong>{" "}
                                    {
                                      conversionResult.blindpay.bankingDetails
                                        .account_type
                                    }
                                  </p>
                                  <p>
                                    <strong>Beneficiary:</strong>{" "}
                                    {
                                      conversionResult.blindpay.bankingDetails
                                        .beneficiary.name
                                    }
                                  </p>
                                  <p>
                                    <strong>Bank Address:</strong>{" "}
                                    {
                                      conversionResult.blindpay.bankingDetails
                                        .receiving_bank.address_line_1
                                    }
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="text-sm mt-4 p-3 rounded bg-orange-100 text-orange-700">
                            <p>
                              <strong>Important:</strong> Include the memo code
                              with your ACH transfer.
                            </p>
                            <p>
                              BlindPay will monitor for payments for 5 business
                              days.
                            </p>
                            <p>
                              Once payment is confirmed, USDC will be
                              transferred to your wallet.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  <TransactionHistory />
                </div>
              </div>

              {conversionResult && !conversionResult.blindpay?.memoCode && (
                <div className="max-w-4xl mx-auto">
                  <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                    <h3 className="text-lg font-semibold mb-2 text-green-800">
                      Conversion Initiated Successfully!
                    </h3>
                    <div className="text-green-700 space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p>
                            <strong>Conversion ID:</strong>{" "}
                            {conversionResult.id}
                          </p>
                          <p>
                            <strong>From:</strong> {conversionResult.fromAmount}{" "}
                            {conversionResult.fromCurrency}
                          </p>
                          <p>
                            <strong>To:</strong> {conversionResult.toAmount}{" "}
                            {conversionResult.toCurrency}
                          </p>
                          <p>
                            <strong>Status:</strong> {conversionResult.status}
                          </p>
                        </div>
                      </div>

                      <div className="text-sm mt-4 p-3 rounded bg-green-100 text-green-600">
                        <p>
                          You&apos;ll receive updates on the conversion
                          progress. Bank transfers typically take 1-3 business
                          days.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {showBankSelection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Select Bank Account</h3>
              <button
                onClick={() => {
                  setShowBankSelection(false);
                  setPendingConversionData(null);
                  setSelectedBankAccountId("");
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <p className="text-gray-600 mb-4 text-sm">
              Choose which bank account to use for this conversion:
            </p>

            <div className="space-y-3 mb-6">
              {availableBankAccounts.map((account) => (
                <div
                  key={account.id}
                  className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                    selectedBankAccountId === account.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => handleBankAccountSelection(account.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        {account.name}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {account.account_type} • {account.account_class} •{" "}
                        {account.country}
                      </p>
                      <p className="text-sm text-gray-500">
                        Account: ****{account.account_number.slice(-4)}
                        {account.routing_number &&
                          ` | Routing: ${account.routing_number}`}
                      </p>
                    </div>
                    {selectedBankAccountId === account.id && (
                      <div className="text-blue-600">✓</div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowBankSelection(false);
                  setPendingConversionData(null);
                  setSelectedBankAccountId("");
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (selectedBankAccountId && pendingConversionData) {
                    handleBankAccountSelection(selectedBankAccountId);
                  }
                }}
                disabled={!selectedBankAccountId}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue with Selected Account
              </button>
            </div>
          </div>
        </div>
      )}

      {showWalletSelection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                Select Blockchain Wallet
              </h3>
              <button
                onClick={() => {
                  setShowWalletSelection(false);
                  setPendingConversionData(null);
                  setSelectedBlockchainWalletId("");
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <p className="text-gray-600 mb-4 text-sm">
              Choose which blockchain wallet to use for this conversion:
            </p>

            <div className="space-y-3 mb-6">
              {availableBlockchainWallets.map((wallet) => (
                <div
                  key={wallet.id}
                  className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                    selectedBlockchainWalletId === wallet.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => handleBlockchainWalletSelection(wallet.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        {wallet.name}
                      </h4>
                      <p className="text-sm text-gray-600 capitalize">
                        {wallet.network} Network
                        {wallet.is_account_abstraction &&
                          " • Account Abstraction"}
                      </p>
                      <p className="text-sm text-gray-500 font-mono">
                        {wallet.address.slice(0, 6)}...
                        {wallet.address.slice(-4)}
                      </p>
                    </div>
                    {selectedBlockchainWalletId === wallet.id && (
                      <div className="text-blue-600">✓</div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowWalletSelection(false);
                  setPendingConversionData(null);
                  setSelectedBlockchainWalletId("");
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (selectedBlockchainWalletId && pendingConversionData) {
                    handleBlockchainWalletSelection(selectedBlockchainWalletId);
                  }
                }}
                disabled={!selectedBlockchainWalletId}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue with Selected Wallet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
