import { Card, CardContent } from "@/components/ui/card"

export function Mission() {
  return (
    <section className="container mx-auto px-6 py-16">
      <Card className="bg-white/10 backdrop-blur-md border-white/20 max-w-5xl mx-auto">
        <CardContent className="p-12 text-center">
          <h2 className="text-3xl font-bold text-white mb-8">
            Our Mission
          </h2>
          
          <p className="text-xl text-white/90 leading-relaxed max-w-3xl mx-auto">
            To empower companies worldwide to find the perfect candidates faster and more accurately 
            than ever before, while providing candidates with a fair and engaging interview experience.
          </p>
        </CardContent>
      </Card>
    </section>
  )
}
