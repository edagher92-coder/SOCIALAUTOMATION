# Business Context Packs — Index

## What Context Packs Are

A context pack is a folder that holds everything the AdPilot OS system needs to know
about a specific business: its model, pricing rules, service area, channel voice, ad
structure, and config. Context packs are deliberately separate from the universal
AdPilot OS core so that the sellable product ships without any private client data
embedded in it.

The system is split into two layers:

| Layer | What lives here | Ships with resale build? |
|---|---|---|
| Universal core | Platform connectors, campaign logic, prompt engine, reporting templates | Yes |
| Context pack | Business-specific knowledge, config, voice rules, pricing, audience | No — except `universal/` |

---

## Packs in This Directory

| Folder | Description | Ships with resale? |
|---|---|---|
| `universal/` | Example Co — the generic demo business used in templates and onboarding | **Yes — always** |
| `snowflow/` | Snowflow NSW / Slushieco — private operator pack | **No — strip before resale** |
| `profit-minute-au/` | Profit Minute AU — private operator pack | **No — strip before resale** |

---

## Why Private Knowledge Stays Here

The universal core of AdPilot OS is designed to be resold. If client pricing, service
areas, ad hooks, and business logic were embedded in the core, every resale build would
ship with one client's private data visible to the next.

Context packs solve this by isolating all business-specific knowledge in a single folder.
The core reads from whichever pack is active; it never hard-codes any of it.

This also means the operator (the person reselling AdPilot OS) can maintain one clean
codebase and simply switch or add a pack per client deployment.

---

## How the System Loads a Pack

The active pack is declared in the root config file via `client_context_pack`:

```yaml
# adpilot-config.yaml (root)
client_context_pack: "snowflow"   # Loads business-context/snowflow/
```

At runtime, AdPilot OS reads:
1. The universal defaults from `business-context/universal/`.
2. The active client pack from `business-context/{client_context_pack}/`.
3. Client-specific values override universal defaults where both define the same key.

Runtime secrets (API keys, account IDs, pixel IDs, tokens) are **never stored in the
pack**. They are injected from the secrets manager using the `{{client.*}}` placeholder
pattern defined in each pack's config snippet.

---

## Resale Build Rule

When packaging AdPilot OS for delivery to a new client:

1. Start from the universal core.
2. Include `business-context/universal/` unchanged.
3. **Remove all other context pack folders** (`snowflow/`, `profit-minute-au/`, and any
   other operator-specific packs).
4. Add the new client's pack in its place (e.g. `business-context/acme-hvac/`).
5. Verify the build contains zero real account IDs, pixel IDs, tokens, personal emails,
   phone numbers, or identifying business data before delivery.

---

## The No-Secrets Rule

Context packs must never contain real secrets or identifying identifiers. This is not
optional.

**Never store in a context pack:**
- Meta ad account IDs, pixel IDs, or app IDs
- TikTok account IDs or pixel IDs
- API keys or access tokens of any kind
- Real personal email addresses or phone numbers
- Payment or banking details

Use `{{client.*}}` placeholders in config snippets. Real values are injected at
deploy time by the secrets manager or CI/CD pipeline. See each pack's README for the
canonical config snippet with correct placeholder names.

---

## Adding a New Client Pack

1. Create a new folder: `business-context/{client-slug}/`
2. Add a `README.md` following the structure in any existing private pack.
3. Include a `client-config.yaml` snippet with `{{client.*}}` placeholders — no real IDs.
4. Document the business model, pricing rules, service area, channel voice, and active
   ad lanes.
5. Register the slug in the root config before deploying.
