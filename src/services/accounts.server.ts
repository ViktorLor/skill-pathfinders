import { getLocalDatabase } from "@/services/localDb.server";

type AccountRecord = {
  id: string;
  email: string;
  password_hash: string;
  password_salt: string;
};

export type AccountInput = {
  email: string;
  password: string;
};

const PASSWORD_HASH_ITERATIONS = 210_000;

export async function createAccount(input: AccountInput) {
  const email = normalizeEmail(input.email);
  validateCredentials(email, input.password);

  const db = await getAccountDatabase();
  await ensureAccountsTable(db);

  const existing = await findAccountByEmail(db, email);
  if (existing) {
    throw new Error("An account with this email already exists.");
  }

  const salt = bytesToBase64(crypto.getRandomValues(new Uint8Array(16)));
  const passwordHash = await hashPassword(input.password, salt);
  const id = `account-${crypto.randomUUID()}`;
  const now = new Date().toISOString();

  db.prepare(
    `INSERT INTO accounts (id, email, password_hash, password_salt, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(id, email, passwordHash, salt, now, now);

  return { id, email };
}

export async function verifyAccountLogin(input: AccountInput) {
  const email = normalizeEmail(input.email);
  validateCredentials(email, input.password);

  const db = await getAccountDatabase();
  await ensureAccountsTable(db);

  const account = await findAccountByEmail(db, email);
  if (!account) {
    throw new Error("Invalid email or password.");
  }

  const passwordHash = await hashPassword(input.password, account.password_salt);
  if (!constantTimeEqual(passwordHash, account.password_hash)) {
    throw new Error("Invalid email or password.");
  }

  return { id: account.id, email: account.email };
}

async function getAccountDatabase() {
  return getLocalDatabase();
}

async function ensureAccountsTable(db: ReturnType<typeof getLocalDatabase>) {
  db.exec(
    `CREATE TABLE IF NOT EXISTS accounts (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        password_salt TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`,
  );
}

async function findAccountByEmail(db: ReturnType<typeof getLocalDatabase>, email: string) {
  return db
    .prepare(
      `SELECT id, email, password_hash, password_salt
       FROM accounts
       WHERE email = ?
       LIMIT 1`,
    )
    .get(email) as AccountRecord | undefined;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function validateCredentials(email: string, password: string) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Please enter a valid email address.");
  }

  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }
}

async function hashPassword(password: string, salt: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: base64ToBytes(salt),
      iterations: PASSWORD_HASH_ITERATIONS,
    },
    key,
    256,
  );

  return bytesToBase64(new Uint8Array(bits));
}

function constantTimeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;

  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }

  return difference === 0;
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function base64ToBytes(value: string) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}
