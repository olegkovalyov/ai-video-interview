import { LogoWithText } from "@/components/ui/logo";
import { Logo } from "@/components/ui/logo";
import Link from "next/link";
import { Video, Brain, BarChart3, Clock } from "lucide-react";

const FEATURES = [
  { icon: Video, text: "Asynchronous video interviews" },
  { icon: Brain, text: "AI-powered candidate analysis" },
  { icon: BarChart3, text: "Detailed scoring & insights" },
  { icon: Clock, text: "Hire 70% faster" },
];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Left — Brand panel (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[520px] flex-col justify-between bg-gradient-to-br from-brand-dark via-brand to-purple-600 p-10 text-white">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <Logo className="h-10 w-10" />
            <span className="text-2xl font-bold">AI Interview</span>
          </Link>
        </div>

        <div className="space-y-6">
          <h2 className="text-3xl font-bold leading-tight">
            Smarter hiring starts here
          </h2>
          <p className="text-white/80 leading-relaxed">
            AI-powered asynchronous video interviews that save time and find the
            best candidates.
          </p>

          <div className="space-y-4 pt-2">
            {FEATURES.map((feature) => (
              <div key={feature.text} className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
                  <feature.icon className="h-4.5 w-4.5 text-white/90" />
                </div>
                <span className="text-sm text-white/90">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-white/50">
          &copy; {new Date().getFullYear()} AI Interview Platform
        </p>
      </div>

      {/* Right — Form area */}
      <div className="flex flex-1 flex-col">
        {/* Mobile-only logo */}
        <div className="flex items-center p-6 lg:hidden">
          <Link href="/">
            <LogoWithText variant="dark" />
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center px-6 py-12">
          <div className="w-full max-w-lg">{children}</div>
        </div>

        <p className="pb-6 text-center text-xs text-muted-foreground lg:hidden">
          AI Interview Platform
        </p>
      </div>
    </div>
  );
}
