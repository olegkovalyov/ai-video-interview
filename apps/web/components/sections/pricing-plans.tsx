import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check } from "lucide-react"
import Link from "next/link"

const plans = [
  {
    name: "Starter",
    price: "$29",
    description: "Perfect for small teams",
    popular: false,
    features: [
      "Up to 50 interviews/month",
      "Basic AI analysis",
      "Standard templates",
      "Email support",
      "Video recording storage (30 days)"
    ]
  },
  {
    name: "Professional", 
    price: "$99",
    description: "For growing companies",
    popular: true,
    features: [
      "Up to 200 interviews/month",
      "Advanced AI analysis & insights",
      "Custom question templates",
      "Priority support", 
      "Video recording storage (90 days)",
      "Team collaboration tools",
      "Advanced analytics dashboard"
    ]
  },
  {
    name: "Enterprise",
    price: "$299", 
    description: "For large organizations",
    popular: false,
    features: [
      "Unlimited interviews",
      "Enterprise AI features",
      "White-label solution",
      "24/7 dedicated support",
      "Unlimited storage",
      "Custom integrations",
      "Advanced security & compliance"
    ]
  }
]

export function PricingPlans() {
  return (
    <section className="container mx-auto px-6 py-16">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {plans.map((plan, index) => (
          <Card 
            key={index} 
            className={`relative bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all duration-300 ${
              plan.popular ? 'border-yellow-400 border-2' : ''
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-yellow-400 text-gray-900 font-semibold px-4 py-1">
                  MOST POPULAR
                </Badge>
              </div>
            )}
            
            <CardHeader className="text-center pb-6">
              <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
              <p className="text-white/70">{plan.description}</p>
              
              <div className="mt-6">
                <div className="text-5xl font-bold text-yellow-400">{plan.price}</div>
                <div className="text-white/60 text-sm mt-1">per month</div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="space-y-3 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <div key={featureIndex} className="flex items-center text-white/90">
                    <Check className="h-4 w-4 text-yellow-400 mr-3 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
              
              <Button 
                asChild 
                variant={plan.popular ? "brand" : "glass"} 
                className="w-full"
                size="lg"
              >
                <Link href="/register">
                  {plan.name === "Enterprise" ? "Contact Sales" : "Start Free Trial"}
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
