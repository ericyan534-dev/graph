export type EnvStatus = {
  name: string;
  description: string;
  optional?: boolean;
  present: boolean;
};

const REQUIREMENTS: { name: string; description: string }[] = [
  {
    name: "CONGRESS_API_KEY",
    description: "Congress.gov API key for bill search and metadata",
  },
  {
    name: "FEC_API_KEY",
    description: "OpenFEC API key for campaign finance lookups",
  },
];

const RECOMMENDATIONS: { name: string; description: string }[] = [
  {
    name: "GOOGLE_APPLICATION_CREDENTIALS",
    description: "Path to a Google service-account JSON with Vertex AI access",
  },
  {
    name: "VERTEX_PROJECT_ID",
    description: "Google Cloud project id that hosts Vertex AI",
  },
  {
    name: "VERTEX_LOCATION",
    description: "Vertex AI region (defaults to us-central1)",
  },
  {
    name: "VERTEX_GEMINI_MODEL",
    description: "Gemini model name (defaults to gemini-1.5-flash)",
  },
];

const toStatus = (
  requirement: { name: string; description: string },
  optional = false
): EnvStatus => ({
  name: requirement.name,
  description: requirement.description,
  optional,
  present: Boolean(process.env[requirement.name]?.trim()),
});

export const inspectEnvironment = (): EnvStatus[] => [
  ...REQUIREMENTS.map((req) => toStatus(req, false)),
  ...RECOMMENDATIONS.map((req) => toStatus(req, true)),
];

export const logEnvironmentSummary = () => {
  const statuses = inspectEnvironment();
  const missingRequired = statuses.filter((status) => !status.present && !status.optional);
  const missingOptional = statuses.filter((status) => !status.present && status.optional);

  if (missingRequired.length === 0) {
    console.info("All required API credentials detected.");
  } else {
    console.warn(
      "Missing required environment variables:",
      missingRequired.map((status) => `${status.name} (${status.description})`).join(", ")
    );
  }

  if (missingOptional.length > 0) {
    console.info(
      "Optional integrations not configured:",
      missingOptional.map((status) => `${status.name} (${status.description})`).join(", ")
    );
  }

  return statuses;
};
