"use client";
import { useState } from "react";
import { apiGet } from "../lib/api";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const beginLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const webOrigin = process.env.NEXT_PUBLIC_WEB_ORIGIN || "http://localhost:3000";
      const callbackUrl = `${webOrigin}/auth/callback`;
      const qs = new URLSearchParams({ redirect_uri: callbackUrl }).toString();
      const { authUrl } = await apiGet<{ authUrl: string; state: string; redirectUri: string }>(`/auth/login?${qs}`);
      window.location.assign(authUrl);
    } catch (e: any) {
      setError(e.message || "Failed to start login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 flex items-center justify-center p-6">
      <Link 
        href="/" 
        className="absolute top-6 left-6 text-white text-2xl font-bold hover:text-yellow-400 transition-colors"
      >
        🎥 AI Video Interview
      </Link>
      
      <Card className="bg-white/10 backdrop-blur-md border-white/20 w-full max-w-md">
        <CardContent className="p-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-6">
            Welcome Back
          </h1>
          
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-3 rounded-lg mb-6">
              {error}
            </div>
          )}
          
          <Button 
            onClick={beginLogin} 
            disabled={loading}
            variant={loading ? "secondary" : "brand"}
            size="lg"
            className="w-full mb-6 cursor-pointer hover:shadow-lg transition-all duration-200"
          >
            {loading ? "Redirecting..." : "Continue with Keycloak"}
          </Button>
          
          <p className="text-white/90">
            No account?{" "}
            <Link 
              href="/register"
              className="text-yellow-400 hover:text-yellow-300 font-semibold transition-colors"
            >
              Create account
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
