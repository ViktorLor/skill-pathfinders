import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";

let database: DatabaseSync | null = null;

export function getLocalDatabase() {
  if (database) return database;

  const dbPath = getDatabasePath();
  mkdirSync(dirname(dbPath), { recursive: true });

  database = new DatabaseSync(dbPath);
  database.exec("PRAGMA foreign_keys = ON");

  return database;
}

export function getDatabasePath() {
  return resolve(process.cwd(), "database", "skill-pathfinders.sqlite");
}
