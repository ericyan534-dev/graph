import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import InfluenceTracker from "@/components/InfluenceTracker";

const InfluencePage = () => {
  const { billId } = useParams();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 shadow-sm backdrop-blur-sm">
        <div className="container mx-auto max-w-5xl px-4 py-4">
          <div className="flex flex-wrap items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Chat
              </Button>
            </Link>
            <div className="hidden h-6 w-px bg-border sm:block" />
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-lg font-bold">Influence Mapping &amp; Analysis</h1>
              {billId && (
                <Badge variant="outline" className="font-mono">
                  Bill {billId}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-5xl px-4 py-8">
        <InfluenceTracker />
      </main>
    </div>
  );
};

export default InfluencePage;
