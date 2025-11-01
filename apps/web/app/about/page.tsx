"use client";

import { Header } from "@/components/layout/header"
import { Mission } from "@/components/sections/mission"
import { Stats } from "@/components/sections/stats"
import { Team } from "@/components/sections/team"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

const differentiators = [
  {
    icon: "🤖",
    title: "Advanced AI Analysis",
    description: "Our proprietary AI algorithms analyze facial expressions, speech patterns, and content quality to provide comprehensive candidate insights that go beyond traditional interviews."
  },
  {
    icon: "🎯", 
    title: "Precision Matching",
    description: "Match candidates to roles with unprecedented accuracy using machine learning models trained on thousands of successful hires across various industries."
  },
  {
    icon: "⚡",
    title: "Lightning Fast",
    description: "Reduce your hiring timeline from weeks to days. Get real-time candidate evaluation and instant recommendations as soon as interviews are completed."
  }
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700">
      <Header />
      
      <main>
        {/* Hero Section */}
        <section className="container mx-auto px-6 py-20 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
              About{" "}
              <span className="text-yellow-400">AI Video Interview</span>
            </h1>
            
            <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto leading-relaxed">
              We are revolutionizing the hiring process with cutting-edge AI technology 
              that makes interviews smarter, faster, and more effective.
            </p>
          </div>
        </section>

        <Mission />

        {/* What Makes Us Different */}
        <section className="container mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            What Makes Us Different
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {differentiators.map((item, index) => (
              <Card key={index} className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all duration-300">
                <CardContent className="p-8 text-center">
                  <div className="text-6xl mb-6">{item.icon}</div>
                  <h3 className="text-xl font-semibold text-white mb-4">
                    {item.title}
                  </h3>
                  <p className="text-white/80 leading-relaxed">
                    {item.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <Stats />
        <Team />

        {/* Final CTA Section */}
        <section className="container mx-auto px-6 py-20">
          <Card className="bg-white/10 backdrop-blur-md border-white/20 max-w-4xl mx-auto">
            <CardContent className="p-12 text-center">
              <h2 className="text-3xl font-bold text-white mb-6">
                Ready to Experience the Future of Hiring?
              </h2>
              <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                Join thousands of companies already using AI Video Interview to find their perfect candidates.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild variant="brand" size="xl">
                  <Link href="/register">Start Free Trial</Link>
                </Button>
                <Button asChild variant="glass" size="xl">
                  <Link href="/pricing">View Pricing</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
