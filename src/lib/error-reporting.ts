// Generic client-side error reporting. No-op by default — wire this up to
// Sentry, PostHog, your own logging endpoint, or whatever you use, by
// filling in the body of `reportError` below.

export function reportError(error: unknown, context: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;

  const message =
    error instanceof Response
      ? `Response ${error.status}${error.url ? ` at ${error.url}` : ""}`
      : error instanceof Error
        ? error.message
        : String(error);
  const stack = error instanceof Error ? error.stack : undefined;

  // Always log locally so errors are visible in the browser console / your
  // server logs even before you wire up a reporting service.
  console.error("[error-boundary]", message, {
    stack,
    route: window.location.pathname,
    ...context,
  });

  // Example: send to your own endpoint or a third-party SDK here, e.g.
  //   window.Sentry?.captureException(error, { extra: context });
}
