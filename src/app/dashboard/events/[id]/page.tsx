import { AdminEventEditor } from "@/components/auth/admin-event-editor";

type EditEventPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditEventPage({ params }: EditEventPageProps) {
  const { id } = await params;
  return <AdminEventEditor eventId={id} />;
}
