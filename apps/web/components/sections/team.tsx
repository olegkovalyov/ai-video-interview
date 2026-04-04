import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const team = [
  {
    name: "Alex Johnson",
    role: "CEO & Co-founder",
    bio: "Former VP of Engineering at TechCorp. 10+ years in AI and machine learning.",
    initials: "AJ",
  },
  {
    name: "Dr. Sarah Chen",
    role: "CTO & Co-founder",
    bio: "PhD in Computer Vision from Stanford. Leading expert in behavioral analysis AI.",
    initials: "SC",
  },
  {
    name: "Mike Rodriguez",
    role: "Head of Product",
    bio: "Former Product Lead at Google. Passionate about creating intuitive user experiences.",
    initials: "MR",
  },
];

export function Team() {
  return (
    <section className="container mx-auto px-6 py-16">
      <h2 className="text-3xl font-bold text-foreground text-center mb-12">
        Meet Our Team
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {team.map((member, index) => (
          <Card
            key={index}
            className="transition-all hover:shadow-lg hover:border-primary/30"
          >
            <CardContent className="p-8 text-center">
              <Avatar className="w-16 h-16 mx-auto mb-4">
                <AvatarFallback className="bg-brand/10 text-brand text-lg font-semibold">
                  {member.initials}
                </AvatarFallback>
              </Avatar>

              <h3 className="text-lg font-semibold text-foreground mb-1">
                {member.name}
              </h3>
              <p className="text-brand text-sm font-medium mb-3">
                {member.role}
              </p>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {member.bio}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
