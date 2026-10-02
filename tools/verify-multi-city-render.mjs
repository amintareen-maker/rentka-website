import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";

const base = process.argv[2] ?? "http://localhost:3100";
const routes = ["/", "/rent-a-car-islamabad", "/rent-a-car-rawalpindi", "/rent-a-car-lahore", "/cars/toyota-corolla/islamabad/with-driver", "/cars/toyota-corolla/lahore/with-driver", "/travel-guides", "/travel-guides/lahore", "/travel-guides/lahore/top-places-to-visit-in-lahore-with-family", "/travel-guides/lahore/one-day-lahore-sightseeing-plan", "/travel-guides/lahore/lahore-travel-guide-for-first-time-visitors"];
const organizationId = "https://www.rentka.co/#organization";
const decode = (text) => text.replaceAll("&amp;", "&").replaceAll("&quot;", '"').replaceAll("&#x27;", "'").replaceAll("&#39;", "'").replaceAll("&gt;", ">").replaceAll("&lt;", "<").replace(/\s+/g, " ").trim();
await mkdir("output/multi-city-schema", { recursive: true });
const results = [];
for (const route of routes) {
  const response = await fetch(base + route);
  assert.equal(response.status, 200, route);
  const html = await response.text();
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
  assert.equal(canonical, "https://www.rentka.co" + route, route + " canonical");
  assert.doesNotMatch(html, /\\?"vendor(?:Id|Name)\\?"\s*:/, route + " public vendor payload");
  const schemas = [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map((match) => JSON.parse(match[1]));
  assert.ok(schemas.length > 0, route + " server-rendered JSON-LD");
  const entities = schemas.flatMap((schema) => schema["@graph"] ?? [schema]);
  const visibleText = decode(html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, "").replace(/<!--[\s\S]*?-->/g, "").replace(/<[^>]+>/g, " "));
  const ids = entities.filter((entity) => entity["@id"]).map((entity) => entity["@id"]);
  assert.equal(new Set(ids).size, ids.length, route + " duplicate schema definitions");
  assert.ok(!entities.some((entity) => ["LocalBusiness", "CarRental"].includes(entity["@type"])));
  for (const entity of entities) {
    if (entity["@type"] === "Service") assert.equal(entity.provider["@id"], organizationId);
    if (entity["@type"] === "FAQPage") for (const question of entity.mainEntity) {
      assert.ok(visibleText.includes(decode(question.name)), route + " visible FAQ question");
      assert.ok(visibleText.includes(decode(question.acceptedAnswer.text)), route + " visible FAQ answer");
    }
  }
  if (route === "/") {
    assert.equal(entities.filter((entity) => entity["@type"] === "Organization").length, 1);
    assert.equal(entities.find((entity) => entity["@type"] === "Organization")["@id"], organizationId);
    assert.equal(entities.find((entity) => entity["@type"] === "WebSite").publisher["@id"], organizationId);
    for (const href of ["/rent-a-car-islamabad", "/rent-a-car-rawalpindi", "/rent-a-car-lahore", "/airport-transfer", "/one-way-drop", "/travel-guides"]) assert.ok(html.includes(`href="${href}"`), href);
  }
  if (route === "/travel-guides") {
    assert.ok(entities.some((entity) => entity["@type"] === "CollectionPage"));
    for (const slug of ["top-places-to-visit-in-lahore-with-family", "one-day-lahore-sightseeing-plan", "lahore-travel-guide-for-first-time-visitors"]) assert.ok(html.includes(`/travel-guides/lahore/${slug}`));
  }
  if (route.startsWith("/travel-guides/lahore/")) assert.ok(entities.some((entity) => entity["@type"] === "BlogPosting"));
  const name = route === "/" ? "home" : route.slice(1).replaceAll("/", "-");
  await writeFile(`output/multi-city-schema/${name}.json`, JSON.stringify(schemas, null, 2));
  await writeFile(`output/multi-city-render-${name}.html`, html);
  results.push({ route, status: response.status, canonical, types: entities.map((entity) => entity["@type"]), visibleFaqsVerified: true, vendorFields: false });
}
const inventories = {};
for (const city of ["islamabad", "rawalpindi", "lahore"]) {
  const response = await fetch(`${base}/api/normal-rental-inventory?city=${city}`);
  assert.equal(response.status, 200);
  assert.match(response.headers.get("x-robots-tag"), /noindex/);
  const { inventory } = await response.json();
  assert.doesNotMatch(JSON.stringify(inventory), /vendorId|vendorName/);
  const models = new Map();
  for (const item of inventory) {
    const key = item.showAsSeparateCard ? item.inventoryId : item.modelKey;
    const price = item.pricing.withDriver.withinCity.daily ?? item.pricing.withDriver.outsideCity.daily;
    models.set(key, Math.min(models.get(key) ?? Infinity, price));
  }
  inventories[city] = { options: inventory.length, cards: models.size, startingPrices: [...models.values()] };
}
const filtered = await (await fetch(base + "/?city=lahore&service=with-driver")).text();
assert.equal(filtered.match(/<link rel="canonical" href="([^"]+)"/)?.[1], "https://www.rentka.co/");
const sitemap = await (await fetch(base + "/sitemap.xml")).text();
assert.doesNotMatch(sitemap, /\?city=|\?service=/);
for (const route of routes.filter((route) => route.startsWith("/travel-guides"))) assert.ok(sitemap.includes("https://www.rentka.co" + route), route + " sitemap");
const blog = await fetch(base + "/blog", { redirect: "manual" });
assert.equal(blog.status, 308);
assert.ok(blog.headers.get("location").endsWith("/travel-guides"));
const robots = await (await fetch(base + "/robots.txt")).text();
assert.ok(robots.includes("Allow: /"));
await writeFile("output/multi-city-render-check.json", JSON.stringify({ routes: results, inventories, filterCanonical: "https://www.rentka.co/", sitemapFilterVariants: false, robotsPublicAllowed: true }, null, 2));
console.log(JSON.stringify({ routes: results, inventories, filterCanonical: "https://www.rentka.co/", sitemapFilterVariants: false, robotsPublicAllowed: true }, null, 2));
