import { config } from "@/lib/config";
import { BlindPayPayoutsResponse } from "@/types";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    if (!config.blindpay.instanceId || !config.blindpay.apiKey) {
      return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = searchParams.get("limit") || "50";
    const offset = searchParams.get("offset") || "0";
    const startingAfter = searchParams.get("starting_after");
    const endingBefore = searchParams.get("ending_before");
    const receiverId = searchParams.get("receiver_id");
    const walletAddress = searchParams.get("wallet_address");

    const queryParams = new URLSearchParams();
    queryParams.append("limit", limit);
    queryParams.append("offset", offset);

    if (startingAfter) queryParams.append("starting_after", startingAfter);
    if (endingBefore) queryParams.append("ending_before", endingBefore);
    if (receiverId) queryParams.append("receiver_id", receiverId);

    const url = `${config.blindpay.apiUrl}/instances/${
      config.blindpay.instanceId
    }/payouts?${queryParams.toString()}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.blindpay.apiKey}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`BlindPay API error: ${response.status} - ${errorText}`);
    }

    const data: BlindPayPayoutsResponse = await response.json();

    let filteredPayouts = data.data;
    if (walletAddress) {
      filteredPayouts = data.data.filter(
        (payout) =>
          payout.sender_wallet_address?.toLowerCase() ===
          walletAddress.toLowerCase()
      );
    }

    const transactions = filteredPayouts.map((payout) => {
      let status: "processing" | "completed" | "failed" = "processing";

      if (payout.tracking_complete?.step === "completed") {
        status = "completed";
      } else if (
        payout.tracking_transaction?.status === "failed" ||
        payout.tracking_complete?.status === "tokens_refunded" ||
        payout.status === "failed"
      ) {
        status = "failed";
      }

      return {
        id: payout.id,
        payoutId: payout.id,
        quoteId: payout.quote_id,
        fromCurrency: payout.token,
        toCurrency: payout.currency,
        fromAmount: payout.sender_amount / 100,
        toAmount: payout.receiver_amount / 100,
        receiverLocalAmount: payout.receiver_local_amount
          ? payout.receiver_local_amount / 100
          : undefined,
        status,
        timestamp: new Date(payout.created_at).getTime(),
        txHash: payout.tracking_transaction?.transaction_hash,
        completedAt: payout.tracking_complete?.completed_at
          ? new Date(payout.tracking_complete.completed_at).getTime()
          : undefined,
        network: payout.network,
        description: payout.description,
        tracking: {
          transaction: payout.tracking_transaction,
          payment: payout.tracking_payment,
          liquidity: payout.tracking_liquidity,
          complete: payout.tracking_complete,
          partner_fee: payout.tracking_partner_fee,
        },
        fees: {
          partner_fee_amount: payout.partner_fee_amount
            ? payout.partner_fee_amount / 100
            : undefined,
          total_fee_amount: payout.total_fee_amount
            ? payout.total_fee_amount / 100
            : undefined,
        },
        recipient: {
          first_name: payout.first_name,
          last_name: payout.last_name,
          legal_name: payout.legal_name,
          account_number: payout.account_number,
          routing_number: payout.routing_number,
          country: payout.country,
          account_type: payout.account_type,
          type: payout.type,
        },
        rawPayout: payout,
      };
    });

    return NextResponse.json({
      success: true,
      transactions,
      pagination: data.pagination,
      total: filteredPayouts.length,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
