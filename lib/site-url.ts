const LOCAL_SITE_URL = "http://localhost:3000";

export function getSiteUrl() {
  const configuredUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : LOCAL_SITE_URL);

  try {
    return new URL(configuredUrl);
  } catch {
    return new URL(LOCAL_SITE_URL);
  }
}
