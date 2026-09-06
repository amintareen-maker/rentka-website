"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import {
  addDoc,
  collection,
  doc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import DatePicker from "react-datepicker";
import {
  Autocomplete,
  useJsApiLoader,
} from "@react-google-maps/api";
import {
  Calendar,
  Clock3,
  MapPin,
  Phone,
  User,
  Users,
  MessageSquare,
  X,
} from "lucide-react";
import { db } from "@/lib/firebase";
import {
  trackDataLayer,
  trackGoogleAdsLead,
  trackMetaPixel,
  trackWhatsAppClick,
} from "@/lib/tracking";
import { requestAutomaticDispatchIntake } from "@/lib/dispatch/automatic-intake-client";

const GOOGLE_LIBRARIES: "places"[] = ["places"];

const SHEETS_WEBHOOK =
  "https://script.google.com/macros/s/AKfycbyYVkemVM2O_pIPwYCLyqMCMIsDoLRLfzYsEGE__OrLjH6_lCRZCHim7R-3s_pn6JOQ9w/exec";

type Props = {
  open: boolean;
  onClose: () => void;

  route: {
    from: string;
    to: string;
    slug: string;
  };

  vehicle: string;

  price: number | null;

  tripType: "one-way" | "round-trip";
};

export default function IntercityBookingModal({
  open,
  onClose,
  route,
  vehicle,
  price,
  tripType,
}: Props) {
  
  const [name, setName] = useState("");

  const [phone, setPhone] = useState("");

  const [travelDate, setTravelDate] =
  useState<Date | null>(null);

  const [pickupTime, setPickupTime] = useState("");

  const [pickupAddress, setPickupAddress] =
    useState("");

  const [dropAddress, setDropAddress] =
    useState("");
  
    const [pickupLat, setPickupLat] =
  useState<number | null>(null);

const [pickupLng, setPickupLng] =
  useState<number | null>(null);

const [pickupPlaceId, setPickupPlaceId] =
  useState("");

const [dropLat, setDropLat] =
  useState<number | null>(null);

const [dropLng, setDropLng] =
  useState<number | null>(null);

const [dropPlaceId, setDropPlaceId] =
  useState("");

  const pickupAutocomplete = useRef<google.maps.places.Autocomplete | null>(null);

  const dropAutocomplete = useRef<google.maps.places.Autocomplete | null>(null);

  const [passengers, setPassengers] =
    useState("1-2");

   const { isLoaded, loadError } = useJsApiLoader({
  id: "google-map-script",
  googleMapsApiKey:
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  libraries: GOOGLE_LIBRARIES,
});

  const [notes, setNotes] = useState("");

  const [loading, setLoading] =
    useState(false);
  const submissionInProgress = useRef(false);

  const [error, setError] =
    useState<string | null>(null);

  const formattedPrice = useMemo(() => {
    if (price === null) return "Custom Quote";

    return `PKR ${price.toLocaleString()}`;
  }, [price]);

  const modalRef = useRef<HTMLDivElement>(null);
  const [readyWhatsApp, setReadyWhatsApp] = useState("");
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    modalRef.current?.focus({ preventScroll: true });
    return () => { document.body.style.overflow = overflow; previous?.focus(); };
  }, [open, isLoaded]);

  function showFieldError(message: string, label: string) {
    setError(message);
    const field = modalRef.current?.querySelector<HTMLElement>(label === "Travel Date" ? "#intercity-date" : `[aria-label="${label}"]`);
    field?.focus({ preventScroll: true });
    field?.scrollIntoView({ block: "center", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  }

  function validateForm() {
    if (!name.trim()) {
      showFieldError("Please enter your name.", "Full Name");
      return false;
    }

    if (!phone.trim()) {
      showFieldError("Please enter your phone number.", "Phone Number");
      return false;
    }

    if (!travelDate) {
      showFieldError("Please select travel date.", "Travel Date");
      return false;
    }

    if (!pickupTime) {
      showFieldError("Please select pickup time.", "Pickup Time");
      return false;
    }

    if (!pickupAddress.trim()) {
      showFieldError("Please enter pickup location.", "Pickup Address");
      return false;
    }

    if (!dropAddress.trim()) {
      showFieldError("Please enter drop-off location.", "Drop-off Address");
      return false;
    }

    setError(null);

    return true;
  }

  async function handleContinue() {
    if (readyWhatsApp) { window.open(readyWhatsApp, "_blank", "noopener,noreferrer"); return; }
    if (submissionInProgress.current) return;
    if (!validateForm()) return;

    submissionInProgress.current = true;
    setLoading(true);
    const whatsappTab = window.open("", "_blank");

    try {
      const formattedTravelDate = travelDate!.toLocaleDateString("en-GB");
      const pickupMapLink =
        pickupLat !== null && pickupLng !== null
          ? `https://maps.google.com/?q=${pickupLat},${pickupLng}`
          : "";
      const dropMapLink =
        dropLat !== null && dropLng !== null
          ? `https://maps.google.com/?q=${dropLat},${dropLng}`
          : "";

      const message = `
Hi RentKA,

I'd like to book an intercity journey.

━━━━━━━━━━━━━━

Route:
${route.from} → ${route.to}

Trip Type:
${tripType === "one-way" ? "One Way" : "Round Trip"}

Vehicle:
${vehicle}

Estimated Price:
${formattedPrice}

━━━━━━━━━━━━━━

Customer Details

Name:
${name}

Phone:
${phone}

Passengers:
${passengers}

━━━━━━━━━━━━━━

Travel Details

Travel Date:
${formattedTravelDate}

Pickup Time:
${pickupTime}

Pickup Address:
${pickupAddress}

Pickup Google Maps:
${pickupMapLink || "Not available"}

Drop-off Address:
${dropAddress}

Drop-off Google Maps:
${dropMapLink || "Not available"}

━━━━━━━━━━━━━━

Special Instructions

${notes.trim() || "None"}

━━━━━━━━━━━━━━

Please confirm availability.

Thank you.
`;

      const whatsappUrl = `https://wa.me/923020589999?text=${encodeURIComponent(
        message
      )}`;

      const bookingPayload = {
        tripType,
        route: {
          from: route.from,
          to: route.to,
          slug: route.slug || "",
        },
        vehicle,
        price,
        name: name.trim(),
        phone: phone.trim(),
        passengers,
        travelDate: formattedTravelDate,
        pickupTime,
        pickupAddress: pickupAddress.trim(),
        pickupLat,
        pickupLng,
        pickupPlaceId,
        pickupMapLink,
        dropAddress: dropAddress.trim(),
        dropLat,
        dropLng,
        dropPlaceId,
        dropMapLink,
        notes: notes.trim(),
      };

      const counterRef = doc(db, "meta", "counters");
      const leadNumber = await runTransaction(db, async (transaction) => {
        const counterDocument = await transaction.get(counterRef);
        if (!counterDocument.exists()) {
          throw new Error("Counter document does not exist!");
        }

        const next = (counterDocument.data().leadCounter || 0) + 1;
        transaction.update(counterRef, { leadCounter: next });
        return next;
      });

      const leadId = `RK-OWD-${leadNumber}`;
      const travelDateValue = travelDate!.toISOString();
      const value = typeof price === "number" && price > 0 ? price : 1;

      const sourceDocument = await addDoc(collection(db, "leads"), {
        leadId,
        name: name.trim(),
        phone: phone.trim(),
        pickupCity: route.from,
        destinationCity: route.to,
        routeSlug: route.slug || null,
        pickupAddress: pickupAddress.trim(),
        pickupLat,
        pickupLng,
        pickupPlaceId: pickupPlaceId || null,
        dropAddress: dropAddress.trim(),
        dropLat,
        dropLng,
        dropPlaceId: dropPlaceId || null,
        travelDate: travelDateValue,
        travelTime: pickupTime,
        passengers,
        vehicle,
        quotedPrice: price,
        tripType,
        notes: notes.trim() || null,
        source: "one_way_drop",
        status: "new",
        createdAt: serverTimestamp(),
      });

      await requestAutomaticDispatchIntake({
        sourceType: "one_way_drop",
        sourceDocumentId: sourceDocument.id,
        bookingId: leadId,
      });

      const trackingPayload = {
        lead_id: leadId,
        car: vehicle,
        car_name: vehicle,
        car_id: null,
        city: route.from,
        pickup_city: route.from,
        destination_city: route.to,
        route_slug: route.slug || null,
        service: tripType,
        vendor: null,
        pricing_type: "intercity",
        duration: tripType,
        price: value,
        value,
        currency: "PKR",
        source: "one_way_drop",
      };

      trackDataLayer("lead_submit", trackingPayload);
      trackDataLayer("generate_lead", trackingPayload);
      trackGoogleAdsLead(trackingPayload);
      trackMetaPixel("Lead", trackingPayload);
      trackWhatsAppClick("one_way_drop");

      // The record and tracking are complete; open WhatsApp before waiting for email.
      const completeWhatsAppUrl = `${whatsappUrl}${encodeURIComponent("\nBooking ID: " + leadId)}`;
      setReadyWhatsApp(completeWhatsAppUrl);
      if (whatsappTab && !whatsappTab.closed) whatsappTab.location.href = completeWhatsAppUrl;

      let emailSent = false;

      try {
        const emailResponse = await fetch("/api/intercity-booking", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(bookingPayload),
        });

        emailSent = emailResponse.ok;

        if (!emailResponse.ok) {
          console.error("Intercity booking email notification was not accepted.");
        }
      } catch (emailError) {
        console.error("Intercity booking email request failed:", emailError);
      }


      const formData = new URLSearchParams({
        leadId,
        name: name.trim(),
        phone: phone.trim(),
        city: route.from,
        destinationCity: route.to,
        routeSlug: route.slug || "",
        pickupAddress: pickupAddress.trim(),
        dropAddress: dropAddress.trim(),
        pickupDate: travelDateValue,
        preferredTime: pickupTime,
        passengers,
        carName: vehicle,
        packagePrice: price === null ? "" : String(price),
        notes: notes.trim(),
        source: "one_way_drop",
        status: "new",
      });

      void fetch(`${SHEETS_WEBHOOK}?${formData.toString()}`, {
        method: "POST",
        keepalive: true,
      }).catch((sheetError) => {
        console.error("Google Sheets lead sync failed:", sheetError);
      });

      // If popups were blocked or closed, navigate only after notifications
      // have been started so the booking integrations remain intact.
      if (!whatsappTab || whatsappTab.closed) window.location.href = completeWhatsAppUrl;

      if (!emailSent) console.error("Booking saved; email notification unavailable.");

    } catch (err) {
      console.error(err);

      if (whatsappTab && !whatsappTab.closed) {
        whatsappTab.close();
      }

      setError(
        "Unable to continue. Please try again."
      );
    } finally {
      submissionInProgress.current = false;
      setLoading(false);
    }
  }

  

    if (!open) return null;
    if (loadError) {
  return (
    <div className="p-4 text-red-600">
      Unable to load Google Maps.
    </div>
  );
}

if (!isLoaded) {
  return null;
}

  return (
    <>

      {/* Backdrop */}

      <div
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
      />

      {/* Modal */}

      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">

        <div
  className="relative flex max-h-[calc(100dvh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
  ref={modalRef}
  role="dialog"
  tabIndex={-1}
  onKeyDown={(event) => {
    if (event.key === "Escape") { onClose(); return; }
    if (event.key !== "Tab") return;
    const controls = modalRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input, select, textarea, a[href]');
    if (!controls?.length) return;
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && (document.activeElement === first || document.activeElement === modalRef.current)) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }}
  aria-modal="true"
  aria-labelledby="intercity-booking-title"
>

          {/* Header */}

          <div className="bg-gradient-to-r from-[#0F2B46] to-[#163C5F] shrink-0 p-4 md:p-8 text-white">

            <button
              onClick={onClose}
              aria-label="Close booking"
              className="absolute right-6 top-6 rounded-full bg-white/10 p-2 transition hover:bg-white/20"
            >
              <X size={22} />
            </button>

            <span className="rounded-full bg-[#5BAE4A] px-4 py-2 text-sm font-semibold">
              Intercity Booking
            </span>

            <h2 id="intercity-booking-title" className="mt-3 pr-8 text-2xl md:text-3xl font-bold">

              Complete Your Booking

            </h2>

            <p className="mt-3 text-slate-200">

              {route.from} → {route.to}

            </p>

          </div>

          {/* Body */}

          <div
  className="min-h-0 overflow-y-auto overscroll-contain p-4 md:p-8"
>
                      {/* Trip Type */}

            
            {/* Summary */}

            <div className="rounded-2xl border bg-slate-50 p-4">

              <div className="flex items-center justify-between">

                <div>

                  <p className="text-sm text-slate-500">
                    Route
                  </p>

                  <h3 className="mt-1 text-xl font-bold text-[#0F2B46]">
                    {route.from} → {route.to}
                  </h3>

                </div>

                <div className="text-right">

                  <p className="text-sm text-slate-500">
                    Estimated Price
                  </p>

                  <h3 className="mt-1 text-3xl font-bold text-[#5BAE4A]">
                    {formattedPrice}
                  </h3>

                </div>

              </div>

              <div className="mt-3 grid gap-1 text-sm text-slate-600 md:grid-cols-3">

                <div>✅ Driver Included</div>

                <div>✅ Fuel Included</div>

                <div>✅ Instant WhatsApp Confirmation</div>

              </div>

            </div>

            {/* Customer Details */}

            <div className="mt-4 grid gap-4 md:grid-cols-2">

              <div>

                <label className="mb-2 flex items-center gap-2 text-sm font-medium">

                  <User size={16} />

                  Full Name *

                </label>

                <input
                  disabled={Boolean(readyWhatsApp)}
                  aria-label="Full Name" autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border p-4 outline-none focus:border-[#5BAE4A]"
                  placeholder="Enter your full name"
                />

              </div>

              <div>

                <label className="mb-2 flex items-center gap-2 text-sm font-medium">

                  <Phone size={16} />

                  Phone Number *

                </label>

                <input
                  disabled={Boolean(readyWhatsApp)}
                  aria-label="Phone Number" type="tel" inputMode="tel" autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl border p-4 outline-none focus:border-[#5BAE4A]"
                  placeholder="03XXXXXXXXX"
                />

              </div>

            </div>

            {/* Date & Time */}

            <div className="mt-6 grid gap-6 md:grid-cols-2">

              <div>

                <label className="mb-2 flex items-center gap-2 text-sm font-medium">

                  <Calendar size={16} /><span id="intercity-date-label" className="sr-only">Travel Date</span>

                  Travel Date *

                </label>

                <DatePicker
                disabled={Boolean(readyWhatsApp)}
                ariaLabelledBy="intercity-date-label" id="intercity-date"
                  selected={travelDate}
                onChange={(date: Date | null) =>
                    setTravelDate(date)
                }
                minDate={new Date()}
                dateFormat="dd/MM/yyyy"
                placeholderText="Select travel date"
                className="w-full rounded-xl border p-4 outline-none focus:border-[#5BAE4A]"
                />

              </div>

              <div>

                <label className="mb-2 flex items-center gap-2 text-sm font-medium">

                  <Clock3 size={16} />

                  Pickup Time *

                </label>

                <select
                  disabled={Boolean(readyWhatsApp)}
  aria-label="Pickup Time"
                  value={pickupTime}
  onChange={(e) => setPickupTime(e.target.value)}
  className="w-full rounded-xl border p-4 outline-none focus:border-[#5BAE4A]"
>
  <option value="">Select pickup time</option>

  <option>08:00 AM</option>
  <option>08:30 AM</option>

  <option>09:00 AM</option>
  <option>09:30 AM</option>

  <option>10:00 AM</option>
  <option>10:30 AM</option>

  <option>11:00 AM</option>
  <option>11:30 AM</option>

  <option>12:00 PM</option>
  <option>12:30 PM</option>

  <option>01:00 PM</option>
  <option>01:30 PM</option>

  <option>02:00 PM</option>
  <option>02:30 PM</option>

  <option>03:00 PM</option>
  <option>03:30 PM</option>

  <option>04:00 PM</option>
  <option>04:30 PM</option>

  <option>05:00 PM</option>
  <option>05:30 PM</option>

  <option>06:00 PM</option>
  <option>06:30 PM</option>

  <option>07:00 PM</option>
  <option>07:30 PM</option>

  <option>08:00 PM</option>
  <option>08:30 PM</option>

  <option>09:00 PM</option>
  <option>09:30 PM</option>

  <option>10:00 PM</option>
  <option>10:30 PM</option>

  <option>11:00 PM</option>
  <option>11:30 PM</option>
</select>

              </div>

            </div>

            {/* Addresses */}

            <div className="mt-6">

  <label className="mb-2 flex items-center gap-2 text-sm font-medium">
    <MapPin size={16} />
    Pickup Address *
  </label>

  <Autocomplete
    onLoad={(autocomplete) => {
      pickupAutocomplete.current = autocomplete;
    }}
    onPlaceChanged={() => {
const place =
  pickupAutocomplete.current?.getPlace();

if (!place) return;

if (place.formatted_address) {
  setPickupAddress(place.formatted_address);
}

if (place.place_id) {
  setPickupPlaceId(place.place_id);
}

if (place.geometry?.location) {
  setPickupLat(place.geometry.location.lat());
  setPickupLng(place.geometry.location.lng());
}
}}
  >
    <input
                  disabled={Boolean(readyWhatsApp)}
      aria-label="Pickup Address"
                  value={pickupAddress}
      onChange={(e) =>
        setPickupAddress(e.target.value)
      }
      placeholder="Search pickup location..."
      className="w-full rounded-xl border p-4 outline-none focus:border-[#5BAE4A]"
    />
  </Autocomplete>


</div>
          <div className="mt-6">

<label className="mb-2 flex items-center gap-2 text-sm font-medium">
  <MapPin size={16} />
  Drop-off Address *
</label>

<Autocomplete
  onLoad={(autocomplete) => {
    dropAutocomplete.current = autocomplete;
    }}
    onPlaceChanged={() => {
      const place =
        dropAutocomplete.current?.getPlace();

      if (!place) return;

      if (place.formatted_address) {
        setDropAddress(place.formatted_address);
      }

      if (place.place_id) {
        setDropPlaceId(place.place_id);
      }

      if (place.geometry?.location) {
        setDropLat(place.geometry.location.lat());
        setDropLng(place.geometry.location.lng());
      }
    }}
  >
    <input
                  disabled={Boolean(readyWhatsApp)}
      aria-label="Drop-off Address"
                  value={dropAddress}
      onChange={(e) =>
        setDropAddress(e.target.value)
      }
      placeholder="Search destination..."
      className="w-full rounded-xl border p-4 outline-none focus:border-[#5BAE4A]"
    />
  </Autocomplete>
  

</div>

            {/* Passengers */}

            <div className="mt-6">

              <label className="mb-2 flex items-center gap-2 text-sm font-medium">

                <Users size={16} />

                Passengers

              </label>

              <select
                  disabled={Boolean(readyWhatsApp)}
                value={passengers}
                onChange={(e) =>
                  setPassengers(e.target.value)
                }
                className="w-full rounded-xl border p-4 outline-none focus:border-[#5BAE4A]"
              >
                <option value="1-2">1–2 Passengers</option>

                <option value="3-4">3–4 Passengers</option>

                <option value="5-7">5–7 Passengers</option>

                <option value="8+">8+ Passengers</option>

              </select>

            </div>

            {/* Notes */}

            <div className="mt-6">

              <label className="mb-2 flex items-center gap-2 text-sm font-medium">

                <MessageSquare size={16} />

                Special Instructions

              </label>

              <textarea
                disabled={Boolean(readyWhatsApp)}
                rows={5}
                value={notes}
                onChange={(e) =>
                  setNotes(e.target.value)
                }
                className="w-full rounded-xl border p-4 outline-none focus:border-[#5BAE4A]"
                placeholder={`Example:

• Airport pickup
• 2 Suitcases
• Child travelling
• Extra stop`}
              />

            </div>
                        {/* Error */}

            {/* Footer */}

            <div className="sticky bottom-0 mt-4 border-t bg-white pt-3 pb-2">            {error && (
              <div role="alert" className="mb-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
                {error}
              </div>
            )}


              {readyWhatsApp && <button type="button" onClick={()=>setReadyWhatsApp("")} className="mb-2 w-full text-sm font-semibold underline">Edit details for a new booking request</button>}
              {readyWhatsApp && <a href={readyWhatsApp} target="_blank" rel="noreferrer" className="mb-3 block rounded-xl bg-green-100 p-3 text-center font-bold text-green-900">Booking saved — Open WhatsApp</a>}

              <button
                type="button"
                onClick={handleContinue}
                disabled={loading}
                className="flex w-full items-center justify-center gap-3 rounded-2xl bg-[#5BAE4A] px-8 py-4 text-lg font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <svg
                      className="h-5 w-5 animate-spin"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-20"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />

                      <path
                        className="opacity-90"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      />
                    </svg>

                    Preparing WhatsApp...
                  </>
                ) : (
                  <>
                    <MessageSquare size={20} />

                    {readyWhatsApp ? "Open WhatsApp again" : "Continue to WhatsApp"}
                  </>
                )}
              </button>

              <p className="mt-2 text-center text-xs text-slate-400">
                Your booking will be confirmed by the RentKA team on
                WhatsApp after availability is verified.
              </p>

              <p className="mt-4 text-center text-sm text-slate-500">
                20% advance payment may be required to reserve the car.
              </p>

            </div>

          </div>

        </div>

      </div>

    </>
  );
}
