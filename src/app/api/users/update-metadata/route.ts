import { NextRequest, NextResponse } from "next/server";
import { config } from "@/lib/config";

interface DynamicUser {
  id: string;
  email?: string;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

interface DynamicUsersResponse {
  count: number;
  users: DynamicUser[];
}

interface UpdateUserRequest {
  email: string;
  receiverId: string;
  bankingId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: UpdateUserRequest = await request.json();
    const { email, receiverId, bankingId } = body;

    if (!email || !receiverId) {
      return NextResponse.json(
        { error: "Email and receiverId are required" },
        { status: 400 }
      );
    }

    // Get Dynamic API configuration
    const dynamicApiToken = config.dynamic.apiToken;
    if (!dynamicApiToken) {
      return NextResponse.json(
        { error: "Dynamic API token not configured" },
        { status: 500 }
      );
    }

    const environmentId = config.dynamic.environmentId;
    if (!environmentId) {
      return NextResponse.json(
        { error: "Dynamic environment ID not configured" },
        { status: 500 }
      );
    }

    // Step 1: Filter users by email to get the user's UUID
    const filterParams = new URLSearchParams({
      'filter[filterColumn]': 'email',
      'filter[filterValue]': email,
      limit: '1'
    });

    const usersResponse = await fetch(
      `https://app.dynamic.xyz/api/v0/environments/${environmentId}/users?${filterParams}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${dynamicApiToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!usersResponse.ok) {
      const errorText = await usersResponse.text();
      console.error('Failed to fetch users:', errorText);
      return NextResponse.json(
        { error: "Failed to fetch user from Dynamic" },
        { status: usersResponse.status }
      );
    }

    const usersData: DynamicUsersResponse = await usersResponse.json();
    
    if (usersData.count === 0 || !usersData.users.length) {
      return NextResponse.json(
        { error: "User not found with the provided email" },
        { status: 404 }
      );
    }

    const user = usersData.users[0];
    const userId = user.id;

    // Step 2: Update the user's metadata with receiver ID
    const currentMetadata = (user.metadata as Record<string, unknown>) || {};
    const updatedMetadata = {
      ...currentMetadata,
      blindpayReceiverId: receiverId,
      ...(bankingId && { blindpayBankingId: bankingId }),
    };

    const updateResponse = await fetch(
      `https://app.dynamic.xyz/api/v0/environments/${environmentId}/users/${userId}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${dynamicApiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metadata: updatedMetadata,
        }),
      }
    );

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      console.error('Failed to update user metadata:', errorText);
      return NextResponse.json(
        { error: "Failed to update user metadata" },
        { status: updateResponse.status }
      );
    }

    const updatedUser = await updateResponse.json();

    return NextResponse.json({
      success: true,
      message: "User metadata updated successfully",
      userId: userId,
      email: email,
      receiverId: receiverId,
      bankingId: bankingId,
      updatedMetadata: updatedMetadata,
    });

  } catch (error) {
    console.error('Error updating user metadata:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
