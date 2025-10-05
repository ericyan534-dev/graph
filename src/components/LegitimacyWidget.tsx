import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type AnalysisResult = {
  rating: string;
  reasons: string[];
  uncertainties: string[];
  suggestedFilters: string[];
};

const analyzeClaim = (claim: string): AnalysisResult => ({
  rating: "Unclear",
  reasons: [
    "Legitimacy analysis isn't connected to the orchestrator yet.",
    `Use the chat to request sourced context about: "${claim}"`,
  ],
  uncertainties: ["No automated fact pattern matched."],
  suggestedFilters: ["Try adding a bill number", "Reference a jurisdiction"],
});

const LegitimacyWidget = () => {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const runAnalysis = async () => {
    const value = text.trim();
    if (!value) return;
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 350));
    setResult(analyzeClaim(value));
    setLoading(false);
  };

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex gap-2">
          <Input
            placeholder="Paste a claim or policy statement to evaluate"
            value={text}
            onChange={(event) => setText(event.target.value)}
          />
          <Button onClick={runAnalysis} disabled={loading}>
            {loading ? "Analyzing..." : "Check"}
          </Button>
        </div>
        {result && (
          <div className="rounded-md border p-3 text-sm">
            <div>
              <span className="font-semibold">Rating:</span> {result.rating}
            </div>
            {result.reasons.length > 0 && (
              <div className="mt-2">
                <div className="font-semibold">Reasons</div>
                <ul className="list-disc space-y-1 pl-6">
                  {result.reasons.map((reason, index) => (
                    <li key={`reason-${index}`}>{reason}</li>
                  ))}
                </ul>
              </div>
            )}
            {result.uncertainties.length > 0 && (
              <div className="mt-2">
                <div className="font-semibold">Uncertainties</div>
                <ul className="list-disc space-y-1 pl-6">
                  {result.uncertainties.map((item, index) => (
                    <li key={`uncertainty-${index}`}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
            {result.suggestedFilters.length > 0 && (
              <div className="mt-2">
                <div className="font-semibold">Suggested Filters</div>
                <ul className="list-disc space-y-1 pl-6">
                  {result.suggestedFilters.map((item, index) => (
                    <li key={`filter-${index}`}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="mt-2 text-xs text-muted-foreground">
              Mode: Describe (no opinions). Verify against primary documents when available.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LegitimacyWidget;
