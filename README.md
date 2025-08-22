# BlindPay - Stablecoin to Fiat Converter

A Next.js application that enables seamless conversion between stablecoins and fiat currencies using BlindPay's API and Dynamic wallet integration.

## 🚀 Features

- **Dynamic Wallet Integration**: Connect wallets using Dynamic Labs
- **BlindPay API Integration**: Real-time conversion rates and execution
- **KYC Verification Flow**: Complete KYC verification to use BlindPay services
- **User Metadata Storage**: Receiver IDs stored in Dynamic user metadata
- **Multi-Currency Support**: Support for various stablecoins and fiat currencies
- **Real-time Quotes**: Get live conversion rates before executing trades

## 🛠 Setup

1. **Install dependencies**:

   ```bash
   bun install
   ```

2. **Set up environment variables**:
   Create a `.env.local` file with the following variables:

   ```env
   # BlindPay API Configuration (Required)
   BLINDPAY_API_URL=https://api.blindpay.com/v1
   BLINDPAY_INSTANCE_ID=your_instance_id_here
   BLINDPAY_API_KEY=your_api_key_here

   # Dynamic Wallet Configuration (Required)
   NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID=your_dynamic_environment_id_here

   # Contract Addresses (Optional - defaults provided)
   NEXT_PUBLIC_USDB_CONTRACT_ADDRESS=0x4D423D2cfB373862B8E12843B6175752dc75f795

   # BlindPay Defaults (Optional - will use sensible defaults)
   BLINDPAY_DEFAULT_NETWORK=base_sepolia
   BLINDPAY_CURRENCY_TYPE=sender
   BLINDPAY_COVER_FEES=true
   BLINDPAY_PAYMENT_METHOD=ach
   BLINDPAY_STABLECOIN_TOKEN=USDC
   BLINDPAY_FIAT_CURRENCY=USD
   ```

   **To get your BlindPay credentials:**

   1. Create an account on [BlindPay](https://blindpay.com)
   2. Create a development instance
   3. Create your API key
   4. Note your instance ID and bank account ID

3. **Run the development server**:

   ```bash
   bun run dev
   ```

4. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔐 KYC Integration

### How It Works

1. **Wallet Connection**: Users connect their wallet using Dynamic Labs
2. **KYC Verification**: Users complete a KYC form with personal information
3. **Receiver Creation**: BlindPay creates a receiver with the provided KYC data
4. **Metadata Storage**: The receiver ID and banking ID are stored in Dynamic user metadata using the `useUserUpdateRequest` hook
5. **Service Access**: Users can now access BlindPay services using their stored receiver ID
6. **Data Persistence**: All KYC data persists across sessions and devices via Dynamic's user metadata system

### KYC Flow

The KYC flow includes:

- Personal information (name, email, date of birth)
- Contact details (phone number)
- Address information (street, city, state_province_region, postal code)
- Document verification (proof of address, ID documents)

### Security Features

- KYC data is sent directly to BlindPay's secure API
- Receiver IDs are stored in Dynamic's encrypted user metadata
- No sensitive KYC data is stored locally
- Environment variables for development defaults

## 💱 How It Works

### Fiat to Stablecoin (Payin)

1. **Connect Wallet**: Connect your wallet using Dynamic Labs
2. **Complete KYC**: Complete KYC verification if not already done
3. **Enter Amount**: Specify the USD amount to convert
4. **Create Quote**: Get a quote for the conversion rate
5. **Get Banking Details**: Receive BlindPay banking details and memo code
6. **ACH Transfer**: Send ACH transfer to provided banking details with memo code
7. **Receive Tokens**: USDC is automatically sent to your wallet after payment confirmation

### Stablecoin to Fiat (Payout)

1. **Connect Wallet**: Connect your wallet using Dynamic Labs
2. **Complete KYC**: Complete KYC verification if not already done
3. **Enter Amount**: Specify the stablecoin amount to convert
4. **Create Quote**: Get a quote for the conversion
5. **Approve Tokens**: Approve BlindPay contract to spend your tokens
6. **Execute Payout**: BlindPay processes the payout to your bank account

## 🏗 Architecture

### Frontend Components

- **KYCFlow**: Handles KYC verification and receiver creation
- **ConversionCard**: UI for currency conversion inputs
- **WalletInfo**: Displays wallet balances and connection status
- **TransactionHistory**: Shows conversion history

### Backend API Routes

- **`/api/receivers`**: Manages BlindPay receiver creation and TOS acceptance
- **`/api/payin`**: Handles fiat-to-stablecoin conversions
- **`/api/convert`**: Manages stablecoin-to-fiat conversions
- **`/api/banking-details`**: Provides banking information for payins

### Key Integrations

- **Dynamic Labs**: Wallet connection and user metadata management
- **BlindPay API**: Conversion quotes, execution, and banking details
- **Wagmi/Viem**: Blockchain interactions and token approvals

## 🔧 Development

### Adding New Currencies

1. Update `config.currencies` in `src/lib/config.ts`
2. Add token mapping in `config.tokenMapping`
3. Update conversion logic in API routes

### Customizing KYC Flow

1. Modify the `KYCFlow` component in `src/components/KYCFlow.tsx`
2. Update the receivers API route for additional KYC fields
3. Add validation and error handling as needed

### Environment Variables

All configuration is done through environment variables to ensure:

- No hardcoded values in production
- Easy configuration management
- Secure credential handling

## 🚨 Important Notes

- **KYC Required**: Users must complete KYC verification before using BlindPay services
- **Receiver ID Storage**: Receiver IDs are automatically stored in Dynamic user metadata
- **No Local Storage**: Sensitive KYC data is not stored locally
- **Development Mode**: Uses placeholder KYC data for development (configure via env vars)

## 📚 Resources

- [BlindPay API Documentation](https://docs.blindpay.com)
- [Dynamic Labs Documentation](https://docs.dynamic.xyz)
- [Wagmi Documentation](https://wagmi.sh)
- [Viem Documentation](https://viem.sh)
