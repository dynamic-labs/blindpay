import { config } from "@/lib/config";
import { BankingDetailsType, Network, Currency } from "@/types";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      type,
      amount,
      walletAddress,
      quoteId,
      receiverId,
      blockchainWalletId,
      currencyType,
      coverFees,
      paymentMethod,
      token,
    } = body;

    if (!type || !amount || !walletAddress) {
      return NextResponse.json({ error: "Bad Request" }, { status: 400 });
    }

    if (!config.blindpay.instanceId || !config.blindpay.apiKey) {
      return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 }
      );
    }

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.blindpay.apiKey}`,
    };

    if (type === BankingDetailsType.QUOTE) {
      if (!blockchainWalletId && !receiverId) {
        return NextResponse.json(
          { error: "Blockchain wallet ID or receiver ID is required" },
          { status: 400 }
        );
      }

      const payinQuoteBody = {
        blockchain_wallet_id: blockchainWalletId || receiverId,
        currency_type: currencyType,
        cover_fees: coverFees,
        request_amount: Math.round(amount * 100),
        payment_method: paymentMethod,
        token: token as Currency,
      };

      const response = await fetch(
        `${config.blindpay.apiUrl}/instances/${config.blindpay.instanceId}/payin-quotes`,
        {
          headers,
          method: "POST",
          body: JSON.stringify(payinQuoteBody),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();

        return NextResponse.json(
          {
            error: "Failed to create payin quote",
            details: errorText,
            status: response.status,
          },
          { status: response.status }
        );
      }

      const quoteData = await response.json();

      return NextResponse.json({
        success: true,
        type: "payin_quote",
        quote: quoteData,
      });
    }

    if (type === BankingDetailsType.INITIATE && quoteId) {
      const payinBody = {
        payin_quote_id: quoteId,
      };

      const response = await fetch(
        `${config.blindpay.apiUrl}/instances/${config.blindpay.instanceId}/payins/evm`,
        {
          headers,
          method: "POST",
          body: JSON.stringify(payinBody),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();

        return NextResponse.json(
          {
            error: "Failed to initiate payin",
            details: errorText,
            status: response.status,
          },
          { status: response.status }
        );
      }

      const payinData = await response.json();

      return NextResponse.json({
        success: true,
        type: "payin_initiated",
        payin: payinData,
        bankingDetails: payinData.blindpay_bank_details,
        memoCode: payinData.memo_code,
      });
    }

    return NextResponse.json({ error: "Bad Request" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    if (!config.blindpay.instanceId || !config.blindpay.apiKey) {
      return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const bankAccountId = searchParams.get("bankAccountId");

    if (!bankAccountId) {
      return NextResponse.json(
        {
          error: "Bank account ID is required",
          details:
            "Please provide a valid bank account ID to fetch banking details",
          code: "MISSING_BANK_ACCOUNT_ID",
        },
        { status: 400 }
      );
    }

    try {
      const response = await fetch(
        `${config.blindpay.apiUrl}/instances/${config.blindpay.instanceId}/bank_accounts/${bankAccountId}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${config.blindpay.apiKey}`,
          },
        }
      );

      if (!response.ok) {
        return NextResponse.json(
          { error: "Failed to fetch banking details" },
          { status: 500 }
        );
      }

      const bankAccountData = await response.json();

      if (!bankAccountData.routing_number || !bankAccountData.account_number) {
        return NextResponse.json(
          {
            error: "Incomplete Bank Account Information",
            details:
              "The bank account exists but is missing essential routing or account number information",
            code: "INCOMPLETE_BANK_ACCOUNT",
            status: 422,
          },
          { status: 422 }
        );
      }

      const bankingDetails = {
        bankName: bankAccountData.bank_name,
        routingNumber: bankAccountData.routing_number,
        accountNumber: bankAccountData.account_number,
        accountType: bankAccountData.account_type,
        beneficiaryName: bankAccountData.beneficiary_name,
        beneficiaryAddress: bankAccountData.beneficiary_address,
      };

      return NextResponse.json({
        success: true,
        bankingDetails,
        rawData: bankAccountData,
      });
    } catch (error) {
      return NextResponse.json(
        {
          error: "Failed to fetch banking details",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 }
      );
    }
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
