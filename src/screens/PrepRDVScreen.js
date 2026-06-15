import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, ScrollView, TextInput,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '../theme/colors';

const ph = 'rgba(170,170,204,0.3)';

const STEPS = [
  { id: 0, label: 'Problématique', icon: '🎯' },
  { id: 1, label: 'Situation',     icon: '📍' },
  { id: 2, label: 'Instant précis', icon: '⚡' },
  { id: 3, label: 'Motivation',    icon: '💪' },
];

export default function PrepRDVScreen({ navigation }) {
  const [step,         setStep]         = useState(0);
  const [perturbation, setPerturbation] = useState('');
  const [context,      setContext]      = useState('');
  const [isUnique,     setIsUnique]     = useState(null); // true | false | null
  const [uniqueDesc,   setUniqueDesc]   = useState('');
  const [peakInstant,  setPeakInstant]  = useState('');
  const [motivation,   setMotivation]   = useState(7);
  const [done,         setDone]         = useState(false);

  const reset = () => {
    setStep(0); setPerturbation(''); setContext('');
    setIsUnique(null); setUniqueDesc('');
    setPeakInstant(''); setMotivation(7); setDone(false);
  };

  const canNext = () => {
    if (step === 0) return perturbation.trim().length > 0;
    if (step === 1) return isUnique !== null && (isUnique ? uniqueDesc.trim().length > 0 : true);
    if (step === 2) return peakInstant.trim().length > 0;
    return true;
  };

  const next = () => {
    if (!canNext()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step < 3) setStep(step + 1);
    else { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); setDone(true); }
  };

  const motColor = motivation <= 4 ? Colors.pink : motivation <= 6 ? '#E08030' : Colors.turquoise;
  const motLabel = motivation <= 3 ? 'Très faible — à renforcer d\'urgence'
                 : motivation <= 5 ? 'Modérée — explorer les résistances'
                 : motivation <= 7 ? 'Bonne — séance possible'
                 : 'Forte — excellent départ';

  // ── Écran résumé ──────────────────────────────────────────────────────────
  if (done) {
    return (
      <SafeAreaView style={s.safe}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.darkBlue} />
        <ScrollView contentContainerStyle={s.body}>
          <View style={s.topRow}>
            <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
              <Text style={s.backText}>‹ Retour</Text>
            </TouchableOpacity>
            <View style={s.badge}><Text style={s.badgeText}>FICHE PRÊTE</Text></View>
            <View style={{ width: 80 }} />
          </View>

          <View style={s.summaryCard}>
            <View style={s.summaryHeader}>
              <Text style={s.summaryCheck}>✓</Text>
              <Text style={s.summaryTitle}>Fiche de préparation</Text>
            </View>

            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>PERTURBATION</Text>
              <Text style={s.summaryValue}>{perturbation}</Text>
            </View>

            {context ? (
              <View style={s.summaryRow}>
                <Text style={s.summaryLabel}>CONTEXTE</Text>
                <Text style={s.summaryValue}>{context}</Text>
              </View>
            ) : null}

            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>SITUATION</Text>
              {isUnique ? (
                <Text style={s.summaryValue}>
                  <Text style={{ color: Colors.turquoise }}>✓ Identifiée : </Text>
                  {uniqueDesc}
                </Text>
              ) : (
                <Text style={[s.summaryValue, { color: '#E08030' }]}>
                  ⚠️ À identifier en début de séance
                </Text>
              )}
            </View>

            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>INSTANT PRÉCIS</Text>
              <Text style={s.summaryValue}>{peakInstant}</Text>
            </View>

            <View style={[s.summaryRow, { borderBottomWidth: 0 }]}>
              <Text style={s.summaryLabel}>MOTIVATION</Text>
              <Text style={[s.summaryValue, { color: motColor, fontSize: 20, fontWeight: '700' }]}>
                {motivation} / 10
              </Text>
              <Text style={[s.summaryMeta, { color: motColor }]}>{motLabel}</Text>
              {motivation <= 4 && (
                <View style={s.warningBox}>
                  <Text style={s.warningText}>
                    ⚠️ Motivation faible. Demander avant de commencer :{'\n'}
                    « Qu'est-ce qui te coûte de garder cette perturbation ? »
                  </Text>
                </View>
              )}
            </View>
          </View>

          <TouchableOpacity style={s.resetBtn} onPress={reset}>
            <Text style={s.resetBtnText}>↺  Nouvelle fiche</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Formulaire étape par étape ─────────────────────────────────────────────
  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.darkBlue} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">

          {/* Header */}
          <View style={s.topRow}>
            <TouchableOpacity
              style={s.backBtn}
              onPress={step === 0 ? () => navigation.goBack() : () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setStep(step - 1); }}
            >
              <Text style={s.backText}>‹ {step === 0 ? 'Retour' : 'Précédent'}</Text>
            </TouchableOpacity>
            <View style={s.badge}><Text style={s.badgeText}>PRÉPARATION RDV</Text></View>
            <View style={{ width: 80 }} />
          </View>

          {/* Barre de progression */}
          <View style={s.progressRow}>
            {STEPS.map((st, i) => (
              <View key={st.id} style={[
                s.progressSegment,
                i < step  && { backgroundColor: Colors.turquoise },
                i === step && { backgroundColor: Colors.turquoise, opacity: 0.6 },
              ]} />
            ))}
          </View>
          <View style={s.stepsRow}>
            {STEPS.map((st, i) => (
              <Text key={st.id} style={[s.stepChip, i === step && s.stepChipActive]}>
                {st.icon} {st.label}
              </Text>
            ))}
          </View>

          {/* ── Étape 0 : Problématique ── */}
          {step === 0 && (
            <View style={s.stepCard}>
              <Text style={s.stepTitle}>Quelle perturbation ?</Text>
              <Text style={s.stepDesc}>
                Identifier clairement l'émotion ou le comportement à travailler en séance.
              </Text>
              <View style={s.field}>
                <Text style={s.fieldLabel}>PERTURBATION *</Text>
                <TextInput
                  style={s.input}
                  placeholder="ex : colère envers mon père, peur des conflits, tristesse du deuil…"
                  placeholderTextColor={ph}
                  value={perturbation}
                  onChangeText={setPerturbation}
                  multiline
                  textAlignVertical="top"
                />
              </View>
              <View style={s.field}>
                <Text style={s.fieldLabel}>CONTEXTE (optionnel)</Text>
                <TextInput
                  style={s.input}
                  placeholder="Depuis quand ? Dans quels contextes apparaît-elle ?"
                  placeholderTextColor={ph}
                  value={context}
                  onChangeText={setContext}
                  multiline
                  textAlignVertical="top"
                />
              </View>
            </View>
          )}

          {/* ── Étape 1 : Validation situation ── */}
          {step === 1 && (
            <View style={s.stepCard}>
              <Text style={s.stepTitle}>Moment unique ?</Text>
              <Text style={s.stepDesc}>
                Pour travailler une perturbation, il faut un moment précis, unique et identifiable.
                Une situation générale ne suffit pas.
              </Text>
              <View style={s.choiceGroup}>
                <TouchableOpacity
                  style={[s.choiceBtn, isUnique === true && s.choiceBtnYes]}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setIsUnique(true); }}
                >
                  <Text style={[s.choiceBtnText, isUnique === true && { color: Colors.turquoise }]}>
                    ✓  Oui — moment précis identifié
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.choiceBtn, isUnique === false && s.choiceBtnNo]}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setIsUnique(false); }}
                >
                  <Text style={[s.choiceBtnText, isUnique === false && { color: Colors.pink }]}>
                    ✗  Non — à identifier en séance
                  </Text>
                </TouchableOpacity>
              </View>
              {isUnique === true && (
                <View style={s.field}>
                  <Text style={s.fieldLabel}>DÉCRIS CE MOMENT</Text>
                  <TextInput
                    style={s.input}
                    placeholder="Quand, où, avec qui ?"
                    placeholderTextColor={ph}
                    value={uniqueDesc}
                    onChangeText={setUniqueDesc}
                    multiline
                    textAlignVertical="top"
                  />
                </View>
              )}
              {isUnique === false && (
                <View style={s.infoBox}>
                  <Text style={s.infoText}>
                    💡 À travailler en début de séance : aider la personne à isoler UN moment précis
                    avant de lancer le protocole.
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* ── Étape 2 : Instant précis ── */}
          {step === 2 && (
            <View style={s.stepCard}>
              <Text style={s.stepTitle}>L'instant précis</Text>
              <Text style={s.stepDesc}>
                Dans ce moment, quel est l'instant exact où la perturbation a été la plus intense ?
                C'est ce pic qui contient l'empreinte à réguler.
              </Text>
              <View style={s.field}>
                <Text style={s.fieldLabel}>INSTANT PRÉCIS *</Text>
                <TextInput
                  style={s.input}
                  placeholder="ex : le moment où il m'a dit que… / quand j'ai vu que…"
                  placeholderTextColor={ph}
                  value={peakInstant}
                  onChangeText={setPeakInstant}
                  multiline
                  textAlignVertical="top"
                />
              </View>
              <View style={s.infoBox}>
                <Text style={s.infoText}>
                  🎯 Un instant précis = une fraction de seconde, le pic d'intensité maximale.
                  Pas une durée, pas un contexte — un instant.
                </Text>
              </View>
            </View>
          )}

          {/* ── Étape 3 : Motivation ── */}
          {step === 3 && (
            <View style={s.stepCard}>
              <Text style={s.stepTitle}>Score de motivation</Text>
              <Text style={s.stepDesc}>
                De 0 à 10, à quel point la personne veut-elle vraiment se débarrasser de cette perturbation ?
              </Text>
              <View style={s.scoreDisplay}>
                <Text style={[s.scoreNum, { color: motColor }]}>{motivation}</Text>
                <Text style={s.scoreSub}>/ 10</Text>
              </View>
              <View style={s.scoreBarRow}>
                {[1,2,3,4,5,6,7,8,9,10].map(n => (
                  <TouchableOpacity
                    key={n}
                    style={[s.scoreSegment, { backgroundColor: motivation >= n ? motColor : 'rgba(255,255,255,0.08)' }]}
                    onPress={() => setMotivation(n)}
                    hitSlop={{ top: 8, bottom: 8 }}
                  />
                ))}
              </View>
              <Text style={[s.scoreLabel, { color: motColor }]}>{motLabel}</Text>
              {motivation <= 4 && (
                <View style={s.warningBox}>
                  <Text style={s.warningText}>
                    ⚠️ Score inférieur à 5. Il est recommandé de renforcer la motivation avant de commencer.
                    {'\n\n'}Question à poser :{'\n'}
                    « Qu'est-ce qui te coûte de garder cette perturbation dans ta vie ? »
                  </Text>
                </View>
              )}
            </View>
          )}

          <TouchableOpacity
            style={[s.nextBtn, !canNext() && { opacity: 0.4 }]}
            onPress={next}
            disabled={!canNext()}
          >
            <Text style={s.nextBtnText}>
              {step < 3 ? 'Suivant  →' : '✓  Valider la fiche'}
            </Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe:  { flex: 1, backgroundColor: Colors.darkBlue },
  body:  { padding: 16, gap: 16, paddingBottom: 48 },

  topRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  backBtn:  { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  backText: { color: 'rgba(255,255,255,0.55)', fontSize: 13, fontWeight: '600' },
  badge:    { backgroundColor: 'rgba(14,224,229,0.1)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(14,224,229,0.3)' },
  badgeText:{ color: Colors.turquoise, fontSize: 9, fontWeight: '700', letterSpacing: 1.5 },

  progressRow:    { flexDirection: 'row', gap: 5 },
  progressSegment:{ flex: 1, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.1)' },

  stepsRow: { flexDirection: 'row', gap: 5, flexWrap: 'wrap' },
  stepChip: { fontSize: 9, color: 'rgba(255,255,255,0.25)', letterSpacing: 0.5 },
  stepChipActive: { color: Colors.turquoise, fontWeight: '700' },

  stepCard:  { gap: 14 },
  stepTitle: { color: Colors.white, fontSize: 22, fontWeight: '700' },
  stepDesc:  { color: Colors.gray, fontSize: 13, lineHeight: 21 },

  field:      { gap: 7 },
  fieldLabel: { fontSize: 10, color: Colors.gray, letterSpacing: 1.5, fontWeight: '700' },
  input:      { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 13, color: Colors.white, fontSize: 14, minHeight: 60, textAlignVertical: 'top' },

  choiceGroup:      { gap: 8 },
  choiceBtn:        { padding: 14, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.04)', alignItems: 'center' },
  choiceBtnYes:     { borderColor: 'rgba(14,224,229,0.45)', backgroundColor: 'rgba(14,224,229,0.08)' },
  choiceBtnNo:      { borderColor: 'rgba(219,0,115,0.4)', backgroundColor: 'rgba(219,0,115,0.07)' },
  choiceBtnText:    { color: Colors.gray, fontSize: 13, fontWeight: '600' },

  warningBox:  { padding: 12, backgroundColor: 'rgba(219,0,115,0.07)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(219,0,115,0.25)' },
  warningText: { color: 'rgba(255,180,180,0.9)', fontSize: 12, lineHeight: 20 },
  infoBox:     { padding: 12, backgroundColor: 'rgba(14,224,229,0.06)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(14,224,229,0.2)' },
  infoText:    { color: 'rgba(255,255,255,0.5)', fontSize: 12, lineHeight: 19 },

  scoreDisplay: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, justifyContent: 'center', paddingVertical: 8 },
  scoreNum:     { fontSize: 56, fontWeight: '700' },
  scoreSub:     { color: Colors.gray, fontSize: 22, paddingBottom: 8 },
  scoreBarRow:  { flexDirection: 'row', gap: 5 },
  scoreSegment: { flex: 1, height: 10, borderRadius: 5 },
  scoreLabel:   { fontSize: 12, textAlign: 'center', fontWeight: '600' },

  nextBtn:     { backgroundColor: Colors.turquoise, padding: 16, borderRadius: 14, alignItems: 'center', marginTop: 4 },
  nextBtnText: { color: Colors.darkBlue, fontSize: 16, fontWeight: '700' },

  // ── Résumé ──
  summaryCard:   { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(14,224,229,0.2)', padding: 18, gap: 0 },
  summaryHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)', marginBottom: 14 },
  summaryCheck:  { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(14,224,229,0.15)', textAlign: 'center', lineHeight: 32, color: Colors.turquoise, fontSize: 16, fontWeight: '700' },
  summaryTitle:  { color: Colors.white, fontSize: 18, fontWeight: '700' },
  summaryRow:    { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)', gap: 4 },
  summaryLabel:  { fontSize: 9, color: Colors.gray, letterSpacing: 1.5, fontWeight: '700' },
  summaryValue:  { color: Colors.white, fontSize: 14, lineHeight: 21 },
  summaryMeta:   { fontSize: 12 },
  resetBtn:      { backgroundColor: 'rgba(255,255,255,0.06)', padding: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  resetBtnText:  { color: 'rgba(255,255,255,0.45)', fontSize: 14, fontWeight: '600' },
});
