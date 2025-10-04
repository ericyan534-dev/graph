import { GroundedAnswer, InfluenceResult, PolicyDNAResult, PolicySearchHit } from "../types";

type AnswerGrounderInput = {
  question: string;
  policies: PolicySearchHit[];
  dna?: PolicyDNAResult;
  influence?: InfluenceResult;
};

const formatPolicyLine = (hit: PolicySearchHit) => {
  const section = hit.sections?.[0];
  const citation = section?.sourceUri ?? `https://www.congress.gov/bill/${hit.congress}th-congress/${hit.billType}/${hit.billNumber}`;
  const clause = section?.heading ?? "summary";
  const snippet = section?.snippet ?? hit.summary ?? hit.latestAction ?? hit.title;
  return {
    text: `• ${hit.title} (${hit.jurisdiction}) – ${clause}: ${snippet}`,
    citation: {
      label: hit.title,
      url: citation,
    },
  };
};

const formatTimeline = (dna?: PolicyDNAResult) => {
  if (!dna?.timeline?.length) return [];
  return dna.timeline.slice(-3).map((version) => ({
    text: `• ${version.label} issued ${version.issuedOn ?? "unknown date"} with ${
      version.changeSummary?.added ?? 0
    } additions and ${version.changeSummary?.removed ?? 0} removals`,
    citation: {
      label: `${version.label} text`,
      url: version.sourceUri ?? "https://www.govinfo.gov/",
    },
  }));
};

const formatInfluence = (influence?: InfluenceResult) => {
  const lines: { text: string; citation: { label: string; url: string } }[] = [];
  if (influence?.lobbying?.length) {
    const top = influence.lobbying[0];
    lines.push({
      text: `• Senate LDA filings show ${top.registrant} lobbying for ${top.client} on ${top.issue ?? "the bill"} in ${
        top.period ?? "recent cycles"
      }`,
      citation: {
        label: top.client,
        url: top.sourceUrl ?? influence.metadata?.links?.lda ?? "https://lda.senate.gov/",
      },
    });
  }
  if (influence?.finance?.length) {
    const finance = influence.finance[0];
    lines.push({
      text: `• FEC reports list ${finance.committeeName} receiving $${
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

export const answerGrounderTool = ({
  question,
  policies,
  dna,
  influence,
}: AnswerGrounderInput): GroundedAnswer => {
  const lines: { text: string; citation: { label: string; url: string } }[] = [];
  const citations: GroundedAnswer["citations"] = [];

  if (policies.length === 0) {
    return {
      answer: `I could not find a bill that directly matches "${question}". Try narrowing the request with a bill number, chamber, or congress session.`,
      citations: [],
      disclaimers: ["No matching bills returned by Congress.gov"],
    };
  }

  for (const line of policies.slice(0, 3).map(formatPolicyLine)) {
    lines.push(line);
  }

  for (const line of formatTimeline(dna)) {
    lines.push(line);
  }

  for (const line of formatInfluence(influence)) {
    lines.push(line);
  }

  lines.forEach((line) => {
    citations.push(line.citation);
  });

  const answer = [
    `Here is what I found about "${question}":`,
    ...lines.map((l) => l.text),
    "All information is descriptive and sourced from official records.",
  ].join("\n");

  return {
    answer,
    citations,
  };
};
