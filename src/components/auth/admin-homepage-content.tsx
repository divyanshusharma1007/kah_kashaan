"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import {
  defaultHeroContent,
  type HeroContent,
  type ProgramContent,
} from "@/data/hero-content";

const inputClass =
  "mt-1.5 min-h-11 w-full rounded-xl border border-white/[0.09] bg-[#0b0b0a] px-3 text-sm text-[#fff5d9] outline-none placeholder:text-[#716954] focus:border-[#d9af57]/50";
const labelClass = "block text-xs text-[#cbbd9f]";
const sectionClass = "rounded-2xl border border-white/[0.07] bg-[#10100f] px-4 sm:px-6";

function isHeroContent(value: unknown): value is HeroContent {
  if (!value || typeof value !== "object") return false;
  const content = value as Partial<HeroContent>;
  return typeof content.headline === "string" &&
    typeof content.description === "string" &&
    Array.isArray(content.stats) &&
    content.stats.length === 4 &&
    content.stats.every((stat) =>
      stat !== null && typeof stat === "object" &&
      "value" in stat && "label" in stat &&
      typeof stat.value === "string" && typeof stat.label === "string",
    ) &&
    Boolean(content.about) && Boolean(content.programs) && Boolean(content.community) &&
    Boolean(content.featuredArtists) && Boolean(content.sponsors) && Boolean(content.socialLinks) &&
    content.footerVisibility !== undefined &&
    Object.values(content.footerVisibility).every((visible) => typeof visible === "boolean");
}

async function readResponse(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    throw new Error("The homepage content service returned an invalid response.");
  }
}

function errorMessage(value: unknown, fallback: string): string {
  return value && typeof value === "object" && "error" in value && typeof value.error === "string"
    ? value.error
    : fallback;
}

function TextField({
  label,
  value,
  onChange,
  maxLength,
  multiline = false,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
  multiline?: boolean;
  disabled?: boolean;
}) {
  return (
    <label className={labelClass}>
      {label}
      {multiline ? (
        <textarea
          className={`${inputClass} min-h-24 resize-y py-3 leading-6`}
          disabled={disabled}
          maxLength={maxLength}
          onChange={(event) => onChange(event.target.value)}
          required
          value={value}
        />
      ) : (
        <input
          className={inputClass}
          disabled={disabled}
          maxLength={maxLength}
          onChange={(event) => onChange(event.target.value)}
          required
          value={value}
        />
      )}
      <span className="mt-1 block text-[10px] text-[#716954]">{value.length}/{maxLength}</span>
    </label>
  );
}

function EditCardList({
  title,
  items,
  addLabel,
  maxItems,
  firstLabel,
  secondLabel,
  firstKey,
  secondKey,
  onChange,
  disabled,
}: {
  title: string;
  items: { title: string; content?: string; description?: string }[];
  addLabel: string;
  maxItems: number;
  firstLabel: string;
  secondLabel: string;
  firstKey: "title";
  secondKey: "content" | "description";
  onChange: (items: { title: string; content?: string; description?: string }[]) => void;
  disabled: boolean;
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-medium text-[#f0e6ce]">{title} ({items.length}/{maxItems})</h3>
        <button
          className="min-h-9 rounded-lg border border-[#d9af57]/25 px-3 text-xs text-[#edcf81] transition hover:border-[#d9af57]/50 disabled:opacity-50"
          disabled={disabled || items.length >= maxItems}
          onClick={() => onChange([...items, { title: "", [secondKey]: "" }])}
          type="button"
        >
          {addLabel}
        </button>
      </div>
      {items.map((item, index) => (
        <div className="grid gap-3 rounded-xl border border-white/[0.06] p-3 sm:grid-cols-2" key={`${index}-${item.title}`}>
          <TextField
            disabled={disabled}
            label={firstLabel}
            maxLength={120}
            onChange={(value) => onChange(items.map((current, itemIndex) =>
              itemIndex === index ? { ...current, [firstKey]: value } : current,
            ))}
            value={item.title}
          />
          <TextField
            disabled={disabled}
            label={secondLabel}
            maxLength={1200}
            multiline
            onChange={(value) => onChange(items.map((current, itemIndex) =>
              itemIndex === index ? { ...current, [secondKey]: value } : current,
            ))}
            value={item[secondKey] ?? ""}
          />
          <button
            className="min-h-9 justify-self-start rounded-lg border border-red-300/20 px-3 text-xs text-red-200 hover:border-red-300/50 sm:col-span-2"
            disabled={disabled}
            onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}
            type="button"
          >
            Remove card
          </button>
        </div>
      ))}
    </div>
  );
}

