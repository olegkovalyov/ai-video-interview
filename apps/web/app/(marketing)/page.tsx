"use client";

import { Hero } from "@/components/sections/hero";
import { Features } from "@/components/sections/features";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SignInButton } from "@/features/auth";
import Link from "next/link";
import { BookOpen, CreditCard } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <main>
        <Hero />
        <Features />

        {/* CTA cards */}
        <section className="container mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <Card className="transition-all hover:shadow-lg hover:border-primary/30">
              <CardContent className="p-8 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand/10 text-brand mb-4">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  Learn About Us
                </h3>
                <p className="text-muted-foreground mb-6 text-sm leading-relaxed">
                  Discover our mission, meet our team, and understand how we are
                  revolutionizing the hiring process.
                </p>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/about">Learn More</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="transition-all hover:shadow-lg hover:border-primary/30">
              <CardContent className="p-8 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand/10 text-brand mb-4">
                  <CreditCard className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  View Pricing
                </h3>
                <p className="text-muted-foreground mb-6 text-sm leading-relaxed">
                  Free plan to get started. Transparent pricing for teams of any
                  size.
                </p>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/pricing">View Pricing</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Final CTA */}
        <section className="border-t bg-muted/50 py-20">
          <div className="container mx-auto px-6 text-center max-w-2xl">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Ready to Transform Your Hiring?
            </h2>
            <p className="text-muted-foreground mb-8">
              Join companies already using AI Video Interview to find their
              perfect candidates. Start free — no credit card required.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <SignInButton variant="default" size="lg" mode="register">
                Get Started Free
              </SignInButton>
              <SignInButton variant="outline" size="lg" mode="login">
                Sign In
              </SignInButton>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
