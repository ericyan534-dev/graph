import { supabase } from '@/integrations/supabase/client';

type Message = { role: 'user' | 'assistant' | 'system'; content: string };

const browserKey = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;
const enableBrowserOpenAI = import.meta.env.VITE_ENABLE_BROWSER_OPENAI === 'true';
const openaiBase = import.meta.env.VITE_OPENAI_BASE_URL || 'https://api.openai.com/v1';
const openaiModel = import.meta.env.VITE_OPENAI_MODEL || 'gpt-4o-mini';

async function callSupabase(messages: Message[]) {
  try {
    const { data, error } = await supabase.functions.invoke('ai-chat', { body: { messages } });
    if (error) throw error;
    return data?.content as string;
  } catch (e) {
    throw e;
  }
}

async function callOpenAIDirect(messages: Message[]) {
  if (!enableBrowserOpenAI || !browserKey) throw new Error('Browser OpenAI disabled or missing key');
  const resp = await fetch(`${openaiBase}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${browserKey}` },
    body: JSON.stringify({ model: openaiModel, messages, temperature: 0.7 }),
  });
  if (!resp.ok) throw new Error(`OpenAI HTTP ${resp.status}`);
  const json = await resp.json();
  return json.choices?.[0]?.message?.content ?? '';
}

function mockAI(messages: Message[]) {
  const last = messages.slice().reverse().find(m => m.role === 'user');
  return `Demo reply (offline): You said — "${last?.content ?? ''}".`;
}

export async function chatCompletion(messages: Message[]) {
  // Try Supabase edge function -> then browser OpenAI -> then mock
  try {
    return await callSupabase(messages);
  } catch {}
  try {
    return await callOpenAIDirect(messages);
  } catch {}
  return mockAI(messages);
}

// Legitimacy: Analyze a political claim; strictly descriptive; outputs rating+reasons.
export async function analyzeLegitimacy(claim: string) {
  const sys: Message = { role: 'system', content: 'You are a neutral policy analyst. Provide descriptive, sourced reasoning and uncertainty. No opinions.' };
  const user: Message = { role: 'user', content: `Analyze the credibility of this claim. Return JSON with keys rating (True/Mixed/False/Unclear), reasons (bulleted), uncertainties (bulleted), suggested_filters (bulleted).

Claim: ${claim}` };
  try {
    const content = await chatCompletion([sys, user]);
    // If model didn’t return JSON, wrap it.
    let json: any;
    try { json = JSON.parse(content); } catch { json = { rating: 'Unclear', reasons: [content], uncertainties: [], suggested_filters: ['Try bill number or Congress session'] }; }
    return json;
  } catch (e:any) {
    return { rating: 'Unclear', reasons: [e?.message ?? 'Unknown error'], uncertainties: [], suggested_filters: [] };
  }
}
