import { NextRequest, NextResponse } from "next/server";

const permanentRedirects: Record<string, string> = {
  "/rent-a-car/islamabad": "/rent-a-car-islamabad",
  "/one-way-drop/islamabad-to-Peshawar":
    "/one-way-drop/islamabad-to-peshawar",
  "/one-way-drop/islamabad-to-Peshawr":
    "/one-way-drop/islamabad-to-peshawar",
};

export function proxy(request: NextRequest) {
  const destination = permanentRedirects[request.nextUrl.pathname];

  if (!destination) {
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL(destination, request.url), 308);
}

export const config = {
  matcher: ["/rent-a-car/:path*", "/one-way-drop/:path*"],
};
