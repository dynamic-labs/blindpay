// Configuration constants for BlindPay application
import { SUPPORTED_CURRENCIES } from "@/types";

export const config = {
  // BlindPay API Configuration
  blindpay: {
    apiUrl: "https://api.blindpay.com/v1",
    instanceId: process.env.BLINDPAY_INSTANCE_ID!,
    apiKey: process.env.BLINDPAY_API_KEY!,
    // bankAccountId and receiverID are now stored in Dynamic user metadata per user
  },
  // Dynamic Wallet Configuration
  dynamic: {
    environmentId: process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID!,
  },

  // Contract Addresses
  contracts: {
    usdb: "0x4D423D2cfB373862B8E12843B6175752dc75f795" as `0x${string}`,
  },

  // BlindPay Configuration (hardcoded values)
  blindpayDefaults: {
    baseUrl: "https://api.blindpay.com/v1",
    instanceId: process.env.BLINDPAY_INSTANCE_ID!,
    network: "base_sepolia",
    currencyType: "sender",
    coverFees: false,
    paymentMethod: "ach",
    stablecoinToken: "USDB",
    fiatCurrency: "USD",
  },

  // Supported currencies according to BlindPay API specification
  currencies: {
    stablecoins: ["USDC", "USDT", "USDB"],
    fiat: ["USD", "BRL", "MXN", "COP", "ARS"],
    // All supported currencies for FX quotes
    all: SUPPORTED_CURRENCIES,
  },
} as const;
