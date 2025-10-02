"use client";
import { useState } from "react";
import { apiGet } from "../lib/api";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LogoWithText } from "@/components/ui/logo";

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async () => {
    setLoading(true);
    setError(null);
    try {
      const webOrigin = process.env.NEXT_PUBLIC_WEB_ORIGIN || "http://localhost:3000";
      const callbackUrl = `${webOrigin}/auth/callback`;
      const qs = new URLSearchParams({ redirect_uri: callbackUrl }).toString();
      const { authUrl } = await apiGet<{ authUrl: string; state: string; redirectUri: string }>(`/auth/register?${qs}`);
      window.location.assign(authUrl);
    } catch (e: any) {
      setError(e.message || "Failed to start registration");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 flex items-center justify-center p-6">
      <Link 
        href="/" 
        className="absolute top-6 left-6 hover:opacity-80 transition-opacity"
      >
        <LogoWithText />
      </Link>
      
      <Card className="bg-white/10 backdrop-blur-md border-white/20 w-full max-w-md">
        <CardContent className="p-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-6">
            Create Account
          </h1>
          
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-3 rounded-lg mb-6">
              {error}
            </div>
          )}
          
          <p className="text-white/90 mb-8 leading-relaxed">
            Join AI Video Interview platform to revolutionize your hiring process with intelligent candidate evaluation.
          </p>
          
          <Button 
            onClick={handleRegister}
            disabled={loading}
            variant="brand"
            size="lg"
            className="w-full mb-6 cursor-pointer hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin">🔄</span>
                Redirecting...
              </span>
            ) : (
              "Continue with Keycloak"
            )}
          </Button>
          
          <p className="text-white/90 mb-6">
            Already have an account?{" "}
            <Link 
              href="/login"
              className="text-yellow-400 hover:text-yellow-300 font-semibold transition-colors"
            >
              Sign in
            </Link>
          </p>
          
          <div className="bg-white/5 border border-white/10 p-4 rounded-lg">
            <p className="text-white/80 text-sm">
              You'll be redirected to our secure registration system. After creating your account, you'll automatically return to the dashboard.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
