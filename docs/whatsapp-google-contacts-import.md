> Eligibility and membership now follow the [file-based audience workflow](whatsapp-file-audiences.md). Earlier unreviewed/import identity notes below describe the previous stage.

# Google Contacts CSV import update

This supersedes the Name/Phone-only CSV and 200-row upload limits in the original C1/C2 handoff. No deployment, WhatsApp send, Dualhook configuration change or production contact import was performed.

## Behavior

- Automatically recognizes numbered Google `Phone N - Value` columns, including nonconsecutive numbers. Phone labels/types are not treated as values. All populated values become individual preview entries; Google `:::` multi-value cells are also expanded.
- Recognizes current `First Name`, `Middle Name`, `Last Name` and legacy `Name`, `Given Name`, `Additional Name`, `Family Name` headers. Name preference: full Name, assembled name including prefix/suffix, File As, Nickname, then organization name. Blank names do not block valid phone imports. All phones from the same source row retain the same display name/source.
- Detected Google records use `source=google_contacts` automatically. Existing primary source metadata remains authoritative on duplicates, with google_contacts retained in the source provenance list.
- Keeps the original phone string for each value and reuses the unchanged international E.164 validator. One contact record per normalized phone. Pakistan local mobile numbers and explicit international prefixes are supported; ambiguous numbers are not guessed.
- Rows without phones are reported and skipped, including email-only contacts. Invalid numbers never create contacts. Existing opt-outs, review status, category and send history are preserved. New records always start unreviewed and category unknown.
- Still accepts simple Name/Phone CSVs with the admin-selected source. Supports UTF-8 BOM, quoted commas/newlines and escaped quotes. Rejects ambiguous duplicate headers and malformed structure.

## Review and safety

One upload accepts up to **5,000 nonblank CSV data rows**, **20,000 phone values**, and **5 MiB**. Next server-action body limit is 12 MB to accommodate serialization overhead; application validation still enforces 5 MiB.

File selection only reads the local file. Preview performs bounded server reads and no writes. It shows total CSV rows, rows with phones, valid phone values, invalid phones, repeats within the CSV, unique existing contacts, unique new contacts, rows with multiple phone values and skipped phone-free rows. Valid-phone counts include repeated occurrences; new/existing counts are unique E.164 contacts. The preview table shows every phone in pages of 100, with name, original phone, normalized phone, source and New / Duplicate in CSV / Already exists / Invalid results. Skipped rows include the reason. Invalid/skipped rows can be downloaded as a formula-escaped CSV.

**Confirm Import** is a separate explicit action. It checks the signed preview token, binds the exact CSV and selected source, re-parses/validates on the server, and computes a deterministic import identity from the file and effective source. The server then awaits 200-phone-value chunks sequentially. Each chunk uses the existing contact transaction, deterministic phone document IDs, audit events and a durable receipt: at most 200 contact writes + 200 audit writes + one receipt (401 writes). Database duplicate reads also use chunks of at most 200. The browser does not issue parallel database writes.

The whole upload is no longer a single atomic transaction. If a later chunk fails, earlier chunks remain saved. Previewing and confirming the same file again reuses completed chunk receipts and resumes the remainder. A fresh preview token does not change the import identity. Reordered/edited files still deduplicate via phone IDs and preserve opt-outs. Completion totals include resumed chunks; the UI reports the reused chunk count. No automatic retry, scheduling or sending is added.

## Changed files

- `src/lib/whatsapp-campaigns/csv.ts`: Google detection, row/phone expansion, counts, result labels and error CSV.
- `src/lib/whatsapp-campaigns/core.ts`: upload/phone limits and CSV exports; existing phone normalization unchanged.
- `src/lib/whatsapp-campaigns/repository.ts`: bounded duplicate reads and sequential resumable import orchestration; individual transaction cap remains 200.
- `app/admin/whatsapp-campaigns/actions.ts`: confirmation uses deterministic file identity and chunk orchestration.
- `app/admin/whatsapp-campaigns/contacts/CsvImport.tsx`: separate import UI with preview, confirmation and error download.
- `app/admin/whatsapp-campaigns/contacts/Contacts.tsx`: embeds the new importer; manual contact/review/audience behavior retained.
- `next.config.ts`: server-action body limit only.
- `tests/fixtures/google-contacts-standard.csv`: synthetic standard Google fixture, not real customer data.
- `tests/whatsapp-campaigns.test.mjs`: Google, capacity, safety and retry coverage; existing assertions updated for new limits/counts.

## Tests

`node --test tests/whatsapp-campaigns.test.mjs`: **21 passed**. Coverage includes standard and legacy headers, Pakistani and international normalization, all numbered columns, multiple values, duplicate phones, email-only rows, invalid values, error report escaping, 2,400 unique contacts in 12 sequential chunks, bounded lookups/writes, repeat imports, partial failure/resume, signed confirmation, read-only preview and opt-out preservation. Database tests use an instrumented in-memory transaction stub, not live Firestore or its emulator.

No real Google account or personal contact data was accessed. No production import was performed.

Final checks: `npx tsc --noEmit`, targeted ESLint (`app/admin/whatsapp-campaigns`, `src/lib/whatsapp-campaigns`, `tests/whatsapp-campaigns.test.mjs`), `npm run build`, and `git diff --check` all passed. Removed one unused type import found during lint. Build ran locally only; no deployment or live database mutation was performed.
