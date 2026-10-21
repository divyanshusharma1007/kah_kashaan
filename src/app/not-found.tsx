import Link from "next/link";
import { defaultHeroContent } from "@/data/hero-content";
import { getHomepageHeroContent } from "@/services/homepage-content";

export default async function NotFound() {
  const content = await getHomepageHeroContent() ?? defaultHeroContent;
  const copy = content.publicPages.notFound;

  return (
    <main className="grid min-h-screen place-items-center bg-[#050505] px-5 text-[#fff5d9]">
      <section className="w-full max-w-2xl rounded-[2rem] border border-[#d9af57]/25 bg-[#11100d] p-8 text-center sm:p-12">
        <p className="text-[10px] uppercase tracking-[0.35em] text-[#d9af57]">{copy.eyebrow}</p>
        <h1 className="mt-5 font-[var(--font-display)] text-4xl sm:text-6xl">{copy.heading}</h1>
        <p className="mx-auto mt-5 max-w-lg text-sm leading-7 text-[#d8c8a2]">{copy.description}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link className="inline-flex min-h-11 items-center rounded-full bg-[#d9af57] px-5 text-xs font-semibold uppercase tracking-[0.15em] text-[#14120d] transition hover:bg-[#f2d98b]" href="/">
            {copy.homeButton}
          </Link>
          <Link className="inline-flex min-h-11 items-center rounded-full border border-[#d9af57]/40 px-5 text-xs font-semibold uppercase tracking-[0.15em] text-[#f0ddab] transition hover:border-[#f2d98b]" href="/events">
            {copy.eventsButton}
          </Link>
        </div>
      </section>
    </main>
  );
}
