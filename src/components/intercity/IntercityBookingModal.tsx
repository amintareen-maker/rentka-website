"use client";

import { useMemo, useState, useRef } from "react";
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
  Car,
  MessageSquare,
  X,
} from "lucide-react";

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

  const pickupAutocomplete = useRef<any>(null);

  const dropAutocomplete = useRef<any>(null);

  const [passengers, setPassengers] =
    useState("1-2");

   const { isLoaded, loadError } = useJsApiLoader({
  id: "google-map-script",
  googleMapsApiKey:
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  libraries: ["places"],
});

  const [notes, setNotes] = useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const formattedPrice = useMemo(() => {
    if (price === null) return "Custom Quote";

    return `PKR ${price.toLocaleString()}`;
  }, [price]);

  function validateForm() {
    if (!name.trim()) {
      setError("Please enter your name.");
      return false;
    }

    if (!phone.trim()) {
      setError("Please enter your phone number.");
      return false;
    }

    if (!travelDate) {
      setError("Please select travel date.");
      return false;
    }

    if (!pickupTime) {
      setError("Please select pickup time.");
      return false;
    }

    if (!pickupAddress.trim()) {
      setError("Please enter pickup location.");
      return false;
    }

    if (!dropAddress.trim()) {
      setError("Please enter drop-off location.");
      return false;
    }

    setError(null);

    return true;
  }

  async function handleContinue() {
    if (!validateForm()) return;

    setLoading(true);
        try {
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
${
  travelDate
    ? travelDate.toLocaleDateString("en-GB")
    : ""
}

Pickup Time:
${pickupTime}

Pickup Address:
${pickupAddress}

Pickup Google Maps:
${
  pickupLat && pickupLng
    ? `https://maps.google.com/?q=${pickupLat},${pickupLng}`
    : "Not available"
}

Drop-off Address:
${dropAddress}

Drop-off Google Maps:
${
  dropLat && dropLng
    ? `https://maps.google.com/?q=${dropLat},${dropLng}`
    : "Not available"
}

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

      /*
      =========================================

      FUTURE INTEGRATIONS

      1. Firebase Lead
      2. Google Sheets
      3. GTM Events
      4. GA4
      5. Meta Pixel
      6. Email Notification

      We'll add these after the UI is finalized.

      =========================================
      */

      window.open(whatsappUrl, "_blank");

      onClose();

      setName("");
      setPhone("");
      setTravelDate(null);
      setPickupTime("");
      setPickupAddress("");
      setDropAddress("");
      setPassengers("1-2");
      setNotes("");
      setError(null);
    } catch (err) {
      console.error(err);

      setError(
        "Unable to continue. Please try again."
      );
    } finally {
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
  className="relative w-full max-w-2xl rounded-3xl bg-white shadow-2xl"
  onMouseDown={(e) => {
    const active = document.activeElement as HTMLElement | null;

    if (
      active &&
      (active instanceof HTMLInputElement ||
        active instanceof HTMLTextAreaElement ||
        active instanceof HTMLSelectElement)
    ) {
      active.blur();
    }
  }}
>

          {/* Header */}

          <div className="bg-gradient-to-r from-[#0F2B46] to-[#163C5F] p-8 text-white">

            <button
              onClick={onClose}
              className="absolute right-6 top-6 rounded-full bg-white/10 p-2 transition hover:bg-white/20"
            >
              <X size={22} />
            </button>

            <span className="rounded-full bg-[#5BAE4A] px-4 py-2 text-sm font-semibold">
              Intercity Booking
            </span>

            <h2 className="mt-6 text-3xl font-bold">

              Complete Your Booking

            </h2>

            <p className="mt-3 text-slate-200">

              {route.from} → {route.to}

            </p>

          </div>

          {/* Body */}

          <div
  className="max-h-[75vh] overflow-y-auto p-8"
  onScroll={() => {
    const active = document.activeElement as HTMLElement | null;
    active?.blur();
  }}
>
                      {/* Trip Type */}

            
            {/* Summary */}

            <div className="mt-8 rounded-2xl border bg-slate-50 p-6">

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

              <div className="mt-5 grid gap-3 text-sm text-slate-600 md:grid-cols-3">

                <div>✅ Driver Included</div>

                <div>✅ Fuel Included</div>

                <div>✅ Instant WhatsApp Confirmation</div>

              </div>

            </div>

            {/* Customer Details */}

            <div className="mt-8 grid gap-6 md:grid-cols-2">

              <div>

                <label className="mb-2 flex items-center gap-2 text-sm font-medium">

                  <User size={16} />

                  Full Name *

                </label>

                <input
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

                  <Calendar size={16} />

                  Travel Date *

                </label>

                <DatePicker
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

            {error && (
              <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
                {error}
              </div>
            )}

            {/* Footer */}

            <div className="mt-8 border-t pt-8">

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

                    Continue to WhatsApp
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