import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { User, FileEdit } from "lucide-react";

type BlameEntry = {
  section: string;
  text: string;
  author: string;
  party: string;
  amendment: string;
  date: string;
};

const blameData: Record<string, BlameEntry[]> = {
  v1: [
    {
      section: "Section 1201",
      text: "States shall establish health insurance marketplaces...",
      author: "Rep. Charles Rangel",
      party: "D-NY",
      amendment: "Original",
      date: "Mar 2009",
    },
  ],
  v2: [
    {
      section: "Section 1201(4)",
      text: "States shall establish health insurance marketplaces no later than January 1, 2014...",
      author: "Rep. Henry Waxman",
      party: "D-CA",
      amendment: "H.Amdt 289",
      date: "Jul 2009",
    },
  ],
  v3: [
    {
      section: "Section 1201(4)",
      text: "States shall establish American Health Benefit Exchanges no later than January 1, 2014...",
      author: "Sen. Max Baucus",
      party: "D-MT",
      amendment: "SA 2786",
      date: "Dec 2009",
    },
    {
      section: "Section 1302",
      text: "Essential health benefits package shall include pediatric services...",
      author: "Sen. Tom Harkin",
      party: "D-IA",
      amendment: "SA 2791",
      date: "Dec 2009",
    },
  ],
  v4: [
    {
      section: "Section 1201(4)",
      text: "States shall establish American Health Benefit Exchanges no later than January 1, 2014...",
      author: "Sen. Max Baucus",
      party: "D-MT",
      amendment: "SA 2786",
      date: "Dec 2009",
    },
  ],
};

type BlameViewProps = {
  version: string;
};

export const BlameView = ({ version }: BlameViewProps) => {
  const entries = blameData[version] || [];

  return (
    <div className="space-y-3">
      {entries.map((entry, idx) => (
        <Card key={idx} className="border-border hover:border-primary/50 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-4 w-4 text-primary" />
              </div>

              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {entry.section}
                  </Badge>
                  <Badge
                    variant={entry.party.startsWith("D") ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {entry.party}
                  </Badge>
                </div>

                <p className="text-sm text-foreground italic">
                  "{entry.text}"
                </p>

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <FileEdit className="h-3 w-3" />
                    <span>{entry.author}</span>
                  </div>
                  <span>•</span>
                  <span>{entry.amendment}</span>
                  <span>•</span>
                  <span>{entry.date}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
