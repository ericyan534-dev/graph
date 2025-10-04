import {
  OrchestratorResponse,
  PolicyDetailResponse,
} from "@/types/orchestrator";

type PolicyFilters = {
  jurisdiction?: "federal" | "state";
  congress?: number;
  state?: string;
  dateRange?: {
    from?: string;
    to?: string;
  };
};

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8787";

const parseResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || response.statusText);
  }
  return response.json() as Promise<T>;
};

export const sendChat = async (
  message: string,
  filters?: PolicyFilters
): Promise<OrchestratorResponse> => {
  const response = await fetch(`${API_BASE}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message, filters }),
  });
  return parseResponse<OrchestratorResponse>(response);
};

export const fetchPolicyDetail = async (
  billId: string
): Promise<PolicyDetailResponse> => {
  const response = await fetch(`${API_BASE}/api/policy/${encodeURIComponent(billId)}`);
  return parseResponse<PolicyDetailResponse>(response);
};
