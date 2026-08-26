import { createFileRoute, useNavigate } from "@tanstack/react-router";
import * as React from "react";
import { useState } from "react";
import { LogIn, UserPlus, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { requireSupabase } from "@/lib/supabase";
import { setActiveScope } from "@/lib/account-scope";
import { LanguageSelector } from "@/components/language-selector";

export const Route = createFileRoute("/login")({ component: LoginPage });

function LoginPage() {
  const nav=useNavigate(); const [email,setEmail]=useState(""); const [password,setPassword]=useState("");
  const [mode,setMode]=useState<"login"|"signup">("login"); const [busy,setBusy]=useState(false); const [error,setError]=useState("");
  const [showPassword,setShowPassword]=useState(false);
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
      // Everything (profiles, scan history) lives only in this device's
      // localStorage, namespaced per account — switch to this account's
      // namespace so it never sees another account's data on this device.
      const userId = result.data.user?.id ?? result.data.session?.user.id;
      setActiveScope(userId);
      await nav({to:"/"});
    } catch(err:any) { setError(err?.message ?? "Unable to continue."); } finally { setBusy(false); }
  }
  return <main className="flex min-h-[100dvh] w-full min-w-0 max-w-full items-center justify-center overflow-x-hidden bg-background px-4 py-6 text-foreground sm:px-5 sm:py-10">
    <section className="relative box-border w-full min-w-0 max-w-md overflow-hidden rounded-3xl border bg-card p-6 shadow-xl sm:p-8">
      <div className="absolute right-4 top-4"><LanguageSelector compact /></div>
      <div className="mb-7 text-center">
        <img
          src="/icons/logo.png"
          alt="PlateGuard AI"
          className="mx-auto mb-4 size-16 rounded-2xl object-contain"
        />
        <h1 className="font-display text-3xl font-bold sm:text-4xl">{mode==="login"?"Welcome back":"Create your account"}</h1>
        <p className="mt-3 text-base leading-6 text-muted-foreground">Your profiles and scan history are saved securely to your account.</p>
      </div>
      <form onSubmit={submit} className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="login-email" className="block text-base font-semibold">Email address</label>
          <input
            id="login-email"
            required
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={e=>setEmail(e.target.value)}
            className="h-14 w-full min-w-0 rounded-xl border bg-background px-4 text-base"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="login-password" className="block text-base font-semibold">Password</label>
          <div className="relative">
            <input
              id="login-password"
              required
              minLength={6}
              type={showPassword ? "text" : "password"}
              autoComplete={mode==="login" ? "current-password" : "new-password"}
              placeholder="At least 6 characters"
              value={password}
              onChange={e=>setPassword(e.target.value)}
              className="h-14 w-full min-w-0 rounded-xl border bg-background px-4 pr-14 text-base"
            />
            <button
              type="button"
              onClick={()=>setShowPassword(v=>!v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-2 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              {showPassword ? <EyeOff className="size-5"/> : <Eye className="size-5"/>}
            </button>
          </div>
        </div>
        {error && <p role="alert" className="break-words text-base leading-6 text-destructive">{error}</p>}
        <Button disabled={busy} size="lg" className="h-14 w-full min-w-0 rounded-xl text-base font-semibold" type="submit">
          {mode==="login"?<LogIn className="size-5"/>:<UserPlus className="size-5"/>}
          {busy?"Please wait…":mode==="login"?"Log in":"Sign up"}
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3 text-sm text-muted-foreground">
        <div className="h-px flex-1 bg-border" />
        <span>or</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <Button
        type="button"
        variant="outline"
        size="lg"
        disabled={busy}
        onClick={signInWithGoogle}
        className="h-14 w-full min-w-0 rounded-xl px-4 text-base font-semibold"
      >
        <span aria-hidden="true" className="grid size-6 shrink-0 place-items-center rounded-full bg-white text-base font-bold text-[#4285F4]">G</span>
        <span className="min-w-0 truncate">Continue with Google</span>
      </Button>

      <button className="mt-6 w-full min-w-0 break-words text-base text-primary hover:underline" onClick={()=>{setMode(mode==="login"?"signup":"login");setError("")}}>
        {mode==="login"?"New here? Create an account":"Already have an account? Log in"}
      </button>
    </section>
  </main>;
}