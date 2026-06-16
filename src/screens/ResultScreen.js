import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, ScrollView, Linking,
  TextInput, Animated, KeyboardAvoidingView, Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '../theme/colors';
import { saveSession, addToLibrary } from '../storage/journal';

const FORMATIONS_URL = 'https://formations.atypikali.com/formations/';

const FORMATIONS = [
  {
    key:   'me',
    title: 'RESET.me',
    sub:   'Apprendre à se réguler soi-même',
    badge: 'POUR SOI',
    color: Colors.turquoise,
  },
  {
    key:   'sos',
    title: 'RESET.sos',
    sub:   'Accompagner quelqu\'un en situation d\'urgence',
    badge: 'ACCOMPAGNANT',
    color: Colors.purple,
  },
  {
    key:   'praticien',
    title: 'RESET Praticien',
    sub:   'Formation approfondie pour les professionnels',
    badge: 'PRO',
    color: Colors.pink,
  },
];

const MODE_LABELS = {
  sos:       { label: 'SOS',        color: Colors.pink },
  night:     { label: 'Nuit',       color: '#002FA7' },
  discreet:  { label: 'Discret',    color: Colors.gray },
  companion: { label: 'Accomp.',    color: Colors.purple },
};

const DOTS = Array.from({ length: 10 }, (_, i) => i + 1);

function ScoreSelector({ value, onChange, color }) {
  return (
    <View style={scoreStyles.row}>
      {DOTS.map(d => (
        <TouchableOpacity
          key={d}
          onPress={() => { onChange(d); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
          style={[scoreStyles.dot, { backgroundColor: value >= d ? color : 'rgba(255,255,255,0.08)' }]}
          hitSlop={{ top: 6, bottom: 6, left: 2, right: 2 }}
        />
      ))}
    </View>
  );
}

const scoreStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6 },
  dot: { flex: 1, height: 10, borderRadius: 5 },
});

