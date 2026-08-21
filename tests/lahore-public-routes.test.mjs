import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("Lahore vehicle branch is resolver-backed while Twin Cities legacy branch remains", async () => {
  const page = await read("app/cars/[slug]/[city]/[service]/page.tsx");
  assert.match(page, /if \(city === "lahore"\)/);
  assert.match(page, /getEligibleLahoreModel\(slug\)/);
  assert.match(page, /if \(!model\) notFound\(\)/);
  assert.match(page, /collection\(liteDb, "countries", country, "cars"\)/);
  assert.match(page, /requestedCity === "islamabad"/);
  assert.match(page, /https:\/\/www\.rentka\.co\/cars\/\$\{slug\}\/lahore\/\$\{service\}/);
  assert.doesNotMatch(page, /canonical.*rent-a-car-islamabad/);
});

test("public and admin routes fix their own source and share the server lead core", async () => {
  const [publicRoute, adminRoute, core] = await Promise.all([
    read("app/api/normal-rental-lead/route.ts"), read("app/api/admin/normal-rental-test-lead/route.ts"), read("src/lib/normal-rental/lahore-lead.ts"),
  ]);
  assert.match(publicRoute, /handleLahoreLead\(request, "rent_a_car_lahore"\)/);
  assert.match(publicRoute, /publicLeadRateLimit/);
  assert.match(adminRoute, /hasAdminSession/);
  assert.match(adminRoute, /handleLahoreLead\(request, "admin_lahore_preview"\)/);
  assert.match(core, /resolveNormalRentalInventory\(\{ zoneId: "lahore"/);
  assert.match(core, /db\.runTransaction/);
  assert.match(core, /publicLahoreOptionId/);
  assert.match(core, /\/api\/lead-booking/);
  assert.match(core, /\/api\/lead-sheet/);
  assert.doesNotMatch(core, /value\(payload, "source"\)/);
});

test("public browser inventory strips vendor fields and uses opaque option IDs", async () => {
  const [publicInventory, landing, vehicle] = await Promise.all([
    read("src/lib/normal-rental/public-inventory.ts"), read("app/rent-a-car-lahore/page.tsx"), read("app/cars/[slug]/[city]/[service]/page.tsx"),
  ]);
  assert.match(publicInventory, /createHash\("sha256"\)/);
  assert.doesNotMatch(publicInventory, /vendorId: item\.vendorId|vendorName: item\.vendorName/);
  assert.match(landing, /toPublicLahoreInventory\(inventory\)/);
  assert.match(vehicle, /toPublicLahoreInventory\(model\.inventory\)/);
});

test("homepage SEO remains Islamabad-focused while Lahore is a secondary CTA", async () => {
  const page = await read("app/page.tsx");
  assert.match(page, /Car Rental with Driver Islamabad & Rawalpindi/);
  assert.match(page, /Explore Lahore Car Rental/);
});

test("public Lahore landing is enabled and no longer proxy-suppressed", async () => {
  const [zones, proxy, landing] = await Promise.all([read("src/lib/normal-rental/zones.ts"), read("proxy.ts"), read("app/rent-a-car-lahore/page.tsx")]);
  assert.match(zones, /lahore:[\s\S]*publicEnabled: true/);
  assert.doesNotMatch(proxy, /"\/rent-a-car-lahore"/);
  assert.match(landing, /if \(prelaunch && !\(await hasAdminSession\(\)\)\) redirect/);
});
