import Image from "next/image";
import { AboutSection } from "@/components/home/about-section";
import type { AboutHighlight } from "@/data/home-page-data";
import type { PublicPageCopy } from "@/data/public-page-copy";
import { Reveal } from "@/components/home/reveal";

type AboutPageContentProps = {
  highlights: AboutHighlight[];
  copy: PublicPageCopy["aboutPage"];
  highlightsHeading: string;
  highlightsEyebrow: string;
};

export function AboutPageContent({
  highlights,
  copy,
  highlightsHeading,
  highlightsEyebrow,
}: AboutPageContentProps) {
  return (
    <>
      <section className="py-12 md:py-20">
        <Reveal className="relative overflow-hidden rounded-[2rem] border border-[#d9af57]/25 bg-[radial-gradient(circle_at_top_right,_rgba(217,175,87,0.16),_transparent_40%),linear-gradient(135deg,#17130c_0%,#101010_55%,#0a0a0a_100%)] p-7 sm:p-10 md:p-14">
          <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full border border-[#d9af57]/10" />
          <div className="pointer-events-none absolute -right-8 -top-12 h-48 w-48 rounded-full border border-[#d9af57]/10" />
          <div className="relative max-w-3xl">
            <p className="text-[10px] uppercase tracking-[0.35em] text-[#d9af57]">{copy.storyEyebrow}</p>
            <h1 className="mt-5 font-[var(--font-display)] text-5xl leading-[0.98] text-[#fff5d9] sm:text-6xl md:text-7xl">
              {copy.storyHeading}
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-[#d8c8a2] md:text-lg">
              {copy.storyDescription}
            </p>
            <p className="mt-4 text-xs uppercase tracking-[0.25em] text-[#d9af57]">
              {copy.storyTagline}
            </p>
          </div>
        </Reveal>
      </section>

      <AboutSection
        highlights={highlights}
        eyebrow={highlightsEyebrow}
        heading={highlightsHeading}
      />

      <section className="py-12">
        <Reveal>
          <div className="mb-8 max-w-2xl">
            <p className="text-[10px] uppercase tracking-[0.35em] text-[#d9af57]">{copy.workEyebrow}</p>
            <h2 className="mt-3 font-[var(--font-display)] text-4xl text-[#fff5d9] md:text-5xl">
              {copy.workHeading}
            </h2>
            <p className="mt-4 text-base leading-7 text-[#d8c8a2]">
              {copy.workDescription}
            </p>
          </div>
        </Reveal>
        <div className="grid gap-5 md:grid-cols-3">
          {copy.pillars.map((pillar, index) => (
            <Reveal key={pillar.number} delayMs={index * 100}>
              <article className="h-full rounded-[1.5rem] border border-[#d9af57]/15 bg-[#111111] p-6 transition duration-300 hover:-translate-y-1 hover:border-[#d9af57]/50">
                <div className="font-[var(--font-display)] text-3xl text-[#d9af57]">{pillar.number}</div>
                <h3 className="mt-5 font-[var(--font-display)] text-3xl text-[#f7ebc0]">{pillar.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[#d5c9a9]">{pillar.description}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="py-12">
        <Reveal>
          <div className="mb-8 max-w-2xl">
            <p className="text-[10px] uppercase tracking-[0.35em] text-[#d9af57]">{copy.teamEyebrow}</p>
            <h2 className="mt-3 font-[var(--font-display)] text-4xl text-[#fff5d9] md:text-5xl">
              {copy.teamHeading}
            </h2>
            <p className="mt-4 text-sm leading-7 text-[#d8c8a2]">
              {copy.teamDescription}
            </p>
          </div>
        </Reveal>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {copy.teamMembers.map((member, index) => (
            <Reveal key={`${member.department}-${member.name}`} delayMs={index * 90}>
              <article className="group h-full overflow-hidden rounded-[1.5rem] border border-[#d9af57]/15 bg-[#111111] transition duration-300 hover:-translate-y-1 hover:border-[#d9af57]/50 hover:shadow-[0_16px_45px_rgba(217,175,87,0.08)]">
                <div className="relative aspect-[4/3] overflow-hidden bg-[#1a1711]">
                  <Image
                    src={member.image}
                    alt={member.imageAlt}
                    fill
                    loading="lazy"
                    unoptimized
                    sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
                    className="object-cover transition duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#111111]/80 via-transparent to-transparent" />
                  <span className="absolute bottom-3 left-4 rounded-full border border-white/20 bg-black/45 px-3 py-1 text-[9px] uppercase tracking-[0.2em] text-[#fff5d9] backdrop-blur-sm">
                    {copy.teamMemberBadge}
                  </span>
                </div>
                <div className="p-5">
                  <p className="text-[9px] uppercase tracking-[0.22em] text-[#d9af57]">{member.department}</p>
                  <h3 className="mt-2 font-[var(--font-display)] text-3xl text-[#f7ebc0]">{member.name}</h3>
                  <p className="mt-1 text-xs font-medium text-[#d8c8a2]">{member.role}</p>
                  <p className="mt-4 text-sm leading-6 text-[#c9bea2]">{member.bio}</p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
