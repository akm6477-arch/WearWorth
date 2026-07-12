import { NextRequest, NextResponse } from "next/server";

import { requireAdminUser } from "@/lib/auth";
import {
  isCloudinaryConfigured,
  uploadImageToCloudinary,
} from "@/lib/cloudinary";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_FILE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export async function POST(request: NextRequest) {
  const authResult = await requireAdminUser(request);

  if (!authResult.user) {
    return authResult.response;
  }

  if (!isCloudinaryConfigured()) {
    return NextResponse.json(
      {
        error:
          "Cloudinary is not configured yet. Add the Cloudinary environment variables first.",
      },
      {
        status: 503,
      },
    );
  }

  try {
    const formData = await request.formData();
    const files = formData
      .getAll("files")
      .filter((entry): entry is File => entry instanceof File);

    if (files.length === 0) {
      return NextResponse.json(
        {
          error: "Choose at least one image to upload.",
        },
        {
          status: 400,
        },
      );
    }

    for (const file of files) {
      if (!ALLOWED_FILE_TYPES.has(file.type)) {
        return NextResponse.json(
          {
            error:
              "Only JPG, PNG, and WebP images are allowed.",
          },
          {
            status: 400,
          },
        );
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        return NextResponse.json(
          {
            error:
              "Each image must be 5 MB or smaller.",
          },
          {
            status: 400,
          },
        );
      }
    }

    const uploads = await Promise.all(
      files.map((file) => uploadImageToCloudinary(file)),
    );

    return NextResponse.json({
      uploads: uploads.map((upload) => ({
        url: upload.secure_url,
        publicId: upload.public_id,
      })),
    });
  } catch (error) {
    console.error("ADMIN_UPLOAD_IMAGE_API_ERROR", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to upload images right now.",
      },
      {
        status: 500,
      },
    );
  }
}
