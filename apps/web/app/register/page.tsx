"use client";
import { useState } from "react";
import { apiPost } from "../lib/api";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await apiPost<{ user: { id: string; email: string; name: string } }>(
        "/auth/sign-up/email",
        { email, password, name }
      );
      router.push("/login");
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div style={{ maxWidth: 360, margin: "60px auto", fontFamily: "sans-serif" }}>
      <h1>Register</h1>
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
        <div style={{ marginBottom: 12 }}>
          <label>Name (optional)</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ width: "100%", padding: 8 }}
          />
        </div>
        {error && (
          <div style={{ color: "#b00020", marginBottom: 12 }}>{error}</div>
        )}
        <button type="submit" disabled={loading}>
          {loading ? "Registering..." : "Register"}
        </button>
      </form>
      <p style={{ marginTop: 12 }}>
        Already have an account? <a href="/login">Login</a>
      </p>
    </div>
  );
}
