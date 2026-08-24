import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { analyzeLabel, ScanInputSchema } from "./scan.server";

export const scanLabel = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ScanInputSchema.parse(input))
  .handler(async ({ data }: { data: z.infer<typeof ScanInputSchema> }) => {
    return analyzeLabel(data);
  });
