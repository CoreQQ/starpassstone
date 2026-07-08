import "dotenv/config";

// При копировании переменных в панели хостинга легко прихватить лишний пробел
// или перенос строки — из-за этого, например, часовой пояс " Europe/Rome"
// считается несуществующим. Поэтому все значения аккуратно обрезаем.
function env(name: string): string {
  return (process.env[name] ?? "").trim();
}

function required(name: string): string {
  const v = env(name);
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
      `⚠️ Часовой пояс "${tz}" не распознан (опечатка в TIMEZONE или нет данных ICU). ` +
        `Использую UTC — планёрка/отчёт будут по UTC. ` +
        `Проверьте значение TIMEZONE, например: Europe/Rome`,
    );
    return "UTC";
  }
}

export const config = {
  anthropicApiKey: required("ANTHROPIC_API_KEY"),
  telegramBotToken: required("TELEGRAM_BOT_TOKEN"),
  // Если задан — бот работает только в этой группе (рекомендуется).
  telegramGroupId: env("TELEGRAM_GROUP_ID"),
  model: env("AGENT_MODEL") || "claude-sonnet-5",
  // Быстрая модель для диспетчера (кто должен ответить) — по умолчанию Haiku.
  routerModel: env("ROUTER_MODEL") || "claude-haiku-4-5",
  // Глубина "раздумий" агентов: low = быстро, medium/high = вдумчивее, но дольше.
  agentEffort: (env("AGENT_EFFORT") || "medium") as "low" | "medium" | "high",
  timezone: safeTimezone(env("TIMEZONE") || "Europe/Rome"),
  // Утренняя планёрка по расписанию выключена по умолчанию (экономия токенов) —
  // проводится вручную командой /standup. Чтобы включить, задайте MORNING_HOUR=9.
  morningHour: env("MORNING_HOUR") ? Number(env("MORNING_HOUR")) : -1,
  eveningHour: env("EVENING_HOUR") ? Number(env("EVENING_HOUR")) : 19,
  ownerName: env("OWNER_NAME") || "Владелец",
  businessProfile:
    env("BUSINESS_PROFILE") ||
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
