"use client";

import { useEffect, useState } from "react";
import type { ManagedSponsorInquiry } from "@/services/sponsor-inquiries";

function isInquiry(value: unknown): value is ManagedSponsorInquiry {
  if (!value || typeof value !== "object") return false;
  const inquiry = value as Partial<ManagedSponsorInquiry>;
  return typeof inquiry.id === "string" &&
    typeof inquiry.name === "string" &&
    typeof inquiry.organization === "string" &&
    typeof inquiry.email === "string" &&
    typeof inquiry.phone === "string" &&
    typeof inquiry.interest === "string" &&
    typeof inquiry.message === "string" &&
    typeof inquiry.createdAt === "string";
}

export function AdminSponsorInquiries() {
  const [inquiries, setInquiries] = useState<ManagedSponsorInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/sponsor-inquiries", { cache: "no-store" })
      .then(async (response) => {
        let result: unknown;
        try {
          result = await response.json();
        } catch {
          throw new Error("The sponsor inquiry service returned an invalid response.");
        }
        if (!response.ok) {
          throw new Error(result && typeof result === "object" && "error" in result && typeof result.error === "string"
            ? result.error
            : "Could not load sponsor inquiries.");
        }
        if (!result || typeof result !== "object" || !("inquiries" in result) ||
            !Array.isArray(result.inquiries) || !result.inquiries.every(isInquiry)) {
          throw new Error("The sponsor inquiry service returned an invalid response.");
        }
        if (active) setInquiries(result.inquiries);
      })
      .catch((cause: unknown) => {
        console.error("Could not load sponsor inquiries.", cause);
        if (active) setError(cause instanceof Error ? cause.message : "Could not load sponsor inquiries.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <section aria-labelledby="sponsor-inquiries-heading" className="space-y-3">
      <header className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[9px] uppercase tracking-[0.2em] text-[#a79a7d]">Incoming</p>
          <h2 className="mt-1 font-[var(--font-display)] text-2xl text-[#fff5d9]" id="sponsor-inquiries-heading">
            Partnership inquiries
          </h2>
        </div>
        <span className="text-xs text-[#827864]">{inquiries.length} recent</span>
      </header>
      {error && <p className="rounded-xl border border-red-400/30 bg-red-950/30 p-3 text-xs text-red-200" role="alert">{error}</p>}
      {loading ? (
        <p className="rounded-2xl border border-white/[0.07] bg-[#10100f] p-5 text-sm text-[#a99b7e]" role="status">Loading inquiries...</p>
      ) : inquiries.length === 0 ? (
        <p className="rounded-2xl border border-white/[0.07] bg-[#10100f] p-5 text-sm text-[#827864]">No partnership inquiries yet.</p>
      ) : (
        <div className="max-h-[55vh] space-y-3 overflow-y-auto overscroll-contain">
          {inquiries.map((inquiry) => (
            <article className="rounded-2xl border border-white/[0.07] bg-[#10100f] p-4 sm:p-5" key={inquiry.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-medium text-[#f0e6ce]">{inquiry.organization}</h3>
                  <p className="mt-1 text-xs text-[#b9ab8c]">{inquiry.name}{inquiry.interest ? ` · ${inquiry.interest}` : ""}</p>
                </div>
                <time className="text-[10px] text-[#827864]" dateTime={inquiry.createdAt}>
                  {new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeZone: "Asia/Kolkata" }).format(new Date(inquiry.createdAt))}
                </time>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#d9ceb0]">{inquiry.message}</p>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#d2b46a]">
                <a className="underline underline-offset-4 hover:text-[#fff5d9]" href={`mailto:${inquiry.email}`}>{inquiry.email}</a>
                {inquiry.phone && <a className="underline underline-offset-4 hover:text-[#fff5d9]" href={`tel:${inquiry.phone}`}>{inquiry.phone}</a>}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
