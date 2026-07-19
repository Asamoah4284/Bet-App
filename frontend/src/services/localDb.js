import * as SQLite from 'expo-sqlite';
import {
  calculateReflectionStreak,
  localDayKey,
  reflectionDayKeys,
} from './reflections';

// Habit and financial data is private and stays on-device (see README).
let dbPromise = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync('betapp.db').then(async (db) => {
      await db.execAsync(`
        PRAGMA journal_mode = WAL;

        CREATE TABLE IF NOT EXISTS urges (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          intensity INTEGER NOT NULL,
          emotion TEXT,
          location TEXT,
          time_of_day TEXT,
          note TEXT,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS journal_entries (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          mood TEXT NOT NULL,
          note TEXT,
          entry_date TEXT NOT NULL,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS money_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          amount REAL NOT NULL,
          kind TEXT NOT NULL CHECK (kind IN ('saved', 'slip')),
          note TEXT,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value TEXT
        );

        CREATE TABLE IF NOT EXISTS daily_reflections (
          day_key TEXT PRIMARY KEY,
          status TEXT NOT NULL CHECK (status IN ('clean', 'slipped')),
          confirmed_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
      `);

      return db;
    });
  }

  return dbPromise;
}

export function timeOfDayFor(date = new Date()) {
  const hour = date.getHours();
  if (hour < 6) return 'night';
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
}

// --- Urges ---

export async function insertUrge({ intensity, emotion, location, note }) {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO urges (intensity, emotion, location, time_of_day, note)
     VALUES (?, ?, ?, ?, ?)`,
    intensity,
    emotion || null,
    location || null,
    timeOfDayFor(),
    note || null
  );
}

export async function listUrges(limit = 50) {
  const db = await getDb();
  return db.getAllAsync('SELECT * FROM urges ORDER BY created_at DESC LIMIT ?', limit);
}

export async function getUrgeInsights() {
  const db = await getDb();

  const topOf = async (column) =>
    db.getFirstAsync(
      `SELECT ${column} AS value, COUNT(*) AS count FROM urges
       WHERE ${column} IS NOT NULL
       GROUP BY ${column} ORDER BY count DESC LIMIT 1`
    );

  const [topEmotion, topLocation, topTime, weekRow] = await Promise.all([
    topOf('emotion'),
    topOf('location'),
    topOf('time_of_day'),
    db.getFirstAsync(
      "SELECT COUNT(*) AS count FROM urges WHERE created_at >= datetime('now', '-7 days')"
    ),
  ]);

  return {
    topEmotion: topEmotion || null,
    topLocation: topLocation || null,
    topTimeOfDay: topTime || null,
    urgesThisWeek: weekRow ? weekRow.count : 0,
  };
}

// --- Journal ---

export async function upsertJournalEntry({ mood, note }) {
  const db = await getDb();
  const today = localDayKey();
  const existing = await db.getFirstAsync(
    'SELECT id FROM journal_entries WHERE entry_date = ?',
    today
  );

  if (existing) {
    await db.runAsync(
      'UPDATE journal_entries SET mood = ?, note = ? WHERE id = ?',
      mood,
      note || null,
      existing.id
    );
    return;
  }

  await db.runAsync(
    'INSERT INTO journal_entries (mood, note, entry_date) VALUES (?, ?, ?)',
    mood,
    note || null,
    today
  );
}

export async function listJournalEntries(limit = 30) {
  const db = await getDb();
  return db.getAllAsync(
    'SELECT * FROM journal_entries ORDER BY entry_date DESC LIMIT ?',
    limit
  );
}

export async function getTodayJournalEntry() {
  const db = await getDb();
  return db.getFirstAsync('SELECT * FROM journal_entries WHERE entry_date = ?', localDayKey());
}

// --- Money ---

export async function insertMoneyLog({ amount, kind, note }) {
  const db = await getDb();
  await db.runAsync(
    'INSERT INTO money_logs (amount, kind, note) VALUES (?, ?, ?)',
    amount,
    kind,
    note || null
  );
}

export async function listMoneyLogs(limit = 50) {
  const db = await getDb();
  return db.getAllAsync('SELECT * FROM money_logs ORDER BY created_at DESC LIMIT ?', limit);
}

export async function getMoneySummary() {
  const db = await getDb();

  const [totals, week] = await Promise.all([
    db.getFirstAsync(`
      SELECT
        COALESCE(SUM(CASE WHEN kind = 'saved' THEN amount END), 0) AS savedTotal,
        COALESCE(SUM(CASE WHEN kind = 'slip' THEN amount END), 0) AS slipTotal
      FROM money_logs
    `),
    db.getAllAsync(`
      SELECT date(created_at, 'localtime') AS day,
             COALESCE(SUM(CASE WHEN kind = 'saved' THEN amount ELSE -amount END), 0) AS net
      FROM money_logs
      WHERE created_at >= datetime('now', '-7 days')
      GROUP BY day ORDER BY day ASC
    `),
  ]);

  return {
    savedTotal: totals.savedTotal,
    slipTotal: totals.slipTotal,
    moneyKept: totals.savedTotal - totals.slipTotal,
    weeklyNet: week,
  };
}

// --- Daily reflections, streak & settings ---

export async function upsertDailyReflection({ dayKey, status }) {
  const allowedDays = Object.values(reflectionDayKeys());
  if (!allowedDays.includes(dayKey)) {
    throw new Error('You can only reflect on today or yesterday.');
  }
  if (!['clean', 'slipped'].includes(status)) {
    throw new Error('Choose whether the day was gambling-free or included a slip.');
  }

  const db = await getDb();
  await db.runAsync(
    `INSERT INTO daily_reflections (day_key, status, confirmed_at)
     VALUES (?, ?, datetime('now'))
     ON CONFLICT(day_key) DO UPDATE SET
       status = excluded.status,
       confirmed_at = excluded.confirmed_at`,
    dayKey,
    status
  );
}

export async function getReflectionSummary() {
  const db = await getDb();
  const reflections = await db.getAllAsync(
    'SELECT day_key, status, confirmed_at FROM daily_reflections ORDER BY day_key DESC'
  );
  const { today, yesterday } = reflectionDayKeys();

  return {
    todayKey: today,
    yesterdayKey: yesterday,
    todayReflection: reflections.find((item) => item.day_key === today) || null,
    yesterdayReflection: reflections.find((item) => item.day_key === yesterday) || null,
    streakDays: calculateReflectionStreak(reflections),
  };
}

export async function getStreakDays() {
  const summary = await getReflectionSummary();
  return summary.streakDays;
}

export async function getSetting(key) {
  const db = await getDb();
  const row = await db.getFirstAsync('SELECT value FROM settings WHERE key = ?', key);
  return row ? row.value : null;
}

export async function setSetting(key, value) {
  const db = await getDb();
  await db.runAsync(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    key,
    String(value)
  );
}
