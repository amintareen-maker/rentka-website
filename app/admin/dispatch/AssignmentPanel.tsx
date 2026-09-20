"use client";
import { useState, useTransition } from "react";
import type { DispatchAssignment } from "@/lib/dispatch/assignment-types";
import { formatVehicleDisplayLabel } from "@/lib/dispatch/vehicle-display";
import { assignBookingAction } from "./actions";

type VehicleOption = {
  id: string;
  label: string;
  registrationNumber: string;
  documentationState: string;
  reasons: string[];
};
type DriverOption = {
  id: string;
  name: string;
  vendorId: string;
  vendorName: string;
  priority: string;
  phone: string;
  whatsapp: string;
  responseAt?: string;
  offerId: string;
  vehicles: VehicleOption[];
};
type VendorProposalOption = {
  offerId: string;
  offerRevision: number;
  responseRevision: number;
  proposalId: string;
  proposalStatus: string;
  vendorId: string;
  vendorName: string;
  responseStatus: string;
  offeredPayoutMinor: number;
  agreedPayoutMinor?: number;
  driverId: string;
  driverName: string;
  driverPhone: string;
  vehicleId: string;
  vehicleLabel: string;
  registrationNumber: string;
  current: boolean;
};
const money = (minor: number) =>
  "Rs. " + (minor / 100).toLocaleString("en-PK", { maximumFractionDigits: 2 });

