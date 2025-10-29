import { Card, CardContent } from "@/components/ui/card"

const faqs = [
  {
    question: "What's included in the free trial?",
    answer: "All plans come with a 14-day free trial that includes full access to all features in your chosen plan. No credit card required to start."
  },
  {
    question: "Can I change plans anytime?",
    answer: "Yes! You can upgrade or downgrade your plan at any time. Changes take effect at your next billing cycle, and we'll prorate any differences."
  },
  {
    question: "What happens to my data if I cancel?", 
    answer: "Your data remains accessible for 30 days after cancellation. You can export all your interviews and candidate data during this period."
  },
  {
    question: "Do you offer volume discounts?",
    answer: "Yes! For organizations conducting more than 500 interviews per month, we offer custom pricing with significant discounts. Contact our sales team."
  }
]

export function FAQ() {
  return (
    <section className="container mx-auto px-6 py-16">
      <Card className="bg-white/10 backdrop-blur-md border-white/20 max-w-4xl mx-auto">
        <CardContent className="p-12">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-8">
            {faqs.map((faq, index) => (
              <div key={index}>
                <h3 className="text-xl font-semibold text-yellow-400 mb-3">
                  {faq.question}
                </h3>
                <p className="text-white/80 leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
