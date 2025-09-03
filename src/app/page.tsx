"use client";

import ConversionCard from "@/components/ConversionCard";
import BlindPayReceiverInvite from "@/components/BlindPayReceiverInvite";
import Nav from "@/components/nav";
import PaymentMethods from "@/components/PaymentMethods";
import TransactionHistory from "@/components/TransactionHistory";
import SetupProgress from "@/components/SetupProgress";
import SelectionModal from "@/components/SelectionModal";
import ConversionResultDisplay from "@/components/ConversionResultDisplay";
import { config } from "@/lib/config";
import { useDynamicContext } from "@/lib/dynamic";
import { useKYCStatus } from "@/lib/hooks/useKYCStatus";
import { usePaymentMethods } from "@/lib/hooks/usePaymentMethods";
import { useConversion } from "@/lib/hooks/useConversion";
import { useState } from "react";
import { useAccount } from "wagmi";
import { ConversionData } from "@/types";

export default function Main() {
  const { primaryWallet } = useDynamicContext();
  const { isConnected } = useAccount();
  const { receiverId, isKYCComplete, isLoading: kycLoading } = useKYCStatus();

  const {
    hasPaymentMethods,
    hasBankAccounts,
    hasBlockchainWallets,
    availableBankAccounts,
    availableBlockchainWallets,
    checkPaymentMethods,
  } = usePaymentMethods(receiverId);

  const {
    isConverting,
    conversionResult,
    handleStableToFiatConversion,
    handleFiatToStableConversion,
    clearConversionResult,
  } = useConversion();

  // Modal state
  const [showBankSelection, setShowBankSelection] = useState(false);
  const [showWalletSelection, setShowWalletSelection] = useState(false);
  const [selectedBankAccountId, setSelectedBankAccountId] = useState("");
  const [selectedBlockchainWalletId, setSelectedBlockchainWalletId] =
    useState("");
  const [pendingConversionData, setPendingConversionData] =
    useState<ConversionData | null>(null);

  const handleBankAccountSelection = async (bankAccountId: string) => {
    if (!pendingConversionData || !primaryWallet?.address) return;

    try {
      await handleStableToFiatConversion(
        pendingConversionData,
        bankAccountId,
        primaryWallet.address
      );
      setShowBankSelection(false);
      setPendingConversionData(null);
      setSelectedBankAccountId("");
    } catch (error) {
      alert(
        `Conversion failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const handleBlockchainWalletSelection = async (
    blockchainWalletId: string
  ) => {
    if (!pendingConversionData || !receiverId) return;

    try {
      await handleFiatToStableConversion(
        pendingConversionData,
        blockchainWalletId,
        receiverId
      );
      setShowWalletSelection(false);
      setPendingConversionData(null);
      setSelectedBlockchainWalletId("");
    } catch (error) {
      alert(
        `Conversion failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const startStableToFiatConversion = async (data: ConversionData) => {
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
      if (availableBankAccounts.length === 0) {
        await checkPaymentMethods();
      }

      if (availableBankAccounts.length === 0) {
        throw new Error(
          "No bank accounts found. Please add a bank account first."
        );
      }

      if (availableBankAccounts.length === 1) {
        // Auto-select if only one account
        await handleStableToFiatConversion(
          data,
          availableBankAccounts[0].id,
          primaryWallet.address
        );
      } else {
        // Show selection modal
        setPendingConversionData(data);
        setShowBankSelection(true);
      }
    } catch (error) {
      alert(
        error instanceof Error ? error.message : "Failed to start conversion"
      );
    }
  };

  const startFiatToStableConversion = async (data: ConversionData) => {
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
      if (availableBlockchainWallets.length === 0) {
        await checkPaymentMethods();
      }

      if (availableBlockchainWallets.length === 0) {
        throw new Error(
          "No blockchain wallets found. Please add a blockchain wallet first."
        );
      }

      if (availableBlockchainWallets.length === 1) {
        // Auto-select if only one wallet
        await handleFiatToStableConversion(
          data,
          availableBlockchainWallets[0].id,
          receiverId
        );
      } else {
        // Show selection modal
        setPendingConversionData(data);
        setShowWalletSelection(true);
      }
    } catch (error) {
      alert(
        error instanceof Error ? error.message : "Failed to start conversion"
      );
    }
  };

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
              <SetupProgress
                isKYCComplete={isKYCComplete}
                hasPaymentMethods={hasPaymentMethods}
              />

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
                              onConvert={startStableToFiatConversion}
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
                              onConvert={startFiatToStableConversion}
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
                <div className="lg:col-span-2">
                  {conversionResult && (
                    <ConversionResultDisplay
                      conversionResult={conversionResult}
                      onClose={clearConversionResult}
                    />
                  )}
                  <TransactionHistory />
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Bank Account Selection Modal */}
      <SelectionModal
        isOpen={showBankSelection}
        onClose={() => {
          setShowBankSelection(false);
          setPendingConversionData(null);
          setSelectedBankAccountId("");
        }}
        title="Select Bank Account"
        description="Choose which bank account to use for this conversion:"
        type="bank"
        items={availableBankAccounts}
        selectedId={selectedBankAccountId}
        onSelect={setSelectedBankAccountId}
        onConfirm={() => {
          if (selectedBankAccountId && pendingConversionData) {
            handleBankAccountSelection(selectedBankAccountId);
          }
        }}
      />

      {/* Blockchain Wallet Selection Modal */}
      <SelectionModal
        isOpen={showWalletSelection}
        onClose={() => {
          setShowWalletSelection(false);
          setPendingConversionData(null);
          setSelectedBlockchainWalletId("");
        }}
        title="Select Blockchain Wallet"
        description="Choose which blockchain wallet to use for this conversion:"
        type="wallet"
        items={availableBlockchainWallets}
        selectedId={selectedBlockchainWalletId}
        onSelect={setSelectedBlockchainWalletId}
        onConfirm={() => {
          if (selectedBlockchainWalletId && pendingConversionData) {
            handleBlockchainWalletSelection(selectedBlockchainWalletId);
          }
        }}
      />
    </div>
  );
}
