> Eligibility and membership now follow the [file-based audience workflow](whatsapp-file-audiences.md). Earlier unreviewed/import identity notes below describe the previous stage.

# WhatsApp customer introduction — C1/C2 handoff

> CSV behavior and upload limits below describe the original stage. See [Google Contacts importer update](whatsapp-google-contacts-import.md) for current automatic column detection and chunked imports.

This stage prepares contacts and drafts only. Nothing was deployed, no production contacts were imported during development, and no Meta/Dualhook request or WhatsApp message was sent. Existing Smart Driver Dispatch and webhook files were left unchanged. Read the separate C1 audit for existing routes, collections, authentication and environment names.

## Admin routes and workflow

- `/admin/whatsapp-campaigns`: prefilled RentKA Introduction draft, template `rentka_introduction_v1`, English, marketing, IMAGE header. Only draft creation is exposed.
- `/admin/whatsapp-campaigns/contacts`: manual contact entry; CSV preview/confirmation; name/phone search; source, category, review, opt-out and prior-send filters; 50-row table pages; explicit per-contact review; selected eligible contacts become a draft audience.
- Operations/Pricing has a campaign navigation card. Layout styling and session checks match existing admin pages. Every page and server action checks the existing admin session, independently of the layout. Identity is shared_admin_session because existing authentication does not identify individual administrators.
- New/manual/imported contacts are unreviewed, never implicitly eligible. CSV category defaults to unknown. A review action is required to mark eligible, including personal/vendor/driver records. No existing customer, lead, driver or vendor collection is automatically imported.

## Collections and reserved contracts

| Path | Purpose |
| --- | --- |
| `whatsappCampaignContacts/{sha256(phoneE164)}` | ContactInput plus E.164/calling code, source provenance, category/review, opt-out timestamps, creation/import/update timestamps and last campaign/delivery/send fields |
| `whatsappCampaignContacts/{id}/events/{eventId}` | Contact creation, safe duplicate merge, and review audit events with server timestamps and shared admin actor |
| `whatsappCampaignImports/{receiptHash}` | Atomic import receipt: created/merged counts, row count, timestamp and actor; no raw CSV |
| `whatsappCampaigns/{requestUUID}` | Fixed introduction template metadata, draft status, audience IDs/count, creator and timestamp |
| `whatsappCampaigns/{id}/events/{eventId}` | Draft creation audit history |
| `whatsappCampaignSends/{sha256(campaignId + ':' + phoneE164)}` | **Reserved; not written in this stage.** Permanent unique send lock and per-contact/campaign history, provider ID, claim/attempt fields, status, sent/delivered/read/failed timestamps and sanitized failure code |
| `whatsappCampaigns/{id}/batches/{batchId}` | **Reserved; not written in this stage.** Explicit approval, recipient/count snapshot, stage and progress/failure counters |

Firestore collections are created lazily by authorized admin mutations. No migration or production writes were executed. Source references preserve each source/reference pair; importing duplicates never replaces the primary source, original phone, category, review, opt-out or send history. Only blank name/notes and source provenance are merged. All import rows and their audit records commit atomically, with up to 200 rows and at most 401 document writes. A signed 30-minute preview token binds the exact CSV and source; retry uses a durable receipt. Concurrent imports converge on the same phone document through transactions. Import receipt counts are authoritative if the database changed after preview.

## CSV and phone rules

Accepts UTF-8 CSV with Name and Phone headers (case insensitive), a BOM, quoted commas, escaped quotes, CRLF and quoted newlines. Upload alone only reads the file locally. Preview validates rows and performs read-only duplicate lookups, then shows total/valid/invalid/file-duplicate/database-duplicate/new counts and row results. Admin explicitly confirms valid rows; invalid rows can be downloaded in a formula-escaped error CSV. Duplicate valid rows can supply missing metadata without creating new contacts. Limit: 200 rows and 200 KB per upload; split larger exports.

Google Contacts exports have not been supplied for inspection. Map the desired Google phone column to Phone and the name column to Name; automatic Google column selection is deliberately deferred rather than guessing among multiple phones.

`libphonenumber-js/max` validates international numbering metadata. The Pakistan forms 03020589999, 923020589999 and +923020589999 all become +923020589999. International + and 00 prefixes are accepted; display punctuation is stripped. Ambiguous national numbers outside the explicit Pakistan-mobile conversion, letters, extensions, unknown calling codes and invalid numbers are rejected. phoneOriginal is preserved. countryCode stores the calling prefix, e.g. +92, not an ISO country identifier. Structural validity is not confirmation of WhatsApp registration or marketing permission.

## Suppression and later send design

Draft audience creation re-reads selected contacts in a transaction. Only eligible, non-opted-out, never-sent contacts qualify. It rejects missing contacts and duplicate phones and uses a request UUID for idempotency. An audience is a snapshot, never an approval to send. Opt-out is sticky; this stage offers no way to reverse it. Re-import and review cannot clear it. An admin must record opt-outs here; automatic inbound STOP handling is not connected in this stage.

