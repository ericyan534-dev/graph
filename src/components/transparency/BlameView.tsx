import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { User, FileEdit } from "lucide-react";
import type { PolicyBlameEntry } from "@/types/orchestrator";

type BlameViewProps = {
  entries: PolicyBlameEntry[];
};

const buildSummary = (entry: PolicyBlameEntry) => {
  if (entry.summary?.trim()) {
    return entry.summary.trim();
  }

  const fragments: string[] = [];
  if (entry.actionType) {
    fragments.push(entry.actionType);
  }
  if (entry.author) {
    fragments.push(`by ${entry.author}`);
  }
  if (entry.actionDate) {
    fragments.push(
      `on ${new Date(entry.actionDate).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })}`
    );
  }

  if (fragments.length === 0) {
    return "No additional details were returned for this clause.";
  }

  return fragments.join(" ");
};

export const BlameView = ({ entries }: BlameViewProps) => {
  if (entries.length === 0) {
    return (
      <div className="text-sm text-muted-foreground italic">
        No amendment attributions were returned for this bill.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {entries.map((entry, index) => (
        <Card
          key={`${entry.sectionId ?? "section"}-${entry.heading ?? index}`}
          className="border-border hover:border-primary/50 transition-colors"
        >
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-4 w-4 text-primary" />
              </div>

              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {entry.sectionId && (
                    <Badge variant="outline" className="text-xs">
                      {entry.sectionId}
                    </Badge>
                  )}
                  {entry.heading && (
                    <Badge variant="outline" className="text-xs">
                      {entry.heading}
                    </Badge>
                  )}
                </div>

                <p className="text-sm text-foreground italic">{buildSummary(entry)}</p>

                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  {entry.author && (
                    <div className="flex items-center gap-1">
                      <FileEdit className="h-3 w-3" />
                      <span>{entry.author}</span>
                    </div>
                  )}
                  {entry.actionType && <span>{entry.actionType}</span>}
                  {entry.actionDate && (
                    <span>{new Date(entry.actionDate).toLocaleDateString()}</span>
                  )}
                  {entry.sourceUri && (
                    <a
                      href={entry.sourceUri}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline"
                    >
                      Source
                    </a>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