export default function AssignmentPanel({
  bookingDocumentId,
  bookingId,
  payoutMinor,
  current,
  drivers,
  vendorProposals,
}: {
  bookingDocumentId: string;
  bookingId: string;
  payoutMinor: number;
  current?: DispatchAssignment;
  drivers: DriverOption[];
  vendorProposals: VendorProposalOption[];
}) {
  const [driverId, setDriverId] = useState(drivers[0]?.id ?? ""),
    [vehicleId, setVehicleId] = useState(""),
    [confirming, setConfirming] = useState(false),
    [vendorConfirmingId, setVendorConfirmingId] = useState(""),
    [changing, setChanging] = useState(false),
    [reason, setReason] = useState(""),
    [message, setMessage] = useState(""),
    [pending, startTransition] = useTransition();
  const driver = drivers.find((item) => item.id === driverId),
    vehicles = driver?.vehicles ?? [],
    vehicle = vehicles.find((item) => item.id === vehicleId);
  const vendorProposal = vendorProposals.find(
    (item) => item.proposalId === vendorConfirmingId,
  );
  const chooseDriver = (id: string) => {
    setDriverId(id);
    setVehicleId("");
  };
  const submit = () => {
    if (!driver || !vehicle) return;
    startTransition(async () => {
      const form = new FormData();
      form.set("bookingDocumentId", bookingDocumentId);
      form.set("driverId", driver.id);
      form.set("vehicleId", vehicle.id);
      form.set("offerId", driver.offerId);
      if (changing) form.set("reason", reason);
      const result = await assignBookingAction(form);
      setMessage(result.message);
      if (result.ok) setConfirming(false);
    });
  };
  const submitVendorProposal = () => {
    if (!vendorProposal?.current) return;
    startTransition(async () => {
      const form = new FormData();
      form.set("bookingDocumentId", bookingDocumentId);
      form.set("driverId", vendorProposal.driverId);
      form.set("vehicleId", vendorProposal.vehicleId);
      form.set("offerId", vendorProposal.offerId);
      form.set("vendorProposalId", vendorProposal.proposalId);
      form.set("vendorId", vendorProposal.vendorId);
      form.set("vendorOfferRevision", String(vendorProposal.offerRevision));
      form.set("vendorResponseRevision", String(vendorProposal.responseRevision));
      const result = await assignBookingAction(form);
      setMessage(result.message);
      if (result.ok) setVendorConfirmingId("");
    });
  };
  if (current?.status === "assigned" && !changing)
    return (
      <section className="lg:col-span-2 rounded-xl border-2 border-green-600 bg-green-50 p-4">
        <h3 className="text-lg font-black text-green-900">Assigned ✓</h3>
        <div className="mt-3 grid gap-3 text-sm md:grid-cols-4">
          <div>
            <p className="text-slate-500">Driver</p>
            <b>{current.driverSnapshot.name}</b>
          </div>
          <div>
            <p className="text-slate-500">Vehicle</p>
            <b>{formatVehicleDisplayLabel(current.vehicleSnapshot)}</b>
          </div>
          <div>
            <p className="text-slate-500">Vendor</p>
            <b>{current.vendorName}</b>
          </div>
          <div>
            <p className="text-slate-500">Approved payout</p>
            <b>{money(current.approvedVendorPayoutMinor)}</b>
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-600">
          Assignment is operational only. No Driver instructions or Customer
          details were sent.
        </p>
        <button
          onClick={() => setChanging(true)}
          className="mt-3 rounded-lg border border-amber-500 bg-white px-4 py-2 text-sm font-bold text-amber-900"
        >
          Change Assignment
        </button>
      </section>
    );
  return (
    <section className="lg:col-span-2 rounded-xl border-2 border-indigo-700 bg-white p-4">
      {vendorProposals.length > 0 && !changing && (
        <div className="mb-5 rounded-xl border-2 border-emerald-600 bg-emerald-50 p-4">
          <h3 className="text-lg font-black text-emerald-950">Vendor Fulfillment Review</h3>
          <p className="text-sm text-emerald-900">Vendor Accepted ≠ Assigned. RentKA must explicitly confirm the final assignment.</p>
          <div className="mt-3 space-y-3">
            {vendorProposals.map((proposal) => (
              <div key={proposal.proposalId} className="rounded-lg bg-white p-3 text-sm">
                <div className="grid gap-3 md:grid-cols-3">
                  <div><p className="text-slate-500">Vendor / response</p><b>{proposal.vendorName}</b><p>{proposal.responseStatus}</p></div>
                  <div><p className="text-slate-500">Agreed vendor payout</p><b>{proposal.agreedPayoutMinor === undefined ? "Unavailable" : money(proposal.agreedPayoutMinor)}</b></div>
                  <div><p className="text-slate-500">Proposal status</p><b>{proposal.current ? "Awaiting RentKA Assignment" : "Superseded — refresh required"}</b></div>
                  <div><p className="text-slate-500">Proposed Driver</p><b>{proposal.driverName}</b><p>{proposal.driverPhone}</p></div>
                  <div><p className="text-slate-500">Proposed Vehicle</p><b>{proposal.vehicleLabel}</b></div>
                </div>
                <button disabled={!proposal.current || proposal.agreedPayoutMinor === undefined} onClick={() => setVendorConfirmingId(proposal.proposalId)} className="mt-3 rounded-lg bg-emerald-800 px-4 py-2 font-bold text-white disabled:opacity-40">Review Vendor Assignment</button>
              </div>
            ))}
          </div>
        </div>
      )}
      <h3 className="text-lg font-black text-[#0F2B46]">
        {changing
          ? "Change Assignment"
          : "D7 Final Driver + Vehicle Assignment"}
      </h3>
      <p className="text-sm text-slate-600">
        Choose an AVAILABLE Driver, then the actual currently eligible physical
        Vehicle. Assignment does not send any message.
      </p>
      {drivers.length === 0 ? (
        <p className="mt-3 rounded-lg bg-amber-50 p-3 font-bold text-amber-900">
          No Driver has an AVAILABLE response that remains eligible. Record a D4
          response or refresh matching.
        </p>
      ) : (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="text-sm font-bold">
            AVAILABLE Driver
            <select
              value={driverId}
              onChange={(e) => chooseDriver(e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2"
            >
              <option value="">Choose Driver</option>
              {drivers.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} — {item.vendorName} — {item.priority}
                </option>
              ))}
            </select>
            {driver && (
              <span className="mt-2 block text-xs font-normal">
                Phone: {driver.phone} · WhatsApp: {driver.whatsapp} · Response:{" "}
                {driver.responseAt
                  ? new Date(driver.responseAt).toLocaleString("en-PK")
                  : "recorded"}
              </span>
            )}
          </label>
          <label className="text-sm font-bold">
            Eligible actual Vehicle
            <select
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2"
              disabled={!driver}
            >
              <option value="">Choose Vehicle</option>
              {vehicles.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label} — docs{" "}
                  {item.documentationState}
                </option>
              ))}
            </select>
            {vehicle && (
              <span className="mt-2 block text-xs font-normal">
                {vehicle.reasons.join(" · ")}
              </span>
            )}
          </label>
        </div>
      )}
      {changing && (
        <label className="mt-4 block text-sm font-bold">
          Mandatory reassignment reason
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            minLength={8}
            required
            className="mt-1 w-full rounded-lg border px-3 py-2"
            placeholder="Why the existing assignment must change"
          />
        </label>
      )}
      <div className="mt-4 flex gap-2">
        <button
          disabled={
            !driver || !vehicle || (changing && reason.trim().length < 8)
          }
          onClick={() => setConfirming(true)}
          className="rounded-lg bg-indigo-800 px-4 py-2 font-bold text-white disabled:opacity-40"
        >
          {changing ? "Review Reassignment" : "Review Assignment"}
        </button>
        {changing && (
          <button
            onClick={() => setChanging(false)}
            className="rounded-lg border px-4 py-2 font-bold"
          >
            Keep Current Assignment
          </button>
        )}
      </div>
      {message && (
        <p role="alert" className="mt-3 rounded bg-amber-50 p-2 text-sm">
          {message}
        </p>
      )}
      {confirming && driver && vehicle && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4"
        >
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl">
            <h4 className="text-xl font-black">
              {changing ? "Confirm Reassignment" : "Assign Booking"}
            </h4>
            <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              <dt>Booking:</dt>
              <dd className="font-bold">{bookingId}</dd>
              <dt>Driver:</dt>
              <dd className="font-bold">{driver.name}</dd>
              <dt>Vehicle:</dt>
              <dd className="font-bold">
                {vehicle.label}
              </dd>
              <dt>Vendor:</dt>
              <dd className="font-bold">{driver.vendorName}</dd>
              <dt>Approved Vendor Payout:</dt>
              <dd className="font-bold">{money(payoutMinor)}</dd>
            </dl>
            <p className="mt-4 rounded bg-amber-50 p-3 text-sm">
              This persists a final operational assignment and conflict
              reservation. After success, separate outbox jobs queue the Driver
              and Customer notifications; messaging cannot roll back the assignment.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setConfirming(false)}
                disabled={pending}
                className="rounded-lg border px-4 py-2 font-bold"
              >
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={pending}
                className="rounded-lg bg-green-700 px-4 py-2 font-bold text-white"
              >
                {pending
                  ? "Assigning…"
                  : changing
                    ? "Confirm Reassignment"
                    : "Confirm Assignment"}
              </button>
            </div>
          </div>
        </div>
      )}
      {vendorProposal && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl">
            <h4 className="text-xl font-black">Confirm Vendor Fulfillment Assignment</h4>
            <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              <dt>Booking:</dt><dd className="font-bold">{bookingId}</dd>
              <dt>Vendor:</dt><dd className="font-bold">{vendorProposal.vendorName}</dd>
              <dt>Driver:</dt><dd className="font-bold">{vendorProposal.driverName}</dd>
              <dt>Vehicle:</dt><dd className="font-bold">{vendorProposal.vehicleLabel}</dd>
              <dt>Agreed payout:</dt><dd className="font-bold">{vendorProposal.agreedPayoutMinor === undefined ? "Unavailable" : money(vendorProposal.agreedPayoutMinor)}</dd>
            </dl>
            <p className="mt-4 rounded bg-amber-50 p-3 text-sm">This explicit Admin action revalidates the current Vendor offer, latest proposal, D7 eligibility, and conflicts before creating the assignment reservation. After success, separate outbox jobs queue the Driver and Customer notifications; messaging cannot roll back the assignment.</p>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setVendorConfirmingId("")} disabled={pending} className="rounded-lg border px-4 py-2 font-bold">Cancel</button>
              <button onClick={submitVendorProposal} disabled={pending || !vendorProposal.current} className="rounded-lg bg-green-700 px-4 py-2 font-bold text-white">{pending ? "Assigning…" : "Confirm Assignment"}</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
