import Link from "next/link";

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
    <section className="bg-slate-50 border-y border-slate-200 py-16">
      <div className="mx-auto max-w-7xl px-4">

        {/* Heading */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 rounded-full bg-white border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm">
            ⭐ Google Reviews
          </div>

          <h2 className="mt-6 text-3xl font-bold text-slate-900">
            Trusted by Customers Across Islamabad & Rawalpindi
          </h2>

          <p className="mt-4 text-slate-600">
            RentKA is proud to maintain a perfect Google rating from verified
            customers who have booked airport transfers, city rides, and
            outstation trips through our platform.
          </p>

          <div className="mt-6 flex items-center justify-center gap-3">
            <span className="text-4xl font-bold text-[var(--rentka-blue)]">
              5.0
            </span>

            <div>
              <div className="text-yellow-500 text-xl">
                ★★★★★
              </div>

              <div className="text-sm text-slate-600">
                Based on 23 Google Reviews
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {reviews.map((review) => (
            <div
              key={review.name}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition"
            >
              <div className="mb-3 text-yellow-500 text-lg">
                ★★★★★
              </div>

              <p className="text-slate-700 leading-relaxed">
                "{review.review}"
              </p>

              <div className="mt-5 border-t pt-4">
                <p className="font-semibold text-slate-900">
                  {review.name}
                </p>

                <p className="text-sm text-slate-500">
                  Verified Google Review
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="https://share.google/JUQF92OFADJxdxbFU"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-lg bg-[var(--rentka-blue)] px-6 py-3 text-white font-semibold hover:opacity-90 transition"
          >
            Read Google Reviews
          </a>

          <a
            href="https://g.page/r/CQV0cDwLnEuTEBM/review"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-lg border border-[var(--rentka-green)] px-6 py-3 font-semibold text-[var(--rentka-green)] hover:bg-[var(--rentka-green)] hover:text-white transition"
          >
            Leave a Review
          </a>
        </div>

        {/* Trust Line */}
        <div className="mt-10 text-center text-sm text-slate-500">
          Serving Islamabad, Rawalpindi, Airport Transfers, Corporate Travel,
          Family Trips, and Outstation Rentals.
        </div>
      </div>
    </section>
  );
}