import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function withMongoTimeouts(url: string | undefined) {
  if (!url || !url.startsWith("mongodb")) {
    return url;
  }

  const separator = url.includes("?") ? "&" : "?";

  if (
    url.includes("serverSelectionTimeoutMS=") ||
    url.includes("connectTimeoutMS=")
  ) {
    return url;
  }

  return `${url}${separator}serverSelectionTimeoutMS=5000&connectTimeoutMS=5000&socketTimeoutMS=5000`;
}

export function isDatabaseUnavailableError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  return (
    error.message.includes("Server selection timeout") ||
    error.message.includes("ReplicaSetNoPrimary") ||
    error.message.includes("received fatal alert") ||
    error.message.includes("Raw query failed")
  );
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: withMongoTimeouts(process.env.DATABASE_URL),
      },
    },
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
