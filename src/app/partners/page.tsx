import { connection } from "next/server";
import Image from "next/image";
import Link from "next/link";
import { SiteLayout } from "@/components/home/site-layout";
import { getHomePageData } from "@/data/home-page-data";
import { listWebsiteSponsors } from "@/services/sponsors";
import { getHomepageHeroContent } from "@/services/homepage-content";
import { defaultHeroContent } from "@/data/hero-content";

export default async function PartnersPage() {
  await connection();
  const [{ navItems, logo }, sponsors, content] = await Promise.all([
    getHomePageData(),
    listWebsiteSponsors(),
    getHomepageHeroContent(),
  ]);
  const copy = (content ?? defaultHeroContent).publicPages.partnersPage;

  return (
    <SiteLayout navItems={navItems} logo={logo} content={content ?? undefined}>
      <section className="py-10 sm:py-14">
        <div className="mb-8 max-w-3xl">
          <p className="text-[10px] uppercase tracking-[0.35em] text-[#d9af57]">{copy.eyebrow}</p>
          <h1 className="mt-4 font-[var(--font-display)] text-4xl text-[#fff5d9] sm:text-5xl md:text-6xl">
            {copy.heading}
          </h1>
          <p className="mt-4 text-sm leading-7 text-[#d8c8a2] sm:text-base">
            {copy.description}
          </p>
          <Link className="mt-5 inline-flex min-h-11 items-center rounded-full bg-[#d9af57] px-5 text-xs font-semibold uppercase tracking-[0.15em] text-[#14120d] transition hover:bg-[#f2d98b]" href="/partners/inquire">
            {copy.inquiryButton} <span aria-hidden="true" className="ml-2">↗</span>
          </Link>
        </div>

        {sponsors?.length ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {sponsors.map((sponsor) => (
              <article className="min-w-0 rounded-[1.5rem] border border-[#d9af57]/20 bg-[#111111] p-5 transition duration-300 hover:-translate-y-1 hover:border-[#d9af57]/50 sm:p-6" key={sponsor.id}>
                {sponsor.logoUrl ? (
                  <Image alt={`${sponsor.name} logo`} className="h-16 w-16 rounded-2xl bg-white object-contain p-2" height={64} loading="lazy" src={sponsor.logoUrl} unoptimized width={64} />
                ) : (
                  <span aria-hidden="true" className="grid h-16 w-16 place-items-center rounded-2xl border border-[#d9af57]/30 bg-[#1b1710] font-[var(--font-display)] text-2xl text-[#f5d99a]">
                    {sponsor.name.trim().charAt(0).toUpperCase()}
                  </span>
                )}
                <p className="mt-5 text-[9px] uppercase tracking-[0.24em] text-[#d9af57]">{sponsor.category || copy.defaultCategory}</p>
                <h2 className="mt-2 break-words font-[var(--font-display)] text-3xl text-[#f7ebc0]">{sponsor.name}</h2>
                <p className="mt-3 text-sm leading-6 text-[#c9bea2]">{sponsor.summary || sponsor.details}</p>
                {sponsor.links.length > 0 && (
                  <div aria-label={`${sponsor.name} links`} className="mt-4 flex flex-wrap gap-2">
                    {sponsor.links.slice(0, 4).map((link) => (
                      <a
                        className="rounded-full border border-white/[0.1] px-2.5 py-1 text-[10px] text-[#d8c8a2] transition hover:border-[#d9af57]/40 hover:text-[#fff5d9]"
                        href={link.url}
                        key={`${link.label}-${link.url}`}
                        rel="noreferrer"
                        target="_blank"
                      >
                        {link.label}
                      </a>
                    ))}
                    {sponsor.links.length > 4 && (
                      <span className="self-center text-[10px] text-[#827864]">+{sponsor.links.length - 4} more on profile</span>
                    )}
                  </div>
                )}
                <Link className="mt-5 inline-flex min-h-10 items-center text-xs font-medium text-[#e7d7aa] underline underline-offset-4 hover:text-white" href={`/partners/${sponsor.slug}`}>
                  {copy.openProfile}
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-[1.5rem] border border-dashed border-[#d9af57]/20 bg-[#111111] p-8 text-center">
            <h2 className="font-[var(--font-display)] text-2xl text-[#f7ebc0]">{copy.noSponsorsHeading}</h2>
            <p className="mt-2 text-sm text-[#a99b7e]">{copy.noSponsorsDescription}</p>
          </div>
        )}
      </section>
    </SiteLayout>
  );
}
