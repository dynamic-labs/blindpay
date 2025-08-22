import { NextRequest, NextResponse } from "next/server";
import { config } from "@/lib/config";
import { Network } from "@/types/blindpay";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const receiverId = searchParams.get("receiverId");

    if (!receiverId) {
      return NextResponse.json(
        { error: "Receiver ID is required" },
        { status: 400 }
      );
    }

    const token = config.blindpay.apiKey;

    const response = await fetch(
      `${config.blindpay.apiUrl}/instances/${config.blindpay.instanceId}/receivers/${receiverId}/blockchain-wallets`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: "Failed to fetch blockchain wallets", details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({
      success: true,
      blockchainWallets: data.blockchain_wallets || [],
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { receiverId, name, network, address, is_account_abstraction } = body;

    if (!receiverId) {
      return NextResponse.json(
        { error: "Receiver ID is required" },
        { status: 400 }
      );
    }

    if (!name || !network || !address) {
      return NextResponse.json(
        { error: "Name, network, and address are required" },
        { status: 400 }
      );
    }

    const token = config.blindpay.apiKey;

    const walletData = {
      name,
      network: network as Network,
      address,
      is_account_abstraction: is_account_abstraction || false,
    };

    const response = await fetch(
      `${config.blindpay.apiUrl}/instances/${config.blindpay.instanceId}/receivers/${receiverId}/blockchain-wallets`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(walletData),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: "Failed to create blockchain wallet", details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({
      success: true,
      blockchainWallet: data.blockchain_wallet || data,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
