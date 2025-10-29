"use client";

import { Header } from "@/components/layout/header"
import { Hero } from "@/components/sections/hero"
import { Features } from "@/components/sections/features"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { SignInButton } from "@/components/auth/sign-in-button"
import Link from "next/link"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700">
      <Header currentPage="home" />
      
      <main>
        <Hero />
        <Features />
        
        {/* Learn More Section */}
        <section className="container mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all duration-300">
              <CardContent className="p-8 text-center">
                <div className="text-4xl mb-4">ℹ️</div>
                <h3 className="text-xl font-semibold text-white mb-3">Learn About Us</h3>
                <p className="text-white/80 mb-6 leading-relaxed">
                  Discover our mission, meet our team, and understand how we're revolutionizing the hiring process.
                </p>
                <Button asChild variant="glass" className="w-full">
                  <Link href="/about">Learn More</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all duration-300">
              <CardContent className="p-8 text-center">
                <div className="text-4xl mb-4">💰</div>
                <h3 className="text-xl font-semibold text-white mb-3">View Pricing</h3>
                <p className="text-white/80 mb-6 leading-relaxed">
                  Explore our transparent pricing plans and find the perfect fit for your organization's needs.
                </p>
                <Button asChild variant="glass" className="w-full">
                  <Link href="/pricing">View Pricing</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="container mx-auto px-6 py-20">
          <Card className="bg-white/10 backdrop-blur-md border-white/20 max-w-4xl mx-auto">
            <CardContent className="p-12 text-center">
              <h2 className="text-3xl font-bold text-white mb-6">
                Ready to Transform Your Hiring?
              </h2>
              <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                Join thousands of companies already using AI Video Interview to find their perfect candidates.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <SignInButton variant="brand" size="xl">
                  Create Account
                </SignInButton>
                <SignInButton variant="glass" size="xl">
                  Sign In
                </SignInButton>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
