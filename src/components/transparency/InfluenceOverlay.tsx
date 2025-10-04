import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

type InfluenceEntry = {
  name: string;
  amount?: string;
  industry?: string;
  votes?: string;
  party?: string;
};

const lobbyingData: InfluenceEntry[] = [
  { name: "PhRMA", amount: "$27.5M", industry: "Pharmaceuticals" },
  { name: "America's Health Insurance Plans", amount: "$8.9M", industry: "Insurance" },
  { name: "AMA", amount: "$21.5M", industry: "Healthcare" },
];

const sponsorData: InfluenceEntry[] = [
  { name: "Sen. Max Baucus", party: "D-MT", votes: "Key sponsor" },
  { name: "Sen. Chuck Grassley", party: "R-IA", votes: "Co-sponsor" },
  { name: "Sen. Tom Harkin", party: "D-IA", votes: "Co-sponsor" },
];

type InfluenceOverlayProps = {
  type: "lobbying" | "sponsors";
};

export const InfluenceOverlay = ({ type }: InfluenceOverlayProps) => {
  const data = type === "lobbying" ? lobbyingData : sponsorData;

  return (
    <div className="space-y-3">
      {data.map((entry, idx) => (
        <div
          key={idx}
          className="p-3 rounded-lg bg-muted/50 border border-border hover:border-primary/50 transition-colors"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-sm text-foreground">
              {entry.name}
            </span>
            {entry.amount && (
              <span className="text-sm font-semibold text-primary">
                {entry.amount}
              </span>
            )}
            {entry.party && (
              <Badge
                variant={entry.party.startsWith("D") ? "default" : "secondary"}
                className="text-xs"
              >
                {entry.party}
              </Badge>
            )}
          </div>

          {entry.industry && (
            <Badge variant="outline" className="text-xs mb-2">
              {entry.industry}
            </Badge>
          )}

          {entry.votes && (
            <p className="text-xs text-muted-foreground">{entry.votes}</p>
          )}

          {type === "lobbying" && (
            <Progress value={33 + idx * 20} className="h-1 mt-2" />
          )}
        </div>
      ))}
    </div>
  );
};
