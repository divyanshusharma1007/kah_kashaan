import type { CommunityMetric } from "@/data/home-page-data";

type CommunitySectionProps = {
  metrics: CommunityMetric[];
};

export function CommunitySection({ metrics }: CommunitySectionProps) {
  return (
    <section id="community" className="py-14">
      <div className="rounded-[2rem] border border-[#d9af57]/20 bg-[radial-gradient(circle_at_top,_rgba(217,175,87,0.08),_transparent_35%),#101010] p-8">
        <div className="grid gap-8 md:grid-cols-[1fr_0.8fr] md:items-center">
          <div>
            <p className="text-[10px] uppercase tracking-[0.35em] text-[#d9af57]">Why join us</p>
            <h2 className="mt-4 font-[var(--font-display)] text-4xl text-[#fff5d9] md:text-5xl">
              A community of listeners, learners, and storytellers.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-[#d9ceb0]">
              Kah-Kashaan is built for artists, audiences, and curious minds who want to stay close to literature, performance, and cultural conversations that matter.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {metrics.map((metric) => (
              <div key={metric.label} className="rounded-2xl border border-[#d9af57]/20 bg-[#171717] p-5">
                <div className="font-[var(--font-display)] text-4xl text-[#f5d99a]">{metric.value}</div>
                <div className="mt-2 text-[10px] uppercase tracking-[0.25em] text-[#d0b88d]">{metric.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
