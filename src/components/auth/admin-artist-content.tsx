"use client";

import { useEffect, useState } from "react";
import type { ArtistWritingSubmission } from "@/services/artist-content";

type ManagedArtist = {
  email: string;
  name: string;
  featuredStatus: "not-requested" | "requested" | "featured" | "rejected";
  featurePaymentStatus: "unpaid" | "paid" | "free" | null;
  writingSubmissions: ArtistWritingSubmission[];
};

type ArtistContent = { feeRupees: number | null; artists: ManagedArtist[] };

function isArtistContent(value: unknown): value is ArtistContent {
  if (!value || typeof value !== "object" || !("artists" in value) ||
      !Array.isArray(value.artists) ||
      !("feeRupees" in value) ||
      (value.feeRupees !== null && typeof value.feeRupees !== "number")) return false;
  return value.artists.every((artist) => artist && typeof artist === "object" &&
    typeof artist.email === "string" &&
    typeof artist.name === "string" &&
    (artist.featuredStatus === "not-requested" || artist.featuredStatus === "requested" ||
      artist.featuredStatus === "featured" || artist.featuredStatus === "rejected") &&
    (artist.featurePaymentStatus === null || artist.featurePaymentStatus === "unpaid" ||
      artist.featurePaymentStatus === "paid" || artist.featurePaymentStatus === "free") &&
    Array.isArray(artist.writingSubmissions) &&
    artist.writingSubmissions.every((item: unknown) => item && typeof item === "object" &&
      "id" in item && typeof item.id === "string" &&
      "title" in item && typeof item.title === "string" &&
      "excerpt" in item && typeof item.excerpt === "string" &&
      "format" in item && typeof item.format === "string" &&
      "url" in item && typeof item.url === "string" &&
      "selected" in item && typeof item.selected === "boolean" &&
      "status" in item && (item.status === "pending" || item.status === "approved" || item.status === "rejected")),
  );
}

function formatName(format: string) {
  return format === "poem" ? "Poem" : format === "book" ? "Book" :
    format === "article" ? "Article" : format === "essay" ? "Essay" :
      format === "performance" ? "Performance" : "Other";
}

function featureStatusLabel(artist: ManagedArtist) {
  if (artist.featuredStatus === "featured") return "Featured publicly";
  if (artist.featuredStatus === "requested") {
    return artist.featurePaymentStatus === "free"
      ? "Free request · awaiting review"
      : artist.featurePaymentStatus === "paid"
        ? "Paid request · awaiting review"
        : "Request · awaiting review";
  }
  return artist.featuredStatus === "rejected" ? "Previously rejected" : "No active request";
}

