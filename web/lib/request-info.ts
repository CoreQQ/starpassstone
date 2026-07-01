// Extracts visitor metadata (IP, geo, device, OS, browser, language, referrer)
// from an incoming request. Geo fields are read from edge/CDN headers when
// available (Vercel, Cloudflare) and degrade gracefully to "Unknown" otherwise.

export type RequestInfo = {
  ip: string;
  country: string;
  city: string;
  provider: string;
  device: string;
  os: string;
  browser: string;
  language: string;
};

function header(h: Headers, name: string): string {
  return (h.get(name) || "").trim();
}

/** Best-effort client IP from the usual proxy headers. */
export function getIp(h: Headers): string {
  const fwd = header(h, "x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return (
    header(h, "x-real-ip") ||
    header(h, "cf-connecting-ip") ||
    header(h, "x-vercel-forwarded-for") ||
    "Unknown"
  );
}

/** Parse a User-Agent string into device / OS / browser labels. */
export function parseUserAgent(ua: string): {
  device: string;
  os: string;
  browser: string;
} {
  const u = ua || "";
  const isTablet = /iPad|Tablet|PlayBook|Silk|(Android(?!.*Mobile))/i.test(u);
  const isMobile = /Mobi|iPhone|iPod|Android.*Mobile|Windows Phone|IEMobile/i.test(u);
  const device = isTablet ? "Tablet" : isMobile ? "Mobile" : "Desktop";

  let os = "Unknown";
  if (/Windows NT 10/i.test(u)) os = "Windows 10/11";
  else if (/Windows NT/i.test(u)) os = "Windows";
  else if (/iPhone|iPad|iPod/i.test(u)) os = "iOS";
  else if (/Mac OS X/i.test(u)) os = "macOS";
  else if (/Android/i.test(u)) os = "Android";
  else if (/Linux/i.test(u)) os = "Linux";
  else if (/CrOS/i.test(u)) os = "ChromeOS";

  let browser = "Unknown";
  if (/Edg\//i.test(u)) browser = "Edge";
  else if (/OPR\/|Opera/i.test(u)) browser = "Opera";
  else if (/Chrome\//i.test(u) && !/Chromium/i.test(u)) browser = "Chrome";
  else if (/Firefox\//i.test(u)) browser = "Firefox";
  else if (/Safari\//i.test(u) && /Version\//i.test(u)) browser = "Safari";
  else if (/MSIE|Trident/i.test(u)) browser = "Internet Explorer";

  return { device, os, browser };
}

/** Primary language from the Accept-Language header (or an explicit override). */
function primaryLanguage(h: Headers, override?: string): string {
  const raw = override || header(h, "accept-language");
  if (!raw) return "Unknown";
  return raw.split(",")[0].split(";")[0].trim() || "Unknown";
}

export function readRequestInfo(
  h: Headers,
  override?: { language?: string; userAgent?: string }
): RequestInfo {
  const ua = override?.userAgent || header(h, "user-agent");
  const { device, os, browser } = parseUserAgent(ua);
  return {
    ip: getIp(h),
    country:
      header(h, "x-vercel-ip-country") ||
      header(h, "cf-ipcountry") ||
      "Unknown",
    city:
      decodeURIComponent(header(h, "x-vercel-ip-city") || "") ||
      "Unknown",
    provider: header(h, "x-vercel-ip-org") || "Unknown",
    device,
    os,
    browser,
    language: primaryLanguage(h, override?.language),
  };
}
