# RentKA multi-city implementation report

Prepared for review on 2 October 2026. Nothing has been committed, pushed or deployed. Existing uncommitted work has been retained.

The detailed pre-edit findings are in [the audit](C:/Users/eZhire/RentKA-Website/docs/multi-city-audit.md). This change uses the existing normal-rental resolver, collections, lead core and delivery orchestration.

| Requested item | Result |
| --- | --- |
| 1. Before | Homepage read legacy cars in both server and browser, offered only Islamabad / Rawalpindi, and opened a vendor-backed listing/detail/lead flow. Twin Cities city selectors and canonical model routes had independent fetching/filtering. |
| 2. Lahore vs Twin Cities | Lahore already resolved operational inventory on the server, hid vendor fields, sent opaque option IDs, and rechecked rates when creating leads. Twin Cities publicly displayed vendor identities and trusted browser-car/package context when persisting leads. |
| 3. Lahore data flow | Model definitions/images/specs: `countries/PK/cars`. Supply and rates: same-zone `normalRentalInventory`. Vendor ownership/activation: same-zone `normalRentalVendors`. Eligibility requires active inventory and vendor, a valid matching representative model, and positive finite daily rates for both packages. Optional positive rates determine available durations. Cards group models or preserve configured separate variants; their display price is the minimum eligible within-city daily rate. There is no date-level availability reservation in this resolver; operations confirms final availability. A legacy representative car's active flag does not disable Lahore operational inventory. |
| 4. Architecture | Zone configuration → existing server resolver → minimal public projection → shared anonymous booking UI → existing server lead core → existing internal delivery/dispatch. Twin Cities retains legacy data storage; Lahore retains operational storage. |
| 5. Shared helpers | Reused `resolveNormalRentalInventory`, `normalizeNormalRentalInventory`, card grouping and existing Lahore UI/lead core. Added generic public projection/loading, city-to-zone lookup and shared starting-price helper. Existing Lahore wrappers and option hashes remain compatible. |
| 6. Files | Exact task file list is below. Files already modified before this task contain both existing work and new scoped hunks. |
| 7. Homepage selector | Configured Islamabad / Rawalpindi and Lahore options; Twin Cities remains default. Country remains Pakistan and service remains With Driver. Neither is an additional interactive choice because this product currently supports one country/service. |
| 8. Homepage Lahore | Same resolver, operational records, eligibility, card grouping, rates and booking API as the Lahore page. The observed dataset produced four anonymous options/cards, including the separate Civic variant. |
| 9. Homepage Twin Cities | Shared-zone eligible legacy supply is normalized on the server and displayed as anonymous model cards. Explicitly inactive cars/vendors and unsupported services/packages are excluded. Missing legacy vendor active flags remain compatible. The observed dataset produced 24 eligible options grouped into ten models. |
| 10–12. Sources | No duplicate inventory, pricing or vendor collection/table/configuration was created. The new inventory API delegates to the existing resolver. It sends no vendor records. |
| 13. Public vendor privacy | Public projections allowlist model/spec/rate fields and hash option IDs. Active homepage, city, cars-index and canonical model flows use these projections. Names/IDs/logos are absent from public payloads, option presentation, public WhatsApp text and new public analytics payloads. The non-indexable `/cars/[slug]` page also uses this presentation. Old unused modal components and the robots-excluded `/cars/old` route were preserved. |
| 14. Internal ownership | Server resolution retains raw inventory/car IDs, vendorId and vendorName. Those fields remain on persisted leads and are available to internal email, delivery and operations. The standard lead email route sends to the configured notification address; it is an internal notification. |
| 15. Selection dependency | Customers choose a model and, where necessary, an anonymous model/year/package option. The server maps the opaque option ID to current eligible supply. Customers no longer identify or select a vendor. Internal binding remains explicit. |
| 16. Booking behavior | Generalized the existing `/api/normal-rental-lead` core for both zones. Server controls country/service/zone/vendor and rates; no separate homepage or Lahore lead flow exists. Preserved Twin Cities typed pickup/destination support and Lahore's structured-place validation. Existing duration/estimate calculation remains unchanged. |
| 17. Lead payload | Browser adds cityId, zoneId, PK/withDriver context, entryPoint and an idempotency key. Server preserves operational fields and counter-based RK-ISL/RK-RAW/RK-LHR IDs; legacy carId is retained alongside inventoryId. Lead source remains `website` for Twin Cities and `rent_a_car_lahore` for Lahore; entryPoint distinguishes homepage/city/model pages. Repeated keys reuse the persisted lead and saved quote. Conflicting payloads are rejected. |
| 18. Assignment | Executable mocked lead tests verify server vendor ownership, raw legacy carId, correct zone/model/amount and dispatch-adapter normalization for Islamabad, Rawalpindi and Lahore. Existing assignment/intake regressions run in the full suite. No live booking or vendor assignment was created. |
| 19. Dispatch | Delivery source types remain `twin_cities_normal` / `lahore_normal`. Matching, vendor-first rules, offers, finance and assignment code were not changed by this task. Replays call existing idempotent delivery orchestration so a lost response cannot permanently skip delivery. |
| 20. Homepage SEO | Title: **RentKA \| Car Rental with Driver in Islamabad, Rawalpindi & Lahore**. H1: **Car Rental with Driver in Islamabad, Rawalpindi & Lahore**. Description covers these three markets, within-city travel, airport transfers, outstation trips and one-way drops. Removed a static starting-rate claim from homepage FAQ copy; inventory supplies current prices. |
| 21. Homepage canonical | Exact rendered canonical is `https://www.rentka.co/`, including the trailing slash. A page-only metadataBase override prevents Next.js root-URL normalization; homepage social images use absolute URLs. No global URL configuration or redirect changed. |
| 22. City canonicals | All three remain their existing self-canonical URLs. Canonical city/service-aware model URLs and Twin Cities route allowlist remain intact. |
| 23. Internal links | Our Locations appears after inventory, with native links to all three city pages, `/airport-transfer`, `/one-way-drop` and `/travel-guides`. Existing supporting sections and styling remain. |
| 24. Schema before/after | Homepage previously defined ImageObject + Organization + Islamabad CarRental + WebSite + FAQPage. It now defines one ImageObject, one Organization, one WebSite and its visible FAQPage. City Service/Breadcrumb/FAQ schemas remain. Twin Cities model FAQs now share one content array with JSON-LD, fixing existing text drift. |
| 25. Organization ID | `https://www.rentka.co/#organization`; legal name is RENTKA (SMC-PRIVATE) LIMITED. WebSite uses `https://www.rentka.co/#website` and references the organization. |
| 26. LocalBusiness | Removed the redundant homepage CarRental entity. Retained the existing factual Islamabad office address on Organization; it matches the contact page. Added no Lahore/Rawalpindi physical branch, coordinates, hours, identifiers or contact details. City service areas remain Service entities. |
| 27. Service provider | City and sampled model Service.provider fields reference the primary organization; rendered validation checks these relationships. |
| 28. SEO isolation | City local content, headings and FAQs were not copied into the homepage. Only inventory and booking presentation are shared. City-specific landing pages remain independently relevant. |
| 29. Sitemap | Source file was not edited by this task. Rendered sitemap has no homepage city/service query variants. Admin pricing changes invalidate the existing sitemap along with affected public inventory pages. |
| 30. Robots | Source file was not edited by this task. Public crawling remains allowed and private spaces excluded. Inventory API responses are noindex and no-store. |
| 31. Tracking | select_city/select_model/booking_intent verified in the browser with one event per tested action, no premature lead events. Canonical model links also track selection. Lead conversions occur only after a confirmed persisted lead ID. Twin Cities retains lead_submit, generate_lead, its existing Ads destination, Meta Lead and WhatsApp event; Lahore retains its existing generate_lead semantics. No new Ads conversion or GTM/Meta/Clarity configuration. Service is fixed, so no artificial select_service event is fired. Public vendor dimensions are intentionally removed. |
| 32. Tests | Targeted command: `node --experimental-strip-types --test` with multi-city-booking, normal-rental-inventory, Lahore public models/routes/prelaunch/lead-output, conversion-tracking, seo-p0-p1, booking-delivery and dispatch-d2-automatic-intake suites: **69 passed, 0 failed**. Complete command: `node --experimental-strip-types --test tests/*.test.mjs`: **936 total, 935 passed, 1 failed**. The failure is the untouched travel-guide test harness's relative-module mock, described below. |
| 33. Build | `npm run build`: passed, exit 0, including compilation, build-time TypeScript and route generation. No deployment occurred. |
| 34. TypeScript/ESLint | `npx tsc --noEmit`: passed, exit 0. ESLint across changed implementation files: 0 errors, 2 existing warnings (homepage img element; HeroBanner effect dependency). |
| 35. Diff check | `git diff --check`: passed. Git emits existing LF/CRLF normalization notices; there are no whitespace errors. |
| 36. Limits/risks | Full suite is not entirely green: `travel-guides-infrastructure.test.mjs:191` cannot resolve `../../app/blog/data` because its test loader only mocks the alias import. The test, editorial-hub module and blog data have no task diff. Live lead persistence, notifications, Sheets writes, dispatch offers and admin data edits were tested with fixtures/mocks, not production mutations. External Google/Schema.org interactive validators were prepared, not submitted. Local Vercel Analytics logs that its deployment-only insights script is unavailable. Existing optional-rate estimates multiply selected rate by days; that inherited behavior is unchanged. Future homepage markets use zone configuration, but launching a city still requires its SEO page and route/sitemap policy. |
| 37. Git status | Working tree remains dirty with the extensive pre-existing modifications plus this task. Full final status is captured in `output/multi-city-git-status.txt`. Nothing was staged or committed. Generated `output/multi-city-*` evidence is untracked and excluded from the proposed source commit. |
| 38. Proposed commit | `feat: share multi-city public inventory and model-first booking`. Include only this task's source/test/docs hunks; review overlapping previously modified files individually. Exclude unrelated booking-delivery/airport/one-way/dispatch/finance/SEO changes that existed before this task and exclude generated evidence. Await user approval before any commit, push or deployment. |

