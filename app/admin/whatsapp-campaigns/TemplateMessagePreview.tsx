import Image from "next/image";
import { isCompleteTemplatePreview, TEMPLATE_PREVIEW_BLOCKER, type TemplatePreview } from "@/lib/whatsapp-campaigns/template-preview";

export default function TemplateMessagePreview({ preview, onImageReady }: { preview: TemplatePreview | null; onImageReady: (ready: boolean) => void }) {
  if (!isCompleteTemplatePreview(preview)) return <p role="alert" className="my-3 rounded-lg bg-amber-50 p-3 font-semibold text-amber-900">{TEMPLATE_PREVIEW_BLOCKER}</p>;
  return <section aria-label="WhatsApp message preview" className="my-4 rounded-xl border border-slate-200 bg-[#e9f0eb] p-4 md:p-6">
    <p className="mb-4 font-bold text-[#0F2B46]">Review the exact message below before sending.</p>
    <div className="max-w-md overflow-hidden rounded-2xl rounded-tl-sm border border-slate-200 bg-white shadow-sm">
      <Image unoptimized src={preview.headerImageUrl} alt="Approved campaign header" width={preview.headerWidth} height={preview.headerHeight} className="h-auto w-full" onLoad={() => onImageReady(true)} onError={() => onImageReady(false)} />
      <div className="p-4"><p className="whitespace-pre-wrap text-sm leading-6 text-slate-900">{preview.bodyText}</p><p className="mt-4 text-xs text-slate-500">{preview.footerText}</p></div>
      <a href={preview.ctaUrl} target="_blank" rel="noreferrer" className="block border-t border-slate-200 px-4 py-3 text-center text-sm font-bold text-[#0F2B46]">{preview.ctaLabel}</a>
    </div>
    <p className="mt-3 break-all text-sm text-slate-700">CTA destination: <a className="underline" href={preview.ctaUrl} target="_blank" rel="noreferrer">{preview.ctaUrl}</a></p>
    <p className="mt-2 text-xs text-slate-600">Template: {preview.templateName} · Language: {preview.language} · Category: {preview.category}</p>
  </section>;
}
