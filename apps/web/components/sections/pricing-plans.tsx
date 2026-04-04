import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import Link from "next/link";

const plans = [
  {
    name: "Free",
    price: "$0",
    description: "Get started with basics",
    popular: false,
    features: [
      "3 interviews/month",
      "AI analysis & scoring",
      "5 templates",
      "Email notifications",
      "Community support",
    ],
  },
  {
    name: "Plus",
    price: "$29",
    description: "For growing teams",
    popular: true,
    features: [
      "100 interviews/month",
      "Advanced AI insights",
      "50 templates",
      "Priority support",
      "5 team members",
      "Analytics dashboard",
      "Custom branding",
    ],
  },
  {
    name: "Pro",
    price: "$99",
    description: "For large organizations",
    popular: false,
    features: [
      "Unlimited interviews",
      "Enterprise AI features",
      "Unlimited templates",
      "24/7 dedicated support",
      "Unlimited team members",
      "Advanced analytics",
      "API access & integrations",
    ],
  },
];

export function PricingPlans() {
  return (
    <section className="container mx-auto px-6 py-16">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {plans.map((plan, index) => (
          <Card
            key={index}
            className={`relative transition-all hover:shadow-lg ${
              plan.popular ? "border-brand border-2 shadow-lg scale-105" : ""
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-brand text-white font-semibold px-4 py-1">
                  MOST POPULAR
                </Badge>
              </div>
            )}

            <CardHeader className="text-center pb-4">
              <h3 className="text-xl font-bold text-foreground mb-1">
                {plan.name}
              </h3>
              <p className="text-muted-foreground text-sm">
                {plan.description}
              </p>

              <div className="mt-4">
                <div className="text-4xl font-bold text-foreground">
                  {plan.price}
                </div>
                <div className="text-muted-foreground text-sm mt-1">
                  per month
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              <div className="space-y-3 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <div
                    key={featureIndex}
                    className="flex items-center text-sm text-foreground"
                  >
                    <Check className="h-4 w-4 text-success mr-3 shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <Button
                asChild
                variant={plan.popular ? "default" : "outline"}
                className="w-full"
                size="lg"
              >
                <Link href="/register">
                  {plan.price === "$0" ? "Start Free" : "Start Free Trial"}
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
