import { Card, CardContent } from "@/components/ui/card"

const stats = [
  { number: "500+", label: "Companies Trust Us" },
  { number: "50K+", label: "Interviews Conducted" },
  { number: "70%", label: "Faster Hiring Process" },
  { number: "95%", label: "Customer Satisfaction" }
]

export function Stats() {
  return (
    <section className="container mx-auto px-6 py-16">
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardContent className="p-12">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Trusted by Industry Leaders
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-yellow-400 mb-2">
                  {stat.number}
                </div>
                <div className="text-white/80 text-sm md:text-base">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
