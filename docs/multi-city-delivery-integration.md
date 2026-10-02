# Multi-city booking and delivery integration

The normal-rental public flow for Islamabad, Rawalpindi and Lahore uses a single server delivery path. Approved travel-guide and editorial commits remain in the merge history with their original SHAs.

## Public booking path

1. The customer selects a city and anonymous model/package from the shared eligible public inventory.
2. The browser sends an opaque option reference and a stable submission key to the normal-rental lead route.
3. The server resolves current eligible inventory, vendor ownership and rates. Lahore retains structured Pakistan-place validation; Twin Cities retain typed pickup/destination support.
4. A transaction persists the lead and its internal vendor relationship, with the existing city code/counter and request fingerprint. A repeated identical submission reuses that lead.
5. Both initial success and repeated persisted requests call `orchestrateBookingDelivery` with `lahore_normal` or `twin_cities_normal` and the saved document ID.
6. The orchestrator loads the saved lead and calls the centralized delivery core. Firestore `bookingDeliveries` holds independent transaction claims and outcomes for email, Google Sheets, dispatch and WhatsApp handoff.
7. Email and Sheets use saved internal ownership and pricing; dispatch uses the existing source normalization and vendor-first architecture. WhatsApp remains a customer handoff, with no server outbound message introduced.
8. Public responses hide vendor identity. Client lead/conversion tracking follows valid persistence/success and does not repeat server delivery fan-out.

The older `src/lib/normal-rental/public-lead-delivery.ts` and its competing claim mechanism are removed. Its tests are replaced by coverage of the real centralized lead/orchestrator/service/store integration.

## Retry semantics and limits

Terminal `delivered`, `not_applicable` and `customer_handoff` destinations are skipped. Failed destinations can retry independently through the same saved submission or authenticated admin replay. Concurrent claims return the recorded processing state rather than pretending a delivery has completed. Existing processing claims expire after five minutes; HTTP delivery calls have a 30-second bound.

Regression coverage exercises all three cities, initial success, repeated identical requests, replay, partial Sheets failure and retry, an interruption after persistence, concurrent requests and historical Twin Cities leads. Completed email and dispatch remain at one call when Sheets retries.

This is logical deduplication under durable outcome recording, not an absolute exactly-once guarantee across an external provider accepting a request and a process dying before success is recorded. Provider idempotency or reconciliation would be needed to close that ambiguity, especially for email. There is no new automatic retry scheduler; a repeated saved request or admin replay performs recovery.

## Integration verification

- 79 focused tests pass, including delivery, dispatch, multi-city booking, lead output, public routes, tracking, travel guides and inventory/model coverage.
- 927 full-suite tests pass.
- `npx tsc --noEmit` and `npm run build` pass.
- ESLint across changed/integrated code passes with zero errors and four existing warnings.
- `tools/verify-multi-city-render.mjs` verifies eleven routes, three inventories, canonicals, parsed server JSON-LD, Organization/WebSite and Service relationships, vendor anonymity, travel guides, sitemap entries and the permanent blog hub redirect.
- Public JSON-LD uses the existing native JsonLd component so these schemas are present in server-rendered HTML.
- Browser checks cover Lahore city selection, model booking, weekly pricing, Twin Cities anonymous package comparison, the editorial hub and a Lahore guide. At 390px the checked pages/modal do not overflow horizontally.
- One city selection/model click produces one select_city, select_model and booking_intent event; no lead_submit/generate_lead event fires before submission. Persisted-success tracking is covered by the conversion tests; no real booking is submitted during browser verification.
- Browser error stacks identify the existing external Microsoft Clarity tag; localhost Vercel Analytics and Google Maps legacy API warnings remain. No tracking configuration or Ads primary conversion is added.

Generated evidence stays under the isolated worktree's uncommitted output directory. The original dirty checkout is protected by before/after SHA-256 snapshots of every modified/untracked file and matching Git status, HEAD and main reference. No push or deployment is part of this integration.