## Task files

Public pages and APIs:

- `app/page.tsx`
- `app/cars/page.tsx`
- `app/cars/[slug]/page.tsx`
- `app/cars/[slug]/[city]/[service]/page.tsx`
- `app/rent-a-car-islamabad/page.tsx`
- `app/rent-a-car-rawalpindi/page.tsx`
- `app/rent-a-car-lahore/page.tsx` (freshness declaration only)
- `app/api/normal-rental-lead/route.ts`
- `app/api/normal-rental-inventory/route.ts` (new)
- `app/admin/pricing/actions.ts` (public cache invalidation only)

Presentation and shared logic:

- `src/components/HeroBanner.tsx`
- `src/components/HomePageClient.tsx`
- `src/components/lahore/LahoreBookingClient.tsx`
- `src/components/normal-rental/PublicCityInventory.tsx` (new)
- `src/lib/normal-rental/inventory-core.ts`
- `src/lib/normal-rental/public-inventory.ts`
- `src/lib/normal-rental/zones.ts`
- `src/lib/normal-rental/lahore-lead.ts`
- `src/lib/normal-rental/lead-output.ts`

Tests, verification and documentation:

- `tests/multi-city-booking.test.mjs` (new)
- `tests/lahore-public-routes.test.mjs`
- `tests/conversion-tracking.test.mjs`
- `tests/booking-delivery.test.mjs` (source assertion only; file already existed as untracked user work)
- `tests/dispatch-d2-automatic-intake.test.mjs` (source assertion only)
- `tools/verify-multi-city-render.mjs` (new)
- `docs/multi-city-audit.md` (new)
- `docs/multi-city-report.md` (this report)

