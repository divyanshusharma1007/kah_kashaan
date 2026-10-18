"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { ArtistSkill } from "@/services/artist-skills";

const emptySkill = { name: "", description: "" };

function isArtistSkill(value: unknown): value is ArtistSkill {
  if (!value || typeof value !== "object") return false;
  const skill = value as Partial<ArtistSkill>;
  return typeof skill.id === "string" &&
    typeof skill.name === "string" &&
    typeof skill.description === "string" &&
    typeof skill.createdAt === "string" &&
    typeof skill.updatedAt === "string";
}

async function parseResponse(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    throw new Error("The skills service returned an invalid response.");
  }
}

function getError(result: unknown, fallback: string): string {
  return result && typeof result === "object" && "error" in result && typeof result.error === "string"
    ? result.error
    : fallback;
}

export function AdminSkillsDashboard() {
  const [skills, setSkills] = useState<ArtistSkill[]>([]);
  const [draft, setDraft] = useState(emptySkill);
  const [editingId, setEditingId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/admin/skills", { cache: "no-store" })
      .then(async (response) => {
        const result = await parseResponse(response);
        if (!response.ok) throw new Error(getError(result, "Could not load skills."));
        if (!result || typeof result !== "object" || !("skills" in result) ||
            !Array.isArray(result.skills) || !result.skills.every(isArtistSkill)) {
          throw new Error("The skills service returned an invalid response.");
        }
        if (active) setSkills(result.skills);
      })
      .catch((cause: unknown) => {
        console.error("Could not load the admin skill catalogue.", cause);
        if (active) setError(cause instanceof Error ? cause.message : "Could not load skills.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(
        editingId ? `/api/admin/skills/${encodeURIComponent(editingId)}` : "/api/admin/skills",
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(draft),
        },
      );
      const result = await parseResponse(response);
      if (!response.ok) throw new Error(getError(result, "Could not save this skill."));
      if (!result || typeof result !== "object" || !("skill" in result) || !isArtistSkill(result.skill)) {
        throw new Error("The saved skill returned an invalid response.");
      }
      const saved = result.skill;
      setSkills((current) => editingId
        ? current.map((skill) => skill.id === saved.id ? saved : skill).sort((a, b) => a.name.localeCompare(b.name))
        : [...current, saved].sort((a, b) => a.name.localeCompare(b.name)));
      setDraft(emptySkill);
      setEditingId("");
      setNotice(editingId ? "Skill updated." : "Skill added.");
    } catch (cause) {
      console.error("Could not save artist skill.", cause);
      setError(cause instanceof Error ? cause.message : "Could not save this skill.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section aria-labelledby="admin-skills-heading">
      <div className="mb-6">
        <p className="text-[10px] uppercase tracking-[0.22em] text-[#a79a7d]">Artist profile catalogue</p>
        <h1 className="mt-1 font-[var(--font-display)] text-3xl text-[#fff5d9] sm:text-4xl" id="admin-skills-heading">
          Performance skills
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#a99b7e]">
          Add skills for artists to include on their profiles and events. Skills are permanent and can be edited at any time.
        </p>
      </div>

      {(error || notice) && (
        <p className={`mb-4 rounded-xl border p-3 text-sm ${error ? "border-red-400/30 bg-red-950/30 text-red-200" : "border-emerald-400/25 bg-emerald-950/20 text-emerald-200"}`} role={error ? "alert" : "status"}>
          {error || notice}
        </p>
      )}

      <form className="mb-7 rounded-2xl border border-[#d9af57]/20 bg-[#10100f] p-5 sm:p-6" onSubmit={handleSubmit}>
        <h2 className="font-[var(--font-display)] text-2xl text-[#f7ebc0]">{editingId ? "Edit skill" : "Add a skill"}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-xs text-[#cbbd9f]">
            Skill name
            <input
              className="mt-2 min-h-11 w-full rounded-xl border border-white/[0.09] bg-[#0b0b0a] px-3 text-sm text-[#fff5d9] outline-none focus:border-[#d9af57]/50"
              maxLength={80}
              onChange={(event) => setDraft((value) => ({ ...value, name: event.target.value }))}
              required
              value={draft.name}
            />
          </label>
          <label className="text-xs text-[#cbbd9f]">
            Short description
            <textarea
              className="mt-2 min-h-11 w-full rounded-xl border border-white/[0.09] bg-[#0b0b0a] px-3 py-2 text-sm text-[#fff5d9] outline-none focus:border-[#d9af57]/50"
              maxLength={400}
              minLength={8}
              onChange={(event) => setDraft((value) => ({ ...value, description: event.target.value }))}
              required
              rows={3}
              value={draft.description}
            />
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button className="min-h-11 rounded-full bg-[#d9af57] px-5 text-xs font-semibold uppercase tracking-[0.14em] text-[#121212] hover:bg-[#f2d98b] disabled:opacity-60" disabled={saving} type="submit">
            {saving ? "Saving..." : editingId ? "Save changes" : "Add skill"}
          </button>
          {editingId && (
            <button className="min-h-11 rounded-full border border-white/[0.12] px-5 text-xs text-[#cbbd9f] hover:border-white/30" onClick={() => { setEditingId(""); setDraft(emptySkill); }} type="button">
              Cancel edit
            </button>
          )}
        </div>
      </form>

      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-[var(--font-display)] text-2xl text-[#fff5d9]">Available skills</h2>
        <span className="text-xs text-[#a79a7d]">{skills.length} total</span>
      </div>
      {loading ? (
        <p className="rounded-xl border border-white/[0.07] bg-[#10100f] p-5 text-sm text-[#a99b7e]" role="status">Loading skills...</p>
      ) : skills.length === 0 ? (
        <p className="rounded-xl border border-dashed border-white/[0.12] bg-[#10100f] p-6 text-sm text-[#a99b7e]">No skills yet. Add the first skill above.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {skills.map((skill) => (
            <article className="rounded-xl border border-white/[0.07] bg-[#10100f] p-4" key={skill.id}>
              <h3 className="font-medium text-[#f0e6ce]">{skill.name}</h3>
              <p className="mt-2 text-sm leading-6 text-[#a99b7e]">{skill.description}</p>
              <div className="mt-4 flex gap-2">
                <button className="min-h-9 rounded-full border border-[#d9af57]/30 px-4 text-[10px] uppercase tracking-[0.12em] text-[#f0ddab] hover:border-[#d9af57]" onClick={() => { setEditingId(skill.id); setDraft({ name: skill.name, description: skill.description }); setError(""); setNotice(""); }} type="button">
                  Edit
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
