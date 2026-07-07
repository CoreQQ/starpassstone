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

export const config = {
  anthropicApiKey: required("ANTHROPIC_API_KEY"),
  telegramBotToken: required("TELEGRAM_BOT_TOKEN"),
  // Если задан — бот работает только в этой группе (рекомендуется).
  telegramGroupId: process.env.TELEGRAM_GROUP_ID || "",
  model: process.env.AGENT_MODEL || "claude-opus-4-8",
  timezone: process.env.TIMEZONE || "Europe/Dublin",
  morningHour: Number(process.env.MORNING_HOUR ?? 9),
  eveningHour: Number(process.env.EVENING_HOUR ?? 19),
  ownerName: process.env.OWNER_NAME || "Владелец",
  businessProfile:
    process.env.BUSINESS_PROFILE ||
    [
      "Компания Starpass Stone (Дублин, Ирландия) — натуральный камень в дизайне с 1998 года.",
      "Направления: камины (классические, электро, био), хаммамы, сауны, столешницы,",
      "ванные комнаты из камня, мраморные колонны, лестницы, уличные BBQ.",
      "Полный цикл: дизайн-проект, поставка камня, изготовление, монтаж, авторское сопровождение.",
      "Клиенты: частные заказчики, дизайнеры, архитекторы, строительные компании.",
      "Сайт: starpassstone.net",
    ].join(" "),
};
