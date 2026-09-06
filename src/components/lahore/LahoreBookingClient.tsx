"use client";

import Image from "next/image";
import Link from "next/link";
import DatePicker from "react-datepicker";
import { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import { GooglePlacesProvider } from "../../../app/admin/pricing-calculator/_components/GooglePlacesProvider";
import { PlaceInput } from "../../../app/admin/pricing-calculator/_components/PlaceInput";
import type { ResolvedPlace } from "../../../app/admin/pricing-calculator/_lib/types";
import { groupNormalRentalInventoryCards, normalRentalModelHref, normalRentalPublicLabel, shouldOpenInventoryComparison, type LahoreBookingInventory } from "@/lib/normal-rental/inventory-core";
import { parseTestLeadResponse } from "@/lib/normal-rental/test-lead-response";
import { formatLahoreWhatsAppVehicleLines } from "@/lib/normal-rental/lead-output";
import type { NormalRentalBookingContext } from "@/lib/normal-rental/zones";
import styles from "../../../app/admin/pricing/preview/PreviewClient.module.css";

type Props = { inventory: LahoreBookingInventory[]; context: Pick<NormalRentalBookingContext, "cityLabel">; variant?: "private-test" | "prelaunch" };
type PackageType = "withinCity" | "outsideCity";
type Duration = "daily" | "weekly" | "monthly";
type CreatedLead = { leadId: string; reviewLink: string; inventory?: LahoreBookingInventory; dailyRentalRate: number; estimatedRentalAmount: number; integrationWarnings?: string[] };
const input = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#5BAE4A] focus:ring-2 focus:ring-[#5BAE4A]/20";
const whatsappNumber = "923020589999";
const TIME_OPTIONS = Array.from({ length: 48 }, (_, index) => {
  const totalMinutes = index * 30;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return {
    value: `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`,
    label: `${hours % 12 || 12}:${String(minutes).padStart(2, "0")} ${hours < 12 ? "AM" : "PM"}`,
  };
});
function pakistanNowParts() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Karachi", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(new Date());
  const part = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((item) => item.type === type)?.value);
  return { year: part("year"), month: part("month"), day: part("day"), hour: part("hour"), minute: part("minute") };
}
function initialSchedule() {
  const now = pakistanNowParts();
  const date = new Date(now.year, now.month - 1, now.day);
  const roundedMinutes = Math.ceil((now.hour * 60 + now.minute) / 30) * 30;
  if (roundedMinutes >= 24 * 60) {
    date.setDate(date.getDate() + 1);
    return { date, time: "00:00" };
  }
  return { date, time: `${String(Math.floor(roundedMinutes / 60)).padStart(2, "0")}:${String(roundedMinutes % 60).padStart(2, "0")}` };
}
const formatStoredDate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const PickerButton = forwardRef<HTMLButtonElement, { value?: string; onClick?: () => void; label: string }>(({ value, onClick, label }, ref) => (
  <button ref={ref} type="button" onClick={onClick} aria-label={label} className={`${input} min-h-10 text-left`}>{value || label}</button>
));
PickerButton.displayName = "PickerButton";

