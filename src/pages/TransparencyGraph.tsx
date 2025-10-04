import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, GitBranch, Users, DollarSign, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VersionTimeline } from "@/components/transparency/VersionTimeline";
import { BlameView } from "@/components/transparency/BlameView";
import { InfluenceOverlay } from "@/components/transparency/InfluenceOverlay";
import { HistoryPanel } from "@/components/transparency/HistoryPanel";

const TransparencyGraph = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedVersion, setSelectedVersion] = useState("v3");

  // Mock data
  const policyTitle = "Affordable Care Act";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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
                {policyTitle}
              </h1>
              <p className="text-sm text-muted-foreground">
                Transparency Graph
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Timeline & Blame */}
          <div className="lg:col-span-2 space-y-6">
            {/* Version Timeline */}
            <div className="bg-card rounded-xl border border-border p-6 shadow-medium">
              <div className="flex items-center gap-2 mb-4">
                <GitBranch className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">
                  Version Timeline
                </h2>
              </div>
              <VersionTimeline
                selectedVersion={selectedVersion}
                onVersionSelect={setSelectedVersion}
              />
            </div>

            {/* Blame View */}
            <div className="bg-card rounded-xl border border-border p-6 shadow-medium">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">
                  Clause Attribution
                </h2>
              </div>
              <BlameView version={selectedVersion} />
            </div>
          </div>

          {/* Right Column - Influence & History */}
          <div className="space-y-6">
            {/* Influence Overlay */}
            <div className="bg-card rounded-xl border border-border p-6 shadow-medium">
              <Tabs defaultValue="lobbying" className="w-full">
                <TabsList className="w-full grid grid-cols-2 mb-4">
                  <TabsTrigger value="lobbying" className="gap-2">
                    <DollarSign className="h-4 w-4" />
                    Lobbying
                  </TabsTrigger>
                  <TabsTrigger value="sponsors" className="gap-2">
                    <Users className="h-4 w-4" />
                    Sponsors
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="lobbying">
                  <InfluenceOverlay type="lobbying" />
                </TabsContent>
                <TabsContent value="sponsors">
                  <InfluenceOverlay type="sponsors" />
                </TabsContent>
              </Tabs>
            </div>

            {/* History Panel */}
            <div className="bg-card rounded-xl border border-border p-6 shadow-medium">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Commitments & History
              </h2>
              <HistoryPanel />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TransparencyGraph;
