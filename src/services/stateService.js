const { Database } = require('bun:sqlite');
const path = require('path');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', '..', 'data');
const DB_PATH = path.join(DATA_DIR, 'tickets.db');

let db;

function initDatabase() {
  const fs = require('fs');
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  db = new Database(DB_PATH, { create: true });
  db.exec('PRAGMA journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      thread_id TEXT UNIQUE NOT NULL,
      user_id TEXT NOT NULL,
      guild_id TEXT NOT NULL,
      type TEXT NOT NULL,
      state TEXT NOT NULL DEFAULT 'OPENED',
      service TEXT,
      payment_method TEXT,
      goal TEXT,
      close_reason TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS ticket_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      thread_id TEXT NOT NULL,
      event TEXT NOT NULL,
      from_state TEXT,
      to_state TEXT,
      metadata TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.exec('CREATE INDEX IF NOT EXISTS idx_tickets_state ON tickets(state)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_tickets_thread_id ON tickets(thread_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_ticket_events_thread_id ON ticket_events(thread_id)');

  console.log(`Database initialized at ${DB_PATH}`);
}

function createTicketRecord({ threadId, userId, guildId, type, service, paymentMethod, goal }) {
  const stmt = db.prepare(`
    INSERT INTO tickets (thread_id, user_id, guild_id, type, state, service, payment_method, goal)
    VALUES (?, ?, ?, ?, 'OPENED', ?, ?, ?)
  `);
  stmt.run(threadId, userId, guildId, type, service || null, paymentMethod || null, goal || null);

  logEvent(threadId, 'STATE_CHANGE', { from_state: null, to_state: 'OPENED' });
}

function updateState(threadId, newState, metadata) {
  const ticket = getTicket(threadId);
  if (!ticket) return;

  const fromState = ticket.state;
  db.prepare(`UPDATE tickets SET state = ?, updated_at = datetime('now') WHERE thread_id = ?`)
    .run(newState, threadId);

  logEvent(threadId, 'STATE_CHANGE', { from_state: fromState, to_state: newState, ...metadata });
}

function getTicket(threadId) {
  return db.prepare('SELECT * FROM tickets WHERE thread_id = ?').get(threadId) || null;
}

function getOpenTicketsOlderThan(hours) {
  return db.prepare(`
    SELECT * FROM tickets
    WHERE state = 'OPENED'
    AND created_at <= datetime('now', ? || ' hours')
  `).all(`-${hours}`);
}

function logEvent(threadId, event, metadata) {
  const fromState = metadata?.from_state || null;
  const toState = metadata?.to_state || null;
  const meta = metadata ? JSON.stringify(metadata) : null;

  db.prepare(`
    INSERT INTO ticket_events (thread_id, event, from_state, to_state, metadata)
    VALUES (?, ?, ?, ?, ?)
  `).run(threadId, event, fromState, toState, meta);
}

function closeTicketRecord(threadId, reason) {
  const ticket = getTicket(threadId);
  if (!ticket) return;

  const fromState = ticket.state;
  db.prepare(`
    UPDATE tickets SET state = 'CLOSED', close_reason = ?, updated_at = datetime('now')
    WHERE thread_id = ?
  `).run(reason || null, threadId);

  logEvent(threadId, 'STATE_CHANGE', { from_state: fromState, to_state: 'CLOSED', reason });
}

module.exports = {
  initDatabase,
  createTicketRecord,
  updateState,
  getTicket,
  getOpenTicketsOlderThan,
  logEvent,
  closeTicketRecord,
};
