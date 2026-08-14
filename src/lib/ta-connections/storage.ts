/** Centralized Firestore paths for the TA Connections bounded context. */
export const TA_FIRESTORE_COLLECTIONS = {
  airports: "taConnectionsAirports",
  rateSets: "taConnectionsRateSets",
  bookings: "taConnectionsBookings",
  invoices: "taConnectionsInvoices",
  counters: "taConnectionsCounters",
  idempotency: "taConnectionsIdempotency",
} as const;

export const taBookingStatusHistoryCollection = (bookingId: string) =>
  `${TA_FIRESTORE_COLLECTIONS.bookings}/${bookingId}/statusHistory`;
