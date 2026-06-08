export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { Nav } from "@/components/Nav";
import { AlertList } from "@/components/AlertList";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function AlertsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const alerts = await prisma.alert.findMany({
    where: { userId: session.id },
    include: { channels: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <Nav />
      <div className="container">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <div>
            <h1>My Alerts</h1>
            <p className="subtitle" style={{ marginBottom: 0 }}>
              Manage your notification rules
            </p>
          </div>
          <Link href="/alerts/new" className="btn">
            + New Alert
          </Link>
        </div>
        <AlertList alerts={JSON.parse(JSON.stringify(alerts))} />
      </div>
    </>
  );
}
