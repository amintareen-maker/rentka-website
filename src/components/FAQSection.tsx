import Script from "next/script";

type FAQSectionProps = {
  city: string;
};

export default function FAQSection({
  city,
}: FAQSectionProps) {
  const faqs = [
    {
      question: "Is driver included in the rental price?",
      answer:
        "Yes. All RentKA bookings include a professional driver.",
    },
    {
      question: `Do you offer self drive cars in ${city}?`,
      answer:
        "No. RentKA currently provides cars with professional drivers only.",
    },
    {
      question: `Can I book a car for Murree or northern trips from ${city}?`,
      answer:
        "Yes. Customers frequently book Prado, Hiace, Corolla and SUVs for Murree, Nathia Gali, Naran and northern travel.",
    },
    {
      question: `Which areas of ${city} do you serve?`,
      answer:
        city === "Islamabad"
          ? "We serve Islamabad, Rawalpindi, DHA, Bahria Town, Blue Area and surrounding sectors."
          : "We serve Saddar, Bahria Town, Chaklala, DHA, Commercial Market, PWD and surrounding areas.",
    },
  ];

  return (
    <>
      <Script
        id={`faq-schema-${city.toLowerCase()}`}
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

      <section>
        <h2 className="mb-10 text-3xl font-bold text-[var(--rentka-blue)]">
          Frequently Asked Questions
        </h2>

        <div className="space-y-8">
          {faqs.map((faq) => (
            <div key={faq.question}>
              <h3 className="font-semibold text-slate-900">
                {faq.question}
              </h3>

              <p className="mt-2 text-slate-700">
                {faq.answer}
              </p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}