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


## Mobile fit + zoom lock

- The first-visit login gate is now width-safe on small mobile screens: no child button can force horizontal overflow.
- Mobile login-gate spacing/padding was tightened while preserving the larger accessibility controls.
- Added global `box-sizing: border-box`, horizontal overflow protection, and mobile touch safeguards.
- The viewport is fixed to `initial-scale=1`, `maximum-scale=1`, `minimum-scale=1`, and `user-scalable=no`.
- Added browser-side guards for pinch/gesture zoom and Ctrl/Cmd + wheel/keyboard zoom.

## Detailed AI results + history details
- Scan responses now include a detailed summary, product identity, label evidence, nutrition/ingredient highlights, profile impact, recommendation, and confidence.
- The full structured AI response is saved with each new history entry.
- Clicking a history item opens a dedicated detail view showing the saved scan image, verdict, detailed AI explanation, flagged ingredients, profile impact, reasons, and recommendation.
- Existing history entries remain usable; entries created before this feature show their saved summary and explain that a full AI response was not captured.
- If Supabase cloud history is enabled, run the `aiResult` ALTER TABLE statement in `supabase-schema.sql` once.
