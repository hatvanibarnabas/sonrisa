import { redirect } from "next/navigation";
import { Nav } from "@/components/Nav";
import { AlertForm } from "@/components/AlertForm";
import { getSession } from "@/lib/auth";

export default async function NewAlertPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <>
      <Nav />
      <div className="container">
        <h1>Create Alert</h1>
        <p className="subtitle">Define what to watch and how to be notified</p>
        <AlertForm />
      </div>
    </>
  );
}
