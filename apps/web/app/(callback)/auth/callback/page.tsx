"use client";

import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import { useRouter } from "next/navigation";
import { logger } from "@/lib/logger";
import Link from "next/link";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState("Verifying credentials...");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        const qs = typeof window !== "undefined" ? window.location.search : "";

        const resp = await apiGet<{ success: boolean }>(`/auth/callback${qs}`);
        if (resp?.success) {
          setStatus("Checking your profile...");

          try {
            const userResp = await apiGet<{ role?: string }>("/api/users/me");

            if (userResp?.role === "pending") {
              router.replace("/select-role");
            } else {
              router.replace("/dashboard");
            }
          } catch (userError) {
            logger.error("Failed to fetch user:", userError);
            router.replace("/dashboard");
          }
        } else {
          setError("Authentication failed — invalid response from server");
        }
      } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        setError(errorMessage || "Callback error");
      }
    };
    run();
  }, [router]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="w-full max-w-sm space-y-6 text-center">
          <Logo className="mx-auto h-12 w-12" />
          <div className="space-y-2">
            <AlertCircle className="mx-auto h-10 w-10 text-destructive" />
            <h1 className="text-xl font-bold text-foreground">
              Authentication Failed
            </h1>
          </div>
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            {error}
          </div>
          <Button asChild className="w-full">
            <Link href="/login">Try Again</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background gap-4">
      <Logo className="h-12 w-12" />
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">{status}</p>
    </div>
  );
}
