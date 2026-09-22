import type { AirportDefinition, AirportId } from "./types";

export const airportCounterDocumentId = (airportId: AirportId) => `${airportId}AirportBookings`;
export const nextAirportSequence = (currentValue: unknown) => Number(currentValue ?? 1000) + 1;
export const airportBookingId = (airport: AirportDefinition, sequence: number) => `RK-${airport.bookingCode}-ARPT-${String(sequence).padStart(4, "0")}`;