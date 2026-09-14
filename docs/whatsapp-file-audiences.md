# File-based WhatsApp campaign workflow

This replaces the earlier per-contact review requirement for intentional admin CSV uploads. It follows the latest request: **Audience / File Name is required**, rather than silently assigning a sequential name. No deployment, real message send, credential change, or production data migration was performed.

## Workflow

1. Select a CSV and enter a required human-readable Audience / File Name. Preserve originalFilename separately.
2. Preview shows the name, original filename, CSV counts, duplicates, existing contacts, file-eligible contacts and suppressed valid contacts. Invalid and phone-free rows remain visible/downloadable. Nothing is persisted by upload or preview.
3. Confirm Import creates the persistent file audience and imports valid unique phone members in sequential server transactions.
4. The file appears as Ready with its own membership and history. Selecting another file creates another audience; files are never combined automatically.
5. On either Contacts or Campaign Drafts, choose a file, review current suppression counts, then explicitly Create Audience from that file. This creates only a campaign draft. No Send control or sending implementation was added.

The supported upload limits remain 5,000 CSV rows, 20,000 phone values and 5 MiB. File sizes and names are independent of future message-batch limits. File drafts reference the file membership rather than copying all IDs into a potentially oversized Firestore document. No 20/100/500 subdivision is required to import or select a file.

## Eligibility and preservation

- New valid CSV contacts and new manual campaign contacts receive marketingStatus=eligible.
- File membership is the approval record for an existing contact. Existing global review statuses, source, category and send history are preserved; an otherwise unsuppressed legacy unreviewed contact can be eligible for the intentionally confirmed file without changing its global status.
- Existing excluded contacts and explicit vendor/driver exclusions remain suppressed. Opt-outs are never cleared, including on retry or reimport.
- Valid phones receive one contact record per normalized E.164. Invalid phones and email-only rows create no contact/membership.
- No vendors, drivers, leads or customers are imported from system collections automatically.
- Older contacts are neither deleted nor automatically assigned invented historical file names. They appear without a file association until intentionally included in a named upload.

## Schema

`whatsappCampaignAudiences/{audienceId}` stores:

- audienceId, audienceName, originalFilename, source, campaignId (first linked draft, nullable), createdAt and shared-admin createdBy.
- totalRows; validCount (unique normalized contacts); invalidCount; skippedRows; duplicateCount (CSV repetitions); existingContactCount; newContactCount; eligibleCount; suppressedCount; processedCount.
- status: confirmed / ready / partially_sent / completed / cancelled. This stage creates confirmed then ready only.
- importState: importing / interrupted / completed; internal fingerprint binds the file and its naming metadata.

`whatsappCampaignAudiences/{audienceId}/members/{contactId}` stores audienceId, contactId, phoneE164, eligibilityAtImport, suppressionReason and sendStatus (not_sent initially). Membership is separate from contact source. The same contact can belong to File A and File C without duplicating the contact or discarding either membership.

Existing `whatsappCampaignImports` records remain durable chunk receipts. Contact `events` now include the audienceId for named-file imports. No old receipt or contact is removed.

Campaign drafts have audienceMode=file, sourceAudienceId and audienceSources containing the file ID/name and imported/eligible/suppressed snapshot counts. Their source membership supplies recipients; file drafts do not store a duplicate audienceIds array. Legacy/manual drafts retain their original array format. The reserved batch type can retain audienceSources for later implementation.

## Atomicity and retries

File import identity is tied to the selected upload ID. Preview tokens bind CSV, source, audience name, original filename and upload ID. Editing any of these requires another preview. A retry of the same selection/name reuses the audience and receipts; deliberately selecting the same CSV again can create another named audience, while normalized contact IDs still prevent duplicate contacts.

Each file chunk contains at most 100 unique contacts and commits contact changes, member records, contact audit events, counters and its receipt atomically: at most 302 writes. All valid input is deduplicated across the complete file before chunking. The browser issues one confirmed import action; server chunks are sequential. Earlier successful chunks survive interruptions; retry does not duplicate memberships or increment counters twice. History exposes interrupted state and actual committed counters. Import retry does not reset completed audience status or membership send history.

## Audience checks

Before draft creation, the server checks current E.164 validity, missing/changed contacts, opt-out, excluded status, import-time suppression, duplicate phones, same-campaign send history and permanent same-campaign send locks (including unknown outcomes). It returns file contacts, suppressed and final eligible counts.

Explicit draft creation repeats the checks in a Firestore transaction and requires the same result fingerprint. A changed suppression result requires another preview. File names and counts are saved on the draft. No files are combined automatically. These are preparation checks; a future sender must repeat recipient checks immediately before each provider call. Existing Dualhook configuration, webhooks, provider integration and send-history storage were not modified.

## UI

- Contacts: named upload form, auto-eligibility wording, Import History, Import / File filter, all associated file names per contact, and direct links to each file's contacts.
- Import History: named audience, original CSV, date, unique valid contacts, new/existing contacts, CSV repeats, invalid count, current eligible count and membership-based sent/delivered/failed status. Existing and in-file duplicates are separate columns.
- Campaign Drafts: available uploaded files by name and current eligibility, explicit file checks/draft creation, and file source/name/counts on saved drafts.
- Old ad hoc contact-checkbox audience creation is replaced in the Contacts UI by file selection. Global contact status controls remain available but are not a prerequisite for confirmed file membership.
- No fabricated sent counts: all newly imported membership statuses are not_sent.

## Changed files

- src/lib/whatsapp-campaigns/types.ts, core.ts, repository.ts, import-review.ts
- src/lib/whatsapp-campaigns/file-audiences.ts (new)
- app/admin/whatsapp-campaigns/actions.ts, page.tsx, Drafts.tsx
- app/admin/whatsapp-campaigns/FileAudiences.tsx (new)
- app/admin/whatsapp-campaigns/contacts/page.tsx, Contacts.tsx, CsvImport.tsx
- tests/whatsapp-campaigns.test.mjs
- This report and supersession notes in the earlier handoffs.

## Verification

27 campaign tests cover File A=2, File B=50, File C=100, automatic new-contact eligibility, shared phones with both memberships, opt-out/excluded preservation, legacy review/source preservation, invalid rows, per-file filtering, named draft creation, suppression counts and stale-preview rejection, same-campaign locks, repeated uploads, required/signed names, history totals and interrupted 2,400-contact membership imports. Tests use an instrumented in-memory Firestore stub; no real WhatsApp call or production import.

Production Firestore rules are not present in this checkout. The new audience collection and its members must be denied browser SDK access by deployment-time rules; application access is through authenticated server pages/actions using the existing Admin SDK. No rules were deployed.

Final checks passed: `npx tsc --noEmit`, targeted ESLint for campaign code/tests, and `npm run build`. Combined campaign, Dualhook webhook/provider, Meta webhook and phone tests: **80 passed, 0 failed**. The local build is not a deployment. No authenticated production writes or real provider calls were used in validation.
