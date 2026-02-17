# TellyTax

Daily AI-generated news digest emails, powered by Cloudflare Workers + Durable Objects.

## Architecture

- **Worker** (`src/index.ts`): Stateless HTTP router, serves HTML pages, proxies API calls to Durable Objects
- **Durable Object** (`src/digest-object.ts`): Per-user stateful object storing email, topics, digest history. Uses DO alarms for daily scheduling at 8am UTC
- **Anthropic** (`src/anthropic.ts`): Claude claude-opus-4-6 with `web_search` tool to research topics and generate digests
- **Resend** (`src/resend.ts`): Email delivery via Resend API, from address `news@chadnauseam.com`
- **Frontend**: Vanilla HTML/CSS/JS - landing page + per-user dashboard

## Key Patterns

- SQLite-backed DO with synchronous KV API (`this.ctx.storage.kv.get/put`)
- `idFromName(uuid)` maps user UUIDs to DOs - no auth, UUID unguessability is sufficient
- DO alarms (not cron) for self-scheduled daily digests
- `pause_turn` handling loop for Claude web search reliability
- Digest history capped at 30, last 3 passed as context to avoid repetition

## Commands

```bash
pnpm dev          # Local dev server (wrangler dev)
pnpm deploy       # Deploy to Cloudflare
```

## Secrets

Local: `.dev.vars` file (gitignored)
Production: `wrangler secret put ANTHROPIC_API_KEY` / `wrangler secret put RESEND_API_KEY`

## Project Structure

```
src/
  index.ts           # Worker entry + routing
  digest-object.ts   # Durable Object class
  anthropic.ts       # Claude web search + digest generation
  resend.ts          # Email sending
  types.ts           # Shared types
  html/
    landing.ts       # Landing page template
    dashboard.ts     # Dashboard page template
public/
  style.css          # Styles
  dashboard.js       # Dashboard client-side JS
```
