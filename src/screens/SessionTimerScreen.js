import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, Animated, Vibration,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '../theme/colors';

const TOTAL = 150; // 2 min 30 = 150 secondes
const WARNING_AT = 30; // secondes restantes

export default function SessionTimerScreen({ navigation }) {
  const [phase, setPhase]     = useState('idle');    // idle | running | warning | done
  const [remaining, setRemaining] = useState(TOTAL);
  const [hippos, setHippos]   = useState(0);         // compteur hippopotames
  const [hippoFlash, setHippoFlash] = useState(false);
  const intervalRef = useRef(null);
  const ringAnim    = useRef(new Animated.Value(0)).current;
  const pulseAnim   = useRef(new Animated.Value(1)).current;
  const hippoAnim   = useRef(new Animated.Value(1)).current;

  // Pulse continu quand en cours
  useEffect(() => {
    if (phase === 'running' || phase === 'warning') {
      Animated.loop(Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.04, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 800, useNativeDriver: true }),
      ])).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [phase]);

  const start = () => {
    setPhase('running');
    setRemaining(TOTAL);
    setHippos(0);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    intervalRef.current = setInterval(() => {
      setRemaining(r => {
        const next = r - 1;
        if (next <= 0) {
          clearInterval(intervalRef.current);
          setPhase('done');
          Vibration.vibrate([0, 400, 200, 400, 200, 400]);
          return 0;
        }
        if (next === WARNING_AT) {
          setPhase('warning');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }
        return next;
      });
    }, 1000);
  };

  const stop = () => {
    clearInterval(intervalRef.current);
    setPhase('idle');
    setRemaining(TOTAL);
    setHippos(0);
  };

  useEffect(() => () => clearInterval(intervalRef.current), []);

  const tapHippo = () => {
    const next = hippos + 1;
    setHippos(next);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Flash animation
    Animated.sequence([
      Animated.timing(hippoAnim, { toValue: 1.3, duration: 80, useNativeDriver: true }),
      Animated.timing(hippoAnim, { toValue: 1,   duration: 80, useNativeDriver: true }),
    ]).start();
    if (next >= 20) {
      setTimeout(() => {
        setHippos(0);
        setHippoFlash(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setTimeout(() => setHippoFlash(false), 1000);
      }, 200);
    }
  };

  const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss = String(remaining % 60).padStart(2, '0');
  const progress = (TOTAL - remaining) / TOTAL;

  const ringColor = phase === 'warning' ? Colors.pink
                  : phase === 'done'    ? Colors.turquoise
                  : Colors.turquoise;
  const bgRing = phase === 'warning' ? 'rgba(218,142,69,0.15)' : 'rgba(1,219,238,0.08)';

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.darkBlue} />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.back} onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={s.backText}>‹ Retour</Text>
        </TouchableOpacity>
        <View style={s.badge}>
          <Text style={s.badgeText}>MINUTEUR SÉANCE</Text>
        </View>
        <View style={{ width: 70 }} />
      </View>

      {/* Timer central */}
      <View style={s.center}>
        <Animated.View style={[s.ring, { borderColor: ringColor, backgroundColor: bgRing },
          { transform: [{ scale: pulseAnim }] }]}>
          {/* SVG-like progress bar via border trick */}
          <View style={s.timerInner}>
            <Text style={[s.timerDisplay, phase === 'warning' && { color: Colors.pink }]}>
              {mm}:{ss}
            </Text>
            <Text style={s.timerLabel}>
              {phase === 'idle'    ? 'Prêt'
             : phase === 'running' ? 'En cours'
             : phase === 'warning' ? '⚠️ Bientôt'
             : '✓ Terminé'}
            </Text>
          </View>
          {/* Barre de progression */}
          <View style={[s.progressBar, { width: `${Math.round(progress * 100)}%`, backgroundColor: ringColor }]} />
        </Animated.View>

        {/* Limite max */}
        <Text style={s.maxLabel}>Limite : 2 min 30</Text>
      </View>

      {/* Bouton start/stop */}
      <View style={s.ctaZone}>
        {phase === 'idle' || phase === 'done' ? (
          <TouchableOpacity style={s.startBtn} onPress={start} activeOpacity={0.85}>
            <Text style={s.startBtnText}>
              {phase === 'done' ? '↺  Recommencer' : '▶  Lancer la séance'}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={s.stopBtn} onPress={stop} activeOpacity={0.85}>
            <Text style={s.stopBtnText}>■  Arrêter</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Séparateur */}
      <View style={s.sep}>
        <View style={s.sepLine} />
        <Text style={s.sepText}>compteur hippopotames</Text>
        <View style={s.sepLine} />
      </View>

      {/* Compteur hippopotames */}
      <View style={s.hippoZone}>
        <Text style={s.hippoDesc}>
          Appuie une fois par seconde{'\n'}quand la personne se tait
        </Text>

        <Animated.View style={{ transform: [{ scale: hippoAnim }] }}>
          <TouchableOpacity
            style={[s.hippoBtn, hippoFlash && s.hippoBtnFlash]}
            onPress={tapHippo}
            activeOpacity={0.75}
          >
            <Text style={s.hippoBtnIcon}>🦛</Text>
            <Text style={[s.hippoBtnCount, hippos >= 20 && { color: Colors.turquoise }]}>
              {hippos}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        <View style={s.hippoRow}>
          {Array.from({ length: 20 }).map((_, i) => (
            <View key={i} style={[
              s.hippoDot,
              i < hippos && (i < 15 ? s.hippoDotActive : s.hippoDotWarn),
            ]} />
          ))}
        </View>

        <Text style={s.hippoHint}>
          {hippoFlash
            ? '✓ 20 secondes — signaler !'
            : hippos >= 15
            ? `${20 - hippos} de plus…`
            : `${hippos} / 20`}
        </Text>

        <TouchableOpacity style={s.hippoReset} onPress={() => setHippos(0)}>
          <Text style={s.hippoResetText}>Réinitialiser</Text>
        </TouchableOpacity>
      </View>

      {/* Rappel */}
      <View style={s.reminder}>
        <Text style={s.reminderText}>
          Si silence {'>'} 20 secondes → <Text style={{ color: Colors.turquoise }}>
            «&nbsp;Signale-moi les évolutions.&nbsp;»
          </Text>
        </Text>
      </View>

    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.darkBlue },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  back:   { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 20, backgroundColor: 'rgba(253,250,244,0.07)', borderWidth: 1, borderColor: 'rgba(253,250,244,0.12)' },
  backText: { color: 'rgba(253,250,244,0.55)', fontSize: 13, fontWeight: '600' },
  badge:  { backgroundColor: 'rgba(1,219,238,0.1)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(1,219,238,0.3)' },
  badgeText: { color: Colors.turquoise, fontSize: 9, fontWeight: '700', letterSpacing: 1.5 },

  center: { alignItems: 'center', paddingTop: 8, paddingBottom: 4 },
  ring:   { width: 180, height: 180, borderRadius: 90, borderWidth: 4, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  timerInner: { alignItems: 'center', gap: 4, zIndex: 2 },
  timerDisplay: { fontSize: 46, fontWeight: '700', color: Colors.white, fontVariant: ['tabular-nums'] },
  timerLabel:   { fontSize: 11, color: Colors.gray, letterSpacing: 1 },
  progressBar:  { position: 'absolute', bottom: 0, left: 0, height: 4, borderRadius: 2 },
  maxLabel: { marginTop: 10, fontSize: 11, color: 'rgba(253,250,244,0.25)', letterSpacing: 0.5 },

  ctaZone:   { paddingHorizontal: 24, marginBottom: 8 },
  startBtn:  { backgroundColor: Colors.turquoise, padding: 16, borderRadius: 14, alignItems: 'center' },
  startBtnText: { color: Colors.darkBlue, fontSize: 16, fontWeight: '700' },
  stopBtn:   { backgroundColor: 'rgba(218,142,69,0.15)', padding: 16, borderRadius: 14, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(218,142,69,0.4)' },
  stopBtnText: { color: Colors.pink, fontSize: 16, fontWeight: '700' },

  sep:     { flexDirection: 'row', alignItems: 'center', marginHorizontal: 24, gap: 10, marginVertical: 12 },
  sepLine: { flex: 1, height: 1, backgroundColor: 'rgba(253,250,244,0.07)' },
  sepText: { fontSize: 10, color: Colors.gray, letterSpacing: 1 },

  hippoZone: { alignItems: 'center', gap: 10 },
  hippoDesc: { fontSize: 12, color: Colors.gray, textAlign: 'center', lineHeight: 18 },
  hippoBtn:  { width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(253,250,244,0.06)', borderWidth: 2, borderColor: 'rgba(253,250,244,0.15)', alignItems: 'center', justifyContent: 'center', gap: 2 },
  hippoBtnFlash: { backgroundColor: 'rgba(1,219,238,0.15)', borderColor: Colors.turquoise },
  hippoBtnIcon:  { fontSize: 28 },
  hippoBtnCount: { fontSize: 18, fontWeight: '700', color: Colors.white },
  hippoRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: 5, paddingHorizontal: 32, justifyContent: 'center' },
  hippoDot:      { width: 14, height: 6, borderRadius: 3, backgroundColor: 'rgba(253,250,244,0.1)' },
  hippoDotActive:{ backgroundColor: Colors.purple },
  hippoDotWarn:  { backgroundColor: Colors.pink },
  hippoHint:     { fontSize: 12, color: Colors.gray, letterSpacing: 0.5 },
  hippoReset:    { paddingVertical: 6, paddingHorizontal: 16 },
  hippoResetText:{ fontSize: 11, color: 'rgba(253,250,244,0.2)', textDecorationLine: 'underline' },

  reminder: { marginHorizontal: 20, marginTop: 8, padding: 12, backgroundColor: 'rgba(1,219,238,0.06)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(1,219,238,0.15)' },
  reminderText: { fontSize: 12, color: 'rgba(253,250,244,0.6)', textAlign: 'center', lineHeight: 18 },
});
