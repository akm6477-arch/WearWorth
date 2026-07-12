"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { useAuth } from "@/app/context/AuthContext";

export default function RegisterPage() {
  const router = useRouter();

  const {
    register,
    authenticated,
    loading: authLoading,
  } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");
  const [showPassword, setShowPassword] =
    useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);
  const [acceptTerms, setAcceptTerms] =
    useState(false);
  const [submitting, setSubmitting] =
    useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && authenticated) {
      router.replace("/profile");
    }
  }, [authenticated, authLoading, router]);

  const passwordRules = useMemo(
    () => ({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
    }),
    [password],
  );

  const passwordIsValid =
    passwordRules.length &&
    passwordRules.uppercase &&
    passwordRules.lowercase &&
    passwordRules.number;

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setError("");

    const normalizedName = name.trim();
    const normalizedEmail =
      email.trim().toLowerCase();

    if (normalizedName.length < 2) {
      setError("Please enter your full name.");
      return;
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        normalizedEmail,
      )
    ) {
      setError(
        "Please enter a valid email address.",
      );
      return;
    }

    if (!passwordIsValid) {
      setError(
        "Password must be at least 8 characters and include uppercase, lowercase and a number.",
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!acceptTerms) {
      setError(
        "Please accept the account terms and privacy practices.",
      );
      return;
    }

    setSubmitting(true);

    const result = await register({
      name: normalizedName,
      email: normalizedEmail,
      password,
    });

    setSubmitting(false);

    if (!result.success) {
      setError(
        result.error ||
          "We could not create your account.",
      );
      return;
    }

    router.replace("/profile");
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
              JOIN WEARWORTH
            </p>

            <h1>
              Create an account
              <span>built around your story.</span>
            </h1>

            <p>
              Save products, manage orders, keep your
              details together and return to the pieces
              that felt like you.
            </p>
          </div>

          <div className="auth-belief-card">
            <span>THE WEARWORTH BELIEF</span>

            <blockquote>
              “Your worth was never something the world
              was supposed to calculate.”
            </blockquote>
          </div>

          <div className="auth-story-points">
            <article>
              <Check size={17} />

              <div>
                <strong>Save what matters</strong>

                <p>
                  Keep your wishlist and product stories
                  in one place.
                </p>
              </div>
            </article>

            <article>
              <ShieldCheck size={17} />

              <div>
                <strong>Secure account</strong>

                <p>
                  Your password is securely hashed before
                  storage.
                </p>
              </div>
            </article>

            <article>
              <LockKeyhole size={17} />

              <div>
                <strong>Private session</strong>

                <p>
                  Authentication uses an HTTP-only cookie.
                </p>
              </div>
            </article>
          </div>
        </div>

        <div className="auth-form-panel">
          <div className="auth-form-heading">
            <p className="eyebrow">
              CREATE ACCOUNT
            </p>

            <h2>Begin your chapter.</h2>

            <p>
              Create your WearWorth account using your
              name, email and a secure password.
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
              <span>FULL NAME</span>

              <div className="auth-input-wrap">
                <UserRound size={18} />

                <input
                  type="text"
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  placeholder="Enter your full name"
                  autoComplete="name"
                />
              </div>
            </label>

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
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="Create a secure password"
                  autoComplete="new-password"
                />

                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() =>
                    setShowPassword(
                      (currentValue) =>
                        !currentValue,
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

            <div className="auth-password-rules">
              <p>PASSWORD REQUIREMENTS</p>

              <span
                className={
                  passwordRules.length
                    ? "auth-rule-valid"
                    : ""
                }
              >
                <Check size={13} />
                At least 8 characters
              </span>

              <span
                className={
                  passwordRules.uppercase
                    ? "auth-rule-valid"
                    : ""
                }
              >
                <Check size={13} />
                One uppercase letter
              </span>

              <span
                className={
                  passwordRules.lowercase
                    ? "auth-rule-valid"
                    : ""
                }
              >
                <Check size={13} />
                One lowercase letter
              </span>

              <span
                className={
                  passwordRules.number
                    ? "auth-rule-valid"
                    : ""
                }
              >
                <Check size={13} />
                One number
              </span>
            </div>

            <label className="auth-field">
              <span>CONFIRM PASSWORD</span>

              <div className="auth-input-wrap">
                <LockKeyhole size={18} />

                <input
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(
                      event.target.value,
                    )
                  }
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                />

                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() =>
                    setShowConfirmPassword(
                      (currentValue) =>
                        !currentValue,
                    )
                  }
                  aria-label={
                    showConfirmPassword
                      ? "Hide confirm password"
                      : "Show confirm password"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </label>

            <label className="auth-checkbox">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(event) =>
                  setAcceptTerms(
                    event.target.checked,
                  )
                }
              />

              <span className="auth-checkbox-box">
                {acceptTerms && (
                  <Check size={13} />
                )}
              </span>

              <small>
                I agree to the WearWorth account terms
                and privacy practices.
              </small>
            </label>

            <button
              type="submit"
              className="auth-submit-button"
              disabled={submitting}
            >
              {submitting
                ? "CREATING ACCOUNT..."
                : "CREATE ACCOUNT"}

              {!submitting && (
                <ArrowRight size={18} />
              )}
            </button>
          </form>

          <div className="auth-register-prompt">
            <p>Already have an account?</p>

            <Link href="/login">
              SIGN IN
            </Link>
          </div>

          <div className="auth-legal-note">
            <ShieldCheck size={17} />

            <p>
              Registration automatically creates a
              secure session, so you will be signed in
              immediately.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
