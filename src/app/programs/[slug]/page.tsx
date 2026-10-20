import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteLayout } from "@/components/home/site-layout";
import { getHomePageData } from "@/data/home-page-data";
import { defaultHeroContent } from "@/data/hero-content";
import { getHomepageHeroContent } from "@/services/homepage-content";

type ProgramPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ProgramPage({ params }: ProgramPageProps) {
  const [{ slug }, home, content] = await Promise.all([
    params,
    getHomePageData(),
    getHomepageHeroContent(),
  ]);
  const pageContent = content ?? defaultHeroContent;
  const program = pageContent.programs.items.find((item) => item.slug === slug);
  if (!program) notFound();

  return (
    <SiteLayout navItems={home.navItems} logo={home.logo} content={pageContent}>
      <article className="mx-auto max-w-4xl py-12 sm:py-16">
        <Link className="text-xs font-medium text-[#d9af57] transition hover:text-[#f7ebc0]" href="/programs">
          ← All programs
        </Link>
        <header className="mt-8 rounded-[2rem] border border-[#d9af57]/20 bg-[radial-gradient(circle_at_90%_5%,rgba(217,175,87,0.16),transparent_35%),linear-gradient(145deg,#17140e,#10100f)] p-6 sm:p-10 md:p-14">
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#d9af57]">{program.tag}</p>
          <h1 className="mt-4 break-words font-[var(--font-display)] text-5xl leading-[1.02] text-[#fff5d9] sm:text-6xl md:text-7xl">
            {program.title}
          </h1>
          <p className="mt-6 max-w-3xl text-base leading-8 text-[#d8c8a2] sm:text-lg">
            {program.description}
          </p>
        </header>

        <section className="mt-8 rounded-[1.5rem] border border-white/[0.07] bg-[#10100f] p-6 sm:p-9">
          <h2 className="font-[var(--font-display)] text-3xl text-[#f7ebc0]">About this program</h2>
          <p className="mt-4 whitespace-pre-line text-sm leading-8 text-[#c9bea2] sm:text-base">
            {program.body}
          </p>
          {program.details.length > 0 && (
            <div className="mt-8 border-t border-white/[0.07] pt-6">
              <h3 className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#d9af57]">What to expect</h3>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {program.details.map((detail, index) => (
                  <li className="flex gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-sm leading-6 text-[#e5d7b8]" key={`${detail}-${index}`}>
                    <span aria-hidden="true" className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#d9af57]" />
                    {detail}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link className="inline-flex min-h-12 items-center rounded-full bg-[#d9af57] px-6 text-xs font-semibold uppercase tracking-[0.16em] text-[#14120d] transition hover:bg-[#f2d98b]" href="/events">
            Explore related events
          </Link>
          <Link className="inline-flex min-h-12 items-center rounded-full border border-[#d9af57]/30 px-6 text-xs font-semibold uppercase tracking-[0.16em] text-[#f0ddab] transition hover:border-[#f2d98b]" href="/community">
            Join the circle
          </Link>
        </div>
      </article>
    </SiteLayout>
  );
}
