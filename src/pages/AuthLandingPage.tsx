import { useState } from "react";
import { SignInDialog } from "@/components/SignInDialog";
import { SignUpDialog } from "@/components/SignUpDialog";

export function AuthLandingPage() {
  const [signInOpen, setSignInOpen] = useState(false);
  const [signUpOpen, setSignUpOpen] = useState(false);

  return (
    <>
      <div className="relative min-h-screen overflow-x-hidden bg-[#070711] text-slate-100">
        <div
          className="pointer-events-none absolute -left-24 top-10 h-[28rem] w-[28rem] rounded-full bg-violet-600/35 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-20 top-20 h-[28rem] w-[28rem] rounded-full bg-fuchsia-600/25 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute bottom-[-5rem] left-1/2 h-[24rem] w-[24rem] -translate-x-1/2 rounded-full bg-indigo-500/25 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_-10%,rgba(168,85,247,0.22),transparent_42%),radial-gradient(circle_at_85%_10%,rgba(217,70,239,0.18),transparent_40%),linear-gradient(180deg,#070711_0%,#0b0a16_100%)]"
          aria-hidden
        />

        <header className="relative z-10">
          <div className="mx-auto w-full max-w-6xl px-4 pt-4 sm:px-6 sm:pt-6">
            <div className="flex h-16 items-center justify-between rounded-2xl border border-violet-300/20 bg-white/5 px-4 shadow-[0_8px_28px_rgba(76,29,149,0.35)] backdrop-blur-xl sm:px-5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-xs font-bold text-white shadow-md shadow-violet-900/40">
                  TG
                </div>
                <div className="leading-tight">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300">
                    TradeGPT
                  </p>
                  <p className="text-sm font-semibold text-slate-100">CryptDocker Workspace</p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setSignInOpen(true)}
                  className="rounded-xl border border-violet-300/30 bg-white/10 px-4 py-2 text-xs font-semibold text-slate-100 transition-colors hover:border-violet-300/60 hover:bg-white/15 sm:text-sm"
                >
                  Sign in
                </button>
                <button
                  type="button"
                  onClick={() => setSignUpOpen(true)}
                  className="rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-violet-900/40 transition-opacity hover:opacity-95 sm:text-sm"
                >
                  Sign up
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="relative mx-auto flex min-h-[calc(100vh-5.5rem)] w-full max-w-6xl items-center px-4 py-10 sm:px-6 md:py-14">
          <div className="mx-auto w-full max-w-5xl rounded-[2rem] border border-violet-300/20 bg-white/[0.07] p-8 shadow-[0_24px_70px_rgba(76,29,149,0.35)] backdrop-blur-xl md:p-12">
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-slate-50 md:text-5xl lg:text-6xl">
              Modern AI workspace
              <span className="block bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">
                for crypto traders
              </span>
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-relaxed text-slate-300 md:text-xl">
              Analyze faster, manage risk better, and make cleaner decisions with mode-based AI
              built for professional crypto workflows.
            </p>
            <div className="mt-8 grid gap-3 text-sm sm:grid-cols-3">
              <div className="rounded-2xl border border-violet-300/20 bg-white/[0.06] px-4 py-4 text-slate-200">
                <p className="flex items-center justify-center gap-2 text-center font-semibold text-slate-100">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-400/15 text-cyan-300">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                      <path d="M3 17l6-6 4 4 8-8" />
                      <path d="M14 7h7v7" />
                    </svg>
                  </span>
                  <span>Core Trading Modes</span>
                </p>
              </div>
              <div className="rounded-2xl border border-violet-300/20 bg-white/[0.06] px-4 py-4 text-slate-200">
                <p className="flex items-center justify-center gap-2 text-center font-semibold text-slate-100">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-violet-400/20 text-violet-300">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                      <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
                    </svg>
                  </span>
                  <span>Performance & Safety Modes</span>
                </p>
              </div>
              <div className="rounded-2xl border border-violet-300/20 bg-white/[0.06] px-4 py-4 text-slate-200">
                <p className="flex items-center justify-center gap-2 text-center font-semibold text-slate-100">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-fuchsia-400/20 text-fuchsia-300">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                      <path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" />
                    </svg>
                  </span>
                  <span>System-Aware Pro Modes</span>
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>

      <SignInDialog
        open={signInOpen}
        onClose={() => setSignInOpen(false)}
        onOpenSignUp={() => setSignUpOpen(true)}
      />
      <SignUpDialog
        open={signUpOpen}
        onClose={() => setSignUpOpen(false)}
        onOpenSignIn={() => setSignInOpen(true)}
      />
    </>
  );
}
