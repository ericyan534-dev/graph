import { Badge } from "@/components/ui/badge";
import type { PolicyTimelineEntry } from "@/types/orchestrator";

type VersionTimelineProps = {
  versions: PolicyTimelineEntry[];
  selectedVersion?: string;
  onVersionSelect: (version: string) => void;
};

const formatTimelineDetail = (entry: PolicyTimelineEntry) => {
  if (entry.summary) return entry.summary;

  const { changeSummary } = entry;
  if (!changeSummary) return "Version recorded";
  const added = changeSummary.added ?? 0;
  const removed = changeSummary.removed ?? 0;
  const modified = changeSummary.modified ?? 0;
  if (added === 0 && removed === 0 && modified === 0) {
    return "No textual changes detected";
  }
  const segments: string[] = [];
  if (added > 0) segments.push(`+${added} words`);
  if (removed > 0) segments.push(`-${removed} words`);
  if (modified > 0) segments.push(`${modified} modified`);
  return segments.join(" · ");
};

const getChangeColor = (entry: PolicyTimelineEntry) => {
  if (!entry.changeSummary) return "bg-muted";
  const changes =
    (entry.changeSummary.added ?? 0) +
    (entry.changeSummary.removed ?? 0) +
    (entry.changeSummary.modified ?? 0);
  if (changes === 0) return "bg-muted";
  if (changes < 50) return "bg-success";
  if (changes < 100) return "bg-warning";
  return "bg-destructive";
};

export const VersionTimeline = ({
  versions,
  selectedVersion,
  onVersionSelect,
}: VersionTimelineProps) => {
  if (!versions.length) {
    return (
      <div className="text-sm text-muted-foreground italic">
        No version timeline was returned for this bill.
      </div>
    );
  }

  const sortedVersions = [...versions].sort((a, b) => {
    const aDate = a.issuedOn ? new Date(a.issuedOn).getTime() : 0;
    const bDate = b.issuedOn ? new Date(b.issuedOn).getTime() : 0;
    return bDate - aDate;
  });

  const effectiveSelection =
    selectedVersion ?? sortedVersions[0]?.versionId ?? sortedVersions[0]?.label;

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

        <div className="space-y-6">
          {sortedVersions.map((version, idx) => {
            const identifier = version.versionId ?? version.label ?? `${idx}`;
            const isSelected = effectiveSelection === identifier;

            return (
              <div
                key={`${identifier}-${idx}`}
                className="relative flex items-start gap-4 cursor-pointer group"
                onClick={() => onVersionSelect(identifier)}
              >
                <div
                  className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    isSelected
                      ? "bg-primary ring-4 ring-primary/20"
                      : "bg-card border-2 border-border group-hover:border-primary"
                  }`}
                >
                  <span className="text-xs font-semibold text-foreground">
                    {idx + 1}
                  </span>
                </div>

                <div
                  className={`flex-1 p-4 rounded-lg border transition-all ${
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card/50 group-hover:border-primary/50"
                  }`}
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <h3 className="font-semibold text-foreground">
                      {version.label}
                    </h3>
                    {version.issuedOn && (
                      <Badge variant="outline" className="text-xs w-fit">
                        {new Date(version.issuedOn).toLocaleDateString()}
                      </Badge>
                    )}
                  </div>
                  <div className="mt-3 flex flex-col gap-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-2 w-16 rounded-full ${getChangeColor(version)}`}
                      />
                      <span>{formatTimelineDetail(version)}</span>
                    </div>
                    {version.sourceUri && (
                      <a
                        href={version.sourceUri}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-primary hover:underline"
                      >
                        View source
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
