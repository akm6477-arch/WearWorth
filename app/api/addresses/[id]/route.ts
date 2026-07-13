import { NextRequest, NextResponse } from "next/server";

import { requireAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

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

function validateAddressInput(address: ReturnType<typeof normalizeAddressInput>) {
  if (address.label.length < 2) {
    return "Please enter an address label.";
  }

  if (address.fullName.length < 2) {
    return "Please enter the recipient name.";
  }

  if (!/^[6-9]\d{9}$/.test(address.phone)) {
    return "Please enter a valid 10-digit phone number.";
  }

  if (address.addressLine1.length < 5) {
    return "Please enter the full street address.";
  }

  if (address.city.length < 2 || address.state.length < 2) {
    return "Please enter city and state.";
  }

  if (!/^\d{6}$/.test(address.pincode)) {
    return "Please enter a valid 6-digit pincode.";
  }

  return null;
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext,
) {
  const rateLimited = rateLimit(request, {
    key: "address-update",
    limit: 30,
    windowMs: 60 * 1000,
  });

  if (rateLimited) {
    return rateLimited;
  }

  const authResult = await requireAuthUser(request);

  if (!authResult.user) {
    return authResult.response;
  }

  try {
    const { id } = await context.params;
    const body = (await request.json()) as AddressBody;
    const nextAddress = normalizeAddressInput(body);
    const validationError = validateAddressInput(nextAddress);

    if (validationError) {
      return NextResponse.json(
        {
          error: validationError,
        },
        {
          status: 400,
        },
      );
    }

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
        const shouldBeDefault =
          nextAddress.isDefault || existingAddress.isDefault;

        if (shouldBeDefault) {
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
          data: {
            ...nextAddress,
            isDefault: shouldBeDefault,
          },
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
  const rateLimited = rateLimit(request, {
    key: "address-delete",
    limit: 30,
    windowMs: 60 * 1000,
  });

  if (rateLimited) {
    return rateLimited;
  }

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
