"use client";

import { FormEvent, useEffect, useState } from "react";

interface Address {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  pincode: string;
  landmark?: string | null;
  isDefault: boolean;
}

const initialForm = {
  label: "",
  fullName: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  pincode: "",
  landmark: "",
  isDefault: false,
};

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const loadAddresses = async () => {
    try {
      const response = await fetch("/api/addresses", {
        cache: "no-store",
      });
      const data = (await response.json()) as {
        addresses?: Address[];
        error?: string;
      };

      if (!response.ok) {
        setError(data.error || "Unable to load addresses.");
        return;
      }

      setAddresses(data.addresses || []);
    } catch {
      setError("Unable to load addresses.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAddresses();
  }, []);

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const response = await fetch(
        editingId ? `/api/addresses/${editingId}` : "/api/addresses",
        {
          method: editingId ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(form),
        },
      );

      const data = (await response.json()) as {
        error?: string;
      };

      if (!response.ok) {
        setError(data.error || "Unable to save address.");
        return;
      }

      resetForm();
      await loadAddresses();
    } catch {
      setError("Unable to save address.");
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (address: Address) => {
    setEditingId(address.id);
    setForm({
      label: address.label,
      fullName: address.fullName,
      phone: address.phone,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 || "",
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      landmark: address.landmark || "",
      isDefault: address.isDefault,
    });
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/addresses/${id}`, {
        method: "DELETE",
      });
      await loadAddresses();
    } catch {
      setError("Unable to delete address.");
    }
  };

  return (
    <main className="account-utility-page">
      <section className="container account-address-page">
        <div className="account-address-header">
          <div>
            <p className="eyebrow">SAVED ADDRESSES</p>
            <h1>Manage delivery details.</h1>
          </div>
        </div>

        {loading ? <div className="account-list-loading" /> : null}
        {error ? <div className="account-form-error">{error}</div> : null}

        <form onSubmit={handleSubmit} className="account-address-form">
          <input
            value={form.label}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                label: event.target.value,
              }))
            }
            placeholder="Home, Work, Parents..."
          />
          <input
            value={form.fullName}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                fullName: event.target.value,
              }))
            }
            placeholder="Full name"
          />
          <input
            value={form.phone}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                phone: event.target.value,
              }))
            }
            placeholder="Phone number"
          />
          <input
            value={form.addressLine1}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                addressLine1: event.target.value,
              }))
            }
            placeholder="House number and street"
          />
          <input
            value={form.addressLine2}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                addressLine2: event.target.value,
              }))
            }
            placeholder="Apartment or building"
          />
          <input
            value={form.city}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                city: event.target.value,
              }))
            }
            placeholder="City"
          />
          <input
            value={form.state}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                state: event.target.value,
              }))
            }
            placeholder="State"
          />
          <input
            value={form.pincode}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                pincode: event.target.value,
              }))
            }
            placeholder="Pincode"
          />
          <input
            value={form.landmark}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                landmark: event.target.value,
              }))
            }
            placeholder="Landmark"
          />

          <label className="account-checkbox-row">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  isDefault: event.target.checked,
                }))
              }
            />
            <span>Set as default address</span>
          </label>

          <div className="account-utility-actions">
            <button
              type="submit"
              className="button primary"
              disabled={submitting}
            >
              {submitting
                ? "SAVING..."
                : editingId
                  ? "UPDATE ADDRESS"
                  : "ADD ADDRESS"}
            </button>

            {editingId ? (
              <button
                type="button"
                className="button ghost"
                onClick={resetForm}
              >
                CANCEL
              </button>
            ) : null}
          </div>
        </form>

        <div className="account-list-grid">
          {addresses.map((address) => (
            <article key={address.id} className="account-list-card">
              <p>
                {address.label}
                {address.isDefault ? " (Default)" : ""}
              </p>
              <strong>{address.fullName}</strong>
              <span>{address.phone}</span>
              <small>
                {address.addressLine1}, {address.city}, {address.state} - {address.pincode}
              </small>
              <div className="account-card-actions">
                <button type="button" onClick={() => startEdit(address)}>
                  Edit
                </button>
                <button type="button" onClick={() => handleDelete(address.id)}>
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
