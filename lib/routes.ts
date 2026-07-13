const INTERNAL_REDIRECT_FALLBACK = "/profile";

export function sanitizeRedirectPath(
  value: string | null | undefined,
  fallback = INTERNAL_REDIRECT_FALLBACK,
) {
  if (!value) {
    return fallback;
  }

  const path = value.trim();

  if (!path.startsWith("/")) {
    return fallback;
  }

  if (
    path.startsWith("//") ||
    path.startsWith("/\\") ||
    path.includes("://")
  ) {
    return fallback;
  }

  return path;
}
