"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignInButton } from "@/features/auth";
import { LogoWithText } from "@/components/ui/logo";
import { cn } from "@/lib/utils";

interface MarketingHeaderProps {
  userRoles?: string[];
}

const NAV_ITEMS = [
  { href: "/about", label: "About" },
  { href: "/pricing", label: "Pricing" },
];

export function MarketingHeader({ userRoles = [] }: MarketingHeaderProps) {
  const pathname = usePathname();
  const isAuthenticated = userRoles.length > 0;

  return (
    <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-6">
        {/* Left: logo + nav */}
        <div className="flex items-center gap-8">
          <Link href="/">
            <LogoWithText variant="dark" />
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  pathname === item.href
                    ? "text-primary bg-primary/5"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Right: auth buttons */}
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <SignInButton
                variant="ghost"
                size="sm"
                mode="login"
                className="text-muted-foreground hover:text-foreground"
              >
                Sign In
              </SignInButton>
              <SignInButton variant="default" size="sm" mode="register">
                Get Started Free
              </SignInButton>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
