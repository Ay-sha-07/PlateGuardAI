import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

/**
 * Wrap a page's content with this to require the visitor be logged in.
 * Anyone else is redirected to /login before the page's content renders.
 */
export function RequireEntry({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [checked, setChecked] = useState(false);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function check() {
      const loggedIn = supabase ? !!(await supabase.auth.getSession()).data.session : false;
      if (!mounted) return;

      if (loggedIn) {
        setAllowed(true);
        setChecked(true);
      } else {
        void navigate({ to: "/login" });
      }
    }

    void check();
    return () => {
      mounted = false;
    };
  }, [navigate]);

  if (!checked || !allowed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background/72">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
