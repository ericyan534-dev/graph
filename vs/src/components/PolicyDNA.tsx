import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dna, TrendingUp, Users, DollarSign, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";

const PolicyDNA = () => {
  const dnaData = {
    title: "Infrastructure Investment and Jobs Act",
    id: "HR-2024-001",
    complexity: 78,
    stakeholderAlignment: 65,
    economicImpact: 92,
    timelineViability: 71,
    riskFactors: 34,
    publicSupport: 68,
    components: [
      {
        name: "Transportation Infrastructure",
        percentage: 45,
        budget: "$284B",
        status: "On Track",
        color: "chart-1",
      },
      {
        name: "Broadband Expansion",
        percentage: 25,
        budget: "$65B",
        status: "Delayed",
        color: "chart-2",
      },
      {
        name: "Clean Energy",
        percentage: 20,
        budget: "$73B",
        status: "On Track",
        color: "chart-3",
      },
      {
        name: "Water Infrastructure",
        percentage: 10,
        budget: "$55B",
        status: "Review",
        color: "chart-4",
      },
    ],
    keyMetrics: [
      { label: "Legislative Complexity", value: 78, icon: Dna, color: "chart-1" },
      { label: "Economic Impact Score", value: 92, icon: DollarSign, color: "chart-3" },
      { label: "Stakeholder Alignment", value: 65, icon: Users, color: "chart-2" },
      { label: "Timeline Viability", value: 71, icon: Clock, color: "chart-4" },
      { label: "Risk Assessment", value: 34, icon: AlertTriangle, color: "chart-6" },
      { label: "Public Support", value: 68, icon: TrendingUp, color: "chart-5" },
    ],
  };

  const getMetricColor = (value: number) => {
    if (value >= 75) return "bg-success";
    if (value >= 50) return "bg-warning";
    return "bg-destructive";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "On Track":
        return <Badge className="bg-success/10 text-success border-success/20"><CheckCircle2 className="h-3 w-3 mr-1" />{status}</Badge>;
      case "Delayed":
        return <Badge className="bg-warning/10 text-warning border-warning/20"><Clock className="h-3 w-3 mr-1" />{status}</Badge>;
      case "Review":
        return <Badge className="bg-chart-2/10 text-chart-2 border-chart-2/20"><AlertTriangle className="h-3 w-3 mr-1" />{status}</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="border-card-border shadow-lg gradient-subtle">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Dna className="h-6 w-6 text-primary" />
                <CardTitle>Policy DNA Analysis</CardTitle>
              </div>
              <CardDescription className="text-base">
                Deep structural analysis and component breakdown
              </CardDescription>
            </div>
            <Badge variant="outline" className="font-mono">
              {dnaData.id}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <h3 className="text-xl font-semibold mb-4">{dnaData.title}</h3>
          <p className="text-muted-foreground">
            Comprehensive breakdown of policy components, funding allocation, implementation status, and risk assessment.
          </p>
        </CardContent>
      </Card>

      {/* Key Metrics Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {dnaData.keyMetrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.label} className="border-card-border hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-lg bg-${metric.color}/10 flex items-center justify-center`}>
                    <Icon className={`h-5 w-5 text-${metric.color}`} />
                  </div>
                  <span className="text-2xl font-bold">{metric.value}%</span>
                </div>
                <p className="text-sm font-medium text-foreground mb-2">{metric.label}</p>
                <Progress value={metric.value} className="h-2" />
                <div className="mt-2 text-xs text-muted-foreground">
                  {metric.value >= 75 ? "Excellent" : metric.value >= 50 ? "Moderate" : "Needs Attention"}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Component Breakdown */}
      <Card className="border-card-border shadow-lg">
        <CardHeader>
          <CardTitle>Component Breakdown & Funding</CardTitle>
          <CardDescription>
            Budget allocation and implementation status across major policy components
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {dnaData.components.map((component) => (
            <div key={component.name} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-semibold text-foreground">{component.name}</h4>
                    {getStatusBadge(component.status)}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="font-mono font-semibold text-primary">{component.budget}</span>
                    <span>•</span>
                    <span>{component.percentage}% of total budget</span>
                  </div>
                </div>
              </div>
              <div className="relative">
                <Progress value={component.percentage} className="h-3" />
                <div
                  className="absolute top-0 left-0 h-3 rounded-full transition-all duration-500"
                  style={{
                    width: `${component.percentage}%`,
                    background: `hsl(var(--${component.color}))`,
                  }}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* DNA Helix Visualization */}
      <Card className="border-card-border shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Dna className="h-5 w-5 text-primary" />
            Policy Structure Visualization
          </CardTitle>
          <CardDescription>
            Visual representation of interconnected policy components
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative h-64 bg-gradient-to-br from-primary/5 via-accent/5 to-success/5 rounded-lg flex items-center justify-center overflow-hidden">
            {/* DNA Helix SVG Graphic */}
            <svg viewBox="0 0 400 200" className="w-full h-full">
              <defs>
                <linearGradient id="helix1" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="hsl(var(--chart-1))" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="hsl(var(--chart-2))" stopOpacity="0.8" />
                </linearGradient>
                <linearGradient id="helix2" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="hsl(var(--chart-3))" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="hsl(var(--chart-4))" stopOpacity="0.8" />
                </linearGradient>
              </defs>
              
              {/* Top helix strand */}
              <path
                d="M 20 60 Q 100 20, 180 60 T 340 60"
                fill="none"
                stroke="url(#helix1)"
                strokeWidth="4"
                className="animate-pulse-glow"
              />
              
              {/* Bottom helix strand */}
              <path
                d="M 20 140 Q 100 180, 180 140 T 340 140"
                fill="none"
                stroke="url(#helix2)"
                strokeWidth="4"
                className="animate-pulse-glow"
              />
              
              {/* Connecting rungs */}
              {[0, 1, 2, 3, 4].map((i) => {
                const x = 60 + i * 70;
                const y1 = i % 2 === 0 ? 50 : 70;
                const y2 = i % 2 === 0 ? 150 : 130;
                return (
                  <line
                    key={i}
                    x1={x}
                    y1={y1}
                    x2={x}
                    y2={y2}
                    stroke="hsl(var(--muted-foreground))"
                    strokeWidth="2"
                    opacity="0.3"
                  />
                );
              })}
              
              {/* Data nodes */}
              {[0, 1, 2, 3, 4].map((i) => {
                const x = 60 + i * 70;
                const y1 = i % 2 === 0 ? 50 : 70;
                const y2 = i % 2 === 0 ? 150 : 130;
                return (
                  <g key={`nodes-${i}`}>
                    <circle cx={x} cy={y1} r="6" fill="hsl(var(--chart-1))" opacity="0.9" />
                    <circle cx={x} cy={y2} r="6" fill="hsl(var(--chart-3))" opacity="0.9" />
                  </g>
                );
              })}
            </svg>
            
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center space-y-2 bg-card/90 backdrop-blur-sm rounded-lg px-6 py-4 border border-card-border">
                <p className="text-sm font-medium text-muted-foreground">Policy Complexity Score</p>
                <p className="text-4xl font-bold gradient-primary bg-clip-text text-transparent">
                  {dnaData.complexity}%
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PolicyDNA;
