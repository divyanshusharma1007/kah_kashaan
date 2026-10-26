import Link from "next/link";
import { AdminArtistContent } from "@/components/auth/admin-artist-content";
import { AdminSponsorInquiries } from "@/components/auth/admin-sponsor-inquiries";

export default function DashboardRequestsPage() {
  return (
    <div className="space-y-8">
      <header>
        <p className="text-[10px] uppercase tracking-[0.22em] text-[#d9af57]">Review center</p>
        <h1 className="mt-2 font-[var(--font-display)] text-3xl text-[#fff5d9] sm:text-4xl">Request queue</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-[#c1b596]">
          Review artist feature requests, writing submissions, and incoming partnership inquiries in one place.
        </p>
        <div className="mt-4 flex flex-wrap gap-3 text-xs">
          <Link className="rounded-full border border-white/10 px-4 py-2 text-[#d9cda9] transition hover:border-[#d9af57]/40 hover:text-[#fff5d9]" href="/dashboard/artist-content">
            Open artist work
          </Link>
          <Link className="rounded-full border border-white/10 px-4 py-2 text-[#d9cda9] transition hover:border-[#d9af57]/40 hover:text-[#fff5d9]" href="/dashboard/sponsors">
            Open sponsors
          </Link>
        </div>
      </header>
      <AdminArtistContent />
      <AdminSponsorInquiries />
    </div>
  );
}
