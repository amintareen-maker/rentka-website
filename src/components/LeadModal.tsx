"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Autocomplete, useJsApiLoader } from "@react-google-maps/api";
import DatePicker from "react-datepicker";
import {
  addDoc,
  collection,
  doc,
  runTransaction,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  trackDataLayer,
  trackGoogleAdsLead,
  trackMetaPixel,
  trackWhatsAppClick,
} from "@/lib/tracking";

const WHATSAPP_NUMBER = "923020589999";
const GOOGLE_MAP_LIBRARIES: "places"[] = ["places"];
const AUTOCOMPLETE_OPTIONS = {
  componentRestrictions: { country: "pk" },
  fields: ["formatted_address", "place_id", "geometry"],
};
const PREFERRED_TIME_OPTIONS = Array.from({ length: 48 }, (_, index) => {
  const totalMinutes = index * 30;
  const hours24 = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const period = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 || 12;

  return `${String(hours12).padStart(2, "0")}:${String(minutes).padStart(2, "0")} ${period}`;
});

type LeadContext = {
  carId?: string;
  carName?: string;
  country?: string;
  city?: string;
  service?: "selfDrive" | "withDriver";
  modelYear?: number;
  modelYearLabel?: string;
  vendorName?: string | null;
  vendorId?: string | null;
  price?: number | string | null;
  pricingType?: string | null;
  duration?: string | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  context: LeadContext;
};

function normalizeRate(price: LeadContext["price"]): number | null {
  if (typeof price === "number") {
    return Number.isFinite(price) && price > 0 ? price : null;
  }

  if (typeof price !== "string") return null;
  const normalized = Number(price.replace(/[^\d.]/g, ""));
  return Number.isFinite(normalized) && normalized > 0 ? normalized : null;
}

function isOutstationService(context: LeadContext): boolean {
  const values = [context.pricingType, context.duration, context.service]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .replace(/[\s_-]+/g, "");

  return values.includes("outsidecity") || values.includes("outstation");
}

function mapsLink(latitude: number | null, longitude: number | null): string {
  return latitude !== null && longitude !== null
    ? `https://maps.google.com/?q=${latitude},${longitude}`
    : "";
}

function formatPkr(value: number | null): string {
  return value === null ? "To be confirmed" : `PKR ${value.toLocaleString("en-PK")}`;
}

