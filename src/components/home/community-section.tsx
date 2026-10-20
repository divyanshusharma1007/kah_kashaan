import type { CommunityMetric } from "@/data/home-page-data";

type CommunitySectionProps = {
  metrics: CommunityMetric[];
  eyebrow?: string;
  heading?: string;
  description?: string;
};

export function CommunitySection({
  metrics,
  eyebrow = "Why join us",
  heading = "A community of listeners, learners, and storytellers.",
  description = "Kah-Kashaan is built for artists, audiences, and curious minds who want to stay close to literature, performance, and cultural conversations that matter.",
}: CommunitySectionProps) {
  return (
    <section id="community" className="py-14">
      <div className="rounded-[1.5rem] border border-[#d9af57]/20 bg-[radial-gradient(circle_at_top,_rgba(217,175,87,0.08),_transparent_35%),#101010] p-5 sm:rounded-[2rem] sm:p-8">
        <div className="grid gap-8 md:grid-cols-[1fr_0.8fr] md:items-center">
          <div>
            <p className="text-[10px] uppercase tracking-[0.35em] text-[#d9af57]">{eyebrow}</p>
            <h2 className="mt-4 break-words font-[var(--font-display)] text-3xl text-[#fff5d9] sm:text-4xl md:text-5xl">
              {heading}
            </h2>
            <p className="mt-5 max-w-xl text-sm leading-7 text-[#d9ceb0] sm:text-base">
              {description}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {metrics.map((metric) => (
              <div key={metric.label} className="rounded-2xl border border-[#d9af57]/20 bg-[#171717] p-5">
                <div className="break-words font-[var(--font-display)] text-3xl text-[#f5d99a] sm:text-4xl">{metric.value}</div>
                <div className="mt-2 break-words text-[9px] uppercase tracking-[0.18em] text-[#d0b88d] sm:text-[10px] sm:tracking-[0.25em]">{metric.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
