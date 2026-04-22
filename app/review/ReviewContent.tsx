"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  collection,
  addDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

export default function ReviewContent() {
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [valid, setValid] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [leadData, setLeadData] = useState<any>(null);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (!searchParams) return;

    const leadId = searchParams.get("leadId");
    const token = searchParams.get("token");

    if (!leadId || !token) {
      setLoading(false);
      return;
    }

    const validate = async () => {
      try {
        const ref = doc(db, "leads", leadId);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          setLoading(false);
          return;
        }

        const data = snap.data();

        console.log("🔥 Data:", data);
        console.log("🔥 URL token:", token);
        console.log("🔥 DB token:", data.reviewToken);

        if (data.reviewSubmitted === true) {
          setSubmitted(true);
        } else if (data.reviewToken !== token) {
          setValid(false);
        } else {
          setValid(true);
          setLeadData(data);
        }
      } catch (err) {
        console.error("Error loading review:", err);
      } finally {
        setLoading(false);
      }
    };

    validate();
  }, [searchParams]);

  const handleSubmit = async () => {
    const leadId = searchParams.get("leadId");

    if (!leadId || !leadData) return;

    await addDoc(collection(db, "reviews"), {
      leadId,
      vendorId: leadData.vendorId,
      vendorName: leadData.vendorName,
      rating,
      comment,
      createdAt: serverTimestamp(),
    });

    await updateDoc(doc(db, "leads", leadId), {
      reviewSubmitted: true,
    });

    setValid(false);
    setSubmitted(true);
  };

  if (loading) return <p className="p-10">Loading...</p>;

  if (submitted)
    return <p className="p-10">✅ Review already submitted. Thank you!</p>;

  if (!valid)
    return <p className="p-10">❌ Invalid or expired review link</p>;

  return (
    <div className="max-w-md mx-auto p-6 mt-10 border rounded-xl">
      <h2 className="text-xl font-semibold mb-4">
        Rate your experience
      </h2>

      <p className="text-sm mb-2">
        Vendor: <strong>{leadData.vendorName}</strong>
      </p>

      <select
        value={rating}
        onChange={(e) => setRating(Number(e.target.value))}
        className="w-full border p-2 rounded mb-3"
      >
        {[1, 2, 3, 4, 5].map((r) => (
          <option key={r} value={r}>
            {r} ⭐
          </option>
        ))}
      </select>

      <textarea
        placeholder="Write your review"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="w-full border p-2 rounded mb-4"
      />

      <button
        onClick={handleSubmit}
        className="w-full bg-green-600 text-white py-2 rounded"
      >
        Submit Review
      </button>
    </div>
  );
}