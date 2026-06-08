import Link from "next/link";
import { getSession } from "@/lib/auth";

export async function Nav() {
  const session = await getSession();

  return (
    <nav>
      <Link href="/" className="brand">
        Sonrisa Alerts
      </Link>
      <div className="links">
        {session ? (
          <>
            <Link href="/alerts">My Alerts</Link>
            {session.isAdmin && <Link href="/admin">Admin</Link>}
            <span style={{ color: "var(--muted)", fontSize: "0.875rem" }}>
              {session.email}
            </span>
            <form action="/api/auth/logout" method="POST">
              <button type="submit" className="btn-secondary" style={{ padding: "0.4rem 0.8rem" }}>
                Logout
              </button>
            </form>
          </>
        ) : (
          <>
            <Link href="/login">Login</Link>
            <Link href="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}
