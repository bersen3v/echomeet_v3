import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"

import type { Meeting, Profile, Task } from "@/lib/types"

type UserRecord = {
  id: string
  email: string
  password_hash: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

type SessionRecord = {
  id: string
  user_id: string
  created_at: string
  expires_at: string
}

type DbShape = {
  users: UserRecord[]
  sessions: SessionRecord[]
  profiles: Profile[]
  meetings: Meeting[]
  tasks: Task[]
}

export type AppUser = {
  id: string
  email: string
  user_metadata: {
    full_name: string | null
    avatar_url: string | null
  }
  created_at: string
  updated_at: string
}

const DB_FILE_PATH = path.join(process.cwd(), "data", "custom-db.json")
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 30

const defaultDb: DbShape = {
  users: [],
  sessions: [],
  profiles: [],
  meetings: [],
  tasks: [],
}

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex")
  const hash = scryptSync(password, salt, 64).toString("hex")
  return `${salt}:${hash}`
}

function verifyPassword(password: string, hashedPassword: string): boolean {
  const [salt, hash] = hashedPassword.split(":")
  if (!salt || !hash) {
    return false
  }

  const computed = scryptSync(password, salt, 64)
  const stored = Buffer.from(hash, "hex")
  if (computed.length !== stored.length) {
    return false
  }

  return timingSafeEqual(computed, stored)
}

async function ensureDbFile() {
  const dirPath = path.dirname(DB_FILE_PATH)
  await mkdir(dirPath, { recursive: true })
  try {
    await readFile(DB_FILE_PATH, "utf-8")
  } catch {
    await writeFile(DB_FILE_PATH, JSON.stringify(defaultDb, null, 2), "utf-8")
  }
}

async function readDb(): Promise<DbShape> {
  await ensureDbFile()
  const content = await readFile(DB_FILE_PATH, "utf-8")
  return JSON.parse(content) as DbShape
}

async function writeDb(data: DbShape): Promise<void> {
  await ensureDbFile()
  await writeFile(DB_FILE_PATH, JSON.stringify(data, null, 2), "utf-8")
}

function toAppUser(user: UserRecord): AppUser {
  return {
    id: user.id,
    email: user.email,
    user_metadata: {
      full_name: user.full_name,
      avatar_url: user.avatar_url,
    },
    created_at: user.created_at,
    updated_at: user.updated_at,
  }
}

export async function createUser(input: {
  email: string
  password: string
  fullName: string
}): Promise<{ user: AppUser } | { error: string }> {
  const email = input.email.trim().toLowerCase()
  if (!email || !input.password || input.password.length < 6) {
    return { error: "Email and password (min 6 chars) are required" }
  }

  const db = await readDb()
  const exists = db.users.some((u) => u.email === email)
  if (exists) {
    return { error: "A user with this email already exists" }
  }

  const now = new Date().toISOString()
  const user: UserRecord = {
    id: randomUUID(),
    email,
    password_hash: hashPassword(input.password),
    full_name: input.fullName.trim() || null,
    avatar_url: null,
    created_at: now,
    updated_at: now,
  }
  db.users.push(user)
  db.profiles.push({
    id: user.id,
    full_name: user.full_name,
    avatar_url: user.avatar_url,
    created_at: now,
    updated_at: now,
  })
  await writeDb(db)
  return { user: toAppUser(user) }
}

export async function loginUser(input: {
  email: string
  password: string
}): Promise<{ user: AppUser } | { error: string }> {
  const email = input.email.trim().toLowerCase()
  const db = await readDb()
  const user = db.users.find((u) => u.email === email)
  if (!user || !verifyPassword(input.password, user.password_hash)) {
    return { error: "Invalid email or password" }
  }

  return { user: toAppUser(user) }
}

export async function createSession(userId: string): Promise<string> {
  const db = await readDb()
  const now = new Date()
  const expiresAt = new Date(now.getTime() + SESSION_DURATION_MS).toISOString()
  const sessionId = randomUUID()
  db.sessions.push({
    id: sessionId,
    user_id: userId,
    created_at: now.toISOString(),
    expires_at: expiresAt,
  })
  await writeDb(db)
  return sessionId
}

