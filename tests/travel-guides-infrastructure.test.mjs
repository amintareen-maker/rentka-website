import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";

const require = createRequire(import.meta.url);
const source = relative => readFileSync(new URL(`../${relative}`, import.meta.url), "utf8");

function loadTravelGuides() {
  const contentOutput = ts.transpileModule(source("src/lib/travel-guides/lahore-family-places.ts"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const contentLoaded = { exports: {} };
  new Function("require", "module", "exports", contentOutput)(require, contentLoaded, contentLoaded.exports);
  const output = ts.transpileModule(source("src/lib/travel-guides.ts"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const loaded = { exports: {} };
  new Function("require", "module", "exports", output)(
    name => name === "@/lib/seo"
      ? { ORGANIZATION_ID: "https://www.rentka.co/#organization", SITE_URL: "https://www.rentka.co", WEBSITE_ID: "https://www.rentka.co/#website" }
      : name === "@/lib/travel-guides/lahore-family-places"
        ? contentLoaded.exports
        : require(name),
    loaded,
    loaded.exports,
  );
  return loaded.exports;
}

test("travel guide hubs and scalable article route exist without tag or filter pages", () => {
  for (const relative of [
    "app/travel-guides/page.tsx",
    "app/travel-guides/lahore/page.tsx",
    "app/travel-guides/[city]/[slug]/page.tsx",
    "src/components/travel-guides/GuideArticle.tsx",
  ]) assert.equal(existsSync(new URL(`../${relative}`, import.meta.url)), true, relative);
  for (const relative of ["app/travel-guides/tag", "app/travel-guides/category", "app/travel-guides/filter"]) {
    assert.equal(existsSync(new URL(`../${relative}`, import.meta.url)), false, relative);
  }
});

test("guide hubs are indexable with unique metadata and self-canonicals", () => {
  const root = source("app/travel-guides/page.tsx");
  const lahore = source("app/travel-guides/lahore/page.tsx");
  for (const [page, canonical] of [[root, "/travel-guides"], [lahore, "city.href"]]) {
    assert.match(page, /title:\s*\{ absolute: title \}/);
    assert.match(page, /description/);
    assert.match(page, /robots:\s*\{ index: true, follow: true \}/);
    assert.match(page, new RegExp(`canonical:[^\n]+${canonical.replaceAll("/", "\\/")}`));
  }
  assert.match(root, /<h1/);
  assert.match(lahore, /<h1/);
});

test("hubs emit collection and breadcrumb schema through the hardened JSON-LD component", () => {
  for (const relative of ["app/travel-guides/page.tsx", "app/travel-guides/lahore/page.tsx"]) {
    const page = source(relative);
    assert.match(page, /"@type": "CollectionPage"/);
    assert.match(page, /breadcrumbJsonLd/);
    assert.match(page, /<JsonLd/);
  }
});

test("article template provides one featured image, breadcrumbs, BlogPosting schema and commercial links", () => {
  const component = source("src/components/travel-guides/GuideArticle.tsx");
  assert.equal((component.match(/<Image\s/g) ?? []).length, 1);
  for (const marker of ["guide.featuredImage", "guide.featuredImageAlt", "Breadcrumbs", "buildGuideArticleSchema", "guide.commercialLinks", "<JsonLd"]) assert.ok(component.includes(marker), marker);
  assert.match(component, /sizes=/);
});

test("only the substantive family guide is published while the other Lahore guides remain drafts", () => {
  const registry = loadTravelGuides();
  assert.equal(registry.travelGuides.length, 3);
  assert.deepEqual(registry.travelGuides.map(guide => guide.title), [
    "Top Places to Visit in Lahore with Family",
    "One Day Lahore Sightseeing Plan",
    "Lahore Travel Guide for First-Time Visitors",
  ]);
  for (const guide of registry.travelGuides) {
    assert.equal(guide.city, "lahore");
    assert.ok(guide.outline.length >= 4);
    assert.match(guide.featuredImage, /^\//);
  }
  const [published, ...drafts] = registry.travelGuides;
  assert.equal(published.status, "published");
  assert.ok(published.sections.length >= 8);
  assert.equal(published.datePublished, "2026-09-25");
  assert.equal(published.dateModified, "2026-09-25");
  assert.equal(registry.publishedTravelGuides.length, 1);
  assert.equal(registry.getPublishedGuide("lahore", published.slug)?.slug, published.slug);
  for (const draft of drafts) {
    assert.equal(draft.status, "draft");
    assert.equal(draft.sections.length, 0);
    assert.equal(registry.getPublishedGuide("lahore", draft.slug), undefined);
  }
});

test("article schema builder produces a canonical BlogPosting for publishable content", () => {
  const registry = loadTravelGuides();
  const guide = { ...registry.travelGuides[0], status: "published", datePublished: "2026-10-01", sections: [{ id: "intro", heading: "Introduction", paragraphs: ["Substantive reviewed copy."] }] };
  const schema = registry.buildGuideArticleSchema(guide);
  assert.equal(schema["@type"], "BlogPosting");
  assert.equal(schema.mainEntityOfPage["@id"], `https://www.rentka.co/travel-guides/lahore/${guide.slug}`);
  assert.equal(schema.author["@id"], "https://www.rentka.co/#organization");
  assert.equal(schema.image, "https://www.rentka.co/top-places-to-visit-in-lahore-with-family.webp");
});

test("dynamic guide metadata indexes only published guides and drafts resolve through notFound", () => {
  const route = source("app/travel-guides/[city]/[slug]/page.tsx");
  assert.match(route, /getPublishedGuide\(city, slug\)/);
  assert.match(route, /robots:\s*\{ index: false, follow: false \}/);
  assert.match(route, /robots:\s*\{ index: true, follow: true \}/);
  assert.match(route, /alternates:\s*\{ canonical: url \}/);
  assert.match(route, /if \(!guide\) notFound\(\)/);
  assert.match(route, /export const dynamic = "force-dynamic"/);
});

test("sitemap includes substantive hubs and only registry-approved published guide URLs", () => {
  const sitemap = source("app/sitemap.ts");
  assert.match(sitemap, /path: "\/travel-guides"/);
  assert.match(sitemap, /path: "\/travel-guides\/lahore"/);
  assert.match(sitemap, /publishedTravelGuides\.map/);
  assert.match(sitemap, /guidePath\(guide\)/);
  for (const slug of loadTravelGuides().travelGuides.map(guide => guide.slug)) assert.equal(sitemap.includes(slug), false, slug);
});

test("existing blog routes remain separate and the new hub has a natural internal link", () => {
  assert.equal(existsSync(new URL("../app/blog/page.tsx", import.meta.url)), true);
  assert.equal(existsSync(new URL("../app/blog/[slug]/page.tsx", import.meta.url)), true);
  assert.doesNotMatch(source("app/blog/page.tsx"), /travel-guides/);
  assert.match(source("app/layout.tsx"), /href="\/travel-guides"/);
});
