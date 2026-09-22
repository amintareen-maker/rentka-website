export function airportWhatsAppContext(pathname: string) {
  if (pathname === "/airport-car-rental-islamabad") return { label: "Islamabad Airport Transfer", message: "Hi RentKA, I need help with an Islamabad Airport Transfer." };
  if (pathname === "/airport-car-rental-lahore") return { label: "Lahore Airport Transfer", message: "Hi RentKA, I need help with a Lahore Airport Transfer." };
  if (pathname === "/airport-transfer") return { label: "Airport Transfer", message: "Hi RentKA, I need help choosing an airport transfer." };
  return null;
}