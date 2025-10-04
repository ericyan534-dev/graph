# PoliScope — Dev Quick Start

## Install & Run
```bash
npm i
npm run dev
```

### Optional: enable real AI in the browser (exposes key to client; for development only)
Create `.env` in the repo root with:
```
VITE_ENABLE_BROWSER_OPENAI=true
VITE_OPENAI_API_KEY=sk-...
VITE_OPENAI_MODEL=gpt-4o-mini
VITE_OPENAI_BASE_URL=https://api.openai.com/v1
```
If not set, chat/legitimacy will fall back to the Supabase Edge Function (if running) or a **demo offline** response.

## Pages
- **Chat** (with Search Legitimacy panel)
- **Bills** (status, metadata, CRS summary, text links — demo data)
- **Transparency** (timeline, blame, influence overlay — demo)

## Notes
- Light/Dark toggle in header; preference saved to localStorage.
- Branding set to **PoliScope**.
