import { config } from "./config.js";
import { ASSISTANT } from "./agents.js";
import { getMe, getUpdates, sendMessage, sendTyping, TgUpdate } from "./telegram.js";
import { runAgent } from "./orchestrator.js";
import { isChatter } from "./filter.js";
import { startScheduler } from "./scheduler.js";
import { store } from "./store.js";
import * as mail from "./mail.js";
import * as gmail from "./gmail.js";

function historyText(chatId: string): string {
  return store
    .getHistory(chatId)
    .map((m) => `${m.from}: ${m.text}`)
    .join("\n");
}

// Сообщение считается адресованным ассистенту, если начинается с одного из этих слов.
const NAME_TRIGGERS = ["starpass", "старпасс", "бот", "ассистент"];

const HELP = [
  "🤖 Starpass — ваш AI-ассистент. Один, но делает всё:",
  "клиенты и продажи, реклама, поиск объектов, снабжение, почта и расчёты.",
  "",
  "Как пользоваться:",
  "• Просто напишите задачу в группу или в личку — ассистент возьмёт её в работу.",
  "• Он сам ищет в интернете и считает кодом (сметы, площади, цены, конвертации).",
  "• Скажите «запомни: ...» — это станет постоянным правилом (/notes — посмотреть).",
  "• /tasks — задачи, /cleartasks — закрыть все, /standup — план на сегодня.",
  "• /gmailauth — подключить Gmail (в рабочей группе), /mailtest — проверить почту.",
].join("\n");

// Telegram гасит «печатает…» через ~5 секунд. Пока ассистент работает
// (поиск, расчёты), обновляем индикатор, чтобы было видно: он не завис.
function keepTyping(chatId: number): () => void {
  void sendTyping(chatId);
  const timer = setInterval(() => void sendTyping(chatId), 4500);
  return () => clearInterval(timer);
}

async function handleCommand(
  chatId: number,
  cmd: string,
  text: string,
  inTeamGroup: boolean,
): Promise<boolean> {
  const publish = (t: string) => sendMessage(chatId, t);
  switch (cmd) {
    case "/gmailauth": {
      // Только из рабочей группы: иначе посторонний мог бы написать боту в личку
      // и подменить ящик, с которого уходят письма клиентам.
      if (!inTeamGroup) {
        await publish("Подключать почту можно только в рабочей группе.");
        return true;
      }
      if (!gmail.gmailClientConfigured()) {
        await publish(
          "Сначала добавьте на Railway переменные GMAIL_CLIENT_ID и GMAIL_CLIENT_SECRET " +
            "(ключи приложения из Google Cloud), дождитесь перезапуска и повторите /gmailauth.",
        );
        return true;
      }
      await publish(
        [
          "🔐 Подключение Gmail",
          "",
          `1. Откройте ссылку: ${gmail.startAuth()}`,
          "2. Войдите в аккаунт, с которого будут уходить письма клиентам.",
          "3. Если Google напишет «Приложение не проверено» — нажмите «Дополнительно» → «Перейти на страницу…». Это ваше собственное приложение, так и должно быть.",
          "4. Разрешите доступ к отправке и чтению почты.",
          "5. Откроется страница с ошибкой «Не удаётся открыть страницу» — это нормально. Скопируйте ПОЛНЫЙ адрес этой страницы из адресной строки (начинается с http://localhost) и отправьте сюда так:",
          "/gmailcode <адрес страницы>",
          "",
          "Ссылка действует 15 минут.",
        ].join("\n"),
      );
      return true;
    }
    case "/gmailcode": {
      if (!inTeamGroup) {
        await publish("Подключать почту можно только в рабочей группе.");
        return true;
      }
      const arg = text.replace(/^\/\S+/, "").trim();
      if (!arg) {
        await publish("Отправьте адрес страницы так: /gmailcode http://localhost/?state=...&code=...");
        return true;
      }
      try {
        await publish(await gmail.finishAuth(arg));
      } catch (err) {
        await publish(`❌ Не получилось подключить Gmail: ${(err as Error).message}`);
      }
      return true;
    }
    case "/start":
    case "/help":
      await publish(HELP);
      return true;
    case "/tasks": {
      const tasks = store.openTasks(30);
      await publish(
        tasks.length
          ? "📋 Открытые задачи:\n" +
              tasks.map((t) => `#${t.id} [${t.priority}] ${t.title} — ${t.createdBy}`).join("\n")
          : "Открытых задач нет 🎉",
      );
      return true;
    }
    case "/mailtest": {
      await publish(await mail.verifyMail());
      return true;
    }
    case "/notes": {
      const notes = store.notes(80);
      await publish(
        notes.length
          ? "🧠 Постоянная память:\n" + notes.map((n) => `#${n.id} ${n.text}`).join("\n")
          : "Память пока пуста. Скажите «запомни: ...» — и я запишу.",
      );
      return true;
    }
    case "/cleartasks": {
      const n = store.completeAllTasks();
      await publish(n > 0 ? `🧹 Закрыл все открытые задачи: ${n} шт.` : "Открытых задач и так нет.");
      return true;
    }
    case "/standup": {
      const stop = keepTyping(chatId);
      try {
        const answer = await runAgent(
          ASSISTANT,
          "Владелец просит план на сегодня. Предложи 2–3 самых полезных шага для бизнеса по всем направлениям (клиенты, реклама, объекты, снабжение) с учётом памяти и открытых задач. По-человечески, без официоза. Задачи не создавай.",
          historyText(String(chatId)),
          publish,
        );
        await publish(answer);
      } finally {
        stop();
      }
      return true;
    }
    default:
      return false;
  }
}

