import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteLayout } from "@/components/home/site-layout";
import { samplePartners } from "@/data/partners";
import { getHomePageData } from "@/data/home-page-data";

export function generateStaticParams() {
  return samplePartners.map((partner) => ({ slug: partner.slug }));
}

export default async function PartnerProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const [{ navItems, logo }, { slug }] = await Promise.all([getHomePageData(), params]);
  const partner = samplePartners.find((item) => item.slug === slug);

  if (!partner) {
    notFound();
  }

  return (
    <SiteLayout navItems={navItems} logo={logo}>
      <section className="py-10 sm:py-14">
        <article className="mx-auto max-w-3xl rounded-[1.75rem] border border-[#d9af57]/20 bg-[#111111] p-5 sm:rounded-[2rem] sm:p-10">
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#d9af57]">
            Sample partner profile · {partner.category}
          </p>
          <div className="mt-7 grid h-16 w-16 place-items-center rounded-2xl border border-[#d9af57]/30 bg-[#1b1710] font-[var(--font-display)] text-2xl text-[#f5d99a] sm:h-20 sm:w-20 sm:text-3xl">
            {partner.initials}
          </div>
          <h1 className="mt-6 break-words font-[var(--font-display)] text-4xl text-[#fff5d9] sm:text-5xl md:text-6xl">
            {partner.name}
          </h1>
          <p className="mt-5 text-base leading-7 text-[#d8c8a2]">{partner.details}</p>
          <a
            href={partner.website}
            target="_blank"
            rel="noreferrer"
            className="mt-7 inline-block break-all text-sm text-[#d9af57] underline decoration-[#d9af57]/40 underline-offset-4 hover:text-[#fff5d9]"
          >
            Visit business website: {partner.website}
          </a>
          <div>
            <Link
              href="/partners"
              className="mt-9 inline-flex min-h-11 items-center rounded-full border border-[#d9af57]/40 px-5 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-[#f0ddab] transition hover:border-[#f2d98b]"
            >
              Back to all partners
            </Link>
          </div>
        </article>
      </section>
    </SiteLayout>
  );
}