function SectionAccordion({
  title,
  description,
  children,
  defaultOpen = false,
}: {
  title: string;
  description: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details className={sectionClass} open={defaultOpen}>
      <summary className="cursor-pointer list-none py-5 [&::-webkit-details-marker]:hidden">
        <span className="flex items-center justify-between gap-4">
          <span>
            <span className="block text-sm font-semibold text-[#f0e6ce]">{title}</span>
            <span className="mt-1 block text-xs text-[#827864]">{description}</span>
          </span>
          <span aria-hidden="true" className="text-lg text-[#d9af57]">⌄</span>
        </span>
      </summary>
      <div className="space-y-4 border-t border-white/[0.07] pb-5 pt-4">{children}</div>
    </details>
  );
}

function createProgram(): ProgramContent {
  return {
    slug: "",
    title: "",
    tag: "",
    description: "",
    body: "",
    details: [],
  };
}

const footerVisibilityOptions = [
  { key: "discoverStory", label: "Discover our story" },
  { key: "discoverCommunity", label: "Discover community" },
  { key: "discoverArtists", label: "Featured artists" },
  { key: "discoverPartners", label: "Partner directory" },
  { key: "takePartPrograms", label: "Programs" },
  { key: "takePartEvents", label: "Upcoming events" },
  { key: "takePartRegister", label: "Register" },
  { key: "sponsorInquiry", label: "Become a sponsor or partner" },
  { key: "socialInstagram", label: "Instagram" },
  { key: "socialFacebook", label: "Facebook" },
  { key: "socialTwitter", label: "X / Twitter" },
  { key: "socialYoutube", label: "YouTube" },
  { key: "socialLinkedin", label: "LinkedIn" },
] as const;

