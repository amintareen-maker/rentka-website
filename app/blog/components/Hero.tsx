  import Image from "next/image";

  type HeroProps = {
    category: string;
    title: string;
    description: string;
    image: string;
    updated: string;
    readingTime: string;
  };

  export default function Hero({
    category,
    title,
    description,
    image,
    updated,
    readingTime,
  }: HeroProps) {
    return (
      <section className="bg-white border-b">

        <div className="mx-auto max-w-6xl px-4 py-14">

          <div className="inline-flex rounded-full bg-[#E9F4E6] px-4 py-2 text-sm font-semibold text-[#347A2A]">
            {category}
          </div>

          <h1 className="mt-6 max-w-4xl text-5xl font-extrabold leading-tight text-[#0F2B46] lg:text-6xl">
            {title}
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">
            {description}
          </p>

          <div className="mt-8 flex flex-wrap gap-6 text-sm text-slate-500">

            <span>
              ✍ RentKA Editorial Team
            </span>

            <span>
              📅 {updated}
            </span>

            <span>
              🕒 {readingTime}
            </span>

          </div>

          <div className="mt-12 overflow-hidden rounded-3xl">

  <Image
    src={image}
    alt={title}
    width={1800}
    height={700}
    className="w-full h-auto"
    priority
  />

</div>
        </div>

      </section>
    );
  }