import type { ProgramCard } from "@/data/home-page-data";

export type ProgramCategory = {
  slug: string;
  label: string;
  programs: ProgramCard[];
};

export function normalizeProgramCategorySlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getProgramCategories(programs: ProgramCard[]): ProgramCategory[] {
  const grouped = new Map<string, ProgramCategory>();

  for (const program of programs) {
    const label = program.tag?.trim() || "Programs";
    const slug = normalizeProgramCategorySlug(label);
    const existing = grouped.get(slug);

    if (existing) {
      existing.programs.push(program);
      continue;
    }

    grouped.set(slug, {
      slug,
      label,
      programs: [program],
    });
  }

  return Array.from(grouped.values()).sort((left, right) => left.label.localeCompare(right.label));
}

export function findProgramCategory(programs: ProgramCard[], slug: string) {
  const targetSlug = normalizeProgramCategorySlug(slug);
  return getProgramCategories(programs).find((category) => category.slug === targetSlug);
}
