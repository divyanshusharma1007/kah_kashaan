"use client";

import Image from "next/image";
import { useEffect, useState, type FormEvent } from "react";
import type { ManagedSponsor, SponsorInput } from "@/services/sponsors";
import { AdminSponsorInquiries } from "@/components/auth/admin-sponsor-inquiries";

const emptySponsor: SponsorInput = {
  name: "",
  category: "",
  summary: "",
  details: "",
  website: "",
  logoUrl: "",
  links: [],
  isWebsiteSponsor: false,
};

const inputClass = "mt-1.5 min-h-11 w-full rounded-xl border border-white/[0.09] bg-[#0b0b0a] px-3 text-sm text-[#fff5d9] outline-none placeholder:text-[#716954] focus:border-[#d9af57]/50";

function isSponsor(value: unknown): value is ManagedSponsor {
  if (!value || typeof value !== "object") return false;
  const sponsor = value as Partial<ManagedSponsor>;
  return typeof sponsor.id === "string" &&
    typeof sponsor.slug === "string" &&
    typeof sponsor.name === "string" &&
    typeof sponsor.category === "string" &&
    typeof sponsor.summary === "string" &&
    typeof sponsor.details === "string" &&
    typeof sponsor.website === "string" &&
    typeof sponsor.logoUrl === "string" &&
    Array.isArray(sponsor.links) &&
    sponsor.links.every((link) =>
      link &&
      typeof link.label === "string" &&
      typeof link.url === "string",
    ) &&
    typeof sponsor.isWebsiteSponsor === "boolean" &&
    typeof sponsor.createdAt === "string" &&
    typeof sponsor.updatedAt === "string";
}

async function readResponse(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    throw new Error("The sponsor service returned an invalid response.");
  }
}

function errorMessage(result: unknown, fallback: string): string {
  return result && typeof result === "object" && "error" in result && typeof result.error === "string"
    ? result.error
    : fallback;
}

