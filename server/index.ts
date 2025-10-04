import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import { runOrchestrator } from "./orchestrator";
import { influenceLookupTool } from "./tools/influenceLookup";
import { policyDnaTool } from "./tools/policyDna";
import { logEnvironmentSummary } from "./lib/config";

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(morgan("tiny"));

logEnvironmentSummary();

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/chat", async (req, res) => {
  const { message, filters } = req.body ?? {};
  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "Missing message" });
  }
  try {
    const result = await runOrchestrator(message, filters);
    res.json(result);
  } catch (error) {
    console.error("Orchestrator failed", error);
    res.status(500).json({ error: (error as Error).message ?? "Internal error" });
  }
});

app.get("/api/policy/:billId", async (req, res) => {
  const { billId } = req.params;
  if (!billId) {
    return res.status(400).json({ error: "Missing billId" });
  }
  try {
    const dna = await policyDnaTool(billId);
    const keywords = [
      dna.metadata?.title,
      dna.metadata?.summary,
      dna.metadata?.billType && dna.metadata?.billNumber
        ? `${dna.metadata.billType.toUpperCase()} ${dna.metadata.billNumber}`
        : undefined,
    ]
      .concat((dna.actions ?? []).slice(0, 5).map((action) => action.description))
      .filter((value): value is string => Boolean(value?.trim()))
      .map((value) => value.trim());
    const period = dna.timeline.length
      ? {
          from: dna.timeline[0]?.issuedOn,
          to: dna.timeline[dna.timeline.length - 1]?.issuedOn,
        }
      : undefined;
    const influence = await influenceLookupTool({
      billId,
      keywords,
      period,
      sponsors: dna.metadata?.sponsor?.name
        ? [{ name: dna.metadata.sponsor.name }]
        : undefined,
    });
    res.json({
      billId,
      dna,
      influence,
    });
  } catch (error) {
    console.error("Policy detail failed", error);
    res.status(500).json({ error: (error as Error).message ?? "Internal error" });
  }
});

const port = Number.parseInt(process.env.PORT ?? "8787", 10);
app.listen(port, () => {
  console.log(`RAG orchestrator listening on port ${port}`);
});
