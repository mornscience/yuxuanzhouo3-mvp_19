import fs from "node:fs"
import path from "node:path"
import crypto from "node:crypto"

export type StoredUser = {
  id: string
  email: string
  passwordSalt: string
  passwordHash: string
  createdAt: string
}

const DATA_DIR = path.join(process.cwd(), "data", "auth")
const DATA_FILE = path.join(DATA_DIR, "users.json")

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
}

function readAll(): StoredUser[] {
  ensureDir()
  if (!fs.existsSync(DATA_FILE)) return []
  const raw = fs.readFileSync(DATA_FILE, "utf-8")
  try {
    const parsed = JSON.parse(raw) as StoredUser[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeAll(users: StoredUser[]) {
  ensureDir()
  fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2), "utf-8")
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

export function getUserByEmail(email: string): StoredUser | null {
  const e = normalizeEmail(email)
  const users = readAll()
  return users.find((u) => u.email === e) ?? null
}

function hashPassword(password: string, salt: string) {
  // PBKDF2 is available in Node without extra deps.
  // iterations tuned for interactive login; adjust if you need slower hashing.
  const derived = crypto.pbkdf2Sync(password, salt, 120_000, 32, "sha256")
  return derived.toString("hex")
}

export function createUser(email: string, password: string): StoredUser {
  const e = normalizeEmail(email)
  const existing = getUserByEmail(e)
  if (existing) {
    throw new Error("Email already exists")
  }

  const salt = crypto.randomBytes(16).toString("hex")
  const passwordHash = hashPassword(password, salt)
  const now = new Date().toISOString()

  const user: StoredUser = {
    id: `u-${crypto.randomUUID()}`,
    email: e,
    passwordSalt: salt,
    passwordHash,
    createdAt: now,
  }

  const users = readAll()
  users.push(user)
  writeAll(users)
  return user
}

export function verifyPassword(email: string, password: string): boolean {
  const user = getUserByEmail(email)
  if (!user) return false
  const passwordHash = hashPassword(password, user.passwordSalt)
  return crypto.timingSafeEqual(Buffer.from(passwordHash, "hex"), Buffer.from(user.passwordHash, "hex"))
}

