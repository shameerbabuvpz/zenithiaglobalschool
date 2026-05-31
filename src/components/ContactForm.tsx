"use client";

import { useState } from "react";

export default function ContactForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">(
    "idle",
  );
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setError("");

    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Something went wrong");
      }
      setStatus("ok");
      form.reset();
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  if (status === "ok") {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-8 text-center">
        <div className="text-4xl">✅</div>
        <h3 className="mt-3 font-display text-xl font-bold text-ink">
          Thank you!
        </h3>
        <p className="mt-2 text-sm text-ink/65">
          Your message has been received. Our team will get back to you shortly.
        </p>
        <button
          onClick={() => setStatus("idle")}
          className="btn-outline mt-5"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="name">Full name *</label>
          <input id="name" name="name" required className="input" placeholder="Your name" />
        </div>
        <div>
          <label className="label" htmlFor="phone">Phone</label>
          <input id="phone" name="phone" className="input" placeholder="Phone number" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="email">Email *</label>
          <input id="email" name="email" type="email" required className="input" placeholder="you@example.com" />
        </div>
        <div>
          <label className="label" htmlFor="subject">Subject</label>
          <input id="subject" name="subject" className="input" placeholder="Admission enquiry" />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="message">Message *</label>
        <textarea id="message" name="message" required rows={5} className="input" placeholder="How can we help you?" />
      </div>

      {status === "error" && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <button type="submit" disabled={status === "loading"} className="btn-primary w-full sm:w-auto">
        {status === "loading" ? "Sending..." : "Send message"}
      </button>
    </form>
  );
}
