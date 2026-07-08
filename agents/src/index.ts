import { config } from "./config.js";
import { AGENT_LIST } from "./agents.js";
import { getMe, getUpdates, sendMessage, sendTyping, TgUpdate } from "./telegram.js";
import { routeMessage, runAgent } from "./orchestrator.js";
import { startScheduler } from "./scheduler.js";
import { store } from "./store.js";

function historyText(chatId: string): string {
  return store
    .getHistory(chatId)
    .map((m) => `${m.from}: ${m.text}`)
    .join("\n");
}

const HELP = [
  "🤖 Команда AI-агентов Starpass Stone:",
  ...AGENT_LIST.map((a) => `${a.emoji} ${a.name} — ${a.role}`),
  "",
  "Как пользоваться:",
  "• Напишите вопрос в группу — подходящий агент ответит сам.",
  "• Обратитесь по имени: «Марк, придумай рекламу каминов».",
  "• Скажите «запомните: ...» — и это станет постоянным правилом для всей команды (/notes — посмотреть).",
  "• /tasks — задачи, /cleartasks — закрыть все, /lessons — уроки, /standup — планёрка.",
  "• Агенты сами советуются друг с другом и ставят вам задачи.",
].join("\n");

async function handleCommand(chatId: number, cmd: string): Promise<boolean> {
  const publish = (text: string) => sendMessage(chatId, text);
  switch (cmd) {
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
    case "/notes": {
      const notes = store.notes(60);
      await publish(
        notes.length
          ? "🧠 Постоянная память команды:\n" + notes.map((n) => `#${n.id} ${n.text}`).join("\n")
          : "Память пока пуста. Скажите агентам «запомните: ...» — и они запишут.",
      );
      return true;
    }
    case "/cleartasks": {
      const n = store.completeAllTasks();
      await publish(n > 0 ? `🧹 Закрыл все открытые задачи: ${n} шт.` : "Открытых задач и так нет.");
      return true;
    }
    case "/lessons": {
      const lessons = store.recentLessons(20);
      await publish(
        lessons.length
          ? "🧠 База знаний (последние уроки):\n" +
              lessons.map((l) => `• [${l.agent}] ${l.lesson}`).join("\n")
          : "База знаний пока пуста.",
      );
      return true;
    }
    case "/standup": {
      for (const agent of AGENT_LIST) {
        await sendTyping(chatId);
        const answer = await runAgent(
          agent,
          "Планёрка по запросу владельца. Скажи в паре предложений, что предлагаешь по своей части — по-человечески, без официоза. Задачи не создавай.",
          historyText(String(chatId)),
          publish,
        );
        await publish(`${agent.emoji} ${agent.name}:\n${answer}`);
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
    if (await handleCommand(chatId, cmd)) return;
  }

  const mentioned = text.includes(`@${botUsername}`);
  text = text.replace(`@${botUsername}`, "").trim();
  const isReplyToBot = msg.reply_to_message?.from?.id === botId;
  const isPrivate = msg.chat.type === "private";
  const addressedToBot = mentioned || isReplyToBot || isPrivate;

  const from = msg.from?.first_name || msg.from?.username || "Пользователь";
  const context = historyText(chatKey);
  store.addHistory(chatKey, {
    from,
    kind: "human",
    text,
    ts: new Date().toISOString(),
  });

  const agent = await routeMessage(text, context, addressedToBot);
  if (!agent) return; // обычный разговор людей — агенты не вмешиваются

  await sendTyping(chatId);
  const publish = (t: string) => sendMessage(chatId, t);

  try {
    const answer = await runAgent(agent, `${from}: ${text}`, context, publish);
    const reply = `${agent.emoji} ${agent.name}:\n${answer}`;
    await sendMessage(chatId, reply);
    store.addHistory(chatKey, {
      from: agent.name,
      kind: "agent",
      text: answer.slice(0, 1500),
      ts: new Date().toISOString(),
    });
  } catch (err) {
    console.error(`Ошибка агента ${agent.name}:`, err);
    await sendMessage(
      chatId,
      `⚠️ ${agent.name} не смог(ла) ответить: ${err instanceof Error ? err.message : "ошибка"}`,
    );
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
  console.log(`✅ Бот @${me.username} запущен. Модель: ${config.model}`);
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
  // Основной цикл: длинный поллинг Telegram.
  for (;;) {
    try {
      const updates = await getUpdates(offset);
      for (const update of updates) {
        offset = update.update_id + 1;
        // Обрабатываем последовательно, чтобы агенты не путали контекст.
        await handleMessage(update, me.id, me.username);
      }
    } catch (err) {
      console.error("Ошибка цикла обновлений:", err);
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
}

main().catch((err) => {
  console.error("Фатальная ошибка:", err);
  process.exit(1);
});
