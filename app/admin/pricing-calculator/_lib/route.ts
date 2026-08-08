import type { RouteSummary, TripPackage } from "./types";
export const nonNegative = (value: unknown): number => { const number = Number(value); return Number.isFinite(number) && number >= 0 ? number : 0; };
export function summarizeManualRoute(pkg: TripPackage, includedHours: number): RouteSummary {
  const totalKm = Object.values(pkg.distances).reduce((sum, value) => sum + nonNegative(value), 0);
  const waitingMinutes = pkg.stops.filter((stop) => stop.enabled).reduce((sum, stop) => sum + nonNegative(stop.waitingMinutes), 0);
  const drivingMinutes = nonNegative(pkg.drivingMinutes); const bufferMinutes = nonNegative(pkg.timeBufferMinutes);
  const bookingMinutes = drivingMinutes + waitingMinutes + bufferMinutes;
  const extraMinutes = Math.max(0, bookingMinutes - nonNegative(includedHours) * 60);
  const extraHours = Math.ceil(extraMinutes / 60);
  return { totalKm, waitingMinutes, drivingMinutes, bufferMinutes, bookingMinutes, extraMinutes, extraHours };
}
