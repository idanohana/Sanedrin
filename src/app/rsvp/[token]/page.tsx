import { RsvpPage } from "@/components/rsvp/RsvpPage";

export default async function PublicRsvpPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <RsvpPage token={token} />;
}
