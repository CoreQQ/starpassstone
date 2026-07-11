import Anthropic from "@anthropic-ai/sdk";
import { config } from "./config.js";
import { AGENTS, AGENT_LIST, AgentDef, AgentId, buildSystemPrompt } from "./agents.js";
import { store, Task } from "./store.js";
import * as meta from "./meta.js";
import * as mail from "./mail.js";

const client = new Anthropic({ apiKey: config.anthropicApiKey });

// Колбэк, чтобы оркестратор мог публиковать переписку агентов в группу.
export type Publish = (text: string) => Promise<void>;

function customTools(): Anthropic.Messages.ToolUnion[] {
  return [
    {
      name: "remember",
      description:
        "Сохранить в постоянную память команды факт, предпочтение или указание от владельца/сотрудника. Память видят ВСЕ агенты во всех будущих разговорах. Использовать сразу, как только прозвучало что-то, что нужно учитывать дальше.",
      input_schema: {
        type: "object",
        properties: {
          text: {
            type: "string",
            description:
              "Краткая формулировка от третьего лица, например: «Не предлагать гранит — работаем только с мрамором и ониксом»",
          },
        },
        required: ["text"],
      },
    },
    {
      name: "forget",
      description: "Удалить устаревшую запись из постоянной памяти по её номеру (#id).",
      input_schema: {
        type: "object",
        properties: { id: { type: "integer", description: "Номер записи, например 7" } },
        required: ["id"],
      },
    },
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
        "Записать задачу владельцу. Использовать ТОЛЬКО если владелец сам попросил записать, или есть конкретный лид с контактом/ссылкой. Общие советы и идеи задачами НЕ оформлять — их говорят словами в чате. В сомнении — не использовать.",
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

function metaTools(): Anthropic.Messages.ToolUnion[] {
  return [
    {
      name: "meta_list_campaigns",
      description:
        "Показать рекламные кампании в кабинете Meta (Facebook/Instagram): названия, статусы, цели, бюджеты.",
      input_schema: { type: "object", properties: {} },
    },
    {
      name: "meta_campaign_insights",
      description:
        "Статистика кампаний Meta: расход, показы, клики, CPC, CPM. date_preset: today, yesterday, last_7d, last_30d, this_month.",
      input_schema: {
        type: "object",
        properties: {
          date_preset: { type: "string", description: "Период, по умолчанию last_7d" },
        },
      },
    },
    {
      name: "meta_create_campaign",
      description:
        "Создать рекламную кампанию в Meta. Кампания создаётся НА ПАУЗЕ (денег не тратит). Вызывать только после явного согласия владельца в текущем сообщении.",
      input_schema: {
        type: "object",
        properties: {
          name: { type: "string", description: "Название кампании" },
          objective: {
            type: "string",
            enum: [
              "OUTCOME_LEADS",
              "OUTCOME_TRAFFIC",
              "OUTCOME_AWARENESS",
              "OUTCOME_ENGAGEMENT",
              "OUTCOME_SALES",
            ],
            description: "Цель кампании",
          },
          daily_budget_eur: {
            type: "number",
            description: "Дневной бюджет в евро (целое число), опционально",
          },
        },
        required: ["name", "objective"],
      },
    },
    {
      name: "meta_set_campaign_status",
      description:
        "Включить (ACTIVE) или поставить на паузу (PAUSED) кампанию Meta. Включение тратит деньги — только после явного «да» владельца в текущем сообщении.",
      input_schema: {
        type: "object",
        properties: {
          campaign_id: { type: "string" },
          status: { type: "string", enum: ["ACTIVE", "PAUSED"] },
        },
        required: ["campaign_id", "status"],
      },
    },
    {
      name: "meta_set_daily_budget",
      description:
        "Изменить дневной бюджет кампании Meta (в евро). Только после явного согласия владельца в текущем сообщении.",
      input_schema: {
        type: "object",
        properties: {
          campaign_id: { type: "string" },
          daily_budget_eur: { type: "number" },
        },
        required: ["campaign_id", "daily_budget_eur"],
      },
    },
  ];
}

function mailTools(): Anthropic.Messages.ToolUnion[] {
  const tools: Anthropic.Messages.ToolUnion[] = [];
  if (mail.mailReadConfigured()) {
    tools.push({
      name: "check_inbox",
      description:
        "Посмотреть последние письма в почтовом ящике компании (от кого, тема, дата). Использовать, когда нужно проверить входящую почту.",
      input_schema: { type: "object", properties: {} },
    });
  }
  if (mail.mailSendConfigured()) {
    tools.push({
      name: "send_email",
      description:
        "Отправить письмо клиенту от имени компании. Пиши на языке клиента. Перед отправкой ВАЖНО показать текст владельцу и отправлять только после его «да» — кроме случая, когда владелец прямо попросил отправить сразу.",
      input_schema: {
        type: "object",
        properties: {
          to: { type: "string", description: "Email получателя" },
          subject: { type: "string", description: "Тема письма" },
          body: { type: "string", description: "Текст письма" },
        },
        required: ["to", "subject", "body"],
      },
    });
  }
  return tools;
}

function buildTools(agent: AgentDef): Anthropic.Messages.ToolUnion[] {
  const tools = customTools();
  if (agent.webSearch) {
    tools.push({ type: "web_search_20260209", name: "web_search", max_uses: 3 });
  }
  if (agent.id === "marketer" && meta.metaConfigured()) {
    tools.push(...metaTools());
  }
  // Почта — у Алины (общение с клиентами).
  if (agent.id === "communicator") {
    tools.push(...mailTools());
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
    case "check_inbox": {
      const emails = await mail.fetchRecent(8);
      if (!emails.length) return "Входящих писем нет.";
      return emails
        .map((e) => `От: ${e.from}\nТема: ${e.subject}\nДата: ${e.date}`)
        .join("\n---\n");
    }
    case "send_email": {
      const to = String(input.to ?? "");
      const result = await mail.sendEmail(to, String(input.subject ?? ""), String(input.body ?? ""));
      // Запоминаем адресата — его ответ мы потом узнаем и покажем в группе.
      store.addContact(to);
      await publish(`📧 ${agent.name}: отправила письмо на ${to} — «${input.subject}»`);
      return result;
    }
    case "meta_list_campaigns":
      return meta.listCampaigns();
    case "meta_campaign_insights":
      return meta.campaignInsights(String(input.date_preset ?? "last_7d"));
    case "meta_create_campaign": {
      const budgetEur = Number(input.daily_budget_eur ?? 0);
      const result = await meta.createCampaign(
        String(input.name ?? ""),
        String(input.objective ?? "OUTCOME_LEADS"),
        budgetEur > 0 ? Math.round(budgetEur * 100) : undefined,
      );
      await publish(`📣 ${agent.name}: создал кампанию «${input.name}» (на паузе).`);
      return result;
    }
    case "meta_set_campaign_status": {
      const result = await meta.setCampaignStatus(
        String(input.campaign_id ?? ""),
        input.status === "ACTIVE" ? "ACTIVE" : "PAUSED",
      );
      await publish(
        `📣 ${agent.name}: кампания ${input.campaign_id} → ${
          input.status === "ACTIVE" ? "ВКЛЮЧЕНА ▶️" : "на паузе ⏸"
        }`,
      );
      return result;
    }
    case "meta_set_daily_budget": {
      const eur = Number(input.daily_budget_eur ?? 0);
      const result = await meta.setCampaignDailyBudget(
        String(input.campaign_id ?? ""),
        Math.round(eur * 100),
      );
      await publish(`📣 ${agent.name}: бюджет кампании ${input.campaign_id} → €${eur}/день`);
      return result;
    }
    case "remember": {
      const note = store.addNote(String(input.text ?? ""));
      return `Записано в постоянную память (#${note.id}).`;
    }
    case "forget": {
      const ok = store.deleteNote(Number(input.id));
      return ok ? `Запись #${input.id} удалена из памяти.` : `Запись #${input.id} не найдена.`;
    }
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

  // Системный промпт строим один раз на весь цикл (а не на каждую итерацию):
  // стабильный префикс = кэш работает, повторные итерации цикла (поиск,
  // инструменты) читают его по ~10% цены вместо полной.
  const system: Anthropic.TextBlockParam[] = [
    {
      type: "text",
      text: buildSystemPrompt(agent),
      cache_control: { type: "ephemeral" },
    },
  ];

  for (let i = 0; i < 12; i++) {
    const response = await client.messages.create({
      model: config.model,
      max_tokens: 8000,
      thinking: { type: "adaptive" },
      output_config: { effort: config.agentEffort },
      system,
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
      // Кэш-брейкпоинт на последнем блоке: следующая итерация цикла читает
      // всю накопленную историю (включая объёмные результаты поиска) из кэша.
      // API разрешает максимум 4 метки на запрос, поэтому сначала снимаем
      // метки с прошлых итераций — активной остаётся только последняя.
      for (const m of messages) {
        if (m.role === "user" && Array.isArray(m.content)) {
          for (const block of m.content) {
            if (block.type === "tool_result" && "cache_control" in block) {
              delete block.cache_control;
            }
          }
        }
      }
      if (results.length > 0) {
        results[results.length - 1].cache_control = { type: "ephemeral" };
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

  // Если бот прямо адресован (упоминание, ответ боту, личка) — отвечаем всегда.
  // Роутер лишь выбирает агента; при любом сбое отвечает Алина.
  const roles = AGENT_LIST.map((a) => `${a.id}: ${a.name} — ${a.role}`).join("\n");
  let response: Anthropic.Message;
  try {
    response = await client.messages.create({
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
        "- Если непонятно, к кому именно, но человек явно чего-то хочет (вопрос,",
        "  просьба, «?») — respond=true и выбери самого близкого агента. Лучше",
        "  ответить, чем промолчать.",
        addressedToBot
          ? "- Сообщение адресовано боту напрямую: respond ВСЕГДА true, обязательно выбери агента (никогда none)."
          : "- respond=false и agent=none ставь ТОЛЬКО если это явно реплика людей друг другу (болтовня, эмодзи, «ок», «спасибо») без вопроса и без просьбы к команде.",
      ].join("\n"),
      messages: [
        {
          role: "user",
          content: `Контекст чата:\n${chatContext || "(пусто)"}\n\nСообщение: ${text}`,
        },
      ],
      output_config: { format: { type: "json_schema", schema: ROUTER_SCHEMA } },
    });
  } catch (err) {
    console.error("Роутер недоступен:", err);
    // Не молчим, если к боту обратились напрямую.
    return addressedToBot ? AGENTS.communicator : null;
  }

  const raw = response.content.find(
    (b): b is Anthropic.TextBlock => b.type === "text",
  )?.text;
  if (!raw) return addressedToBot ? AGENTS.communicator : null;
  try {
    const parsed = JSON.parse(raw) as { respond: boolean; agent: AgentId | "none" };
    if (!parsed.respond || parsed.agent === "none") {
      return addressedToBot ? AGENTS.communicator : null;
    }
    return AGENTS[parsed.agent] ?? (addressedToBot ? AGENTS.communicator : null);
  } catch {
    return addressedToBot ? AGENTS.communicator : null;
  }
}
