import Link from "next/link";
import { SiteLayout } from "@/components/home/site-layout";
import { samplePartners } from "@/data/partners";
import { getHomePageData } from "@/data/home-page-data";

export default async function PartnersPage() {
  const { navItems, logo } = await getHomePageData();

  return (
    <SiteLayout navItems={navItems} logo={logo}>
      <section className="py-10 sm:py-14">
        <div className="mb-8 max-w-3xl">
          <p className="text-[10px] uppercase tracking-[0.35em] text-[#d9af57]">Sponsors & partners</p>
          <h1 className="mt-4 font-[var(--font-display)] text-4xl text-[#fff5d9] sm:text-5xl md:text-6xl">
            The people behind the circle
          </h1>
          <p className="mt-4 text-sm leading-7 text-[#d8c8a2] sm:text-base">
            These example profiles demonstrate how partner information can appear.
            Names, descriptions, and links are placeholders and do not represent confirmed sponsors.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {samplePartners.map((partner) => (
            <details
              key={partner.slug}
              className="group min-w-0 rounded-[1.5rem] border border-[#d9af57]/20 bg-[#111111] p-5 transition duration-300 hover:-translate-y-1 hover:border-[#d9af57]/50 sm:p-6"
            >
              <summary className="cursor-pointer list-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d9af57]">
                <div className="flex items-start justify-between gap-4">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-[#d9af57]/30 bg-[#1b1710] font-[var(--font-display)] text-xl text-[#f5d99a]">
                    {partner.initials}
                  </span>
                  <span className="pt-1 text-[9px] uppercase tracking-[0.18em] text-[#9f9277]">
                    Sample profile · <span className="group-open:hidden">tap for details</span><span className="hidden group-open:inline">hide details</span>
                  </span>
                </div>
                <p className="mt-5 text-[9px] uppercase tracking-[0.24em] text-[#d9af57]">{partner.category}</p>
                <h2 className="mt-2 break-words font-[var(--font-display)] text-3xl text-[#f7ebc0]">{partner.name}</h2>
                <p className="mt-3 text-sm leading-6 text-[#c9bea2]">{partner.summary}</p>
              </summary>

              <div className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-300 group-open:grid-rows-[1fr] group-hover:grid-rows-[1fr]">
                <div className="overflow-hidden">
                  <div className="mt-5 border-t border-[#d9af57]/15 pt-4">
                    <p className="text-sm leading-6 text-[#d8c8a2]">{partner.details}</p>
                    <div className="mt-5 flex flex-col gap-3">
                      <Link
                        href={`/partners/${partner.slug}`}
                        className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#d9af57]/40 px-4 py-2 text-center text-[10px] font-semibold uppercase tracking-[0.15em] text-[#f0ddab] transition hover:border-[#f2d98b] sm:self-start"
                      >
                        Open partner profile
                      </Link>
                      <a
                        href={partner.website}
                        target="_blank"
                        rel="noreferrer"
                        className="break-all text-sm text-[#d9af57] underline decoration-[#d9af57]/40 underline-offset-4 hover:text-[#fff5d9]"
                      >
                        {partner.website}
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </details>
          ))}
        </div>
      </section>
    </SiteLayout>
  );
}