export function AdminSponsorsDashboard() {
  const [sponsors, setSponsors] = useState<ManagedSponsor[]>([]);
  const [form, setForm] = useState<SponsorInput>(emptySponsor);
  const [editingId, setEditingId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function fetchSponsors(): Promise<ManagedSponsor[]> {
    const response = await fetch("/api/admin/sponsors", { cache: "no-store" });
    const result = await readResponse(response);
    if (!response.ok) throw new Error(errorMessage(result, "Could not load sponsors."));
    if (!result || typeof result !== "object" || !("sponsors" in result) ||
        !Array.isArray(result.sponsors) || !result.sponsors.every(isSponsor)) {
      throw new Error("The sponsor service returned an invalid response.");
    }
    return result.sponsors;
  }

  useEffect(() => {
    let active = true;
    fetchSponsors()
      .then((loadedSponsors) => {
        if (active) setSponsors(loadedSponsors);
      })
      .catch((cause: unknown) => {
        console.error("Could not load sponsor directory.", cause);
        if (active) setError(cause instanceof Error ? cause.message : "Could not load sponsors.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  function beginEdit(sponsor: ManagedSponsor) {
    setEditingId(sponsor.id);
    setForm({
      name: sponsor.name,
      category: sponsor.category,
      summary: sponsor.summary,
      details: sponsor.details,
      website: sponsor.website,
      logoUrl: sponsor.logoUrl,
      links: sponsor.links.length
        ? sponsor.links
        : sponsor.website ? [{ label: "Website", url: sponsor.website }] : [],
      isWebsiteSponsor: sponsor.isWebsiteSponsor,
    });
    setError("");
    setMessage("");
  }

  function resetForm() {
    setEditingId("");
    setForm(emptySponsor);
  }

  async function uploadLogo(file: File | undefined) {
    if (!file) return;
    setUploadingLogo(true);
    setError("");
    setMessage("");
    try {
      const formData = new FormData();
      formData.set("logo", file);
      const response = await fetch("/api/admin/sponsors/logo", {
        method: "POST",
        body: formData,
      });
      const result = await readResponse(response);
      if (!response.ok) throw new Error(errorMessage(result, "Could not upload the sponsor logo."));
      if (!result || typeof result !== "object" || !("logoUrl" in result) ||
          typeof result.logoUrl !== "string") {
        throw new Error("The logo upload returned an invalid response.");
      }
      const logoUrl = result.logoUrl;
      setForm((current) => ({ ...current, logoUrl }));
    } catch (cause) {
      console.error("Could not upload the sponsor logo.", cause);
      setError(cause instanceof Error ? cause.message : "Could not upload the sponsor logo.");
    } finally {
      setUploadingLogo(false);
    }
  }

  async function saveSponsor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(
        editingId ? `/api/admin/sponsors/${encodeURIComponent(editingId)}` : "/api/admin/sponsors",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...form,
            website: form.links.find((link) => link.label.trim().toLowerCase() === "website")?.url ?? "",
          }),
        },
      );
      const result = await readResponse(response);
      if (!response.ok) throw new Error(errorMessage(result, "Could not save sponsor details."));
      if (!result || typeof result !== "object" || !("sponsor" in result) || !isSponsor(result.sponsor)) {
        throw new Error("The saved sponsor returned an invalid response.");
      }
      const saved = result.sponsor;
      setSponsors((current) => editingId
        ? current.map((item) => item.id === saved.id ? saved : item).sort((a, b) => a.name.localeCompare(b.name))
        : [...current, saved].sort((a, b) => a.name.localeCompare(b.name)));
      setMessage(editingId ? "Sponsor details updated." : "Sponsor added.");
      resetForm();
    } catch (cause) {
      console.error("Could not save sponsor.", cause);
      setError(cause instanceof Error ? cause.message : "Could not save sponsor details.");
    } finally {
      setSaving(false);
    }
  }

  async function removeSponsor(sponsor: ManagedSponsor) {
    if (!window.confirm(`Delete ${sponsor.name}? Sponsors linked to events cannot be deleted.`)) return;
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/admin/sponsors/${encodeURIComponent(sponsor.id)}`, { method: "DELETE" });
      const result = await readResponse(response);
      if (!response.ok) throw new Error(errorMessage(result, "Could not delete sponsor."));
      setSponsors((current) => current.filter((item) => item.id !== sponsor.id));
      if (editingId === sponsor.id) resetForm();
      setMessage(`${sponsor.name} deleted.`);
    } catch (cause) {
      console.error("Could not delete sponsor.", cause);
      setError(cause instanceof Error ? cause.message : "Could not delete sponsor.");
    }
  }

  return (
    <section aria-labelledby="sponsors-admin-heading" className="space-y-6">
      <header>
        <p className="text-[9px] uppercase tracking-[0.2em] text-[#a79a7d]">Website & events</p>
        <h1 className="mt-1 font-[var(--font-display)] text-3xl text-[#fff5d9] sm:text-4xl" id="sponsors-admin-heading">
          Sponsors
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#827864]">
          Add sponsor details once, choose which sponsors appear on the website, and attach them to individual events.
        </p>
      </header>

      {(error || message) && (
        <p className={`rounded-xl border p-3 text-sm ${error ? "border-red-400/30 bg-red-950/30 text-red-200" : "border-emerald-400/20 bg-emerald-950/20 text-emerald-100"}`} role={error ? "alert" : "status"}>
          {error || message}
        </p>
      )}

      <form className="grid gap-4 rounded-2xl border border-white/[0.07] bg-[#10100f] p-4 sm:grid-cols-2 sm:p-6" onSubmit={saveSponsor}>
        <div className="sm:col-span-2">
          <h2 className="font-[var(--font-display)] text-2xl text-[#f7ebc0]">{editingId ? "Edit sponsor" : "Add a sponsor"}</h2>
          <p className="mt-1 text-xs text-[#827864]">Sponsors can be linked to events whether or not they appear on the website directory.</p>
        </div>
        <label className="text-xs text-[#cbbd9f]">
          Sponsor name
          <input className={inputClass} maxLength={120} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required value={form.name} />
        </label>
        <label className="text-xs text-[#cbbd9f]">
          Category
          <input className={inputClass} maxLength={80} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} placeholder="Community partner, venue..." value={form.category} />
        </label>
        <label className="text-xs text-[#cbbd9f] sm:col-span-2">
          Short description
          <input className={inputClass} maxLength={300} onChange={(event) => setForm((current) => ({ ...current, summary: event.target.value }))} value={form.summary} />
        </label>
        <label className="text-xs text-[#cbbd9f] sm:col-span-2">
          Details
          <textarea className={`${inputClass} min-h-24 resize-y py-3`} maxLength={3000} onChange={(event) => setForm((current) => ({ ...current, details: event.target.value }))} value={form.details} />
        </label>
        <fieldset className="sm:col-span-2">
          <legend className="text-xs font-medium text-[#cbbd9f]">Sponsor links</legend>
          <p className="mt-1 text-xs text-[#827864]">Add a website, Instagram, YouTube, or any other public link.</p>
          <div className="mt-3 space-y-3">
            {form.links.map((link, index) => (
              <div className="grid gap-2 sm:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)_auto]" key={index}>
                <label className="text-[10px] text-[#a99b7e]">
                  Link name
                  <input
                    className={inputClass}
                    maxLength={50}
                    onChange={(event) => setForm((current) => ({
                      ...current,
                      links: current.links.map((item, linkIndex) =>
                        linkIndex === index ? { ...item, label: event.target.value } : item,
                      ),
                    }))}
                    placeholder="Website, Instagram..."
                    required
                    value={link.label}
                  />
                </label>
                <label className="text-[10px] text-[#a99b7e]">
                  Link URL
                  <input
                    className={inputClass}
                    maxLength={500}
                    onChange={(event) => setForm((current) => ({
                      ...current,
                      links: current.links.map((item, linkIndex) =>
                        linkIndex === index ? { ...item, url: event.target.value } : item,
                      ),
                    }))}
                    placeholder="https://..."
                    required
                    type="url"
                    value={link.url}
                  />
                </label>
                <button
                  aria-label={`Remove sponsor link ${index + 1}`}
                  className="mt-5 min-h-11 rounded-xl border border-white/[0.09] px-3 text-xs text-[#b9ab8c] hover:border-red-400/40 hover:text-red-200"
                  onClick={() => setForm((current) => ({
                    ...current,
                    links: current.links.filter((_, linkIndex) => linkIndex !== index),
                  }))}
                  type="button"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <button
            className="mt-3 min-h-10 rounded-xl border border-[#d9af57]/30 px-3 text-xs text-[#f0ddab] transition hover:border-[#d9af57]/60 disabled:opacity-50"
            disabled={form.links.length >= 20}
            onClick={() => setForm((current) => ({
              ...current,
              links: [...current.links, { label: "", url: "" }],
            }))}
            type="button"
          >
            + Add a link
          </button>
        </fieldset>
        <div className="sm:col-span-2">
          <label className="text-xs text-[#cbbd9f]" htmlFor="sponsor-logo">Sponsor logo</label>
          <p className="mt-1 text-xs text-[#827864]">Upload a JPEG, PNG, or WebP logo smaller than 5 MB.</p>
          <input
            accept="image/jpeg,image/png,image/webp"
            className={`${inputClass} file:mr-3 file:rounded-lg file:border-0 file:bg-[#d9af57] file:px-3 file:py-2 file:text-xs file:font-semibold file:text-[#121212]`}
            disabled={uploadingLogo}
            id="sponsor-logo"
            onChange={(event) => void uploadLogo(event.target.files?.[0])}
            type="file"
          />
          {uploadingLogo && <p className="mt-2 text-xs text-[#b9ab8c]" role="status">Uploading logo...</p>}
          {form.logoUrl && (
            <div className="mt-3 flex items-center gap-3">
              <Image
                alt={`${form.name || "Sponsor"} logo preview`}
                className="h-16 w-16 rounded-xl border border-white/[0.08] bg-white object-contain p-1"
                height={64}
                src={form.logoUrl}
                unoptimized
                width={64}
              />
              <button
                className="min-h-10 rounded-xl border border-white/[0.09] px-3 text-xs text-[#b9ab8c] hover:border-red-400/40 hover:text-red-200"
                onClick={() => setForm((current) => ({ ...current, logoUrl: "" }))}
                type="button"
              >
                Remove logo
              </button>
            </div>
          )}
        </div>
        <label className="flex min-h-11 items-center gap-3 text-xs text-[#cbbd9f] sm:col-span-2">
          <input checked={form.isWebsiteSponsor} className="h-4 w-4 accent-[#d9af57]" onChange={(event) => setForm((current) => ({ ...current, isWebsiteSponsor: event.target.checked }))} type="checkbox" />
          Show on the public website sponsor directory
        </label>
        <div className="flex flex-wrap gap-2 border-t border-white/[0.06] pt-4 sm:col-span-2">
          <button className="min-h-11 rounded-xl bg-[#d9af57] px-5 text-xs font-semibold text-[#121212] transition hover:bg-[#f2d98b] disabled:opacity-60" disabled={saving || uploadingLogo} type="submit">
            {uploadingLogo ? "Uploading logo..." : saving ? "Saving..." : editingId ? "Save sponsor" : "Add sponsor"}
          </button>
          {editingId && (
            <button className="min-h-11 rounded-xl border border-white/[0.09] px-4 text-xs text-[#b9ab8c] hover:border-white/20" onClick={resetForm} type="button">
              Cancel edit
            </button>
          )}
        </div>
      </form>

      <section aria-label="Managed sponsors" className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <h2 className="font-[var(--font-display)] text-2xl text-[#fff5d9]">Managed sponsors</h2>
          <span className="text-xs text-[#827864]">{sponsors.length} total</span>
        </div>
        {loading ? (
          <p className="rounded-2xl border border-white/[0.07] bg-[#10100f] p-5 text-sm text-[#a99b7e]" role="status">Loading sponsors...</p>
        ) : sponsors.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/[0.1] bg-[#10100f] p-6 text-sm text-[#827864]">No sponsors have been added yet.</p>
        ) : (
          <div className="max-h-[65vh] space-y-3 overflow-y-auto overscroll-contain pr-1">
            {sponsors.map((sponsor) => (
              <article className="flex min-w-0 flex-col gap-4 rounded-2xl border border-white/[0.07] bg-[#10100f] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5" key={sponsor.id}>
                <div className="flex min-w-0 items-center gap-3">
                  {sponsor.logoUrl ? (
                    <Image alt={`${sponsor.name} logo`} className="h-12 w-12 shrink-0 rounded-xl border border-white/[0.08] bg-white object-contain p-1" height={48} loading="lazy" src={sponsor.logoUrl} unoptimized width={48} />
                  ) : (
                    <span aria-hidden="true" className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-[#d9af57]/20 bg-[#d9af57]/[0.07] font-[var(--font-display)] text-xl text-[#edcf81]">
                      {sponsor.name.trim().charAt(0).toUpperCase()}
                    </span>
                  )}
                  <div className="min-w-0">
                    <h3 className="break-words text-sm font-medium text-[#f0e6ce]">{sponsor.name}</h3>
                    <p className="mt-1 break-words text-xs text-[#827864]">{sponsor.category || "Sponsor"}{sponsor.isWebsiteSponsor ? " · Public website" : " · Event use"}</p>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#a99b7e]">{sponsor.summary}</p>
                  </div>
                </div>
                <div className="flex shrink-0 gap-2 border-t border-white/[0.06] pt-3 sm:border-0 sm:pt-0">
                  <button className="min-h-9 rounded-lg border border-white/[0.1] px-3 text-xs text-[#d8c8a2] hover:border-[#d9af57]/40" onClick={() => beginEdit(sponsor)} type="button">Edit</button>
                  <button className="min-h-9 rounded-lg border border-red-300/20 px-3 text-xs text-red-200 hover:border-red-300/50" onClick={() => void removeSponsor(sponsor)} type="button">Delete</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
      <AdminSponsorInquiries />
    </section>
  );
}
