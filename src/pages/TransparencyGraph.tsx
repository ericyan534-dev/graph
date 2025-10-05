import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, GitBranch, Users, DollarSign, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VersionTimeline } from "@/components/transparency/VersionTimeline";
import { BlameView } from "@/components/transparency/BlameView";
import { InfluenceOverlay } from "@/components/transparency/InfluenceOverlay";
import { HistoryPanel } from "@/components/transparency/HistoryPanel";
import { PolicyChatPanel } from "@/components/transparency/PolicyChatPanel";
import { fetchPolicyDetail } from "@/lib/api";

const TransparencyGraph = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedVersion, setSelectedVersion] = useState<string | undefined>(undefined);
  const billId = id ?? "";

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["policy-detail", billId],
    queryFn: () => fetchPolicyDetail(billId),
    enabled: Boolean(billId),
  });

  const timeline = data?.dna.timeline ?? [];
  const blame = data?.dna.blame ?? [];
  const actions = data?.dna.actions ?? [];
  const metadata = data?.dna.metadata;
  const influence = data?.influence;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
              className="rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-foreground">
                {metadata?.title ?? id}
              </h1>
              <p className="text-sm text-muted-foreground">
                Transparency Graph
              </p>
              {metadata?.sponsor?.name && (
                <p className="text-xs text-muted-foreground">
                  Sponsor: {metadata.sponsor.name}
                  {metadata.sponsor.party && ` (${metadata.sponsor.party})`}
                </p>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {isLoading && (
          <div className="text-sm text-muted-foreground">Loading policy detail…</div>
        )}
        {isError && (
          <div className="text-sm text-destructive">
            {(error as Error)?.message ?? "Failed to load policy detail."}
          </div>
        )}
        {!isLoading && !isError && data && (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-card rounded-xl border border-border p-6 shadow-medium">
                <div className="flex items-center gap-2 mb-4">
                  <GitBranch className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">
                    Version Timeline
                  </h2>
                </div>
                <VersionTimeline
                  versions={timeline}
                  selectedVersion={selectedVersion ?? timeline[0]?.versionId}
                  onVersionSelect={setSelectedVersion}
                />
              </div>

              <div className="bg-card rounded-xl border border-border p-6 shadow-medium">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">
                    Clause Attribution
                  </h2>
                </div>
                <BlameView entries={blame} />
              </div>
            </div>

            <div className="space-y-6">
              <PolicyChatPanel billId={billId} metadata={metadata} />

              <div className="bg-card rounded-xl border border-border p-6 shadow-medium">
                <Tabs defaultValue="lobbying" className="w-full">
                  <TabsList className="w-full grid grid-cols-2 mb-4">
                    <TabsTrigger value="lobbying" className="gap-2">
                      <DollarSign className="h-4 w-4" />
                      Lobbying
                    </TabsTrigger>
                    <TabsTrigger value="finance" className="gap-2">
                      <Users className="h-4 w-4" />
                      Finance
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="lobbying">
                    <InfluenceOverlay influence={influence} mode="lobbying" />
                  </TabsContent>
                  <TabsContent value="finance">
                    <InfluenceOverlay influence={influence} mode="finance" />
                  </TabsContent>
                </Tabs>
              </div>

              <div className="bg-card rounded-xl border border-border p-6 shadow-medium">
                <h2 className="text-lg font-semibold text-foreground mb-4">
                  Commitments & History
                </h2>
                <HistoryPanel actions={actions} />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default TransparencyGraph;
