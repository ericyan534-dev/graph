import { getGenerativeModel } from "../lib/vertex";
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

const buildRegexWarnings = (answer: string) =>
  PROHIBITED.filter((pattern) => pattern.test(answer)).map(
    (pattern) => `Guardrail triggered: ${pattern}`
  );

const extractText = (response: unknown): string | undefined => {
  const result = response as {
    response?: {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
  };
  const parts = result?.response?.candidates?.[0]?.content?.parts;
  if (!parts) return undefined;
  for (const part of parts) {
    if (part?.text) {
      return part.text;
    }
  }
  return undefined;
};

export const guardrailTool = async ({ answer }: GuardrailInput): Promise<GuardrailFinding> => {
  const regexWarnings = buildRegexWarnings(answer);

  const model = getGenerativeModel();
  if (!model) {
    return {
      ok: regexWarnings.length === 0,
      warnings: regexWarnings,
    };
  }

  try {
    const response = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `You are validating whether a draft policy explanation complies with non-advocacy and safety requirements. Analyse the answer below and return JSON with keys: ok (boolean) and warnings (array of strings). Mark ok false if the text gives advice, advocacy, legal guidance, or unsupported claims.\n\nAnswer:\n${answer}`,
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const rawText = extractText(response);
    if (!rawText) {
      throw new Error("Empty Gemini moderation response");
    }

    const parsed = JSON.parse(rawText) as GuardrailFinding;
    const warnings = [...regexWarnings, ...(parsed.warnings ?? [])];
    return {
      ok: parsed.ok && warnings.length === 0,
      warnings,
    };
  } catch (error) {
    console.warn("Guardrail moderation failed; using regex-only validation", error);
    return {
      ok: regexWarnings.length === 0,
      warnings: regexWarnings,
    };
  }
};
