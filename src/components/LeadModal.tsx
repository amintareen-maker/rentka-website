"use client";

import { useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

/* ===============================
   🔗 GOOGLE SHEETS WEBHOOK
   =============================== */
const SHEETS_WEBHOOK =
  "https://script.google.com/macros/s/AKfycbyYVkemVM2O_pIPwYCLyqMCMIsDoLRLfzYsEGE__OrLjH6_lCRZCHim7R-3s_pn6JOQ9w/exec";

const WHATSAPP_NUMBER = "923048919511";

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

      /* 🔥 FIREBASE (SOURCE OF TRUTH) */
      const cityCode = (context.city ?? "GEN").substring(0, 3).toUpperCase();
      const randomDigits = Math.floor(1000 + Math.random() * 9000);
      const leadId = `RK-${cityCode}-${randomDigits}`;

      await addDoc(collection(db, "leads"), {
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
        source: "website",
        status: "new",
        createdAt: serverTimestamp(),
      });

      /* 🟢 GOOGLE SHEETS (NON-BLOCKING) */
      const formData = new URLSearchParams({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || "",
        carName: context.carName || "",
        vendorName: context.vendorName || "",
        vendorId: context.vendorId || "",
        modelYear: String(modelYearDisplay || ""),
        country: context.country || "",
        city: context.city || "",
        service: context.service || "",
        pickupDate,
        preferredTime,
        source: "website",
        leadId,
      });

      fetch(`${SHEETS_WEBHOOK}?${formData.toString()}`, {
        method: "POST",
      });

      setSuccess(true);

      /* ===============================
         📲 WHATSAPP REDIRECT
         =============================== */

      const message = `
Hi RentKA,

Lead ID: ${leadId}

I just requested:

Car: ${context.carName ?? "N/A"}
Vendor: ${context.vendorName ?? "N/A"}
Service: ${serviceLabel ?? "N/A"}
City: ${context.city ?? "N/A"}
Pickup Date: ${pickupDate}
Preferred Time: ${preferredTime}

My Name: ${name}
Phone: ${phone}

Source: Website

Please confirm availability.
`;

      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;

      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

      if (isMobile) {
        window.open(whatsappUrl, "_blank");

        setTimeout(() => {
          setSuccess(false);
          setDesktopWhatsappUrl(null);
          setName("");
          setPhone("");
          setEmail("");
          setPickupDate("");
          setPreferredTime("");
          onClose();
        }, 800);
      } else {
        setDesktopWhatsappUrl(whatsappUrl);
      }


      /* ===============================
         Close modal normally
         =============================== */



    } catch (err) {
      console.error("Failed to save lead:", err);
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

      <div className="relative bg-white w-full max-w-md mx-4 rounded-xl p-6 z-10">
        <h2 className="text-lg font-semibold mb-4">Request a Call</h2>

        {(context.carName ||
          context.country ||
          context.city ||
          serviceLabel ||
          modelYearDisplay) && (
          <div className="mb-4 rounded-lg border bg-slate-50 p-3 text-sm space-y-1">
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
          <div className="space-y-3">
            <p className="text-green-600 font-medium">
              ✅ Request submitted successfully.
            </p>

            {desktopWhatsappUrl && (
              <button
                onClick={() => window.open(desktopWhatsappUrl, "_blank")}
                className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
              >
                Open WhatsApp Chat
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="space-y-3">

              <input
                type="date"
                className="w-full border rounded-lg px-3 py-2"
                value={pickupDate}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setPickupDate(e.target.value)}
              />

              <input
                type="time"
                className="w-full border rounded-lg px-3 py-2"
                value={preferredTime}
                onChange={(e) => setPreferredTime(e.target.value)}
              />

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
              className="w-full mt-5 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              disabled={loading}
              onClick={handleSubmit}
            >
              {loading ? "Submitting..." : "Request a Call"}
            </button>

            <p className="mt-3 text-xs text-slate-500 text-center">
              We respond within minutes during (8 AM – 8 PM).
              Displayed prices are provided by rental partners. 
              Advance payment is required after confirmation to proceed with booking.
            </p>

            <p className="mt-2 text-xs text-slate-500 text-center">
              By submitting, you agree to our{" "}
              <a
                href="/terms"
                className="underline hover:text-slate-700"
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
