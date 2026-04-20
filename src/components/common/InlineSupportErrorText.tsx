import { SUPPORT_TEAM_URL } from "@/lib/apiError";

type Props = {
  message: string;
};

const SUPPORT_PHRASE = "support team";

export function InlineSupportErrorText({ message }: Props) {
  const lower = message.toLowerCase();
  const idx = lower.indexOf(SUPPORT_PHRASE);

  if (idx < 0) return <>{message}</>;

  const before = message.slice(0, idx);
  const phrase = message.slice(idx, idx + SUPPORT_PHRASE.length);
  const after = message.slice(idx + SUPPORT_PHRASE.length);

  return (
    <>
      {before}
      <a
        href={SUPPORT_TEAM_URL}
        target="_blank"
        rel="noreferrer"
        className="underline underline-offset-2 hover:opacity-90"
      >
        {phrase}
      </a>
      {after}
    </>
  );
}
