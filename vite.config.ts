import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import viteReact from "@vitejs/plugin-react";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";

// Standalone Vite + TanStack Start config — no Lovable-specific tooling.
// Builds a plain Node.js server by default (nitro preset "node-server"),
// so `npm run build && node .output/server/index.mjs` runs anywhere.
// To target a different host instead, change the nitro preset below —
// e.g. "cloudflare-module", "vercel", "netlify", "deno-deploy". See
// https://nitro.build/deploy for the full list of presets.
//
// IMPORTANT: the nitro plugin is build-only. In dev mode, TanStack
// Start's own dev server handles SSR directly — adding nitro's plugin
// during `vite dev` makes it try to attach its own Vite "environment"
// into the dev pipeline, which isn't ready for it and breaks asset
// serving (CSS silently fails to apply, among other things).
export default defineConfig(({ command }) => ({
  plugins: [
    tailwindcss(),
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    tanstackStart({
      importProtection: {
        behavior: "error",
        client: {
          files: ["**/server/**"],
          specifiers: ["server-only"],
        },
      },
      server: { entry: "server" },
    }),
    ...(command === "build" ? [nitro({ preset: "node-server" })] : []),
    viteReact(),
  ],
}));


