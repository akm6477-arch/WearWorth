"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

export default function SecurityPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
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

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = (await response.json()) as {
        error?: string;
        message?: string;
      };

      if (!response.ok) {
        setError(data.error || "Unable to change password.");
      } else {
        setMessage(
          data.message || "Password updated successfully.",
        );
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
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
        <p className="eyebrow">ACCOUNT SECURITY</p>
        <h1>Update your password safely.</h1>
        <p>
          This page changes the password for your signed-in
          WearWorth account.
        </p>

        <form onSubmit={handleSubmit} className="account-utility-form">
          <label>
            <span>Current password</span>
            <input
              type="password"
              value={currentPassword}
              onChange={(event) =>
                setCurrentPassword(event.target.value)
              }
              autoComplete="current-password"
            />
          </label>

          <label>
            <span>New password</span>
            <input
              type="password"
              value={newPassword}
              onChange={(event) =>
                setNewPassword(event.target.value)
              }
              autoComplete="new-password"
            />
          </label>

          <label>
            <span>Confirm new password</span>
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
            {submitting ? "UPDATING..." : "SAVE PASSWORD"}
          </button>
        </form>

        <Link href="/profile" className="account-utility-link">
          Back to profile
        </Link>
      </section>
    </main>
  );
}
