import { NextRequest, NextResponse } from "next/server";

import { requireAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

interface AddressBody {
  label?: unknown;
  fullName?: unknown;
  phone?: unknown;
  addressLine1?: unknown;
  addressLine2?: unknown;
  city?: unknown;
  state?: unknown;
  pincode?: unknown;
  landmark?: unknown;
  isDefault?: unknown;
}

function normalizeAddressInput(body: AddressBody) {
  return {
    label:
      typeof body.label === "string"
        ? body.label.trim()
        : "",
    fullName:
      typeof body.fullName === "string"
        ? body.fullName.trim()
        : "",
    phone:
      typeof body.phone === "string"
        ? body.phone.replace(/\D/g, "").slice(0, 10)
        : "",
    addressLine1:
      typeof body.addressLine1 === "string"
        ? body.addressLine1.trim()
        : "",
    addressLine2:
      typeof body.addressLine2 === "string"
        ? body.addressLine2.trim()
        : "",
    city:
      typeof body.city === "string"
        ? body.city.trim()
        : "",
    state:
      typeof body.state === "string"
        ? body.state.trim()
        : "",
    pincode:
      typeof body.pincode === "string"
        ? body.pincode.replace(/\D/g, "").slice(0, 6)
        : "",
    landmark:
      typeof body.landmark === "string"
        ? body.landmark.trim()
        : "",
    isDefault: body.isDefault === true,
  };
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext,
) {
  const authResult = await requireAuthUser(request);

  if (!authResult.user) {
    return authResult.response;
  }

  try {
    const { id } = await context.params;
    const body = (await request.json()) as AddressBody;
    const nextAddress = normalizeAddressInput(body);

    const existingAddress = await prisma.address.findFirst({
      where: {
        id,
        userId: authResult.user.id,
      },
    });

    if (!existingAddress) {
      return NextResponse.json(
        {
          error: "Address not found.",
        },
        {
          status: 404,
        },
      );
    }

    const updatedAddress = await prisma.$transaction(
      async (transaction) => {
        if (nextAddress.isDefault) {
          await transaction.address.updateMany({
            where: {
              userId: authResult.user!.id,
            },
            data: {
              isDefault: false,
            },
          });
        }

        return transaction.address.update({
          where: {
            id,
          },
          data: nextAddress,
        });
      },
    );

    return NextResponse.json({
      address: updatedAddress,
    });
  } catch (error) {
    console.error("UPDATE_ADDRESS_API_ERROR", error);

    return NextResponse.json(
      {
        error: "Unable to update the address right now.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext,
) {
  const authResult = await requireAuthUser(request);

  if (!authResult.user) {
    return authResult.response;
  }

  try {
    const { id } = await context.params;

    const existingAddress = await prisma.address.findFirst({
      where: {
        id,
        userId: authResult.user.id,
      },
    });

    if (!existingAddress) {
      return NextResponse.json(
        {
          error: "Address not found.",
        },
        {
          status: 404,
        },
      );
    }

    await prisma.address.delete({
      where: {
        id,
      },
    });

    if (existingAddress.isDefault) {
      const nextAddress = await prisma.address.findFirst({
        where: {
          userId: authResult.user.id,
        },
        orderBy: {
          updatedAt: "desc",
        },
      });

      if (nextAddress) {
        await prisma.address.update({
          where: {
            id: nextAddress.id,
          },
          data: {
            isDefault: true,
          },
        });
      }
    }

    return NextResponse.json({
      message: "Address deleted successfully.",
    });
  } catch (error) {
    console.error("DELETE_ADDRESS_API_ERROR", error);

    return NextResponse.json(
      {
        error: "Unable to delete the address right now.",
      },
      {
        status: 500,
      },
    );
  }
}
