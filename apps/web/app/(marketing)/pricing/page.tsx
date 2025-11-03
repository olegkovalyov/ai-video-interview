"use client";

import { PricingPlans } from "@/components/sections/pricing-plans"
import { FAQ } from "@/components/sections/faq"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700">
      
      <main>
        {/* Hero Section */}
        <section className="container mx-auto px-6 py-20 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Simple,{" "}
              <span className="text-yellow-400">Transparent Pricing</span>
            </h1>
            
            <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto leading-relaxed">
              Choose the perfect plan for your hiring needs. All plans include our core AI analysis 
              and come with a 14-day free trial.
            </p>
          </div>
        </section>

        <PricingPlans />
        <FAQ />

        {/* Final CTA Section */}
        <section className="container mx-auto px-6 py-20">
          <Card className="bg-white/10 backdrop-blur-md border-white/20 max-w-4xl mx-auto">
            <CardContent className="p-12 text-center">
              <h2 className="text-3xl font-bold text-white mb-6">
                Ready to Transform Your Hiring Process?
              </h2>
              <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                Start your 14-day free trial today. No credit card required. 
                Cancel anytime. Setup takes less than 5 minutes.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild variant="brand" size="xl">
                  <Link href="/register">Start Free Trial</Link>
                </Button>
                <Button asChild variant="glass" size="xl">
                  <Link href="/about">Learn More</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
