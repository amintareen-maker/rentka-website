import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import {
  adminVehicleDetails,
  formatLahoreWhatsAppVehicleLines,
  resolveCustomerVehicleName,
} from "../src/lib/normal-rental/lead-output.ts";

test("separate Civic variant uses public label and model year in customer output", () => {
  const lines = formatLahoreWhatsAppVehicleLines({
    carName: "Honda Civic", publicVehicleLabel: "Honda Civic 11 Gen", modelYear: "2022 and above",
    pricingType: "withinCity", duration: "daily", rate: 12000,
  });
  assert.deepEqual(lines, [
    "Vehicle: Honda Civic 11 Gen", "Model Year: 2022 and above", "Service: Within Lahore",
    "Driver: Included", "Rate: PKR 12,000/day",
  ]);
});

test("normal grouped inventory falls back to carName", () => {
  assert.equal(resolveCustomerVehicleName({ carName: "Suzuki Alto", publicVehicleLabel: null }), "Suzuki Alto");
  const lines = formatLahoreWhatsAppVehicleLines({
    carName: "Suzuki Alto", publicVehicleLabel: null, modelYear: "2019 and above",
    pricingType: "withinCity", duration: "daily", rate: 4500,
  });
  assert.equal(lines[0], "Vehicle: Suzuki Alto");
  assert.equal(lines[1], "Model Year: 2019 and above");
});

test("missing model year omits the entire line", () => {
  const lines = formatLahoreWhatsAppVehicleLines({
    carName: "Toyota Corolla", publicVehicleLabel: "Toyota Corolla", modelYear: "",
    pricingType: "outsideCity", duration: "weekly", rate: 46000,
  });
  assert.equal(lines.some((line) => line.startsWith("Model Year:")), false);
});

test("customer WhatsApp vehicle output excludes internal inventory and vendor data", () => {
  const lines = formatLahoreWhatsAppVehicleLines({
    carName: "Honda Civic", publicVehicleLabel: "Honda Civic 11 Gen", modelYear: "2022 and above",
    pricingType: "withinCity", duration: "daily", rate: 12000,
  }).join("\n");
  assert.doesNotMatch(lines, /inventory|vendor|margin|profit/i);
});

test("admin vehicle details include public label, base model and model year", () => {
  assert.deepEqual(adminVehicleDetails({ carName: "Honda Civic", publicVehicleLabel: "Honda Civic 11 Gen", modelYear: "2022 and above" }), {
    vehicle: "Honda Civic 11 Gen", baseModel: "Honda Civic", modelYear: "2022 and above",
  });
  assert.deepEqual(adminVehicleDetails({ carName: "Suzuki Alto", publicVehicleLabel: null, modelYear: "2019 and above" }), {
    vehicle: "Suzuki Alto", baseModel: undefined, modelYear: "2019 and above",
  });
});

test("existing internal lead data and Sheet fields remain intact", async () => {
  const source = await readFile(new URL("../src/lib/normal-rental/lahore-lead.ts", import.meta.url), "utf8");
  for (const field of ["inventoryId: selected.inventoryId", "vendorName: selected.vendorName", "vendorId: selected.vendorId", "carName: selected.modelName", "modelYear:"]) {
    assert.match(source, new RegExp(field.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(source, /publicVehicleLabel: publicVehicleLabel \?\? ""/);
});
