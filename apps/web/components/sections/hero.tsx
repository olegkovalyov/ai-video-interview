"use client";

import { SignInButton } from "@/features/auth"

export function Hero() {
  return (
    <section className="container mx-auto px-6 py-20 text-center">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
          Revolutionize Your{" "}
          <span className="text-yellow-400">AI-Powered Interviews</span>
        </h1>
        
        <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto leading-relaxed">
          Experience next-generation video interviews with AI analysis, 
          real-time feedback, and comprehensive candidate evaluation.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <SignInButton variant="brand" size="xl" mode="register">
            Create Account
          </SignInButton>
          <SignInButton variant="glass" size="xl" mode="login">
            Sign In
          </SignInButton>
        </div>
      </div>
    </section>
  )
}
