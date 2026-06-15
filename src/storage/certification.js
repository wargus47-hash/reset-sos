import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@reset_certification';

// { id, date, clientName, perturbation, difficulty, feedback: { auto, pairs, maryse } }

export async function getCertifSessions() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (_) { return []; }
}

export async function addCertifSession(data) {
  try {
    const sessions = await getCertifSessions();
    const s = {
      id:          Date.now().toString(),
      date:        new Date().toISOString(),
      clientName:  data.clientName || '',
      perturbation:data.perturbation || '',
      difficulty:  data.difficulty || false,
      feedback:    { auto: false, pairs: false, maryse: false },
    };
    sessions.push(s);
    await AsyncStorage.setItem(KEY, JSON.stringify(sessions));
    return s;
  } catch (_) { return null; }
}

export async function updateCertifFeedback(id, step) {
  // step = 'auto' | 'pairs' | 'maryse'
  try {
    const sessions = await getCertifSessions();
    const idx = sessions.findIndex(s => s.id === id);
    if (idx >= 0) {
      sessions[idx].feedback[step] = true;
      await AsyncStorage.setItem(KEY, JSON.stringify(sessions));
    }
  } catch (_) {}
}

export async function deleteCertifSession(id) {
  try {
    const sessions = await getCertifSessions();
    await AsyncStorage.setItem(KEY, JSON.stringify(sessions.filter(s => s.id !== id)));
  } catch (_) {}
}
