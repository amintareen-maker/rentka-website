"use client";
export default function CampaignError({ reset }: { reset: () => void }) {
  return <section className="rounded-xl bg-white p-6"><h2 className="text-xl font-bold">Campaign data could not be loaded</h2><p className="my-3">Check the admin session and Firebase configuration, then retry. No campaign messages were sent.</p><button className="rounded-lg bg-[#0F2B46] px-4 py-2 text-white" onClick={reset}>Try again</button></section>;
}
