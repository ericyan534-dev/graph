import { Badge } from "@/components/ui/badge";
import { FileText, Vote, Users, FileCheck } from "lucide-react";
import type { PolicyActionEvent } from "@/types/orchestrator";

type HistoryPanelProps = {
  actions: PolicyActionEvent[];
};

const getIcon = (type: string) => {
  const normalized = type.toLowerCase();
  if (normalized.includes("vote")) return Vote;
  if (normalized.includes("amend")) return FileCheck;
  if (normalized.includes("committee")) return Users;
  return FileText;
};

export const HistoryPanel = ({ actions }: HistoryPanelProps) => {
  if (actions.length === 0) {
    return (
      <div className="text-sm text-muted-foreground italic">
        No recent actions were returned for this bill.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {actions.map((event, idx) => {
        const Icon = getIcon(event.type ?? "");
        return (
          <div
            key={`${event.type}-${idx}-${event.date}`}
            className="flex gap-3 p-3 rounded-lg bg-muted/50 border border-border hover:border-primary/50 transition-colors"
          >
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Icon className="h-4 w-4 text-primary" />
            </div>

            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm font-medium text-foreground">
                  {event.description ?? event.type ?? "Action"}
                </h4>
                {event.actor && (
                  <Badge variant="outline" className="text-xs">
                    {event.actor}
                  </Badge>
                )}
              </div>
              {event.date && (
                <p className="text-xs text-muted-foreground">
                  {new Date(event.date).toLocaleDateString()}
                </p>
              )}
              {event.link && (
                <a
                  href={event.link}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-primary hover:underline"
                >
                  View on Congress.gov
                </a>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
