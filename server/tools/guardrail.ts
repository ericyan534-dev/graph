import { GuardrailFinding } from "../types";

type GuardrailInput = {
  answer: string;
};

const PROHIBITED = [
  /\bshould\b/i,
  /\bmust\b/i,
  /\brecommend\b/i,
  /\bconsider\b/i,
  /\badvise\b/i,
  /\bcall your representative\b/i,
];

export const guardrailTool = ({ answer }: GuardrailInput): GuardrailFinding => {
  const warnings = PROHIBITED.filter((pattern) => pattern.test(answer)).map(
    (pattern) => `Guardrail triggered: ${pattern}`
  );
  return {
    ok: warnings.length === 0,
    warnings,
  };
};
