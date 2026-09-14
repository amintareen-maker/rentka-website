import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
import { INTRODUCTION } from "../src/lib/whatsapp-campaigns/types.ts";
import * as previewModule from "../src/lib/whatsapp-campaigns/template-preview.ts";

const expectedBody = `🚗 Introducing RentKA

We’re making car rentals simpler, more transparent and more reliable.

Our focus is on clear pricing, reliable vehicles and professional service you can depend on.

🏙️ Within-City Rentals
✈️ Airport Transfers
🛣️ Intercity & One-Way Trips
📅 Monthly Rentals

📍 Islamabad • Rawalpindi • Lahore

🌐 rentka.co`;
const require = createRequire(import.meta.url);
const source = readFileSync(new URL("../app/admin/whatsapp-campaigns/TemplateMessagePreview.tsx", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
const mod = { exports: {} };
new Function("require", "module", "exports", compiled)(name => name === "@/lib/whatsapp-campaigns/template-preview" ? previewModule : name === "next/image" ? { default: ({ src, alt, width, height }) => React.createElement("img", { src, alt, width, height }) } : require(name), mod, mod.exports);
const Component = mod.exports.default;
const preview = previewModule.getTemplatePreview(INTRODUCTION);

test("message card renders exact approved body, footer, image and CTA", () => {
  assert.equal(preview.bodyText, expectedBody);
  const html = renderToStaticMarkup(React.createElement(Component, { preview, onImageReady: () => {} }));
  const body = html.match(/<p class="whitespace-pre-wrap[^\"]*">([\s\S]*?)<\/p>/)?.[1];
  assert.equal(body, expectedBody.replaceAll("&", "&amp;"));
  assert.ok(html.includes("RentKA — Car rentals. Made simple."));
  assert.ok(html.includes('src="https://www.rentka.co/whatsapp/rentka-introduction-header.jpg"'));
  assert.match(html, /href="https:\/\/www\.rentka\.co"[^>]*>Explore RentKA<\/a>/);
  assert.ok(html.includes("CTA destination:"));
  assert.ok(html.includes("rentka_introduction_v1")); assert.ok(html.includes("Language: en")); assert.ok(html.includes("Category: marketing"));
  assert.ok(html.includes("Review the exact message below before sending."));
});
test("missing metadata renders a blocking error rather than a partial message", () => {
  for (const key of Object.keys(preview)) assert.equal(previewModule.isCompleteTemplatePreview({ ...preview, [key]: undefined }), false, key);
  const html = renderToStaticMarkup(React.createElement(Component, { preview: null, onImageReady: () => {} }));
  assert.ok(html.includes(previewModule.TEMPLATE_PREVIEW_BLOCKER)); assert.ok(!html.includes("<img")); assert.ok(!html.includes("Explore RentKA"));
});
test("confirmation requires exact phrase and complete safe metadata", () => {
  const expected = "SEND TEST TO 2 CONTACTS";
  for (const phrase of ["", "SEND", "send test to 2 contacts", "SEND TEST TO 3 CONTACTS"]) assert.equal(previewModule.templateConfirmationReady(preview, phrase, expected), false);
  assert.equal(previewModule.templateConfirmationReady(preview, expected, expected), true);
  assert.equal(previewModule.templateConfirmationReady(null, expected, expected), false);
  assert.equal(previewModule.templateConfirmationReady({ ...preview, ctaUrl: "javascript:alert(1)" }, expected, expected), false);
  assert.equal(previewModule.isCompleteTemplatePreview({ ...preview, bodyText: "Hi {{1}}" }), false);
});
test("template identity, language, category and header cannot silently drift", () => {
  for (const [key, value] of [["templateName", "other"], ["templateLanguage", "ur"], ["templateCategory", "utility"], ["headerImageUrl", "https://example.com/other.jpg"]]) assert.equal(previewModule.getTemplatePreview({ ...INTRODUCTION, [key]: value }), null, key);
});
