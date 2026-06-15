// Empty stand-in for the `server-only` marker package so modules that import it
// (e.g. lib/messenger/bot.ts, lib/agents/knowledge.ts) can be unit-tested under Node.
// The real package only throws when bundled into a client component; it has no
// runtime behaviour we need in tests.
export {};
