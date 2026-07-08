import Anthropic from "@anthropic-ai/sdk";
import { config } from "./config.js";
import { AGENTS, AGENT_LIST, AgentDef, AgentId, buildSystemPrompt } from "./agents.js";
import { store, Task } from "./store.js";

const client = new Anthropic({ apiKey: config.anthropicApiKey });

// Колбэк, чтобы оркестратор мог публиковать переписку агентов в группу.
export type Publish = (text: string) => Promise<void>;

function customTools(): Anthropic.Messages.ToolUnion[] {
  return [
    {
      name: "save_lesson",
      description:
        "Сохранить урок/вывод в общую базу знаний команды, чтобы другие агенты учились на этом опыте. Используй для важных выводов: что сработало, что нет, факты о рынке, клиентах, поставщиках.",
      input_schema: {
        type: "object",
        properties: {
          lesson: { type: "string", description: "Краткий урок или вывод, 1-2 предложения" },
          tags: {
            type: "array",
            items: { type: "string" },
            description: "Теги, например: клиенты, реклама, поставщики",
          },
        },
        required: ["lesson"],
      },
    },
    {
      name: "create_task",
      description:
        "Поставить задачу владельцу бизнеса (позвонить, решить, оплатить, согласовать). Задача появится в общем списке и в ежедневном отчёте.",
      input_schema: {
        type: "object",
        properties: {
          title: { type: "string", description: "Короткое название задачи" },
          details: { type: "string", description: "Детали: что именно сделать, контакты, ссылки" },
          priority: { type: "string", enum: ["низкий", "средний", "высокий"] },
        },
        required: ["title"],
      },
    },
    {
      name: "complete_task",
      description: "Отметить задачу выполненной по её номеру (id).",
      input_schema: {
        type: "object",
        properties: { id: { type: "integer", description: "Номер задачи, например 12" } },
        required: ["id"],
      },
    },
    {
      name: "ask_agent",
      description:
        "Задать вопрос коллеге-агенту и получить его ответ. Используй, когда вопрос в зоне ответственности коллеги.",
      input_schema: {
        type: "object",
        properties: {
          agent: {
            type: "string",
            enum: AGENT_LIST.map((a) => a.name),
            description: "Имя коллеги",
          },
          question: { type: "string", description: "Конкретный вопрос коллеге с контекстом" },
        },
        required: ["agent", "question"],
      },
    },
  ];
}

function buildTools(agent: AgentDef): Anthropic.Messages.ToolUnion[] {
  const tools = customTools();
  if (agent.webSearch) {
    tools.push({ type: "web_search_20260209", name: "web_search", max_uses: 3 });
  }
  return tools;
}

function formatTask(t: Task): string {
  return `#${t.id} [${t.priority}] ${t.title}`;
}

async function executeTool(
  agent: AgentDef,
  name: string,
  input: Record<string, unknown>,
  publish: Publish,
  depth: number,
): Promise<string> {
  switch (name) {
    case "save_lesson": {
      const lesson = store.addLesson(
        agent.name,
        String(input.lesson ?? ""),
        Array.isArray(input.tags) ? input.tags.map(String) : [],
      );
      return `Урок #${lesson.id} сохранён в базу знаний.`;
    }
    case "create_task": {
      const task = store.addTask(
        agent.name,
        String(input.title ?? ""),
        String(input.details ?? ""),
        (input.priority as Task["priority"]) || "средний",
      );
      await publish(`📌 ${agent.emoji} ${agent.name} поставил(а) задачу: ${formatTask(task)}`);
      return `Задача ${formatTask(task)} создана.`;
    }
    case "complete_task": {
      const task = store.completeTask(Number(input.id));
      if (!task) return `Задача #${input.id} не найдена.`;
      await publish(`✅ ${agent.name} закрыл(а) задачу ${formatTask(task)}`);
      return `Задача ${formatTask(task)} отмечена выполненной.`;
    }
    case "ask_agent": {
      const target = AGENT_LIST.find((a) => a.name === input.agent);
      if (!target) return `Агент "${input.agent}" не найден.`;
      if (target.id === agent.id) return "Нельзя спрашивать самого себя.";
      if (depth >= 1) {
        return "Лимит вложенных обращений исчерпан — ответь на основе своих знаний.";
      }
      const question = String(input.question ?? "");
      await publish(`💬 ${agent.name} → ${target.name}: ${question}`);
      const answer = await runAgent(
        target,
        `Вопрос от коллеги ${agent.name}: ${question}`,
        "",
        publish,
        depth + 1,
      );
      await publish(`${target.emoji} ${target.name} → ${agent.name}:\n${answer}`);
      return `Ответ от ${target.name}: ${answer}`;
    }
    default:
      return `Неизвестный инструмент: ${name}`;
  }
}

