"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type UserRole = "USER" | "ADMIN";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

interface LoginInput {
  email: string;
  password: string;
  rememberMe?: boolean;
}

interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

interface UpdateProfileInput {
  name: string;
  email: string;
}

interface AuthResult {
  success: boolean;
  error?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  authenticated: boolean;

  refreshUser: () => Promise<void>;
  login: (input: LoginInput) => Promise<AuthResult>;
  register: (input: RegisterInput) => Promise<AuthResult>;
  updateProfile: (
    input: UpdateProfileInput,
  ) => Promise<AuthResult>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);

async function readErrorMessage(
  response: Response,
  fallbackMessage: string,
): Promise<string> {
  try {
    const data = (await response.json()) as {
      error?: string;
      message?: string;
    };

    return data.error || data.message || fallbackMessage;
  } catch {
    return fallbackMessage;
  }
}

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      if (!response.ok) {
        setUser(null);
        return;
      }

      const data = (await response.json()) as {
        user?: AuthUser | null;
      };

      setUser(data.user ?? null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  const login = useCallback(
    async ({
      email,
      password,
      rememberMe = false,
    }: LoginInput): Promise<AuthResult> => {
      try {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
            rememberMe,
          }),
        });

        if (!response.ok) {
          return {
            success: false,
            error: await readErrorMessage(
              response,
              "We could not sign you in.",
            ),
          };
        }

        const data = (await response.json()) as {
          user: AuthUser;
        };

        setUser(data.user);

        return {
          success: true,
        };
      } catch {
        return {
          success: false,
          error:
            "Unable to connect to the server. Please try again.",
        };
      }
    },
    [],
  );

  const register = useCallback(
    async ({
      name,
      email,
      password,
    }: RegisterInput): Promise<AuthResult> => {
      try {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            email,
            password,
          }),
        });

        if (!response.ok) {
          return {
            success: false,
            error: await readErrorMessage(
              response,
              "We could not create your account.",
            ),
          };
        }

        const data = (await response.json()) as {
          user: AuthUser;
        };

        setUser(data.user);

        return {
          success: true,
        };
      } catch {
        return {
          success: false,
          error:
            "Unable to connect to the server. Please try again.",
        };
      }
    },
    [],
  );

  const updateProfile = useCallback(
    async ({
      name,
      email,
    }: UpdateProfileInput): Promise<AuthResult> => {
      try {
        const response = await fetch("/api/profile", {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            email,
          }),
        });

        if (!response.ok) {
          return {
            success: false,
            error: await readErrorMessage(
              response,
              "We could not update your profile.",
            ),
          };
        }

        const data = (await response.json()) as {
          user: AuthUser;
        };

        setUser(data.user);

        return {
          success: true,
        };
      } catch {
        return {
          success: false,
          error:
            "Unable to connect to the server. Please try again.",
        };
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      authenticated: Boolean(user),
      refreshUser,
      login,
      register,
      updateProfile,
      logout,
    }),
    [
      user,
      loading,
      refreshUser,
      login,
      register,
      updateProfile,
      logout,
    ],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider",
    );
  }

  return context;
}
