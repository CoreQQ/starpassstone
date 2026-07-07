import { config } from "./config.js";
import { AGENT_LIST } from "./agents.js";
import { runAgent, Publish } from "./orchestrator.js";
import { store } from "./store.js";

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
          "Утренняя планёрка. Дай 2-3 конкретных предложения на сегодня по своей зоне ответственности,",
          "с учётом базы знаний и открытых задач. Очень коротко, без воды.",
          "Если предлагаешь что-то, что требует действий владельца — поставь задачу.",
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
}
