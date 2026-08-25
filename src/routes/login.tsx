import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { LogIn, UserPlus, ShieldCheck, Accessibility } from "lucide-react";
import { Button } from "@/components/ui/button";
import { requireSupabase } from "@/lib/supabase";
import { loadProfileStore, saveProfileStore } from "@/lib/profile";
import { loadHistory } from "@/lib/history";
import { pushProfileStore, pushHistory, pullProfileStore, pullHistory } from "@/lib/cloud-sync";

export const Route = createFileRoute("/login")({ component: LoginPage });

function LoginPage() {
  const nav=useNavigate(); const [email,setEmail]=useState(""); const [password,setPassword]=useState("");
  const [mode,setMode]=useState<"login"|"signup">("login"); const [busy,setBusy]=useState(false); const [error,setError]=useState("");
  async function signInWithGoogle() {
    setBusy(true);
    setError("");
    try {
      const s = requireSupabase();
      const { error } = await s.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err?.message ?? "Unable to continue with Google.");
      setBusy(false);
    }
  }

  async function submit(e:React.FormEvent) {
    e.preventDefault(); setBusy(true); setError("");
    try {
      const s=requireSupabase();
      const result=mode==="login"
        ? await s.auth.signInWithPassword({email,password})
        : await s.auth.signUp({email,password});
      if(result.error) throw result.error;
      if(mode==="signup" && !result.data.session) { setError("Account created. Check your email to confirm, then log in."); return; }
      // First preserve existing device data in the cloud, then hydrate from cloud when it exists.
      const cloud=await pullProfileStore();
      if(cloud) saveProfileStore(cloud); else await pushProfileStore(loadProfileStore());
      const cloudHistory=await pullHistory();
      if(cloudHistory) localStorage.setItem("PlateGuard.history.v1",JSON.stringify(cloudHistory)); else await pushHistory(loadHistory());
      await nav({to:"/"});
    } catch(err:any) { setError(err?.message ?? "Unable to continue."); } finally { setBusy(false); }
  }
  return <main className="flex min-h-[100dvh] w-full min-w-0 max-w-full items-center justify-center overflow-x-hidden bg-background px-3 py-5 text-foreground sm:px-4 sm:py-10">
    <section className="box-border w-full min-w-0 max-w-md overflow-hidden rounded-3xl border bg-card p-5 shadow-xl sm:p-7">
      <div className="mb-6 text-center"><div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-primary/15 text-primary"><ShieldCheck/></div>
      <h1 className="font-display text-3xl font-bold">{mode==="login"?"Welcome back":"Create your account"}</h1>
      <p className="mt-2 text-sm text-muted-foreground">Your profiles and scan history are securely saved to your account.</p></div>
      <form onSubmit={submit} className="space-y-4">
        <input required type="email" placeholder="Email address" value={email} onChange={e=>setEmail(e.target.value)} className="h-11 w-full min-w-0 rounded-xl border bg-background px-3"/>
        <input required minLength={6} type="password" placeholder="Password (min. 6 characters)" value={password} onChange={e=>setPassword(e.target.value)} className="h-11 w-full min-w-0 rounded-xl border bg-background px-3"/>
        {error && <p className="break-words text-sm text-destructive">{error}</p>}
        <Button disabled={busy} className="h-11 w-full min-w-0 rounded-xl" type="submit">{mode==="login"?<LogIn/>:<UserPlus/>}{busy?"Please wait...":mode==="login"?"Log in":"Sign up"}</Button>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
        <div className="h-px flex-1 bg-border" />
        <span>or</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <Button
        type="button"
        variant="outline"
        disabled={busy}
        onClick={signInWithGoogle}
        className="h-11 w-full min-w-0 rounded-xl px-4"
      >
        <span aria-hidden="true" className="grid size-5 shrink-0 place-items-center rounded-full bg-white text-sm font-bold text-[#4285F4]">G</span>
        <span className="min-w-0 truncate">Continue with Google</span>
      </Button>

      <button className="mt-5 w-full min-w-0 break-words text-sm text-primary hover:underline" onClick={()=>{setMode(mode==="login"?"signup":"login");setError("")}}>
        {mode==="login"?"New here? Create an account":"Already have an account? Log in"}
      </button>

      <div className="mt-5 border-t pt-5">
        <a
          href="/scan"
          className="grid w-full min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-3 overflow-hidden rounded-xl border border-input bg-background px-4 py-3 text-left transition-colors hover:bg-accent"
        >
          <Accessibility className="size-5 shrink-0 text-primary" />
          <span className="min-w-0 max-w-full overflow-hidden">
            <span className="block break-words text-sm font-semibold leading-5">Accessibility: scan without logging in</span>
            <span className="mt-1 block break-words text-xs font-normal leading-4 text-muted-foreground">Go directly to the scanner with the simplest path.</span>
          </span>
        </a>
      </div>
    </section>
  </main>;
}