// Запуск одного агента: цикл tool use до финального ответа.
export async function runAgent(
  agent: AgentDef,
  userText: string,
  chatContext: string,
  publish: Publish,
  depth = 0,
): Promise<string> {
  const tools = buildTools(agent);
  const content = chatContext
    ? `Последние сообщения в группе:\n${chatContext}\n\n---\nНовое обращение:\n${userText}`
    : userText;

  const messages: Anthropic.MessageParam[] = [{ role: "user", content }];

  for (let i = 0; i < 12; i++) {
    const response = await client.messages.create({
      model: config.model,
      max_tokens: 8000,
      thinking: { type: "adaptive" },
      output_config: { effort: config.agentEffort },
      system: buildSystemPrompt(agent),
      tools,
      messages,
    });

    messages.push({ role: "assistant", content: response.content });

    if (response.stop_reason === "pause_turn") {
      continue; // серверный инструмент (поиск) продолжит с того же места
    }

    if (response.stop_reason === "tool_use") {
      const results: Anthropic.ToolResultBlockParam[] = [];
      for (const block of response.content) {
        if (block.type === "tool_use") {
          let result: string;
          try {
            result = await executeTool(
              agent,
              block.name,
              block.input as Record<string, unknown>,
              publish,
              depth,
            );
          } catch (err) {
            result = `Ошибка инструмента: ${err instanceof Error ? err.message : String(err)}`;
          }
          results.push({ type: "tool_result", tool_use_id: block.id, content: result });
        }
      }
      messages.push({ role: "user", content: results });
      continue;
    }

    // end_turn / max_tokens / refusal — забираем текст.
    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();
    return text || "Не смог сформулировать ответ, попробуйте переформулировать вопрос.";
  }
  return "Слишком длинная цепочка действий — остановился. Уточните запрос.";
}

// Роутер: решает, какой агент должен ответить на сообщение (и надо ли отвечать).
const ROUTER_SCHEMA = {
  type: "object",
  properties: {
    respond: { type: "boolean" },
    agent: {
      type: "string",
      enum: [...AGENT_LIST.map((a) => a.id), "none"],
    },
  },
  required: ["respond", "agent"],
  additionalProperties: false,
} as const;

export async function routeMessage(
  text: string,
  chatContext: string,
  addressedToBot: boolean,
): Promise<AgentDef | null> {
  // Прямое обращение по имени: "Марк, ..." / "Стас ..."
  const first = text.trim().split(/[\s,:!?—-]+/)[0]?.toLowerCase() ?? "";
  for (const a of AGENT_LIST) {
    if (first === a.name.toLowerCase()) return a;
  }

  const roles = AGENT_LIST.map((a) => `${a.id}: ${a.name} — ${a.role}`).join("\n");
  const response = await client.messages.create({
    model: config.routerModel,
    max_tokens: 200,
    system: [
      "Ты — диспетчер команды AI-агентов в Telegram-группе бизнеса по натуральному камню.",
      "Реши, какой агент должен ответить на сообщение:",
      roles,
      "",
      "Правила:",
      "- Вопросы про клиентов, ответы клиентам, скрипты, сделки → communicator.",
      "- Реклама, таргет, креативы, соцсети, продвижение → marketer.",
      "- Поиск объектов, заказов, партнёров, тендеров → scout.",
      "- Поставщики, материалы, цены на камень, инструмент, логистика → supplier.",
      addressedToBot
        ? "- Сообщение адресовано боту, respond всегда true — выбери наиболее подходящего агента."
        : "- Если сообщение — просто разговор людей между собой и не требует помощи агентов, respond=false, agent=none.",
    ].join("\n"),
    messages: [
      {
        role: "user",
        content: `Контекст чата:\n${chatContext || "(пусто)"}\n\nСообщение: ${text}`,
      },
    ],
    output_config: { format: { type: "json_schema", schema: ROUTER_SCHEMA } },
  });

  const raw = response.content.find(
    (b): b is Anthropic.TextBlock => b.type === "text",
  )?.text;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { respond: boolean; agent: AgentId | "none" };
    if (!parsed.respond || parsed.agent === "none") return null;
    return AGENTS[parsed.agent] ?? null;
  } catch {
    return null;
  }
}
