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
            className={`group relative flex min-h-16 items-center gap-3 rounded-xl border px-4 py-3 transition focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#d9af57] ${
              disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
            } ${
              checked
                ? "border-[#d9af57]/60 bg-[#d9af57]/[0.08]"
                : "border-white/[0.08] bg-[#0b0b0a] hover:border-[#d9af57]/35"
            }`}
            key={skill.id}
            title={skill.description}
          >
            <input
              aria-describedby={descriptionId}
              checked={checked}
              className="peer sr-only"
              disabled={disabled}
              onChange={() => toggleSkill(skill.id)}
              type="checkbox"
            />
            <span aria-hidden="true" className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border transition ${
              checked ? "border-[#d9af57] bg-[#d9af57] text-[#121212]" : "border-[#8f805f] bg-transparent text-transparent"
            }`}>
              <svg fill="none" viewBox="0 0 16 16" className="h-3.5 w-3.5">
                <path d="m3 8 3.2 3.2L13 4.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-[#f0e6ce]">{skill.name}</span>
              <span className="mt-1 block text-xs text-[#827864] sm:hidden">{skill.description}</span>
            </span>
            <span className="pointer-events-none absolute bottom-full left-3 z-20 mb-2 max-w-[calc(100%-1.5rem)] rounded-lg border border-[#d9af57]/30 bg-[#191711] px-3 py-2 text-xs leading-5 text-[#f0e6ce] opacity-0 shadow-xl transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
              {skill.description}
            </span>
            <span className="sr-only" id={descriptionId}>{skill.description}</span>
          </label>
        );
      })}
    </div>
  );
}
