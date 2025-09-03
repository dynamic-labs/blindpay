interface SetupProgressProps {
  isKYCComplete: boolean;
  hasPaymentMethods: boolean;
}

export default function SetupProgress({ isKYCComplete, hasPaymentMethods }: SetupProgressProps) {
  return (
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
            <span className="ml-2 text-sm font-medium">KYC Verification</span>
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
            <span className="ml-2 text-sm font-medium">Payment Methods (1+)</span>
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
            <span className="ml-2 text-sm font-medium">Ready to Convert</span>
          </div>
        </div>
      </div>
    </div>
  );
}

