import { useState } from "react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

type Bill = {
  number: string;
  title: string;
  congress: string;
  status: string;
  last_action: string;
  sponsors: string[];
  committees: string[];
  policy_areas: string[];
  subjects: string[];
  crs_summary: string;
  text_links: { label: string; url: string }[];
};

const DEMO_BILL: Bill = {
  number: "H.R.1234",
  title: "Example Act to Improve Transparency",
  congress: "118th",
  status: "Passed House",
  last_action: "03/22/2025 Referred to Senate committee",
  sponsors: ["Rep. Jane Doe [D-CA-12] (lead)", "Rep. John Roe [R-OH-4]"],
  committees: ["House Oversight", "Senate Rules"],
  policy_areas: ["Government Operations and Politics"],
  subjects: ["Congressional oversight", "Transparency in government"],
  crs_summary:
    "Makes certain datasets available to the public and mandates version tracking of statutory changes.",
  text_links: [
    { label: "Introduced", url: "#" },
    { label: "Engrossed (House)", url: "#" },
    { label: "Enrolled", url: "#" },
  ],
};

const Bills = () => {
  const [query, setQuery] = useState("");
  const [bill, setBill] = useState<Bill | null>(DEMO_BILL);

  const handleSearch = () => {
    setBill({ ...DEMO_BILL, number: query || DEMO_BILL.number });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-56px)]">
      <div className="border-b p-4">
        <div className="mx-auto flex max-w-6xl gap-2">
          <Input
            placeholder="Search bill (e.g., HR 1234 or S 5678)"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <Button onClick={handleSearch}>Search</Button>
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="mx-auto space-y-4 p-4 max-w-6xl">
          <Card>
            <CardHeader>
              <CardTitle>Bill Status</CardTitle>
            </CardHeader>
            <CardContent>
              {bill ? (
                <div className="space-y-2">
                  <div className="text-lg font-semibold">
                    {bill.number} — {bill.title}
                  </div>
                  <div className="text-sm text-muted-foreground">Congress: {bill.congress}</div>
                  <div className="text-sm">
                    Status: <span className="font-medium">{bill.status}</span>
                  </div>
                  <div className="text-sm">Last Action: {bill.last_action}</div>
                </div>
              ) : (
                <div className="text-muted-foreground">No bill selected.</div>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Metadata</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <span className="font-medium">Sponsors:</span> {bill?.sponsors?.join(", ") ?? "—"}
                </div>
                <div>
                  <span className="font-medium">Committees:</span> {bill?.committees?.join(", ") ?? "—"}
                </div>
                <div>
                  <span className="font-medium">Policy Areas:</span> {bill?.policy_areas?.join(", ") ?? "—"}
                </div>
                <div>
                  <span className="font-medium">Subjects:</span> {bill?.subjects?.join(", ") ?? "—"}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>CRS Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{bill?.crs_summary}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Bill Text</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              {bill?.text_links?.map((link) => (
                <a key={link.label} href={link.url} className="underline" target="_blank" rel="noreferrer">
                  {link.label}
                </a>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Public &amp; Private Laws</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Final enacted laws; public laws affect everyone, private laws affect specific entities. Includes law number
              and date enacted. (Demo content)
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
};

export default Bills;
