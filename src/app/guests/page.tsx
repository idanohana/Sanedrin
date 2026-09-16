import { AppShell } from "@/components/layout/AppShell";
import { GuestManager } from "@/components/guests/GuestManager";

export default function GuestsPage() {
  return (
    <AppShell>
      <GuestManager />
    </AppShell>
  );
}
