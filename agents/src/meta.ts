import { config } from "./config.js";

// Meta (Facebook/Instagram) Marketing API — официальный доступ к рекламному
// кабинету. Работает только когда заданы META_ACCESS_TOKEN и META_AD_ACCOUNT_ID.

const BASE = () => `https://graph.facebook.com/${config.metaApiVersion}`;

export function metaConfigured(): boolean {
  return Boolean(config.metaAccessToken && config.metaAdAccountId);
}

function account(): string {
  const id = config.metaAdAccountId;
  return id.startsWith("act_") ? id : `act_${id}`;
}

async function metaCall(
  method: "GET" | "POST",
  path: string,
  params: Record<string, string> = {},
): Promise<string> {
  const url = new URL(`${BASE()}/${path}`);
  const body = new URLSearchParams({ ...params, access_token: config.metaAccessToken });
  let res: Response;
  if (method === "GET") {
    url.search = body.toString();
    res = await fetch(url);
  } else {
    res = await fetch(url, { method: "POST", body });
  }
  const text = await res.text();
  if (!res.ok) {
    // Возвращаем текст ошибки агенту — он объяснит её владельцу по-человечески.
    return `Ошибка Meta API (${res.status}): ${text.slice(0, 600)}`;
  }
  return text.slice(0, 4000);
}

export async function listCampaigns(): Promise<string> {
  return metaCall("GET", `${account()}/campaigns`, {
    fields: "id,name,status,objective,daily_budget,lifetime_budget,created_time",
    limit: "25",
  });
}

export async function campaignInsights(datePreset: string): Promise<string> {
  return metaCall("GET", `${account()}/insights`, {
    fields: "campaign_name,spend,impressions,clicks,cpc,cpm,actions",
    level: "campaign",
    date_preset: datePreset || "last_7d",
  });
}

export async function createCampaign(
  name: string,
  objective: string,
  dailyBudgetCents?: number,
): Promise<string> {
  const params: Record<string, string> = {
    name,
    objective,
    status: "PAUSED", // всегда создаём на паузе — включает владелец
    special_ad_categories: "[]",
  };
  if (dailyBudgetCents && dailyBudgetCents > 0) {
    params.daily_budget = String(dailyBudgetCents);
  }
  return metaCall("POST", `${account()}/campaigns`, params);
}

export async function setCampaignStatus(
  campaignId: string,
  status: "ACTIVE" | "PAUSED",
): Promise<string> {
  return metaCall("POST", campaignId, { status });
}

export async function setCampaignDailyBudget(
  campaignId: string,
  dailyBudgetCents: number,
): Promise<string> {
  return metaCall("POST", campaignId, { daily_budget: String(dailyBudgetCents) });
}
