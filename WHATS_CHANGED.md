# What's in this overlay

Extract this zip straight into your project root (`PlateGuardAI-main/`) and
let it overwrite — every path here mirrors `src/...` exactly.

## New files
- `src/components/bottom-nav.tsx` — shared 5-tab bottom nav (Home/Scan/History/News/Profile)
- `src/routes/home.tsx` — new dashboard route (`/home`)
- `src/routes/news.tsx` — new health-news route (`/news`)
- `src/lib/news.ts` — curated article seed data
- `src/lib/barcode.ts` — Open Food Facts barcode lookup helper

## Modified files
- `src/routes/scan.tsx` — added barcode lookup + paste-ingredient-text input, bottom nav, back-link now points to `/home`
- `src/routes/history.tsx` — bottom nav, back-link now points to `/home`
- `src/routes/profile.tsx` — bottom nav (stacked above its wizard action bar), back-link now points to `/home`
- `src/routes/login.tsx` — post-login redirect now goes to `/home` instead of `/scan`
- `src/lib/scan.server.ts` — `ScanInputSchema`/`analyzeLabel` now accept pasted ingredient text as an alternative to a photo
- `src/lib/scan.functions.ts` — unchanged logic, included only because it re-exports the updated schema type
- `src/routeTree.gen.ts` — regenerated to include the new `/home` and `/news` routes (will also auto-regenerate the next time you run `vite dev`/`build`)

## After extracting
```
npm install   # only if you don't already have deps installed
npm run dev
```
No new dependencies were added — barcode lookup uses a plain `fetch()` to the free Open Food Facts API.
