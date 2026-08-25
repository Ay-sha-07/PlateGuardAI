import { createServerFn } from "@tanstack/react-start";
import { getAIHealth } from "./ai-health.server";

export const getAIHealthStatus = createServerFn({ method: "GET" }).handler(async () => {
  return getAIHealth();
});
