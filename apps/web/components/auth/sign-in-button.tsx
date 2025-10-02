"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { ButtonProps } from "@/components/ui/button";
import { apiGet } from "@/app/lib/api";

interface SignInButtonProps extends Omit<ButtonProps, 'onClick'> {
  children?: React.ReactNode;
  redirectTo?: string;
}

export function SignInButton({ 
  children = "Sign In", 
  redirectTo,
  ...props 
}: SignInButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    setLoading(true);
    try {
      const webOrigin = process.env.NEXT_PUBLIC_WEB_ORIGIN || "http://localhost:3000";
      const callbackUrl = redirectTo 
        ? `${webOrigin}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`
        : `${webOrigin}/auth/callback`;
      const qs = new URLSearchParams({ redirect_uri: callbackUrl }).toString();
      const { authUrl } = await apiGet<{ authUrl: string; state: string; redirectUri: string }>(`/auth/login?${qs}`);
      
      // Сразу редиректим на Keycloak БЕЗ промежуточной страницы
      window.location.assign(authUrl);
    } catch (error) {
      console.error('Failed to start login:', error);
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleSignIn} disabled={loading} {...props}>
      {loading ? "Redirecting..." : children}
    </Button>
  );
}
