import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function Transparency() {
  return (
    <div className="flex flex-col h-[calc(100vh-56px)]">
      <ScrollArea className="flex-1">
        <div className="max-w-6xl mx-auto p-4 space-y-4">
          <Card>
            <CardHeader><CardTitle>Version Timeline</CardTitle></CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                v1 → v5 (Demo) — Diff heatmap showing clause changes across versions.
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Blame View</CardTitle></CardHeader>
            <CardContent>
              <ul className="list-disc pl-6 text-sm">
                <li>§2(b) inserted by House Committee on Oversight (Amendment A001)</li>
                <li>§4 revised by Senate Rules Committee</li>
                <li>Link to sponsors & votes (demo)</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Influence Overlay</CardTitle></CardHeader>
            <CardContent className="text-sm">
              Related lobbying reports (LD-1/LD-2) by issue code, finance signals for sponsors (demo). Filters by period/industry.
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Commitments & History</CardTitle></CardHeader>
            <CardContent className="text-sm">
              Actions, amendments, committee reports, votes, executive actions; links to sources. (Demo)
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
}
