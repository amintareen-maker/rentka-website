# Customer booking UX audit — 6 September 2026

Local changes only. Nothing deployed. No fake production bookings submitted and no WhatsApp messages sent.

This follow-up extends the audit to the Islamabad/Rawalpindi normal rental and Lahore normal rental journeys.

## Original customer experience

The public site was inspected before editing code, primarily at 390 × 844. One-way booking was opened from the home navigation. Its default Islamabad → Lahore / Corolla fare was PKR 19,500. Opening, entering contact details, closing and reopening preserved the draft already; that behavior was retained.

- The one-way modal's large header, summary and independently scrolling body consumed most of the phone viewport. The WhatsApp CTA required finding the bottom of the form.
- The first name field started around 600px down the original phone screenshot. In the revised screenshot it starts around 400px, with the primary action also visible.
- The one-way form blurred the current input on every scroll and mouse-down. This unnecessarily interrupted editing and keyboard use.
- One-way validation displayed its error at the bottom without focusing the missing field.
- The public airport autocomplete returned Serena Hotel suggestions successfully. Selecting Serena Hotel Islamabad and tomorrow produced a 40.7km / 47min route, with Corolla Rs 6,750, Civic Rs 9,200, BR-V Rs 10,550 and Prado Rs 19,100. These were observed quotes, not pricing changes.
- Airport results and customer form already had automatic scroll behavior. This was retained.
- Re-tapping the active Airport Pickup control erased results and unmounted the entered customer form. Switching direction also lost uncontrolled customer values.
- Airport cards had no selected styling or pressed state.
- The automatic floating WhatsApp help panel overlapped the airport's primary CTA.

### C — Islamabad / Rawalpindi normal rental

The normal city page presents a useful “View Cars & Prices” jump, then loads live vehicles. Selecting a vehicle opens a second package/details modal before the customer form. The form contains pickup date, preferred time, Google pickup location, number of days, name, phone and optional email; outstation packages add a destination. The customer must scroll through the long form to reach “Check Availability Now”. Validation messages render at the bottom, while the invalid field can be above the viewport. The Google vendor lookup is an additional client request after opening vehicle details. The existing submit path creates the Firestore lead, dispatch intake, tracking events, email/Sheets requests and full WhatsApp payload.

### D — Lahore normal rental

The Lahore page uses a separate inventory-driven flow: vehicle card → package comparison sheet → booking form. Package, duration, pickup date/time, Google pickup location, days, customer fields and (for outstation) destination are all preserved in component state. The form has a long mobile scroll and its error message is below the location/customer fields, so a failed submit does not automatically bring the first missing field into view. Choosing a package moves the customer into a different modal and makes the route less obvious. Its existing API response creates the lead before composing the full WhatsApp vehicle, price, route, date/time and customer payload.

The public C/D browser sessions could not be reopened in this continuation because the in-app browser usage-limit gate rejected both public and localhost navigation. The observations above are from the live Islamabad normal flow already completed in the previous audit and direct inspection of the current C/D components. No workaround or alternate browser surface was used.
- Source inspection found that one-way WhatsApp navigation waited for email delivery. Airport popup failure had no automatic same-tab fallback, although a manual success link existed.

Production final-submit actions were intentionally not performed because one-way writes directly to Firestore and airport submits a backend booking request.

## Changes

| File | Changes |
| --- | --- |
| `src/components/intercity/IntercityBookingModal.tsx` | Viewport-bounded dialog; smaller mobile spacing; sticky action and error; first-error focus; focus containment and Escape close; background scroll lock; remove forced blur; name/telephone autocomplete and telephone keyboard; stable Google libraries array; preserve submitted draft; saved WhatsApp retry link; prevent repeat record creation when reopening the saved handoff; explicit new-request editing action. |
| `src/components/intercity/Hero.tsx` | Mobile jump link to route finder; accessible swap label; route collision correction handled in the change event rather than a follow-up effect. |
| `src/components/airport/AirportBookingEngine.tsx` | Ignore repeat tap on current trip type; preserve customer draft across form remounts; retain vehicle by ID when quotes refresh; retain existing results during refresh; selected styling and pressed state; accessible contact field names/autofill; validate restored phone; focus error/success sections; respect reduced motion; explicit WhatsApp CTA and same-tab popup fallback. |
| `src/components/WhatsAppWidget.tsx` | Suppress automatic expanded help panel on booking pages, including navigation from a page where it already opened; retain manual assistance and tracking. |
| `src/components/LeadModal.tsx` | Shared Islamabad/Rawalpindi normal-booking modal now locks page scroll, uses a compact bounded mobile layout with a sticky submit action, focuses and scrolls the first invalid field, preserves all form fields, and adds accessible dialog/field metadata. Booking writes, integrations, tracking and WhatsApp payload are retained. |

