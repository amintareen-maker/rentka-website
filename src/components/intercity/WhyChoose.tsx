import {
  ShieldCheck,
  Car,
  Fuel,
  Clock3,
  BadgeCheck,
  PhoneCall,
} from "lucide-react";

const features = [
  {
    icon: ShieldCheck,
    title: "Professional Drivers",
    description:
      "Experienced, courteous and verified drivers ensure a safe and comfortable journey on every trip.",
  },
  {
    icon: Fuel,
    title: "Fuel Included",
    description:
      "Our published one-way prices already include fuel charges, so there are no hidden surprises.",
  },
  {
    icon: BadgeCheck,
    title: "Fixed Transparent Pricing",
    description:
      "Know your fare before you travel with fixed one-way prices on popular routes.",
  },
  {
    icon: Clock3,
    title: "Available 24/7",
    description:
      "Book early morning airport transfers, late-night travel or daytime intercity journeys any day of the week.",
  },
  {
    icon: Car,
    title: "Comfortable Vehicles",
    description:
      "Travel in clean, air-conditioned Toyota Corolla vehicles with more categories being added soon.",
  },
  {
    icon: PhoneCall,
    title: "Instant WhatsApp Support",
    description:
      "Need a custom route or round trip? Our team is available on WhatsApp for fast quotations and booking assistance.",
  },
];

export default function WhyChoose() {
  return (
    <section className="bg-slate-50 py-20">

      <div className="mx-auto max-w-7xl px-6">

        <div className="mx-auto max-w-3xl text-center">

          <span className="rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-[#5BAE4A]">
            Why RentKA
          </span>

          <h2 className="mt-6 text-4xl font-bold text-[#0F2B46]">
            Why Choose RentKA for One Way Drop?
          </h2>

          <p className="mt-6 text-lg leading-8 text-slate-600">
            Whether you're travelling for business, family visits or airport
            connections, RentKA provides reliable intercity transportation with
            transparent pricing, professional drivers and exceptional customer
            service.
          </p>

        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">

          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <div
                key={feature.title}
                className="rounded-3xl bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="mb-6 inline-flex rounded-2xl bg-[#5BAE4A]/10 p-4">
                  <Icon
                    size={32}
                    className="text-[#5BAE4A]"
                  />
                </div>

                <h3 className="text-xl font-bold text-[#0F2B46]">
                  {feature.title}
                </h3>

                <p className="mt-4 leading-7 text-slate-600">
                  {feature.description}
                </p>
              </div>
            );
          })}

        </div>

        <div className="mt-20 rounded-3xl bg-[#0F2B46] p-10 text-white">

          <div className="grid gap-8 md:grid-cols-4 text-center">

            <div>
              <h3 className="text-4xl font-bold text-[#5BAE4A]">
                24/7
              </h3>

              <p className="mt-2 text-slate-200">
                Booking Support
              </p>
            </div>

            <div>
              <h3 className="text-4xl font-bold text-[#5BAE4A]">
                Fuel
              </h3>

              <p className="mt-2 text-slate-200">
                Included
              </p>
            </div>

            <div>
              <h3 className="text-4xl font-bold text-[#5BAE4A]">
                Fixed
              </h3>

              <p className="mt-2 text-slate-200">
                One Way Pricing
              </p>
            </div>

            <div>
              <h3 className="text-4xl font-bold text-[#5BAE4A]">
                100%
              </h3>

              <p className="mt-2 text-slate-200">
                Driver Included
              </p>
            </div>

          </div>

        </div>

      </div>

    </section>
  );
}