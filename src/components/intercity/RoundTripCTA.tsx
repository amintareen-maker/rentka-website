import Link from "next/link";
import { ArrowRight, MessageCircle } from "lucide-react";

export default function RoundTripCTA() {
  return (
    <section className="py-20">

      <div className="mx-auto max-w-7xl px-6">

        <div className="overflow-hidden rounded-[32px] bg-[#0F2B46]">

          <div className="grid items-center gap-10 lg:grid-cols-2">

            <div className="p-10 lg:p-14">

              <span className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-[#5BAE4A]">
                Need Something Different?
              </span>

              <h2 className="mt-6 text-4xl font-bold text-white">
                Round Trip, Multiple Stops or Custom Route?
              </h2>

              <p className="mt-6 text-lg leading-8 text-slate-300">

                Our published prices are for one-way transfers.

                If you require a round trip, waiting time,
                multiple destinations or a customised itinerary,
                we'll provide you with the most competitive quotation.

              </p>

              <div className="mt-10 flex flex-wrap gap-4">

                <a
                  href="https://wa.me/923350052005"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#5BAE4A] px-7 py-4 font-semibold text-white transition hover:opacity-90"
                >
                  <MessageCircle size={20} />

                  Get WhatsApp Quote

                </a>

                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded-xl border border-white px-7 py-4 font-semibold text-white transition hover:bg-white hover:text-[#0F2B46]"
                >
                  Contact Us

                  <ArrowRight size={18} />

                </Link>

              </div>

            </div>

            <div className="p-10 lg:p-14">

              <div className="rounded-3xl bg-white p-8">

                <h3 className="text-2xl font-bold text-[#0F2B46]">

                  Perfect For

                </h3>

                <div className="mt-8 space-y-5">

                  <div className="flex gap-4">

                    <div className="mt-1 h-3 w-3 rounded-full bg-[#5BAE4A]" />

                    <div>

                      <h4 className="font-semibold">
                        Business Travel
                      </h4>

                      <p className="text-slate-600">
                        Meetings in multiple cities with waiting time.
                      </p>

                    </div>

                  </div>

                  <div className="flex gap-4">

                    <div className="mt-1 h-3 w-3 rounded-full bg-[#5BAE4A]" />

                    <div>

                      <h4 className="font-semibold">
                        Family Trips
                      </h4>

                      <p className="text-slate-600">
                        Flexible return timings for comfortable travel.
                      </p>

                    </div>

                  </div>

                  <div className="flex gap-4">

                    <div className="mt-1 h-3 w-3 rounded-full bg-[#5BAE4A]" />

                    <div>

                      <h4 className="font-semibold">
                        Northern Areas
                      </h4>

                      <p className="text-slate-600">
                        Multi-day tours and custom itineraries.
                      </p>

                    </div>

                  </div>

                  <div className="flex gap-4">

                    <div className="mt-1 h-3 w-3 rounded-full bg-[#5BAE4A]" />

                    <div>

                      <h4 className="font-semibold">
                        Corporate Accounts
                      </h4>

                      <p className="text-slate-600">
                        Dedicated quotations for business travel.
                      </p>

                    </div>

                  </div>

                </div>

              </div>

            </div>

          </div>

        </div>

      </div>

    </section>
  );
}