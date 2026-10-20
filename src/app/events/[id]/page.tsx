import { connection } from "next/server";
import { notFound } from "next/navigation";
import Image from "next/image";
import { RegistrationForm } from "@/components/home/registration-form";
import { SiteLayout } from "@/components/home/site-layout";
import { getHomePageData } from "@/data/home-page-data";
import { getPublicEventSponsors, getUpcomingPublishedEvent, isValidEventId } from "@/services/events";
import { getArtistSkillsByIds } from "@/services/artist-skills";

type EventDetailsPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EventDetailsPage({ params }: EventDetailsPageProps) {
  await connection();
  const { id } = await params;
  if (!isValidEventId(id)) notFound();

  const event = await getUpcomingPublishedEvent(id);
  if (event === null) throw new Error("Event details are temporarily unavailable.");
  if (!event) notFound();
  const eventSkills = await getArtistSkillsByIds(event.skillIds);
  if (!eventSkills) throw new Error("Event skills are temporarily unavailable.");
  const sponsors = await getPublicEventSponsors(event);
  if (!sponsors) throw new Error("Event sponsors are temporarily unavailable.");

  const { navItems, logo } = await getHomePageData();
  const startsAt = new Intl.DateTimeFormat("en-IN", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(new Date(event.startsAt));
  const price = event.price === 0
    ? "Free entry"
    : new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(event.price);

  return (
    <SiteLayout navItems={navItems} logo={logo}>
      <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <article className="rounded-[2rem] border border-[#d9af57]/20 bg-[#111111] p-6 sm:p-10">
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#d9af57]">{event.type}</p>
          <h1 className="mt-4 break-words font-[var(--font-display)] text-4xl text-[#fff5d9] sm:text-6xl">{event.title}</h1>
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm text-[#d8c8a2]">
            <span>{startsAt}</span>
            <span>{event.location}</span>
            {event.city && <span>{event.city}</span>}
            <span>{price}</span>
            {event.capacity !== null && <span>{event.capacity} seats</span>}
          </div>
          {event.organizer && <p className="mt-4 text-xs text-[#a99b7e]">Hosted by {event.organizer}</p>}
          {eventSkills.length > 0 && (
            <div className="mt-6">
              <p className="text-xs font-medium text-[#cbbd9f]">Skills for this event</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {eventSkills.map((skill) => (
                  <span className="rounded-full border border-[#d9af57]/20 px-3 py-1 text-xs text-[#f0ddab]" key={skill.id}>
                    {skill.name}
                  </span>
                ))}
              </div>
            </div>
          )}
          {sponsors.length > 0 && (
            <section aria-labelledby="event-sponsors-heading" className="mt-6">
              <h2 className="text-xs font-medium text-[#cbbd9f]" id="event-sponsors-heading">Event sponsors</h2>
              <div className="mt-3 flex flex-wrap gap-3">
                {sponsors.map((sponsor) => (
                  <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-black/20 px-3 py-2" key={sponsor.id}>
                    {sponsor.logoUrl && <Image alt="" className="h-8 w-8 rounded-md bg-white object-contain p-1" height={32} src={sponsor.logoUrl} unoptimized width={32} />}
                    <span className="text-xs text-[#e6d6af]">{sponsor.name}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
          <div className="mt-8 border-t border-white/[0.07] pt-7">
            <h2 className="font-[var(--font-display)] text-2xl text-[#f7ebc0]">About this event</h2>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-[#d8c8a2]">{event.description}</p>
          </div>
        </article>

        <section aria-labelledby="event-registration-heading" className="mt-8">
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#d9af57]">Save your place</p>
          <h2 className="mb-5 mt-2 font-[var(--font-display)] text-3xl text-[#fff5d9]" id="event-registration-heading">
            Register for {event.title}
          </h2>
          <RegistrationForm
            eventChoices={[{ id: event.id, title: event.title, skillIds: event.skillIds, price: event.price }]}
            eventNames={[event.title]}
            selectedEvent={event.title}
            selectedEventId={event.id}
          />
        </section>
      </main>
    </SiteLayout>
  );
}
