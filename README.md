# SnackSafe AI

Point your camera at a packaged food label and get an instant verdict —
safe, caution, or do-not-eat — checked against your own allergies and
health conditions, with the exact ingredient responsible.

This project runs entirely on its own: a TanStack Start (React) app with a
server function that calls a vision-capable AI model to read the label.
It is **not connected to Lovable** — you own the whole stack and can deploy
it anywhere that runs Node.js.

## Setup

1. **Install dependencies**

   ```sh
   npm i
   ```

2. **Add an AI provider key.** Copy `.env.example` to `.env` and fill in
   **one** of the provider keys — the app auto-detects whichever is set.
   The easiest free option is Google Gemini:

   ```sh
   cp .env.example .env
   ```

   Get a free Gemini key at <https://aistudio.google.com/apikey>, then set:

   ```
   GOOGLE_GENERATIVE_AI_API_KEY=your-key-here
   ```

   See `.env.example` for the OpenAI, Anthropic, and generic
   OpenAI-compatible alternatives.

3. **Run it**

   ```sh
   npm run dev
   ```

   Open the printed local URL. The homepage is at `/`, the scanner at
   `/scan`, and the profile setup at `/profile`.

## Building for production

```sh
npm run build
node .output/server/index.mjs
```

This starts a plain Node.js server (the default build target is the
`node-server` Nitro preset) — deployable to any Node host: a VPS, Railway,
Render, Fly.io, etc. To target a different platform instead (Cloudflare,
Vercel, Netlify, Deno Deploy…), change the `nitro({ preset: ... })` line in
`vite.config.ts`. See <https://nitro.build/deploy> for the full preset list.

## Installing as an app (PWA)

The app ships with a web manifest and service worker, so once it's
deployed, visitors can "Add to Home Screen" / "Install" it from their
browser for a native-app-like experience — no app store required.

## Project structure

- `src/routes/` — pages (file-based routing via TanStack Router)
- `src/lib/scan.server.ts` — the label-analysis server function
- `src/lib/ai-provider.server.ts` — picks an AI provider from your `.env`
- `src/components/ui/` — shadcn/ui components
- `public/` — static assets, manifest, service worker, hero media
