import type { EventItem } from "@/data/home-page-data";
import { defaultPublicPageCopy, type PublicPageCopy } from "@/data/public-page-copy";
import { getNextUpcomingEventDate, listUpcomingPublishedEvents } from "@/services/events";

type FeaturedEvent = {
  title: string;
  schedule: string;
  audience: string;
};

export async function getPublicEventData(
  fallbackEvents: EventItem[],
  fallbackFeaturedEvent: FeaturedEvent,
  homeCopy: PublicPageCopy["home"] = defaultPublicPageCopy.home,
): Promise<{ upcomingEvents: EventItem[]; featuredEvent: FeaturedEvent }> {
  const events = await listUpcomingPublishedEvents();
  if (events === null) {
    return { upcomingEvents: fallbackEvents, featuredEvent: fallbackFeaturedEvent };
  }

  const upcomingEvents = events.map((event) => {
    const startsAt = getNextUpcomingEventDate(event);
    return {
      id: event.id,
      date: new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "short",
        timeZone: "Asia/Kolkata",
      }).format(startsAt),
      title: event.title,
      type: event.type,
      venue: event.location,
      city: event.city,
      startsAt: startsAt.toISOString(),
      dates: event.dates,
      posterUrl: event.posterUrl,
      description: event.description,
      price: event.price,
      capacity: event.capacity,
      organizer: event.organizer,
      skillIds: event.skillIds,
    };
  });
  const firstEvent = events[0];
  const firstEventDate = firstEvent ? getNextUpcomingEventDate(firstEvent) : null;

  return {
    upcomingEvents,
    featuredEvent: firstEvent
      ? {
          title: firstEvent.title,
          schedule: new Intl.DateTimeFormat("en-IN", {
            dateStyle: "full",
            timeStyle: "short",
            timeZone: "Asia/Kolkata",
          }).format(firstEventDate!),
          audience: firstEvent.price === 0
            ? "Free entry"
            : new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(firstEvent.price),
        }
      : {
          title: homeCopy.noFeaturedEvent,
          schedule: homeCopy.noFeaturedSchedule,
          audience: homeCopy.noFeaturedAudience,
        },
  };
}
