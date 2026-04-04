import { Card, CardContent } from "@/components/ui/card";
import { Brain, BarChart3, Zap } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI Analysis",
    description:
      "Per-question scoring on relevance, completeness, clarity, and depth. Automatic hire/consider/reject recommendations.",
  },
  {
    icon: BarChart3,
    title: "Detailed Insights",
    description:
      "Comprehensive reports with strengths, weaknesses, and actionable feedback for every candidate.",
  },
  {
    icon: Zap,
    title: "Async Interviews",
    description:
      "Candidates respond on their own schedule. No more calendar coordination. Results in minutes, not weeks.",
  },
];

export function Features() {
  return (
    <section className="container mx-auto px-6 py-20">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-foreground mb-4">
          How It Works
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          A streamlined process from template creation to AI-powered analysis.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {features.map((feature, index) => (
          <Card
            key={index}
            className="group transition-all hover:shadow-lg hover:border-primary/30"
          >
            <CardContent className="p-8 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand/10 text-brand mb-5 group-hover:bg-brand group-hover:text-white transition-colors">
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-3">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed text-sm">
                {feature.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
