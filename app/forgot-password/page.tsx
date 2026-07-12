"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = (await response.json()) as {
        error?: string;
        message?: string;
      };

      if (!response.ok) {
        setError(
          data.error ||
            "Unable to start the password reset flow.",
        );
      } else {
        setMessage(
          data.message ||
            "If an account exists, the reset flow has started.",
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
        <p className="eyebrow">FORGOT PASSWORD</p>
        <h1>Reset access to your account.</h1>
        <p>
          Enter your WearWorth email. The secure reset
          architecture is ready, but email delivery only
          becomes automatic after a provider is connected.
        </p>

        <form onSubmit={handleSubmit} className="account-utility-form">
          <label>
            <span>Email address</span>
            <input
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="you@example.com"
              autoComplete="email"
            />
          </label>

          {error && <div className="account-form-error">{error}</div>}
          {message && <div className="account-form-success">{message}</div>}

          <button
            type="submit"
            className="button primary"
            disabled={submitting}
          >
            {submitting ? "SUBMITTING..." : "START RESET"}
          </button>
        </form>

        <Link href="/login" className="account-utility-link">
          Back to sign in
        </Link>
      </section>
    </main>
  );
}
