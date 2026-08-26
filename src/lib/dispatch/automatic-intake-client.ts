"use client";

export async function requestAutomaticDispatchIntake(input: {
  sourceType: "twin_cities_normal" | "one_way_drop";
  sourceDocumentId: string;
  bookingId: string;
}) {
  try {
    const response = await fetch("/api/dispatch/intake", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!response.ok) console.error("Automatic dispatch intake was not accepted; Admin Import remains available.");
  } catch (error) {
    console.error("Automatic dispatch intake could not be requested; Admin Import remains available.", error);
  }
}
