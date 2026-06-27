"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import type { Plan } from "@/lib/entitlements";
import { ChatGroundingNudge, isGroundingQuestion } from "./ChatGroundingNudge";

type ChatAgent = { id: string; name: string; emoji: string; desc: string };
type Message = { role: "user" | "assistant"; content: string; agentName?: string };

const CHAT_AGENTS: ChatAgent[] = [
  { id: "command", name: "AdPilot", emoji: "🧭", desc: "Smart routing to the right specialist" },
  { id: "dana",    name: "Dana",    emoji: "📈", desc: "Data & unit economics" },
  { id: "mira",    name: "Mira",    emoji: "🔵", desc: "Meta / Facebook Ads" },
  { id: "travis",  name: "Travis",  emoji: "⚫", desc: "TikTok Ads" },
  { id: "riley",   name: "Riley",   emoji: "📝", desc: "Reports & summaries" },
  { id: "stella",  name: "Stella",  emoji: "🎨", desc: "Creative & copy" },
];

function MarkdownText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("**") && p.endsWith("**")
          ? <strong key={i}>{p.slice(2, -2)}</strong>
          : <span key={i}>{p}</span>
      )}
    </>
  );
}

function Bubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      <div className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs ${isUser ? "bg-brand text-white" : "bg-surface border border-border-subtle text-base"}`}>
        {isUser ? "You" : <span aria-hidden>{CHAT_AGENTS.find(a => a.name === msg.agentName)?.emoji ?? "🧭"}</span>}
      </div>
      <div className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${isUser ? "bg-brand text-white rounded-tr-sm" : "bg-white border border-border-subtle text-ink rounded-tl-sm shadow-card"}`}>
        {isUser ? msg.content : <MarkdownText text={msg.content} />}
        {!isUser && msg.agentName && (
          <p className="mt-1.5 text-2xs text-muted">{msg.agentName}</p>
        )}
      </div>
    </div>
  );
}

