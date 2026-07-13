import crypto from "node:crypto";

import { isValidCloudinaryPublicId } from "@/lib/admin-product-validation";

interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
}

interface CloudinaryDeleteResult {
  result: "ok" | "not found" | string;
}

function getCloudinaryConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      "Cloudinary credentials are missing. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.",
    );
  }

  return {
    cloudName,
    apiKey,
    apiSecret,
  };
}

function signParameters(
  parameters: Record<string, string | number | undefined>,
  apiSecret: string,
) {
  const signatureBase = Object.entries(parameters)
    .filter(
      ([, value]) => value !== undefined && value !== "",
    )
    .sort(([firstKey], [secondKey]) =>
      firstKey.localeCompare(secondKey),
    )
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  return crypto
    .createHash("sha1")
    .update(`${signatureBase}${apiSecret}`)
    .digest("hex");
}

export function isCloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME?.trim() &&
      process.env.CLOUDINARY_API_KEY?.trim() &&
      process.env.CLOUDINARY_API_SECRET?.trim(),
  );
}

function normalizeCloudinaryFolder(folder: string) {
  const normalizedFolder = folder.trim().replace(/^\/+|\/+$/g, "");

  if (
    !normalizedFolder ||
    normalizedFolder.length > 120 ||
    !/^[A-Za-z0-9_/-]+$/.test(normalizedFolder)
  ) {
    throw new Error("Invalid Cloudinary folder.");
  }

  return normalizedFolder;
}

export async function uploadImageToCloudinary(
  file: File,
  folder = "wearworth/products",
): Promise<CloudinaryUploadResult> {
  const { cloudName, apiKey, apiSecret } =
    getCloudinaryConfig();
  const normalizedFolder = normalizeCloudinaryFolder(folder);

  const timestamp = Math.floor(Date.now() / 1000);

  const uploadParams = {
    folder: normalizedFolder,
    overwrite: "false",
    timestamp,
    unique_filename: "true",
    use_filename: "true",
  };

  const signature = signParameters(
    uploadParams,
    apiSecret,
  );

  const formData = new FormData();

  formData.set("file", file);
  formData.set("api_key", apiKey);
  formData.set("timestamp", String(timestamp));
  formData.set("folder", normalizedFolder);
  formData.set("use_filename", "true");
  formData.set("unique_filename", "true");
  formData.set("overwrite", "false");
  formData.set("signature", signature);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: "POST",
      body: formData,
      cache: "no-store",
    },
  );

  const data = (await response.json()) as
    | CloudinaryUploadResult
    | {
        error?: {
          message?: string;
        };
      };

  if (
    !response.ok ||
    !("secure_url" in data) ||
    !("public_id" in data)
  ) {
    throw new Error(
      "error" in data && data.error?.message
        ? data.error.message
        : "Cloudinary upload failed.",
    );
  }

  return data;
}

export async function deleteCloudinaryImage(
  publicId: string,
): Promise<CloudinaryDeleteResult> {
  const normalizedPublicId = publicId.trim();

  if (!normalizedPublicId) {
    return {
      result: "not found",
    };
  }

  if (!isValidCloudinaryPublicId(normalizedPublicId)) {
    throw new Error("Invalid Cloudinary public ID.");
  }

  const { cloudName, apiKey, apiSecret } =
    getCloudinaryConfig();

  const timestamp = Math.floor(Date.now() / 1000);

  const destroyParams = {
    invalidate: "true",
    public_id: normalizedPublicId,
    timestamp,
  };

  const signature = signParameters(
    destroyParams,
    apiSecret,
  );

  const formData = new FormData();

  formData.set("public_id", normalizedPublicId);
  formData.set("api_key", apiKey);
  formData.set("timestamp", String(timestamp));
  formData.set("invalidate", "true");
  formData.set("signature", signature);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
    {
      method: "POST",
      body: formData,
      cache: "no-store",
    },
  );

  const data = (await response.json()) as
    | CloudinaryDeleteResult
    | {
        error?: {
          message?: string;
        };
      };

  if (!response.ok || !("result" in data)) {
    throw new Error(
      "error" in data && data.error?.message
        ? data.error.message
        : "Cloudinary image deletion failed.",
    );
  }

  return data;
}

export async function deleteCloudinaryImages(
  publicIds: string[],
) {
  const uniquePublicIds = Array.from(
    new Set(
      publicIds
        .map((publicId) => publicId.trim())
        .filter(Boolean)
        .filter(isValidCloudinaryPublicId),
    ),
  );

  if (uniquePublicIds.length === 0) {
    return [];
  }

  return Promise.allSettled(
    uniquePublicIds.map((publicId) =>
      deleteCloudinaryImage(publicId),
    ),
  );
}
