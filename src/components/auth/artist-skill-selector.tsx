"use client";

import type { ArtistSkill } from "@/services/artist-skills";

export function ArtistSkillSelector({
  skills,
  selectedIds,
  onChange,
  idPrefix,
  disabledIds = [],
}: {
  skills: ArtistSkill[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  idPrefix: string;
  disabledIds?: string[];
}) {
  function toggleSkill(id: string) {
    onChange(selectedIds.includes(id)
      ? selectedIds.filter((selectedId) => selectedId !== id)
      : [...selectedIds, id]);
  }

  if (skills.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-white/[0.1] p-4 text-sm text-[#a99b7e]">
        Performance skills will appear here when they are added by the event team.
      </p>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {skills.map((skill) => {
        const checked = selectedIds.includes(skill.id);
        const disabled = disabledIds.includes(skill.id);
        const descriptionId = `${idPrefix}-skill-description-${skill.id}`;
        return (
          <label
            className={`group flex min-h-20 items-start gap-3 rounded-xl border px-4 py-4 transition duration-200 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#f0cf75] ${
              disabled ? "cursor-not-allowed opacity-55" : "cursor-pointer hover:-translate-y-0.5 hover:border-[#d9af57]/55 hover:bg-[#17150f]"
            } ${
              checked
                ? "border-[#d9af57]/65 bg-[#d9af57]/[0.09] shadow-[inset_0_0_0_1px_rgba(217,175,87,0.08)]"
                : "border-white/[0.1] bg-[#0d0d0c]"
            }`}
            key={skill.id}
          >
            <input
              aria-describedby={descriptionId}
              checked={checked}
              className="peer sr-only"
              disabled={disabled}
              onChange={() => toggleSkill(skill.id)}
              type="checkbox"
            />
            <span aria-hidden="true" className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md border transition ${
              checked
                ? "border-[#f0cf75] bg-[#e0b858] text-[#15130e] shadow-[0_0_14px_rgba(217,175,87,0.2)]"
                : "border-[#9b8c6d] bg-[#090909] text-transparent group-hover:border-[#e1bd68]"
            }`}>
              <svg fill="none" viewBox="0 0 16 16" className="h-3.5 w-3.5">
                <path d="m3 8 3.2 3.2L13 4.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold leading-5 text-[#fff5d9]">{skill.name}</span>
              <span className="mt-1.5 block text-xs leading-5 text-[#c3b89f]" id={descriptionId}>
                {skill.description || "Add this skill to your artist profile."}
              </span>
            </span>
          </label>
        );
      })}
    </div>
  );
}
