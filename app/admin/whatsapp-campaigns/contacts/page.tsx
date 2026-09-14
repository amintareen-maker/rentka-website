import { redirect } from "next/navigation";
import { hasAdminSession } from "../../_lib/session";
import { listContacts } from "@/lib/whatsapp-campaigns/repository";
import Contacts from "./Contacts";
import { listFileAudiences } from "@/lib/whatsapp-campaigns/file-audiences";
export default async function Page({ searchParams }: { searchParams: Promise<{ audience?: string }> }) {
  if (!(await hasAdminSession())) redirect("/admin/pricing-calculator");
  const { audience = "" } = await searchParams;
  const [contacts, audiences] = await Promise.all([listContacts(), listFileAudiences()]);
  return <Contacts key={audience} contacts={contacts} audiences={audiences} initialAudienceId={audience} />;
}
