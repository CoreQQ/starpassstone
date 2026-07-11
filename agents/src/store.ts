import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Простое файловое хранилище (JSON) — общая память всех агентов.
// На хостингах с эфемерным диском (Railway, Render) задайте DATA_DIR
// на смонтированный volume, например DATA_DIR=/data.
const here = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.DATA_DIR || path.resolve(here, "..", "data");

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

// Постоянная память: факты, предпочтения и указания от владельца/команды.
export interface Note {
  id: number;
  text: string;
  ts: string;
}

interface Db {
  lessons: Lesson[];
  tasks: Task[];
  notes: Note[];
  contacts: string[]; // email-адреса, которым мы писали (для фильтра входящих)
  history: Record<string, ChatMessage[]>; // по chat_id
  state: Record<string, string>; // служебное (последняя планёрка и т.п.)
  nextId: number;
}

function dbPath(): string {
  return path.join(DATA_DIR, "db.json");
}

function load(): Db {
  let raw: Partial<Db> = {};
  try {
    raw = JSON.parse(fs.readFileSync(dbPath(), "utf-8")) as Partial<Db>;
  } catch {
    // нет файла — начнём с пустой базы
  }
  // Дозаполняем недостающие поля (база могла быть создана старой версией).
  return {
    lessons: raw.lessons ?? [],
    tasks: raw.tasks ?? [],
    notes: raw.notes ?? [],
    contacts: raw.contacts ?? [],
    history: raw.history ?? {},
    state: raw.state ?? {},
    nextId: raw.nextId ?? 1,
  };
}

// Из строки "Имя <addr@x.com>" или "addr@x.com" достаём чистый адрес.
export function extractEmail(s: string): string {
  const m = s.match(/<([^>]+)>/) || s.match(/([^\s<>]+@[^\s<>]+)/);
  return (m?.[1] || "").trim().toLowerCase();
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

  // Запоминаем адрес, которому написали (чтобы узнавать его ответы).
  addContact(email: string): void {
    const addr = extractEmail(email);
    if (!addr) return;
    const db = load();
    if (!db.contacts.includes(addr)) {
      db.contacts.push(addr);
      db.contacts = db.contacts.slice(-500);
      save(db);
    }
  },

  isKnownContact(email: string): boolean {
    const addr = extractEmail(email);
    if (!addr) return false;
    return load().contacts.includes(addr);
  },

  addNote(text: string): Note {
    const db = load();
    const note: Note = { id: db.nextId++, text, ts: new Date().toISOString() };
    db.notes.push(note);
    db.notes = db.notes.slice(-100);
    save(db);
    return note;
  },

  deleteNote(id: number): boolean {
    const db = load();
    const before = db.notes.length;
    db.notes = db.notes.filter((n) => n.id !== id);
    save(db);
    return db.notes.length < before;
  },

  notes(limit = 60): Note[] {
    return load().notes.slice(-limit);
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

  completeAllTasks(): number {
    const db = load();
    let n = 0;
    for (const t of db.tasks) {
      if (t.status === "открыта") {
        t.status = "выполнена";
        n++;
      }
    }
    save(db);
    return n;
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
