"use client";

import { useState } from "react";
import type { FormEvent } from "react";

export default function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setMessage("Enter a valid email address.");
      return;
    }

    setMessage(
      "Newsletter signup needs an email provider before addresses can be saved.",
    );
  };

  return (
    <form className="newsletter-form" onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="Enter your email address"
        aria-label="Email address"
      />

      <button type="submit">JOIN WEARWORTH</button>

      {message ? (
        <p className="newsletter-form-note" role="status">
          {message}
        </p>
      ) : null}
    </form>
  );
}
