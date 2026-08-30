import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import viteReact from "@vitejs/plugin-react";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";

export default defineConfig(({ command }) => {
  // Automatically select 'vercel' on Vercel, otherwise default to 'node-server' (Render/local)
  const nitroPreset =
    process.env["NITRO_PRESET"] || (process.env["VERCEL"] ? "vercel" : "node-server");

  return {
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
      ...(command === "build" ? [nitro({ preset: nitroPreset })] : []),
      viteReact(),
    ],
  };
});


