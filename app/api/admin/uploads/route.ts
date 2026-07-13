import { NextRequest, NextResponse } from "next/server";

import { requireAdminUser } from "@/lib/auth";
import { isValidCloudinaryPublicId } from "@/lib/admin-product-validation";
import {
  deleteCloudinaryImages,
  isCloudinaryConfigured,
  uploadImageToCloudinary,
} from "@/lib/cloudinary";
import { rateLimit } from "@/lib/rate-limit";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_UPLOAD_FILES = 8;
const ALLOWED_FILE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);
const ALLOWED_FILE_EXTENSIONS = new Set([
  "jpg",
  "jpeg",
  "png",
  "webp",
]);

function getFileExtension(fileName: string) {
  return fileName.split(".").pop()?.toLowerCase() || "";
}

function validateUploadFile(file: File) {
  if (!ALLOWED_FILE_TYPES.has(file.type)) {
    return "Only JPG, PNG, and WebP images are allowed.";
  }

  if (!ALLOWED_FILE_EXTENSIONS.has(getFileExtension(file.name))) {
    return "Each image must use a JPG, PNG, or WebP file extension.";
  }

  if (file.size <= 0) {
    return "Uploaded images cannot be empty.";
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return "Each image must be 5 MB or smaller.";
  }

  return null;
}

async function readPublicIdsFromRequest(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as
    | {
        publicId?: unknown;
        publicIds?: unknown;
      }
    | null;

  if (!body) {
    return [];
  }

  if (typeof body.publicId === "string") {
    return [body.publicId.trim()].filter(Boolean);
  }

  if (Array.isArray(body.publicIds)) {
    return body.publicIds
      .map((publicId) =>
        typeof publicId === "string" ? publicId.trim() : "",
      )
      .filter(Boolean);
  }

  return [];
}

export async function POST(request: NextRequest) {
  const rateLimited = rateLimit(request, {
    key: "admin-upload-images",
    limit: 20,
    windowMs: 60 * 1000,
  });

  if (rateLimited) {
    return rateLimited;
  }

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

    if (files.length > MAX_UPLOAD_FILES) {
      return NextResponse.json(
        {
          error: `Upload no more than ${MAX_UPLOAD_FILES} images at once.`,
        },
        {
          status: 400,
        },
      );
    }

    for (const file of files) {
      const validationError = validateUploadFile(file);

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
    }

    const uploadResults = await Promise.allSettled(
      files.map((file) => uploadImageToCloudinary(file)),
    );
    const uploads = uploadResults
      .filter(
        (
          result,
        ): result is PromiseFulfilledResult<
          Awaited<ReturnType<typeof uploadImageToCloudinary>>
        > => result.status === "fulfilled",
      )
      .map((result) => result.value);
    const failedUploads = uploadResults.filter(
      (result) => result.status === "rejected",
    );

    if (failedUploads.length > 0) {
      await deleteCloudinaryImages(
        uploads.map((upload) => upload.public_id),
      );

      return NextResponse.json(
        {
          error:
            "Unable to upload every image. No images were attached to the product.",
        },
        {
          status: 502,
        },
      );
    }

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
        error: "Unable to upload images right now.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function DELETE(request: NextRequest) {
  const rateLimited = rateLimit(request, {
    key: "admin-delete-images",
    limit: 30,
    windowMs: 60 * 1000,
  });

  if (rateLimited) {
    return rateLimited;
  }

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
    const publicIds = Array.from(
      new Set(await readPublicIdsFromRequest(request)),
    );

    if (publicIds.length === 0) {
      return NextResponse.json(
        {
          error: "Choose at least one uploaded image to delete.",
        },
        {
          status: 400,
        },
      );
    }

    if (publicIds.length > MAX_UPLOAD_FILES) {
      return NextResponse.json(
        {
          error: `Delete no more than ${MAX_UPLOAD_FILES} images at once.`,
        },
        {
          status: 400,
        },
      );
    }

    if (
      publicIds.some(
        (publicId) => !isValidCloudinaryPublicId(publicId),
      )
    ) {
      return NextResponse.json(
        {
          error: "Invalid Cloudinary public ID.",
        },
        {
          status: 400,
        },
      );
    }

    const deleteResults = await deleteCloudinaryImages(publicIds);

    return NextResponse.json({
      deleted: deleteResults.filter(
        (result) => result.status === "fulfilled",
      ).length,
      requested: publicIds.length,
    });
  } catch (error) {
    console.error("ADMIN_DELETE_UPLOAD_IMAGE_API_ERROR", error);

    return NextResponse.json(
      {
        error: "Unable to delete uploaded images right now.",
      },
      {
        status: 500,
      },
    );
  }
}
