"use client";

import { useState, type FormEvent } from "react";
import type { PublicPageCopy } from "@/data/public-page-copy";

const inputClass =
  "mt-1.5 min-h-11 w-full rounded-xl border border-white/[0.09] bg-[#0b0b0a] px-3 text-sm text-[#fff5d9] outline-none placeholder:text-[#716954] focus:border-[#d9af57]/50";

export function SponsorInquiryForm({ copy }: { copy: PublicPageCopy["sponsorInquiryPage"] }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function submitInquiry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");
    const form = event.currentTarget;
    const formData = new FormData(form);
    const body = Object.fromEntries(formData.entries());

    try {
      const response = await fetch("/api/sponsor-inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      let result: unknown;
      try {
        result = await response.json();
      } catch {
        throw new Error("The inquiry service returned an invalid response.");
      }
      if (!response.ok) {
        const serverMessage =
          result && typeof result === "object" && "error" in result && typeof result.error === "string"
            ? result.error
            : "Could not send your inquiry.";
        throw new Error(serverMessage);
      }
      setMessage(copy.successMessage);
      form.reset();
    } catch (cause) {
      console.error("Could not submit partnership inquiry.", cause);
      setError(cause instanceof Error ? cause.message : "Could not send your inquiry.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="space-y-4 rounded-[1.5rem] border border-white/[0.08] bg-[#10100f] p-5 sm:p-7" onSubmit={submitInquiry}>
      {(error || message) && (
        <p className={`rounded-xl border p-3 text-sm ${error ? "border-red-400/30 bg-red-950/30 text-red-200" : "border-emerald-400/20 bg-emerald-950/20 text-emerald-100"}`} role={error ? "alert" : "status"}>
          {error || message}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-xs text-[#cbbd9f]">
          {copy.nameLabel}
          <input autoComplete="name" className={inputClass} maxLength={120} name="name" required />
        </label>
        <label className="text-xs text-[#cbbd9f]">
          {copy.organizationLabel}
          <input autoComplete="organization" className={inputClass} maxLength={160} name="organization" required />
        </label>
        <label className="text-xs text-[#cbbd9f]">
          {copy.emailLabel}
          <input autoComplete="email" className={inputClass} maxLength={254} name="email" required type="email" />
        </label>
        <label className="text-xs text-[#cbbd9f]">
          {copy.phoneLabel} <span className="text-[#827864]">{copy.optionalLabel}</span>
          <input autoComplete="tel" className={inputClass} maxLength={40} name="phone" type="tel" />
        </label>
        <label className="text-xs text-[#cbbd9f] sm:col-span-2">
          {copy.interestLabel} <span className="text-[#827864]">{copy.optionalLabel}</span>
          <input className={inputClass} maxLength={120} name="interest" placeholder={copy.interestPlaceholder} />
        </label>
        <label className="text-xs text-[#cbbd9f] sm:col-span-2">
          {copy.proposalLabel}
          <textarea className={`${inputClass} min-h-36 resize-y py-3 leading-6`} maxLength={3000} minLength={10} name="message" required />
        </label>
      </div>
      <button className="min-h-11 rounded-full bg-[#d9af57] px-6 text-xs font-semibold uppercase tracking-[0.16em] text-[#15130e] transition hover:bg-[#f2d98b] disabled:cursor-wait disabled:opacity-60" disabled={submitting} type="submit">
        {submitting ? copy.submittingLabel : copy.submitLabel}
      </button>
    </form>
  );
}
