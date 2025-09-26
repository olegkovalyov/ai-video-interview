"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function RegisterPage() {
  const handleRegister = () => {
    // TODO: Implement Keycloak registration
    console.log('TODO: Implement Keycloak registration');
    alert('Registration not implemented for Keycloak yet');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 flex items-center justify-center p-6">
      <Link 
        href="/" 
        className="absolute top-6 left-6 text-white text-2xl font-bold hover:text-yellow-400 transition-colors"
      >
        🎥 AI Video Interview
      </Link>
      
      <Card className="bg-white/10 backdrop-blur-md border-white/20 w-full max-w-md">
        <CardContent className="p-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-6">
            Create Account
          </h1>
          
          <p className="text-white/90 mb-8 leading-relaxed">
            Join AI Video Interview platform to revolutionize your hiring process with intelligent candidate evaluation.
          </p>
          
          <Button 
            onClick={handleRegister}
            variant="brand"
            size="lg"
            className="w-full mb-6 cursor-pointer hover:shadow-lg transition-all duration-200"
          >
            Continue with Keycloak
          </Button>
          
          <p className="text-white/90 mb-6">
            Already have an account?{" "}
            <Link 
              href="/login"
              className="text-yellow-400 hover:text-yellow-300 font-semibold transition-colors"
            >
              Sign in
            </Link>
          </p>
          
          <div className="bg-white/5 border border-white/10 p-4 rounded-lg">
            <p className="text-white/80 text-sm">
              You'll be redirected to our secure registration system. After creating your account, you'll automatically return to the dashboard.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
