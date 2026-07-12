"use client";

import { FormEvent, Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = useMemo(
    () => searchParams.get("token") || "",
    [searchParams],
  );

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!token) {
      setError("This reset link is missing a token.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          password,
        }),
      });

      const data = (await response.json()) as {
        error?: string;
        message?: string;
      };

      if (!response.ok) {
        setError(data.error || "Unable to reset password.");
      } else {
        setMessage(
          data.message || "Password reset successfully.",
        );
      }
    } catch {
      setError("Unable to connect right now.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="account-utility-page">
      <section className="container account-utility-card">
        <p className="eyebrow">RESET PASSWORD</p>
        <h1>Choose a new secure password.</h1>
        <p>
          Use at least 8 characters with uppercase,
          lowercase and a number.
        </p>

        <form onSubmit={handleSubmit} className="account-utility-form">
          <label>
            <span>New password</span>
            <input
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              autoComplete="new-password"
            />
          </label>

          <label>
            <span>Confirm password</span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) =>
                setConfirmPassword(event.target.value)
              }
              autoComplete="new-password"
            />
          </label>

          {error && <div className="account-form-error">{error}</div>}
          {message && <div className="account-form-success">{message}</div>}

          <button
            type="submit"
            className="button primary"
            disabled={submitting}
          >
            {submitting ? "UPDATING..." : "RESET PASSWORD"}
          </button>
        </form>

        <Link href="/login" className="account-utility-link">
          Back to sign in
        </Link>
      </section>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<main className="account-utility-page" />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
