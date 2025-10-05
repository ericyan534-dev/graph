import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Building2, DollarSign, Network, TrendingUp, Users } from "lucide-react";

type Stakeholder = {
  entity: string;
  type: string;
  influence: number;
  funding: string;
  position: "Support" | "Oppose";
  connections: number;
};

const stakeholders: Stakeholder[] = [
  {
    entity: "National Infrastructure Coalition",
    type: "Advocacy Group",
    influence: 92,
    funding: "$4.2M",
    position: "Support",
    connections: 28,
  },
  {
    entity: "Energy Sector Alliance",
    type: "Industry Group",
    influence: 85,
    funding: "$7.8M",
    position: "Support",
    connections: 42,
  },
  {
    entity: "Fiscal Responsibility Forum",
    type: "Think Tank",
    influence: 73,
    funding: "$2.1M",
    position: "Oppose",
    connections: 19,
  },
  {
    entity: "Rural Development Association",
    type: "Community Group",
    influence: 68,
    funding: "$1.5M",
    position: "Support",
    connections: 15,
  },
  {
    entity: "Technology Innovation Council",
    type: "Industry Group",
    influence: 81,
    funding: "$5.3M",
    position: "Support",
    connections: 34,
  },
];

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const positionBadge = (position: Stakeholder["position"]) =>
  position === "Support" ? (
    <Badge className="border-success/20 bg-success/10 text-success">Support</Badge>
  ) : (
    <Badge className="border-destructive/20 bg-destructive/10 text-destructive">Oppose</Badge>
  );

const InfluenceTracker = () => (
  <div className="space-y-6">
    <Card className="gradient-subtle border-card-border shadow-lg">
      <CardHeader>
        <div className="mb-2 flex items-center gap-2">
          <Network className="h-6 w-6 text-primary" />
          <CardTitle>Influence Mapping &amp; Stakeholder Analysis</CardTitle>
        </div>
        <CardDescription className="text-base">
          Track lobbying efforts, funding sources, and stakeholder positions on policy initiatives
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-lg bg-primary/5 p-4 text-center">
            <Users className="mx-auto mb-2 h-8 w-8 text-primary" />
            <p className="text-2xl font-bold">127</p>
            <p className="text-xs text-muted-foreground">Active Stakeholders</p>
          </div>
          <div className="rounded-lg bg-chart-3/10 p-4 text-center">
            <DollarSign className="mx-auto mb-2 h-8 w-8 text-chart-3" />
            <p className="text-2xl font-bold">$24.7M</p>
            <p className="text-xs text-muted-foreground">Total Funding</p>
          </div>
          <div className="rounded-lg bg-success/10 p-4 text-center">
            <TrendingUp className="mx-auto mb-2 h-8 w-8 text-success" />
            <p className="text-2xl font-bold">68%</p>
            <p className="text-xs text-muted-foreground">Support Rate</p>
          </div>
          <div className="rounded-lg bg-chart-2/10 p-4 text-center">
            <Building2 className="mx-auto mb-2 h-8 w-8 text-chart-2" />
            <p className="text-2xl font-bold">42</p>
            <p className="text-xs text-muted-foreground">Organizations</p>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card className="border-card-border shadow-lg">
      <CardHeader>
        <CardTitle>Key Stakeholders &amp; Influence Metrics</CardTitle>
        <CardDescription>Detailed breakdown of stakeholder involvement and policy positions</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {stakeholders.map((stakeholder) => (
          <div
            key={stakeholder.entity}
            className="flex items-center gap-4 rounded-lg border border-card-border p-4 transition-all duration-300 hover:border-primary/30 hover:shadow-lg"
          >
            <Avatar className="h-12 w-12 bg-gradient-primary">
              <AvatarFallback className="bg-transparent text-primary-foreground font-semibold">
                {getInitials(stakeholder.entity)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center gap-2">
                <h4 className="truncate font-semibold text-foreground">{stakeholder.entity}</h4>
                {positionBadge(stakeholder.position)}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <Badge variant="outline" className="text-xs">
                  {stakeholder.type}
                </Badge>
                <span className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  {stakeholder.funding}
                </span>
                <span className="flex items-center gap-1">
                  <Network className="h-3 w-3" />
                  {stakeholder.connections} connections
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="mb-1 text-2xl font-bold text-primary">{stakeholder.influence}</div>
              <div className="text-xs text-muted-foreground">Influence Score</div>
              <div className="mt-2 h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-gradient-primary"
                  style={{ width: `${stakeholder.influence}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>

    <Card className="border-card-border shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Network className="h-5 w-5 text-primary" />
          Stakeholder Network Graph
        </CardTitle>
        <CardDescription>Visual representation of stakeholder relationships and influence patterns</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative flex h-80 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-primary/5 via-accent/5 to-muted">
          <svg viewBox="0 0 500 300" className="h-full w-full">
            <defs>
              <radialGradient id="nodeGradient">
                <stop offset="0%" stopColor="hsl(var(--primary))" />
                <stop offset="100%" stopColor="hsl(var(--primary-glow))" />
              </radialGradient>
            </defs>
            {[
              [250, 150, 150, 80],
              [250, 150, 350, 80],
              [250, 150, 100, 200],
              [250, 150, 400, 200],
              [250, 150, 250, 250],
              [150, 80, 350, 80],
              [100, 200, 400, 200],
            ].map((line, index) => (
              <line
                key={`line-${index}`}
                x1={line[0]}
                y1={line[1]}
                x2={line[2]}
                y2={line[3]}
                stroke="hsl(var(--primary) / 0.25)"
                strokeWidth={2}
              />
            ))}
            {[
              [250, 150, 14],
              [150, 80, 12],
              [350, 80, 12],
              [100, 200, 12],
              [400, 200, 12],
              [250, 250, 10],
            ].map((node, index) => (
              <circle key={`node-${index}`} cx={node[0]} cy={node[1]} r={node[2]} fill="url(#nodeGradient)" fillOpacity={0.9} />
            ))}
          </svg>
        </div>
      </CardContent>
    </Card>
  </div>
);

export default InfluenceTracker;