export default function ChatPanel({ plan }: { plan: Plan }) {
  const [open, setOpen] = useState(false);
  const [agentId, setAgentId] = useState("command");
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [groundingNudgeDismissed, setGroundingNudgeDismissed] = useState(false);
  const [groundingTriggerMsg, setGroundingTriggerMsg] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isExpert = plan === "expert";
  const hasGrounding = plan === "pro" || plan === "expert";
  const activeAgent = CHAT_AGENTS.find(a => a.id === agentId) ?? CHAT_AGENTS[0];

  useEffect(() => {
    if (open) setTimeout(() => textareaRef.current?.focus(), 120);
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  const send = useCallback(async () => {
    const content = draft.trim();
    if (!content || busy) return;
    const userMsg: Message = { role: "user", content };
    const next = [...messages, userMsg];
    setMessages(next);
    if (!hasGrounding && !groundingNudgeDismissed && isGroundingQuestion(content)) {
      setGroundingTriggerMsg(content);
    }
    setDraft("");
    setErr("");
    setBusy(true);
    try {
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next.map(m => ({ role: m.role, content: m.content })),
          agentId,
        }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { setErr(j?.error || "Something went wrong — please try again."); return; }
      setMessages(prev => [...prev, { role: "assistant", content: j.text, agentName: j.agent?.name ?? activeAgent.name }]);
    } catch {
      setErr("Couldn't reach the assistant. Check your connection.");
    } finally {
      setBusy(false);
    }
  }, [draft, busy, messages, agentId, activeAgent.name, hasGrounding, groundingNudgeDismissed]);

  function escalate() {
    const summary = messages.map(m => `${m.role === "user" ? "You" : m.agentName ?? "AdPilot"}: ${m.content}`).join("\n\n");
    const subject = encodeURIComponent("AdPilot — Chat Escalation");
    const body = encodeURIComponent(`Please review this conversation:\n\n${summary}`);
    window.open(`mailto:info@adpilot.com.au?subject=${subject}&body=${body}`);
  }

  function clearChat() { setMessages([]); setErr(""); setDraft(""); }

  return (
    <>
      {/* Floating trigger */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-label={open ? "Close AdPilot Assistant" : "Open AdPilot Assistant"}
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-brand text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl focus-visible:shadow-ring-brand print:hidden">
        <span className="text-2xl" aria-hidden>{open ? "✕" : "💬"}</span>
      </button>

      {/* Panel */}
      {open && (
        <div
          role="dialog"
          aria-label="AdPilot Assistant"
          className="fixed bottom-24 right-5 z-50 flex w-[360px] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl border border-border-subtle bg-white shadow-2xl print:hidden"
          style={{ maxHeight: "min(600px, calc(100vh - 8rem))" }}>

          {/* Header */}
          <div className="flex items-center gap-2.5 border-b border-border-subtle bg-[#eef2f8] px-4 py-3">
            <span className="text-xl" aria-hidden>{activeAgent.emoji}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-ink truncate">{activeAgent.name} — AdPilot Assistant</span>
                {hasGrounding && (
                  <span className="flex-shrink-0 rounded-full bg-teal/10 px-1.5 py-0.5 text-2xs font-semibold text-teal">Grounded</span>
                )}
              </div>
              <p className="truncate text-2xs text-muted">{activeAgent.desc}</p>
            </div>
            {messages.length > 0 && (
              <button type="button" onClick={clearChat} className="flex-shrink-0 rounded-lg px-2 py-1 text-2xs font-semibold text-muted hover:text-ink hover:bg-white transition">Clear</button>
            )}
          </div>

          {/* Agent selector */}
          <div className="flex gap-1.5 overflow-x-auto border-b border-border-subtle bg-surface px-3 py-2 scrollbar-none">
            {CHAT_AGENTS.map(a => (
              <button
                key={a.id}
                type="button"
                onClick={() => setAgentId(a.id)}
                title={a.desc}
                className={`flex-shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${agentId === a.id ? "bg-brand text-white shadow-sm" : "bg-white border border-border-subtle text-ink hover:border-brand/40"}`}>
                {a.emoji} {a.name}
              </button>
            ))}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.length === 0 && !busy && (
              <div className="flex flex-col items-center justify-center gap-2 py-8 text-center text-muted">
                <span className="text-3xl" aria-hidden>🧭</span>
                <p className="text-sm font-semibold text-ink">Ask AdPilot anything</p>
                <p className="text-xs leading-relaxed">
                  {hasGrounding
                    ? "Grounded in your latest account data. Proposals only — read-only."
                    : "General expert guidance. Upgrade to Pro for grounded account analysis."}
                </p>
              </div>
            )}
            {messages.map((m, i) => <Bubble key={i} msg={m} />)}
            {!hasGrounding && groundingTriggerMsg && (
              <ChatGroundingNudge
                userMessage={groundingTriggerMsg}
                dismissed={groundingNudgeDismissed}
                onDismiss={() => setGroundingNudgeDismissed(true)}
              />
            )}
            {busy && (
              <div className="flex gap-2">
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-surface border border-border-subtle text-base">
                  <span aria-hidden>{activeAgent.emoji}</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm bg-white border border-border-subtle px-3.5 py-2.5 shadow-card">
                  <span className="animate-bounce text-muted" style={{ animationDelay: "0ms" }}>·</span>
                  <span className="animate-bounce text-muted" style={{ animationDelay: "150ms" }}>·</span>
                  <span className="animate-bounce text-muted" style={{ animationDelay: "300ms" }}>·</span>
                </div>
              </div>
            )}
            {err && (
              <p role="alert" className="rounded-xl border border-band-red/30 bg-band-red/5 px-3 py-2 text-xs text-band-red">{err}</p>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-border-subtle bg-white p-3">
            <div className="flex gap-2">
              <textarea
                ref={textareaRef}
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onKeyDown={e => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); send(); } }}
                disabled={busy}
                rows={2}
                placeholder="Ask a question… (⌘+Enter to send)"
                className="flex-1 resize-none rounded-xl border border-border-subtle bg-surface px-3 py-2 text-sm placeholder:text-muted disabled:opacity-60 focus:outline-none focus:border-brand/50"
              />
              <button
                type="button"
                onClick={send}
                disabled={busy || !draft.trim()}
                aria-label="Send message"
                className="flex h-[58px] w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand text-white transition hover:bg-brand/90 disabled:opacity-40">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
                  <path d="M2 8l12-6-5 6 5 6z" />
                </svg>
              </button>
            </div>
            <div className="mt-1.5 flex items-center justify-between">
              <span className="text-2xs text-muted">Read-only · proposals only</span>
              {isExpert && messages.length > 0 && (
                <button type="button" onClick={escalate} className="text-2xs font-semibold text-brand hover:underline">
                  Escalate to team →
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
