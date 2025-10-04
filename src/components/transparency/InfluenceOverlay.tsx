import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { InfluenceResult } from "@/types/orchestrator";

type InfluenceOverlayProps = {
  influence?: InfluenceResult;
  mode: "lobbying" | "finance";
};

export const InfluenceOverlay = ({ influence, mode }: InfluenceOverlayProps) => {
  const records = mode === "lobbying" ? influence?.lobbying ?? [] : influence?.finance ?? [];

  if (records.length === 0) {
    return (
      <div className="text-sm text-muted-foreground italic">
        No {mode === "lobbying" ? "lobbying" : "finance"} records matched this bill in the selected APIs.
      </div>
    );
  }

  if (mode === "lobbying") {
    return (
      <div className="space-y-3">
        {records.map((entry) => (
          <div
            key={entry.id}
            className="p-3 rounded-lg bg-muted/50 border border-border hover:border-primary/50 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-sm text-foreground">{entry.client}</span>
              <Badge variant="outline" className="text-xs">
                {entry.issue ?? "General issue"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mb-2">
              Registrant: {entry.registrant}
            </p>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{entry.period ?? "Recent"}</span>
              {entry.amount && <span>${entry.amount.toLocaleString()}</span>}
            </div>
            {entry.sourceUrl && (
              <a
                href={entry.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-primary hover:underline mt-2 inline-flex"
              >
                View filing
              </a>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {records.map((entry) => (
        <div
          key={entry.candidateId}
          className="p-3 rounded-lg bg-muted/50 border border-border hover:border-primary/50 transition-colors"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-sm text-foreground">{entry.committeeName}</span>
            {entry.cycle && <Badge variant="outline" className="text-xs">Cycle {entry.cycle}</Badge>}
          </div>
          <div className="text-xs text-muted-foreground">
            Total receipts: ${entry.totalReceipts?.toLocaleString() ?? "N/A"}
          </div>
          <Progress
            value={Math.min(100, ((entry.totalReceipts ?? 0) / 10_000_000) * 100)}
            className="h-1 mt-2"
          />
          {entry.sourceUrl && (
            <a
              href={entry.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-primary hover:underline mt-2 inline-flex"
            >
              View FEC detail
            </a>
          )}
        </div>
      ))}
    </div>
  );
};