function formatDuration(sec) {
  if (!sec) return null;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m} min${s > 0 ? ' ' + s + 's' : ''}` : `${s}s`;
}

export default function ResultScreen({ navigation, route }) {
  const mode        = route?.params?.mode        || 'sos';
  const durationSec = route?.params?.durationSec || 0;
  const preLabel    = route?.params?.preLabel    || '';

  const [beforeValue, setBeforeValue] = useState(7);
  const [afterValue,  setAfterValue]  = useState(3);
  const [label,       setLabel]       = useState(preLabel);
  const [notes,       setNotes]       = useState('');
  const [saved,       setSaved]       = useState(false);

  const checkScale   = useRef(new Animated.Value(0.6)).current;
  const checkOpacity = useRef(new Animated.Value(0)).current;

  const modeInfo = MODE_LABELS[mode] || MODE_LABELS.sos;
  const drop     = beforeValue - afterValue;
  const dropPct  = beforeValue > 0 ? Math.round((drop / beforeValue) * 100) : 0;
  const duration = formatDuration(durationSec);

  const handleSave = async () => {
    if (saved) return;
    setSaved(true);
    await saveSession({
      mode,
      durationSec,
      beforeScore: beforeValue,
      afterScore:  afterValue,
      label:       label.trim() || null,
      notes:       notes.trim() || null,
    });
    if (label.trim()) await addToLibrary(label.trim());

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    Animated.parallel([
      Animated.spring(checkScale,   { toValue: 1, useNativeDriver: true, friction: 5 }),
      Animated.timing(checkOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.darkBlue} />

      {/* ── Barre de navigation + progression ── */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.navigate('Home')}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.backText}>‹ Accueil</Text>
        </TouchableOpacity>
        <View style={styles.progressBar}>
          <View style={[styles.step, styles.stepDone]} />
          <View style={[styles.step, styles.stepDone]} />
          <View style={[styles.step, styles.stepActive]} />
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.body}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* ── En-tête ── */}
          <View style={styles.header}>
            <Text style={styles.title}>
              Comment tu{'\n'}te sens <Text style={styles.titleAccent}>maintenant</Text> ?
            </Text>
            <View style={styles.metaRow}>
              {duration && (
                <View style={[styles.metaBadge, { borderColor: 'rgba(255,255,255,0.1)' }]}>
                  <Text style={styles.metaText}>⏱ {duration}</Text>
                </View>
              )}
              <View style={[styles.metaBadge, { borderColor: modeInfo.color + '55', backgroundColor: modeInfo.color + '18' }]}>
                <Text style={[styles.metaText, { color: modeInfo.color }]}>{modeInfo.label}</Text>
              </View>
            </View>
          </View>

          {/* ── Sélecteurs d'intensité ── */}
          <View style={styles.ratingBlock}>

            {/* Avant */}
            <View style={styles.ratingSection}>
              <View style={styles.ratingLabelRow}>
                <Text style={styles.ratingLabel}>INTENSITÉ AVANT</Text>
                <Text style={[styles.ratingValue, { color: Colors.pink }]}>{beforeValue} / 10</Text>
              </View>
              <ScoreSelector value={beforeValue} onChange={setBeforeValue} color={Colors.pink} />
            </View>

            {/* Flèche de réduction */}
            {drop > 0 ? (
              <View style={styles.dropRow}>
                <Text style={styles.dropArrow}>↓</Text>
                <Text style={styles.dropText}>
                  {drop} point{drop > 1 ? 's' : ''} de moins{' '}
                  <Text style={styles.dropPct}>({dropPct}%)</Text>
                </Text>
              </View>
            ) : (
              <View style={styles.dropRow}>
                <Text style={styles.dropArrow}>→</Text>
                <Text style={styles.dropText}>Séance en cours de traitement</Text>
              </View>
            )}

            {/* Après */}
            <View style={styles.ratingSection}>
              <View style={styles.ratingLabelRow}>
                <Text style={styles.ratingLabel}>INTENSITÉ APRÈS</Text>
                <Text style={[styles.ratingValue, { color: Colors.turquoise }]}>{afterValue} / 10</Text>
              </View>
              <ScoreSelector value={afterValue} onChange={setAfterValue} color={Colors.turquoise} />
            </View>

          </View>

          {/* ── Nom de la perturbation ── */}
          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>NOM DE LA PERTURBATION</Text>
            <TextInput
              style={styles.input}
              placeholder="ex : anxiété au travail, colère envers…"
              placeholderTextColor="rgba(170,170,204,0.3)"
              value={label}
              onChangeText={setLabel}
              maxLength={60}
              returnKeyType="next"
            />
            <Text style={styles.fieldHint}>
              Sera ajoutée à ta bibliothèque de perturbations
            </Text>
          </View>

          {/* ── Notes libres ── */}
          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>NOTES (OPTIONNEL)</Text>
            <TextInput
              style={[styles.input, styles.noteInput]}
              placeholder="Ce que tu as ressenti, observé, ce qui a bougé…"
              placeholderTextColor="rgba(170,170,204,0.3)"
              value={notes}
              onChangeText={setNotes}
              multiline
              textAlignVertical="top"
            />
          </View>

          {/* ── Bouton enregistrer / confirmation ── */}
          {!saved ? (
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
              <Text style={styles.saveBtnText}>Enregistrer dans mon journal →</Text>
            </TouchableOpacity>
          ) : (
            <Animated.View
              style={[styles.savedRow, { opacity: checkOpacity, transform: [{ scale: checkScale }] }]}
            >
              <Text style={styles.savedCheck}>✓</Text>
              <Text style={styles.savedText}>Séance enregistrée</Text>
            </Animated.View>
          )}

          {/* ── Message de fond ── */}
          <View style={styles.insightCard}>
            <Text style={styles.insightText}>
              Tu viens de laisser ton corps{' '}
              <Text style={styles.insightHighlight}>terminer un cycle émotionnel inachevé.</Text>
              {' '}C'est exactement ce que fait RESET — pas d'apaisement temporaire, une libération à la racine.
            </Text>
          </View>

          {/* ── Formations ── */}
          <View style={styles.formationBlock}>
            <Text style={styles.formationBlockTitle}>🎓 Aller plus loin avec RESET</Text>
            <Text style={styles.formationBlockSub}>
              Tu viens d'expérimenter la méthode. Maintenant apprends à la maîtriser.
            </Text>

            {FORMATIONS.map(f => (
              <TouchableOpacity
                key={f.key}
                style={styles.formationCard}
                onPress={() => Linking.openURL(FORMATIONS_URL)}
                activeOpacity={0.8}
              >
                <View>
                  <View style={[styles.formationBadge, { backgroundColor: f.color + '22', borderColor: f.color + '55' }]}>
                    <Text style={[styles.formationBadgeText, { color: f.color }]}>{f.badge}</Text>
                  </View>
                </View>
                <Text style={styles.formationTitle}>{f.title}</Text>
                <Text style={styles.formationSub}>{f.sub}</Text>
                <Text style={[styles.formationLink, { color: f.color }]}>Voir la formation →</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={styles.allFormationsBtn}
              onPress={() => Linking.openURL(FORMATIONS_URL)}
              activeOpacity={0.8}
            >
              <Text style={styles.allFormationsBtnText}>Voir toutes les formations →</Text>
            </TouchableOpacity>
          </View>

          {/* ── Footer ── */}
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => navigation.navigate('Home')}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>↩ Nouvelle séance</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: Colors.darkBlue },

  // ── Topbar ──
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(253,250,244,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(253,250,244,0.12)',
  },
  backText: { color: 'rgba(253,250,244,0.55)', fontSize: 13, fontWeight: '600' },
  progressBar: { flex: 1, flexDirection: 'row', gap: 8 },
  step:     { flex: 1, height: 3, borderRadius: 2, backgroundColor: 'rgba(253,250,244,0.1)' },
  stepDone: { backgroundColor: Colors.turquoise },
  stepActive: { backgroundColor: Colors.pink },

  // ── Body ──
  body: { padding: 24, gap: 20, paddingBottom: 48 },

  // ── Header ──
  header: { gap: 12 },
  title:  { fontSize: 26, fontWeight: '700', color: Colors.white, lineHeight: 34 },
  titleAccent: { color: Colors.turquoise },
  metaRow: { flexDirection: 'row', gap: 8 },
  metaBadge: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20, borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  metaText: { color: Colors.gray, fontSize: 11, fontWeight: '600', letterSpacing: 0.5 },

  // ── Rating block ──
  ratingBlock: {
    backgroundColor: 'rgba(253,250,244,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(253,250,244,0.08)',
    borderRadius: 18,
    padding: 18,
    gap: 16,
  },
  ratingSection: { gap: 10 },
  ratingLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ratingLabel: { fontSize: 10, color: Colors.gray, letterSpacing: 1.5, fontWeight: '700' },
  ratingValue: { fontSize: 15, fontWeight: '700' },
  dropRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(1,219,238,0.07)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(1,219,238,0.15)',
  },
  dropArrow: { color: Colors.turquoise, fontSize: 16, fontWeight: '700' },
  dropText:  { color: 'rgba(253,250,244,0.7)', fontSize: 13 },
  dropPct:   { color: Colors.turquoise, fontWeight: '700' },

  // ── Champs texte ──
  fieldBlock: { gap: 8 },
  fieldLabel: { fontSize: 10, color: Colors.gray, letterSpacing: 1.5, fontWeight: '700' },
  fieldHint:  { fontSize: 10, color: 'rgba(253,250,244,0.2)', marginTop: 2 },
  input: {
    backgroundColor: 'rgba(253,250,244,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(253,250,244,0.1)',
    borderRadius: 12,
    padding: 14,
    color: Colors.white,
    fontSize: 14,
  },
  noteInput: { minHeight: 80, textAlignVertical: 'top' },

  // ── Enregistrer ──
  saveBtn: {
    backgroundColor: Colors.turquoise,
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  saveBtnText: { color: Colors.darkBlue, fontSize: 15, fontWeight: '700', letterSpacing: 0.5 },
  savedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 16,
    backgroundColor: 'rgba(1,219,238,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(1,219,238,0.3)',
    borderRadius: 14,
  },
  savedCheck: { fontSize: 20, color: Colors.turquoise },
  savedText:  { color: Colors.turquoise, fontSize: 15, fontWeight: '700' },

  // ── Insight ──
  insightCard: {
    backgroundColor: 'rgba(1,219,238,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(1,219,238,0.2)',
    borderRadius: 16,
    padding: 16,
  },
  insightText:      { fontSize: 13, color: 'rgba(253,250,244,0.8)', lineHeight: 22 },
  insightHighlight: { color: Colors.turquoise },

  // ── Formations ──
  formationBlock:      { gap: 10 },
  formationBlockTitle: { fontSize: 16, fontWeight: '700', color: Colors.white, letterSpacing: 0.3 },
  formationBlockSub:   { fontSize: 12, color: Colors.gray, lineHeight: 18 },
  formationCard: {
    backgroundColor: 'rgba(253,250,244,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(253,250,244,0.08)',
    borderRadius: 14,
    padding: 14,
    gap: 4,
  },
  formationBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 6, borderWidth: 1,
    marginBottom: 4,
  },
  formationBadgeText: { fontSize: 9, fontWeight: '700', letterSpacing: 1.5 },
  formationTitle:     { fontSize: 15, fontWeight: '700', color: Colors.white },
  formationSub:       { fontSize: 12, color: Colors.gray, lineHeight: 17 },
  formationLink:      { fontSize: 12, fontWeight: '600', marginTop: 4 },
  allFormationsBtn: {
    padding: 14,
    backgroundColor: 'rgba(1,219,238,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(1,219,238,0.25)',
    borderRadius: 12,
    alignItems: 'center',
  },
  allFormationsBtnText: { color: Colors.turquoise, fontSize: 13, fontWeight: '600' },

  // ── Footer ──
  primaryBtn: {
    padding: 16,
    backgroundColor: 'rgba(253,250,244,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(253,250,244,0.12)',
    borderRadius: 14,
    alignItems: 'center',
  },
  primaryBtnText: { color: 'rgba(253,250,244,0.6)', fontSize: 14, fontWeight: '600' },
});
