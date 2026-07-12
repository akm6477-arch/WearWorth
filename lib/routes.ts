const INTERNAL_REDIRECT_FALLBACK = "/profile";

export function sanitizeRedirectPath(
  value: string | null | undefined,
  fallback = INTERNAL_REDIRECT_FALLBACK,
) {
  if (!value) {
    return fallback;
  }

  if (!value.startsWith("/")) {
    return fallback;
  }

  if (value.startsWith("//")) {
    return fallback;
  }

  return value;
}
