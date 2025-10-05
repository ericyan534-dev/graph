import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, DollarSign, FileText, GitBranch, Users } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BlameView } from "@/components/transparency/BlameView";
import { HistoryPanel } from "@/components/transparency/HistoryPanel";
import { InfluenceOverlay } from "@/components/transparency/InfluenceOverlay";
import { PolicyChatPanel } from "@/components/transparency/PolicyChatPanel";
import { VersionTimeline } from "@/components/transparency/VersionTimeline";
import { fetchPolicyDetail } from "@/lib/api";

const TransparencyGraph = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const billId = id ?? "";
  const [selectedVersion, setSelectedVersion] = useState<string | undefined>(undefined);

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
    <div className="flex flex-col h-[calc(100vh-56px)]">
      <ScrollArea className="flex-1">
        <div className="mx-auto max-w-6xl space-y-6 p-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
              className="rounded-full"
              aria-label="Back to chat"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-semibold leading-tight">
                {metadata?.title ?? (billId ? `Policy ${billId}` : "Transparency Graph")}
              </h1>
              <p className="text-sm text-muted-foreground">
                Legislative DNA, authorship, and influence mapping
              </p>
              {metadata?.sponsor?.name && (
                <p className="text-xs text-muted-foreground">
                  Sponsor: {metadata.sponsor.name}
                  {metadata.sponsor.party && ` (${metadata.sponsor.party}`}
                  {metadata.sponsor.state && ` · ${metadata.sponsor.state}`}
                  {metadata.sponsor.party && ")"}
                </p>
              )}
            </div>
          </div>

          {!billId ? (
            <Card>
              <CardHeader>
                <CardTitle>Select a policy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>
                  Choose a bill from the chat recommendations to explore its version history, clause authorship,
                  and influence data.
                </p>
                <p>Once selected, this page will surface live policy DNA powered by the orchestrator APIs.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {isLoading && (
                <Card>
                  <CardContent className="py-12 text-center text-sm text-muted-foreground">
                    Loading transparency data…
                  </CardContent>
                </Card>
              )}

              {isError && (
                <Card>
                  <CardContent className="py-12 text-center text-sm text-destructive">
                    {(error as Error)?.message ?? "Unable to load policy detail."}
                  </CardContent>
                </Card>
              )}

              {!isLoading && !isError && data && (
                <div className="grid gap-6 lg:grid-cols-3">
                  <div className="space-y-6 lg:col-span-2">
                    <Card>
                      <CardHeader className="flex flex-row items-center gap-3">
                        <GitBranch className="h-5 w-5 text-primary" />
                        <CardTitle>Version Timeline</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <VersionTimeline
                          versions={timeline}
                          selectedVersion={selectedVersion ?? timeline[0]?.versionId}
                          onVersionSelect={setSelectedVersion}
                        />
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center gap-3">
                        <FileText className="h-5 w-5 text-primary" />
                        <CardTitle>Clause Attribution</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <BlameView entries={blame} />
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-6">
                    <PolicyChatPanel billId={billId} metadata={metadata} />

                    <Card>
                      <CardHeader>
                        <CardTitle>Influence Overlay</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Tabs defaultValue="lobbying" className="w-full">
                          <TabsList className="mb-4 grid w-full grid-cols-2">
                            <TabsTrigger value="lobbying" className="gap-2">
                              <DollarSign className="h-4 w-4" /> Lobbying
                            </TabsTrigger>
                            <TabsTrigger value="finance" className="gap-2">
                              <Users className="h-4 w-4" /> Finance
                            </TabsTrigger>
                          </TabsList>
                          <TabsContent value="lobbying">
                            <InfluenceOverlay influence={influence} mode="lobbying" />
                          </TabsContent>
                          <TabsContent value="finance">
                            <InfluenceOverlay influence={influence} mode="finance" />
                          </TabsContent>
                        </Tabs>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Commitments &amp; History</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <HistoryPanel actions={actions} />
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default TransparencyGraph;