export async function deleteUserById(userId: string): Promise<void> {
  const db = await readDb()
  db.users = db.users.filter((u) => u.id !== userId)
  db.profiles = db.profiles.filter((p) => p.id !== userId)
  db.sessions = db.sessions.filter((s) => s.user_id !== userId)
  await writeDb(db)
}

export async function deleteSession(sessionId: string): Promise<void> {
  const db = await readDb()
  db.sessions = db.sessions.filter((s) => s.id !== sessionId)
  await writeDb(db)
}

export async function getUserBySession(sessionId: string): Promise<AppUser | null> {
  const db = await readDb()
  const now = new Date().toISOString()
  db.sessions = db.sessions.filter((s) => s.expires_at > now)
  const session = db.sessions.find((s) => s.id === sessionId)
  if (!session) {
    await writeDb(db)
    return null
  }

  const user = db.users.find((u) => u.id === session.user_id)
  await writeDb(db)
  return user ? toAppUser(user) : null
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const db = await readDb()
  return db.profiles.find((p) => p.id === userId) || null
}

export async function updateProfile(userId: string, fullName: string): Promise<Profile | null> {
  const db = await readDb()
  const user = db.users.find((u) => u.id === userId)
  if (!user) {
    return null
  }

  const now = new Date().toISOString()
  user.full_name = fullName.trim() || null
  user.updated_at = now

  const existingProfile = db.profiles.find((p) => p.id === userId)
  if (existingProfile) {
    existingProfile.full_name = user.full_name
    existingProfile.updated_at = now
  } else {
    db.profiles.push({
      id: userId,
      full_name: user.full_name,
      avatar_url: user.avatar_url,
      created_at: now,
      updated_at: now,
    })
  }

  await writeDb(db)
  return db.profiles.find((p) => p.id === userId) || null
}

export async function listMeetings(userId: string): Promise<Meeting[]> {
  const db = await readDb()
  return db.meetings
    .filter((m) => m.user_id === userId)
    .sort((a, b) => b.date.localeCompare(a.date))
}

export async function getMeetingById(meetingId: string): Promise<Meeting | null> {
  const db = await readDb()
  return db.meetings.find((m) => m.id === meetingId) || null
}

export async function createMeeting(input: {
  userId: string
  title: string
  description: string | null
  date: string
  audioFileName: string | null
}): Promise<Meeting> {
  const db = await readDb()
  const now = new Date().toISOString()
  const meeting: Meeting = {
    id: randomUUID(),
    user_id: input.userId,
    title: input.title.trim(),
    description: input.description,
    date: input.date,
    duration: null,
    audio_url: input.audioFileName,
    transcript: null,
    summary: null,
    status: "completed",
    created_at: now,
    updated_at: now,
  }
  db.meetings.push(meeting)
  await writeDb(db)
  return meeting
}

export async function listTasksForMeeting(meetingId: string): Promise<Task[]> {
  const db = await readDb()
  return db.tasks
    .filter((t) => t.meeting_id === meetingId)
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
}

export async function listTasksByUser(userId: string): Promise<Task[]> {
  const db = await readDb()
  return db.tasks.filter((t) => t.user_id === userId)
}

export async function createTask(input: {
  meetingId: string
  userId: string
  title: string
  description: string | null
  assignee: string | null
  deadline: string | null
  priority: Task["priority"]
}): Promise<Task> {
  const db = await readDb()
  const now = new Date().toISOString()
  const task: Task = {
    id: randomUUID(),
    meeting_id: input.meetingId,
    user_id: input.userId,
    title: input.title.trim(),
    description: input.description,
    assignee: input.assignee,
    deadline: input.deadline,
    priority: input.priority,
    status: "todo",
    created_at: now,
    updated_at: now,
  }
  db.tasks.push(task)
  await writeDb(db)
  return task
}

export async function updateTaskStatus(taskId: string, status: Task["status"]): Promise<Task | null> {
  const db = await readDb()
  const task = db.tasks.find((t) => t.id === taskId)
  if (!task) {
    return null
  }
  task.status = status
  task.updated_at = new Date().toISOString()
  await writeDb(db)
  return task
}
