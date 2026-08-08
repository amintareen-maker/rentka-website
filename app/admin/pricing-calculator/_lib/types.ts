export type PricingMode = "target" | "fixed" | "manual";
export type VehicleCategory = "Hatchback" | "Sedan" | "SUV" | "Van" | "Coaster or bus";
export type TripType = "Within city" | "Outstation" | "One-way customer drop" | "Round trip" | "Custom multi-stop trip";
export type StopType = "Sightseeing" | "Museum" | "Mosque" | "Restaurant" | "Tea stop" | "Park" | "Hotel" | "Airport" | "Meeting" | "Custom";
export type DistanceKey = "pickupOperational" | "customerTrip" | "outstation" | "driverReturn" | "buffer";
export type ProfitIndicator = "excellent" | "acceptable" | "below-minimum";
export type RouteStatus = "manual" | "not-calculated" | "calculating" | "calculated" | "outdated" | "failed";
export interface ResolvedPlace { placeId: string; displayName: string; formattedAddress: string; lat: number; lng: number; }
export interface AutomaticRoute { requestHash: string; calculatedAt: string; distanceMeters: number; durationSeconds: number; legCount: number; }
export interface VehiclePreset { id: string; name: string; category: VehicleCategory; includedHours: number; vendorRent: number; customerReferenceRent: number; fuelAverage: number; vendorExtraHour: number; customerExtraHour: number; defaultDriverFood: number; defaultDriverAccommodation: number; }
export interface OriginPreset { id: string; name: string; }
export interface TripStop { id: string; name: string; type: StopType; waitingMinutes: number; notes: string; enabled: boolean; place?: ResolvedPlace; }
export interface Expenses { toll: number; parking: number; driverFood: number; driverAccommodation: number; outstationSurcharge: number; miscellaneous: number; operationalContingency: number; discount: number; }
export interface PricingStrategy { mode: PricingMode; targetProfitPercent: number; minimumProfitPercent: number; fixedProfit: number; manualPrice: number; marketAdjustment: number; }
export interface TripPackage { id: string; name: string; enabled: boolean; stops: TripStop[]; distances: Record<DistanceKey, number>; drivingMinutes: number; timeBufferMinutes: number; expenses: Expenses; pricing: PricingStrategy; routeStatus: RouteStatus; automaticRoute?: AutomaticRoute; routeError?: string; }
export interface TripDetails { date: string; pickupTime: string; tripType: TripType; vehiclePresetId: string; vehicleName: string; originPresetId: string; origin: string; originPlace?: ResolvedPlace; pickup: string; pickupPlace?: ResolvedPlace; finalDrop: string; finalDropPlace?: ResolvedPlace; driverReturn: string; driverReturnPlace?: ResolvedPlace; includeDriverReturn: boolean; notes: string; }
export interface CalculatorState { trip: TripDetails; vehiclePresets: VehiclePreset[]; originPresets: OriginPreset[]; packages: TripPackage[]; activePackageId: string; fuelPrice: number; fuelBufferPercent: number; }
export interface RouteSummary { totalKm: number; waitingMinutes: number; drivingMinutes: number; bufferMinutes: number; bookingMinutes: number; extraMinutes: number; extraHours: number; }
export interface CostLine { label: string; amount: number; }
export interface FuelLine { key: DistanceKey; label: string; kilometres: number; litres: number; cost: number; }
export interface PricingResult { route: RouteSummary; fuelLines: FuelLine[]; fuelLitres: number; rawFuelCost: number; fuelBufferAmount: number; fuelCost: number; vehicleCost: number; vendorExtraHourCost: number; customerExtraHourReference: number; internalLines: CostLine[]; internalCost: number; minimumPrice: number; unroundedSuggestedPrice: number; baseSuggestedPrice: number; suggestedPrice: number; finalPrice: number; adjustmentImpact: number; grossProfit: number; margin: number; markup: number; indicator: ProfitIndicator; warnings: string[]; }
export interface SavedQuotation { id: string; name: string; savedAt: string; version: 4; state: CalculatorState; }
