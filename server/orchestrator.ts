import { Annotation, StateGraph, START, END } from "@langchain/langgraph";
import { answerGrounderTool } from "./tools/answerGrounder";
import { influenceLookupTool } from "./tools/influenceLookup";
import { guardrailTool } from "./tools/guardrail";
import { policyDnaTool } from "./tools/policyDna";
import { normalizeQuery, policySearchTool } from "./tools/policySearch";
import {
  GroundedAnswer,
  GuardrailFinding,
  InfluenceResult,
  OrchestratorResult,
  PolicyDNAResult,
  PolicyFilters,
  PolicySearchHit,
} from "./types";

const GraphState = Annotation.Root({
  query: Annotation<string>(),
  normalizedQuery: Annotation<string>({
    default: () => "",
  }),
  filters: Annotation<PolicyFilters | undefined>(),
  policies: Annotation<PolicySearchHit[]>({
    default: () => [],
    reducer: (_left, right) => right ?? [],
  }),
  dna: Annotation<PolicyDNAResult | undefined>({
    default: () => undefined,
    reducer: (_left, right) => right ?? undefined,
  }),
  influence: Annotation<InfluenceResult | undefined>({
    default: () => undefined,
    reducer: (_left, right) => right ?? undefined,
  }),
  answer: Annotation<GroundedAnswer | undefined>({
    default: () => undefined,
    reducer: (_left, right) => right ?? undefined,
  }),
  guardrailResult: Annotation<GuardrailFinding | undefined>({
    default: () => undefined,
    reducer: (_left, right) => right ?? undefined,
  }),
  logs: Annotation<string[]>({
    default: () => [],
    reducer: (left, right) => left.concat(right ?? []),
  }),
});

type GraphStateType = typeof GraphState.State;

const graphBuilder = new StateGraph(GraphState);

graphBuilder.addNode("normalize", async (state: GraphStateType) => {
  const normalized = normalizeQuery(state.query);
  return {
    normalizedQuery: normalized,
    logs: [`Normalized query to: ${normalized}`],
  };
});

graphBuilder.addNode("policySearch", async (state: GraphStateType) => {
  const results = await policySearchTool({
    query: state.normalizedQuery || state.query,
    filters: state.filters,
  });
  return {
    policies: results,
    logs: [`Retrieved ${results.length} policies from Congress.gov`],
  };
});

graphBuilder.addNode("policyDna", async (state: GraphStateType) => {
  if (!state.policies.length) {
    return {
      logs: ["Skipping DNA computation; no policies available."],
    };
  }
  const primary = state.policies[0];
  const dna = await policyDnaTool(primary.billId);
  return {
    dna,
    logs: [`Built DNA for ${primary.billId}`],
  };
});

graphBuilder.addNode("influenceLookup", async (state: GraphStateType) => {
  if (!state.policies.length) {
    return {
      logs: ["Skipping influence lookup; no policies available."],
    };
  }
  const primary = state.policies[0];
  const influence = await influenceLookupTool({
    billId: primary.billId,
    keywords: [state.normalizedQuery || state.query, primary.title],
    sponsors: primary.sponsor ? [{ name: primary.sponsor.name }] : undefined,
  });
  return {
    influence,
    logs: ["Influence lookup complete"],
  };
});

graphBuilder.addNode("answerGrounder", async (state: GraphStateType) => {
  const answer = await answerGrounderTool({
    question: state.query,
    policies: state.policies,
    dna: state.dna,
    influence: state.influence,
  });
  return {
    answer,
    logs: ["Answer grounded with citations"],
  };
});

graphBuilder.addNode("guardrailCheck", async (state: GraphStateType) => {
  if (!state.answer) {
    return {
      guardrailResult: { ok: false, warnings: ["Missing answer"] },
    };
  }
  const guardrail = await guardrailTool({ answer: state.answer.answer });
  return {
    guardrailResult: guardrail,
    logs: [guardrail.ok ? "Guardrail passed" : "Guardrail warnings issued"],
  };
});

graphBuilder.addEdge(START, "normalize");
graphBuilder.addEdge("normalize", "policySearch");
graphBuilder.addEdge("policySearch", "policyDna");
graphBuilder.addEdge("policyDna", "influenceLookup");
graphBuilder.addEdge("influenceLookup", "answerGrounder");
graphBuilder.addEdge("answerGrounder", "guardrailCheck");
graphBuilder.addEdge("guardrailCheck", END);

const compiledGraph = graphBuilder.compile({ name: "policy-orchestrator" });

export const runOrchestrator = async (
  query: string,
  filters?: PolicyFilters
): Promise<OrchestratorResult> => {
  const result = await compiledGraph.invoke({
    query,
    filters,
  });
  return {
    query,
    filters,
    policies: result.policies ?? [],
    dna: result.dna,
    influence: result.influence,
    answer: result.answer ?? {
      answer: "No answer generated.",
      citations: [],
    },
    guardrail:
      result.guardrailResult ?? ({ ok: false, warnings: ["Guardrail missing"] } as GuardrailFinding),
    logs: result.logs ?? [],
  };
};
