const sessions = new Map();
const SESSION_TTL = 15 * 60 * 1000;

function getSession(userId) {
  const session = sessions.get(userId);
  if (!session) return null;
  if (Date.now() - session.createdAt > SESSION_TTL) {
    sessions.delete(userId);
    return null;
  }
  return session;
}

function createSession(userId) {
  const session = {
    service: null,
    payment: null,
    goal: null,
    createdAt: Date.now(),
  };
  sessions.set(userId, session);
  return session;
}

function updateSession(userId, field, value) {
  let session = getSession(userId);
  if (!session) {
    session = createSession(userId);
  }
  session[field] = value;
  return session;
}

function deleteSession(userId) {
  sessions.delete(userId);
}

function isSessionComplete(userId) {
  const session = getSession(userId);
  if (!session) return false;
  return session.service && session.payment && session.goal;
}

module.exports = { getSession, createSession, updateSession, deleteSession, isSessionComplete };
