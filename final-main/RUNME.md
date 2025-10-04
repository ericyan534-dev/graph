# Run This Chat App Locally (Full, Working)

## 0) Prereqs
- Node 18+ (or Bun 1.1+)
- Supabase CLI: https://supabase.com/docs/guides/cli

## 1) Env Vars
Create `.env` at project root (already present) with your Supabase project URL + anon key.
```
VITE_SUPABASE_URL="https://YOUR-PROJECT.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="YOUR-ANON-KEY"
```

## 2) Start Supabase (local) and serve the Edge Function
In one terminal:
```bash
supabase start
# optional: link a hosted project to use its secrets
# supabase link --project-ref YOUR_PROJECT_REF
cd supabase/functions/ai-chat
supabase functions serve ai-chat --no-verify-jwt --env-file ../../.env.local  # or --env-file ../../.env
```
Set these secrets for the function (either in Dashboard > Edge Functions > Secrets, or via CLI):
```bash
supabase secrets set --env-file - << 'EOF'
OPENAI_API_KEY=sk-...              # required
OPENAI_MODEL=gpt-4o-mini           # optional (default)
OPENAI_BASE_URL=https://api.openai.com/v1  # optional
EOF
```

> Production: deploy the function
```bash
supabase functions deploy ai-chat
```

## 3) Run the web app
In a new terminal at repo root:
```bash
# install deps
npm i
# start dev server
npm run dev
# open the URL shown by Vite (usually http://localhost:5173)
```

## 4) Use it
- Click **New Conversation** (or just type — the first message now auto-creates a conversation)
- Messages persist in `localStorage` under `poliscope_conversations`
- The assistant replies are fetched from the Supabase Edge Function `ai-chat`

## Notes
- If you see a red toast saying "Failed to get response", verify:
  1. The `ai-chat` function is running locally or deployed.
  2. The function has `OPENAI_API_KEY` set.
  3. Your `.env` has correct `VITE_SUPABASE_*` values matching your project.