async function handleMessage(update: TgUpdate, botId: number, botUsername: string): Promise<void> {
  const msg = update.message;
  if (!msg?.text || msg.from?.is_bot) return;

  const chatId = msg.chat.id;
  const chatKey = String(chatId);

  // Работаем в настроенной группе и в личных сообщениях любому пользователю.
  // Чужие группы (куда бота могли добавить посторонние) игнорируем.
  const isPrivateChat = msg.chat.type === "private";
  if (config.telegramGroupId && chatKey !== config.telegramGroupId && !isPrivateChat) return;

  let text = msg.text.trim();

  // Команды.
  const cmd = text.split(/[\s@]/)[0];
  if (cmd.startsWith("/")) {
    // Рабочая группа — та, что задана в TELEGRAM_GROUP_ID. Если она не задана,
    // «доверенной» группы нет, и подключение почты недоступно.
    const inTeamGroup = Boolean(config.telegramGroupId) && chatKey === config.telegramGroupId;
    if (await handleCommand(chatId, cmd, text, inTeamGroup)) return;
  }

  const mentioned = text.includes(`@${botUsername}`);
  text = text.replace(`@${botUsername}`, "").trim();
  const isReplyToBot = msg.reply_to_message?.from?.id === botId;
  const isPrivate = msg.chat.type === "private";
  const firstWord = text.split(/[\s,:!?—-]+/)[0]?.toLowerCase() ?? "";
  const calledByName = NAME_TRIGGERS.includes(firstWord);
  const addressedToBot = mentioned || isReplyToBot || isPrivate || calledByName;

  const from = msg.from?.first_name || msg.from?.username || "Пользователь";
  const context = historyText(chatKey);
  store.addHistory(chatKey, {
    from,
    kind: "human",
    text,
    ts: new Date().toISOString(),
  });

  // Адресовано напрямую — отвечаем всегда. Иначе (в группе) отвечаем на всё,
  // кроме «ок/спасибо/эмодзи» и ответов одного человека другому.
  const replyToOtherHuman =
    !!msg.reply_to_message?.from &&
    !msg.reply_to_message.from.is_bot &&
    msg.reply_to_message.from.id !== botId;
  if (!addressedToBot && isChatter(text, replyToOtherHuman)) {
    console.log(`Пропускаю реплику (не к ассистенту): «${text.slice(0, 60)}»`);
    return;
  }

  const agent = ASSISTANT;
  const publish = (t: string) => sendMessage(chatId, t);
  const stopTyping = keepTyping(chatId);

  try {
    const answer = await runAgent(agent, `${from}: ${text}`, context, publish);
    await sendMessage(chatId, answer);
    store.addHistory(chatKey, {
      from: agent.name,
      kind: "agent",
      text: answer.slice(0, 1500),
      ts: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Ошибка ассистента:", err);
    await sendMessage(
      chatId,
      `⚠️ Не получилось ответить: ${err instanceof Error ? err.message : "ошибка"}. Попробуйте ещё раз.`,
    );
  } finally {
    stopTyping();
  }
}

// Страховка: никакая единичная ошибка не должна ронять весь сервис.
process.on("unhandledRejection", (reason) => {
  console.error("⚠️ Необработанная ошибка (продолжаю работу):", reason);
});
process.on("uncaughtException", (err) => {
  console.error("⚠️ Непойманное исключение (продолжаю работу):", err);
});

// Плановая остановка (редеплой на Railway) — выходим тихо, без npm error.
for (const signal of ["SIGTERM", "SIGINT"] as const) {
  process.on(signal, () => {
    console.log(`👋 Получен ${signal} — останавливаюсь (плановый редеплой).`);
    process.exit(0);
  });
}

async function main(): Promise<void> {
  const me = await getMe();
  console.log(
    `✅ Бот @${me.username} запущен. Модель: ${config.model} (единый ассистент Starpass)`,
  );
  console.log(
    config.telegramGroupId
      ? `Работаю только в группе ${config.telegramGroupId}`
      : "⚠️ TELEGRAM_GROUP_ID не задан — отвечаю во всех чатах, куда меня добавят.",
  );

  if (config.telegramGroupId) {
    startScheduler((text) => sendMessage(config.telegramGroupId, text));
    const morning =
      config.morningHour >= 0 && config.morningHour <= 23
        ? `планёрка в ${config.morningHour}:00`
        : "планёрка вручную (/standup)";
    console.log(`⏰ ${morning}, отчёт в ${config.eveningHour}:00 (${config.timezone})`);
  } else {
    console.log("⏰ Планировщик выключен (нужен TELEGRAM_GROUP_ID).");
  }

  let offset = 0;
  // Основной цикл: длинный поллинг Telegram. Обработку сообщений НЕ ждём —
  // иначе долгий ответ (веб-поиск) заблокировал бы приём новых сообщений.
  // Внутри одного чата сообщения всё равно идут по очереди (см. enqueue).
  for (;;) {
    try {
      const updates = await getUpdates(offset);
      for (const update of updates) {
        offset = update.update_id + 1;
        enqueue(update, me.id, me.username);
      }
    } catch (err) {
      console.error("Ошибка цикла обновлений:", err);
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
}

// Очередь на каждый чат: сообщения в одном чате обрабатываются по порядку,
// но разные чаты и главный цикл поллинга друг друга не блокируют.
const chatQueues = new Map<number, Promise<void>>();
function enqueue(update: TgUpdate, botId: number, botUsername: string): void {
  const chatId = update.message?.chat.id;
  if (chatId === undefined) return;
  const prev = chatQueues.get(chatId) ?? Promise.resolve();
  const next = prev
    .catch(() => {})
    .then(() => handleMessage(update, botId, botUsername))
    .catch((err) => console.error("Ошибка обработки сообщения:", err));
  chatQueues.set(chatId, next);
  // Убираем завершённую цепочку, чтобы Map не рос бесконечно.
  next.finally(() => {
    if (chatQueues.get(chatId) === next) chatQueues.delete(chatId);
  });
}

main().catch((err) => {
  console.error("Фатальная ошибка:", err);
  process.exit(1);
});