One-way WhatsApp now opens after the saved record, dispatch intake and tracking, before waiting for email. Email and Sheets calls remain; Sheets uses keepalive for the same-tab fallback. Existing message text and map-link slots remain, with the generated booking ID appended. On a blocked popup, fallback occurs after notification work has started. The airport message builder is unchanged.

## Verification and measurable differences

- TypeScript: `npx tsc --noEmit` passed after route type generation.
- Production build: `npm run build` passed, including 109 generated pages. The first restricted run failed to reach Firestore while generating the sitemap; the network-enabled local retry passed. No deployment was performed.
- ESLint: all four modified components passed.
- International phone validation: 14/14 existing tests passed.
- `git diff --check` passed.
- Direct comparison with HEAD verified the airport WhatsApp builder, original one-way message template, Firestore lead payload, and one-way tracking payload/event calls are unchanged. The booking ID is appended after the original one-way message is built.
- Public pre-edit audit tested live Places and airport quotations, without final booking submission.
- Isolated local UI fixture used copies of the booking components with simulated Firestore, booking API, notifications and tracking. It exercised both journeys at 390 × 844 and 1440 × 1000. Both opened the WhatsApp share page with route, vehicle, customer, phone, date/time and price data. One-way also included map-link slots and booking ID; airport included its booking ID and passenger/luggage data. No messages were sent.
- Airport testing covered repeated active selection, switching Pickup → Drop-off, restored name and international phone, and selecting Civic on desktop.
- The existing normal-booking implementation was reviewed for the Islamabad and Lahore flows. The shared Islamabad modal received the same first-invalid-focus and sticky-action treatment. Lahore remains functionally unchanged because its existing component already has bounded modal scrolling and state preservation; its separate error-focus improvement is recorded as follow-up work pending a browser session that can be re-opened.
- Actual local one-way page verified route changes, automatic correction of identical cities, modal opening, mobile and desktop layouts, and first-invalid-field focus. The rendered error stayed alongside the sticky CTA.
- Actual local airport page verified missing-location validation focuses the location field at both mobile and desktop widths.
- Temporary test route, adapters and generation scripts were removed after testing.

Interaction counts are control-level actions, not physical keystrokes or a stopwatch benchmark. After the one-way route is chosen, the minimum structural path remains eight actions: open modal, complete six required controls, continue. No required fields were removed. Scrolling to discover the final action is no longer necessary. Airport accidental repeat-tap recovery previously needed at least two CTA clicks (quote again and select vehicle) plus re-entering each completed customer field; now it needs zero recovery actions. A name-only draft therefore avoids at least three actions. A redundant quote request is also avoided in that case.

Performance changes remove the email wait from normal one-way popup handoff, avoid a route-correction follow-up render, stabilize the Google libraries argument, and avoid clearing airport results while refreshing. No numerical latency improvement or under-90-second completion claim is made.

## Limits and follow-up

Localhost Google Places became unavailable in this environment; the airport final-submit fixture therefore used a simulated suggestion, not a live localhost Google selection. Public autocomplete was verified separately. Simulated quote prices only exercise UI; existing server pricing formulas were untouched. Production Firestore persistence, notification delivery and mobile native WhatsApp app launch were not tested. Responsive desktop-browser testing does not prove iOS/Android keyboard or popup-policy behavior. The blocked-popup fallback was reviewed in code, not tested with a real mobile popup blocker.

Remaining friction includes the long native date/time selectors, Google availability/loading dependence, and the amount of required address entry. Airport trip-detail edits after an existing quotation deserve a separate review of quote freshness and reconfirmation behavior. Test a real phone and an isolated staging backend before deployment approval; no production booking should be created just to obtain a test metric.

