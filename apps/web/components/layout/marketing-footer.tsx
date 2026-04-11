import Link from "next/link";
import { Logo } from "@/components/ui/logo";

const FOOTER_NAV = {
  Product: [
    { href: "/pricing", label: "Pricing" },
    { href: "/about", label: "About" },
    { href: "/register", label: "Get Started" },
  ],
  Platform: [
    { href: "/login", label: "Sign In" },
    { href: "/register", label: "Create Account" },
  ],
};

export function MarketingFooter() {
  return (
    <footer className="border-t bg-card">
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <Logo className="h-8 w-8" />
              <span className="text-lg font-bold text-foreground">
                AI Interview
              </span>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              AI-powered asynchronous video interview platform. Smarter hiring
              through intelligent candidate evaluation.
            </p>
          </div>

          {/* Nav columns */}
          {Object.entries(FOOTER_NAV).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-sm font-semibold text-foreground mb-3">
                {title}
              </h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 border-t pt-6">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} AI Interview. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-xs text-muted-foreground">
              Built with Next.js, NestJS &amp; AI
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
