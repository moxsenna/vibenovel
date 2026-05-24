# Community 10: Gemini API Pool Layer

This community represents the **Gemini API Pool Layer** functional module of the VibeNovel v2 system.

## Community Members
| Node / Symbol | Type | Source File | Location |
| --- | --- | --- | --- |
| `.constructor()` | **CODE** | `src/services/ai/gemini-pool.ts` | L13 |
| `.generateContent()` | **CODE** | `src/services/ai/gemini-pool.ts` | L98 |
| `.getNextKey()` | **CODE** | `src/services/ai/gemini-pool.ts` | L36 |
| `.reportError()` | **CODE** | `src/services/ai/gemini-pool.ts` | L83 |
| `.reportRateLimit()` | **CODE** | `src/services/ai/gemini-pool.ts` | L66 |
| `.reportSuccess()` | **CODE** | `src/services/ai/gemini-pool.ts` | L76 |
| `.syncKeys()` | **CODE** | `src/services/ai/gemini-pool.ts` | L21 |
| `GeminiPool` | **CODE** | `src/services/ai/gemini-pool.ts` | L9 |

## Intra-Community Relationships
These symbols have structural or semantic relationships within this community:
- `GeminiPool` --**method**--> `.constructor()` _(EXTRACTED)_
- `GeminiPool` --**method**--> `.syncKeys()` _(EXTRACTED)_
- `GeminiPool` --**method**--> `.getNextKey()` _(EXTRACTED)_
- `GeminiPool` --**method**--> `.reportRateLimit()` _(EXTRACTED)_
- `GeminiPool` --**method**--> `.reportSuccess()` _(EXTRACTED)_
- `GeminiPool` --**method**--> `.reportError()` _(EXTRACTED)_
- `GeminiPool` --**method**--> `.generateContent()` _(EXTRACTED)_
- `.constructor()` --**calls**--> `.syncKeys()` _(EXTRACTED)_
- `.getNextKey()` --**calls**--> `.syncKeys()` _(EXTRACTED)_
- `.generateContent()` --**calls**--> `.getNextKey()` _(EXTRACTED)_
- `.generateContent()` --**calls**--> `.reportRateLimit()` _(EXTRACTED)_
- `.generateContent()` --**calls**--> `.reportSuccess()` _(EXTRACTED)_
- `.generateContent()` --**calls**--> `.reportError()` _(EXTRACTED)_

## Cross-Community Bridges
These connections cross the boundary between this community and other system modules:
- `ai-router.ts` --**imports**--> `GeminiPool` (links to [Community 3: AI Router & Configuration](community_3.md))
- `gemini-pool.ts` --**contains**--> `GeminiPool` (links to [Community 3: AI Router & Configuration](community_3.md))

---
[← Back to Wiki Home](index.md)