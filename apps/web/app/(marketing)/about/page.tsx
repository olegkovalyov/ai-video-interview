"use client";

import { Mission } from "@/components/sections/mission";
import { Stats } from "@/components/sections/stats";
import { Team } from "@/components/sections/team";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Brain, Target, Zap } from "lucide-react";

const differentiators = [
  {
    icon: Brain,
    title: "Advanced AI Analysis",
    description:
      "Proprietary AI algorithms analyze responses for relevance, completeness, clarity, and depth — providing comprehensive candidate insights beyond traditional interviews.",
  },
  {
    icon: Target,
    title: "Precision Scoring",
    description:
      "4-criteria weighted scoring (0-100) with automatic hire/consider/reject recommendations calibrated on real hiring outcomes.",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description:
      "Asynchronous interviews eliminate scheduling. Candidates record on their time, AI analyzes in minutes — reducing hiring timelines from weeks to days.",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-brand/5 via-purple-50 to-info/5" />
          <div className="relative container mx-auto px-6 py-24 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 leading-tight tracking-tight">
              About{" "}
              <span className="bg-gradient-to-r from-brand to-purple-600 bg-clip-text text-transparent">
                AI Video Interview
              </span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              We are revolutionizing the hiring process with cutting-edge AI
              technology that makes interviews smarter, faster, and more
              effective.
            </p>
          </div>
        </section>

        <Mission />

        {/* Differentiators */}
        <section className="container mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-foreground text-center mb-12">
            What Makes Us Different
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {differentiators.map((item, index) => (
              <Card
                key={index}
                className="group transition-all hover:shadow-lg hover:border-primary/30"
              >
                <CardContent className="p-8 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand/10 text-brand mb-5 group-hover:bg-brand group-hover:text-white transition-colors">
                    <item.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-3">
                    {item.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed text-sm">
                    {item.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <Stats />
        <Team />

        {/* Final CTA */}
        <section className="bg-gradient-to-r from-brand to-purple-600 py-20">
          <div className="container mx-auto px-6 text-center max-w-3xl">
            <h2 className="text-3xl font-bold text-white mb-6">
              Ready to Experience the Future of Hiring?
            </h2>
            <p className="text-lg text-white/90 mb-8">
              Join companies already using AI Video Interview to find their
              perfect candidates.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild variant="secondary" size="xl">
                <Link href="/register">Start Free</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="xl"
                className="border-white/30 text-white hover:bg-white/10"
              >
                <Link href="/pricing">View Pricing</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
