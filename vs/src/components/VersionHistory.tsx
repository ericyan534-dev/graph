import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { History, GitBranch, FileText, Users2, Calendar, ArrowRight, AlertCircle } from "lucide-react";

const VersionHistory = () => {
  const versions = [
    {
      version: "v4.2",
      date: "2024-03-15",
      status: "Current",
      changes: "Added clean energy provisions and expanded broadband funding by $12B",
      author: "Senate Committee on Commerce",
      impact: "High",
      amendments: 8,
    },
    {
      version: "v4.1",
      date: "2024-02-28",
      status: "Superseded",
      changes: "Adjusted transportation budget allocation and timeline requirements",
      author: "House Infrastructure Committee",
      impact: "Medium",
      amendments: 5,
    },
    {
      version: "v4.0",
      date: "2024-02-10",
      status: "Superseded",
      changes: "Major revision - restructured funding mechanisms and oversight",
      author: "Joint Conference Committee",
      impact: "Critical",
      amendments: 23,
    },
    {
      version: "v3.5",
      date: "2024-01-20",
      status: "Superseded",
      changes: "Minor amendments to environmental impact assessment requirements",
      author: "Senate Committee on Environment",
      impact: "Low",
      amendments: 3,
    },
    {
      version: "v3.0",
      date: "2024-01-05",
      status: "Superseded",
      changes: "Initial comprehensive draft with major policy frameworks",
      author: "Original Sponsors",
      impact: "Critical",
      amendments: 0,
    },
  ];

  const getStatusBadge = (status: string) => {
    return status === "Current" ? (
      <Badge className="bg-success/10 text-success border-success/20">Current</Badge>
    ) : (
      <Badge variant="outline">Superseded</Badge>
    );
  };

  const getImpactBadge = (impact: string) => {
    switch (impact) {
      case "Critical":
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Critical</Badge>;
      case "High":
        return <Badge className="bg-warning/10 text-warning border-warning/20">High</Badge>;
      case "Medium":
        return <Badge className="bg-chart-2/10 text-chart-2 border-chart-2/20">Medium</Badge>;
      case "Low":
        return <Badge className="bg-muted-foreground/10 text-muted-foreground border-muted-foreground/20">Low</Badge>;
      default:
        return <Badge>{impact}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-card-border shadow-lg gradient-subtle">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <History className="h-6 w-6 text-primary" />
            <CardTitle>Version History & Amendment Tracking</CardTitle>
          </div>
          <CardDescription className="text-base">
            Complete audit trail of all policy revisions, amendments, and modifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-lg bg-primary/5">
              <GitBranch className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">5</p>
              <p className="text-xs text-muted-foreground">Total Versions</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-chart-4/5">
              <FileText className="h-8 w-8 mx-auto mb-2 text-chart-4" />
              <p className="text-2xl font-bold">39</p>
              <p className="text-xs text-muted-foreground">Amendments</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-chart-3/5">
              <Users2 className="h-8 w-8 mx-auto mb-2 text-chart-3" />
              <p className="text-2xl font-bold">12</p>
              <p className="text-xs text-muted-foreground">Contributors</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-chart-2/5">
              <Calendar className="h-8 w-8 mx-auto mb-2 text-chart-2" />
              <p className="text-2xl font-bold">72</p>
              <p className="text-xs text-muted-foreground">Days Active</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card className="border-card-border shadow-lg">
        <CardHeader>
          <CardTitle>Version Timeline</CardTitle>
          <CardDescription>
            Chronological history of all policy versions and their key changes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6 relative">
            {/* Timeline line */}
            <div className="absolute left-8 top-6 bottom-6 w-0.5 bg-gradient-to-b from-primary via-accent to-muted" />

            {versions.map((version, index) => (
              <div key={version.version} className="relative flex gap-6 group">
                {/* Timeline dot */}
                <div className="relative z-10 flex-shrink-0">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                    version.status === "Current" 
                      ? "bg-gradient-primary shadow-glow" 
                      : "bg-muted border-2 border-border"
                  }`}>
                    <span className={`text-sm font-bold ${
                      version.status === "Current" ? "text-primary-foreground" : "text-muted-foreground"
                    }`}>
                      {version.version}
                    </span>
                  </div>
                  {index < versions.length - 1 && (
                    <ArrowRight className="absolute -bottom-8 left-1/2 -translate-x-1/2 h-5 w-5 text-muted-foreground/30" />
                  )}
                </div>

                {/* Content card */}
                <div className="flex-1 pb-8">
                  <Card className="border-card-border hover:shadow-md transition-shadow group-hover:border-primary/30">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {getStatusBadge(version.status)}
                          {getImpactBadge(version.impact)}
                        </div>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {new Date(version.date).toLocaleDateString()}
                        </div>
                      </div>

                      <p className="text-foreground mb-3 leading-relaxed">
                        {version.changes}
                      </p>

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-4 text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Users2 className="h-4 w-4" />
                            <span>{version.author}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <AlertCircle className="h-4 w-4" />
                            <span>{version.amendments} amendments</span>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="gap-1.5">
                          View Details
                          <FileText className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Change Summary */}
      <Card className="border-card-border shadow-lg">
        <CardHeader>
          <CardTitle>Key Changes Across Versions</CardTitle>
          <CardDescription>
            Summary of major modifications and their legislative impact
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg border border-success/20 bg-success/5">
              <h4 className="font-semibold text-success mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Additions
              </h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Clean energy provisions ($12B)</li>
                <li>• Expanded broadband coverage</li>
                <li>• Enhanced oversight mechanisms</li>
              </ul>
            </div>
            <div className="p-4 rounded-lg border border-warning/20 bg-warning/5">
              <h4 className="font-semibold text-warning mb-2 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Modifications
              </h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Budget reallocation adjustments</li>
                <li>• Timeline requirement updates</li>
                <li>• Environmental impact criteria</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VersionHistory;
