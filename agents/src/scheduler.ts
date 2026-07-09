import { config } from "./config.js";
import { AGENT_LIST } from "./agents.js";
import { runAgent, Publish } from "./orchestrator.js";
import { store } from "./store.js";
import * as mail from "./mail.js";

function nowInTz(): { date: string; hour: number } {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: config.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    hour: Number(get("hour")),
  };
}

// Утренняя планёрка: каждый агент коротко говорит, что предлагает сделать сегодня.
async function morningStandup(publish: Publish): Promise<void> {
  await publish("☀️ Утренняя планёрка команды");
  for (const agent of AGENT_LIST) {
    try {
      const answer = await runAgent(
        agent,
        [
          "Утренняя планёрка. Скажи в паре предложений, что предлагаешь сегодня по своей части —",
          "как живой человек на летучке, без официоза и нумерованных пунктов.",
          "Задачи не создавай — просто поделись мыслями.",
        ].join(" "),
        "",
        publish,
      );
      await publish(`${agent.emoji} ${agent.name}:\n${answer}`);
    } catch (err) {
      console.error(`Планёрка: ошибка у агента ${agent.name}:`, err);
    }
  }
}

// Вечерний отчёт: без вызовов Claude — сводка задач и уроков за день.
async function eveningReport(publish: Publish): Promise<void> {
  const tasks = store.openTasks(30);
  const today = nowInTz().date;
  const lessonsToday = store
    .recentLessons(50)
    .filter((l) => l.ts.startsWith(today));

  const lines = ["🌙 Вечерний отчёт", ""];
  lines.push(`Открытых задач: ${tasks.length}`);
  for (const t of tasks) {
    lines.push(`  #${t.id} [${t.priority}] ${t.title} — ${t.createdBy}`);
  }
  if (lessonsToday.length) {
    lines.push("", "Новые уроки в базе знаний за сегодня:");
    for (const l of lessonsToday) {
      lines.push(`  • [${l.agent}] ${l.lesson}`);
    }
  }
  await publish(lines.join("\n"));
}

// Новые входящие письма — публикуем в группу, чтобы команда их разобрала.
let mailBusy = false;
async function checkMail(publish: Publish): Promise<void> {
  if (mailBusy) return; // не запускать проверку поверх предыдущей
  mailBusy = true;
  try {
    const emails = await mail.fetchUnseen(10);
    for (const e of emails) {
      const preview = e.text ? `\n\n${e.text.slice(0, 400)}` : "";
      await publish(
        `📬 Новое письмо\nОт: ${e.from}\nТема: ${e.subject}${preview}\n\n` +
          `Алина, нужен ответ на это письмо?`,
      );
    }
  } catch (err) {
    console.error("Ошибка проверки почты:", err);
  } finally {
    mailBusy = false;
  }
}

// Проверяем раз в минуту, не пора ли провести планёрку/отчёт.
export function startScheduler(publish: Publish): void {
  setInterval(async () => {
    const { date, hour } = nowInTz();
    try {
      if (hour === config.morningHour && store.getState("lastMorning") !== date) {
        store.setState("lastMorning", date);
        await morningStandup(publish);
      }
      if (hour === config.eveningHour && store.getState("lastEvening") !== date) {
        store.setState("lastEvening", date);
        await eveningReport(publish);
      }
    } catch (err) {
      console.error("Ошибка планировщика:", err);
    }
  }, 60_000);

  // Отдельный цикл проверки почты.
  if (mail.mailReadConfigured() && config.mailPollMinutes > 0) {
    setInterval(
      () => void checkMail(publish),
      Math.max(1, config.mailPollMinutes) * 60_000,
    );
    console.log(`📬 Проверка входящих писем каждые ${config.mailPollMinutes} мин.`);
  }
}
