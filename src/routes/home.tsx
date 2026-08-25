import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Compatibility redirect. The app no longer has a separate /home page;
 * the index route is the Home screen and owns the shared bottom navigation.
 */
export const Route = createFileRoute("/home")({
  beforeLoad: () => {
    throw redirect({ to: "/" });
  },
});
