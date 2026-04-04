import { Card, CardContent } from "@/components/ui/card";

const faqs = [
  {
    question: "What's included in the free plan?",
    answer:
      "The free plan includes 3 interviews per month, AI analysis with scoring and recommendations, 5 templates, and email notifications. No credit card required.",
  },
  {
    question: "Can I change plans anytime?",
    answer:
      "Yes! You can upgrade or downgrade your plan at any time. Changes take effect at your next billing cycle, and we'll prorate any differences.",
  },
  {
    question: "How does AI analysis work?",
    answer:
      "After a candidate completes their interview, our AI scores each response on relevance, completeness, clarity, and depth (0-100). You get an overall score, hire/consider/reject recommendation, and detailed feedback.",
  },
  {
    question: "Do you offer volume discounts?",
    answer:
      "Yes! The Pro plan offers unlimited interviews. For custom enterprise needs, contact our sales team for tailored pricing.",
  },
];

export function FAQ() {
  return (
    <section className="container mx-auto px-6 py-16">
      <Card className="max-w-4xl mx-auto">
        <CardContent className="p-10">
          <h2 className="text-3xl font-bold text-foreground text-center mb-10">
            Frequently Asked Questions
          </h2>

          <div className="space-y-8">
            {faqs.map((faq, index) => (
              <div key={index}>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {faq.question}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
