import { redirect } from "next/navigation";
import { Nav } from "@/components/Nav";
import { AuthForm } from "@/components/AuthForm";
import { getSession } from "@/lib/auth";

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect("/alerts");

  return (
    <>
      <Nav />
      <div className="container">
        <AuthForm mode="login" />
      </div>
    </>
  );
}
