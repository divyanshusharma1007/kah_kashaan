"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type {
  ArtistWritingStatus,
  ArtistWritingSubmission,
} from "@/services/artist-content";

const formats = [
  ["poem", "Poem"],
  ["book", "Book"],
  ["article", "Article"],
  ["essay", "Essay"],
  ["performance", "Performance"],
  ["other", "Other"],
] as const;

function isWritingSubmission(value: unknown): value is ArtistWritingSubmission {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<ArtistWritingSubmission>;
  return typeof item.id === "string" &&
    typeof item.title === "string" &&
    typeof item.excerpt === "string" &&
    typeof item.url === "string" &&
    typeof item.selected === "boolean" &&
    formats.some(([format]) => format === item.format) &&
    (item.status === "pending" || item.status === "approved" || item.status === "rejected");
}

function statusLabel(status: ArtistWritingStatus) {
  return status === "approved" ? "Approved" : status === "rejected" ? "Changes requested" : "Awaiting admin review";
}

export function ArtistWritingPortfolio() {
  const [writeups, setWriteups] = useState<ArtistWritingSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/artist/writeups", { cache: "no-store" })
      .then(async (response) => {
        const result: unknown = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(result && typeof result === "object" && "error" in result &&
            typeof result.error === "string" ? result.error : "Could not load your writing portfolio.");
        }
        if (!result || typeof result !== "object" || !("writeups" in result) ||
            !Array.isArray(result.writeups) || !result.writeups.every(isWritingSubmission)) {
          throw new Error("The writing portfolio returned an invalid response.");
        }
        if (active) setWriteups(result.writeups);
      })
      .catch((cause: unknown) => {
        console.error("Could not load artist writing portfolio.", cause);
        if (active) setError(cause instanceof Error ? cause.message : "Could not load your writing portfolio.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  function updateWriteup(index: number, field: "title" | "format" | "excerpt" | "url", value: string) {
    setWriteups((current) => current.map((item, itemIndex) =>
      itemIndex === index ? { ...item, [field]: value } : item,
    ));
  }

  function toggleSelection(index: number) {
    setWriteups((current) => {
      const isSelected = current[index]?.selected;
      if (!isSelected && current.filter((item) => item.selected).length >= 4) return current;
      return current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, selected: !item.selected } : item,
      );
    });
  }

  async function savePortfolio() {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/artist/writeups", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ writeups }),
      });
      const result: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(result && typeof result === "object" && "error" in result &&
          typeof result.error === "string" ? result.error : "Could not save your writing portfolio.");
      }
      if (!result || typeof result !== "object" || !("writeups" in result) ||
          !Array.isArray(result.writeups) || !result.writeups.every(isWritingSubmission)) {
        throw new Error("The writing portfolio returned an invalid response.");
      }
      setWriteups(result.writeups);
      setMessage("Your writing portfolio has been saved. Admins can now review your selected pieces.");
    } catch (cause) {
      console.error("Could not save artist writing portfolio.", cause);
      setError(cause instanceof Error ? cause.message : "Could not save your writing portfolio.");
    } finally {
      setSaving(false);
    }
  }

  const selectedCount = writeups.filter((item) => item.selected).length;

  return (
    <section className="mx-auto w-full max-w-6xl space-y-6" aria-labelledby="artist-writing-heading">
      <header className="rounded-2xl border border-[#d9af57]/20 bg-gradient-to-r from-[#d9af57]/[0.08] to-transparent p-5 sm:p-7">
        <p className="text-[10px] uppercase tracking-[0.22em] text-[#d9af57]">Artist workspace · Writing portfolio</p>
        <h1 className="mt-2 font-[var(--font-display)] text-3xl text-[#fff5d9] sm:text-4xl" id="artist-writing-heading">
          Your writing &amp; creative work
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-[#c1b596]">
          Add up to 100 works, describe each kind, and select up to four for your public profile.
          Selected work is sent to an admin for approval before it appears publicly.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            className="min-h-10 rounded-full border border-[#d9af57]/40 px-4 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#f0ddab] transition hover:border-[#d9af57] disabled:opacity-50"
            disabled={saving || loading || writeups.length >= 100}
            onClick={() => setWriteups((current) => [
              ...current,
              {
                id: "",
                title: "",
                format: "poem",
                excerpt: "",
                url: "",
                selected: false,
                status: "pending",
              },
            ])}
            type="button"
          >
            Add a writeup
          </button>
          <span className="text-xs text-[#a99b7e]">{writeups.length} writeups · {selectedCount}/4 selected</span>
        </div>
      </header>

      {error && <p className="rounded-xl border border-red-400/30 bg-red-950/30 p-4 text-sm text-red-200" role="alert">{error}</p>}
      {message && <p className="rounded-xl border border-emerald-400/20 bg-emerald-950/20 p-4 text-sm text-emerald-100" role="status">{message}</p>}

      {loading ? (
        <p className="rounded-xl border border-white/[0.08] bg-[#10100f] p-5 text-sm text-[#a99b7e]" role="status">
          Loading your writing portfolio...
        </p>
      ) : writeups.length === 0 ? (
        <p className="rounded-xl border border-dashed border-white/[0.1] bg-[#10100f] p-6 text-sm text-[#a99b7e]">
          You have not added any work yet. Use “Add a writeup” to share an excerpt, performance, essay, or other creative work.
        </p>
      ) : (
        <div className="space-y-4">
          {writeups.map((item, index) => (
            <article className="space-y-4 rounded-2xl border border-white/[0.08] bg-[#10100f] p-4 sm:p-5" key={item.id || `new-writeup-${index}`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-[var(--font-display)] text-xl text-[#fff5d9]">
                  {item.title || `Writeup ${index + 1}`}
                </h2>
                <span className={`rounded-full px-3 py-1 text-[9px] uppercase tracking-[0.12em] ${
                  item.status === "approved"
                    ? "bg-emerald-950/40 text-emerald-200"
                    : item.status === "rejected"
                      ? "bg-amber-950/40 text-amber-200"
                      : "bg-white/[0.06] text-[#c4b58f]"
                }`}>
                  {statusLabel(item.status)}
                </span>
              </div>
              <div className="grid gap-4 sm:grid-cols-[1fr_0.7fr]">
                <label className="block text-xs font-medium text-[#cbbd9f]">
                  Title
                  <input
                    className="mt-2 min-h-11 w-full rounded-xl border border-white/[0.09] bg-[#0b0b0a] px-3 text-sm text-[#fff5d9] outline-none focus:border-[#d9af57]/50"
                    maxLength={100}
                    onChange={(event) => updateWriteup(index, "title", event.target.value)}
                    value={item.title}
                  />
                </label>
                <label className="block text-xs font-medium text-[#cbbd9f]">
                  Kind of writing
                  <select
                    className="mt-2 min-h-11 w-full rounded-xl border border-white/[0.09] bg-[#0b0b0a] px-3 text-sm text-[#fff5d9] outline-none focus:border-[#d9af57]/50"
                    onChange={(event) => updateWriteup(index, "format", event.target.value)}
                    value={item.format}
                  >
                    {formats.map(([format, label]) => <option key={format} value={format}>{label}</option>)}
                  </select>
                </label>
              </div>
              <label className="block text-xs font-medium text-[#cbbd9f]">
                Excerpt
                <textarea
                  className="mt-2 min-h-28 w-full rounded-xl border border-white/[0.09] bg-[#0b0b0a] px-3 py-3 text-sm leading-6 text-[#fff5d9] outline-none focus:border-[#d9af57]/50"
                  maxLength={1200}
                  onChange={(event) => updateWriteup(index, "excerpt", event.target.value)}
                  rows={5}
                  value={item.excerpt}
                />
              </label>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-4">
                  <label className="flex min-h-10 items-center gap-2 text-xs text-[#cbbd9f]">
                    <input
                      checked={item.selected}
                      disabled={!item.selected && selectedCount >= 4}
                      onChange={() => toggleSelection(index)}
                      type="checkbox"
                    />
                    Select for public profile
                  </label>
                  <label className="flex items-center gap-2 text-xs text-[#cbbd9f]">
                    Optional link
                    <input
                      className="min-h-10 w-56 max-w-full rounded-xl border border-white/[0.09] bg-[#0b0b0a] px-3 text-sm text-[#fff5d9] outline-none focus:border-[#d9af57]/50"
                      maxLength={2048}
                      onChange={(event) => updateWriteup(index, "url", event.target.value)}
                      placeholder="https://..."
                      type="url"
                      value={item.url}
                    />
                  </label>
                </div>
                <button
                  className="min-h-9 rounded-lg border border-red-400/20 px-3 text-xs text-red-200 transition hover:bg-red-950/30"
                  onClick={() => setWriteups((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                  type="button"
                >
                  Remove
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-4 border-t border-white/[0.07] pt-5">
        <button
          className="min-h-11 rounded-full bg-[#d9af57] px-6 text-xs font-semibold uppercase tracking-[0.14em] text-[#121212] transition hover:bg-[#f2d98b] disabled:opacity-60"
          disabled={loading || saving}
          onClick={() => void savePortfolio()}
          type="button"
        >
          {saving ? "Saving..." : "Save writing portfolio"}
        </button>
        <Link className="text-xs text-[#d8c8a2] underline decoration-[#d9af57]/40 underline-offset-4" href="/dashboard/artist/featured">
          Request website featuring
        </Link>
      </div>
    </section>
  );
}
