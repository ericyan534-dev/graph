import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, Building2, TrendingUp, DollarSign, Network } from "lucide-react";

const InfluenceTracker = () => {
  const influenceData = [
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

  const getPositionBadge = (position: string) => {
    return position === "Support" ? (
      <Badge className="bg-success/10 text-success border-success/20">Support</Badge>
    ) : (
      <Badge className="bg-destructive/10 text-destructive border-destructive/20">Oppose</Badge>
    );
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-card-border shadow-lg gradient-subtle">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Network className="h-6 w-6 text-primary" />
            <CardTitle>Influence Mapping & Stakeholder Analysis</CardTitle>
          </div>
          <CardDescription className="text-base">
            Track lobbying efforts, funding sources, and stakeholder positions on policy initiatives
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-lg bg-primary/5">
              <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">127</p>
              <p className="text-xs text-muted-foreground">Active Stakeholders</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-chart-3/5">
              <DollarSign className="h-8 w-8 mx-auto mb-2 text-chart-3" />
              <p className="text-2xl font-bold">$24.7M</p>
              <p className="text-xs text-muted-foreground">Total Funding</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-success/5">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 text-success" />
              <p className="text-2xl font-bold">68%</p>
              <p className="text-xs text-muted-foreground">Support Rate</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-chart-2/5">
              <Building2 className="h-8 w-8 mx-auto mb-2 text-chart-2" />
              <p className="text-2xl font-bold">42</p>
              <p className="text-xs text-muted-foreground">Organizations</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stakeholder List */}
      <Card className="border-card-border shadow-lg">
        <CardHeader>
          <CardTitle>Key Stakeholders & Influence Metrics</CardTitle>
          <CardDescription>
            Detailed breakdown of stakeholder involvement and policy positions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {influenceData.map((stakeholder, index) => (
            <div
              key={stakeholder.entity}
              className="flex items-center gap-4 p-4 rounded-lg border border-card-border hover:shadow-md transition-all duration-300 hover:border-primary/30"
            >
              <Avatar className="h-12 w-12 bg-gradient-primary">
                <AvatarFallback className="bg-transparent text-primary-foreground font-semibold">
                  {getInitials(stakeholder.entity)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-foreground truncate">{stakeholder.entity}</h4>
                  {getPositionBadge(stakeholder.position)}
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
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
                <div className="text-2xl font-bold text-primary mb-1">
                  {stakeholder.influence}
                </div>
                <div className="text-xs text-muted-foreground">Influence Score</div>
                <div className="mt-2 h-1.5 w-20 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-primary transition-all duration-500"
                    style={{ width: `${stakeholder.influence}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Network Visualization */}
      <Card className="border-card-border shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5 text-primary" />
            Stakeholder Network Graph
          </CardTitle>
          <CardDescription>
            Visual representation of stakeholder relationships and influence patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative h-80 bg-gradient-to-br from-primary/5 via-accent/5 to-muted rounded-lg flex items-center justify-center overflow-hidden">
            {/* Network visualization */}
            <svg viewBox="0 0 500 300" className="w-full h-full">
              <defs>
                <radialGradient id="nodeGradient">
                  <stop offset="0%" stopColor="hsl(var(--primary))" />
                  <stop offset="100%" stopColor="hsl(var(--primary-glow))" />
                </radialGradient>
              </defs>

              {/* Connection lines */}
              {[
                [250, 150, 150, 80],
                [250, 150, 350, 80],
                [250, 150, 100, 200],
                [250, 150, 400, 200],
                [250, 150, 250, 250],
                [150, 80, 350, 80],
                [100, 200, 400, 200],
              ].map((line, i) => (
                <line
                  key={i}
                  x1={line[0]}
                  y1={line[1]}
                  x2={line[2]}
                  y2={line[3]}
                  stroke="hsl(var(--muted-foreground))"
                  strokeWidth="1.5"
                  opacity="0.2"
                  strokeDasharray="4,4"
                />
              ))}

              {/* Nodes */}
              {[
                { x: 250, y: 150, r: 30, label: "Bill" },
                { x: 150, y: 80, r: 20, label: "A" },
                { x: 350, y: 80, r: 25, label: "B" },
                { x: 100, y: 200, r: 18, label: "C" },
                { x: 400, y: 200, r: 22, label: "D" },
                { x: 250, y: 250, r: 16, label: "E" },
              ].map((node, i) => (
                <g key={i}>
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={node.r}
                    fill="url(#nodeGradient)"
                    opacity="0.8"
                    className="animate-pulse-glow"
                  />
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={node.r - 5}
                    fill="hsl(var(--card))"
                    opacity="0.9"
                  />
                  <text
                    x={node.x}
                    y={node.y + 4}
                    textAnchor="middle"
                    fontSize="12"
                    fill="hsl(var(--foreground))"
                    fontWeight="600"
                  >
                    {node.label}
                  </text>
                </g>
              ))}
            </svg>

            <div className="absolute bottom-4 left-4 bg-card/90 backdrop-blur-sm rounded-lg px-4 py-2 border border-card-border">
              <p className="text-xs text-muted-foreground">Interactive network analysis</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InfluenceTracker;
