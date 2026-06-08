"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface AuthFormProps {
  mode: "login" | "register";
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
    const body = mode === "login" ? { email, password } : { email, password, name };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }
      router.push("/alerts");
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card" style={{ maxWidth: 400, margin: "0 auto" }}>
      <h2>{mode === "login" ? "Login" : "Create account"}</h2>
      {error && <p className="error">{error}</p>}

      {mode === "register" && (
        <>
          <label htmlFor="name">Name (optional)</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </>
      )}

      <label htmlFor="email">Email</label>
      <input
        id="email"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <label htmlFor="password">Password</label>
      <input
        id="password"
        type="password"
        required
        minLength={mode === "register" ? 8 : 1}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button type="submit" disabled={loading}>
        {loading ? "..." : mode === "login" ? "Login" : "Register"}
      </button>

      <p style={{ marginTop: "1rem", fontSize: "0.875rem", color: "var(--muted)" }}>
        {mode === "login" ? (
          <>
            No account? <a href="/register">Register</a>
          </>
        ) : (
          <>
            Already have an account? <a href="/login">Login</a>
          </>
        )}
      </p>
    </form>
  );
}
