"use client";
import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { LogoWithText } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<string>("Connecting to Keycloak...");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        const qs = typeof window !== "undefined" ? window.location.search : "";
        
        // Обновляем статус для показа прогресса
        setStatus("Verifying credentials with backend...");
        
        // forward the same query to the API; it will set cookies and respond
        const resp = await apiGet<{ success: boolean }>(`/auth/callback${qs}`);
        if (resp && resp.success) {
          setStatus("✅ Authentication successful! Redirecting to dashboard...");
          setTimeout(() => router.replace("/dashboard"), 1000);
        } else {
          setError("Authentication callback failed - invalid response from server");
        }
      } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        setError(errorMessage || "Callback error");
      }
    };
    run();
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 flex items-center justify-center p-6">
      <Link 
        href="/" 
        className="absolute top-6 left-6 hover:opacity-80 transition-opacity"
      >
        <LogoWithText />
      </Link>
      
      <Card className="bg-white/10 backdrop-blur-md border-white/20 w-full max-w-lg">
        <CardContent className="p-12 text-center">
          <div className="text-6xl mb-6">
            {!error ? (
              <div className="animate-spin">🔄</div>
            ) : (
              <div className="text-red-400">❌</div>
            )}
          </div>
          
          <h1 className="text-3xl font-bold text-white mb-6">
            {!error ? 'Authenticating...' : 'Authentication Failed'}
          </h1>
          
          {!error ? (
            <div>
              <p className="text-lg text-white/90 mb-4">{status}</p>
              <div className="flex justify-center items-center space-x-2 text-white/70">
                <div className="w-2 h-2 bg-white/70 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-white/70 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-white/70 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          ) : (
            <div>
              <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-4 rounded-lg mb-6">
                {error}
              </div>
              <Button asChild variant="brand" size="lg" className="w-full">
                <Link href="/login">Try Again</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
