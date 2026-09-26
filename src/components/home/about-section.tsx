import type { AboutHighlight } from "@/data/home-page-data";

type AboutSectionProps = {
  highlights: AboutHighlight[];
};

export function AboutSection({ highlights }: AboutSectionProps) {
  return (
    <section id="about" className="py-14">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.35em] text-[#d9af57]">About us</p>
          <h2 className="mt-3 font-[var(--font-display)] text-4xl text-[#fff5d9] md:text-5xl">
            A circle for literary growth and cultural belonging.
          </h2>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {highlights.map((highlight) => (
          <div key={highlight.title} className="rounded-[1.75rem] border border-[#d9af57]/15 bg-[#111111] p-6">
            <div className="text-[10px] uppercase tracking-[0.3em] text-[#d9af57]">{highlight.title}</div>
            <p className="mt-4 text-base leading-7 text-[#d9ceb0]">{highlight.content}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
