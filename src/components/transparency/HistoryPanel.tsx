import { Badge } from "@/components/ui/badge";
import { FileText, Vote, Users, FileCheck } from "lucide-react";

type HistoryEvent = {
  type: "action" | "amendment" | "committee" | "vote";
  title: string;
  date: string;
  result?: string;
  link: string;
};

const events: HistoryEvent[] = [
  {
    type: "vote",
    title: "Final Passage Vote",
    date: "Mar 21, 2010",
    result: "Passed 219-212",
    link: "#",
  },
  {
    type: "amendment",
    title: "Reconciliation Amendment",
    date: "Mar 18, 2010",
    result: "Agreed",
    link: "#",
  },
  {
    type: "committee",
    title: "Conference Committee Report",
    date: "Dec 24, 2009",
    result: "Reported",
    link: "#",
  },
  {
    type: "action",
    title: "Senate Third Reading",
    date: "Dec 23, 2009",
    result: "Passed 60-39",
    link: "#",
  },
];

const getIcon = (type: string) => {
  switch (type) {
    case "vote":
      return Vote;
    case "amendment":
      return FileCheck;
    case "committee":
      return Users;
    default:
      return FileText;
  }
};

export const HistoryPanel = () => {
  return (
    <div className="space-y-3">
      {events.map((event, idx) => {
        const Icon = getIcon(event.type);
        return (
          <div
            key={idx}
            className="flex gap-3 p-3 rounded-lg bg-muted/50 border border-border hover:border-primary/50 transition-colors cursor-pointer"
          >
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Icon className="h-4 w-4 text-primary" />
            </div>

            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-medium text-foreground">
                  {event.title}
                </h4>
                {event.result && (
                  <Badge
                    variant={
                      event.result.includes("Passed") ||
                      event.result.includes("Agreed")
                        ? "default"
                        : "secondary"
                    }
                    className="text-xs"
                  >
                    {event.result}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{event.date}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
