import Anthropic from "@anthropic-ai/sdk";
import { config } from "./config.js";
import { AgentDef, buildSystemPrompt } from "./agents.js";
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
        "Сохранить в постоянную память факт, предпочтение или указание от владельца/сотрудника. Память учитывается во всех будущих разговорах. Использовать сразу, как только прозвучало что-то, что нужно учитывать дальше.",
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

function buildTools(_agent: AgentDef): Anthropic.Messages.ToolUnion[] {
  const tools = customTools();
  // Поиск в интернете — базовая версия: у неё нет своей встроенной песочницы,
  // поэтому она не конфликтует с отдельным исполнением кода ниже.
  tools.push({ type: "web_search_20250305", name: "web_search", max_uses: 5 });
  // Исполнение кода (Python в песочнице Anthropic): сметы, расчёты, конвертации,
  // анализ данных — агент считает кодом, а не «на глаз».
  tools.push({ type: "code_execution_20260120", name: "code_execution" });
  if (meta.metaConfigured()) tools.push(...metaTools());
  tools.push(...mailTools());
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
      if (result.startsWith("Письмо отправлено")) {
        await publish(`📧 Письмо отправлено на ${to} — «${input.subject}»`);
      }
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
      await publish(`📣 Создана кампания «${input.name}» (на паузе).`);
      return result;
    }
    case "meta_set_campaign_status": {
      const result = await meta.setCampaignStatus(
        String(input.campaign_id ?? ""),
        input.status === "ACTIVE" ? "ACTIVE" : "PAUSED",
      );
      await publish(
        `📣 Кампания ${input.campaign_id} → ${
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
      await publish(`📣 Бюджет кампании ${input.campaign_id} → €${eur}/день`);
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
    case "create_task": {
      const task = store.addTask(
        agent.name,
        String(input.title ?? ""),
        String(input.details ?? ""),
        (input.priority as Task["priority"]) || "средний",
      );
      await publish(`📌 Записал задачу: ${formatTask(task)}`);
      return `Задача ${formatTask(task)} создана.`;
    }
    case "complete_task": {
      const task = store.completeTask(Number(input.id));
      if (!task) return `Задача #${input.id} не найдена.`;
      await publish(`✅ Закрыл задачу ${formatTask(task)}`);
      return `Задача ${formatTask(task)} отмечена выполненной.`;
    }
    default:
      return `Неизвестный инструмент: ${name}`;
  }
}

// Серверные инструменты, которые можно «отключить» без потери работоспособности,
// в порядке отказа: сначала исполнение кода, потом поиск.
const OPTIONAL_SERVER_TOOLS = ["code_execution", "web_search"];

// Если API отклонил запрос (400) из-за серверного инструмента, который модель/аккаунт
// не поддерживает, — убираем его и пробуем снова. Так ошибка в наборе инструментов
// никогда не кладёт бота целиком: в худшем случае он ответит без этого инструмента.
function dropOneOptionalTool(
  tools: Anthropic.Messages.ToolUnion[],
): Anthropic.Messages.ToolUnion[] | null {
  for (const name of OPTIONAL_SERVER_TOOLS) {
    const idx = tools.findIndex((t) => "name" in t && t.name === name);
    if (idx !== -1) {
      console.warn(`⚠️ API отклонил инструмент «${name}» — продолжаю без него.`);
      return tools.filter((_, i) => i !== idx);
    }
  }
  return null; // убирать больше нечего
}

// Запуск одного агента: цикл tool use до финального ответа.
export async function runAgent(
  agent: AgentDef,
  userText: string,
  chatContext: string,
  publish: Publish,
): Promise<string> {
  let tools = buildTools(agent);
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
    let response: Anthropic.Message;
    try {
      response = await client.messages.create({
        model: config.model,
        max_tokens: 8000,
        thinking: { type: "adaptive" },
        output_config: { effort: config.agentEffort },
        system,
        tools,
        messages,
      });
    } catch (err) {
      // 400 на первом шаге — скорее всего неподдерживаемый серверный инструмент.
      const fallback =
        err instanceof Anthropic.BadRequestError && i === 0 ? dropOneOptionalTool(tools) : null;
      if (!fallback) throw err;
      tools = fallback;
      i--; // повторяем этот же шаг с урезанным набором инструментов
      continue;
    }

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

// Фильтр для группы: отвечать ли на сообщение, которое НЕ адресовано боту напрямую.
// Агент один, поэтому выбирать «кто ответит» не нужно — только «отвечать ли».
const RESPOND_SCHEMA = {
  type: "object",
  properties: { respond: { type: "boolean" } },
  required: ["respond"],
  additionalProperties: false,
} as const;

export async function shouldRespond(text: string, chatContext: string): Promise<boolean> {
  try {
    const response = await client.messages.create({
      model: config.routerModel,
      max_tokens: 50,
      system: [
        "Ты решаешь, должен ли AI-ассистент бизнеса ответить на сообщение в рабочей группе.",
        "respond=true, если в сообщении есть вопрос, просьба, задача, поручение или человек",
        "явно ждёт помощи/информации. Лучше ответить, чем промолчать.",
        "respond=false ТОЛЬКО если это явно реплика людей друг другу без просьбы к ассистенту:",
        "«ок», «спасибо», «понял», эмодзи, болтовня, ответ одного человека другому.",
      ].join("\n"),
      messages: [
        {
          role: "user",
          content: `Контекст чата:\n${chatContext || "(пусто)"}\n\nСообщение: ${text}`,
        },
      ],
      output_config: { format: { type: "json_schema", schema: RESPOND_SCHEMA } },
    });
    const raw = response.content.find(
      (b): b is Anthropic.TextBlock => b.type === "text",
    )?.text;
    if (!raw) return true;
    return (JSON.parse(raw) as { respond: boolean }).respond;
  } catch (err) {
    console.error("Фильтр ответа недоступен, отвечаю по умолчанию:", err);
    return true; // при сбое — лучше ответить
  }
}
