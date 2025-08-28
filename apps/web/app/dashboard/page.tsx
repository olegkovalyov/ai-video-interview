"use client";
import { useEffect, useMemo, useState } from "react";
import { apiPost } from "../lib/api";
import { useRouter } from "next/navigation";

function decodeJwtPayload(token: string): any | null {
  try {
    const [, payload] = token.split(".");
    if (!payload) return null;
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export default function DashboardPage() {
  const router = useRouter();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const at = localStorage.getItem("accessToken");
    const st = localStorage.getItem("sessionToken");
    if (!at || !st) {
      router.replace("/login");
      return;
    }
    setAccessToken(at);
    setRefreshToken(st);
  }, [router]);

  const claims = useMemo(() => (accessToken ? decodeJwtPayload(accessToken) : null), [accessToken]);

  const onRefresh = async () => {
    setError(null);
    if (!refreshToken) return;
    try {
      // Use session token to get a new JWT
      const tokenRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000'}/auth/token`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${refreshToken}`,
        },
      });
      const tokenData = await tokenRes.json();
      
      localStorage.setItem("accessToken", tokenData.token);
      setAccessToken(tokenData.token);
    } catch (e: any) {
      setError(e.message || "Refresh failed");
    }
  };

  const onLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("sessionToken");
    router.replace("/login");
  };

  return (
    <div style={{ maxWidth: 720, margin: "40px auto", fontFamily: "sans-serif" }}>
      <h1>Dashboard</h1>
      {error && <div style={{ color: "#b00020", marginBottom: 12 }}>{error}</div>}
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <button onClick={onRefresh}>Refresh tokens</button>
        <button onClick={onLogout}>Logout</button>
      </div>
      <section style={{ marginTop: 16 }}>
        <h3>Claims</h3>
        <pre style={{ background: "#f6f8fa", padding: 12, overflow: "auto" }}>
          {claims ? JSON.stringify(claims, null, 2) : "No token"}
        </pre>
      </section>
      <section style={{ marginTop: 16 }}>
        <h3>Access Token</h3>
        <pre style={{ background: "#f6f8fa", padding: 12, overflow: "auto" }}>{accessToken}</pre>
      </section>
      <section style={{ marginTop: 16 }}>
        <h3>Refresh Token</h3>
        <pre style={{ background: "#f6f8fa", padding: 12, overflow: "auto" }}>{refreshToken}</pre>
      </section>
    </div>
  );
}
