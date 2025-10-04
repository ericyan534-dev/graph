import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { analyzeLegitimacy } from '@/services/ai';

export default function LegitimacyWidget() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);

  const run = async () => {
    if (!text.trim()) return;
    setLoading(true);
    const out = await analyzeLegitimacy(text.trim());
    setResult(out);
    setLoading(false);
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex gap-2">
          <Input placeholder="Paste a claim or policy statement to evaluate" value={text} onChange={e=>setText(e.target.value)} />
          <Button onClick={run} disabled={loading}>{loading ? 'Analyzing...' : 'Check'}</Button>
        </div>
        {result && (
          <div className="rounded-md border p-3 text-sm">
            <div><span className="font-semibold">Rating:</span> {result.rating}</div>
            {result.reasons?.length && (
              <div className="mt-2">
                <div className="font-semibold">Reasons</div>
                <ul className="list-disc pl-6">{result.reasons.map((r:string, i:number)=>(<li key={i}>{r}</li>))}</ul>
              </div>
            )}
            {result.uncertainties?.length && (
              <div className="mt-2">
                <div className="font-semibold">Uncertainties</div>
                <ul className="list-disc pl-6">{result.uncertainties.map((r:string, i:number)=>(<li key={i}>{r}</li>))}</ul>
              </div>
            )}
            {result.suggested_filters?.length && (
              <div className="mt-2">
                <div className="font-semibold">Suggested Filters</div>
                <ul className="list-disc pl-6">{result.suggested_filters.map((r:string, i:number)=>(<li key={i}>{r}</li>))}</ul>
              </div>
            )}
            <div className="mt-2 text-xs text-muted-foreground">Mode: Describe (no opinions). Sources recommended; verify against primary documents.</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
