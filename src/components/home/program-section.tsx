import type { ProgramCard } from "@/data/home-page-data";

type ProgramSectionProps = {
  programs: ProgramCard[];
};

export function ProgramSection({ programs }: ProgramSectionProps) {
  return (
    <section id="programs" className="py-14">
      <div className="mb-8 text-center">
        <p className="text-[10px] uppercase tracking-[0.35em] text-[#d9af57]">Programs & verticals</p>
        <h2 className="mt-3 font-[var(--font-display)] text-4xl text-[#fff5d9] md:text-5xl">
          Spaces shaped for discovery, learning, and performance.
        </h2>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {programs.map((card) => (
          <article
            key={card.title}
            className="rounded-[1.75rem] border border-[#d9af57]/20 bg-[linear-gradient(180deg,#151515_0%,#0d0d0d_100%)] p-6 transition hover:-translate-y-1 hover:border-[#f1d48d] hover:shadow-[0_0_26px_rgba(217,175,87,0.15)]"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-[10px] uppercase tracking-[0.28em] text-[#d9af57]">{card.tag}</span>
              <span className="h-2.5 w-2.5 rounded-full bg-[#d9af57] shadow-[0_0_18px_rgba(217,175,87,0.9)]" />
            </div>

            <h3 className="mt-5 font-[var(--font-display)] text-4xl text-[#f7ebc0]">{card.title}</h3>
            <p className="mt-4 text-sm leading-7 text-[#d5c9a9]">{card.description}</p>

            <ul className="mt-5 space-y-3 text-sm text-[#f3dcc0]">
              {card.details.map((detail) => (
                <li key={detail} className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-[#d9af57]" />
                  <span>{detail}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