For C and D, the next safe improvement is to add the same first-invalid-field focus and sticky action to the Lahore form and to instrument the two-modal path (vehicle details → package → customer form) with timing and interaction counts once the browser usage gate allows a fresh customer run.

## Final comparison

**Islamabad/Rawalpindi — Before → After**  
Vehicle details opened a long normal-booking form whose submit action and errors could sit below the mobile viewport. → The shared form now locks background scroll, keeps the submit action visible, and scrolls/focuses the first invalid field. The existing Firestore, dispatch, email, Sheets, tracking and WhatsApp work remains intact.

**Lahore — Before → After**  
The inventory flow already preserved package, duration, location and customer state, but submit errors were below the relevant field and missing name/phone did not receive focused recovery. → Missing Places, name and phone errors now scroll to and focus the relevant field; correcting them keeps the selected package, duration, locations and entered values. The separate vehicle-comparison modal and all lead/WhatsApp data remain unchanged.

**One-Way — Before → After**  
The mobile form needed manual scrolling to reach the CTA and blurred fields during scrolling. → The compact dialog and sticky CTA keep the next action reachable; first-error focus, preserved draft state and fast WhatsApp handoff are active. The required path remains 8 control actions for a filled booking; recovery from a missing first field is one focused correction instead of searching.

**Airport — Before → After**  
Repeating the active trip-type tap cleared results and customer details; cards did not show the selected vehicle. → Repeating the tap is a no-op, drafts survive direction changes and refreshes, the selected card is visibly marked, and errors/success scroll into view. The normal quote path remains one location selection, date/time choice, quote action, vehicle choice and customer submit before WhatsApp.

The additional browser regression could not be completed in this continuation because the in-app browser usage-limit gate rejected new public and localhost navigation. Existing four-flow observations and isolated one-way/airport completion evidence remain above; no production booking was submitted.

## Final verification attempt

The requested fresh regression was attempted after the final Lahore changes. The browser usage-limit gate rejected access even to the existing localhost tab, so no new browser results are claimed. The four statuses are therefore FAIL/UNVERIFIED for this verification run rather than inferred PASS results. TypeScript and lint passed; the production build was started but its Firestore-backed sitemap step could not be completed after the same environment access restriction.

No booking fields, pricing rules, SEO content, tracking, backend records or WhatsApp booking data were removed.

## Fresh final verification (2026-09-06)

The production build was rerun successfully before this verification and completed TypeScript checking, static generation (109 pages), and the Firestore-backed sitemap stage. `npx tsc --noEmit` and `git diff --check` also passed. The repository-wide ESLint command still reports pre-existing errors in unrelated blog, route, and utility files; this is not a regression from the booking UX changes.

The fresh mobile run used an isolated local adapter for booking writes, dispatch, notification calls, and Lahore/Airport booking responses. No production booking was created. The local Google Places key rejects `127.0.0.1:3001` with `RefererNotAllowedMapError`, so typed addresses were used only to exercise the validation paths; a live Places selection on localhost is not claimed.

- Islamabad/Rawalpindi: PASS after a real regression fix. The empty submit initially focused Customer name while reporting the missing date. The shared modal now maps each validation error to its own date, time, pickup, destination, name, or phone control, scrolls it into view, and retains the entered name. The isolated run completed through the saved WhatsApp handoff with the normal booking summary intact.
- Lahore: FAIL/blocked for final handoff verification. The correct pickup field received focus and was brought into view, but localhost Places was unavailable. The existing `form action` reset also cleared uncontrolled name/phone/email values after the invalid submit; this behavior predates the current focus-only change and was not altered under final-verification-only scope.
- One-Way: PASS. Missing name focused the name field; correction preserved route/date/time/addresses. The saved handoff opened WhatsApp and retained the complete route, fare, customer, map-link slots, and booking ID payload.
- Airport: FAIL/blocked for a fresh current-run handoff because the browser usage-limit gate reappeared while opening the fourth journey; the prior isolated Airport run remains evidence for the unchanged implementation, including missing-location focus, draft preservation, quote/vehicle selection, and complete WhatsApp payload. Live Places and native mobile keyboard behavior remain environment-limited.

Desktop regression was covered by the existing local Airport and One-Way runs at 1440px; the fresh run was mobile-first. No further UX suggestions were implemented. The only code change in this final pass is the Islamabad first-invalid-field targeting fix in `LeadModal.tsx`.
