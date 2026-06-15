import AsyncStorage from '@react-native-async-storage/async-storage';

const CLIENTS_KEY  = '@praticien_clients';
const SESSIONS_KEY = '@praticien_sessions';

// ── CLIENTS ───────────────────────────────────────────────────────────────────
// { id, createdAt, name, phone, email, notes, tags[] }

export async function getClients() {
  try {
    const raw = await AsyncStorage.getItem(CLIENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (_) { return []; }
}

export async function saveClient(data) {
  try {
    const clients = await getClients();
    const client  = { id: Date.now().toString(), createdAt: new Date().toISOString(), ...data };
    clients.unshift(client);
    await AsyncStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
    return client;
  } catch (_) { return null; }
}

export async function updateClient(id, updates) {
  try {
    const clients = await getClients();
    const idx = clients.findIndex(c => c.id === id);
    if (idx >= 0) {
      clients[idx] = { ...clients[idx], ...updates };
      await AsyncStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
    }
  } catch (_) {}
}

export async function deleteClient(id) {
  try {
    const clients  = await getClients();
    const sessions = await getSessions();
    await AsyncStorage.setItem(CLIENTS_KEY,  JSON.stringify(clients.filter(c => c.id !== id)));
    await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions.filter(s => s.clientId !== id)));
  } catch (_) {}
}

// ── SÉANCES ───────────────────────────────────────────────────────────────────
// { id, date, clientId, clientName, perturbation,
//   beforeScore, afterScore, sessionNotes,
//   followUpDate, followUpDone, followUpNotifId }

export async function getSessions() {
  try {
    const raw = await AsyncStorage.getItem(SESSIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (_) { return []; }
}

export async function savePractitionerSession(data) {
  try {
    const sessions = await getSessions();
    const session  = { id: Date.now().toString(), date: new Date().toISOString(), ...data };
    sessions.unshift(session);
    await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
    return session;
  } catch (_) { return null; }
}

export async function updateSession(id, updates) {
  try {
    const sessions = await getSessions();
    const idx = sessions.findIndex(s => s.id === id);
    if (idx >= 0) {
      sessions[idx] = { ...sessions[idx], ...updates };
      await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
    }
  } catch (_) {}
}

export async function deletePractitionerSession(id) {
  try {
    const sessions = await getSessions();
    await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions.filter(s => s.id !== id)));
  } catch (_) {}
}

export async function markFollowUpDone(id) {
  await updateSession(id, { followUpDone: true });
}

// ── HELPERS ───────────────────────────────────────────────────────────────────

export function followUpDateFor(sessionDate) {
  const d = new Date(sessionDate || Date.now());
  d.setDate(d.getDate() + 10);
  return d.toISOString();
}
