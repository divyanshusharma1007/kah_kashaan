import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/home/reveal";
import type { ManagedSponsor } from "@/services/sponsors";
import type { PublicPageCopy } from "@/data/public-page-copy";

type SponsorSectionContent = {
  eyebrow: string;
  heading: string;
  description: string;
  buttonLabel: string;
  benefits: { title: string; description: string }[];
};

export function SponsorsSection({
  sponsors,
  content,
  copy,
  partnerCopy,
}: {
  sponsors: ManagedSponsor[];
  content: SponsorSectionContent;
  copy: PublicPageCopy["home"];
  partnerCopy: PublicPageCopy["partnersPage"];
}) {
  return (
    <section aria-labelledby="sponsors-heading" className="py-14">
      <Reveal>
        <div className="relative overflow-hidden rounded-[2rem] border border-[#d9af57]/25 bg-[radial-gradient(circle_at_88%_12%,rgba(217,175,87,0.16),transparent_32%),linear-gradient(135deg,#19160f,#0d0d0c_70%)] p-6 sm:p-9 lg:p-11">
          <div className="relative z-10 grid gap-9 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#d9af57]">{content.eyebrow}</p>
              <h2 className="mt-3 max-w-2xl font-[var(--font-display)] text-4xl leading-tight text-[#fff5d9] sm:text-5xl" id="sponsors-heading">
                {content.heading}
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-[#c9bea2]">
                {content.description}
              </p>
              <Link
                className="mt-6 inline-flex min-h-12 items-center justify-center rounded-full bg-[#d9af57] px-6 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#15130e] transition hover:-translate-y-0.5 hover:bg-[#f2d98b]"
                href="/partners/inquire"
              >
                {content.buttonLabel} <span aria-hidden="true" className="ml-2">↗</span>
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {content.benefits.map((benefit, index) => (
                <article className="rounded-2xl border border-white/[0.08] bg-black/20 p-4 transition hover:border-[#d9af57]/30 sm:p-5" key={`${benefit.title}-${index}`}>
                  <div className="flex items-start gap-4">
                    <span className="font-[var(--font-display)] text-2xl text-[#d9af57]">{String(index + 1).padStart(2, "0")}</span>
                    <div>
                      <h3 className="text-sm font-semibold text-[#f0e6ce]">{benefit.title}</h3>
                      <p className="mt-1.5 text-xs leading-5 text-[#a99b7e]">{benefit.description}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
          {sponsors.length > 0 ? (
            <div className="relative z-10 mt-8 border-t border-white/[0.08] pt-6">
              <div className="mb-4 flex items-end justify-between gap-3">
                <div>
                  <p className="text-[9px] uppercase tracking-[0.25em] text-[#b29b65]">{copy.sponsorsCommunity}</p>
                  <h3 className="mt-1 font-[var(--font-display)] text-2xl text-[#fff5d9]">{copy.websiteSponsors}</h3>
                </div>
                <Link className="text-xs text-[#e7d7aa] underline underline-offset-4 hover:text-white" href="/partners">{copy.viewAllSponsors}</Link>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {sponsors.map((sponsor) => (
                  <Link
                    className="flex min-w-0 items-center gap-3 rounded-xl border border-white/[0.08] bg-black/20 p-3 transition hover:border-[#d9af57]/35"
                    href={`/partners/${sponsor.slug}`}
                    key={sponsor.id}
                  >
                    {sponsor.logoUrl ? (
                      <Image alt={`${sponsor.name} logo`} className="h-10 w-10 shrink-0 rounded-lg bg-white object-contain p-1" height={40} src={sponsor.logoUrl} unoptimized width={40} />
                    ) : (
                      <span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-[#d9af57]/25 font-[var(--font-display)] text-lg text-[#f5d99a]">
                        {sponsor.name.trim().charAt(0).toUpperCase()}
                      </span>
                    )}
                    <span className="min-w-0">
                      <span className="block break-words text-sm font-medium text-[#f0e6ce]">{sponsor.name}</span>
                      <span className="mt-1 block truncate text-[10px] text-[#a99b7e]">{sponsor.category || partnerCopy.defaultCategory}</span>
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <p className="relative z-10 mt-7 border-t border-white/[0.08] pt-5 text-xs text-[#a99b7e]">
              {copy.noWebsiteSponsors}
            </p>
          )}
        </div>
      </Reveal>
    </section>
  );
}
