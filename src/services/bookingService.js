
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

    // First questionnaire
    name: null,
    cpu: null,
    gpu: null,
    motherboard: null,
    ram: null,

    // Second questionnaire
    objective: null,
    games: null,
    windows: null,
    availability: null,
    apps: null,

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

function updateSessionFields(userId, fields) {
  let session = getSession(userId);

  if (!session) {
    session = createSession(userId);
  }

  Object.assign(session, fields);

  return session;
}

function deleteSession(userId) {
  sessions.delete(userId);
}

function isSessionComplete(userId) {
  const session = getSession(userId);

  if (!session) return false;

  return Boolean(
    session.service &&
    session.payment &&
    session.goal
  );
}

function isBookingReady(userId) {
  const session = getSession(userId);

  if (!session) return false;

  return Boolean(
    session.service &&
    session.payment &&
    session.name &&
    session.cpu &&
    session.gpu &&
    session.motherboard &&
    session.ram &&
    session.objective &&
    session.games &&
    session.windows &&
    session.availability
  );
}

module.exports = {
  getSession,
  createSession,
  updateSession,
  updateSessionFields,
  deleteSession,
  isSessionComplete,
  isBookingReady,
};
