# Controlled file sender — implementation report

## Architecture and scope

The existing system already had named CSV audiences, separate membership documents, contact normalization/opt-outs, authenticated admin server actions, transactional imports, campaign drafts, a Dualhook template adapter, and shared Meta/Dualhook status storage. This stage adds explicit execution on top of that foundation. Imports and draft creation still never initiate sending. Smart Driver Dispatch source and provider configuration were not changed.

The active introduction campaign has the stable identity `rentka-introduction-v1`, shared across files. Existing draft UUIDs remain draft identities; they do not partition the actual introduction campaign's duplicate protection.

## Files in this stage

Added:

- `src/lib/whatsapp-campaigns/send-types.ts`
- `src/lib/whatsapp-campaigns/send-core.ts`
- `src/lib/whatsapp-campaigns/send-gate.ts`
- `src/lib/whatsapp-campaigns/send-service.ts`
- `src/lib/whatsapp-campaigns/sender.ts`
- `app/admin/whatsapp-campaigns/send-actions.ts`
- `app/admin/whatsapp-campaigns/AudienceSender.tsx`
- `app/api/admin/whatsapp-campaigns/control/route.ts`
- `tests/whatsapp-campaign-sender.test.mjs`
- `docs/whatsapp-controlled-file-sender.md`

Updated:

- `src/lib/whatsapp-campaigns/types.ts`: active send summary and membership status types; legacy draft contracts preserved.
- `app/admin/whatsapp-campaigns/page.tsx`: authenticated file sender panel and server gate status.
- `app/admin/whatsapp-campaigns/layout.tsx`: current control guidance.
- `app/admin/whatsapp-campaigns/FileAudiences.tsx`: point import history to current send controls/results.
- `app/admin/whatsapp-campaigns/Drafts.tsx`: use current header/gate information rather than a hardcoded missing-asset claim.
- `src/lib/messaging/meta-whatsapp-webhook-repository.ts`: independently reconcile campaign delivery after existing dispatch processing.
- `src/lib/messaging/dualhook-whatsapp-webhook-repository.ts`: same addition, retaining inbound/history processing.

Other existing dirty files predate this stage and were preserved.

## Review and execution

Each confirmed file has its own Review / Send control, progress, and recipient results. Review includes campaign, audience, original filename, template/language/category, exact image URL/status, imported/valid/eligible counts, opt-outs, exclusions, invalid/duplicate numbers, prior sends, locks/uncertain outcomes, suppressed totals, and the final send count. A signed, expiring review is bound to its manifest; confirmation requires the displayed exact phrase. Confirmation rechecks the manifest transactionally. Eligibility changes require another review.

Execution seeds recipient records in server transactions of 100, then processes up to five members per request, sequentially. A shared transactional provider slot limits campaign provider concurrency to one across files and enforces at least one second between requests. An explicit HTTP 429 rejection applies a shared 30-second cooldown. The existing provider adapter has a 15-second request timeout in this sender. Run and recipient leases last two minutes. File sizes are independent of chunk sizes; no manual splitting or automatic next-file processing is added.

The open admin page requests successive bounded chunks after confirmation. It does not start work on mount. Leaving/refreshing the page stops new chunk requests; an already running chunk can finish. A new review and confirmed Resume continues remaining unsent members. There is no scheduler or background recurring sender.

Immediately before each provider call, the transaction checks current audience state, membership, E.164/contact agreement, opt-out, exclusion, file approval, previous campaign delivery, and the permanent ledger. A stable SHA-256 key of campaign ID plus normalized phone prevents duplicate delivery across files, repeated confirmations, parallel requests, and restarts. An expired in-flight result becomes `unknown`, never an automatically retried send.

Pause and Cancel use a separately authenticated same-origin POST so they do not wait behind the active server-action chunk. An in-flight request may finish; subsequent claims stop. Cancel prevents future resumption of this audience send. Resume and Retry Failed each require a fresh review and typed confirmation. Retry currently permits only explicit HTTP 429 rejection, up to three total attempts, in the original audience. Permanent rejections, unknown outcomes, provider delivery failures, opted-out/excluded contacts, and later delivered/read messages are not retried.

## Firestore storage

No production documents were created by this development work; tests use memory only.

