export interface VehiclePricing {
  available: boolean;
  price: number | null;
  currency: "PKR";
  bookingType: "One Way";
  includesFuel: boolean;
}

export interface IntercityRoute {
  slug: string;

  from: string;
  to: string;

  distanceKm: number;
  duration: string;

  featured: boolean;
  popular: boolean;
  seasonal: boolean;
  active: boolean;

  oneWayOnly: boolean;

  vehicles: {
    corolla: VehiclePricing;
    brv: VehiclePricing | null;
    civic: VehiclePricing | null;
    fortuner: VehiclePricing | null;
    hiace: VehiclePricing | null;
  };
}

export const intercityRoutes: IntercityRoute[] = [
  {
    slug: "islamabad-to-lahore",
    from: "Islamabad",
    to: "Lahore",

    distanceKm: 380,
    duration: "4.5–5 Hours",

    featured: true,
    popular: true,
    seasonal: false,
    active: true,

    oneWayOnly: true,

    vehicles: {
      corolla: {
        available: true,
        price: 19500,
        currency: "PKR",
        bookingType: "One Way",
        includesFuel: true,
      },
      brv: null,
      civic: null,
      fortuner: null,
      hiace: null,
    },
  },

  {
    slug: "lahore-to-islamabad",
    from: "Lahore",
    to: "Islamabad",

    distanceKm: 380,
    duration: "4.5–5 Hours",

    featured: true,
    popular: true,
    seasonal: false,
    active: true,

    oneWayOnly: true,

    vehicles: {
      corolla: {
        available: true,
        price: 19500,
        currency: "PKR",
        bookingType: "One Way",
        includesFuel: true,
      },
      brv: null,
      civic: null,
      fortuner: null,
      hiace: null,
    },
  },

  {
    slug: "islamabad-to-peshawar",
    from: "Islamabad",
    to: "Peshawar",

    distanceKm: 185,
    duration: "2–2.5 Hours",

    featured: true,
    popular: true,
    seasonal: false,
    active: true,

    oneWayOnly: true,

    vehicles: {
      corolla: {
        available: true,
        price: 11000,
        currency: "PKR",
        bookingType: "One Way",
        includesFuel: true,
      },
      brv: null,
      civic: null,
      fortuner: null,
      hiace: null,
    },
  },

  {
    slug: "peshawar-to-islamabad",
    from: "Peshawar",
    to: "Islamabad",

    distanceKm: 185,
    duration: "2–2.5 Hours",

    featured: true,
    popular: true,
    seasonal: false,
    active: true,

    oneWayOnly: true,

    vehicles: {
      corolla: {
        available: true,
        price: 11500,
        currency: "PKR",
        bookingType: "One Way",
        includesFuel: true,
      },
      brv: null,
      civic: null,
      fortuner: null,
      hiace: null,
    },
  },

  {
    slug: "islamabad-to-faisalabad",
    from: "Islamabad",
    to: "Faisalabad",

    distanceKm: 320,
    duration: "4 Hours",

    featured: true,
    popular: true,
    seasonal: false,
    active: true,

    oneWayOnly: true,

    vehicles: {
      corolla: {
        available: true,
        price: 18000,
        currency: "PKR",
        bookingType: "One Way",
        includesFuel: true,
      },
      brv: null,
      civic: null,
      fortuner: null,
      hiace: null,
    },
  },

  {
    slug: "faisalabad-to-islamabad",
    from: "Faisalabad",
    to: "Islamabad",

    distanceKm: 320,
    duration: "4 Hours",

    featured: true,
    popular: true,
    seasonal: false,
    active: true,

    oneWayOnly: true,

    vehicles: {
      corolla: {
        available: true,
        price: 18000,
        currency: "PKR",
        bookingType: "One Way",
        includesFuel: true,
      },
      brv: null,
      civic: null,
      fortuner: null,
      hiace: null,
    },
  },
    {
    slug: "islamabad-to-murree",
    from: "Islamabad",
    to: "Murree",

    distanceKm: 65,
    duration: "1.5 Hours",

    featured: true,
    popular: true,
    seasonal: false,
    active: true,

    oneWayOnly: true,

    vehicles: {
      corolla: {
        available: true,
        price: 11000,
        currency: "PKR",
        bookingType: "One Way",
        includesFuel: true,
      },
      brv: null,
      civic: null,
      fortuner: null,
      hiace: null,
    },
  },

  {
    slug: "murree-to-islamabad",
    from: "Murree",
    to: "Islamabad",

    distanceKm: 65,
    duration: "1.5 Hours",

    featured: true,
    popular: true,
    seasonal: false,
    active: true,

    oneWayOnly: true,

    vehicles: {
      corolla: {
        available: true,
        price: 15000,
        currency: "PKR",
        bookingType: "One Way",
        includesFuel: true,
      },
      brv: null,
      civic: null,
      fortuner: null,
      hiace: null,
    },
  },

  {
    slug: "islamabad-to-abbottabad",
    from: "Islamabad",
    to: "Abbottabad",

    distanceKm: 125,
    duration: "2.5 Hours",

    featured: true,
    popular: true,
    seasonal: false,
    active: true,

    oneWayOnly: true,

    vehicles: {
      corolla: {
        available: true,
        price: 11000,
        currency: "PKR",
        bookingType: "One Way",
        includesFuel: true,
      },
      brv: null,
      civic: null,
      fortuner: null,
      hiace: null,
    },
  },

  {
    slug: "abbottabad-to-islamabad",
    from: "Abbottabad",
    to: "Islamabad",

    distanceKm: 125,
    duration: "2.5 Hours",

    featured: true,
    popular: true,
    seasonal: false,
    active: true,

    oneWayOnly: true,

    vehicles: {
      corolla: {
        available: true,
        price: 11000,
        currency: "PKR",
        bookingType: "One Way",
        includesFuel: true,
      },
      brv: null,
      civic: null,
      fortuner: null,
      hiace: null,
    },
  },

  {
    slug: "islamabad-to-naran",
    from: "Islamabad",
    to: "Naran",

    distanceKm: 280,
    duration: "6–7 Hours",

    featured: true,
    popular: true,
    seasonal: true,
    active: true,

    oneWayOnly: true,

    vehicles: {
      corolla: {
        available: true,
        price: 22000,
        currency: "PKR",
        bookingType: "One Way",
        includesFuel: true,
      },
      brv: null,
      civic: null,
      fortuner: null,
      hiace: null,
    },
  },

  {
    slug: "naran-to-islamabad",
    from: "Naran",
    to: "Islamabad",

    distanceKm: 280,
    duration: "6–7 Hours",

    featured: true,
    popular: true,
    seasonal: true,
    active: true,

    oneWayOnly: true,

    vehicles: {
      corolla: {
        available: true,
        price: 22000,
        currency: "PKR",
        bookingType: "One Way",
        includesFuel: true,
      },
      brv: null,
      civic: null,
      fortuner: null,
      hiace: null,
    },
  },
];