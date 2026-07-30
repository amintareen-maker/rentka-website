import { ReactNode } from "react";
type Section = {
  id: string;
  heading: string;
  content: ReactNode[];
};

type FAQ = {
  question: string;
  answer: string;
};

interface Props {
  introduction: ReactNode;
  sections: Section[];
  faq: FAQ[];
}

export default function ArticleContent({
  introduction,
  sections,
  faq,
}: Props) {
  return (
    <>
    <section id="introduction">
  <h2 className="text-3xl font-bold text-[#0F2B46]">
    Introduction
  </h2>

  <div className="mt-6 space-y-6">
  {introduction}
</div>
</section>
      {sections.map((section) => (
        <section
          key={section.id}
          id={section.id}
          className="mt-14 first:mt-0"
        >
          <h2 className="text-3xl font-bold text-[#0F2B46]">
            {section.heading}
          </h2>

          <div className="mt-6 space-y-6">
            {section.content.map((paragraph, index) => (
  <div
    key={index}
    className="leading-8 text-slate-700 mb-6"
  >
    {paragraph}
  </div>
))}
          </div>
        </section>
      ))}

      <section id="faq" className="mt-16">
        <h2 className="text-3xl font-bold text-[#0F2B46]">
          Frequently Asked Questions
        </h2>

        <div className="mt-8 space-y-5">
          {faq.map((item, index) => (
            <div
              key={index}
              className="rounded-2xl border border-slate-200 p-6"
            >
              <h3 className="font-bold text-lg text-[#0F2B46]">
                {item.question}
              </h3>

              <p className="mt-3 leading-7 text-slate-700">
                {item.answer}
              </p>
            </div>
          ))}
        </div>
            </section>

      {/* RentKA CTA */}

      <section className="mt-20 rounded-3xl bg-[#0F2B46] p-10 text-white">

        <h2 className="text-3xl font-bold">
          Planning Your Trip?
        </h2>

        <p className="mt-4 text-lg text-slate-200 leading-8">
          Whether you&apos;re travelling for business, tourism, airport transfers,
          family vacations or one-way travel, RentKA provides professional
          cars with professional drivers across Pakistan with transparent pricing
          and responsive customer support.
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">

          <div>✅ Instant quotation</div>

          <div>✅ Professional drivers</div>

          <div>✅ Airport transfers</div>

          <div>✅ Corporate travel</div>

          <div>✅ Tourism & family trips</div>

          <div>✅ One-way travel across Pakistan</div>

        </div>

        <div className="mt-10">

          <a
            href="https://wa.me/923020589999?text=Hi%20RentKA,%20I'd%20like%20to%20book%20a%20car."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex rounded-xl bg-[#5BAE4A] px-8 py-4 text-lg font-semibold text-white transition hover:opacity-90"
          >
            Get Quote on WhatsApp
          </a>

        </div>

      </section>
          </>
  );
}
