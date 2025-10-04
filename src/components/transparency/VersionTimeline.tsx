import { Badge } from "@/components/ui/badge";
import type { PolicyTimelineEntry } from "@/types/orchestrator";

type VersionTimelineProps = {
  versions: PolicyTimelineEntry[];
  selectedVersion?: string;
  onVersionSelect: (version: string) => void;
};

export const VersionTimeline = ({
  versions,
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
              key={version.versionId}
              className="relative flex items-start gap-4 cursor-pointer group"
              onClick={() => onVersionSelect(version.versionId)}
            >
              {/* Timeline dot */}
              <div
                className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  selectedVersion === version.versionId
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
                  selectedVersion === version.versionId
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card/50 group-hover:border-primary/50"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-foreground">
                    {version.label}
                  </h3>
                  {version.issuedOn && (
                    <Badge variant="outline" className="text-xs">
                      {new Date(version.issuedOn).toLocaleDateString()}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 text-sm">
                  {version.changeSummary && (
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-2 w-12 rounded-full ${getChangeColor(
                          (version.changeSummary.added ?? 0) +
                            (version.changeSummary.removed ?? 0)
                        )}`}
                      />
                      <span className="text-muted-foreground">
                        +{version.changeSummary.added ?? 0} / -
                        {version.changeSummary.removed ?? 0}
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