function formatDateForStorage(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseStoredDate(value: string): Date | null {
  if (!value) return null;

  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;

  return new Date(year, month - 1, day);
}

export default function LeadModal({ open, onClose, context }: Props) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [pickupAddress, setPickupAddress] = useState("");
  const [pickupLatitude, setPickupLatitude] = useState<number | null>(null);
  const [pickupLongitude, setPickupLongitude] = useState<number | null>(null);
  const [pickupPlaceId, setPickupPlaceId] = useState("");
  const [destinationAddress, setDestinationAddress] = useState("");
  const [destinationLatitude, setDestinationLatitude] = useState<number | null>(null);
  const [destinationLongitude, setDestinationLongitude] = useState<number | null>(null);
  const [destinationPlaceId, setDestinationPlaceId] = useState("");
  const [numberOfDays, setNumberOfDays] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [desktopWhatsappUrl, setDesktopWhatsappUrl] = useState<string | null>(null);
  const pickupAutocomplete = useRef<google.maps.places.Autocomplete | null>(null);
  const destinationAutocomplete = useRef<google.maps.places.Autocomplete | null>(null);
  const submissionInProgress = useRef(false);

  const { isLoaded: mapsLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: GOOGLE_MAP_LIBRARIES,
  });

  const dailyRentalRate = useMemo(() => normalizeRate(context.price), [context.price]);
  const estimatedRentalAmount = useMemo(
    () => (dailyRentalRate === null ? null : dailyRentalRate * numberOfDays),
    [dailyRentalRate, numberOfDays]
  );
  const outstation = useMemo(() => isOutstationService(context), [context]);
  const modelYearDisplay = context.modelYearLabel ?? context.modelYear ?? null;
  const serviceLabel = context.service ? "With Driver" : null;
  const dayLabel = `${numberOfDays} ${numberOfDays === 1 ? "Day" : "Days"}`;

  useEffect(() => {
    if (outstation) return;
    setDestinationAddress("");
    setDestinationLatitude(null);
    setDestinationLongitude(null);
    setDestinationPlaceId("");
  }, [outstation]);

  if (!open) return null;

  const updatePickupFromPlace = () => {
    const place = pickupAutocomplete.current?.getPlace();
    const location = place?.geometry?.location;
    setPickupAddress(place?.formatted_address || pickupAddress);
    setPickupLatitude(location?.lat() ?? null);
    setPickupLongitude(location?.lng() ?? null);
    setPickupPlaceId(place?.place_id ?? "");
  };

  const updateDestinationFromPlace = () => {
    const place = destinationAutocomplete.current?.getPlace();
    const location = place?.geometry?.location;
    setDestinationAddress(place?.formatted_address || destinationAddress);
    setDestinationLatitude(location?.lat() ?? null);
    setDestinationLongitude(location?.lng() ?? null);
    setDestinationPlaceId(place?.place_id ?? "");
  };

  const handleSubmit = async () => {
    if (submissionInProgress.current) return;
    setError(null);

    if (!pickupDate) {
      setError("Please select a pickup date.");
      return;
    }
    if (!preferredTime) {
      setError("Please select a preferred pickup time.");
      return;
    }
    if (!pickupAddress.trim()) {
      setError("Please enter a pickup location.");
      return;
    }
    if (!Number.isInteger(numberOfDays) || numberOfDays < 1 || numberOfDays > 30) {
      setError("Number of days must be between 1 and 30.");
      return;
    }
    if (dailyRentalRate === null || estimatedRentalAmount === null) {
      setError("The selected rental rate is unavailable. Please choose a valid package.");
      return;
    }
    if (outstation && !destinationAddress.trim()) {
      setError("Please enter where you are travelling to.");
      return;
    }
    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (!phone.trim()) {
      setError("Please enter your phone number.");
      return;
    }

    submissionInProgress.current = true;
    setLoading(true);
    const whatsappWindow = window.open("", "_blank");

    try {
      const cityCode = (context.city ?? "GEN").substring(0, 3).toUpperCase();
      const counterRef = doc(db, "meta", "counters");
      const newNumber = await runTransaction(db, async (transaction) => {
        const counterDoc = await transaction.get(counterRef);
        if (!counterDoc.exists()) throw new Error("Counter document does not exist!");
        const next = (counterDoc.data().leadCounter || 0) + 1;
        transaction.update(counterRef, { leadCounter: next });
        return next;
      });
      const leadId = `RK-${cityCode}-${newNumber}`;
      const submittedServiceLabel = context.service ? "With Driver" : "N/A";
      const pickupMapLink = mapsLink(pickupLatitude, pickupLongitude);
      const destinationMapLink = mapsLink(destinationLatitude, destinationLongitude);
      const destinationMessage = outstation
        ? `\nTravelling To: ${destinationAddress.trim()}\nDestination Google Maps: ${destinationMapLink || "Not available"}\n`
        : "";
      const message = `
Hi RentKA 👋

I just submitted a request on your website.

My booking reference: *${leadId}*

Car: ${context.carName ?? "N/A"}
Vendor: ${context.vendorName ?? "N/A"}
Model: ${modelYearDisplay ?? "N/A"}
City: ${context.city ?? "N/A"}
Service: ${submittedServiceLabel}
Package: ${context.pricingType ?? "N/A"} - ${context.duration ?? "N/A"}

Pickup Date: ${pickupDate}
Preferred Time: ${preferredTime}
Pickup Location: ${pickupAddress.trim()}
Pickup Google Maps: ${pickupMapLink || "Not available"}
${destinationMessage}
Number of Days: ${dayLabel}
Daily Rental: ${formatPkr(dailyRentalRate)}
Estimated Rental Amount: ${formatPkr(estimatedRentalAmount)}

Customer Name: ${name.trim()}
Phone: ${phone.trim()}
Email: ${email.trim() || "Not provided"}

Quoted rental rate excludes fuel, toll tax, parking charges and overtime.

Please confirm availability.
`;
      const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
      const reviewToken = Math.random().toString(36).substring(2, 10);

      const docRef = await addDoc(collection(db, "leads"), {
        leadId,
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || null,
        carName: context.carName ?? null,
        country: context.country ?? null,
        city: context.city ?? null,
        service: context.service ?? null,
        modelYear: modelYearDisplay,
        pickupDate,
        preferredTime,
        vendorName: context.vendorName ?? null,
        vendorId: context.vendorId ?? null,
        pricingType: context.pricingType ?? null,
        duration: context.duration ?? null,
        price: context.price ?? null,
        pickupAddress: pickupAddress.trim(),
        pickupLatitude,
        pickupLongitude,
        pickupPlaceId: pickupPlaceId || null,
        pickupMapLink: pickupMapLink || null,
        numberOfDays,
        dailyRentalRate,
        estimatedRentalAmount,
        destinationAddress: outstation ? destinationAddress.trim() : null,
        destinationLatitude: outstation ? destinationLatitude : null,
        destinationLongitude: outstation ? destinationLongitude : null,
        destinationPlaceId: outstation ? destinationPlaceId || null : null,
        destinationMapLink: outstation ? destinationMapLink || null : null,
        source: "website",
        status: "new",
        reviewSubmitted: false,
        reviewSent: false,
        reviewToken,
        createdAt: serverTimestamp(),
      });

      const reviewLink = `https://www.rentka.co/review?leadId=${docRef.id}&token=${reviewToken}`;
      const trackingPayload = {
        lead_id: leadId,
        car: context.carName ?? null,
        car_name: context.carName ?? null,
        car_id: context.carId ?? null,
        city: context.city ?? null,
        service: context.service ?? null,
        vendor: context.vendorName ?? null,
        vendor_name: context.vendorName ?? null,
        pricing_type: context.pricingType ?? null,
        duration: context.duration ?? null,
        price: dailyRentalRate,
        value: estimatedRentalAmount,
        currency: "PKR",
        source: "website",
        number_of_days: numberOfDays,
        daily_rate: dailyRentalRate,
        estimated_rental_amount: estimatedRentalAmount,
        has_pickup_location: Boolean(pickupAddress.trim()),
        is_outstation: outstation,
      };

      trackDataLayer("lead_submit", trackingPayload);
      trackDataLayer("generate_lead", trackingPayload);
      trackGoogleAdsLead(trackingPayload);
      trackMetaPixel("Lead", trackingPayload);
      trackWhatsAppClick("main_lead_form");

      if (whatsappWindow) whatsappWindow.location.href = whatsappUrl;
      else window.location.href = whatsappUrl;

      void updateDoc(docRef, { reviewLink }).catch((reviewLinkError) => {
        console.error("Firestore review link update failed:", reviewLinkError);
      });

      const emailPayload = {
        leadId,
        carName: context.carName ?? "",
        carId: context.carId ?? null,
        vendorName: context.vendorName ?? null,
        vendorId: context.vendorId ?? null,
        modelYear: modelYearDisplay,
        country: context.country ?? null,
        city: context.city ?? "",
        service: submittedServiceLabel,
        pricingType: context.pricingType ?? null,
        duration: context.duration ?? null,
        originalPrice: context.price ?? null,
        dailyRentalRate,
        numberOfDays,
        estimatedRentalAmount,
        pickupDate,
        preferredTime,
        pickupAddress: pickupAddress.trim(),
        pickupLatitude,
        pickupLongitude,
        pickupPlaceId,
        pickupMapLink,
        isOutstation: outstation,
        destinationAddress: outstation ? destinationAddress.trim() : "",
        destinationLatitude: outstation ? destinationLatitude : null,
        destinationLongitude: outstation ? destinationLongitude : null,
        destinationPlaceId: outstation ? destinationPlaceId : "",
        destinationMapLink: outstation ? destinationMapLink : "",
        customerName: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        source: "website",
        reviewLink,
      };

      void fetch("/api/lead-booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(emailPayload),
      })
        .then((response) => {
          if (!response.ok) {
            console.error("Standard booking email notification was not accepted.");
          }
        })
        .catch(() => {
          console.error("Standard booking email notification request failed.");
        });

      const sheetPayload = {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || "",
        carName: context.carName || "",
        vendorName: context.vendorName || "",
        vendorId: context.vendorId || "",
        modelYear: String(modelYearDisplay ?? ""),
        country: context.country || "",
        city: context.city || "",
        service: context.service || "",
        serviceType: context.pricingType || "",
        packageName: context.pricingType || "",
        packageDuration: context.duration || "",
        packagePrice: context.price ? String(context.price) : "",
        pickupDate,
        preferredTime,
        source: "website",
        leadId,
        status: "new",
        pickupAddress: pickupAddress.trim(),
        pickupLatitude,
        pickupLongitude,
        pickupPlaceId,
        pickupMapLink,
        numberOfDays,
        dailyRentalRate,
        estimatedRentalAmount,
        destinationAddress: outstation ? destinationAddress.trim() : "",
        destinationLatitude: outstation ? destinationLatitude : null,
        destinationLongitude: outstation ? destinationLongitude : null,
        destinationPlaceId: outstation ? destinationPlaceId : "",
        destinationMapLink: outstation ? destinationMapLink : "",
        isOutstation: outstation,
        firestoreDocumentId: docRef.id,
        reviewLink,
        submittedAt: new Date().toISOString(),
      };

      void fetch("/api/lead-sheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sheetPayload),
      })
        .then(async (response) => {
          const result = (await response.json().catch(() => null)) as { success?: boolean } | null;
          if (!response.ok || result?.success !== true) {
            console.warn("Booking lead sheet sync was not confirmed.");
          }
        })
        .catch(() => {
          console.warn("Booking lead sheet sync request failed.");
        });

      setDesktopWhatsappUrl(whatsappUrl);
      setSuccess(true);
    } catch (err) {
      console.error("Failed:", err);
      if (whatsappWindow && !whatsappWindow.closed) whatsappWindow.close();
      setError("Something went wrong. Please try again.");
    } finally {
      submissionInProgress.current = false;
      setLoading(false);
    }
  };

  const pickupInput = (
    <input
      type="text"
      placeholder="Enter pickup location"
      className="w-full rounded-xl border px-4 py-3 text-slate-700 focus:border-[#0F2B46] focus:outline-none focus:ring-2 focus:ring-[#0F2B46]/20"
      value={pickupAddress}
      onChange={(event) => {
        setPickupAddress(event.target.value);
        setPickupLatitude(null);
        setPickupLongitude(null);
        setPickupPlaceId("");
      }}
      autoComplete="off"
    />
  );

  const destinationInput = (
    <input
      type="text"
      placeholder="e.g. Murree, Lahore, Peshawar"
      className="w-full rounded-xl border px-4 py-3 text-slate-700 focus:border-[#0F2B46] focus:outline-none focus:ring-2 focus:ring-[#0F2B46]/20"
      value={destinationAddress}
      onChange={(event) => {
        setDestinationAddress(event.target.value);
        setDestinationLatitude(null);
        setDestinationLongitude(null);
        setDestinationPlaceId("");
      }}
      autoComplete="off"
    />
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 mx-4 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
        <h2 className="text-xl font-semibold text-[var(--rentka-blue)]">Complete Your Booking Request</h2>
        <p className="mb-4 text-sm font-medium text-[var(--rentka-green)]">Fill form, Submit, Chat, Confirm</p>

        {(context.carName || context.country || context.city || serviceLabel || modelYearDisplay) && (
          <div className="mb-4 space-y-1 rounded-lg border border-[var(--rentka-blue)]/20 bg-[var(--rentka-blue)]/5 p-3 text-sm">
            {context.carName && <p><strong>Car:</strong> {context.carName}</p>}
            {context.vendorName && <p><strong>Vendor:</strong> {context.vendorName}</p>}
            {modelYearDisplay && <p><strong>Model:</strong> {modelYearDisplay}</p>}
            {context.country && <p><strong>Country:</strong> {context.country}</p>}
            {context.city && <p><strong>City:</strong> {context.city}</p>}
            {serviceLabel && <p><strong>Service:</strong> {serviceLabel}</p>}
            {context.pricingType && (
              <p><strong>Package:</strong> {context.pricingType} {context.duration ? `- ${context.duration}` : ""}</p>
            )}
          </div>
        )}

        {success ? (
          <div className="space-y-5 text-center">
            <div className="text-4xl">✅</div>
            <h3 className="text-xl font-semibold text-slate-800">You&apos;re Almost Confirmed!</h3>
            <p className="text-sm text-slate-500">Final confirmation happens on WhatsApp.</p>
            {desktopWhatsappUrl && (
              <button onClick={() => window.open(desktopWhatsappUrl, "_blank")} className="w-full rounded-xl bg-[var(--rentka-green)] py-3 font-semibold text-white shadow-md hover:opacity-90">
                Confirm Instantly on WhatsApp →
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="space-y-3">
              <div className="space-y-1">
                <label htmlFor="lead-pickup-date" className="text-sm font-medium text-slate-600">Pickup Date *</label>
                <DatePicker
                  id="lead-pickup-date"
                  className="w-full rounded-xl border bg-white px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--rentka-blue)]"
                  wrapperClassName="w-full"
                  selected={parseStoredDate(pickupDate)}
                  onChange={(date: Date | null) => setPickupDate(date ? formatDateForStorage(date) : "")}
                  minDate={new Date()}
                  dateFormat="dd/MM/yyyy"
                  placeholderText="Select pickup date"
                  popperPlacement="bottom-start"
                  popperClassName="z-[100]"
                  withPortal
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="lead-preferred-time" className="text-sm font-medium text-slate-600">Preferred Time *</label>
                <select
                  id="lead-preferred-time"
                  className="w-full rounded-xl border bg-white px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--rentka-blue)]"
                  value={preferredTime}
                  onChange={(event) => setPreferredTime(event.target.value)}
                >
                  <option value="">Select preferred time</option>
                  {PREFERRED_TIME_OPTIONS.map((time) => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-600">Pickup Location *</label>
                {mapsLoaded ? (
                  <Autocomplete onLoad={(instance) => { pickupAutocomplete.current = instance; }} onPlaceChanged={updatePickupFromPlace} options={AUTOCOMPLETE_OPTIONS}>
                    {pickupInput}
                  </Autocomplete>
                ) : pickupInput}
                {pickupPlaceId && <p className="text-xs font-medium text-[#5BAE4A]">Location selected ✓</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600">Number of Days *</label>
                <div className="flex items-center justify-between rounded-xl border px-2 py-2">
                  <button type="button" aria-label="Decrease number of days" onClick={() => setNumberOfDays((days) => Math.max(1, days - 1))} disabled={numberOfDays <= 1} className="h-9 w-10 rounded-lg bg-slate-100 text-xl font-semibold text-[#0F2B46] disabled:opacity-40">−</button>
                  <span className="font-semibold text-[#0F2B46]">{dayLabel}</span>
                  <button type="button" aria-label="Increase number of days" onClick={() => setNumberOfDays((days) => Math.min(30, days + 1))} disabled={numberOfDays >= 30} className="h-9 w-10 rounded-lg bg-slate-100 text-xl font-semibold text-[#0F2B46] disabled:opacity-40">+</button>
                </div>
              </div>
              {outstation && (
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-600">Travelling To *</label>
                  {mapsLoaded ? (
                    <Autocomplete onLoad={(instance) => { destinationAutocomplete.current = instance; }} onPlaceChanged={updateDestinationFromPlace} options={AUTOCOMPLETE_OPTIONS}>
                      {destinationInput}
                    </Autocomplete>
                  ) : destinationInput}
                  {destinationPlaceId && <p className="text-xs font-medium text-[#5BAE4A]">Destination selected ✓</p>}
                </div>
              )}
              <input type="text" placeholder="Your name *" className="w-full rounded-lg border px-3 py-2" value={name} onChange={(event) => setName(event.target.value)} />
              <input type="tel" inputMode="tel" placeholder="Phone number *" className="w-full rounded-lg border px-3 py-2" value={phone} onChange={(event) => setPhone(event.target.value)} />
              <input type="email" inputMode="email" placeholder="Email (optional)" className="w-full rounded-lg border px-3 py-2" value={email} onChange={(event) => setEmail(event.target.value)} />
            </div>

            <div className="mt-4 rounded-xl border border-[#0F2B46]/15 bg-slate-50 p-4">
              <h3 className="font-semibold text-[#0F2B46]">Booking Estimate</h3>
              <dl className="mt-2 space-y-1 text-sm text-slate-600">
                <div className="flex justify-between gap-4"><dt>Daily Rental:</dt><dd className="font-medium text-slate-800">{formatPkr(dailyRentalRate)}</dd></div>
                <div className="flex justify-between gap-4"><dt>Number of Days:</dt><dd className="font-medium text-slate-800">{dayLabel}</dd></div>
                <div className="flex justify-between gap-4"><dt>{formatPkr(dailyRentalRate)} × {dayLabel}</dt><dd /></div>
                <div className="mt-2 flex justify-between gap-4 border-t pt-2"><dt className="font-semibold text-[#0F2B46]">Estimated Rental:</dt><dd className="text-lg font-bold text-[#5BAE4A]">{formatPkr(estimatedRentalAmount)}</dd></div>
              </dl>
              <p className="mt-2 text-xs leading-relaxed text-slate-500">Rental amount only. Fuel, toll tax, parking, and additional charges are not included unless explicitly stated.</p>
            </div>

            {error && <p className="mt-2 text-sm text-red-600" role="alert">{error}</p>}
            <button className="mt-5 w-full rounded-lg bg-[var(--rentka-green)] py-3 font-semibold text-white shadow-sm transition hover:opacity-90 disabled:opacity-50" disabled={loading} onClick={handleSubmit}>
              {loading ? "Submitting..." : "Check Availability Now"}
            </button>
            <p className="mt-3 text-center text-xs text-slate-500">We respond within minutes during (8 AM – 8 PM). Quick WhatsApp confirmation • No payment required now</p>
            <p className="mt-2 text-center text-xs text-slate-500">By submitting, you agree to our <a href="/terms" className="underline hover:text-[var(--rentka-blue)]" target="_blank" rel="noopener noreferrer">Terms</a> &amp; <a href="/privacy" className="underline hover:text-slate-700" target="_blank" rel="noopener noreferrer">Privacy Policy</a>.</p>
          </>
        )}
      </div>
    </div>
  );
}
