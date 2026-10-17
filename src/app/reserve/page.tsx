import Link from "next/link";
import { SiteLayout } from "@/components/home/site-layout";
import { getHomePageData } from "@/data/home-page-data";

export default async function ReservePage() {
  const { navItems, logo } = await getHomePageData();

  return (
    <SiteLayout navItems={navItems} logo={logo}>
      <section className="py-14">
        <div className="mx-auto max-w-2xl rounded-[2rem] border border-[#d9af57]/20 bg-[#111111] p-8 text-center sm:p-12">
          <p className="text-[10px] uppercase tracking-[0.35em] text-[#d9af57]">Reservations</p>
          <h1 className="mt-4 font-[var(--font-display)] text-4xl text-[#fff5d9] md:text-5xl">
            Save your seat
          </h1>
          <p className="mt-5 text-base leading-7 text-[#d8c8a2]">
            Online reservations are coming soon. Explore upcoming events and check back for booking details.
          </p>
          <Link
            href="/events"
            className="mt-8 inline-block rounded-full border border-[#d9af57] bg-[#d9af57] px-7 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-[#121212] transition hover:bg-[#f2d98b]"
          >
            Browse Events
          </Link>
        </div>
      </section>
    </SiteLayout>
  );
}
