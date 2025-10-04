# Policy Transparency RAG Orchestrator

This project delivers a full-stack transparency explorer for US legislation that is powered by a LangGraph-based Retrieval-Augmented Generation (RAG) orchestrator. The frontend (Vite + React + shadcn/ui) streams orchestrated answers, ranked bill cards, and influence overlays. The backend (Express + LangGraph) executes a multi-tool workflow that calls the Congress.gov, GovInfo, Senate LDA, and OpenFEC APIs to ground every response in primary-source data.

## Architecture

```
Web Client (Vite/React)
    ↓ HTTPS
API Gateway / Express (server/index.ts)
    ↓ LangGraph StateGraph (server/orchestrator.ts)
        ├─ policy-search      → Congress.gov bill search + summaries
        ├─ policy-dna         → GovInfo text downloads + diff-match-patch
        ├─ influence-lookup   → Senate LDA + OpenFEC lookups
        ├─ answer-grounder    → Gemini-backed response composer
        └─ guardrail          → Moderation + style enforcement
```

* **LangGraph StateGraph**: normalizes the query, performs hybrid policy search, builds a version timeline (“DNA”), aggregates lobbying & finance data, and grounds the final answer with citations before running style guardrails.
* **Express service**: exposes `/api/chat` for conversational answers and `/api/policy/:billId` for direct transparency views. A health probe lives at `/health` for Cloud Run readiness.
* **React experience**: `src/pages/Chat.tsx` consumes the orchestrator, renders citations inline, and surfaces orchestrator logs. `src/pages/TransparencyGraph.tsx` hydrates the timeline, blame view, influence overlay, and action history from live API responses.

