import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Простое файловое хранилище (JSON) — общая память всех агентов.
const here = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(here, "..", "data");

export interface Lesson {
  id: number;
  agent: string; // кто записал урок
  lesson: string;
  tags: string[];
  ts: string;
}

export interface Task {
  id: number;
  title: string;
  details: string;
  createdBy: string; // агент, который поставил задачу
  priority: "низкий" | "средний" | "высокий";
  status: "открыта" | "выполнена";
  ts: string;
}

export interface ChatMessage {
  from: string; // имя человека или агента
  kind: "human" | "agent";
  text: string;
  ts: string;
}

interface Db {
  lessons: Lesson[];
  tasks: Task[];
  history: Record<string, ChatMessage[]>; // по chat_id
  state: Record<string, string>; // служебное (последняя планёрка и т.п.)
  nextId: number;
}

function dbPath(): string {
  return path.join(DATA_DIR, "db.json");
}

function load(): Db {
  try {
    return JSON.parse(fs.readFileSync(dbPath(), "utf-8")) as Db;
  } catch {
    return { lessons: [], tasks: [], history: {}, state: {}, nextId: 1 };
  }
}

function save(db: Db): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(dbPath(), JSON.stringify(db, null, 2), "utf-8");
}

export const store = {
  addLesson(agent: string, lesson: string, tags: string[]): Lesson {
    const db = load();
    const item: Lesson = {
      id: db.nextId++,
      agent,
      lesson,
      tags,
      ts: new Date().toISOString(),
    };
    db.lessons.push(item);
    // Храним последние 200 уроков.
    db.lessons = db.lessons.slice(-200);
    save(db);
    return item;
  },

  recentLessons(limit = 15): Lesson[] {
    return load().lessons.slice(-limit);
  },

  addTask(
    createdBy: string,
    title: string,
    details: string,
    priority: Task["priority"],
  ): Task {
    const db = load();
    const task: Task = {
      id: db.nextId++,
      title,
      details,
      createdBy,
      priority,
      status: "открыта",
      ts: new Date().toISOString(),
    };
    db.tasks.push(task);
    save(db);
    return task;
  },

  completeTask(id: number): Task | undefined {
    const db = load();
    const task = db.tasks.find((t) => t.id === id);
    if (task) {
      task.status = "выполнена";
      save(db);
    }
    return task;
  },

  openTasks(limit = 20): Task[] {
    return load()
      .tasks.filter((t) => t.status === "открыта")
      .slice(-limit);
  },

  addHistory(chatId: string, msg: ChatMessage): void {
    const db = load();
    const list = db.history[chatId] ?? [];
    list.push(msg);
    db.history[chatId] = list.slice(-40);
    save(db);
  },

  getHistory(chatId: string, limit = 25): ChatMessage[] {
    return (load().history[chatId] ?? []).slice(-limit);
  },

  getState(key: string): string | undefined {
    return load().state[key];
  },

  setState(key: string, value: string): void {
    const db = load();
    db.state[key] = value;
    save(db);
  },
};
