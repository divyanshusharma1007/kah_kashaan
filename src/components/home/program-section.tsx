import type { ProgramCard } from "@/data/home-page-data";
import Link from "next/link";

type ProgramSectionProps = {
  programs: ProgramCard[];
  eyebrow: string;
  heading: string;
  exploreLabel: string;
  emptyMessage: string;
};

export function ProgramSection({
  programs,
  eyebrow,
  heading,
  exploreLabel,
  emptyMessage,
}: ProgramSectionProps) {
  return (
    <section id="programs" className="py-14">
      <div className="mb-8 text-center">
        <p className="text-[10px] uppercase tracking-[0.35em] text-[#d9af57]">{eyebrow}</p>
        <h2 className="mx-auto mt-3 max-w-4xl break-words font-[var(--font-display)] text-3xl text-[#fff5d9] sm:text-4xl md:text-5xl">
          {heading}
        </h2>
      </div>

      {programs.length === 0 ? (
        <p className="rounded-2xl border border-white/[0.08] bg-[#10100f] p-6 text-center text-sm text-[#a99b7e]">
          {emptyMessage}
        </p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {programs.map((card) => (
            <Link
              key={card.title}
              href={`/programs/${encodeURIComponent(card.slug)}`}
              className="rounded-[1.75rem] border border-[#d9af57]/20 bg-[linear-gradient(180deg,#151515_0%,#0d0d0d_100%)] p-6 transition hover:-translate-y-1 hover:border-[#f1d48d] hover:shadow-[0_0_26px_rgba(217,175,87,0.15)]"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="text-[9px] uppercase tracking-[0.2em] text-[#d9af57] sm:text-[10px] sm:tracking-[0.28em]">{card.tag}</span>
                <span className="h-2.5 w-2.5 rounded-full bg-[#d9af57] shadow-[0_0_18px_rgba(217,175,87,0.9)]" />
              </div>

              <h3 className="mt-5 break-words font-[var(--font-display)] text-3xl text-[#f7ebc0] sm:text-4xl">{card.title}</h3>
              <p className="mt-4 text-sm leading-7 text-[#d5c9a9]">{card.description}</p>

              <ul className="mt-5 space-y-3 text-sm text-[#f3dcc0]">
                {card.details.map((detail) => (
                  <li key={detail} className="flex items-center gap-3">
                    <span className="h-2 w-2 rounded-full bg-[#d9af57]" />
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
              <span className="mt-6 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#d9af57]">
                {exploreLabel} <span aria-hidden="true">→</span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
