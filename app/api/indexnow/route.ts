import { NextResponse } from "next/server";

const HOST = "https://www.rentka.co";
const HOSTNAME = "www.rentka.co";
const KEY = "d42393107d3a4b5087e9e5cf362a4698";

export async function GET() {
  return NextResponse.json({
    status: "IndexNow API is running",
    service: "RentKA",
    ready: true,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const urlList = body.urlList;

    if (!urlList || !Array.isArray(urlList)) {
      return NextResponse.json(
        { error: "urlList is required" },
        { status: 400 }
      );
    }

    const response = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        host: HOSTNAME,
        key: KEY,
        keyLocation: `${HOST}/${KEY}.txt`,
        urlList,
      }),
    });

    const result = await response.text();

    return NextResponse.json({
      success: response.ok,
      status: response.status,
      response: result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to submit URLs to IndexNow",
      },
      { status: 500 }
    );
  }
}