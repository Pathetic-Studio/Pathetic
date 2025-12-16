"use client";

import type React from "react";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { useNewsletterModal } from "../contact/contact-modal-context";

type NewsletterFormData = {
  name: string;
  email: string;
  website: string; // honeypot
};

const SOURCE_VALUE = "website_newsletter_modal";

export default function NewsletterForm() {
  const { close } = useNewsletterModal();

  const [form, setForm] = useState<NewsletterFormData>({
    name: "",
    email: "",
    website: "",
  });

  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    setError(null);

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          name: form.name || undefined,
          source: SOURCE_VALUE,
          website: form.website,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Failed to subscribe");
      }

      setStatus("success");
      setForm({ name: "", email: "", website: "" });
    } catch (err: any) {
      setStatus("error");
      setError(err?.message || "Something went wrong");
    }
  };

  const disabled = status === "submitting";

  return (
    <form onSubmit={handleSubmit} className="space-y-5 text-sm text-white">
      {/* Honeypot */}
      <div className="hidden" aria-hidden="true">
        <input
          name="website"
          value={form.website}
          onChange={handleChange}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      {/* Name */}
      <div className="grid grid-cols-[70px_1fr] items-center gap-3">
        <label
          htmlFor="newsletter-name"
          className="text-left uppercase tracking-[0.16em] text-white"
        >
          Name
        </label>
        <input
          id="newsletter-name"
          name="name"
          value={form.name}
          onChange={handleChange}
          className="bg-transparent text-white outline-none border-0 border-b border-black px-1 py-2 focus:border-black"
        />
      </div>

      {/* Email */}
      <div className="grid grid-cols-[70px_1fr] items-center gap-3">
        <label
          htmlFor="newsletter-email"
          className="text-left uppercase tracking-[0.16em] text-white"
        >
          Email
        </label>
        <input
          id="newsletter-email"
          name="email"
          type="email"
          required
          value={form.email}
          onChange={handleChange}
          className="bg-transparent text-white outline-none border-0 border-b border-black px-1 py-2 focus:border-black"
        />
      </div>

      {status === "error" && (
        <p className="text-xs text-black text-center">
          {error ?? "Error subscribing"}
        </p>
      )}

      {status === "success" && (
        <p className="text-xs text-black text-center">You’re subscribed.</p>
      )}

      <div className="flex justify-center gap-3 pt-2">
        <Button
          type="button"
          onClick={close}
          variant="menu"
          className="border border-black bg-transparent px-3 py-1.5 text-xs font-medium text-black hover:bg-black hover:text-white"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={disabled}
          className="px-4 py-1.5 text-xs font-medium bg-black text-white hover:bg-black/90 disabled:opacity-60"
        >
          {disabled ? "Subscribing..." : "Subscribe"}
        </Button>
      </div>
    </form>
  );
}
