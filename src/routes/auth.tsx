import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — Betty" }] }),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  return (
    <div className="min-h-screen grid place-items-center bg-background text-foreground px-4">
      <div className="w-full max-w-sm">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="size-9 rounded-lg bg-[image:var(--gradient-brand)] grid place-items-center text-brand-foreground font-bold text-lg shadow-[var(--shadow-glow)]">b</div>
          <span className="text-xl font-semibold tracking-tight">betty</span>
        </Link>

        <div className="rounded-2xl border border-border bg-surface p-6">
          <h1 className="text-xl font-semibold text-center">
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-1 text-center text-sm text-muted-foreground">
            {mode === "signin" ? "Sign in to continue creating" : "Start creating with AI in seconds"}
          </p>

          <button className="mt-6 w-full h-10 rounded-md bg-background border border-border text-sm font-medium flex items-center justify-center gap-2 hover:bg-surface-hover">
            <svg viewBox="0 0 24 24" className="size-4"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.07 5.07 0 0 1-2.2 3.32v2.77h3.56c2.08-1.92 3.28-4.74 3.28-8.1Z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.77c-.98.66-2.24 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"/><path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.07H2.18A11 11 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.83Z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.2 1.64l3.15-3.15C17.45 2.1 14.97 1 12 1A11 11 0 0 0 2.18 7.07l3.66 2.83C6.71 7.3 9.14 5.38 12 5.38Z"/></svg>
            Continue with Google
          </button>

          <div className="my-5 flex items-center gap-3 text-[11px] text-muted-foreground">
            <div className="flex-1 h-px bg-border" /> OR <div className="flex-1 h-px bg-border" />
          </div>

          <form className="space-y-3">
            <input type="email" placeholder="Email" className="w-full h-10 px-3 rounded-md bg-background border border-border text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
            <input type="password" placeholder="Password" className="w-full h-10 px-3 rounded-md bg-background border border-border text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
            <button type="button" className="w-full h-10 rounded-md bg-[image:var(--gradient-brand)] text-brand-foreground text-sm font-semibold shadow-[var(--shadow-glow)]">
              {mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-muted-foreground">
            {mode === "signin" ? "Don't have an account?" : "Already have one?"}{" "}
            <button onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="text-foreground underline-offset-4 hover:underline">
              {mode === "signin" ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>

        <p className="mt-6 text-center text-[11px] text-muted-foreground">
          By continuing you agree to Betty's Terms & Privacy Policy.
        </p>
      </div>
    </div>
  );
}
