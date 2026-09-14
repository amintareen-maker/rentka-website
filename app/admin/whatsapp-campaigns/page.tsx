import AudienceSender from "./AudienceSender";
import { campaignSendGate } from "@/lib/whatsapp-campaigns/send-gate";
import { redirect } from "next/navigation";
import { hasAdminSession } from "../_lib/session";
import { listCampaigns, listContacts } from "@/lib/whatsapp-campaigns/repository";
import Drafts from "./Drafts";
import { listFileAudiences } from "@/lib/whatsapp-campaigns/file-audiences";
export default async function Page() {
  if (!(await hasAdminSession())) redirect("/admin/pricing-calculator");
  const [campaigns, audiences, contacts] = await Promise.all([listCampaigns(), listFileAudiences(), listContacts()]);
  return <><AudienceSender audiences={audiences} contacts={contacts} gate={await campaignSendGate()} /><Drafts campaigns={campaigns} audiences={audiences} contacts={contacts} /></>;
}
