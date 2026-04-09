"use client";
import { useState } from "react";
import { apiGet } from "@/lib/api";
import Link from "next/link";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
} from "@/components/ui/card";

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async () => {
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
      }>(`/auth/register?${qs}`);
      window.location.assign(authUrl);
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      setError(errorMessage || "Failed to start registration");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-sm shadow-lg border">
      <CardHeader className="text-center space-y-1 pb-2">
        <h1 className="text-2xl font-bold text-foreground">Create account</h1>
        <p className="text-sm text-muted-foreground">
          Get started with AI-powered interview platform
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <Button
          onClick={handleRegister}
          disabled={loading}
          size="lg"
          className="w-full cursor-pointer"
        >
          <UserPlus className="mr-2 h-4 w-4" />
          {loading ? "Redirecting..." : "Continue with Keycloak"}
        </Button>

        <div className="rounded-lg bg-muted p-3">
          <p className="text-xs text-muted-foreground text-center">
            You will be redirected to our secure registration system. After
            creating your account, you&apos;ll return here automatically.
          </p>
        </div>
      </CardContent>

      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-primary hover:underline"
          >
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
