import Link from "next/link";
import { ArtistRegistrationSuccess } from "@/components/auth/artist-registration-page";
import { isValidEventId } from "@/services/events";

export default async function ArtistRegistrationSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ event?: string; name?: string }>;
}) {
  const { event = "", name = "" } = await searchParams;
  if (!isValidEventId(event) || !name.trim()) {
    return (
      <section className="rounded-2xl border border-white/[0.08] bg-[#10100f] p-6">
        <h1 className="font-[var(--font-display)] text-3xl text-[#fff5d9]">Registration status</h1>
        <p className="mt-3 text-sm leading-6 text-[#a99b7e]">
          We could not find the event details for this confirmation. Check your registrations in the artist dashboard.
        </p>
        <Link className="mt-5 inline-flex min-h-10 items-center text-xs text-[#f0ddab] underline underline-offset-4" href="/dashboard/artist">
          Return to artist dashboard
        </Link>
      </section>
    );
  }
  return <ArtistRegistrationSuccess eventId={event} eventName={name} />;
}
