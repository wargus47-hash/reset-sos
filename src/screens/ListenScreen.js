import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, StatusBar, AppState, Platform,
} from 'react-native';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { Colors } from '../theme/colors';
import { PHRASE_SOUNDS } from '../audio/phrases';

// ── Phrases affichées à l'écran (texte uniquement, le son vient des MP3) ──────
const PHRASES = [
  'Écoute ce qui se passe en toi… laisse venir.',
  'Reste simplement là, avec tes sensations.',
  'Tu n\'as rien à faire. Juste ressentir.',
  'Laisse évoluer ce que tu ressens, sans chercher à comprendre.',
  'Ton corps sait ce qu\'il fait. Fais-lui confiance.',
  'Continue d\'écouter… laisse aller.',
  'Accueille ce qui est là, sans le juger.',
  'Reste présent à toi-même, simplement.',
  'Laisse les sensations se transformer à leur rythme.',
  'Tu es exactement là où il faut être.',
  'Continue… laisse évoluer.',
  'Ton corps termine quelque chose. Reste avec lui.',
];

// ── Timing ───────────────────────────────────────────────────────────────────
const END_BTN_DELAY     = 45000;
const randomPhraseDelay = () => Math.floor(Math.random() * 20000) + 20000; // 20–40s
const randomHapticDelay = () => Math.floor(Math.random() * 12000) + 8000;  // 8–20s

