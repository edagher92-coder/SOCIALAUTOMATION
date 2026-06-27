"use client";
/**
 * ChatGroundingNudge
 *
 * A subtle inline nudge rendered inside ChatPanel when a free-plan user has
 * sent a message that would benefit from account grounding (live account data).
 * It sits between the last user bubble and the assistant's (ungrounded) reply,
 * so the user sees it right as they receive general-knowledge advice rather than
 * real-number analysis.
 *
 * Detection heuristic: any message that contains a signal word from
 * GROUNDING_SIGNALS is treated as account-specific. This list should stay
 * conservative — false positives waste good will; false negatives are silent.
 *
 * Usage: see integration notes below. The component is NOT exported from this
 * file as a default; it is a named export so ChatPanel can tree-shake it.
 */
import Link from "next/link";

// Conservative lexicon: terms that suggest the user is asking about their own account.
const GROUNDING_SIGNALS = [
  "my account", "my campaign", "my ads", "my results", "my data",
  "my roas", "my cpa", "my spend", "my ctr", "my leads",
  "our account", "our campaign", "our ads", "our results",
  "which campaigns", "which ads", "what's happening", "what is happening",
  "why is my", "why are my", "should i pause", "should i kill",
  "my creative", "my budget", "my audience",
];

export function isGroundingQuestion(text: string): boolean {
  const lower = text.toLowerCase();
  return GROUNDING_SIGNALS.some((s) => lower.includes(s));
}

interface Props {
  /** The user's message text — used to decide whether to show the nudge. */
  userMessage: string;
  /** If true, nudge has already been dismissed this session. */
  dismissed: boolean;
  onDismiss: () => void;
}

export function ChatGroundingNudge({ userMessage, dismissed, onDismiss }: Props) {
  if (dismissed) return null;
  if (!isGroundingQuestion(userMessage)) return null;

  return (
    <div
      role="note"
      aria-label="Account grounding available on Pro"
      className="mx-1 flex items-start gap-3 rounded-xl border border-[#ffb224]/40 bg-[#fffbf0] px-3.5 py-3"
    >
      {/* Amber dot accent */}
      <span
        className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full text-[10px]"
        style={{ background: "#ffb224", color: "#fff" }}
        aria-hidden
      >
        ✦
      </span>

      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-[#1a2236]">
          This answer is based on general knowledge, not your account.
        </p>
        <p className="mt-0.5 text-xs leading-relaxed text-[#5a6577]">
          Pro connects your live Meta &amp; TikTok data, so the AI specialists
          can analyse your actual numbers rather than giving general guidance.
        </p>
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          <Link
            href="/billing"
            className="inline-flex items-center gap-1 rounded-lg bg-[#f9603f] px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-[#e0522f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#f9603f]"
          >
            Unlock grounded answers — Pro $149/mo
          </Link>
          <button
            type="button"
            onClick={onDismiss}
            className="text-[11px] font-semibold text-[#5a6577] underline-offset-2 hover:text-[#1a2236] hover:underline"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

/*
 * ── Integration notes (ChatPanel.tsx) ───────────────────────────────────────
 *
 * The nudge should appear once per panel session, after the first message that
 * triggers the heuristic. Add state and import at the top of ChatPanel:
 *
 *   import { ChatGroundingNudge, isGroundingQuestion } from "./ChatGroundingNudge";
 *   …
 *   const [groundingNudgeDismissed, setGroundingNudgeDismissed] = useState(false);
 *   // Track the message that triggered detection so we can pass it as a prop.
 *   const [groundingTriggerMsg, setGroundingTriggerMsg] = useState("");
 *
 * Inside the `send` callback, just after `setMessages(next)`:
 *
 *   if (!hasGrounding && !groundingNudgeDismissed && isGroundingQuestion(content)) {
 *     setGroundingTriggerMsg(content);
 *   }
 *
 * In the Messages section of the JSX, insert the nudge between the message
 * list and the typing indicator — i.e. after the map over messages and before
 * the `{busy && …}` block:
 *
 *   {!hasGrounding && groundingTriggerMsg && (
 *     <ChatGroundingNudge
 *       userMessage={groundingTriggerMsg}
 *       dismissed={groundingNudgeDismissed}
 *       onDismiss={() => setGroundingNudgeDismissed(true)}
 *     />
 *   )}
 *
 * The guard `!hasGrounding` means Pro/Expert users never see this. The nudge
 * appears at most once per panel open (dismissed state lives in component state,
 * not sessionStorage, so it resets when the panel is closed and reopened — that
 * is intentional; users who come back have signalled renewed intent).
 *
 * The exact insertion point in ChatPanel.tsx is after line 168:
 *   {messages.map((m, i) => <Bubble key={i} msg={m} />)}
 * and before line 169:
 *   {busy && (
 */
