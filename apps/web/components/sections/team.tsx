import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

const team = [
  {
    name: "Alex Johnson",
    role: "CEO & Co-founder", 
    bio: "Former VP of Engineering at TechCorp. 10+ years in AI and machine learning.",
    avatar: "👨‍💼"
  },
  {
    name: "Dr. Sarah Chen",
    role: "CTO & Co-founder",
    bio: "PhD in Computer Vision from Stanford. Leading expert in behavioral analysis AI.",
    avatar: "👩‍🔬"
  },
  {
    name: "Mike Rodriguez", 
    role: "Head of Product",
    bio: "Former Product Lead at Google. Passionate about creating intuitive user experiences.",
    avatar: "👨‍💻"
  }
]

export function Team() {
  return (
    <section className="container mx-auto px-6 py-16">
      <h2 className="text-3xl font-bold text-white text-center mb-12">
        Meet Our Team
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {team.map((member, index) => (
          <Card key={index} className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all duration-300">
            <CardContent className="p-8 text-center">
              <Avatar className="w-20 h-20 mx-auto mb-4 bg-yellow-400">
                <AvatarFallback className="text-2xl bg-yellow-400 text-gray-900">
                  {member.avatar}
                </AvatarFallback>
              </Avatar>
              
              <h3 className="text-xl font-semibold text-white mb-2">
                {member.name}
              </h3>
              
              <p className="text-yellow-400 text-sm font-medium mb-3">
                {member.role}
              </p>
              
              <p className="text-white/80 text-sm leading-relaxed">
                {member.bio}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
