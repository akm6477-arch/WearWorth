import { NextRequest, NextResponse } from "next/server";

import { requireAuthUser } from "@/lib/auth";
import {
  isDatabaseUnavailableError,
  prisma,
} from "@/lib/prisma";

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

export async function GET(request: NextRequest) {
  const authResult = await requireAuthUser(request);

  if (!authResult.user) {
    return authResult.response;
  }

  try {
    const addresses = await prisma.address.findMany({
      where: {
        userId: authResult.user.id,
      },
      orderBy: [
        { isDefault: "desc" },
        { updatedAt: "desc" },
      ],
    });

    return NextResponse.json({
      addresses,
    });
  } catch (error) {
    console.error("GET_ADDRESSES_API_ERROR", error);

    return NextResponse.json(
      {
        error: isDatabaseUnavailableError(error)
          ? "The database is temporarily unavailable. Please try again shortly."
          : "Unable to load addresses right now.",
      },
      {
        status: isDatabaseUnavailableError(error) ? 503 : 500,
      },
    );
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireAuthUser(request);

  if (!authResult.user) {
    return authResult.response;
  }

  try {
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

    const existingCount = await prisma.address.count({
      where: {
        userId: authResult.user.id,
      },
    });

    const shouldBeDefault =
      nextAddress.isDefault || existingCount === 0;

    const createdAddress = await prisma.$transaction(
      async (transaction) => {
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

        return transaction.address.create({
          data: {
            userId: authResult.user!.id,
            ...nextAddress,
            isDefault: shouldBeDefault,
          },
        });
      },
    );

    return NextResponse.json(
      {
        address: createdAddress,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error("CREATE_ADDRESS_API_ERROR", error);

    return NextResponse.json(
      {
        error: "Unable to save the address right now.",
      },
      {
        status: 500,
      },
    );
  }
}
