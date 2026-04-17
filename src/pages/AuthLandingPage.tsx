import { useState } from "react";
import { FiLogIn, FiUserPlus, FiTrendingUp, FiShield, FiZap } from "react-icons/fi";
import { SignInDialog } from "@/components/SignInDialog";
import { SignUpDialog } from "@/components/SignUpDialog";
import { Images } from "@/assets/image";

export function AuthLandingPage() {
	const [signInOpen, setSignInOpen] = useState(false);
	const [signUpOpen, setSignUpOpen] = useState(false);

	return (
		<>
			<div className="relative min-h-screen overflow-x-hidden bg-[#041719] text-slate-100">
				<div
					className="pointer-events-none absolute -left-24 top-10 h-[28rem] w-[28rem] rounded-full bg-teal-500/30 blur-3xl"
					aria-hidden
				/>
				<div
					className="pointer-events-none absolute -right-20 top-20 h-[28rem] w-[28rem] rounded-full bg-emerald-500/25 blur-3xl"
					aria-hidden
				/>
				<div
					className="pointer-events-none absolute bottom-[-5rem] left-1/2 h-[24rem] w-[24rem] -translate-x-1/2 rounded-full bg-cyan-500/20 blur-3xl"
					aria-hidden
				/>
				<div
					className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_-10%,rgba(45,212,191,0.22),transparent_42%),radial-gradient(circle_at_85%_10%,rgba(16,185,129,0.18),transparent_40%),linear-gradient(180deg,#041719_0%,#06222a_100%)]"
					aria-hidden
				/>

				<header className="relative z-10">
					<div className="mx-auto w-full max-w-6xl px-4 pt-4 sm:px-6 sm:pt-6">
						<div className="flex h-16 items-center justify-between rounded-2xl border border-teal-300/20 bg-white/5 px-4 shadow-[0_8px_28px_rgba(13,148,136,0.35)] backdrop-blur-xl sm:px-5">
							<div className="flex items-center gap-3">
								<div className="w-9 h-9 rounded-lg bg-gradient-to-br from-teal-500 via-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-900/40">
									<img className="w-6" src={Images.Logo} />
								</div>
								<div className="leading-tight">
									<p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-300">
										TradeGPT
									</p>
									<p className="text-sm font-semibold text-slate-100">
										CryptDocker Workspace
									</p>
								</div>
							</div>
							<div className="flex items-center gap-2 sm:gap-3">
								<button
									type="button"
									onClick={() => setSignInOpen(true)}
									className="inline-flex items-center gap-2 rounded-xl border border-teal-300/30 bg-white/10 px-3.5 py-2 text-xs font-semibold text-slate-100 transition-colors hover:border-teal-300/60 hover:bg-white/15 sm:px-4 sm:text-sm">
									<FiLogIn aria-hidden className="h-4 w-4" />
									<span>Sign in</span>
								</button>
								<button
									type="button"
									onClick={() => setSignUpOpen(true)}
									className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500 px-3.5 py-2 text-xs font-semibold text-white shadow-md shadow-teal-900/40 transition-opacity hover:opacity-95 sm:px-4 sm:text-sm">
									<FiUserPlus aria-hidden className="h-4 w-4" />
									<span>Sign up</span>
								</button>
							</div>
						</div>
					</div>
				</header>

				<main className="relative mx-auto flex min-h-[calc(100vh-5.5rem)] w-full max-w-6xl items-center px-4 py-10 sm:px-6 md:py-14">
					<div className="mx-auto w-full max-w-5xl rounded-[2rem] border border-teal-300/20 bg-white/[0.07] p-8 shadow-[0_24px_70px_rgba(13,148,136,0.35)] backdrop-blur-xl md:p-12">
						<span className="inline-flex items-center gap-2 rounded-full border border-teal-300/30 bg-teal-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-200">
							<FiZap aria-hidden className="h-3.5 w-3.5" />
							Transformative Teal
						</span>
						<h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight text-slate-50 md:text-5xl lg:text-6xl">
							Modern AI workspace
							<span className="block bg-gradient-to-r from-teal-300 via-emerald-300 to-cyan-300 bg-clip-text text-transparent">
								for crypto traders
							</span>
						</h1>
						<p className="mt-5 max-w-3xl text-lg leading-relaxed text-slate-300 md:text-xl">
							Analyze faster, manage risk better, and make cleaner decisions
							with mode-based AI built for professional crypto workflows.
						</p>
						<div className="mt-8 grid gap-3 text-sm sm:grid-cols-3">
							<FeaturePill
								icon={<FiTrendingUp aria-hidden className="h-4 w-4" />}
								tint="text-teal-300 bg-teal-400/15"
								label="Core Trading Modes"
							/>
							<FeaturePill
								icon={<FiShield aria-hidden className="h-4 w-4" />}
								tint="text-emerald-300 bg-emerald-400/15"
								label="Performance & Safety Modes"
							/>
							<FeaturePill
								icon={<FiZap aria-hidden className="h-4 w-4" />}
								tint="text-cyan-300 bg-cyan-400/15"
								label="System-Aware Pro Modes"
							/>
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

function FeaturePill({
	icon,
	tint,
	label,
}: {
	icon: React.ReactNode;
	tint: string;
	label: string;
}) {
	return (
		<div className="rounded-2xl border border-teal-300/20 bg-white/[0.06] px-4 py-4 text-slate-200">
			<p className="flex items-center justify-center gap-2 text-center font-semibold text-slate-100">
				<span className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${tint}`}>
					{icon}
				</span>
				<span>{label}</span>
			</p>
		</div>
	);
}