## Getting Started

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Provide environment variables** (use `.env` locally, or Cloud Run secrets):

   | Variable | Required | Description |
   | -------- | -------- | ----------- |
   | `CONGRESS_API_KEY` | ✅ | API key for [Congress.gov](https://api.congress.gov/). Needed for policy search and bill metadata. |
   | `CONGRESS_API_BASE_URL` | optional | Override the default `https://api.congress.gov/v3` endpoint if using a proxy. |
   | `FEC_API_KEY` | ✅ | Key for [OpenFEC](https://api.open.fec.gov/). Enables sponsor finance totals. |
   | `FEC_API_BASE_URL` | optional | Override FEC base URL (defaults to `https://api.open.fec.gov/v1`). |
   | `LDA_API_BASE_URL` | optional | Override Senate LDA base URL (defaults to `https://lda.senate.gov/api/v1`). |
   | `GOOGLE_APPLICATION_CREDENTIALS` | ✅ | Path to the service-account JSON that can access Vertex AI. |
   | `VERTEX_PROJECT_ID` | ✅ | Google Cloud project hosting Vertex AI resources. |
   | `VERTEX_LOCATION` | optional | Vertex AI region (defaults to `us-central1`). |
   | `VERTEX_GEMINI_MODEL` | optional | Gemini model name for answer/guardrail calls (defaults to `gemini-1.5-flash`). |
   | `PORT` | optional | Port for the orchestrator service (`8787` by default). |

   > GovInfo text downloads do not require an additional key for enrolled USLM XML.

3. **Check your credentials**
   * Create a `.env` file with the variables above and ensure your Google service-account JSON path is accessible.
   * Run `npm run dev:orchestrator` once—the server will log which required keys are missing before it boots so you can correct them.

4. **Run the orchestrator service**
   ```bash
   npm run dev:orchestrator
   ```

5. **Start the client** (in a new terminal)
   ```bash
   npm run dev
   ```

6. Navigate to `http://localhost:5173` and chat. The client targets `http://localhost:8787` unless `VITE_API_BASE_URL` is set.

### Local validation checklist

Follow this quick smoke test after the services start:

1. Verify the orchestrator health endpoint:
   ```bash
   curl http://localhost:8787/health
   ```
2. Issue a sample chat request (replace the message with your query):
   ```bash
   curl -X POST http://localhost:8787/api/chat \
     -H 'Content-Type: application/json' \
     -d '{"message":"What is H.R. 5376?"}'
   ```
3. Open the web client at `http://localhost:5173` and send the same prompt. You should see bill cards, an answer with citations, and the environment log panel at the bottom of the chat.

### Cloud Run deployment pointers

* Build two services: one Cloud Run instance for the orchestrator (`npm run dev:orchestrator` build) and one for the static client (`npm run build` → deploy via Cloud Run or Cloud Storage + CDN).
* Configure required secrets via `CONGRESS_API_KEY`, `FEC_API_KEY`, etc. Cloud Run automatically injects `PORT`.
* Attach API Gateway or Cloud Endpoints in front of the Express service if you need unified auth.

## Implementation Highlights

* **LangGraph workflow** (`server/orchestrator.ts`): uses `Annotation.Root` to define shared state (`policies`, `dna`, `influence`, `answer`, `guardrailResult`, `logs`). Nodes run sequentially with clear log breadcrumbs.
* **Tooling**:
  * `policy-search` (`server/tools/policySearch.ts`) normalizes bill identifiers, calls Congress.gov, and returns top sections/snippets with heuristic confidence scores.
  * `policy-dna` (`server/tools/policyDna.ts`) fetches version metadata, downloads GovInfo XML/HTML, calculates change deltas via `diff-match-patch`, and surfaces amendment attributions.
  * `influence-lookup` (`server/tools/influenceLookup.ts`) queries Senate LDA filings and maps sponsors to FEC committees for finance totals.
  * `answer-grounder` (`server/tools/answerGrounder.ts`) composes strictly descriptive responses with citation tuples through Vertex AI Gemini, with deterministic fallbacks when credentials are unavailable.
  * `guardrail` (`server/tools/guardrail.ts`) combines regex detection with Gemini-powered validations to block advisory language or unsafe content.
* **React integration**:
  * `Chat.tsx` uses React Query to mutate conversations, streams results, shows citations with inline hyperlinks, and surfaces guardrail warnings + orchestrator logs.
  * `TransparencyGraph.tsx` lazily fetches DNA/influence data, wires `VersionTimeline`, `BlameView`, `InfluenceOverlay`, and `HistoryPanel` components to real data, and handles loading/error states.

## Extending the RAG System

To reach production parity with the GCP-first reference architecture, add the following:

* **Vector + BM25 store**: provision Cloud SQL (Postgres) with `pgvector` + `tsvector` indexes. Replace the direct Congress.gov search with ingestion jobs that hydrate these tables, then update `policy-search` to query your hybrid index (optionally re-rank with Vertex AI). Export connection strings via `DATABASE_URL`.
* **Embeddings & reranking**: integrate Vertex AI (`text-embedding-005` and Gemini Flash) by injecting `GOOGLE_APPLICATION_CREDENTIALS`, `VERTEX_PROJECT_ID`, `VERTEX_LOCATION`. Replace heuristic scoring with true hybrid retrieval + Vertex rerank.
* **Observability**: forward orchestrator logs to Cloud Logging (use `@google-cloud/logging`) and add Cloud Trace spans around each tool call.
* **Firestore session store**: persist chat history/filters so `/api/chat` can resume multi-turn context.
* **Neo4j Aura graph**: extend `policy-dna` to upsert nodes/edges and expose a `/api/graph` endpoint to power richer network views.

## Testing

* `npm run lint` – static analysis of the frontend code.
* `npm run build` – verifies the client builds successfully.
* API smoke tests – `curl http://localhost:8787/health` and `curl -X POST http://localhost:8787/api/chat -d '{"message":"ACA"}'` (with keys configured).

## Notes

* The orchestrator intentionally degrades gracefully: missing keys or empty lookups surface explanatory notes in the UI. If Vertex credentials are absent the answer-grounder reverts to deterministic summaries and the guardrail relies on regex heuristics.
* All APIs are invoked with strict JSON contracts so the system can scale to Cloud Run Jobs or Workflows for scheduled ingestion.
* Guardrails enforce descriptive, non-advisory tone; extend the regex patterns or integrate a hosted moderation endpoint as needed.
