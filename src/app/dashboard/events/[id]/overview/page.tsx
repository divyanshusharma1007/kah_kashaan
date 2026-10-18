import { AdminEventOverview } from "@/components/auth/admin-event-overview";

type EventOverviewPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EventOverviewPage({ params }: EventOverviewPageProps) {
  const { id } = await params;
  return <AdminEventOverview eventId={id} />;
}
