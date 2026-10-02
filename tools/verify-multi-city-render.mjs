import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";

const base = process.argv[2] ?? "http://localhost:3100";
const routes = ["/", "/rent-a-car-islamabad", "/rent-a-car-rawalpindi", "/rent-a-car-lahore", "/cars/toyota-corolla/islamabad/with-driver", "/cars/toyota-corolla/lahore/with-driver"];
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
const robots = await (await fetch(base + "/robots.txt")).text();
assert.ok(robots.includes("Allow: /"));
await writeFile("output/multi-city-render-check.json", JSON.stringify({ routes: results, inventories, filterCanonical: "https://www.rentka.co/", sitemapFilterVariants: false, robotsPublicAllowed: true }, null, 2));
console.log(JSON.stringify({ routes: results, inventories, filterCanonical: "https://www.rentka.co/", sitemapFilterVariants: false, robotsPublicAllowed: true }, null, 2));
