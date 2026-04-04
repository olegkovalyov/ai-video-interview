"use client";

import { SignInButton } from "@/features/auth";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-brand/5 via-purple-50 to-info/5" />

      <div className="relative container mx-auto px-6 py-24 md:py-32 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full bg-brand/10 px-4 py-1.5 text-sm font-medium text-brand mb-6">
            AI-Powered Interview Platform
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight tracking-tight">
            Smarter Hiring with{" "}
            <span className="bg-gradient-to-r from-brand to-purple-600 bg-clip-text text-transparent">
              AI Video Interviews
            </span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            Candidates record responses at their convenience. AI analyzes them
            instantly — scoring, recommendations, and detailed feedback.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <SignInButton variant="default" size="xl" mode="register">
              Get Started Free
            </SignInButton>
            <SignInButton variant="outline" size="xl" mode="login">
              Sign In
            </SignInButton>
          </div>
        </div>
      </div>
    </section>
  );
}
