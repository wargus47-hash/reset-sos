import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, ScrollView,
  TextInput, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import * as Haptics      from 'expo-haptics';
import { useFocusEffect } from '@react-navigation/native';
import { Colors }        from '../theme/colors';
import {
  getCertifSessions,
  addCertifSession,
  updateCertifFeedback,
  deleteCertifSession,
} from '../storage/certification';

const REQUIRED = 5; // séances nécessaires pour la certification
const ph = 'rgba(170,170,204,0.3)';

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Calcule la complétion d'une séance (0, 1, 2 ou 3 étapes validées)
function sessionProgress(session) {
  const fb = session.feedback || {};
  return [fb.auto, fb.pairs, fb.maryse].filter(Boolean).length;
}

// ─────────────────────────────────────────────────────────────────────────────
// Composant : carte séance
// ─────────────────────────────────────────────────────────────────────────────
function SessionCard({ session, onFeedback, onDelete }) {
  const [open, setOpen] = useState(false);
  const prog = sessionProgress(session);
  const complete = prog === 3;

  return (
    <View style={[c.card, complete && c.cardComplete]}>

      {/* En-tête */}
      <TouchableOpacity style={c.cardHeader} onPress={() => setOpen(o => !o)} activeOpacity={0.8}>
        <View style={[c.progCircle, complete && c.progCircleComplete]}>
          <Text style={[c.progText, complete && c.progTextComplete]}>{prog}/3</Text>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={c.clientName}>{session.clientName || 'Client sans nom'}</Text>
          <Text style={c.perturbation} numberOfLines={1}>{session.perturbation || '—'}</Text>
          <Text style={c.dateText}>{fmtDate(session.date)}</Text>
        </View>
        {session.difficulty && (
          <View style={c.diffBadge}><Text style={c.diffBadgeText}>Difficile</Text></View>
        )}
        <Text style={c.chevron}>{open ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {/* Barre de progression */}
      <View style={c.barBg}>
        <View style={[c.barFill, { width: `${(prog / 3) * 100}%`,
          backgroundColor: complete ? Colors.turquoise : prog === 2 ? '#E08030' : Colors.purple }]} />
      </View>

      {/* Étapes de feedback (si déplié) */}
      {open && (
        <View style={c.stepsBlock}>
          {[
            { key: 'auto',  label: 'Auto-évaluation', desc: 'Ton ressenti sur ta propre pratique', emoji: '🔍' },
            { key: 'pairs', label: 'Évaluation par les pairs', desc: 'Retour d\'un(e) collègue praticien(ne)', emoji: '🤝' },
            { key: 'maryse',label: 'Validation Maryse', desc: 'Validation par la formatrice', emoji: '⭐' },
          ].map(step => {
            const done = session.feedback?.[step.key];
            return (
              <View key={step.key} style={[c.stepRow, done && c.stepRowDone]}>
                <Text style={c.stepEmoji}>{step.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[c.stepLabel, done && { color: Colors.turquoise }]}>{step.label}</Text>
                  <Text style={c.stepDesc}>{step.desc}</Text>
                </View>
                {done ? (
                  <View style={c.stepDone}><Text style={c.stepDoneText}>✓</Text></View>
                ) : (
                  <TouchableOpacity
                    style={c.stepBtn}
                    onPress={() => onFeedback(session.id, step.key)}
                  >
                    <Text style={c.stepBtnText}>Valider</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
          <TouchableOpacity style={c.deleteBtn} onPress={() => onDelete(session.id)}>
            <Text style={c.deleteBtnText}>Supprimer cette séance</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const c = StyleSheet.create({
  card:         { backgroundColor: 'rgba(253,250,244,0.04)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(253,250,244,0.08)', overflow: 'hidden' },
  cardComplete: { borderColor: 'rgba(1,219,238,0.3)', backgroundColor: 'rgba(1,219,238,0.03)' },
  cardHeader:   { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 13 },
  progCircle:   { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,47,167,0.2)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(0,47,167,0.4)' },
  progCircleComplete: { backgroundColor: 'rgba(1,219,238,0.15)', borderColor: 'rgba(1,219,238,0.4)' },
  progText:     { color: Colors.purple, fontSize: 11, fontWeight: '700' },
  progTextComplete: { color: Colors.turquoise },
  clientName:   { color: Colors.white, fontSize: 14, fontWeight: '700' },
  perturbation: { color: Colors.gray, fontSize: 11 },
  dateText:     { color: 'rgba(253,250,244,0.25)', fontSize: 10 },
  diffBadge:    { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: 'rgba(218,142,69,0.15)', borderWidth: 1, borderColor: 'rgba(218,142,69,0.35)' },
  diffBadgeText:{ color: Colors.pink, fontSize: 9, fontWeight: '700' },
  chevron:      { color: 'rgba(253,250,244,0.25)', fontSize: 10 },
  barBg:        { height: 3, backgroundColor: 'rgba(253,250,244,0.06)', marginHorizontal: 13 },
  barFill:      { height: '100%', borderRadius: 2 },
  stepsBlock:   { padding: 13, paddingTop: 12, gap: 10 },
  stepRow:      { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 11, borderRadius: 10, backgroundColor: 'rgba(253,250,244,0.03)', borderWidth: 1, borderColor: 'rgba(253,250,244,0.07)' },
  stepRowDone:  { backgroundColor: 'rgba(1,219,238,0.05)', borderColor: 'rgba(1,219,238,0.2)' },
  stepEmoji:    { fontSize: 18, width: 22 },
  stepLabel:    { color: Colors.white, fontSize: 12, fontWeight: '600' },
  stepDesc:     { color: Colors.gray, fontSize: 10, marginTop: 1 },
  stepDone:     { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(1,219,238,0.15)', alignItems: 'center', justifyContent: 'center' },
  stepDoneText: { color: Colors.turquoise, fontSize: 14, fontWeight: '700' },
  stepBtn:      { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: 'rgba(0,47,167,0.2)', borderWidth: 1, borderColor: 'rgba(0,47,167,0.4)' },
  stepBtnText:  { color: Colors.purple, fontSize: 11, fontWeight: '700' },
  deleteBtn:    { alignSelf: 'center', paddingVertical: 6, paddingHorizontal: 14 },
  deleteBtnText:{ color: 'rgba(253,250,244,0.2)', fontSize: 11, textDecorationLine: 'underline' },
});

// ─────────────────────────────────────────────────────────────────────────────
// ÉCRAN PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
export default function CertificationScreen({ navigation }) {
  const [sessions,   setSessions]   = useState([]);
  const [showForm,   setShowForm]   = useState(false);
  const [clientName, setClientName] = useState('');
  const [perturbation, setPerturbation] = useState('');
  const [difficulty,   setDifficulty]   = useState(false);

  const load = async () => {
    setSessions(await getCertifSessions());
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const completedSessions = sessions.filter(s => sessionProgress(s) === 3);
  const totalProgress = completedSessions.length;
  const globalPct = Math.min((totalProgress / REQUIRED) * 100, 100);
  const certified = totalProgress >= REQUIRED;

  const handleAdd = async () => {
    if (!clientName.trim() || !perturbation.trim()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await addCertifSession({
      clientName:   clientName.trim(),
      perturbation: perturbation.trim(),
      difficulty,
    });
    setClientName(''); setPerturbation(''); setDifficulty(false); setShowForm(false);
    load();
  };

  const handleFeedback = async (id, step) => {
    await updateCertifFeedback(id, step);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    load();
  };

  const handleDelete = (id) =>
    Alert.alert('Supprimer cette séance ?', 'Cette action est irréversible.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => {
        await deleteCertifSession(id);
        load();
      }},
    ]);

  // ── Formulaire ajout séance ────────────────────────────────────────────────
  if (showForm) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.darkBlue} />
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            <View style={styles.topRow}>
              <TouchableOpacity style={styles.back} onPress={() => setShowForm(false)}>
                <Text style={styles.backText}>‹ Annuler</Text>
              </TouchableOpacity>
              <View style={styles.badge}><Text style={styles.badgeText}>NOUVELLE SÉANCE</Text></View>
              <View style={{ width: 80 }} />
            </View>

            <Text style={styles.formTitle}>Enregistrer une séance</Text>
            <Text style={styles.formDesc}>
              Chaque séance compte une fois que les 3 étapes de feedback sont validées.
            </Text>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>NOM DU CLIENT *</Text>
              <TextInput style={styles.input} placeholder="ex : Marie D." placeholderTextColor={ph}
                value={clientName} onChangeText={setClientName} autoCapitalize="words" />
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>PERTURBATION TRAVAILLÉE *</Text>
              <TextInput style={styles.input} placeholder="ex : peur de l'échec, colère envers son père…"
                placeholderTextColor={ph} value={perturbation} onChangeText={setPerturbation} multiline />
            </View>

            <TouchableOpacity
              style={[styles.checkRow, difficulty && styles.checkRowActive]}
              onPress={() => setDifficulty(d => !d)}
            >
              <View style={[styles.checkBox, difficulty && styles.checkBoxActive]}>
                {difficulty && <Text style={styles.checkMark}>✓</Text>}
              </View>
              <View>
                <Text style={styles.checkLabel}>Séance difficile / cas complexe</Text>
                <Text style={styles.checkSub}>Blocages, investigation complexe, plusieurs cycles</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveBtn, (!clientName.trim() || !perturbation.trim()) && { opacity: 0.4 }]}
              onPress={handleAdd}
              disabled={!clientName.trim() || !perturbation.trim()}
            >
              <Text style={styles.saveBtnText}>Enregistrer la séance →</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ── Vue principale ─────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.darkBlue} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.backText}>‹ Retour</Text>
        </TouchableOpacity>
        <View style={styles.badge}><Text style={styles.badgeText}>CERTIFICATION</Text></View>
        <TouchableOpacity onPress={() => setShowForm(true)}>
          <Text style={styles.addBtn}>+ Ajouter</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.body}>

        {/* Progression globale */}
        <View style={[styles.globalCard, certified && styles.globalCardCertified]}>
          {certified ? (
            <>
              <Text style={styles.certEmoji}>🏆</Text>
              <Text style={styles.certTitle}>Certification obtenue !</Text>
              <Text style={styles.certDesc}>
                {totalProgress} séances complètes validées.
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.globalLabel}>PROGRESSION VERS LA CERTIFICATION</Text>
              <View style={styles.globalFraction}>
                <Text style={styles.globalNum}>{totalProgress}</Text>
                <Text style={styles.globalDen}>/ {REQUIRED}</Text>
              </View>
              <Text style={styles.globalDesc}>
                séances complètes (3 feedbacks validés)
              </Text>
              <View style={styles.globalBarBg}>
                <View style={[styles.globalBarFill, { width: `${globalPct}%` }]} />
              </View>
              <Text style={styles.globalSub}>
                {REQUIRED - totalProgress > 0
                  ? `Encore ${REQUIRED - totalProgress} séance${REQUIRED - totalProgress > 1 ? 's' : ''} à compléter`
                  : 'Toutes les séances sont validées !'}
              </Text>
            </>
          )}
        </View>

        {/* Explications étapes */}
        {sessions.length === 0 && (
          <View style={styles.explainCard}>
            <Text style={styles.explainTitle}>Les 3 étapes par séance</Text>
            {[
              { emoji: '🔍', label: 'Auto-évaluation', desc: 'Ton retour personnel sur la séance' },
              { emoji: '🤝', label: 'Pairs', desc: 'Retour d\'un(e) autre praticien(ne)' },
              { emoji: '⭐', label: 'Maryse', desc: 'Validation par la formatrice' },
            ].map(e => (
              <View key={e.label} style={styles.explainRow}>
                <Text style={styles.explainEmoji}>{e.emoji}</Text>
                <View>
                  <Text style={styles.explainLabel}>{e.label}</Text>
                  <Text style={styles.explainDesc}>{e.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Liste des séances */}
        {sessions.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>
              MES SÉANCES ({sessions.length})
            </Text>
            {sessions.map(s => (
              <SessionCard
                key={s.id}
                session={s}
                onFeedback={handleFeedback}
                onDelete={handleDelete}
              />
            ))}
          </>
        )}

        {/* CTA vide */}
        {sessions.length === 0 && (
          <TouchableOpacity style={styles.ctaBtn} onPress={() => setShowForm(true)}>
            <Text style={styles.ctaBtnText}>+ Enregistrer ma première séance</Text>
          </TouchableOpacity>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: Colors.darkBlue },
  header:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  back:      { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 20, backgroundColor: 'rgba(253,250,244,0.07)', borderWidth: 1, borderColor: 'rgba(253,250,244,0.12)' },
  backText:  { color: 'rgba(253,250,244,0.55)', fontSize: 13, fontWeight: '600' },
  badge:     { backgroundColor: 'rgba(0,47,167,0.15)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(0,47,167,0.35)' },
  badgeText: { color: Colors.purple, fontSize: 9, fontWeight: '700', letterSpacing: 1.5 },
  addBtn:    { color: Colors.turquoise, fontSize: 13, fontWeight: '600' },

  body:       { padding: 16, gap: 12, paddingBottom: 48 },
  topRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

  globalCard:         { backgroundColor: 'rgba(0,47,167,0.08)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(0,47,167,0.25)', padding: 20, alignItems: 'center', gap: 8 },
  globalCardCertified:{ backgroundColor: 'rgba(1,219,238,0.07)', borderColor: 'rgba(1,219,238,0.3)' },
  globalLabel:        { fontSize: 9, color: Colors.gray, letterSpacing: 1.5, fontWeight: '700' },
  globalFraction:     { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  globalNum:          { fontSize: 56, fontWeight: '700', color: Colors.purple, lineHeight: 60 },
  globalDen:          { fontSize: 24, color: Colors.gray, paddingBottom: 8 },
  globalDesc:         { color: Colors.gray, fontSize: 12 },
  globalBarBg:        { width: '100%', height: 8, backgroundColor: 'rgba(253,250,244,0.08)', borderRadius: 4, overflow: 'hidden' },
  globalBarFill:      { height: '100%', backgroundColor: Colors.purple, borderRadius: 4 },
  globalSub:          { color: Colors.gray, fontSize: 11 },

  certEmoji: { fontSize: 48 },
  certTitle: { color: Colors.turquoise, fontSize: 22, fontWeight: '700' },
  certDesc:  { color: Colors.gray, fontSize: 13 },

  explainCard:  { backgroundColor: 'rgba(253,250,244,0.04)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(253,250,244,0.08)', padding: 16, gap: 12 },
  explainTitle: { color: Colors.white, fontSize: 14, fontWeight: '700' },
  explainRow:   { flexDirection: 'row', alignItems: 'center', gap: 12 },
  explainEmoji: { fontSize: 20 },
  explainLabel: { color: Colors.white, fontSize: 13, fontWeight: '600' },
  explainDesc:  { color: Colors.gray, fontSize: 11, marginTop: 1 },

  sectionLabel: { fontSize: 10, color: Colors.gray, letterSpacing: 1.5, fontWeight: '700' },

  ctaBtn:     { backgroundColor: Colors.purple, padding: 16, borderRadius: 14, alignItems: 'center' },
  ctaBtnText: { color: Colors.white, fontSize: 15, fontWeight: '700' },

  // ── Formulaire ──
  formTitle: { color: Colors.white, fontSize: 22, fontWeight: '700' },
  formDesc:  { color: Colors.gray, fontSize: 13, lineHeight: 20 },
  field:     { gap: 7 },
  fieldLabel:{ fontSize: 10, color: Colors.gray, letterSpacing: 1.5, fontWeight: '700' },
  input:     { backgroundColor: 'rgba(253,250,244,0.05)', borderWidth: 1, borderColor: 'rgba(253,250,244,0.1)', borderRadius: 12, padding: 13, color: Colors.white, fontSize: 14, minHeight: 52 },
  checkRow:  { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 13, backgroundColor: 'rgba(253,250,244,0.04)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(253,250,244,0.08)' },
  checkRowActive: { backgroundColor: 'rgba(218,142,69,0.07)', borderColor: 'rgba(218,142,69,0.3)' },
  checkBox:  { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: 'rgba(253,250,244,0.2)', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 },
  checkBoxActive:{ backgroundColor: Colors.pink, borderColor: Colors.pink },
  checkMark: { color: Colors.white, fontSize: 13, fontWeight: '800' },
  checkLabel:{ color: Colors.white, fontSize: 13, fontWeight: '600' },
  checkSub:  { color: Colors.gray, fontSize: 11, marginTop: 2 },
  saveBtn:   { backgroundColor: Colors.purple, padding: 16, borderRadius: 14, alignItems: 'center' },
  saveBtnText:{ color: Colors.white, fontSize: 15, fontWeight: '700' },
});
