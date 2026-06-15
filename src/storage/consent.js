import AsyncStorage from '@react-native-async-storage/async-storage';

const CONSENT_KEY = '@reset_legal_consent_v1';

/** Renvoie true si l'utilisateur a déjà accepté les CGU */
export async function hasGivenConsent() {
  try {
    const val = await AsyncStorage.getItem(CONSENT_KEY);
    return val === 'true';
  } catch {
    return false;
  }
}

/** Enregistre l'acceptation des CGU avec horodatage */
export async function saveConsent() {
  try {
    await AsyncStorage.setItem(CONSENT_KEY, 'true');
    await AsyncStorage.setItem(CONSENT_KEY + '_date', new Date().toISOString());
  } catch {}
}

/** Révoque le consentement (pour tests / "Supprimer mes données") */
export async function revokeConsent() {
  try {
    await AsyncStorage.removeItem(CONSENT_KEY);
    await AsyncStorage.removeItem(CONSENT_KEY + '_date');
  } catch {}
}
