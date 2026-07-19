import Link from "next/link";
import { ReactNode } from "react";

const internalLinks: Record<string, string> = {
  "rent a car in Islamabad": "/rent-a-car-islamabad",
  "rent a car in Rawalpindi": "/rent-a-car-rawalpindi",

  "airport transfers": "/airport-car-rental-islamabad",
  "Islamabad International Airport": "/airport-car-rental-islamabad",

  "one-way car rental": "/one-way-drop",

  "Toyota Corolla": "/cars/toyota-corolla/islamabad/with-driver",
  "Honda BR-V": "/cars/honda-br-v/islamabad/with-driver",
  "Toyota Prado": "/cars/toyota-prado/islamabad/with-driver",
  "Toyota Hiace": "/cars/toyota-hiace/islamabad/with-driver",

  "Islamabad to Lahore": "/one-way-drop/islamabad-to-lahore",
  "Islamabad to Murree": "/one-way-drop/islamabad-to-murree",
  "Islamabad to Peshawar": "/one-way-drop/islamabad-to-peshawar",
  "Islamabad to Abbottabad": "/one-way-drop/islamabad-to-abbottabad",
  "Islamabad to Naran": "/one-way-drop/islamabad-to-naran",
};

function renderParagraph(text: string) {
  let parts: ReactNode[] = [text];

  Object.entries(internalLinks).forEach(([keyword, href]) => {
    parts = parts.flatMap((part) => {
      if (typeof part !== "string") return [part];

      const split = part.split(keyword);

      if (split.length === 1) return [part];

      const result: ReactNode[] = [];

      split.forEach((segment, index) => {
        result.push(segment);

        if (index < split.length - 1) {
          result.push(
            <Link
              key={`${keyword}-${index}`}
              href={href}
              className="font-medium text-[#5BAE4A] hover:underline"
            >
              {keyword}
            </Link>
          );
        }
      });

      return result;
    });
  });

  return parts;
}
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
          Whether you're travelling for business, tourism, airport transfers,
          family vacations or one-way travel, RentKA provides professional
          chauffeur-driven vehicles across Pakistan with transparent pricing
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
            href="https://wa.me/923171111552?text=Hi%20RentKA,%20I'd%20like%20to%20book%20a%20car."
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