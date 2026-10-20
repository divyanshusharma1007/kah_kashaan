import Link from "next/link";
import type { FooterVisibility, SocialLinks } from "@/data/hero-content";

const socialLabels: { key: keyof SocialLinks; visibilityKey: keyof FooterVisibility; label: string }[] = [
  { key: "instagram", visibilityKey: "socialInstagram", label: "Instagram" },
  { key: "facebook", visibilityKey: "socialFacebook", label: "Facebook" },
  { key: "twitter", visibilityKey: "socialTwitter", label: "X / Twitter" },
  { key: "youtube", visibilityKey: "socialYoutube", label: "YouTube" },
  { key: "linkedin", visibilityKey: "socialLinkedin", label: "LinkedIn" },
];

const defaultVisibility: FooterVisibility = {
  discoverStory: true,
  discoverCommunity: true,
  discoverArtists: true,
  discoverPartners: true,
  takePartPrograms: true,
  takePartEvents: true,
  takePartRegister: true,
  sponsorInquiry: true,
  socialInstagram: true,
  socialFacebook: true,
  socialTwitter: true,
  socialYoutube: true,
  socialLinkedin: true,
};

export function SiteFooter({
  socialLinks = { instagram: "", facebook: "", twitter: "", youtube: "", linkedin: "" },
  visibility = defaultVisibility,
}: {
  socialLinks?: SocialLinks;
  visibility?: FooterVisibility;
}) {
  const hasDiscoverLinks = visibility.discoverStory || visibility.discoverCommunity ||
    visibility.discoverArtists || visibility.discoverPartners;
  const hasParticipationLinks = visibility.takePartPrograms || visibility.takePartEvents ||
    visibility.takePartRegister;
  const visibleSocialLinks = socialLabels.filter(({ key, visibilityKey }) =>
    visibility[visibilityKey] && Boolean(socialLinks[key]),
  );
  return (
    <footer className="mt-12 overflow-hidden rounded-t-[2rem] border-t border-[#d9af57]/25 bg-[radial-gradient(ellipse_at_top,_rgba(217,175,87,0.1),_transparent_48%),linear-gradient(180deg,#11100d_0%,#090909_100%)] px-5 pt-10 sm:rounded-t-[2.5rem] sm:px-8 sm:pt-14 lg:px-10">
      <div className="grid gap-10 border-b border-[#d9af57]/15 pb-10 md:grid-cols-[1.15fr_0.85fr] md:gap-12">
        <div>
          <div className="flex items-center gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-[#d9af57]/35 bg-[#17130c] font-[var(--font-display)] text-xl text-[#f5d99a] shadow-[0_0_24px_rgba(217,175,87,0.08)]">
              KK
            </span>
            <div>
              <p className="font-[var(--font-display)] text-3xl leading-none text-[#f7ebc0] sm:text-4xl">
                Kah-Kashaan
              </p>
              <p className="mt-2 text-[9px] uppercase tracking-[0.25em] text-[#b29b65]">
                Literature · Music · Community
              </p>
            </div>
          </div>
          <p className="mt-5 max-w-lg text-sm leading-7 text-[#c9bea2] sm:text-base">
            A gathering place for words, music, mentorship, and meaningful connection.
            Come for the performances, stay for the community we create together.
          </p>
          {visibility.discoverStory && (
            <Link
              href="/about"
              className="mt-5 inline-flex min-h-11 items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#e7d7aa] transition hover:text-white"
            >
              Discover our story <span aria-hidden="true">→</span>
            </Link>
          )}
          {visibleSocialLinks.length > 0 && (
            <div className="mt-6">
              <h2 className="text-[10px] uppercase tracking-[0.25em] text-[#d9af57]">Follow us</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {visibleSocialLinks.map(({ key, label }) => (
                <a
                  className="rounded-full border border-white/[0.1] px-3 py-2 text-[10px] text-[#d9ceb0] transition hover:border-[#d9af57]/40 hover:text-white"
                  href={socialLinks[key]}
                  key={key}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {label}
                </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {(hasDiscoverLinks || hasParticipationLinks || visibility.sponsorInquiry) && (
          <nav aria-label="Footer navigation" className="grid grid-cols-2 gap-x-6 gap-y-7 sm:grid-cols-3 md:content-start">
            {hasDiscoverLinks && (
              <div>
                <h2 className="text-[10px] uppercase tracking-[0.25em] text-[#d9af57]">Discover</h2>
                <ul className="mt-4 space-y-3 text-sm text-[#d9ceb0]">
                  {visibility.discoverStory && <li><Link className="transition hover:text-white" href="/about">Our story</Link></li>}
                  {visibility.discoverCommunity && <li><Link className="transition hover:text-white" href="/community">Community</Link></li>}
                  {visibility.discoverArtists && <li><Link className="transition hover:text-white" href="/artists">Featured artists</Link></li>}
                  {visibility.discoverPartners && <li><Link className="transition hover:text-white" href="/partners">Our partners</Link></li>}
                </ul>
              </div>
            )}
            {hasParticipationLinks && (
              <div>
                <h2 className="text-[10px] uppercase tracking-[0.25em] text-[#d9af57]">Take part</h2>
                <ul className="mt-4 space-y-3 text-sm text-[#d9ceb0]">
                  {visibility.takePartPrograms && <li><Link className="transition hover:text-white" href="/programs">Programs</Link></li>}
                  {visibility.takePartEvents && <li><Link className="transition hover:text-white" href="/events">Upcoming events</Link></li>}
                  {visibility.takePartRegister && <li><Link className="transition hover:text-white" href="/reserve">Register</Link></li>}
                </ul>
              </div>
            )}
            {visibility.sponsorInquiry && (
              <div className="col-span-2 sm:col-span-1">
                <h2 className="text-[10px] uppercase tracking-[0.25em] text-[#d9af57]">Be part of it</h2>
                <p className="mt-4 max-w-xs text-sm leading-6 text-[#c9bea2]">
                  Meet the people and organizations that help bring every gathering to life.
                </p>
                <Link
                  className="mt-3 inline-flex min-h-10 items-center text-sm text-[#e7d7aa] underline decoration-[#d9af57]/40 underline-offset-4 transition hover:text-white"
                  href="/partners/inquire"
                >
                  Become a sponsor or partner
                </Link>
              </div>
            )}
          </nav>
        )}
      </div>

      <div className="flex flex-col gap-2 border-t border-[#d9af57]/15 py-5 text-[11px] leading-5 text-[#95886f] sm:flex-row sm:items-center sm:justify-between">
        <span>© {new Date().getFullYear()} Kah-Kashaan. All rights reserved.</span>
        <span>Made for words, music, and meaningful connection.</span>
      </div>
    </footer>
  );
}
