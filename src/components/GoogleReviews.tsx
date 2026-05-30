import Image from "next/image";
import Script from "next/script";

export default function GoogleReviews() {
  const reviews = [
    {
      name: "Maheen Khan",
      review:
        "Driver was very professional and the journey to Islamabad was very comfortable. Highly recommended.",
    },
    {
      name: "Khizar Ali",
      review:
        "Very easy booking process. Driver and car arrived on time. Best service.",
    },
    {
      name: "Hira Asim",
      review:
        "Smooth experience. Booking through the website was simple and hassle-free.",
    },
    {
      name: "Muhammad Asim",
      review:
        "One of the best car rental services in town. Highly recommended.",
    },
    {
      name: "Zohaib Mirza",
      review:
        "Smooth booking process, excellent value for money, respectful driver and clean vehicle.",
    },
    {
      name: "Malik Khalil",
      review:
        "Booking took less than 4 minutes. Multiple vehicle options and transparent pricing.",
    },
  ];

  return (
    <>
      <Script
        id="rentka-aggregate-rating"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            name: "RentKA",
            url: "https://www.rentka.co",
            telephone: "+923020589999",
            areaServed: ["Islamabad", "Rawalpindi"],
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: "5.0",
              reviewCount: "23",
            },
          }),
        }}
      />

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4">

          <div className="overflow-hidden rounded-[36px] border border-slate-200 bg-slate-50 p-8 md:p-12">

            {/* GOOGLE BADGE */}
            <div className="text-center">

              <div className="inline-flex items-center gap-3 rounded-full bg-white border border-slate-200 px-5 py-3 shadow-sm">
                <Image
                  src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg"
                  alt="Google Reviews"
                  width={22}
                  height={22}
                />

                <span className="font-semibold text-slate-700">
                  Google Reviews
                </span>
              </div>

              <h2 className="mt-8 text-4xl md:text-5xl font-extrabold text-[var(--rentka-blue)]">
                Trusted by Customers Across
                <br />
                Islamabad & Rawalpindi
              </h2>

              <p className="mx-auto mt-5 max-w-3xl text-lg text-slate-600">
                Real customer experiences from airport transfers,
                city rides, family travel, weddings, corporate transport,
                and northern trips booked through RentKA.
              </p>

              {/* RATING */}
              <div className="mt-10 flex flex-col items-center">

                <div className="text-7xl font-extrabold text-[var(--rentka-blue)]">
                  5.0
                </div>

                <div className="mt-2 text-3xl text-yellow-500">
                  ★★★★★
                </div>

                <div className="mt-3 text-base font-medium text-slate-600">
                  Based on 23 Verified Google Reviews
                </div>

              </div>
            </div>

            {/* REVIEW CARDS */}
            <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">

              {reviews.map((review) => (
                <div
                  key={review.name}
                  className="rounded-3xl border border-slate-200 bg-white p-6 shadow-md transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="text-lg text-yellow-500">
                    ★★★★★
                  </div>

                  <p className="mt-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                    Verified Customer
                  </p>

                  <p className="mt-4 min-h-[110px] text-slate-700 leading-7">
                    "{review.review}"
                  </p>

                  <div className="mt-5 border-t border-slate-200 pt-4">
                    <p className="font-bold text-slate-900">
                      {review.name}
                    </p>

                    <p className="text-sm text-slate-500">
                      Verified Google Review
                    </p>
                  </div>
                </div>
              ))}

            </div>

            {/* CTA */}
            <div className="mt-14 flex flex-col items-center justify-center gap-4 sm:flex-row">

              <a
                href="https://share.google/JUQF92OFADJxdxbFU"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-2xl bg-[var(--rentka-blue)] px-8 py-4 text-base font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:opacity-90"
              >
                Read Google Reviews
              </a>

              <a
                href="https://g.page/r/CQV0cDwLnEuTEBM/review"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-2xl border border-[var(--rentka-green)] bg-white px-8 py-4 text-base font-bold text-[var(--rentka-green)] transition hover:bg-[var(--rentka-green)] hover:text-white"
              >
                Leave a Review
              </a>

            </div>

            {/* TRUST LINE */}
            <div className="mt-10 text-center text-sm text-slate-500">
              Serving Islamabad • Rawalpindi • Airport Transfers • Corporate Travel •
              Family Trips • Wedding Transport • Northern Tours
            </div>

          </div>

        </div>
      </section>
    </>
  );
}
