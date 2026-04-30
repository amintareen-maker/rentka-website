"use client";

import { useState } from "react";
import { addDoc, collection, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { doc, runTransaction } from "firebase/firestore";

const trackEvent = (eventName: string, data: any = {}) => {
  if (typeof window !== "undefined" && (window as any).gtag) {
    (window as any).gtag("event", eventName, data);
  }
};

/* ===============================
   🔗 GOOGLE SHEETS WEBHOOK
   =============================== */
const SHEETS_WEBHOOK =
  "https://script.google.com/macros/s/AKfycbyYVkemVM2O_pIPwYCLyqMCMIsDoLRLfzYsEGE__OrLjH6_lCRZCHim7R-3s_pn6JOQ9w/exec";

const WHATSAPP_NUMBER = "923020589999";

/* ===============================
   Types
   =============================== */
type LeadContext = {
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

export default function LeadModal({ open, onClose, context }: Props) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const [pickupDate, setPickupDate] = useState("");
  const [preferredTime, setPreferredTime] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [desktopWhatsappUrl, setDesktopWhatsappUrl] = useState<string | null>(null);

  if (!open) return null;

  /* ===============================
     Derived values
     =============================== */
  const modelYearDisplay =
    context.modelYearLabel ?? context.modelYear ?? null;

  const serviceLabel =
    context.service === "selfDrive"
      ? "Self Drive"
      : context.service === "withDriver"
      ? "With Driver"
      : null;

  /* ===============================
     🔥 GOOGLE ADS FUNCTION (FIXED)
     =============================== */
  function gtag_report_conversion() {
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "conversion", {
        send_to: "AW-18044696705/e9EwCIuvgaMcEIHxsJxD",
        value: 1.0,
        currency: "PKR",
      });
    }
  }

  /* ===============================
     Submit handler
     =============================== */
  const handleSubmit = async () => {
    setError(null);

    if (!name.trim() || !phone.trim()) {
      setError("Name and phone number are required.");
      return;
    }

    if (!pickupDate || !preferredTime) {
      setError("Please select pickup date and preferred time.");
      return;
    }

    try {
      setLoading(true);

      const cityCode = (context.city ?? "GEN").substring(0, 3).toUpperCase();
      const counterRef = doc(db, "meta", "counters");

      const newNumber = await runTransaction(db, async (transaction) => {
        const counterDoc = await transaction.get(counterRef);

        if (!counterDoc.exists()) {
          throw new Error("Counter document does not exist!");
        }

        const current = counterDoc.data().leadCounter || 0;
        const next = current + 1;

        transaction.update(counterRef, { leadCounter: next });

        return next;
      });

      const leadId = `RK-${cityCode}-${newNumber}`;
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
        modelYear: context.modelYearLabel ?? context.modelYear ?? null,
        pickupDate,
        preferredTime,
        vendorName: context.vendorName ?? null,
        vendorId: context.vendorId ?? null,
        pricingType: context.pricingType ?? null,
        duration: context.duration ?? null,
        price: context.price ?? null,
        source: "website",
        status: "new",
        reviewSubmitted: false,
        reviewSent: false,
        reviewToken,
        createdAt: serverTimestamp(),
      });

      const reviewLink = `https://rentka.co/review?leadId=${docRef.id}&token=${reviewToken}`;
      await updateDoc(docRef, { reviewLink });
      
      trackEvent("lead_submitted", {
  car_name: context.carName,
  city: context.city,
  service: context.service,
  price: context.price,
});

      const serviceLabel =
        context.service === "selfDrive"
          ? "Self Drive"
          : context.service === "withDriver"
          ? "With Driver"
          : "N/A";

      const message = `
Hi RentKA 👋

I just submitted a request on your website.

My booking reference: *${leadId}*

🚗 Car: ${context.carName ?? "N/A"}
🏢 Vendor: ${context.vendorName ?? "N/A"}
📍 City: ${context.city ?? "N/A"}
🛞 Service: ${serviceLabel}

📅 Pickup Date: ${pickupDate}
⏰ Time: ${preferredTime}

💼 Package:
${context.pricingType ?? "N/A"} - ${context.duration ?? "N/A"}

💰 Price: ${context.price ? `PKR ${context.price}` : "To be confirmed"}

👤 Name: ${name}
📞 Phone: ${phone}

Please confirm availability.
`;

      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;

      const formData = new URLSearchParams({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || "",
        carName: context.carName || "",
        vendorName: context.vendorName || "",
        vendorId: context.vendorId || "",
        modelYear: String(context.modelYearLabel ?? context.modelYear ?? ""),
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
      });

      fetch(`${SHEETS_WEBHOOK}?${formData.toString()}`, {
        method: "POST",
      });

      /* ===============================
         ✅ GOOGLE ADS + REDIRECT (FIXED)
         =============================== */
      if (typeof window !== "undefined" && (window as any).gtag) {
  gtag_report_conversion();
}

