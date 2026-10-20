import Link from "next/link";
import { SponsorInquiryForm } from "@/components/home/sponsor-inquiry-form";
import { SiteLayout } from "@/components/home/site-layout";
import { getHomePageData } from "@/data/home-page-data";
import { getHomepageHeroContent } from "@/services/homepage-content";

export default async function SponsorInquiryPage() {
  const [{ navItems, logo }, content] = await Promise.all([
    getHomePageData(),
    getHomepageHeroContent(),
  ]);
  return (
    <SiteLayout navItems={navItems} logo={logo} content={content ?? undefined}>
      <section className="mx-auto max-w-4xl py-12 sm:py-16">
        <Link className="text-xs text-[#d9af57] hover:text-[#f7ebc0]" href="/partners">← Partner directory</Link>
        <header className="mb-8 mt-7">
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#d9af57]">Sponsors & collaborators</p>
          <h1 className="mt-3 font-[var(--font-display)] text-4xl text-[#fff5d9] sm:text-6xl">Let’s create something meaningful.</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#c9bea2]">
            Tell us a little about your organization and the partnership you have in mind. Our team will follow up using the contact details you provide.
          </p>
        </header>
        <SponsorInquiryForm />
      </section>
    </SiteLayout>
  );
}
