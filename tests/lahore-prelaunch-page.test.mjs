import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("Lahore page has one H1, self-canonical metadata and flag-controlled robots", async () => {
  const page = await read("app/rent-a-car-lahore/page.tsx");
  assert.equal((page.match(/<h1\b/g) || []).length, 1);
  assert.match(page, /https:\/\/www\.rentka\.co\/rent-a-car-lahore/);
  assert.match(page, /robots: prelaunch \? \{ index: false, follow: false, noarchive: true, nosnippet: true \}/);
  assert.doesNotMatch(page, /canonical:\s*["']https:\/\/www\.rentka\.co\/rent-a-car-islamabad/);
});

test("Lahore page resolves only Lahore with-driver inventory", async () => {
  const page = await read("app/rent-a-car-lahore/page.tsx");
  assert.match(page, /resolveNormalRentalInventory\(\{ zoneId: "lahore", cityId: "lahore", service: "withDriver" \}\)/);
  assert.match(page, /variant="prelaunch"/);
  assert.doesNotMatch(page, /CityVehicleSelector/);
});

test("Lahore schema matches visible breadcrumb, service and FAQ content without LocalBusiness", async () => {
  const page = await read("app/rent-a-car-lahore/page.tsx");
  for (const schema of ["BreadcrumbList", "Service", "FAQPage"]) assert.match(page, new RegExp(`"@type": "${schema}"`));
  assert.doesNotMatch(page, /"@type": "LocalBusiness"/);
  assert.match(page, /faqs\.map\(\(faq\)/);
});

test("Lahore is discoverable with inventory-driven sitemap and public shell enabled", async () => {
  const [sitemap, header, layout, proxy] = await Promise.all([
    read("app/sitemap.ts"), read("src/components/Header.tsx"), read("app/layout.tsx"), read("proxy.ts"),
  ]);
  assert.match(sitemap, /getEligibleLahoreModels/);
  assert.match(sitemap, /rent-a-car-lahore/);
  assert.match(header, /rent-a-car-lahore/);
  assert.match(layout, /rent-a-car-lahore/);
  assert.doesNotMatch(proxy, /"\/rent-a-car-lahore"/);
});
