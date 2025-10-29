import { Card, CardContent } from "@/components/ui/card"

const features = [
  {
    icon: "🎯",
    title: "Smart Analysis",
    description: "AI-powered evaluation of communication skills, technical knowledge, and personality traits."
  },
  {
    icon: "📊", 
    title: "Real-time Insights",
    description: "Get instant feedback and detailed reports on candidate performance and potential."
  },
  {
    icon: "🚀",
    title: "Streamlined Process", 
    description: "Reduce hiring time by 70% with automated screening and intelligent matching."
  }
]

export function Features() {
  return (
    <section className="container mx-auto px-6 py-16">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {features.map((feature, index) => (
          <Card key={index} className="bg-white/10 backdrop-blur-md border-white/20 text-white">
            <CardContent className="p-8 text-center">
              <div className="text-5xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-white/80 leading-relaxed">{feature.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
