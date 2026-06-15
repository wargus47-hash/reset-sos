import AsyncStorage from '@react-native-async-storage/async-storage';

const JOURNAL_KEY   = '@reset_journal';
const LIBRARY_KEY   = '@reset_library';

// ── JOURNAL ──────────────────────────────────────────────────────────────────
// Une entrée = { id, date, label, beforeScore, afterScore, durationSec, mode }
// mode: 'sos' | 'calm' | 'companion' | 'night'

export async function saveSession(entry) {
  try {
    const raw      = await AsyncStorage.getItem(JOURNAL_KEY);
    const sessions = raw ? JSON.parse(raw) : [];
    sessions.unshift({ id: Date.now().toString(), date: new Date().toISOString(), ...entry });
    await AsyncStorage.setItem(JOURNAL_KEY, JSON.stringify(sessions));
  } catch (_) {}
}

export async function getSessions() {
  try {
    const raw = await AsyncStorage.getItem(JOURNAL_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (_) { return []; }
}

export async function clearJournal() {
  await AsyncStorage.removeItem(JOURNAL_KEY);
}

export async function deleteSession(id) {
  try {
    const raw      = await AsyncStorage.getItem(JOURNAL_KEY);
    const sessions = raw ? JSON.parse(raw) : [];
    await AsyncStorage.setItem(JOURNAL_KEY, JSON.stringify(sessions.filter(s => s.id !== id)));
  } catch (_) {}
}

// ── BIBLIOTHÈQUE DE PERTURBATIONS ─────────────────────────────────────────────
// Une entrée = { id, name, count, lastUsed }

export async function getLibrary() {
  try {
    const raw = await AsyncStorage.getItem(LIBRARY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (_) { return []; }
}

export async function addToLibrary(name) {
  try {
    const raw   = await AsyncStorage.getItem(LIBRARY_KEY);
    const items = raw ? JSON.parse(raw) : [];
    const idx   = items.findIndex(i => i.name.toLowerCase() === name.toLowerCase());
    if (idx >= 0) {
      items[idx].count++;
      items[idx].lastUsed = new Date().toISOString();
    } else {
      items.unshift({ id: Date.now().toString(), name, count: 1, lastUsed: new Date().toISOString() });
    }
    await AsyncStorage.setItem(LIBRARY_KEY, JSON.stringify(items));
  } catch (_) {}
}

export async function removeFromLibrary(id) {
  try {
    const raw   = await AsyncStorage.getItem(LIBRARY_KEY);
    const items = raw ? JSON.parse(raw) : [];
    await AsyncStorage.setItem(LIBRARY_KEY, JSON.stringify(items.filter(i => i.id !== id)));
  } catch (_) {}
}
