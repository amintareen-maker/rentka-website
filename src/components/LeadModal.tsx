"use client";

import { useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

/* ===============================
   🔗 GOOGLE SHEETS WEBHOOK
   =============================== */
const SHEETS_WEBHOOK =
  "https://script.google.com/macros/s/AKfycbyYVkemVM2O_pIPwYCLyqMCMIsDoLRLfzYsEGE__OrLjH6_lCRZCHim7R-3s_pn6JOQ9w/exec";

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

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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

    try {
      setLoading(true);

      /* 🔥 FIREBASE (SOURCE OF TRUTH) */
      await addDoc(collection(db, "leads"), {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || null,

        carName: context.carName ?? null,
        country: context.country ?? null,
        city: context.city ?? null,
        service: context.service ?? null,
        modelYear: modelYearDisplay,

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
        modelYear: String(modelYearDisplay || ""),
        country: context.country || "",
        city: context.city || "",
        service: context.service || "",
        source: "website",
      });

      fetch(`${SHEETS_WEBHOOK}?${formData.toString()}`, {
        method: "POST",
      });
      setSuccess(true);

      setTimeout(() => {
        setSuccess(false);
        setName("");
        setPhone("");
        setEmail("");
        onClose();
      }, 1200);
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
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white w-full max-w-md mx-4 rounded-xl p-6 z-10">
        <h2 className="text-lg font-semibold mb-4">Request a Call</h2>

        {/* 🔍 CONTEXT SUMMARY */}
        {(context.carName ||
          context.country ||
          context.city ||
          serviceLabel ||
          modelYearDisplay) && (
          <div className="mb-4 rounded-lg border bg-slate-50 p-3 text-sm space-y-1">
            {context.carName && (
              <p><strong>Car:</strong> {context.carName}</p>
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
  <p className="text-green-600 font-medium">
    ✅ Request submitted. Our team will contact you shortly.
  </p>
) : (
  <>
    <div className="space-y-3">
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

    {/* CTA Disclaimer */}
    <p className="mt-3 text-xs text-slate-500 text-center">
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
