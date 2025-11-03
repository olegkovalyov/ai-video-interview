"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { ButtonProps } from "@/components/ui/button";
import { apiGet } from "@/lib/api";

interface SignInButtonProps extends Omit<ButtonProps, 'onClick'> {
  children?: React.ReactNode;
  redirectTo?: string;
  mode?: 'login' | 'register'; // Add mode prop
}

export function SignInButton({ 
  children = "Sign In", 
  redirectTo,
  mode = 'login',
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
      
      // FORCE register for "Create Account" buttons
      const finalMode = children?.toString().includes('Create') || children?.toString().includes('Account') ? 'register' : mode;
      
      // Use different endpoint based on mode
      const endpoint = finalMode === 'register' ? '/auth/register' : '/auth/login';
      const { authUrl } = await apiGet<{ authUrl: string; state: string; redirectUri: string }>(`${endpoint}?${qs}`);
      
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
