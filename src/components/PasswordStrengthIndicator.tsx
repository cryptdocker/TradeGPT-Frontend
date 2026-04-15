import type { PasswordStrengthResult } from "@/lib/passwordStrength";

const LABELS = { weak: "Weak", medium: "Medium", strong: "Strong" } as const;

const BAR_COLORS = {
  weak: "bg-red-400",
  medium: "bg-amber-500",
  strong: "bg-teal-500",
} as const;

type Props = {
  strength: PasswordStrengthResult;
  className?: string;
};

export function PasswordStrengthIndicator({ strength, className = "" }: Props) {
  const { level, checks } = strength;
  const pct = level === "weak" ? 33 : level === "medium" ? 66 : 100;

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex h-1.5 overflow-hidden rounded-full bg-slate-200">
        <div
          className={`h-full rounded-full transition-all duration-300 ${BAR_COLORS[level]}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs font-medium text-slate-500">
        Strength:{" "}
        <span
          className={
            level === "weak"
              ? "font-semibold text-red-500"
              : level === "medium"
                ? "font-semibold text-amber-600"
                : "font-semibold text-teal-600"
          }
        >
          {LABELS[level]}
        </span>
      </p>
      <ul className="grid grid-cols-1 gap-1 text-[11px] text-slate-500 sm:grid-cols-2">
        <Check ok={checks.minLength} text="At least 8 characters" />
        <Check ok={checks.hasLower} text="Lowercase letter" />
        <Check ok={checks.hasUpper} text="Uppercase letter" />
        <Check ok={checks.hasNumber} text="Number" />
        <Check ok={checks.hasSpecial} text="Special character" />
      </ul>
    </div>
  );
}

function Check({ ok, text }: { ok: boolean; text: string }) {
  return (
    <li className="flex items-center gap-1.5">
      <span
        className={`inline-block h-1.5 w-1.5 rounded-full ${ok ? "bg-teal-500" : "bg-slate-300"}`}
        aria-hidden
      />
      <span className={ok ? "font-medium text-slate-700" : ""}>{text}</span>
    </li>
  );
}
