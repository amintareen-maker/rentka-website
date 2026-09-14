import { INTRODUCTION } from "./types.ts";

/** Approved static content for the named provider template; never sent as body variables. */
export type TemplatePreview = {
  templateName: string; language: string; category: "marketing" | "utility" | "authentication";
  headerImageUrl: string; headerWidth: number; headerHeight: number;
  bodyText: string; footerText: string; ctaLabel: string; ctaUrl: string;
};
type TemplateIdentity = { templateName: string; templateLanguage: string; templateCategory: string; headerImageUrl: string };

export const TEMPLATE_PREVIEWS: Readonly<Record<string, TemplatePreview>> = {
  [`${INTRODUCTION.templateName}:${INTRODUCTION.templateLanguage}`]: {
    templateName: INTRODUCTION.templateName, language: INTRODUCTION.templateLanguage,
    category: INTRODUCTION.templateCategory, headerImageUrl: INTRODUCTION.headerImageUrl,
    headerWidth: 1733, headerHeight: 907,
    bodyText: "🚗 Introducing RentKA\n\nWe’re making car rentals simpler, more transparent and more reliable.\n\nOur focus is on clear pricing, reliable vehicles and professional service you can depend on.\n\n🏙️ Within-City Rentals\n✈️ Airport Transfers\n🛣️ Intercity & One-Way Trips\n📅 Monthly Rentals\n\n📍 Islamabad • Rawalpindi • Lahore\n\n🌐 rentka.co",
    footerText: "RentKA — Car rentals. Made simple.",
    ctaLabel: "Explore RentKA", ctaUrl: "https://www.rentka.co",
  },
};
export const TEMPLATE_PREVIEW_BLOCKER = "Approved template preview metadata is missing or incomplete. Sending is blocked.";
const text = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0 && !value.includes("{{");
function https(value: unknown) {
  if (!text(value)) return false;
  try { const url = new URL(value); return url.protocol === "https:" && !url.username && !url.password; } catch { return false; }
}
export function isCompleteTemplatePreview(preview: TemplatePreview | null | undefined): preview is TemplatePreview {
  return !!preview && [preview.templateName, preview.language, preview.bodyText, preview.footerText, preview.ctaLabel].every(text)
    && ["marketing", "utility", "authentication"].includes(preview.category)
    && https(preview.headerImageUrl) && https(preview.ctaUrl)
    && Number.isInteger(preview.headerWidth) && preview.headerWidth > 0 && Number.isInteger(preview.headerHeight) && preview.headerHeight > 0;
}
export function getTemplatePreview(identity: TemplateIdentity): TemplatePreview | null {
  const preview = TEMPLATE_PREVIEWS[`${identity.templateName}:${identity.templateLanguage}`];
  if (!isCompleteTemplatePreview(preview) || preview.templateName !== identity.templateName || preview.language !== identity.templateLanguage
    || preview.category !== identity.templateCategory || preview.headerImageUrl !== identity.headerImageUrl) return null;
  return { ...preview };
}
export function requireTemplatePreview(identity: TemplateIdentity): TemplatePreview {
  const preview = getTemplatePreview(identity);
  if (!preview) throw new Error(TEMPLATE_PREVIEW_BLOCKER);
  return preview;
}
export function templateConfirmationReady(preview: TemplatePreview | null | undefined, phrase: string, expected: string) {
  return isCompleteTemplatePreview(preview) && !!expected && phrase.trim() === expected;
}
