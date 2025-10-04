import { VertexAI } from "@google-cloud/vertexai";

let cachedVertex: VertexAI | undefined;

const getProject = () => process.env.VERTEX_PROJECT_ID?.trim();
const getLocation = () => process.env.VERTEX_LOCATION?.trim() || "us-central1";

export const getVertexClient = () => {
  const project = getProject();
  if (!project) {
    return undefined;
  }
  if (!cachedVertex) {
    cachedVertex = new VertexAI({
      project,
      location: getLocation(),
    });
  }
  return cachedVertex;
};

export const getGenerativeModel = () => {
  const client = getVertexClient();
  if (!client) {
    return undefined;
  }
  const modelName = process.env.VERTEX_GEMINI_MODEL?.trim() || "gemini-1.5-flash";
  return client.getGenerativeModel({ model: modelName });
};
