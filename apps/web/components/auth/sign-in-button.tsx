"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { ButtonProps } from "@/components/ui/button";

interface SignInButtonProps extends Omit<ButtonProps, 'onClick'> {
  children?: React.ReactNode;
  redirectTo?: string;
}

export function SignInButton({ 
  children = "Sign In", 
  redirectTo,
  ...props 
}: SignInButtonProps) {
  const router = useRouter();

  const handleSignIn = () => {
    const loginUrl = redirectTo 
      ? `/login?redirect=${encodeURIComponent(redirectTo)}`
      : '/login';
    router.push(loginUrl);
  };

  return (
    <Button onClick={handleSignIn} {...props}>
      {children}
    </Button>
  );
}
