import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Code2, Layers, Database, Zap } from "lucide-react";
import { Link } from "react-router-dom";

const About = () => {
  const techStack = [
    {
      category: "Frontend",
      icon: <Code2 className="h-5 w-5" />,
      color: "bg-primary/10 text-primary border-primary/20",
      technologies: [
        { name: "React", description: "UI library for building interactive interfaces" },
        { name: "TypeScript", description: "Type-safe JavaScript for robust code" },
        { name: "Tailwind CSS", description: "Utility-first CSS framework" },
        { name: "Vite", description: "Fast build tool and dev server" },
      ],
    },
    {
      category: "UI Components",
      icon: <Layers className="h-5 w-5" />,
      color: "bg-accent/10 text-accent border-accent/20",
      technologies: [
        { name: "Radix UI", description: "Accessible component primitives" },
        { name: "Lucide React", description: "Beautiful icon library" },
        { name: "Recharts", description: "Composable charting library" },
        { name: "Sonner", description: "Toast notifications" },
      ],
    },
    {
      category: "State & Routing",
      icon: <Zap className="h-5 w-5" />,
      color: "bg-success/10 text-success border-success/20",
      technologies: [
        { name: "React Router", description: "Client-side routing" },
        { name: "TanStack Query", description: "Data fetching and caching" },
        { name: "React Hook Form", description: "Form state management" },
        { name: "Zod", description: "Schema validation" },
      ],
    },
    {
      category: "Backend Ready",
      icon: <Database className="h-5 w-5" />,
      color: "bg-chart-2/10 text-chart-2 border-chart-2/20",
      technologies: [
        { name: "Lovable Cloud", description: "Integrated backend infrastructure" },
        { name: "PostgreSQL", description: "Relational database (via Lovable Cloud)" },
        { name: "Edge Functions", description: "Serverless compute (via Lovable Cloud)" },
        { name: "Authentication", description: "User management (via Lovable Cloud)" },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Chat
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-2xl font-bold gradient-text">About PolyScope</h1>
              <p className="text-sm text-muted-foreground">Built with modern web technologies</p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <Card className="p-8 mb-8 glass border-card-border">
          <h2 className="text-3xl font-bold mb-4">Technology Stack</h2>
          <p className="text-muted-foreground leading-relaxed">
            PolyScope is built using cutting-edge web technologies to deliver a fast, reliable, and 
            scalable policy transparency platform. Our tech stack combines the best tools for frontend 
            development, state management, and backend integration.
          </p>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {techStack.map((section) => (
            <Card key={section.category} className="p-6 glass border-card-border hover:shadow-glow transition-all">
              <div className="flex items-center gap-3 mb-6">
                <Badge className={section.color}>
                  {section.icon}
                </Badge>
                <h3 className="text-xl font-bold">{section.category}</h3>
              </div>
              
              <div className="space-y-4">
                {section.technologies.map((tech) => (
                  <div key={tech.name} className="border-l-2 border-primary/20 pl-4 py-2">
                    <h4 className="font-semibold text-foreground">{tech.name}</h4>
                    <p className="text-sm text-muted-foreground">{tech.description}</p>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>

        <Card className="p-8 mt-8 glass border-card-border">
          <h3 className="text-2xl font-bold mb-4">Why These Technologies?</h3>
          <div className="space-y-4 text-muted-foreground">
            <p>
              <strong className="text-foreground">React & TypeScript</strong> provide a solid foundation 
              for building complex, interactive interfaces with type safety and excellent developer experience.
            </p>
            <p>
              <strong className="text-foreground">Tailwind CSS</strong> enables rapid UI development with 
              a utility-first approach, ensuring consistent design and easy customization.
            </p>
            <p>
              <strong className="text-foreground">Radix UI</strong> delivers accessible, unstyled components 
              that we can customize to match our design system while maintaining WCAG compliance.
            </p>
            <p>
              <strong className="text-foreground">Lovable Cloud</strong> integration provides seamless backend 
              capabilities including authentication, database, and serverless functions without complex setup.
            </p>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default About;