export default function LahoreBookingClient({ inventory, context, variant = "private-test" }: Props) {
  const prelaunch = variant === "prelaunch";
  const cards = useMemo(() => groupNormalRentalInventoryCards(inventory), [inventory]);
  const [modelOptions, setModelOptions] = useState<LahoreBookingInventory[]>();
  const [selected, setSelected] = useState<LahoreBookingInventory>();
  const [packageType, setPackageType] = useState<PackageType>("withinCity");
  const [duration, setDuration] = useState<Duration>("daily");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<CreatedLead>();
  const [pickupAddress, setPickupAddress] = useState("");
  const [pickupPlace, setPickupPlace] = useState<ResolvedPlace>();
  const [destinationAddress, setDestinationAddress] = useState("");
  const [destinationPlace, setDestinationPlace] = useState<ResolvedPlace>();
  const initial = useMemo(initialSchedule, []);
  const [pickupDate, setPickupDate] = useState<Date>(initial.date);
  const [preferredTime, setPreferredTime] = useState(initial.time);
  const [dateOpen, setDateOpen] = useState(false);
  const [timeOpen, setTimeOpen] = useState(false);
  const dateTrigger = useRef<HTMLButtonElement>(null);
  const timeTrigger = useRef<HTMLButtonElement>(null);
  const timeContainer = useRef<HTMLDivElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (!error) return;
    requestAnimationFrame(() => {
      errorRef.current?.scrollIntoView({ block: "center", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
      document.querySelector<HTMLElement>("[aria-invalid='true']")?.focus({ preventScroll: true });
    });
  }, [error]);

  useEffect(() => {
    const outside = (event: MouseEvent) => {
      if (timeOpen && !timeContainer.current?.contains(event.target as Node)) setTimeOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (dateOpen) { setDateOpen(false); requestAnimationFrame(() => dateTrigger.current?.focus()); return; }
      if (timeOpen) { setTimeOpen(false); requestAnimationFrame(() => timeTrigger.current?.focus()); return; }
      if (selected) { setSelected(undefined); setCreated(undefined); return; }
      if (modelOptions) setModelOptions(undefined);
    };
    document.addEventListener("mousedown", outside);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("mousedown", outside); document.removeEventListener("keydown", escape); };
  }, [dateOpen, modelOptions, selected, timeOpen]);

  useEffect(() => {
    if (!modelOptions && !selected) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [modelOptions, selected]);

  useEffect(() => {
    if (!selected) { setDateOpen(false); setTimeOpen(false); }
  }, [selected]);

  useEffect(() => {
    if (packageType === "outsideCity") return;
    setDestinationAddress("");
    setDestinationPlace(undefined);
  }, [packageType]);

  useEffect(() => {
    if (!selected || selected.pricing.withDriver[packageType][duration] !== undefined) return;
    const available = (["daily", "weekly", "monthly"] as const).find((item) => selected.pricing.withDriver[packageType][item] !== undefined);
    if (available) setDuration(available);
  }, [duration, packageType, selected]);

  const currentRate = selected?.pricing.withDriver[packageType][duration];
  const selectedDisplayName = selected ? (selected.showAsSeparateCard ? normalRentalPublicLabel(selected) : selected.modelName) : "";
  const inventoryGridClass = cards.length === 1
    ? "mx-auto grid max-w-2xl grid-cols-1 gap-5"
    : cards.length === 2
      ? "mx-auto grid max-w-5xl gap-5 sm:grid-cols-2"
      : "grid gap-5 sm:grid-cols-2 lg:grid-cols-3";
  if (inventory.length === 0) return <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center font-semibold text-slate-600">No active Lahore inventory available.</div>;

  async function submit(formData: FormData) {
    if (!selected || !currentRate) return;
    const focusField = (selector: string) => requestAnimationFrame(() => document.querySelector<HTMLElement>(selector)?.focus({ preventScroll: true }));
    if (!pickupPlace) { setError("Please select a pickup location from the Google suggestions."); focusField("#lahore-preview-pickup"); return; }
    if (packageType === "outsideCity" && !destinationPlace) { setError("Please select a destination from the Google suggestions."); focusField("#lahore-preview-destination"); return; }
    if (!String(formData.get("customerName") || "").trim()) { setError("Please enter your name."); focusField("input[name='customerName']"); return; }
    if (!String(formData.get("phone") || "").trim()) { setError("Please enter your phone number."); focusField("input[name='phone']"); return; }
    setLoading(true); setError("");
    const whatsappWindow = window.open("", "_blank");
    let committedLead: CreatedLead | undefined;
    try {
      const payload = {
        inventoryId: selected.inventoryId, pricingType: packageType, duration, source: prelaunch ? "rent_a_car_lahore" : "admin_lahore_preview",
        pickupDate: String(formData.get("pickupDate") || ""), preferredTime: String(formData.get("preferredTime") || ""),
        pickupAddress: pickupPlace.formattedAddress, pickupPlaceId: pickupPlace.placeId,
        pickupLatitude: pickupPlace.lat, pickupLongitude: pickupPlace.lng,
        destinationAddress: packageType === "outsideCity" ? destinationPlace!.formattedAddress : "",
        destinationPlaceId: packageType === "outsideCity" ? destinationPlace!.placeId : "",
        destinationLatitude: packageType === "outsideCity" ? destinationPlace!.lat : null,
        destinationLongitude: packageType === "outsideCity" ? destinationPlace!.lng : null,
        numberOfDays: Number(formData.get("numberOfDays")), customerName: String(formData.get("customerName") || ""),
        phone: String(formData.get("phone") || ""), email: String(formData.get("email") || ""),
      };
      const response = await fetch(prelaunch ? "/api/normal-rental-lead" : "/api/admin/normal-rental-test-lead", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const responseBody = await response.text();
      const lead = parseTestLeadResponse(responseBody, response.ok, response.status) as CreatedLead;
      committedLead = lead;
      setCreated(lead);
      const destination = packageType === "outsideCity" ? `\nTravelling To: ${payload.destinationAddress}` : "";
      const vehicleLines = formatLahoreWhatsAppVehicleLines({ carName: selected.modelName, modelYear: selected.modelYearLabel ?? selected.modelYear, publicVehicleLabel: selected.showAsSeparateCard ? normalRentalPublicLabel(selected) : selected.publicLabel, pricingType: packageType, duration, rate: currentRate });
      const message = `Hi RentKA\n\nI submitted a ${prelaunch ? "Lahore car rental request" : "private Lahore test request"}.\n\nBooking reference: *${lead.leadId}*\nCity: ${context.cityLabel}\n${vehicleLines.join("\n")}\nRental Duration: ${duration}\nPickup: ${payload.pickupAddress}${destination}\nDate: ${payload.pickupDate}\nTime: ${payload.preferredTime}\nDays: ${payload.numberOfDays}\nEstimated Rental: PKR ${lead.estimatedRentalAmount.toLocaleString("en-PK")}\n\nCustomer: ${payload.customerName}\nPhone: ${payload.phone}\nEmail: ${payload.email || "Not provided"}\n\nPlease confirm availability.`;
      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
      if (whatsappWindow) whatsappWindow.location.href = whatsappUrl;

      if (prelaunch) return;

      const common = {
        leadId: lead.leadId, carName: selected.modelName, carId: selected.inventoryId, vendorName: selected.vendorName,
        vendorId: selected.vendorId, modelYear: selected.modelYearLabel ?? selected.modelYear ?? null,
        publicVehicleLabel: selected.showAsSeparateCard ? normalRentalPublicLabel(selected) : null, country: "PK", city: context.cityLabel,
        service: "With Driver", pricingType: packageType, duration, originalPrice: currentRate,
        dailyRentalRate: lead.dailyRentalRate, numberOfDays: payload.numberOfDays, estimatedRentalAmount: lead.estimatedRentalAmount,
        pickupDate: payload.pickupDate, preferredTime: payload.preferredTime, pickupAddress: payload.pickupAddress,
        pickupLatitude: payload.pickupLatitude, pickupLongitude: payload.pickupLongitude, pickupPlaceId: payload.pickupPlaceId,
        pickupMapLink: `https://maps.google.com/?q=${payload.pickupLatitude},${payload.pickupLongitude}`, isOutstation: packageType === "outsideCity",
        destinationAddress: packageType === "outsideCity" ? payload.destinationAddress : "",
        destinationLatitude: packageType === "outsideCity" ? payload.destinationLatitude : null,
        destinationLongitude: packageType === "outsideCity" ? payload.destinationLongitude : null,
        destinationPlaceId: packageType === "outsideCity" ? payload.destinationPlaceId : "",
        destinationMapLink: packageType === "outsideCity" ? `https://maps.google.com/?q=${payload.destinationLatitude},${payload.destinationLongitude}` : "", customerName: payload.customerName,
        phone: payload.phone, email: payload.email, source: payload.source, reviewLink: lead.reviewLink,
      };
      const sheetPayload = {
        leadId: lead.leadId, name: payload.customerName, phone: payload.phone, email: payload.email, carName: selected.modelName,
        vendorName: selected.vendorName, vendorId: selected.vendorId, modelYear: String(common.modelYear ?? ""), publicVehicleLabel: common.publicVehicleLabel ?? "", country: "PK",
        city: context.cityLabel, service: "withDriver", serviceType: packageType, packageName: packageType, packageDuration: duration,
        packagePrice: String(currentRate), pickupDate: payload.pickupDate, preferredTime: payload.preferredTime,
        source: payload.source, status: "new", pickupAddress: payload.pickupAddress,
        numberOfDays: payload.numberOfDays, dailyRentalRate: lead.dailyRentalRate, estimatedRentalAmount: lead.estimatedRentalAmount,
        destinationAddress: packageType === "outsideCity" ? payload.destinationAddress : "", isOutstation: packageType === "outsideCity",
      };
      const integrations = await Promise.allSettled([
        fetch("/api/lead-booking", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(common) }),
        fetch("/api/lead-sheet", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(sheetPayload) }),
      ]);
      const warnings: string[] = [];
      const labels = ["email", "Google Sheets"];
      integrations.forEach((result, index) => {
        if (result.status === "rejected" || !result.value.ok) warnings.push(`${labels[index]} failed`);
      });
      if (warnings.length) setCreated({ ...lead, integrationWarnings: warnings });
    } catch (caught) {
      if (whatsappWindow && !whatsappWindow.closed) whatsappWindow.close();
      const message = caught instanceof Error ? caught.message : "Unable to create test lead.";
      if (committedLead) {
        setCreated({ ...committedLead, integrationWarnings: [`downstream preparation failed: ${message}`] });
        setError("");
      } else {
        setError(message);
      }
    } finally { setLoading(false); }
  }

  return <GooglePlacesProvider><>
    <div className={inventoryGridClass}>{cards.map((card) => { const options = card.options; const first = options[0]; const minimum = Math.min(...options.map((item) => item.pricing.withDriver.withinCity.daily ?? Infinity)); const hasWithinCity = options.some((item) => item.pricing.withDriver.withinCity.daily !== undefined); const hasOutstation = options.some((item) => item.pricing.withDriver.outsideCity.daily !== undefined); return <article key={card.key} className="group rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#5BAE4A] hover:shadow-lg sm:p-6"><div className="relative h-56 sm:h-64"><Image src={first.imageURL} alt={`${card.label} available with driver in Lahore`} fill unoptimized sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 640px" className="object-contain transition duration-300 group-hover:scale-[1.03]"/></div><div className="mt-5 flex flex-wrap gap-2 text-xs font-bold text-slate-700"><span className="rounded-full bg-green-50 px-3 py-1.5 text-green-800">Driver included</span>{hasWithinCity && <span className="rounded-full bg-slate-100 px-3 py-1.5">Within Lahore</span>}{hasOutstation && <span className="rounded-full bg-slate-100 px-3 py-1.5">Outstation</span>}</div><h3 className="mt-4 text-2xl font-black text-[#0F2B46]"><Link href={normalRentalModelHref(first)} className="rounded-sm underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5BAE4A]">{card.label}</Link></h3>{first.modelYearLabel && <p className="mt-1 text-sm font-semibold text-slate-600">Model year: {first.modelYearLabel}</p>}<p className="mt-3 text-lg font-black text-[#5BAE4A]">From PKR {minimum.toLocaleString("en-PK")} <span className="text-sm font-semibold text-slate-500">/ day</span></p><button type="button" aria-haspopup="dialog" onClick={() => shouldOpenInventoryComparison(card) ? setModelOptions(options) : setSelected(first)} className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-[#0F2B46] px-5 py-3 text-sm font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5BAE4A] focus-visible:ring-offset-2">View Rates &amp; Book →</button></article>; })}</div>
    {modelOptions && !selected && <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"><div role="dialog" aria-modal="true" aria-labelledby="lahore-options-title" className="max-h-[90dvh] w-full max-w-3xl overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:max-h-[85vh] sm:rounded-2xl sm:p-6"><button type="button" aria-label="Close vehicle options" onClick={() => setModelOptions(undefined)} className="float-right rounded-lg p-2 font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5BAE4A]">✕</button><h2 id="lahore-options-title" className="text-2xl font-black text-[#0F2B46]">{modelOptions[0].modelName}</h2><p className="mt-2 text-sm text-slate-600">Compare the available package prices, then choose the option that suits your trip.</p><div className="mt-5 space-y-3">{modelOptions.map((option) => <button key={option.inventoryId} type="button" onClick={() => setSelected(option)} className="w-full rounded-xl border p-4 text-left hover:border-[#5BAE4A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5BAE4A]"><p className="font-bold">{normalRentalPublicLabel(option)}</p><div className="mt-2 grid gap-2 text-sm sm:grid-cols-2"><p>Within Lahore: PKR {option.pricing.withDriver.withinCity.daily?.toLocaleString("en-PK")}</p><p>Outstation: PKR {option.pricing.withDriver.outsideCity.daily?.toLocaleString("en-PK")}</p></div></button>)}</div></div></div>}
    {selected && <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-0 sm:p-4"><div role="dialog" aria-modal="true" aria-labelledby="lahore-booking-title" className="mx-auto mt-8 min-h-[calc(100dvh-2rem)] max-w-2xl rounded-t-3xl bg-white p-5 shadow-2xl sm:my-6 sm:min-h-0 sm:rounded-2xl sm:p-6"><button type="button" aria-label="Close booking form" onClick={() => { setDateOpen(false); setTimeOpen(false); setSelected(undefined); setCreated(undefined); }} className="float-right rounded-lg p-2 font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5BAE4A]">✕</button><p className="text-xs font-bold uppercase tracking-wider text-[#5BAE4A]">{context.cityLabel} · With Driver</p><h2 id="lahore-booking-title" className="mt-2 text-2xl font-black text-[#0F2B46]">{selectedDisplayName}</h2>{!prelaunch && <p className="mt-1 text-sm text-slate-600">{selected.vendorName}</p>}
      <div className="mt-5 grid grid-cols-2 gap-3" aria-label="Rental package"><button type="button" aria-pressed={packageType === "withinCity"} onClick={() => setPackageType("withinCity")} className={`rounded-lg border p-3 font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5BAE4A] ${packageType === "withinCity" ? "bg-[#0F2B46] text-white" : ""}`}>Within City</button><button type="button" aria-pressed={packageType === "outsideCity"} onClick={() => setPackageType("outsideCity")} className={`rounded-lg border p-3 font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5BAE4A] ${packageType === "outsideCity" ? "bg-[#0F2B46] text-white" : ""}`}>Outstation</button></div>
      <label className="mt-4 block text-sm font-semibold">Rental duration<select value={duration} onChange={(event) => setDuration(event.target.value as Duration)} className={input}>{(["daily", "weekly", "monthly"] as const).filter((item) => selected.pricing.withDriver[packageType][item] !== undefined).map((item) => <option key={item}>{item}</option>)}</select></label><div className="mt-3 rounded-xl bg-green-50 px-4 py-3"><p className="text-xs font-bold uppercase tracking-wide text-green-800">Selected package rate</p><p className="mt-1 text-xl font-black text-[#5BAE4A]">{currentRate ? `PKR ${currentRate.toLocaleString("en-PK")}` : "Rate unavailable"}</p></div>
      {created ? <div className={`mt-6 rounded-xl border p-5 ${created.integrationWarnings?.length ? "border-amber-300 bg-amber-50" : "border-green-200 bg-green-50"}`}><p className="font-bold text-slate-900">{prelaunch ? "Booking request created" : "Test lead created"}: {created.leadId}</p>{created.integrationWarnings?.length ? <><p className="mt-2 font-bold text-amber-900">Lead {created.leadId} was created, but {created.integrationWarnings.join(" and ")}. Do not resubmit.</p><p className="mt-1 text-sm text-amber-800">Check the server logs and the affected integration using this lead ID.</p></> : <p className="mt-1 text-sm text-green-800">Email and Sheets notifications completed; final confirmation continues in WhatsApp.</p>}</div> : <form action={submit} className="mt-6 space-y-3"><div className="grid gap-3 sm:grid-cols-2">
        <div className="min-w-0"><label className="mb-1 block text-sm font-semibold text-slate-700">Pickup date</label><DatePicker selected={pickupDate} onChange={(date: Date | null) => { if (!date) return; setPickupDate(date); setDateOpen(false); requestAnimationFrame(() => dateTrigger.current?.focus()); }} open={dateOpen} onInputClick={() => { setTimeOpen(false); setDateOpen(true); }} onClickOutside={() => setDateOpen(false)} onCalendarClose={() => dateTrigger.current?.focus()} minDate={initial.date} dateFormat="dd MMM yyyy" shouldCloseOnSelect popperPlacement="bottom-start" calendarClassName={styles.calendar} popperClassName={styles.popper} customInput={<PickerButton ref={dateTrigger} label="Choose pickup date"/>}/><input type="hidden" name="pickupDate" value={formatStoredDate(pickupDate)}/></div>
        <div ref={timeContainer} className="relative min-w-0"><label className="mb-1 block text-sm font-semibold text-slate-700">Pickup time</label><button ref={timeTrigger} type="button" aria-haspopup="listbox" aria-expanded={timeOpen} onClick={() => { setDateOpen(false); setTimeOpen((open) => !open); }} className={`${input} min-h-10 text-left`}>{TIME_OPTIONS.find((option) => option.value === preferredTime)?.label}</button><input type="hidden" name="preferredTime" value={preferredTime}/>{timeOpen && <div role="listbox" aria-label="Pickup time options" className="absolute left-0 right-0 z-[70] mt-1 max-h-60 overflow-y-auto rounded-lg border border-slate-200 bg-white p-1 shadow-xl">{TIME_OPTIONS.map((option) => <button key={option.value} type="button" role="option" aria-selected={preferredTime === option.value} onClick={() => { setPreferredTime(option.value); setTimeOpen(false); requestAnimationFrame(() => timeTrigger.current?.focus()); }} className={`block w-full rounded-md px-3 py-2 text-left text-sm hover:bg-slate-100 focus:bg-slate-100 focus:outline-none ${preferredTime === option.value ? "font-bold text-[#0F2B46]" : "text-slate-700"}`}>{option.label}{preferredTime === option.value ? " — selected" : ""}</button>)}</div>}</div>
      </div>
      <label className="block text-sm font-semibold text-slate-700">Pickup location<PlaceInput id="lahore-preview-pickup" value={pickupAddress} place={pickupPlace} placeholder="Search pickup location" selectionRequired onTextChange={(address) => { setPickupAddress(address); setPickupPlace(undefined); }} onSelect={(place) => { setPickupAddress(place.formattedAddress); setPickupPlace(place); setError(""); }}/></label>
      {packageType === "outsideCity" && <label className="block text-sm font-semibold text-slate-700">Destination<PlaceInput id="lahore-preview-destination" value={destinationAddress} place={destinationPlace} placeholder="Search destination" selectionRequired onTextChange={(address) => { setDestinationAddress(address); setDestinationPlace(undefined); }} onSelect={(place) => { setDestinationAddress(place.formattedAddress); setDestinationPlace(place); setError(""); }}/></label>}
      <div className="grid gap-3 sm:grid-cols-2"><label className="text-sm font-semibold text-slate-700">Number of days<input className={input} required name="numberOfDays" type="number" min="1" max="30" defaultValue="1"/></label><label className="text-sm font-semibold text-slate-700">Customer name<input className={input} required name="customerName" autoComplete="name"/></label></div>
      <div className="grid gap-3 sm:grid-cols-2"><label className="text-sm font-semibold text-slate-700">Phone / WhatsApp<input className={input} required name="phone" inputMode="tel" autoComplete="tel"/></label><label className="text-sm font-semibold text-slate-700">Email <span className="font-normal text-slate-500">(optional)</span><input className={input} name="email" type="email" autoComplete="email"/></label></div>
      {error && <p ref={errorRef} tabIndex={-1} role="alert" className="text-sm font-semibold text-red-700">{error}</p>}<button disabled={loading || !currentRate} className="w-full rounded-lg bg-[#5BAE4A] py-3 font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5BAE4A] focus-visible:ring-offset-2 disabled:opacity-50">{loading ? (prelaunch ? "Creating booking request…" : "Creating private test lead…") : (prelaunch ? "Request Lahore Booking" : "Submit Private Lahore Test")}</button></form>}
    </div></div>}
  </></GooglePlacesProvider>;
}