export function AdminHomepageContent() {
  const [content, setContent] = useState<HeroContent>(defaultHeroContent);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/admin/homepage-content", { cache: "no-store" })
      .then(async (response) => {
        const result = await readResponse(response);
        if (!response.ok) throw new Error(errorMessage(result, "Could not load homepage content."));
        if (!result || typeof result !== "object" || !("heroContent" in result) || !isHeroContent(result.heroContent)) {
          throw new Error("The homepage content service returned an invalid response.");
        }
        if (active) setContent(result.heroContent);
      })
      .catch((cause: unknown) => {
        console.error("Could not load homepage content for editing.", cause);
        if (active) setError(cause instanceof Error ? cause.message : "Could not load homepage content.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  function updateProgram(index: number, updater: (program: ProgramContent) => ProgramContent) {
    setContent((current) => ({
      ...current,
      programs: {
        ...current.programs,
        items: current.programs.items.map((program, itemIndex) =>
          itemIndex === index ? updater(program) : program,
        ),
      },
    }));
  }

  async function saveContent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/homepage-content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(content),
      });
      const result = await readResponse(response);
      if (!response.ok) throw new Error(errorMessage(result, "Could not save homepage content."));
      if (!result || typeof result !== "object" || !("heroContent" in result) || !isHeroContent(result.heroContent)) {
        throw new Error("The saved homepage content is invalid.");
      }
      setContent(result.heroContent);
      setMessage("Website content saved.");
    } catch (cause) {
      console.error("Could not save homepage content.", cause);
      setError(cause instanceof Error ? cause.message : "Could not save homepage content.");
    } finally {
      setSaving(false);
    }
  }

  const disabled = loading || saving;
  return (
    <section aria-labelledby="homepage-content-heading" className="space-y-5">
      <header>
        <p className="text-[9px] uppercase tracking-[0.2em] text-[#a79a7d]">Public website</p>
        <h1 className="mt-1 font-[var(--font-display)] text-3xl text-[#fff5d9] sm:text-4xl" id="homepage-content-heading">
          Website content
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#827864]">
          Manage homepage sections, detailed program pages, featured artist copy, sponsor inquiries, and footer social links.
        </p>
      </header>

      {(error || message) && (
        <p className={`rounded-xl border p-3 text-sm ${error ? "border-red-400/30 bg-red-950/30 text-red-200" : "border-emerald-400/20 bg-emerald-950/20 text-emerald-100"}`} role={error ? "alert" : "status"}>
          {error || message}
        </p>
      )}
      {loading && <p className="text-xs text-[#827864]" role="status">Loading saved website content...</p>}

      <form className="space-y-3" onSubmit={saveContent}>
        <SectionAccordion defaultOpen title="Hero" description="Homepage introduction, stats and the existing Explore Events / Join The Circle buttons.">
          <TextField disabled={disabled} label="Headline" maxLength={240} multiline onChange={(value) => setContent((current) => ({ ...current, headline: value }))} value={content.headline} />
          <TextField disabled={disabled} label="Description" maxLength={1200} multiline onChange={(value) => setContent((current) => ({ ...current, description: value }))} value={content.description} />
          <div className="grid gap-3 sm:grid-cols-2">
            {content.stats.map((stat, index) => (
              <div className="rounded-xl border border-white/[0.06] p-3" key={`hero-stat-${index}`}>
                <TextField disabled={disabled} label={`Stat ${index + 1} value`} maxLength={40} onChange={(value) => setContent((current) => ({ ...current, stats: current.stats.map((item, itemIndex) => itemIndex === index ? { ...item, value } : item) }))} value={stat.value} />
                <TextField disabled={disabled} label={`Stat ${index + 1} label`} maxLength={80} onChange={(value) => setContent((current) => ({ ...current, stats: current.stats.map((item, itemIndex) => itemIndex === index ? { ...item, label: value } : item) }))} value={stat.label} />
              </div>
            ))}
          </div>
        </SectionAccordion>

        <SectionAccordion title="About us" description="Homepage About heading and mission/community/impact cards.">
          <TextField disabled={disabled} label="Eyebrow" maxLength={80} onChange={(value) => setContent((current) => ({ ...current, about: { ...current.about, eyebrow: value } }))} value={content.about.eyebrow} />
          <TextField disabled={disabled} label="Heading" maxLength={240} multiline onChange={(value) => setContent((current) => ({ ...current, about: { ...current.about, heading: value } }))} value={content.about.heading} />
          <EditCardList
            addLabel="Add about card"
            disabled={disabled}
            firstKey="title"
            firstLabel="Card heading"
            items={content.about.highlights}
            maxItems={10}
            onChange={(highlights) => setContent((current) => ({ ...current, about: { ...current.about, highlights: highlights.map((item) => ({ title: item.title, content: item.content ?? "" })) } }))}
            secondKey="content"
            secondLabel="Card description"
            title="About cards"
          />
        </SectionAccordion>

        <SectionAccordion title="Programs" description="Manage the homepage cards, navigation links and full dedicated program pages.">
          <TextField disabled={disabled} label="Eyebrow" maxLength={80} onChange={(value) => setContent((current) => ({ ...current, programs: { ...current.programs, eyebrow: value } }))} value={content.programs.eyebrow} />
          <TextField disabled={disabled} label="Section heading" maxLength={240} multiline onChange={(value) => setContent((current) => ({ ...current, programs: { ...current.programs, heading: value } }))} value={content.programs.heading} />
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-medium text-[#f0e6ce]">Programs ({content.programs.items.length}/30)</h3>
            <button className="min-h-9 rounded-lg border border-[#d9af57]/25 px-3 text-xs text-[#edcf81] disabled:opacity-50" disabled={disabled || content.programs.items.length >= 30} onClick={() => setContent((current) => ({ ...current, programs: { ...current.programs, items: [...current.programs.items, createProgram()] } }))} type="button">Add program</button>
          </div>
          {content.programs.items.map((program, index) => (
            <fieldset className="space-y-3 rounded-xl border border-white/[0.06] p-3 sm:p-4" key={`${program.slug}-${index}`}>
              <legend className="px-2 text-xs text-[#edcf81]">{program.title || `New program ${index + 1}`}</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                <TextField disabled={disabled} label="Program title" maxLength={120} onChange={(title) => updateProgram(index, (item) => ({ ...item, title, slug: title.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") }))} value={program.title} />
                <TextField disabled={disabled} label="Category / tag" maxLength={100} onChange={(tag) => updateProgram(index, (item) => ({ ...item, tag }))} value={program.tag} />
                <TextField disabled={disabled} label="URL slug" maxLength={80} onChange={(slug) => updateProgram(index, (item) => ({ ...item, slug: slug.toLowerCase().trim().replace(/[^a-z0-9-]+/g, "-").replace(/--+/g, "-").replace(/^-|-$/g, "") }))} value={program.slug} />
                <TextField disabled={disabled} label="Card summary" maxLength={500} multiline onChange={(description) => updateProgram(index, (item) => ({ ...item, description }))} value={program.description} />
                <div className="sm:col-span-2">
                  <TextField disabled={disabled} label="Full program description" maxLength={5000} multiline onChange={(body) => updateProgram(index, (item) => ({ ...item, body }))} value={program.body} />
                </div>
                <label className={labelClass}>
                  Program details / pointers (one per line)
                  <textarea className={`${inputClass} min-h-28 resize-y py-3`} disabled={disabled} maxLength={4000} onChange={(event) => updateProgram(index, (item) => ({ ...item, details: event.target.value.split("\n").map((line) => line.trim()).filter(Boolean).slice(0, 20) }))} value={program.details.join("\n")} />
                </label>
              </div>
              <button className="min-h-9 rounded-lg border border-red-300/20 px-3 text-xs text-red-200 hover:border-red-300/50" disabled={disabled} onClick={() => setContent((current) => ({ ...current, programs: { ...current.programs, items: current.programs.items.filter((_, itemIndex) => itemIndex !== index) } }))} type="button">Remove program</button>
            </fieldset>
          ))}
        </SectionAccordion>

        <SectionAccordion title="Why join us" description="Edit the section copy and create up to ten statistic boxes.">
          <TextField disabled={disabled} label="Eyebrow" maxLength={80} onChange={(value) => setContent((current) => ({ ...current, community: { ...current.community, eyebrow: value } }))} value={content.community.eyebrow} />
          <TextField disabled={disabled} label="Heading" maxLength={240} multiline onChange={(value) => setContent((current) => ({ ...current, community: { ...current.community, heading: value } }))} value={content.community.heading} />
          <TextField disabled={disabled} label="Description" maxLength={1200} multiline onChange={(value) => setContent((current) => ({ ...current, community: { ...current.community, description: value } }))} value={content.community.description} />
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-medium text-[#f0e6ce]">Why join boxes ({content.community.metrics.length}/10)</h3>
              <button className="min-h-9 rounded-lg border border-[#d9af57]/25 px-3 text-xs text-[#edcf81] disabled:opacity-50" disabled={disabled || content.community.metrics.length >= 10} onClick={() => setContent((current) => ({ ...current, community: { ...current.community, metrics: [...current.community.metrics, { value: "", label: "" }] } }))} type="button">Add box</button>
            </div>
            {content.community.metrics.map((metric, index) => (
              <div className="grid gap-3 rounded-xl border border-white/[0.06] p-3 sm:grid-cols-2" key={`community-${index}`}>
                <TextField disabled={disabled} label="Box value" maxLength={40} onChange={(value) => setContent((current) => ({ ...current, community: { ...current.community, metrics: current.community.metrics.map((item, itemIndex) => itemIndex === index ? { ...item, value } : item) } }))} value={metric.value} />
                <TextField disabled={disabled} label="Box label" maxLength={80} onChange={(label) => setContent((current) => ({ ...current, community: { ...current.community, metrics: current.community.metrics.map((item, itemIndex) => itemIndex === index ? { ...item, label } : item) } }))} value={metric.label} />
                <button className="min-h-9 justify-self-start rounded-lg border border-red-300/20 px-3 text-xs text-red-200 sm:col-span-2" disabled={disabled} onClick={() => setContent((current) => ({ ...current, community: { ...current.community, metrics: current.community.metrics.filter((_, itemIndex) => itemIndex !== index) } }))} type="button">Remove box</button>
              </div>
            ))}
          </div>
        </SectionAccordion>

        <SectionAccordion title="Featured artists" description="Edit the featured artist section introduction and manage which artists appear.">
          <TextField disabled={disabled} label="Eyebrow" maxLength={80} onChange={(value) => setContent((current) => ({ ...current, featuredArtists: { ...current.featuredArtists, eyebrow: value } }))} value={content.featuredArtists.eyebrow} />
          <TextField disabled={disabled} label="Heading" maxLength={240} onChange={(value) => setContent((current) => ({ ...current, featuredArtists: { ...current.featuredArtists, heading: value } }))} value={content.featuredArtists.heading} />
          <TextField disabled={disabled} label="Description" maxLength={1200} multiline onChange={(value) => setContent((current) => ({ ...current, featuredArtists: { ...current.featuredArtists, description: value } }))} value={content.featuredArtists.description} />
          <Link className="inline-flex min-h-10 items-center rounded-lg border border-[#d9af57]/25 px-4 text-xs text-[#edcf81] hover:border-[#d9af57]/50" href="/dashboard/artists">Manage featured artist profiles</Link>
        </SectionAccordion>

        <SectionAccordion title="Sponsors & collaborators" description="Manage the homepage pitch and benefit cards. New sponsors can send an inquiry through the public form.">
          <TextField disabled={disabled} label="Eyebrow" maxLength={80} onChange={(value) => setContent((current) => ({ ...current, sponsors: { ...current.sponsors, eyebrow: value } }))} value={content.sponsors.eyebrow} />
          <TextField disabled={disabled} label="Heading" maxLength={240} multiline onChange={(value) => setContent((current) => ({ ...current, sponsors: { ...current.sponsors, heading: value } }))} value={content.sponsors.heading} />
          <TextField disabled={disabled} label="Description" maxLength={1200} multiline onChange={(value) => setContent((current) => ({ ...current, sponsors: { ...current.sponsors, description: value } }))} value={content.sponsors.description} />
          <TextField disabled={disabled} label="Inquiry button label" maxLength={100} onChange={(value) => setContent((current) => ({ ...current, sponsors: { ...current.sponsors, buttonLabel: value } }))} value={content.sponsors.buttonLabel} />
          <EditCardList
            addLabel="Add benefit"
            disabled={disabled}
            firstKey="title"
            firstLabel="Benefit heading"
            items={content.sponsors.benefits}
            maxItems={10}
            onChange={(benefits) => setContent((current) => ({ ...current, sponsors: { ...current.sponsors, benefits: benefits.map((item) => ({ title: item.title, description: item.description ?? "" })) } }))}
            secondKey="description"
            secondLabel="Benefit description"
            title="Sponsor benefits"
          />
        </SectionAccordion>

        <SectionAccordion title="Footer links & social profiles" description="Set social URLs and choose which footer links visitors can see.">
          {(["instagram", "facebook", "twitter", "youtube", "linkedin"] as const).map((network) => (
            <label className={labelClass} key={network}>
              {network === "twitter" ? "X / Twitter" : network[0].toUpperCase() + network.slice(1)}
              <input className={inputClass} disabled={disabled} maxLength={500} onChange={(event) => setContent((current) => ({ ...current, socialLinks: { ...current.socialLinks, [network]: event.target.value } }))} placeholder="https://..." type="url" value={content.socialLinks[network]} />
            </label>
          ))}
          <fieldset className="space-y-3 border-t border-white/[0.07] pt-4">
            <legend className="px-1 text-sm font-medium text-[#f0e6ce]">Visible footer links</legend>
            <p className="text-xs text-[#827864]">Turn off any link to hide it from the public footer. Empty social URLs are not shown.</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {footerVisibilityOptions.map(({ key, label }) => (
                <label className="flex min-h-11 items-center gap-3 rounded-xl border border-white/[0.06] px-3 text-xs text-[#cbbd9f]" key={key}>
                  <input
                    checked={content.footerVisibility[key]}
                    className="h-4 w-4 accent-[#d9af57]"
                    disabled={disabled}
                    onChange={(event) => setContent((current) => ({
                      ...current,
                      footerVisibility: {
                        ...current.footerVisibility,
                        [key]: event.target.checked,
                      },
                    }))}
                    type="checkbox"
                  />
                  Show {label}
                </label>
              ))}
            </div>
          </fieldset>
        </SectionAccordion>

        <button className="min-h-11 rounded-xl bg-[#d9af57] px-5 text-xs font-semibold text-[#121212] transition hover:bg-[#f2d98b] disabled:cursor-not-allowed disabled:opacity-60" disabled={disabled} type="submit">
          {loading ? "Loading..." : saving ? "Saving..." : "Save all website content"}
        </button>
      </form>
    </section>
  );
}
