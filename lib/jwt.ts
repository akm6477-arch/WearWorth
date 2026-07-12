import jwt from "jsonwebtoken";
import type { Secret, SignOptions } from "jsonwebtoken";

export interface AuthTokenPayload {
  userId: string;
  email: string;
  role: "USER" | "ADMIN";
}

function getJwtSecret(): Secret {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error(
      "JWT_SECRET is missing. Add it to the project .env file.",
    );
  }

  return secret;
}

export function createAuthToken(
  payload: AuthTokenPayload,
): string {
  const options: SignOptions = {
    expiresIn: "7d",
    algorithm: "HS256",
  };

  return jwt.sign(
    payload,
    getJwtSecret(),
    options,
  );
}

export function verifyAuthToken(
  token: string,
): AuthTokenPayload | null {
  try {
    const decoded = jwt.verify(
      token,
      getJwtSecret(),
      {
        algorithms: ["HS256"],
      },
    );

    if (
      typeof decoded === "string" ||
      !decoded.userId ||
      !decoded.email ||
      !decoded.role
    ) {
      return null;
    }

    if (
      decoded.role !== "USER" &&
      decoded.role !== "ADMIN"
    ) {
      return null;
    }

    return {
      userId: String(decoded.userId),
      email: String(decoded.email),
      role: decoded.role,
    };
  } catch {
    return null;
  }
}