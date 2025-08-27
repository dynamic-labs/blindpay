"use client";

import { useState, useEffect, useCallback } from "react";
import { useDynamicContext } from "@/lib/dynamic";
import { useKYCStatus } from "@/lib/hooks/useKYCStatus";

export default function BlindPayReceiverInvite() {
  const { primaryWallet, user } = useDynamicContext();
  const {
    receiverId,
    isKYCComplete,
    storeReceiverId,
    checkReceiverExists,
    clearBothIds,
  } = useKYCStatus();
  const [isLoading, setIsLoading] = useState(false);
  const [showIframe, setShowIframe] = useState(false);

  useEffect(() => {
    const checkExistingReceiver = async () => {
      if (user?.email && !receiverId) {
        const exists = await checkReceiverExists();
        if (exists) {
          try {
            const response = await fetch(
              `/api/receivers?email=${encodeURIComponent(user.email)}&limit=1`
            );
            if (response.ok) {
              const data = await response.json();
              if (data.receivers && data.receivers.length > 0) {
                const existingReceiverId = data.receivers[0].id;
                await storeReceiverId(existingReceiverId);
              }
            }
          } catch {
            // no-op
          }
        }
      }
    };

    checkExistingReceiver();
  }, [user?.email, receiverId, checkReceiverExists, storeReceiverId]);

  const handleStartKYC = () => {
    setShowIframe(true);
  };

  const handleIframeMessage = useCallback(
    async (event: MessageEvent) => {
      // Listen for messages from the BlindPay iframe
      if (event.origin === "https://app.blindpay.com") {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "receiver_created" && data.receiverId) {
            // Store the receiver ID when the iframe completes
            await storeReceiverId(data.receiverId);
            setShowIframe(false);
          } else if (data.type === "kyc_completed") {
            // Handle KYC completion
            setShowIframe(false);
          }
        } catch {
          // ignore parse failures
        }
      }
    },
    [storeReceiverId]
  );

  useEffect(() => {
    window.addEventListener("message", handleIframeMessage);
    return () => window.removeEventListener("message", handleIframeMessage);
  }, [handleIframeMessage]);

  const handleClearKYC = async () => {
    if (
      confirm(
        "Are you sure you want to clear your KYC data? This will remove your receiver ID."
      )
    ) {
      setIsLoading(true);
      try {
        await clearBothIds();
      } catch {
        alert("Failed to clear KYC data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  if (isKYCComplete && receiverId) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <svg
              className="h-6 w-6 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            KYC Verification Complete!
          </h3>
          <p className="text-gray-600 mb-4">
            Your account has been verified and you can now use BlindPay
            services.
          </p>
          <div className="bg-gray-100 p-3 rounded text-sm space-y-2">
            <p>
              <strong>Receiver ID:</strong> {receiverId}
            </p>
            <p className="text-gray-600 mt-1">
              Your KYC verification is complete and stored in Dynamic user
              metadata.
            </p>
            <p className="text-blue-600 font-medium">
              Next step: Add a bank account and blockchain wallet to start
              converting funds.
            </p>
          </div>
          <div className="mt-4">
            <button
              onClick={handleClearKYC}
              disabled={isLoading}
              className="bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Clearing..." : "Clear KYC Data"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!primaryWallet) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          KYC Verification
        </h3>
        <p className="text-gray-600">
          Please connect your wallet to proceed with KYC verification.
        </p>
      </div>
    );
  }

  if (showIframe) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-800">
            Complete KYC Verification
          </h3>
          <button
            onClick={() => setShowIframe(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <p className="text-gray-600 mb-4">
          Please complete your KYC verification using the form below. This
          information is required for regulatory compliance.
        </p>

        <div className="w-full h-[600px] border border-gray-300 rounded-lg overflow-hidden">
          <div className="flex items-center justify-center h-full p-6 text-center">
            <div>
              <p className="mb-4 text-gray-700">
                Due to security policy (CSP) restrictions, the KYC flow must
                open in a new tab.
              </p>
              <a
                href="https://app.blindpay.com/e/receivers/invite?instanceId=in_sZgM6Bl4Ma9Q&type=individual&kyc_type=standard&token=506b40b087f091cb63a015056d240688211e00cbd117d694cbae0e59caf8f4a5"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
              >
                Open KYC in new tab
              </a>
            </div>
          </div>
        </div>

        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500">
            After completing the form, you&apos;ll be redirected back to
            continue with your setup.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
          <svg
            className="h-6 w-6 text-blue-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          KYC Verification Required
        </h3>
        <p className="text-gray-600 mb-6">
          To use BlindPay services, you need to complete a Know Your Customer
          (KYC) verification. This is a secure, regulatory-compliant process
          that helps protect your account.
        </p>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-blue-800 mb-2">
            What you&apos;ll need:
          </h4>
          <ul className="text-sm text-blue-700 space-y-1 text-left">
            <li>• Government-issued photo ID</li>
            <li>• Proof of address</li>
            <li>• Social Security Number or Tax ID</li>
            <li>• Basic personal information</li>
          </ul>
        </div>

        <button
          onClick={handleStartKYC}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg transition-colors duration-200"
        >
          Start KYC Verification
        </button>

        <p className="text-xs text-gray-500 mt-3">
          Your information is encrypted and securely transmitted to BlindPay for
          verification.
        </p>
      </div>
    </div>
  );
}
