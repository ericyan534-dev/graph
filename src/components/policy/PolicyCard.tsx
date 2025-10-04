import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, TrendingUp, Clock, MapPin } from "lucide-react";

type Policy = {
  id: string;
  title: string;
  jurisdiction: string;
  status: string;
  lastAction: string;
  confidence: number;
  matchedSections: string[];
  year?: number; // Year of policy enactment
};

type PolicyCardProps = {
  policy: Policy;
};

export const PolicyCard = ({ policy }: PolicyCardProps) => {
  const navigate = useNavigate();

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return "text-success";
    if (confidence >= 75) return "text-warning";
    return "text-muted-foreground";
  };

  // Determine if policy is old (pre-2000) or modern (2000+)
  const isOldPolicy = policy.year && policy.year < 2000;
  const fontClass = isOldPolicy ? "font-classic" : "font-modern";

  return (
    <Card className="shadow-soft hover:shadow-medium transition-all border-border">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-5 w-5 text-foreground" />
              <h3 className={`text-lg font-semibold text-foreground ${fontClass}`}>
                {policy.title}
              </h3>
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
              <Badge variant="outline" className="gap-1">
                <MapPin className="h-3 w-3" />
                {policy.jurisdiction}
              </Badge>
              <Badge variant={policy.status === "Active" ? "default" : "secondary"}>
                {policy.status}
              </Badge>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <Clock className="h-4 w-4" />
              <span>{policy.lastAction}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-muted px-3 py-1 rounded-full">
            <TrendingUp
              className={`h-4 w-4 ${getConfidenceColor(policy.confidence)}`}
            />
            <span
              className={`text-sm font-semibold ${getConfidenceColor(
                policy.confidence
              )}`}
            >
              {policy.confidence}%
            </span>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <p className="text-sm font-medium text-foreground">
            Top matched sections:
          </p>
          <ul className="space-y-1">
            {policy.matchedSections.map((section, idx) => (
              <li
                key={idx}
                className="text-sm text-muted-foreground pl-4 relative before:content-['•'] before:absolute before:left-0"
              >
                {section}
              </li>
            ))}
          </ul>
        </div>

        <Button
          onClick={() => navigate(`/transparency/${policy.id}`)}
          className="w-full"
          variant="outline"
        >
          View DNA
        </Button>
      </CardContent>
    </Card>
  );
};