export function AdminArtistContent() {
  const [content, setContent] = useState<ArtistContent | null>(null);
  const [feeDraft, setFeeDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingFee, setSavingFee] = useState(false);
  const [updating, setUpdating] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadContent() {
    const response = await fetch("/api/admin/artist-content", { cache: "no-store" });
    const result: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(result && typeof result === "object" && "error" in result &&
        typeof result.error === "string" ? result.error : "Could not load artist content.");
    }
    if (!isArtistContent(result)) throw new Error("Artist content returned an invalid response.");
    setContent(result);
    setFeeDraft(result.feeRupees === null ? "" : String(result.feeRupees));
  }

  useEffect(() => {
    let active = true;
    fetch("/api/admin/artist-content", { cache: "no-store" })
      .then(async (response) => {
        const result: unknown = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(result && typeof result === "object" && "error" in result &&
            typeof result.error === "string" ? result.error : "Could not load artist content.");
        }
        if (!isArtistContent(result)) throw new Error("Artist content returned an invalid response.");
        if (active) {
          setContent(result);
          setFeeDraft(result.feeRupees === null ? "" : String(result.feeRupees));
        }
      })
      .catch((cause: unknown) => {
        console.error("Could not load admin artist content.", cause);
        if (active) setError(cause instanceof Error ? cause.message : "Could not load artist content.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function update(body: Record<string, unknown>, successMessage: string) {
    setUpdating(typeof body.email === "string" ? body.email : "fee");
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/artist-content", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(result && typeof result === "object" && "error" in result &&
          typeof result.error === "string" ? result.error : "Could not update artist content.");
      }
      await loadContent();
      setMessage(successMessage);
    } catch (cause) {
      console.error("Could not update artist content.", cause);
      setError(cause instanceof Error ? cause.message : "Could not update artist content.");
    } finally {
      setUpdating("");
    }
  }

  async function saveFee() {
    const feeRupees = Number(feeDraft);
    if (!Number.isSafeInteger(feeRupees) || feeRupees < 1 || feeRupees > 500_000) {
      setError("Set a feature fee between ₹1 and ₹500,000.");
      return;
    }
    setSavingFee(true);
    await update({ feeRupees }, `Artist feature fee updated to ₹${feeRupees}.`);
    setSavingFee(false);
  }

  const pendingWriteups = content?.artists.reduce((count, artist) =>
    count + artist.writingSubmissions.filter((item) => item.status === "pending").length, 0,
  ) ?? 0;
  const featureRequests = content?.artists.filter((artist) => artist.featuredStatus === "requested") ?? [];

  return (
    <section className="mx-auto w-full max-w-7xl space-y-6" aria-labelledby="admin-artist-content-heading">
      <header>
        <p className="text-[10px] uppercase tracking-[0.22em] text-[#d9af57]">Artist workspace management</p>
        <h1 className="mt-2 font-[var(--font-display)] text-3xl text-[#fff5d9] sm:text-4xl" id="admin-artist-content-heading">
          Writeups &amp; feature requests
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-[#c1b596]">
          Review selected artist work before it appears on public profiles. Feature requests enter this queue after verified payment, or when you mark them free.
        </p>
      </header>

      {error && <p className="rounded-xl border border-red-400/30 bg-red-950/30 p-4 text-sm text-red-200" role="alert">{error}</p>}
      {message && <p className="rounded-xl border border-emerald-400/20 bg-emerald-950/20 p-4 text-sm text-emerald-100" role="status">{message}</p>}

      {loading ? (
        <p className="rounded-xl border border-white/[0.08] bg-[#10100f] p-5 text-sm text-[#a99b7e]" role="status">Loading artist content...</p>
      ) : content ? (
        <>
          <section className="rounded-2xl border border-[#d9af57]/20 bg-[#10100f] p-5 sm:p-6" aria-labelledby="feature-fee-heading">
            <div className="flex flex-wrap items-end justify-between gap-5">
              <div>
                <h2 className="font-[var(--font-display)] text-2xl text-[#fff5d9]" id="feature-fee-heading">Artist feature fee</h2>
                <p className="mt-2 max-w-2xl text-xs leading-5 text-[#a99b7e]">
                  Set the INR fee artists pay when requesting website featuring. New payments use the current fee; requests marked free do not require payment.
                </p>
                <p className="mt-2 text-xs text-[#d9af57]">
                  {content.feeRupees === null ? "Fee not configured — paid requests are disabled." : `Current fee: ₹${content.feeRupees}`}
                </p>
              </div>
              <div className="flex items-end gap-3">
                <label className="block text-xs text-[#cbbd9f]" htmlFor="artist-feature-fee">Fee in rupees
                  <input
                    className="mt-2 min-h-11 w-36 rounded-xl border border-white/[0.09] bg-[#0b0b0a] px-3 text-sm text-[#fff5d9] outline-none focus:border-[#d9af57]/50"
                    id="artist-feature-fee"
                    max="500000"
                    min="1"
                    onChange={(event) => setFeeDraft(event.target.value)}
                    type="number"
                    value={feeDraft}
                  />
                </label>
                <button
                  className="min-h-11 rounded-full bg-[#d9af57] px-5 text-xs font-semibold uppercase tracking-[0.12em] text-[#121212] disabled:opacity-50"
                  disabled={savingFee || updating !== ""}
                  onClick={() => void saveFee()}
                  type="button"
                >
                  {savingFee ? "Saving..." : "Save fee"}
                </button>
              </div>
            </div>
          </section>

          <section className="space-y-4" aria-labelledby="feature-requests-heading">
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-[#d9af57]">Review queue</p>
              <h2 className="mt-1 font-[var(--font-display)] text-2xl text-[#fff5d9]" id="feature-requests-heading">
                Paid &amp; free feature requests ({featureRequests.length})
              </h2>
            </div>
            {featureRequests.length === 0 ? (
              <p className="rounded-xl border border-dashed border-white/[0.1] bg-[#10100f] p-5 text-sm text-[#a99b7e]">
                Paid and admin-approved free requests will appear here.
              </p>
            ) : featureRequests.map((artist) => (
              <article className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#d9af57]/20 bg-[#10100f] p-4 sm:p-5" key={artist.email}>
                <div>
                  <h3 className="text-sm font-medium text-[#fff5d9]">{artist.name}</h3>
                  <p className="mt-1 text-xs text-[#90856f]">{artist.email}</p>
                  <p className="mt-2 text-[10px] uppercase tracking-[0.12em] text-[#d9af57]">{featureStatusLabel(artist)}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    className="min-h-9 rounded-lg border border-emerald-300/25 px-3 text-xs text-emerald-100 disabled:opacity-50"
                    disabled={updating === artist.email}
                    onClick={() => void update({ email: artist.email, featureDecision: "approve" }, `${artist.name} is now featured publicly.`)}
                    type="button"
                  >
                    Approve &amp; feature
                  </button>
                  <button
                    className="min-h-9 rounded-lg border border-red-300/25 px-3 text-xs text-red-100 disabled:opacity-50"
                    disabled={updating === artist.email}
                    onClick={() => void update({ email: artist.email, featureDecision: "reject" }, `${artist.name}'s request was rejected.`)}
                    type="button"
                  >
                    Reject request
                  </button>
                </div>
              </article>
            ))}
          </section>

          <section className="space-y-4" aria-labelledby="free-feature-heading">
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-[#d9af57]">Admin-sponsored featuring</p>
              <h2 className="mt-1 font-[var(--font-display)] text-2xl text-[#fff5d9]" id="free-feature-heading">
                Mark an artist free
              </h2>
              <p className="mt-1 text-xs leading-5 text-[#a99b7e]">
                This creates a free request in the admin review queue without payment.
              </p>
            </div>
            {content.artists.filter((artist) =>
              artist.featuredStatus !== "featured" && artist.featuredStatus !== "requested",
            ).map((artist) => (
              <article className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-[#10100f] p-4" key={artist.email}>
                <div>
                  <p className="text-sm text-[#fff5d9]">{artist.name}</p>
                  <p className="mt-1 text-xs text-[#90856f]">{artist.email}</p>
                  <p className="mt-1 text-[10px] text-[#a99b7e]">{featureStatusLabel(artist)}</p>
                </div>
                <button
                  className="min-h-9 rounded-lg border border-[#d9af57]/30 px-3 text-xs text-[#f0ddab] disabled:opacity-50"
                  disabled={updating === artist.email}
                  onClick={() => void update({ email: artist.email, featureDecision: "free" }, `${artist.name} was marked free and added to the review queue.`)}
                  type="button"
                >
                  Mark free &amp; queue
                </button>
              </article>
            ))}
          </section>

          <section className="space-y-4" aria-labelledby="writeup-review-heading">
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-[#d9af57]">Portfolio moderation</p>
              <h2 className="mt-1 font-[var(--font-display)] text-2xl text-[#fff5d9]" id="writeup-review-heading">
                Artist writeups ({pendingWriteups} awaiting review)
              </h2>
            </div>
            {content.artists.filter((artist) => artist.writingSubmissions.length > 0).length === 0 ? (
              <p className="rounded-xl border border-dashed border-white/[0.1] bg-[#10100f] p-5 text-sm text-[#a99b7e]">
                Artist-submitted writing and creative work will appear here.
              </p>
            ) : content.artists.flatMap((artist) => artist.writingSubmissions.map((item) => (
              <article className="space-y-4 rounded-2xl border border-white/[0.08] bg-[#10100f] p-4 sm:p-5" key={`${artist.email}-${item.id}`}>
                <header className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-[#d9af57]">{artist.name} · {artist.email}</p>
                    <h3 className="mt-1 font-[var(--font-display)] text-2xl text-[#fff5d9]">{item.title}</h3>
                    <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-[#a99b7e]">
                      {formatName(item.format)} · {item.selected ? "Selected for artist profile" : "Not selected"}
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-[9px] uppercase tracking-[0.12em] ${
                    item.status === "approved" ? "bg-emerald-950/40 text-emerald-200" :
                      item.status === "rejected" ? "bg-red-950/40 text-red-200" : "bg-amber-950/40 text-amber-200"
                  }`}>{item.status}</span>
                </header>
                <p className="whitespace-pre-wrap text-sm leading-6 text-[#d4c6a8]">{item.excerpt}</p>
                {item.url && <a className="inline-block text-xs text-[#f0ddab] underline underline-offset-4" href={item.url} rel="noopener noreferrer" target="_blank">Open artist link</a>}
                <div className="flex flex-wrap gap-2">
                  {!item.selected && (
                    <button
                      className="min-h-9 rounded-lg border border-[#d9af57]/30 px-3 text-xs text-[#f0ddab] disabled:opacity-50"
                      disabled={updating === artist.email}
                      onClick={() => void update({
                        email: artist.email,
                        writeupId: item.id,
                        decision: "select",
                      }, `Selected and approved “${item.title}” for ${artist.name}'s public profile.`)}
                      type="button"
                    >
                      Admin select &amp; approve
                    </button>
                  )}
                  <button
                    className="min-h-9 rounded-lg border border-emerald-300/25 px-3 text-xs text-emerald-100 disabled:opacity-50"
                    disabled={updating === artist.email || item.status === "approved"}
                    onClick={() => void update({
                      email: artist.email,
                      writeupId: item.id,
                      decision: "approve",
                    }, `Approved “${item.title}” for ${artist.name}.`)}
                    type="button"
                  >
                    Approve for public profile
                  </button>
                  <button
                    className="min-h-9 rounded-lg border border-red-300/25 px-3 text-xs text-red-100 disabled:opacity-50"
                    disabled={updating === artist.email || item.status === "rejected"}
                    onClick={() => void update({
                      email: artist.email,
                      writeupId: item.id,
                      decision: "reject",
                    }, `Marked “${item.title}” as needing changes.`)}
                    type="button"
                  >
                    Request changes
                  </button>
                </div>
              </article>
            )))}
          </section>
        </>
      ) : null}
    </section>
  );
}
