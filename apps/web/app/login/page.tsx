"use client";
import { useState } from "react";
import { apiPost } from "../lib/api";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await apiPost<{ user: any; session: { token: string } }>(
        "/auth/sign-in/email",
        { email, password }
      );
      // Better Auth uses session tokens, but we can get JWT via /auth/token
      const tokenRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000'}/auth/token`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${res.session.token}`,
        },
      });
      const tokenData = await tokenRes.json();
      
      localStorage.setItem("accessToken", tokenData.token);
      localStorage.setItem("sessionToken", res.session.token);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 360, margin: "60px auto", fontFamily: "sans-serif" }}>
      <h1>Login</h1>
      <form onSubmit={onSubmit}>
        <div style={{ marginBottom: 12 }}>
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: "100%", padding: 8 }}
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            style={{ width: "100%", padding: 8 }}
          />
        </div>
        {error && (
          <div style={{ color: "#b00020", marginBottom: 12 }}>{error}</div>
        )}
        <button type="submit" disabled={loading}>
          {loading ? "Signing in..." : "Login"}
        </button>
      </form>
      <p style={{ marginTop: 12 }}>
        No account? <a href="/register">Register</a>
      </p>
    </div>
  );
}
