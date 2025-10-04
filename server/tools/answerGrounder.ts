import { getGenerativeModel } from "../lib/vertex";
import { GroundedAnswer, InfluenceResult, PolicyDNAResult, PolicySearchHit } from "../types";

type AnswerGrounderInput = {
  question: string;
  policies: PolicySearchHit[];
  dna?: PolicyDNAResult;
  influence?: InfluenceResult;
};

type ContextLine = {
  text: string;
  citation: { label: string; url: string };
};

const formatPolicyLine = (hit: PolicySearchHit): ContextLine => {
  const section = hit.sections?.[0];
  const citation =
    section?.sourceUri ??
    `https://www.congress.gov/bill/${hit.congress}th-congress/${hit.billType}/${hit.billNumber}`;
  const clause = section?.heading ?? "summary";
  const snippet = section?.snippet ?? hit.summary ?? hit.latestAction ?? hit.title;
  return {
    text: `${hit.title} (${hit.jurisdiction}) – ${clause}: ${snippet}`,
    citation: {
      label: hit.title,
      url: citation,
    },
  };
};

const formatTimeline = (dna?: PolicyDNAResult): ContextLine[] => {
  if (!dna?.timeline?.length) return [];
  return dna.timeline.slice(-3).map((version) => ({
    text: `${version.label} issued ${version.issuedOn ?? "unknown date"} with ${
      version.changeSummary?.added ?? 0
    } additions and ${version.changeSummary?.removed ?? 0} removals`,
    citation: {
      label: `${version.label} text`,
      url: version.sourceUri ?? "https://www.govinfo.gov/",
    },
  }));
};

const formatInfluence = (influence?: InfluenceResult): ContextLine[] => {
  const lines: ContextLine[] = [];
  if (influence?.lobbying?.length) {
    const top = influence.lobbying[0];
    lines.push({
      text: `Senate LDA filings show ${top.registrant} lobbying for ${top.client} on ${
        top.issue ?? "the bill"
      } in ${top.period ?? "recent cycles"}`,
      citation: {
        label: top.client,
        url: top.sourceUrl ?? influence.metadata?.links?.lda ?? "https://lda.senate.gov/",
      },
    });
  }
  if (influence?.finance?.length) {
    const finance = influence.finance[0];
    lines.push({
      text: `FEC reports list ${finance.committeeName} receiving $${
        finance.totalReceipts?.toLocaleString?.() ?? finance.totalReceipts ?? "N/A"
      } in cycle ${finance.cycle ?? ""}`,
      citation: {
        label: finance.committeeName,
        url: finance.sourceUrl ?? influence.metadata?.links?.fec ?? "https://www.fec.gov/",
      },
    });
  }
  return lines;
};

const collectContext = (
  policies: PolicySearchHit[],
  dna?: PolicyDNAResult,
  influence?: InfluenceResult
) => {
  const lines: ContextLine[] = [];
  policies.slice(0, 3).map(formatPolicyLine).forEach((line) => lines.push(line));
  formatTimeline(dna).forEach((line) => lines.push(line));
  formatInfluence(influence).forEach((line) => lines.push(line));
  return lines;
};

const buildFallbackAnswer = (
  question: string,
  policies: PolicySearchHit[],
  dna?: PolicyDNAResult,
  influence?: InfluenceResult
): GroundedAnswer => {
  if (policies.length === 0) {
    return {
      answer: `I could not find a bill that directly matches "${question}". Try narrowing the request with a bill number, chamber, or congress session.`,
      citations: [],
      disclaimers: ["No matching bills returned by Congress.gov"],
    };
  }

  const lines = collectContext(policies, dna, influence);
  const citations = lines.map((line) => line.citation);
  const answer = [
    `Here is what I found about "${question}":`,
    ...lines.map((l) => `• ${l.text}`),
    "All information is descriptive and sourced from official records.",
  ].join("\n");

  return {
    answer,
    citations,
  };
};

const stringifyContext = (lines: ContextLine[]) =>
  lines
    .map(
      (line, index) =>
        `${index + 1}. ${line.text}\n   Source: ${line.citation.label} (${line.citation.url})`
    )
    .join("\n");

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

export const answerGrounderTool = async ({
  question,
  policies,
  dna,
  influence,
}: AnswerGrounderInput): Promise<GroundedAnswer> => {
  if (policies.length === 0) {
    return buildFallbackAnswer(question, policies, dna, influence);
  }

  const model = getGenerativeModel();
  if (!model) {
    return buildFallbackAnswer(question, policies, dna, influence);
  }

  const contextLines = collectContext(policies, dna, influence);
  const promptContext = stringifyContext(contextLines);

  try {
    const response = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `You are a non-advocacy policy explainer. Using only the provided context, answer the user's question in a descriptive tone. Return JSON with keys: answer (string), citations (array of {label,url}), disclaimers (optional array of strings).\n\nQuestion: ${question}\n\nContext:\n${promptContext}`,
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
      throw new Error("Empty Gemini response");
    }

    const parsed = JSON.parse(rawText) as GroundedAnswer;
    if (!parsed?.answer || !Array.isArray(parsed.citations)) {
      throw new Error("Gemini response missing required fields");
    }

    return {
      answer: parsed.answer,
      citations: parsed.citations,
      disclaimers: parsed.disclaimers,
    };
  } catch (error) {
    console.warn("Answer grounding model failed, falling back to deterministic formatter", error);
    return buildFallbackAnswer(question, policies, dna, influence);
  }
};