The pure dryRunBatch function checks exact recipient-count confirmation, opt-out/review/prior-send suppression, same-campaign lock/history membership, duplicate phones and hard stage limits 1, 20, 100, 500, 500. Remaining reviewed contacts must use separately approved chunks capped at 500. It neither reserves nor sends anything. Before enabling future delivery:

1. Re-read campaign, batch and contacts and rerun the dry-run at approval and claim time. Require explicit shared-admin approval per batch and stage; no automatic recurring worker/broadcast.
2. Atomically create the permanent campaign/phone send document before provider access. Existing locks—including failed or outcome_unknown—suppress another automatic attempt. Do not delete locks on refresh/retry. Provider timeouts are outcome_unknown and require reconciliation; a local transaction cannot guarantee exactly-once delivery across a remote network boundary.
3. Correlate providerMessageId with existing metaWhatsAppMessages and retained webhook events. The reserved send schema supports sent/delivered/read/failed fields. Current webhooks continue durable status storage; campaign-specific reconciliation remains disconnected because no campaign sends exist. Reuse the existing monotonic delivery-state reducer when this is implemented.
4. Audit approval, count, claim, result and batch progress without secrets/raw payloads. Failed sends keep sanitized codes and lock/history. Recheck opt-outs immediately before provider access.

The server-only Dualhook helper reuses existing environment configuration and payload/URL builders, prepares the introduction IMAGE header payload, and returns sendingEnabled=false. It exposes neither the API key nor an authorization header and contains no fetch/send method. Its URL reflects the existing adapter; no provider API verification request was made in this stage. No credential was rotated or changed.

## Outstanding configuration and limits

- The approved image was not supplied. The expected path is `/public/whatsapp/rentka-introduction-header.jpg`, yielding `https://www.rentka.co/whatsapp/rentka-introduction-header.jpg` after a separately approved deployment. Only a pending-asset README exists; no image/logo was generated or substituted.
- Firebase security rules are not checked into this repository. Before release, verify the live rules deny all browser SDK access to the four new top-level collections and their subcollections. Server Admin SDK uses existing credentials and authenticated server actions. Do not assume a new collection is protected by an unknown wildcard rule. No rules were deployed or replaced.
- Contact listing currently reads the campaign contact collection for client-side search/filtering, with paginated display. This is appropriate for the initial controlled audience; move filtering/pagination server-side before large contact volumes. Drafts cap selection at 5,000 contacts.
- Authentication uses the existing shared password, so audit logs cannot identify individual admins.
- No live database mutation, emulator run, real provider call, or authenticated production workflow test was performed.

Stop here. Real one-recipient sending requires a separate user approval and implementation stage.

## Files changed in this stage

Added:
- app/admin/whatsapp-campaigns/{layout.tsx,page.tsx,Drafts.tsx,actions.ts,error.tsx}
- app/admin/whatsapp-campaigns/contacts/{page.tsx,Contacts.tsx}
- src/lib/whatsapp-campaigns/{types.ts,core.ts,repository.ts,import-review.ts,dualhook.ts}
- tests/whatsapp-campaigns.test.mjs
- docs/whatsapp-campaign-audit.md and docs/whatsapp-campaign-foundation.md
- public/whatsapp/README.md (pending asset only)

Modified: app/admin/pricing/page.tsx (one navigation card), package.json and package-lock.json (libphonenumber-js). All pre-existing dispatch/supply edits remain outside this task.

## Validation performed

- `npx tsc --noEmit`: passed.
- `npx eslint app/admin/whatsapp-campaigns src/lib/whatsapp-campaigns tests/whatsapp-campaigns.test.mjs`: passed after renaming a test-loader variable required by the Next lint rule.
- `npm run build`: passed; both campaign routes appear as dynamic routes. This was a local build, not a deployment.
- `node --test tests/whatsapp-campaigns.test.mjs tests/dualhook-whatsapp-webhook.test.mjs tests/d5-meta-whatsapp-webhook.test.mjs tests/d5-dualhook-whatsapp-outbound.test.mjs tests/airport-phone-validation.test.mjs`: 65 passed, 0 failed. Includes phone metadata validation, malformed/oversized CSV, preview counts, safe merges, sticky opt-outs, dry-run limits, import receipt retries, simultaneous calls against an in-memory serialized transaction stub, draft suppression/idempotency, unauthorized server actions, signed-preview tampering/expiry and non-network IMAGE payload preparation. Existing provider tests use mock fetch; no real outbound request.
- Local built server on 127.0.0.1:3109: both campaign URLs without a session returned HTTP 307 to /admin/pricing-calculator. No authenticated writes were tested against production.
- `git diff --check`: passed. Reviewed changed-file scope; existing webhook/messaging/dispatch files were not modified by this task.
- npm install reported 29 dependency audit findings across the existing dependency tree. No unrelated dependency upgrade or automatic audit fix was performed.

The transaction tests use an in-memory stub, not Firestore's emulator or production contention behavior. Authenticated browser layout and real Firestore rules still need review before release.
