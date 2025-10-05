import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, CheckCircle2, Clock, Dna, DollarSign, TrendingUp, Users } from "lucide-react";

type ComponentBreakdown = {
  name: string;
  percentage: number;
  budget: string;
  status: "On Track" | "Delayed" | "Review" | string;
  colorVar: string;
};

type Metric = {
  label: string;
  value: number;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  bgClass: string;
  textClass: string;
};

const statusBadge = (status: ComponentBreakdown["status"]) => {
  switch (status) {
    case "On Track":
      return (
        <Badge className="border-success/20 bg-success/10 text-success">
          <CheckCircle2 className="mr-1 h-3 w-3" />
          {status}
        </Badge>
      );
    case "Delayed":
      return (
        <Badge className="border-warning/20 bg-warning/10 text-warning">
          <Clock className="mr-1 h-3 w-3" />
          {status}
        </Badge>
      );
    case "Review":
      return (
        <Badge className="border-chart-2/20 bg-chart-2/10 text-chart-2">
          <AlertTriangle className="mr-1 h-3 w-3" />
          {status}
        </Badge>
      );
    default:
      return <Badge>{status}</Badge>;
  }
};

const PolicyDNA = () => {
  const dnaData = {
    title: "Infrastructure Investment and Jobs Act",
    id: "HR-2024-001",
    components: [
      {
        name: "Transportation Infrastructure",
        percentage: 45,
        budget: "$284B",
        status: "On Track" as const,
        colorVar: "chart-1",
      },
      {
        name: "Broadband Expansion",
        percentage: 25,
        budget: "$65B",
        status: "Delayed" as const,
        colorVar: "chart-2",
      },
      {
        name: "Clean Energy",
        percentage: 20,
        budget: "$73B",
        status: "On Track" as const,
        colorVar: "chart-3",
      },
      {
        name: "Water Infrastructure",
        percentage: 10,
        budget: "$55B",
        status: "Review" as const,
        colorVar: "chart-4",
      },
    ] as ComponentBreakdown[],
    keyMetrics: [
      { label: "Legislative Complexity", value: 78, icon: Dna, bgClass: "bg-chart-1/10", textClass: "text-chart-1" },
      { label: "Economic Impact Score", value: 92, icon: DollarSign, bgClass: "bg-chart-3/10", textClass: "text-chart-3" },
      { label: "Stakeholder Alignment", value: 65, icon: Users, bgClass: "bg-chart-2/10", textClass: "text-chart-2" },
      { label: "Timeline Viability", value: 71, icon: Clock, bgClass: "bg-chart-4/10", textClass: "text-chart-4" },
      { label: "Risk Assessment", value: 34, icon: AlertTriangle, bgClass: "bg-chart-6/10", textClass: "text-chart-6" },
      { label: "Public Support", value: 68, icon: TrendingUp, bgClass: "bg-chart-5/10", textClass: "text-chart-5" },
    ] as Metric[],
  };

  const describeValue = (value: number) => {
    if (value >= 75) return "Excellent";
    if (value >= 50) return "Moderate";
    return "Needs Attention";
  };

  return (
    <div className="space-y-6">
      <Card className="gradient-subtle border-card-border shadow-lg">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
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
          <h3 className="mb-4 text-xl font-semibold">{dnaData.title}</h3>
          <p className="text-muted-foreground">
            Comprehensive breakdown of policy components, funding allocation, implementation status, and risk assessment.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {dnaData.keyMetrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.label} className="border-card-border shadow-md transition-shadow hover:shadow-lg">
              <CardContent className="pt-6">
                <div className="mb-3 flex items-center justify-between">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${metric.bgClass}`}>
                    <Icon className={`h-5 w-5 ${metric.textClass}`} />
                  </div>
                  <span className="text-2xl font-bold">{metric.value}%</span>
                </div>
                <p className="mb-2 text-sm font-medium text-foreground">{metric.label}</p>
                <Progress value={metric.value} className="h-2" />
                <div className="mt-2 text-xs text-muted-foreground">{describeValue(metric.value)}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-card-border shadow-lg">
        <CardHeader>
          <CardTitle>Component Breakdown &amp; Funding</CardTitle>
          <CardDescription>
            Budget allocation and implementation status across major policy components
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {dnaData.components.map((component) => (
            <div key={component.name} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-3">
                    <h4 className="font-semibold text-foreground">{component.name}</h4>
                    {statusBadge(component.status)}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="font-mono font-semibold text-primary">{component.budget}</span>
                    <span>•</span>
                    <span>{component.percentage}% of total budget</span>
                  </div>
                </div>
              </div>
              <div className="relative h-3 overflow-hidden rounded-full bg-muted">
                <div
                  className="absolute left-0 top-0 h-full rounded-full"
                  style={{
                    width: `${component.percentage}%`,
                    background: `hsl(var(--${component.colorVar}))`,
                  }}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-card-border shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Dna className="h-5 w-5 text-primary" />
            Policy Structure Visualization
          </CardTitle>
          <CardDescription>Visual representation of interconnected policy components</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative flex h-64 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-primary/5 via-accent/5 to-success/5">
            <svg viewBox="0 0 400 200" className="h-full w-full">
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

              <path
                d="M 20 60 Q 100 20, 180 60 T 340 60"
                fill="none"
                stroke="url(#helix1)"
                strokeWidth="4"
                className="animate-pulse-glow"
              />
              <path
                d="M 20 140 Q 100 180, 180 140 T 340 140"
                fill="none"
                stroke="url(#helix2)"
                strokeWidth="4"
                className="animate-pulse-glow"
              />
              {[20, 100, 180, 260, 340].map((x, index) => (
                <circle key={x} cx={x} cy={index % 2 === 0 ? 60 : 140} r={12} fill="hsl(var(--chart-5))" fillOpacity="0.4" />
              ))}
              {[20, 100, 180, 260, 340].map((x, index) => (
                <circle key={`bottom-${x}`} cx={x} cy={index % 2 === 0 ? 140 : 60} r={8} fill="hsl(var(--chart-6))" fillOpacity="0.5" />
              ))}
            </svg>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PolicyDNA;