## Rendered and schema evidence

`node tools/verify-multi-city-render.mjs` checks the homepage, three city pages and two sampled canonical model routes: HTTP status, exact canonical, JSON-LD parseability/uniqueness/provider relationships, FAQ questions and answers visibly present, public vendor-field removal, required homepage links, public inventory for all three cities, filtered-home canonical, sitemap and robots. Evidence is saved in `output/multi-city-render-check.json`, rendered HTML files and `output/multi-city-schema/*.json`.

Desktop/mobile browser checks exercised Lahore switching, Lahore booking and Twin Cities anonymous option comparison without submitting. At 390px the homepage had no horizontal overflow. Mobile evidence: `output/multi-city-mobile-booking.png` and `output/multi-city-mobile-twin-options.png`.

Current guidance checked against [Google's general structured-data policies](https://developers.google.com/search/docs/appearance/structured-data/sd-policies) and [Organization guidance](https://developers.google.com/search/docs/appearance/structured-data/organization). Google [retired FAQ rich results in May 2026](https://developers.google.com/search/updates); visible FAQPage remains valid semantic markup, with no promise of a Google FAQ rich result. Service/WebSite validity likewise does not imply a special Google rich result.

For external validation, use Code mode in [Google Rich Results Test](https://search.google.com/test/rich-results) with the saved rendered HTML, and [Schema.org Validator](https://validator.schema.org/) with the saved JSON-LD. URL-mode testing would currently inspect the unchanged deployed site, not this uncommitted implementation.

## Strict commit isolation

The reviewed index separates this implementation from pre-existing airport, one-way, delivery, dispatch, assets and unrelated SEO changes. Mixed public-page files retain the HEAD Script implementation in the index while the user's native JsonLd migration remains in the working tree. Homepage business fields are explicit in the staged version, avoiding the pre-existing seo.ts constant refactor.

After the user chose a refactor instead of prerequisite commits, staged lead delivery uses the tracked /api/lead-booking, /api/lead-sheet and automatic dispatch intake through src/lib/normal-rental/public-lead-delivery.ts. Claims on the persisted lead skip completed destinations and overlapping processing, and retry failed destinations. Private previews retain the tracked automatic-intake behavior. No booking-delivery subsystem files or new collections are included. Email delivery still has an inherited external-side-effect ambiguity if the provider accepts a message but the server stops before recording success; strict exactly-once external delivery is not promised. The existing orchestration integration remains as an unstaged user-work layer.

The unchanged working tree's 69 targeted tests were rerun after hunk separation and passed. Additional delivery regression tests cover both zones, saved ownership/rates, completed replay, failed-destination retry, overlapping submissions and preview suppression. An isolated export of the index is checked independently before commit. Generated output/multi-city-* evidence is excluded.
