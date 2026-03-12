import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const BOT_PATTERNS = [
  /bot/i,
  /crawl/i,
  /spider/i,
  /scraper/i,
  /headless/i,
  /wget/i,
  /curl/i,
  /python-requests/i,
  /go-http-client/i,
  /node-fetch/i,
  /axios/i,
  /httpx/i,
  /ahrefs/i,
  /semrush/i,
  /mj12bot/i,
  /dotbot/i,
  /petalbot/i,
  /bytespider/i,
  /gptbot/i,
  /claudebot/i,
  /ccbot/i,
  /anthropic/i,
  /facebookexternalhit/i,
  /twitterbot/i,
];

// Allow these specific bots (needed for SEO/social previews)
const ALLOWED_BOTS = [
  /googlebot/i,
  /bingbot/i,
  /facebookexternalhit/i,
  /twitterbot/i,
  /slackbot/i,
  /linkedinbot/i,
  /whatsapp/i,
  /telegrambot/i,
  /discordbot/i,
];

function isBlockedBot(ua: string): boolean {
  if (!ua) return false;
  const isAllowed = ALLOWED_BOTS.some((pattern) => pattern.test(ua));
  if (isAllowed) return false;
  return BOT_PATTERNS.some((pattern) => pattern.test(ua));
}

export function middleware(request: NextRequest) {
  const ua = request.headers.get("user-agent") || "";

  // Block known bad bots with 403
  if (isBlockedBot(ua)) {
    return new NextResponse(null, { status: 403 });
  }

  // Add security headers
  const response = NextResponse.next();
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  return response;
}

export const config = {
  // Only run on dynamic routes - skip static assets, images, and _next
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|models/|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf|eot)$).*)",
  ],
};
