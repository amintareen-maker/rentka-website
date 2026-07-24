"use client";

import { useEffect } from "react";
import { trackWhatsAppClick } from "@/lib/tracking";

function inferWhatsAppSource(pathname: string) {
  if (pathname.startsWith("/airport-car-rental")) return "airport_page";
  if (pathname.startsWith("/rent-a-car-")) return "city_page";
  if (pathname.startsWith("/one-way-drop/")) return "route_page";
  if (pathname === "/one-way-drop") return "one_way_drop";
  if (pathname.startsWith("/contact")) return "contact_page";
  if (pathname.startsWith("/blog")) return "blog_page";
  if (pathname === "/") return "homepage";
  return "website";
}

export default function WhatsAppTracking() {
  useEffect(() => {
    function handleClick(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const link = target.closest<HTMLAnchorElement>("a[href]");
      if (!link) return;

      const href = link.href;
      if (!href.includes("wa.me/") && !href.includes("api.whatsapp.com/")) {
        return;
      }

      trackWhatsAppClick(
        link.dataset.whatsappSource || inferWhatsAppSource(window.location.pathname),
      );
    }

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, []);

  return null;
}