// always redirect (even if gtag fails)
setTimeout(() => {
  window.location.href = whatsappUrl;
}, 1000);

    } catch (err) {
      console.error("Failed:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ===============================
     Render
     =============================== */
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />


      <div className="relative bg-white w-full max-w-md mx-4 rounded-2xl p-8 z-10 shadow-xl border border-slate-200">
        <h2 className="text-xl font-semibold mb-4 text-[var(--rentka-blue)]">
          Request a Call
        </h2>
        <p className="text-sm font-medium text-[var(--rentka-green)]">
          Fill form, Submit, Chat, Confirm
        </p>


        {(context.carName ||
          context.country ||
          context.city ||
          serviceLabel ||
          modelYearDisplay) && (
         <div className="mb-4 rounded-lg border border-[var(--rentka-blue)]/20 bg-[var(--rentka-blue)]/5 p-3 text-sm space-y-1">
            {context.carName && (
              <p><strong>Car:</strong> {context.carName}</p>
            )}
            {context.vendorName && (
              <p><strong>Vendor:</strong> {context.vendorName}</p>
            )}
            {modelYearDisplay && (
              <p><strong>Model:</strong> {modelYearDisplay}</p>
            )}
            {context.country && (
              <p><strong>Country:</strong> {context.country}</p>
            )}
            {context.city && (
              <p><strong>City:</strong> {context.city}</p>
            )}
            {serviceLabel && (
              <p><strong>Service:</strong> {serviceLabel}</p>
            )}
          </div>
        )}


        {success ? (
          <div className="space-y-5">


            {/* Success Header */}
            <div className="text-center space-y-2">
              <div className="text-4xl">✅</div>
              <h3 className="text-xl font-semibold text-slate-800">
                You're Almost Confirmed!
              </h3>
              <p className="text-sm text-slate-500">
                Final confirmation happens on WhatsApp.
              </p>
            </div>


            {/* Summary Card */}
           <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
              <span className="text-[var(--rentka-green)]">✔</span>
              <span>No payment required at this stage</span>
            </div>
            <div className="rounded-xl border bg-gradient-to-br from-slate-50 to-slate-100 p-4 text-sm space-y-1 shadow-sm">
              {context.carName && (
                <p><strong>Car:</strong> {context.carName}</p>
              )}
              {context.vendorName && (
                <p><strong>Vendor:</strong> {context.vendorName}</p>
              )}
              {modelYearDisplay && (
                <p><strong>Model:</strong> {modelYearDisplay}</p>
              )}
              {context.city && (
                <p><strong>City:</strong> {context.city}</p>
              )}
              {serviceLabel && (
                <p><strong>Service:</strong> {serviceLabel}</p>
              )}
            </div>


            {/* WhatsApp CTA */}
            {desktopWhatsappUrl && (
              <button
                onClick={() => window.open(desktopWhatsappUrl, "_blank")}
                className="w-full bg-[var(--rentka-green)] hover:opacity-90 transition text-white py-3 rounded-xl font-semibold shadow-md hover:shadow-lg"
              >
                Confirm Instantly on WhatsApp →
              </button>
            )}


            {/* Reassurance */}
            <p className="text-xs text-center text-slate-400">
              You can also wait — our team will contact you shortly.
            </p>
            <p className="text-xs text-slate-400 -mt-2">
              We will only use this number to confirm your booking.
            </p>


          </div>
        ) : (
          <>
            <div className="space-y-3">


              <div className="space-y-1">
              <label className="text-sm font-medium text-slate-600">
                Pickup Date *
              </label>


              <div className="relative">
                <input
                  type="date"
                  className="w-full border rounded-xl px-4 py-3 pr-12 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--rentka-blue)] focus:border-[var(--rentka-blue)]"
                  value={pickupDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setPickupDate(e.target.value)}
                />


                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  📅
                </span>
              </div>
            </div>


            {/* Preferred Time */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-600">
                Preferred Time *
              </label>


              <div className="relative">
                <input
                  type="time"
                  className="w-full border rounded-xl px-4 py-3 pr-12 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={preferredTime}
                  onChange={(e) => setPreferredTime(e.target.value)}
                />


                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  🕒
                </span>
              </div>
            </div>


              <input
                type="text"
                placeholder="Your name *"
               className="w-full border rounded-lg px-3 py-2"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />


              <input
                type="tel"
                placeholder="Phone number *"
                className="w-full border rounded-lg px-3 py-2"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />


              <input
                type="email"
                placeholder="Email (optional)"
                className="w-full border rounded-lg px-3 py-2"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>


            {error && (
              <p className="text-sm text-red-600 mt-2">{error}</p>
            )}


            <button
              className="w-full mt-5 bg-[var(--rentka-green)] text-white py-3 rounded-lg hover:opacity-90 transition disabled:opacity-50 font-semibold shadow-sm hover:shadow-md"
              disabled={loading}
              onClick={handleSubmit}
            >
              {loading ? "Submitting..." : "Check Availability Now"}
            </button>


            <p className="mt-3 text-xs text-slate-500 text-center">
              We respond within minutes during (8 AM – 8 PM).
              Quick WhatsApp confirmation • No payment required now
            </p>


            <p className="mt-2 text-xs text-slate-500 text-center">
              By submitting, you agree to our{" "}
              <a
                href="/terms"
                className="underline hover:text-[var(--rentka-blue)]"
                target="_blank"
                rel="noopener noreferrer"
              >
                Terms
              </a>{" "}
              &{" "}
              <a
                href="/privacy"
                className="underline hover:text-slate-700"
                target="_blank"
                rel="noopener noreferrer"
              >
                Privacy Policy
              </a>
              .
            </p>
          </>
        )}
      </div>
    </div>
  );
}