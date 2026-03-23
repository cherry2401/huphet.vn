import { getLiveSessions } from "@/lib/adapters/live-adapter";
import { LiveXuClient } from "./live-xu-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export default async function LivePage() {
  const sessions = await getLiveSessions();

  return (
    <main style={{ width: "min(1180px, calc(100vw - 32px))", margin: "0 auto", padding: "28px 0 72px" }}>
      <LiveXuClient initialSessions={sessions} />
    </main>
  );
}
