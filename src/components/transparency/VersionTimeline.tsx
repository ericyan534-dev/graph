import { Badge } from "@/components/ui/badge";

type Version = {
  id: string;
  name: string;
  date: string;
  changes: number;
  congress: string;
};

const versions: Version[] = [
  { id: "v1", name: "Original Bill", date: "Mar 2009", changes: 0, congress: "111th" },
  { id: "v2", name: "House Amendment", date: "Jul 2009", changes: 47, congress: "111th" },
  { id: "v3", name: "Senate Version", date: "Dec 2009", changes: 123, congress: "111th" },
  { id: "v4", name: "Reconciliation", date: "Mar 2010", changes: 89, congress: "111th" },
];

type VersionTimelineProps = {
  selectedVersion: string;
  onVersionSelect: (version: string) => void;
};

export const VersionTimeline = ({
  selectedVersion,
  onVersionSelect,
}: VersionTimelineProps) => {
  const getChangeColor = (changes: number) => {
    if (changes === 0) return "bg-muted";
    if (changes < 50) return "bg-success";
    if (changes < 100) return "bg-warning";
    return "bg-destructive";
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

        {/* Version items */}
        <div className="space-y-6">
          {versions.map((version, idx) => (
            <div
              key={version.id}
              className="relative flex items-start gap-4 cursor-pointer group"
              onClick={() => onVersionSelect(version.id)}
            >
              {/* Timeline dot */}
              <div
                className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  selectedVersion === version.id
                    ? "bg-primary ring-4 ring-primary/20"
                    : "bg-card border-2 border-border group-hover:border-primary"
                }`}
              >
                <span className="text-xs font-semibold text-foreground">
                  {idx + 1}
                </span>
              </div>

              {/* Version info */}
              <div
                className={`flex-1 p-4 rounded-lg border transition-all ${
                  selectedVersion === version.id
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card/50 group-hover:border-primary/50"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-foreground">
                    {version.name}
                  </h3>
                  <Badge variant="outline" className="text-xs">
                    {version.congress}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-muted-foreground">{version.date}</span>
                  {version.changes > 0 && (
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-2 w-12 rounded-full ${getChangeColor(
                          version.changes
                        )}`}
                      />
                      <span className="text-muted-foreground">
                        {version.changes} changes
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
