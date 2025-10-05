import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, TrendingUp, MapPin, Clock } from "lucide-react";
import type { PolicySearchHit } from "@/types/orchestrator";

type PolicyCardProps = {
  policy: PolicySearchHit;
};

export const PolicyCard = ({ policy }: PolicyCardProps) => {
  const navigate = useNavigate();

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return "text-success";
    if (confidence >= 75) return "text-warning";
    return "text-muted-foreground";
  };

  const getStatusClasses = (status: string | undefined) => {
    const normalized = (status ?? "").toLowerCase();

    if (normalized.includes("pass") || normalized.includes("law")) {
      return "bg-chart-2/10 text-chart-2 border-chart-2/20";
    }

    if (normalized.includes("committee") || normalized.includes("pending")) {
      return "bg-warning/10 text-warning border-warning/20";
    }

    if (normalized.includes("active") || normalized.includes("progress")) {
      return "bg-success/10 text-success border-success/20";
    }

    return "bg-muted text-muted-foreground border-border/60";
  };

  const fontClass = "font-modern";

  return (
    <Card className="glass border-card-border transition-all hover:shadow-glow">
      <CardContent className="space-y-5 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="font-mono text-xs">
                {policy.billId}
              </Badge>
              <Badge variant="outline" className="gap-1 text-xs">
                <MapPin className="h-3 w-3" />
                {policy.jurisdiction}
              </Badge>
              <Badge className={getStatusClasses(policy.status)} variant={"outline"}>
                {(policy.status ?? "Unknown").replace(/\b\w/g, (char) => char.toUpperCase())}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <FileText className="h-5 w-5 text-primary" />
              <h3 className={`text-lg ${fontClass}`}>{policy.title}</h3>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{policy.latestAction ?? "No recent action"}</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 rounded-full bg-muted px-3 py-2 text-right">
            <span className="text-xs font-medium text-muted-foreground">Confidence</span>
            <div className="flex items-center gap-2">
              <TrendingUp className={`h-4 w-4 ${getConfidenceColor(policy.confidence)}`} />
              <span className={`text-sm font-semibold ${getConfidenceColor(policy.confidence)}`}>
                {policy.confidence}%
              </span>
            </div>
          </div>
        </div>

        {policy.sections.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">Top matched sections</p>
            <ul className="space-y-2">
              {policy.sections.map((section, idx) => (
                <li
                  key={section.id ?? `${policy.billId}-section-${idx}`}
                  className="relative flex flex-col gap-1 rounded-lg border border-dashed border-border/60 bg-muted/40 p-3 text-sm text-muted-foreground"
                >
                  <span className="font-medium text-foreground">
                    {section.heading ?? "Relevant excerpt"}
                  </span>
                  <span>{section.snippet}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <Button
          onClick={() => navigate(`/transparency/${policy.billId}`)}
          className="w-full gradient-primary text-primary-foreground shadow-glow transition-all hover:shadow-xl"
        >
          View Transparency Graph
        </Button>
      </CardContent>
    </Card>
  );
};
