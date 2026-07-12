"use client";

import {
  FormEvent,
  Suspense,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react";

import { useAuth } from "@/app/context/AuthContext";
import { sanitizeRedirectPath } from "@/lib/routes";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const {
    login,
    authenticated,
    loading: authLoading,
  } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const redirectPath = useMemo(
    () =>
      sanitizeRedirectPath(
        searchParams.get("redirect"),
      ),
    [searchParams],
  );

  useEffect(() => {
    if (!authLoading && authenticated) {
      router.replace(redirectPath);
    }
  }, [
    authenticated,
    authLoading,
    redirectPath,
    router,
  ]);

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setError("");

    const normalizedEmail = email.trim().toLowerCase();

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        normalizedEmail,
      )
    ) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setSubmitting(true);

    const result = await login({
      email: normalizedEmail,
      password,
      rememberMe,
    });

    setSubmitting(false);

    if (!result.success) {
      setError(
        result.error ||
          "We could not sign you in. Please try again.",
      );
      return;
    }

    router.replace(redirectPath);
    router.refresh();
  };

  if (authLoading) {
    return (
      <main className="auth-page">
        <section className="container auth-loading">
          <div className="auth-loading-card" />
        </section>
      </main>
    );
  }

  return (
    <main className="auth-page">
      <section className="auth-shell container">
        <div className="auth-story-panel">
          <div className="auth-story-top">
            <p className="eyebrow">
              WELCOME BACK TO WEARWORTH
            </p>

            <h1>
              Return to the story
              <span>you chose to wear.</span>
            </h1>

            <p>
              Sign in to access your wishlist, orders,
              saved details and the pieces that felt
              like you.
            </p>
          </div>

          <div className="auth-belief-card">
            <span>THE WEARWORTH BELIEF</span>

            <blockquote>
              "The world may decide your price. Only
              you decide your worth."
            </blockquote>
          </div>

          <div className="auth-story-points">
            <article>
              <Check size={17} />

              <div>
                <strong>Remember your stories</strong>
                <p>
                  Keep your wishlist and account history
                  together.
                </p>
              </div>
            </article>

            <article>
              <ShieldCheck size={17} />

              <div>
                <strong>Secure access</strong>
                <p>
                  Your session uses an HTTP-only
                  authentication cookie.
                </p>
              </div>
            </article>

            <article>
              <LockKeyhole size={17} />

              <div>
                <strong>Private by design</strong>
                <p>
                  Your password is stored as a secure
                  hash, never as plain text.
                </p>
              </div>
            </article>
          </div>
        </div>

        <div className="auth-form-panel">
          <div className="auth-form-heading">
            <p className="eyebrow">SIGN IN</p>

            <h2>Welcome back.</h2>

            <p>
              Enter your WearWorth account details to
              continue.
            </p>
          </div>

          <form
            className="auth-form"
            onSubmit={handleSubmit}
            noValidate
          >
            {error && (
              <div className="auth-error-message">
                {error}
              </div>
            )}

            <label className="auth-field">
              <span>EMAIL ADDRESS</span>

              <div className="auth-input-wrap">
                <Mail size={18} />

                <input
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>
            </label>

            <label className="auth-field">
              <span>PASSWORD</span>

              <div className="auth-input-wrap">
                <LockKeyhole size={18} />

                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />

                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() =>
                    setShowPassword(
                      (currentValue) => !currentValue,
                    )
                  }
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </label>

            <div className="auth-form-options">
              <label className="auth-checkbox">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) =>
                    setRememberMe(event.target.checked)
                  }
                />

                <span className="auth-checkbox-box">
                  {rememberMe && <Check size={13} />}
                </span>

                <small>Remember me</small>
              </label>

              <Link href="/forgot-password">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              className="auth-submit-button"
              disabled={submitting}
            >
              {submitting
                ? "SIGNING IN..."
                : "SIGN IN"}

              {!submitting && <ArrowRight size={18} />}
            </button>
          </form>

          <div className="auth-register-prompt">
            <p>New to WearWorth?</p>

            <Link href="/register">
              CREATE AN ACCOUNT
            </Link>
          </div>

          <div className="auth-legal-note">
            <ShieldCheck size={17} />

            <p>
              By continuing, you agree to WearWorth's
              account terms and privacy practices.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="auth-page">
          <section className="container auth-loading">
            <div className="auth-loading-card" />
          </section>
        </main>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
