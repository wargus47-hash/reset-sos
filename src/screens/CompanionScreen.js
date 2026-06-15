import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, StatusBar, SafeAreaView, Platform,
} from 'react-native';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { Colors } from '../theme/colors';
import { COMPANION_SOUNDS } from '../audio/phrases';

// Texte affiché à l'accompagnateur (le son vient des MP3 ElevenLabs)
const COMPANION_PHRASES = [
  'Écoute ce qui se passe dans ton corps… laisse venir.',
  'Reste avec tes sensations. Tu n\'as rien à faire.',
  'Laisse évoluer ce que tu ressens.',
  'Ton corps sait ce qu\'il fait. Fais-lui confiance.',
  'Continue d\'écouter… laisse aller.',
  'Reste là, avec ce qui est présent en toi.',
  'Laisse les sensations se transformer à leur rythme.',
  'Tu fais exactement ce qu\'il faut.',
];

const randomDelay       = () => Math.floor(Math.random() * 20000) + 20000;
const randomHapticDelay = () => Math.floor(Math.random() * 10000) + 8000;

export default function CompanionScreen({ navigation }) {
  const [phase, setPhase]             = useState('brief');
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [seconds, setSeconds]         = useState(0);
  const [showEndBtn, setShowEndBtn]   = useState(false);

  const currentIndex  = useRef(0);
  const phraseTimer   = useRef(null);
  const hapticTimer   = useRef(null);
  const currentSound  = useRef(null);
  const orbScale      = useRef(new Animated.Value(1)).current;
  const phraseOpacity = useRef(new Animated.Value(1)).current;
  const bgOpacity     = useRef(new Animated.Value(1)).current;

  const playPhrase = async (index) => {
    try {
      if (currentSound.current) {
        await currentSound.current.stopAsync();
        await currentSound.current.unloadAsync();
        currentSound.current = null;
      }
      const { sound } = await Audio.Sound.createAsync(
        COMPANION_SOUNDS[index],
        { shouldPlay: true, volume: 1.0 }
      );
      currentSound.current = sound;
    } catch (_) {}
  };

  const stopAudio = async () => {
    try {
      if (currentSound.current) {
        await currentSound.current.stopAsync();
        await currentSound.current.unloadAsync();
        currentSound.current = null;
      }
    } catch (_) {}
  };

  const scheduleNextPhrase = () => {
    phraseTimer.current = setTimeout(() => {
      Animated.timing(phraseOpacity, { toValue: 0, duration: 700, useNativeDriver: true })
        .start(async () => {
          const next = (currentIndex.current + 1) % COMPANION_PHRASES.length;
          currentIndex.current = next;
          setPhraseIndex(next);
          await playPhrase(next);
          Animated.timing(phraseOpacity, { toValue: 1, duration: 700, useNativeDriver: true }).start();
          scheduleNextPhrase();
        });
    }, randomDelay());
  };

  const scheduleHaptic = () => {
    hapticTimer.current = setTimeout(async () => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      scheduleHaptic();
    }, randomHapticDelay());
  };

  const startSession = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (Platform.OS !== 'web') {
      Audio.setAudioModeAsync({
        playsInSilentModeIOS:    true,
        staysActiveInBackground: true,
        shouldDuckAndroid:       false,
      });
    }
    Animated.timing(bgOpacity, { toValue: 0, duration: 800, useNativeDriver: true })
      .start(() => {
        setPhase('session');
        bgOpacity.setValue(1);
        setTimeout(async () => {
          await playPhrase(0);
          scheduleNextPhrase();
          scheduleHaptic();
        }, 1000);
        setTimeout(() => setShowEndBtn(true), 45000);
      });
  };

  // Timer
  useEffect(() => {
    if (phase !== 'session') return;
    const t = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [phase]);

  // Animation orbe
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(orbScale, { toValue: 1.12, duration: 4000, useNativeDriver: true }),
        Animated.timing(orbScale, { toValue: 1,    duration: 4000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const formatTime = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const handleEnd = () => {
    clearTimeout(phraseTimer.current);
    clearTimeout(hapticTimer.current);
    stopAudio();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    navigation.navigate('Result', { mode: 'companion', durationSec: seconds });
  };

  const stopSession = () => {
    clearTimeout(phraseTimer.current);
    clearTimeout(hapticTimer.current);
    stopAudio();
    navigation.navigate('Home');
  };

  // ── Phase BRIEF ─────────────────────────────────────────────────────────────
  if (phase === 'brief') {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.darkBlue} />

        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.backText}>‹ Retour</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.briefContent}>
          <Text style={styles.briefIcon}>🤝</Text>
          <Text style={styles.briefTitle}>Mode Accompagnateur</Text>
          <Text style={styles.briefBody}>
            La personne ferme les yeux.{'\n\n'}
            <Text style={styles.briefHighlight}>Toi, tu restes les yeux ouverts.</Text>
            {'\n\n'}
            L'app va prononcer des phrases douces à voix haute. Tu peux aussi les répéter toi-même à voix basse si tu préfères couper le son.{'\n\n'}
            Ne parle pas, ne touche pas la personne, ne l'encourage pas. Reste simplement présent(e).
          </Text>

          <TouchableOpacity style={styles.startBtn} onPress={startSession} activeOpacity={0.85}>
            <Text style={styles.startBtnText}>La personne est prête →</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Phase SESSION ───────────────────────────────────────────────────────────
  return (
    <View style={styles.sessionContainer}>
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

      {/* Badge accompagnateur */}
      <View style={styles.companionBadge}>
        <Text style={styles.companionBadgeText}>👁 MODE ACCOMPAGNATEUR</Text>
      </View>

      <Animated.View style={[styles.orb, { transform: [{ scale: orbScale }] }]} />

      <Animated.Text style={[styles.phrase, { opacity: phraseOpacity }]}>
        {COMPANION_PHRASES[phraseIndex]}
      </Animated.Text>

      <Text style={styles.timer}>{formatTime(seconds)}</Text>

      <TouchableOpacity
        style={[styles.endBtn, { opacity: showEndBtn ? 1 : 0 }]}
        onPress={() => showEndBtn && handleEnd()}
        activeOpacity={0.7}
      >
        <Text style={styles.endBtnText}>Terminer la séance</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: Colors.darkBlue },
  topBar:          { padding: 16, paddingBottom: 0 },
  backBtn:         { alignSelf: 'flex-start', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  backText:        { color: 'rgba(255,255,255,0.55)', fontSize: 13, fontWeight: '600' },
  briefContent:    { flex: 1, padding: 28, justifyContent: 'center', gap: 20 },
  briefIcon:       { fontSize: 48, textAlign: 'center' },
  briefTitle:      { fontSize: 26, fontWeight: '700', color: Colors.white, textAlign: 'center' },
  briefBody:       { fontSize: 14, color: Colors.gray, lineHeight: 24, textAlign: 'center' },
  briefHighlight:  { color: Colors.turquoise, fontWeight: '600' },
  startBtn:        { backgroundColor: Colors.purple, padding: 18, borderRadius: 16, alignItems: 'center' },
  startBtnText:    { color: Colors.white, fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
  sessionContainer:{ flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center', gap: 40 },
  companionBadge:  { position: 'absolute', top: 56, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: 'rgba(128,0,128,0.3)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(128,0,128,0.5)' },
  companionBadgeText:{ color: Colors.purple, fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
  orb:             { width: 120, height: 120, borderRadius: 60, borderWidth: 1, borderColor: 'rgba(128,0,128,0.35)', shadowColor: Colors.purple, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 30, elevation: 10 },
  phrase:          { color: 'rgba(255,255,255,0.88)', fontSize: 20, fontWeight: '600', textAlign: 'center', lineHeight: 32, paddingHorizontal: 40 },
  timer:           { color: 'rgba(255,255,255,0.18)', fontSize: 13, letterSpacing: 3 },
  endBtn:          { position: 'absolute', bottom: 56, paddingVertical: 14, paddingHorizontal: 32, borderWidth: 1, borderColor: 'rgba(128,0,128,0.3)', borderRadius: 30 },
  endBtnText:      { color: 'rgba(255,255,255,0.4)', fontSize: 13, letterSpacing: 1 },
  stopBtn:         { position: 'absolute', top: 52, left: 24, width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  stopBtnText:     { color: 'rgba(255,255,255,0.22)', fontSize: 18 },
});
