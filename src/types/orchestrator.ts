export type PolicyFilters = {
  jurisdiction?: "federal" | "state";
  congress?: number;
  state?: string;
  dateRange?: {
    from?: string;
    to?: string;
  };
  billId?: string;
  keywords?: string[];
};

export type PolicySectionHit = {
  id: string;
  heading?: string;
  snippet: string;
  score: number;
  sourceUri?: string;
};

export type PolicySearchHit = {
  billId: string;
  congress: number;
  billType: string;
  billNumber: string;
  title: string;
  status: string;
  latestAction?: string;
  summary?: string;
  jurisdiction: "federal" | "state";
  sections: PolicySectionHit[];
  confidence: number;
  sponsor?: {
    name: string;
    party?: string;
    state?: string;
  };
};

export type PolicyTimelineEntry = {
  versionId: string;
  label: string;
  issuedOn?: string;
  changeSummary?: {
    added: number;
    removed: number;
    modified: number;
  };
  sourceUri?: string;
};

export type PolicyBlameEntry = {
  sectionId: string;
  heading?: string;
  author?: string;
  actionType?: string;
  actionDate?: string;
  summary?: string;
  sourceUri?: string;
};

export type PolicyActionEvent = {
  type: string;
  date?: string;
  actor?: string;
  description?: string;
  link?: string;
};

export type PolicyDNAResult = {
  billId: string;
  timeline: PolicyTimelineEntry[];
  blame: PolicyBlameEntry[];
  actions: PolicyActionEvent[];
  metadata?: {
    title?: string;
    summary?: string;
    sponsor?: {
      name?: string;
      party?: string;
      state?: string;
    };
    congress?: number;
    billType?: string;
    billNumber?: string;
  };
};

export type LobbyingRecord = {
  id: string;
  client: string;
  registrant: string;
  amount?: number;
  issue?: string;
  period?: string;
  sourceUrl?: string;
};

export type FinanceRecord = {
  committeeName: string;
  candidateId: string;
  totalReceipts?: number;
  cycle?: number;
  sourceUrl?: string;
};

export type InfluenceResult = {
  lobbying: LobbyingRecord[];
  finance: FinanceRecord[];
  metadata?: {
    notes?: string[];
    links?: Record<string, string>;
    searchTerms?: string[];
  };
};

export type GroundedAnswer = {
  answer: string;
  citations: {
    label: string;
    url: string;
  }[];
  disclaimers?: string[];
};

export type GuardrailFinding = {
  ok: boolean;
  warnings: string[];
};

export type OrchestratorResponse = {
  query: string;
  filters?: PolicyFilters;
  policies: PolicySearchHit[];
  dna?: PolicyDNAResult;
  influence?: InfluenceResult;
  answer: GroundedAnswer;
  guardrail: GuardrailFinding;
  logs: string[];
};

export type PolicyDetailResponse = {
  billId: string;
  dna: PolicyDNAResult;
  influence: InfluenceResult;
};
