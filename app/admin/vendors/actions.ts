"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { hasAdminSession } from "../_lib/session";
import { parseVendorForm } from "@/lib/dispatch/validation";
import { saveDispatchVendor } from "@/lib/dispatch/vendors";

export async function saveVendor(form: FormData) {
  if (!(await hasAdminSession())) throw new Error("Unauthorized");
  const id = String(form.get("id") ?? "").trim() || undefined;
  try { await saveDispatchVendor(id, parseVendorForm(form)); }
  catch (error) { redirect(`/admin/vendors?${id ? `edit=${encodeURIComponent(id)}&` : ""}error=${encodeURIComponent(error instanceof Error ? error.message : "Unable to save vendor.")}`); }
  revalidatePath("/admin/vendors"); revalidatePath("/admin/vehicles"); revalidatePath("/admin/drivers");
  redirect("/admin/vendors?saved=Vendor saved");
}
