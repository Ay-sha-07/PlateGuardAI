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


## Rating scale update
The public PlateGuard rating now follows the intuitive safety convention: **1/5 = Avoid/unsafe, 3/5 = Use caution, 5/5 = Safe**. The server converts the internal risk scale before returning and persisting results, and existing local history is migrated once.


## Result/camera control cleanup
- Hide the external “Scan a label” button while the live camera frame is open; the in-frame shutter is the single capture control.
- Replace the isolated result-state retry icon with a full-width “Scan another label” button that reopens the camera.


## AI provider health + Groq update

- Groq now defaults to `qwen/qwen3.6-27b`, a current vision-capable Groq model.
- If an existing `.env` still contains the deprecated Llama 4 Scout model ID, the app automatically migrates it to Qwen 3.6 27B.
- Added server-side provider health memory so providers that return rate-limit, quota, auth, model, overload, or network failures are temporarily skipped instead of being hammered on every scan.
- Added an AI capacity indicator on the Scan screen (`High`, `Medium`, or `Low`) with a provider-by-provider status panel.
- The capacity indicator is deliberately based on observed provider health rather than pretending to know an exact remaining scan count; providers expose different quota systems and not all expose a universal remaining-request value.
- Provider health refreshes every 20 seconds while the Scan screen is open.
