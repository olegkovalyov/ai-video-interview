"use client";

import { PricingPlans } from "@/components/sections/pricing-plans";
import { FAQ } from "@/components/sections/faq";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-brand/5 via-purple-50 to-info/5" />
          <div className="relative container mx-auto px-6 py-24 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 leading-tight tracking-tight">
              Simple,{" "}
              <span className="bg-gradient-to-r from-brand to-purple-600 bg-clip-text text-transparent">
                Transparent Pricing
              </span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Start free. Upgrade when you need more. All plans include AI
              analysis and scoring.
            </p>
          </div>
        </section>

        <PricingPlans />
        <FAQ />

        {/* Final CTA */}
        <section className="border-t bg-muted/50 py-20">
          <div className="container mx-auto px-6 text-center max-w-2xl">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Ready to Transform Your Hiring?
            </h2>
            <p className="text-muted-foreground mb-8">
              Start free today. No credit card required. Setup in under 5
              minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild size="lg">
                <Link href="/register">Start Free</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/about">Learn More</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
