"use client";
import { useState } from "react";
import { apiGet } from "@/lib/api";
import Link from "next/link";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const beginLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const webOrigin =
        process.env.NEXT_PUBLIC_WEB_ORIGIN || "http://localhost:3000";
      const callbackUrl = `${webOrigin}/auth/callback`;
      const qs = new URLSearchParams({ redirect_uri: callbackUrl }).toString();
      const { authUrl } = await apiGet<{
        authUrl: string;
        state: string;
        redirectUri: string;
      }>(`/auth/login?${qs}`);
      window.location.assign(authUrl);
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      setError(errorMessage || "Failed to start login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Welcome back
        </h1>
        <p className="text-sm text-muted-foreground">
          Sign in to your account to continue
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Button
        onClick={beginLogin}
        disabled={loading}
        variant="default"
        size="lg"
        className="w-full"
      >
        <LogIn className="mr-2 h-4 w-4" />
        {loading ? "Redirecting..." : "Sign In"}
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">or</span>
        </div>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-medium text-primary hover:underline"
        >
          Create account
        </Link>
      </p>
    </div>
  );
}
