import "dotenv/config";

function required(name: string): string {
  const v = process.env[name];
  if (!v) {
    console.error(
      `❌ Не задана переменная окружения ${name}. Скопируйте .env.example в .env и заполните её.`,
    );
    process.exit(1);
  }
  return v;
}

// Проверяем часовой пояс один раз при старте. Если в среде нет данных ICU
// (частый случай на минимальных Node-сборках), не роняем процесс, а откатываемся
// на UTC с понятным предупреждением.
function safeTimezone(tz: string): string {
  try {
    new Intl.DateTimeFormat("en-CA", { timeZone: tz });
    return tz;
  } catch {
    console.warn(
      `⚠️ Часовой пояс "${tz}" недоступен в этой среде (нет данных ICU). ` +
        `Использую UTC. Планёрка/отчёт будут по UTC. ` +
        `Обычно чинится подключением full-icu (см. README).`,
    );
    return "UTC";
  }
}

export const config = {
  anthropicApiKey: required("ANTHROPIC_API_KEY"),
  telegramBotToken: required("TELEGRAM_BOT_TOKEN"),
  // Если задан — бот работает только в этой группе (рекомендуется).
  telegramGroupId: process.env.TELEGRAM_GROUP_ID || "",
  model: process.env.AGENT_MODEL || "claude-opus-4-8",
  // Быстрая модель для диспетчера (кто должен ответить) — по умолчанию Haiku.
  routerModel: process.env.ROUTER_MODEL || "claude-haiku-4-5",
  // Глубина "раздумий" агентов: low = быстро, medium/high = вдумчивее, но дольше.
  agentEffort: (process.env.AGENT_EFFORT || "low") as "low" | "medium" | "high",
  timezone: safeTimezone(process.env.TIMEZONE || "Europe/Rome"),
  morningHour: Number(process.env.MORNING_HOUR ?? 9),
  eveningHour: Number(process.env.EVENING_HOUR ?? 19),
  ownerName: process.env.OWNER_NAME || "Владелец",
  businessProfile:
    process.env.BUSINESS_PROFILE ||
    [
      "Компания Starpass Stone — натуральный камень в дизайне с 1998 года.",
      "Направления: камины (классические, электро, био), хаммамы, сауны, столешницы,",
      "ванные комнаты из камня, мраморные колонны, лестницы, уличные BBQ.",
      "Полный цикл: дизайн-проект, поставка камня, изготовление, монтаж, авторское сопровождение.",
      "Целевые рынки: Лазурный берег Франции (Ницца, Канны, Сен-Тропе, Монако),",
      "США (Майами, Лос-Анджелес), Кипр, Испания (Марбелья, Мадрид, Барселона),",
      "Центральная Европа (Германия, Австрия, Швейцария), Англия (Лондон), Ирландия (Дублин).",
      "Сегмент — премиум: виллы, резиденции, пентхаусы, бутик-отели, спа, яхтенные марины.",
      "Клиенты: состоятельные частные заказчики, дизайнеры интерьеров, архитекторы,",
      "девелоперы премиальной недвижимости. Сайт: starpassstone.net",
    ].join(" "),
};
