"use server";
import { revalidatePath } from "next/cache"; import { redirect } from "next/navigation";
import { hasAdminSession } from "../_lib/session"; import { parseDriverForm } from "@/lib/dispatch/validation"; import { saveDispatchDriver } from "@/lib/dispatch/drivers";
export async function saveDriver(form: FormData) { if (!(await hasAdminSession())) throw new Error("Unauthorized"); const id=String(form.get("id")??"").trim()||undefined; try { await saveDispatchDriver(id,parseDriverForm(form)); } catch(error){redirect(`/admin/drivers?${id?`edit=${encodeURIComponent(id)}&`:""}error=${encodeURIComponent(error instanceof Error?error.message:"Unable to save driver.")}`)} revalidatePath("/admin/drivers"); revalidatePath("/admin/vendors"); redirect("/admin/drivers?saved=Driver saved"); }
