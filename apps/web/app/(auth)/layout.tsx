import { LogoWithText } from "@/components/ui/logo";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Decorative top band */}
      <div className="h-1.5 bg-gradient-to-r from-brand via-brand-light to-brand" />

      <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
        <Link href="/" className="mb-10 hover:opacity-80 transition-opacity">
          <LogoWithText variant="dark" />
        </Link>
        {children}
      </div>

      {/* Footer */}
      <p className="pb-6 text-center text-xs text-muted-foreground">
        AI Interview Platform
      </p>
    </div>
  );
}