| Path | Purpose |
| --- | --- |
| `whatsappCampaignSends/{hash(campaignId:phoneE164)}` | Permanent campaign/phone lock and latest attempt outcome across all files |
| `.../attempts/{attemptCount}` | Finalized attempt history |
| `whatsappCampaignAudiences/{id}.sendState` | Mirrored per-file progress summary |
| `.../sendControl/current` | Run phase, cursor, approval, counts, target, worker lease |
| `.../sendResults/{membershipId}` | Per-member pending, attempted or suppressed outcome |
| `.../sendApprovals/{approvalId}` | Explicit approval metadata |
| `.../sendApprovals/{approvalId}/pages/{page}` | Immutable approved manifest, 200 entries per page |
| `.../events/{eventId}` | Start, pause, resume, retry, completion and cancellation audit entries |
| `whatsappCampaignSenderControl/provider` | Shared campaign provider lease and next permitted request time |

Send records include campaign/audience/member/contact IDs, name/phone, template/language/provider, provider message ID, status, attempt count, attempted/accepted/sent/delivered/read/failed timestamps, safe error code/message, approval/batch ID, creation/update timestamps and lease expiry. No credentials or raw provider response bodies are stored. Existing contact opt-out/marketing status is preserved; only delivery history is updated. Membership send status is updated only when the membership still exists.

Supported result states: `pending`, `locked`, `sending`, `accepted`, `sent`, `delivered`, `read`, `failed`, `suppressed`, `unknown`. Atomic claims use `sending` as the active lock state. Audience states: `ready`, `sending`, `partially_sent`, `completed`, `paused`, `failed`, `cancelled`. Accepted and unknown results keep a finished run partial; a completed run requires terminal outcomes. Recipient results support name/phone search and all status filters, with 200 visible rows at a time. Counts show attempted, accepted, sent, delivered, read, failed, remaining and uncertain outcomes plus last send time.

## Provider and webhook

The existing server-only Dualhook adapter constructs the request to its existing messages endpoint. Payload fields are `messaging_product: whatsapp`, `recipient_type: individual`, `to`, `type: template`, and `template` with name `rentka_introduction_v1`, language `{code: en}`, and one header component containing `{type: image, image: {link: https://www.rentka.co/whatsapp/rentka-introduction-header.jpg}}`. No body variables are added. Existing API credentials remain environment-only and unchanged.

Both existing webhook repositories reconcile campaign records by provider message ID independently of their existing dispatch reconciliation. Duplicate statuses do not inflate counts; read/delivered do not regress; late delivery can resolve a previous failure. Early status storage is checked when persisting provider acceptance. No webhook routes or inbound parsers were added or replaced. A provider acceptance lost before its message ID can be persisted remains uncertain and requires manual investigation; it is not resent.

## Gate, image and validation

`WHATSAPP_CAMPAIGN_LIVE_SEND_ENABLED` defaults to false and is required to equal `true` server-side before start, chunks, and provider execution. The implementation did not set or enable it. Local process and `.env.local` checks reported it disabled, without printing values of any credential.

`public/whatsapp/rentka-introduction-header.jpg` is still missing. No replacement image or logo was created. The admin displays **Campaign header image is missing.** and blocks execution. Expected production URL remains `https://www.rentka.co/whatsapp/rentka-introduction-header.jpg`. The gate checks local JPEG signature/type when an asset exists. Public production availability must be verified separately before any future live authorization; this stage does not publish the asset.

Validation uses only an in-memory transactional Firestore double and mocked providers. Coverage includes 2/50/100/1001-member files, opt-out/exclusion/invalid suppression at review and claim, duplicates within/across files, same-campaign repeat/double clicks, concurrent workers, refresh/resume, expired uncertain attempts, partial/permanent failures, controlled retry, callback states and early callbacks, pause/cancel, missing header, authorization, deleted membership, and client/provider-secret separation. Existing campaign/importer, phone, provider and webhook regression tests are retained.

Validation results: 105 targeted tests passed (25 sender tests and 80 existing regressions); TypeScript `npx tsc --noEmit` passed; targeted ESLint passed without warnings; local `npm run build` passed.

No real WhatsApp message was sent, nothing was deployed, no live flag was enabled, and no Dualhook/Meta configuration or credentials were changed or exposed. First live sending remains a separate approval stage.
