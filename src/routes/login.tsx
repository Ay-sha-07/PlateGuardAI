import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { LogIn, UserPlus, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { requireSupabase } from "@/lib/supabase";
import { loadProfileStore, saveProfileStore } from "@/lib/profile";
import { loadHistory } from "@/lib/history";
import { pushProfileStore, pushHistory, pullProfileStore, pullHistory } from "@/lib/cloud-sync";

export const Route = createFileRoute("/login")({ component: LoginPage });

function LoginPage() {
  const nav=useNavigate(); const [email,setEmail]=useState(""); const [password,setPassword]=useState("");
  const [mode,setMode]=useState<"login"|"signup">("login"); const [busy,setBusy]=useState(false); const [error,setError]=useState("");
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
      await nav({to:"/home"});
    } catch(err:any) { setError(err?.message ?? "Unable to continue."); } finally { setBusy(false); }
  }
  return <main className="min-h-screen bg-background px-4 py-10 text-foreground flex items-center justify-center">
    <section className="w-full max-w-md rounded-3xl border bg-card p-7 shadow-xl">
      <div className="mb-6 text-center"><div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-primary/15 text-primary"><ShieldCheck/></div>
      <h1 className="font-display text-3xl font-bold">{mode==="login"?"Welcome back":"Create your account"}</h1>
      <p className="mt-2 text-sm text-muted-foreground">Your profiles and scan history are securely saved to your account.</p></div>
      <form onSubmit={submit} className="space-y-4">
        <input required type="email" placeholder="Email address" value={email} onChange={e=>setEmail(e.target.value)} className="h-11 w-full rounded-xl border bg-background px-3"/>
        <input required minLength={6} type="password" placeholder="Password (min. 6 characters)" value={password} onChange={e=>setPassword(e.target.value)} className="h-11 w-full rounded-xl border bg-background px-3"/>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button disabled={busy} className="h-11 w-full rounded-xl" type="submit">{mode==="login"?<LogIn/>:<UserPlus/>}{busy?"Please wait...":mode==="login"?"Log in":"Sign up"}</Button>
      </form>
      <button className="mt-5 w-full text-sm text-primary hover:underline" onClick={()=>{setMode(mode==="login"?"signup":"login");setError("")}}>
        {mode==="login"?"New here? Create an account":"Already have an account? Log in"}
      </button>
    </section>
  </main>;
}