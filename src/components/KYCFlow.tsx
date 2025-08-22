"use client";

import { useState, useEffect } from "react";
import { useDynamicContext } from "@/lib/dynamic";
import { useKYCStatus } from "@/lib/hooks/useKYCStatus";

interface KYCData {
  first_name: string;
  last_name: string;
  email: string;
  dateOfBirth: string;
  phoneNumber: string;
  address_line_1: string;
  address_line_2: string;
  city: string;
  state_province_region: string;
  postal_code: string;
  country: string;
  tax_id: string;
}

export default function KYCFlow() {
  const { primaryWallet, user } = useDynamicContext();
  const {
    receiverId,
    isKYCComplete,
    storeReceiverId,
    checkReceiverExists,
    clearBothIds,
  } = useKYCStatus();
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [kycData, setKycData] = useState<KYCData>({
    first_name: "Avneesh",
    last_name: "Agarwal",
    email: "avneesh@dynamic.xyz",
    dateOfBirth: "1990-01-01",
    phoneNumber: "+1234567890",
    address_line_1: "123 Main St",
    address_line_2: "Apt 1",
    city: "San Francisco",
    state_province_region: "CA",
    postal_code: "94101",
    country: "US",
    tax_id: "123456789",
  });

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
                setCurrentStep(3);
              }
            }
          } catch (error) {}
        }
      }
    };

    checkExistingReceiver();
  }, [user?.email, receiverId, checkReceiverExists, storeReceiverId]);

  const handleInputChange = (field: keyof KYCData, value: string) => {
    setKycData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!primaryWallet || !user) return;

    setIsLoading(true);
    try {
      const tosResponse = await fetch("/api/receivers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_tos",
          walletAddress: primaryWallet.address,
        }),
      });

      if (!tosResponse.ok) {
        throw new Error("Failed to create Terms of Service");
      }

      const tosResult = await tosResponse.json();
      const sessionToken = tosResult.sessionToken;

      const receiverResponse = await fetch("/api/receivers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_receiver",
          email: kycData.email,
          first_name: kycData.first_name,
          last_name: kycData.last_name,
          tos_id: sessionToken,
          walletAddress: primaryWallet.address,
          tax_id: kycData.tax_id,
          address_line_1: kycData.address_line_1,
          address_line_2: kycData.address_line_2,
          city: kycData.city,
          state_province_region: kycData.state_province_region,
          postal_code: kycData.postal_code,
          country: kycData.country,
          phoneNumber: kycData.phoneNumber,
          dateOfBirth: kycData.dateOfBirth,
        }),
      });

      if (!receiverResponse.ok) {
        throw new Error("Failed to create receiver");
      }

      const receiverResult = await receiverResponse.json();
      const newReceiverId = receiverResult.receiver.id;

      await storeReceiverId(newReceiverId);
      setCurrentStep(3);
    } catch (error) {
      alert(
        `KYC setup failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearKYC = async () => {
    if (
      confirm(
        "Are you sure you want to clear your KYC data? This will remove your receiver ID."
      )
    ) {
      setIsLoading(true);
      try {
        await clearBothIds();
        setCurrentStep(1);
      } catch (error) {
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

  if (currentStep === 3) {
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
          {receiverId && (
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
          )}
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

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">
        KYC Verification
      </h3>
      <p className="text-gray-600 mb-6">
        Complete your KYC verification to use BlindPay services. This
        information is required for regulatory compliance.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              First Name *
            </label>
            <input
              type="text"
              required
              value={kycData.first_name}
              onChange={(e) => handleInputChange("first_name", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Last Name *
            </label>
            <input
              type="text"
              required
              value={kycData.last_name}
              onChange={(e) => handleInputChange("last_name", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              required
              value={kycData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date of Birth *
            </label>
            <input
              type="date"
              required
              value={kycData.dateOfBirth}
              onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number *
            </label>
            <input
              type="tel"
              required
              value={kycData.phoneNumber}
              onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="+1234567890"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tax ID / SSN *
            </label>
            <input
              type="text"
              required
              value={kycData.tax_id}
              onChange={(e) => handleInputChange("tax_id", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="123-45-6789"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Address Line 1 *
          </label>
          <input
            type="text"
            required
            value={kycData.address_line_1}
            onChange={(e) =>
              handleInputChange("address_line_1", e.target.value)
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Address Line 2
          </label>
          <input
            type="text"
            value={kycData.address_line_2}
            onChange={(e) =>
              handleInputChange("address_line_2", e.target.value)
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              City *
            </label>
            <input
              type="text"
              required
              value={kycData.city}
              onChange={(e) => handleInputChange("city", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              State *
            </label>
            <input
              type="text"
              required
              value={kycData.state_province_region}
              onChange={(e) =>
                handleInputChange("state_province_region", e.target.value)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Postal Code *
            </label>
            <input
              type="text"
              required
              value={kycData.postal_code}
              onChange={(e) => handleInputChange("postal_code", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Processing..." : "Submit KYC Verification"}
        </button>
      </form>
    </div>
  );
}
