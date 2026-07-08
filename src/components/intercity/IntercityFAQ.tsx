import Script from "next/script";

const faqs = [
  {
    question: "Are the published prices final?",
    answer:
      "Yes. The listed one-way prices for Toyota Corolla include a professional driver and fuel. Additional charges only apply if your journey changes or extra services are requested.",
  },

  {
    question: "Are fuel charges included?",
    answer:
      "Yes. All published one-way drop prices include fuel, allowing you to book with confidence and without hidden costs.",
  },

  {
    question: "Do you provide round trips?",
    answer:
      "Yes. Round trips are available on quotation. The final price depends on waiting time, return date, route and trip duration.",
  },

  {
    question: "Can I book a custom destination?",
    answer:
      "Absolutely. If your destination is not listed, contact RentKA on WhatsApp and we'll prepare a personalised quotation.",
  },

  {
    question: "Which vehicles are available?",
    answer:
      "Currently fixed pricing is available for Toyota Corolla. Additional categories including BR-V, Civic, Prado, Fortuner and Hiace will be added progressively.",
  },

  {
    question: "Can I travel to northern areas?",
    answer:
      "Yes. We provide transport to Murree, Abbottabad, Naran, Kaghan and many other destinations. Custom quotations are available for seasonal routes.",
  },

  {
    question: "How do I confirm my booking?",
    answer:
      "You can confirm your booking by contacting RentKA on WhatsApp or by submitting an enquiry through our website. Our team will confirm vehicle availability and pickup details.",
  },

  {
    question: "Is the service available 24 hours?",
    answer:
      "Yes. Advance booking is recommended, but our team accepts bookings 24 hours a day depending on vehicle availability.",
  },
];

export default function IntercityFAQ() {
  return (
    <>
      <Script
        id="intercity-faq-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map((faq) => ({
              "@type": "Question",
              name: faq.question,
              acceptedAnswer: {
                "@type": "Answer",
                text: faq.answer,
              },
            })),
          }),
        }}
      />

      <section className="py-20 bg-white">

        <div className="mx-auto max-w-5xl px-6">

          <div className="text-center">

            <span className="rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-[#5BAE4A]">
              Frequently Asked Questions
            </span>

            <h2 className="mt-6 text-4xl font-bold text-[#0F2B46]">
              Intercity Car Rental FAQs
            </h2>

            <p className="mt-6 text-lg leading-8 text-slate-600">
              Everything you need to know before booking your one-way
              intercity journey with RentKA.
            </p>

          </div>

          <div className="mt-16 space-y-8">

            {faqs.map((faq) => (

              <div
                key={faq.question}
                className="rounded-2xl border border-slate-200 p-8 hover:shadow-md transition"
              >

                <h3 className="text-xl font-semibold text-[#0F2B46]">
                  {faq.question}
                </h3>

                <p className="mt-4 leading-8 text-slate-600">
                  {faq.answer}
                </p>

              </div>

            ))}

          </div>

        </div>

      </section>
    </>
  );
}