export default function ListenScreen({ navigation, route }) {
  const mode       = route?.params?.mode     || 'sos';
  const preLabel   = route?.params?.preLabel || null;
  const isNight    = mode === 'night';
  const isDiscreet = mode === 'discreet';

  const [phraseIndex, setPhraseIndex]     = useState(0);
  const [seconds, setSeconds]             = useState(0);
  const [showEndBtn, setShowEndBtn]       = useState(false);
  const [returnedFromBg, setReturnedFromBg] = useState(false);

  const currentIndex  = useRef(0);
  const phraseTimer   = useRef(null);
  const hapticTimer   = useRef(null);
  const currentSound  = useRef(null);
  const orbScale      = useRef(new Animated.Value(1)).current;
  const phraseOpacity = useRef(new Animated.Value(1)).current;

  // ── Joue le fichier audio correspondant à l'index ─────────────────────────
  const playPhrase = async (index) => {
    if (isDiscreet) return;
    try {
      // Arrête et décharge le son précédent
      if (currentSound.current) {
        await currentSound.current.stopAsync();
        await currentSound.current.unloadAsync();
        currentSound.current = null;
      }
      const { sound } = await Audio.Sound.createAsync(
        PHRASE_SOUNDS[index],
        {
          shouldPlay: true,
          volume: 1.0,
          ...(Platform.OS !== 'web' && {
            rate: isNight ? 0.88 : 1.0,
            shouldCorrectPitch: true,
          }),
        }
      );
      currentSound.current = sound;
    } catch (_) {
      // Silencieux — si le fichier est absent on continue sans son
    }
  };

  // ── Arrête proprement le son en cours ─────────────────────────────────────
  const stopAudio = async () => {
    try {
      if (currentSound.current) {
        await currentSound.current.stopAsync();
        await currentSound.current.unloadAsync();
        currentSound.current = null;
      }
    } catch (_) {}
  };

  // ── Planifie la prochaine phrase ──────────────────────────────────────────
  const scheduleNextPhrase = () => {
    phraseTimer.current = setTimeout(() => {
      Animated.timing(phraseOpacity, {
        toValue: 0, duration: 700, useNativeDriver: true,
      }).start(async () => {
        const next = (currentIndex.current + 1) % PHRASES.length;
        currentIndex.current = next;
        setPhraseIndex(next);
        await playPhrase(next);
        Animated.timing(phraseOpacity, {
          toValue: 1, duration: 700, useNativeDriver: true,
        }).start();
        scheduleNextPhrase();
      });
    }, randomPhraseDelay());
  };

  // ── Retour haptique régulier ───────────────────────────────────────────────
  const scheduleHaptic = () => {
    hapticTimer.current = setTimeout(async () => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      scheduleHaptic();
    }, randomHapticDelay());
  };

  // ── Détection retour d'arrière-plan ──────────────────────────────────────
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        setReturnedFromBg(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setTimeout(() => setReturnedFromBg(false), 3000);
      }
    });
    return () => sub.remove();
  }, []);

  // ── Démarrage de la session ───────────────────────────────────────────────
  useEffect(() => {
    // Active la lecture audio même en mode silencieux (iOS)
    if (Platform.OS !== 'web') {
      Audio.setAudioModeAsync({
        playsInSilentModeIOS:    true,
        staysActiveInBackground: true,
        shouldDuckAndroid:       false,
      });
    }

    const startTimer = setTimeout(async () => {
      await playPhrase(0);
      scheduleNextPhrase();
      scheduleHaptic();
    }, 1500);

    return () => {
      clearTimeout(startTimer);
      clearTimeout(phraseTimer.current);
      clearTimeout(hapticTimer.current);
      stopAudio();
    };
  }, []);

  // ── Animation orbe ────────────────────────────────────────────────────────
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(orbScale, { toValue: 1.15, duration: 4000, useNativeDriver: true }),
        Animated.timing(orbScale, { toValue: 1,    duration: 4000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // ── Timer ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const t = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // ── Bouton fin (visible après 45s) ────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setShowEndBtn(true), END_BTN_DELAY);
    return () => clearTimeout(t);
  }, []);

  const formatTime = (s) => {
    const m   = String(Math.floor(s / 60)).padStart(2, '0');
    const sec = String(s % 60).padStart(2, '0');
    return `${m}:${sec}`;
  };

  // ── Arrêt immédiat (bouton ✕) ─────────────────────────────────────────────
  const stopSession = () => {
    clearTimeout(phraseTimer.current);
    clearTimeout(hapticTimer.current);
    stopAudio();
    navigation.navigate('Home');
  };

  // ── Fin de session (bouton "J'ai terminé") ────────────────────────────────
  const handleEnd = () => {
    if (!showEndBtn) return;
    clearTimeout(phraseTimer.current);
    clearTimeout(hapticTimer.current);
    stopAudio();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    navigation.navigate('Result', { mode, durationSec: seconds, preLabel });
  };

  const orbColor = isNight ? '#002FA7' : isDiscreet ? Colors.purple : Colors.turquoise;

  return (
    <View style={[styles.container, isNight && { backgroundColor: '#000820' }]}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Bouton stop */}
      <TouchableOpacity
        style={styles.stopBtn}
        onPress={stopSession}
        activeOpacity={0.6}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Text style={styles.stopBtnText}>✕</Text>
      </TouchableOpacity>

      {/* Badge mode */}
      {(isNight || isDiscreet) && (
        <View style={[styles.modeBadge, { borderColor: orbColor + '55', backgroundColor: orbColor + '18' }]}>
          <Text style={[styles.modeBadgeText, { color: orbColor }]}>
            {isNight ? '🌙 MODE NUIT' : '🔕 MODE DISCRET'}
          </Text>
        </View>
      )}

      {/* Message retour arrière-plan */}
      {returnedFromBg && (
        <Text style={styles.returnMsg}>Tu es de retour. Continue d'écouter.</Text>
      )}

      {/* Orbe */}
      <Animated.View style={[
        styles.orb,
        { borderColor: orbColor + '40', shadowColor: orbColor, transform: [{ scale: orbScale }] },
      ]} />

      {/* Phrase guidante — cachée en mode discret */}
      {!isDiscreet && (
        <Animated.Text style={[styles.phrase, { opacity: phraseOpacity }]}>
          {PHRASES[phraseIndex]}
        </Animated.Text>
      )}

      {/* Mode discret : points */}
      {isDiscreet && (
        <Text style={styles.discreetMsg}>···</Text>
      )}

      {/* Timer — caché en mode nuit */}
      {!isNight && (
        <Text style={styles.timer}>{formatTime(seconds)}</Text>
      )}

      {/* Bouton fin */}
      <TouchableOpacity
        style={[styles.endBtn, { opacity: showEndBtn ? 1 : 0 }]}
        onPress={handleEnd}
        activeOpacity={0.7}
      >
        <Text style={styles.endBtnText}>C'est bon, j'ai terminé</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000D26',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 40,
  },
  stopBtn: {
    position: 'absolute',
    top: 52,
    left: 24,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopBtnText: {
    color: 'rgba(253,250,244,0.22)',
    fontSize: 18,
  },
  orb: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(1,219,238,0.25)',
    shadowColor: Colors.turquoise,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
    elevation: 10,
  },
  phrase: {
    color: 'rgba(253,250,244,0.88)',
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.3,
    lineHeight: 32,
    paddingHorizontal: 40,
  },
  timer: {
    color: 'rgba(253,250,244,0.18)',
    fontSize: 13,
    letterSpacing: 3,
  },
  endBtn: {
    position: 'absolute',
    bottom: 56,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderWidth: 1,
    borderColor: 'rgba(253,250,244,0.15)',
    borderRadius: 30,
  },
  endBtnText: {
    color: 'rgba(253,250,244,0.4)',
    fontSize: 13,
    letterSpacing: 1,
  },
  modeBadge: {
    position: 'absolute', top: 56,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1,
  },
  modeBadgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
  returnMsg: {
    position: 'absolute', top: 100,
    color: 'rgba(253,250,244,0.35)',
    fontSize: 13, fontStyle: 'italic',
  },
  discreetMsg: {
    color: 'rgba(253,250,244,0.12)',
    fontSize: 32, letterSpacing: 12,
  },
});
