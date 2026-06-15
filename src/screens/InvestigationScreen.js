import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, ScrollView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '../theme/colors';

// ─────────────────────────────────────────────────────────────────────────────
// DONNÉES — Guide d'investigation RESET (10 cas, 3 colonnes)
// ─────────────────────────────────────────────────────────────────────────────

const CASES = [
  {
    id: '1a', column: 'blue', columnLabel: 'PHASE MENTALE', columnColor: '#4A90D9',
    title: 'Pas de demande',
    subtitle: 'La personne n\'a pas réellement demandé à travailler',
    signs: [
      'Sujet amené par quelqu\'un d\'autre',
      'Hésitation ou formulation vague',
      'Manque d\'engagement perceptible',
    ],
    question: '« Est-ce que tu as vraiment envie de travailler ça maintenant ? »',
    correction: 'Reformuler la demande. Vérifier l\'engagement. Sans demande réelle et consciente, la séance n\'aboutira pas.',
  },
  {
    id: '1b', column: 'blue', columnLabel: 'PHASE MENTALE', columnColor: '#4A90D9',
    title: 'Situation pas unique',
    subtitle: 'Description générique — pas un moment précis',
    signs: [
      '« En général… » / « Souvent… »',
      'Plusieurs situations mélangées',
      'Aucune date ou lieu identifiable',
    ],
    question: '« Tu peux me donner UN moment précis où tu l\'as ressenti ? »',
    correction: 'Ramener à un instant unique et concret. La mémoire émotionnelle travaille sur un événement précis, pas sur une généralité.',
  },
  {
    id: '1c', column: 'blue', columnLabel: 'PHASE MENTALE', columnColor: '#4A90D9',
    title: 'Instant incorrect',
    subtitle: 'Le moment identifié n\'est pas le pic émotionnel',
    signs: [
      'Score de perturbation faible pour la situation décrite',
      'La personne décrit un avant ou un après',
      'Réponse corporelle faible lors du revécu',
    ],
    question: '« C\'est à quel moment exactement que tu l\'as ressenti le plus fort ? »',
    correction: 'Identifier le pic d\'intensité maximale. C\'est ce moment précis qui contient l\'empreinte à réguler.',
  },
  {
    id: '2a', column: 'orange', columnLabel: 'PHASE ÉMOTIONNELLE', columnColor: '#E08030',
    title: 'Souvenir des sensations',
    subtitle: 'Cas quasi universel — le protocole est conçu pour ça',
    signs: [
      'La personne accède aux sensations passées, pas présentes',
      'Score ne redescend pas complètement à 0',
      'Impression de « déjà ressenti » lors du revécu',
    ],
    question: '« Quand je t\'ai demandé de revivre, tu as revécu quoi ? »',
    correction: 'Fonctionnement normal du revécu. Continuer le protocole — le corps régulera par couches successives.',
    note: 'Cas quasi universel — ne pas s\'alarmer',
  },
  {
    id: '2b', column: 'orange', columnLabel: 'PHASE ÉMOTIONNELLE', columnColor: '#E08030',
    title: 'Souvenir de l\'émotion',
    subtitle: 'Revit l\'émotion nommée, pas les sensations corporelles',
    signs: [
      '« J\'ai eu peur » / « J\'étais en colère »',
      'Narration émotionnelle, pas corporelle',
      'Peu de modifications physiques observables',
    ],
    question: '« Et dans TON corps, qu\'est-ce qui se passait ? »',
    correction: 'Ramener vers les sensations physiques. L\'émotion nommée est la surface — les sensations corporelles sont la cible.',
  },
  {
    id: '2c', column: 'orange', columnLabel: 'PHASE ÉMOTIONNELLE', columnColor: '#E08030',
    title: 'Souvenir du contexte',
    subtitle: 'Décrit la scène extérieure, pas le ressenti interne',
    signs: [
      'Détails visuels et narratifs abondants',
      '« Il y avait… » / « On était dans… »',
      'Aucune référence au ressenti interne',
    ],
    question: '« Et TOI dans cette scène, il se passait quoi dans ton corps ? »',
    correction: 'Recentrer sur l\'intérieur. Le contexte n\'est qu\'un décor — c\'est la résonance corporelle qui contient l\'empreinte.',
  },
  {
    id: '2d', column: 'orange', columnLabel: 'PHASE ÉMOTIONNELLE', columnColor: '#E08030',
    title: 'Ne lâche pas la situation',
    subtitle: 'Reste accrochée à l\'histoire — ne peut pas dissocier',
    signs: [
      'Retour constant à la narration pendant le revécu',
      'Impossible de dissocier histoire et sensations',
      'Commentaires ou questions pendant le protocole',
    ],
    question: '« Tu peux laisser l\'histoire de côté et observer uniquement les sensations ? »',
    correction: 'Rare (1/200). Technique spécifique : ancrer l\'attention sur une sensation très précise (chaleur, poids, tension) avant de relancer.',
    note: '1 cas sur 200',
  },
  {
    id: '3a', column: 'red', columnLabel: 'PHASE SENSORIELLE', columnColor: Colors.pink,
    title: 'Empreinte incomplète',
    subtitle: 'Apaisement partiel — une couche persiste',
    signs: [
      'Score descend mais ne va pas à 0',
      'Légère résistance ou tension résiduelle',
      'Soulagement partiel seulement',
    ],
    question: '« Sur 10, où en sont les sensations maintenant ? »',
    correction: 'Recommencer un cycle complet. Les empreintes complexes se régulent par couches successives — c\'est un processus normal.',
  },
  {
    id: '3b', column: 'red', columnLabel: 'PHASE SENSORIELLE', columnColor: Colors.pink,
    title: 'Agit sur les sensations',
    subtitle: 'Contrôle ou chasse les sensations au lieu de les observer',
    signs: [
      'Respiration volontairement modifiée',
      'Contractions musculaires intentionnelles',
      '« J\'essaie de… » / « Je cherche à… »',
    ],
    question: '« Qu\'est-ce que tu fais avec les sensations en ce moment ? »',
    correction: 'Réexpliquer la posture d\'observateur : ne rien faire, ne pas intervenir. Juste observer ce qui se passe, sans chercher à le modifier.',
  },
  {
    id: '3c', column: 'red', columnLabel: 'PHASE SENSORIELLE', columnColor: Colors.pink,
    title: 'Sensations sans évolution',
    subtitle: 'Bloqué dans les sensations — aucun mouvement',
    signs: [
      'Score stable depuis plusieurs minutes',
      'Tension persistante sans aucun changement',
      '« Ça ne bouge pas »',
    ],
    question: '« Les sensations bougent ? Il se passe quelque chose ? »',
    correction: 'Vérifier s\'il n\'intervient pas (→ cas 3b). Si vraiment bloqué sans action de sa part, retourner vérifier l\'instant précis (→ cas 1c).',
  },
];

const COLUMN_ORDER = ['blue', 'orange', 'red'];
const COLUMN_META = {
  blue:   { label: 'Mentale',      color: '#4A90D9' },
  orange: { label: 'Émotionnelle', color: '#E08030' },
  red:    { label: 'Sensorielle',  color: Colors.pink },
};

// ─────────────────────────────────────────────────────────────────────────────
export default function InvestigationScreen({ navigation }) {
  const [selected,     setSelected]     = useState(null);
  const [filterColumn, setFilterColumn] = useState(null);

  const displayCases = filterColumn
    ? CASES.filter(c => c.column === filterColumn)
    : CASES;

  const selectedCase = selected ? CASES.find(c => c.id === selected) : null;

  // ── Vue détail ──────────────────────────────────────────────────────────────
  if (selectedCase) {
    return (
      <SafeAreaView style={s.safe}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.darkBlue} />

        <View style={s.header}>
          <TouchableOpacity style={s.back} onPress={() => setSelected(null)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={s.backText}>‹ Retour</Text>
          </TouchableOpacity>
          <View style={[s.badge,
            { backgroundColor: selectedCase.columnColor + '20', borderColor: selectedCase.columnColor + '50' }]}>
            <Text style={[s.badgeText, { color: selectedCase.columnColor }]}>
              {selectedCase.columnLabel}
            </Text>
          </View>
          <View style={{ width: 70 }} />
        </View>

        <ScrollView contentContainerStyle={s.detailBody}>
          <Text style={s.detailId}>{selectedCase.id.toUpperCase()}</Text>
          <Text style={s.detailTitle}>{selectedCase.title}</Text>
          <Text style={s.detailSub}>{selectedCase.subtitle}</Text>

          {selectedCase.note && (
            <View style={s.noteBox}>
              <Text style={s.noteText}>ℹ️  {selectedCase.note}</Text>
            </View>
          )}

          <Text style={s.sectionLabel}>SIGNES OBSERVABLES</Text>
          <View style={s.signsList}>
            {selectedCase.signs.map((sign, i) => (
              <View key={i} style={s.signRow}>
                <View style={[s.signDot, { backgroundColor: selectedCase.columnColor }]} />
                <Text style={s.signText}>{sign}</Text>
              </View>
            ))}
          </View>

          <Text style={s.sectionLabel}>QUESTION DE DÉTECTION</Text>
          <View style={[s.questionBox,
            { borderColor: selectedCase.columnColor + '40', backgroundColor: selectedCase.columnColor + '0D' }]}>
            <Text style={[s.questionText, { color: selectedCase.columnColor }]}>
              {selectedCase.question}
            </Text>
          </View>

          <Text style={s.sectionLabel}>CORRECTION</Text>
          <View style={s.correctionBox}>
            <Text style={s.correctionText}>{selectedCase.correction}</Text>
          </View>

          <View style={s.ruleBox}>
            <Text style={s.ruleText}>
              ⚡ Règle fondamentale : toujours aller de gauche à droite (bleu → orange → rouge).
              Ne jamais sauter une colonne. Corriger UN problème à la fois.
            </Text>
          </View>

          {/* Navigation entre cas */}
          <View style={s.navRow}>
            {CASES.findIndex(c => c.id === selectedCase.id) > 0 && (
              <TouchableOpacity
                style={s.navBtn}
                onPress={() => {
                  const idx = CASES.findIndex(c => c.id === selectedCase.id);
                  setSelected(CASES[idx - 1].id);
                }}
              >
                <Text style={s.navBtnText}>‹ {CASES[CASES.findIndex(c => c.id === selectedCase.id) - 1]?.id.toUpperCase()}</Text>
              </TouchableOpacity>
            )}
            <View style={{ flex: 1 }} />
            {CASES.findIndex(c => c.id === selectedCase.id) < CASES.length - 1 && (
              <TouchableOpacity
                style={s.navBtn}
                onPress={() => {
                  const idx = CASES.findIndex(c => c.id === selectedCase.id);
                  setSelected(CASES[idx + 1].id);
                }}
              >
                <Text style={s.navBtnText}>{CASES[CASES.findIndex(c => c.id === selectedCase.id) + 1]?.id.toUpperCase()} ›</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Vue liste ───────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.darkBlue} />

      <View style={s.header}>
        <TouchableOpacity style={s.back} onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={s.backText}>‹ Retour</Text>
        </TouchableOpacity>
        <View style={s.badge}>
          <Text style={s.badgeText}>INVESTIGATION</Text>
        </View>
        <View style={{ width: 70 }} />
      </View>

      {/* Filtre colonnes */}
      <View style={s.filters}>
        <TouchableOpacity
          style={[s.filterBtn, !filterColumn && s.filterBtnActive]}
          onPress={() => setFilterColumn(null)}
        >
          <Text style={[s.filterText, !filterColumn && s.filterTextActive]}>Tous</Text>
        </TouchableOpacity>
        {COLUMN_ORDER.map(col => (
          <TouchableOpacity
            key={col}
            style={[s.filterBtn,
              filterColumn === col && {
                borderColor: COLUMN_META[col].color + '70',
                backgroundColor: COLUMN_META[col].color + '18',
              }
            ]}
            onPress={() => setFilterColumn(filterColumn === col ? null : col)}
          >
            <Text style={[s.filterText, filterColumn === col && { color: COLUMN_META[col].color }]}>
              {COLUMN_META[col].label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={s.body}>

        <View style={s.introBox}>
          <Text style={s.introText}>
            Toujours lire{' '}
            <Text style={{ color: '#4A90D9', fontWeight: '700' }}>bleu</Text>
            {' → '}
            <Text style={{ color: '#E08030', fontWeight: '700' }}>orange</Text>
            {' → '}
            <Text style={{ color: Colors.pink, fontWeight: '700' }}>rouge</Text>
            .{'\n'}Corriger{' '}
            <Text style={{ color: Colors.white, fontWeight: '700' }}>un seul</Text>
            {' '}problème à la fois, puis relancer.
          </Text>
        </View>

        {displayCases.map(c => (
          <TouchableOpacity
            key={c.id}
            style={[s.card, { borderLeftColor: c.columnColor, borderLeftWidth: 3 }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSelected(c.id);
            }}
            activeOpacity={0.8}
          >
            <View style={s.cardTop}>
              <View style={[s.cardId, { backgroundColor: c.columnColor + '22' }]}>
                <Text style={[s.cardIdText, { color: c.columnColor }]}>{c.id.toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.cardTitle}>{c.title}</Text>
                <Text style={s.cardSub}>{c.subtitle}</Text>
              </View>
              <Text style={s.cardChevron}>›</Text>
            </View>
            {c.note && (
              <View style={s.cardNoteRow}>
                <Text style={s.cardNoteText}>ℹ️  {c.note}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}

        <View style={s.footer}>
          <Text style={s.footerTitle}>QUESTION UNIVERSELLE</Text>
          <Text style={s.footerText}>
            « Quand je t'ai demandé de revivre, tu as revécu quoi ? »
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: Colors.darkBlue },
  header:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  back:      { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', minWidth: 70 },
  backText:  { color: 'rgba(255,255,255,0.55)', fontSize: 13, fontWeight: '600' },
  badge:     { backgroundColor: 'rgba(14,224,229,0.1)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(14,224,229,0.3)' },
  badgeText: { color: Colors.turquoise, fontSize: 9, fontWeight: '700', letterSpacing: 1.5 },

  filters:         { flexDirection: 'row', paddingHorizontal: 16, gap: 6, marginBottom: 4 },
  filterBtn:       { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.03)' },
  filterBtnActive: { backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.25)' },
  filterText:      { color: Colors.gray, fontSize: 12, fontWeight: '600' },
  filterTextActive:{ color: Colors.white },

  body:     { padding: 16, gap: 8, paddingBottom: 48 },
  introBox: { padding: 13, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginBottom: 4 },
  introText:{ color: 'rgba(255,255,255,0.6)', fontSize: 12, textAlign: 'center', lineHeight: 20 },

  card:        { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', overflow: 'hidden' },
  cardTop:     { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 13 },
  cardId:      { width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  cardIdText:  { fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
  cardTitle:   { color: Colors.white, fontSize: 13, fontWeight: '700' },
  cardSub:     { color: Colors.gray, fontSize: 11, marginTop: 2 },
  cardChevron: { color: 'rgba(255,255,255,0.25)', fontSize: 18 },
  cardNoteRow: { paddingHorizontal: 13, paddingBottom: 10 },
  cardNoteText:{ color: 'rgba(255,200,100,0.7)', fontSize: 11 },

  footer:      { marginTop: 8, padding: 14, backgroundColor: 'rgba(14,224,229,0.06)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(14,224,229,0.18)', gap: 6 },
  footerTitle: { fontSize: 9, color: Colors.turquoise, letterSpacing: 1.5, fontWeight: '700', textAlign: 'center' },
  footerText:  { color: 'rgba(255,255,255,0.55)', fontSize: 13, textAlign: 'center', lineHeight: 20, fontStyle: 'italic' },

  // ── Détail ──
  detailBody:    { padding: 20, gap: 16, paddingBottom: 48 },
  detailId:      { fontSize: 32, fontWeight: '800', color: 'rgba(255,255,255,0.1)', letterSpacing: 3 },
  detailTitle:   { fontSize: 24, fontWeight: '700', color: Colors.white, marginTop: -10 },
  detailSub:     { color: Colors.gray, fontSize: 13, lineHeight: 20 },
  noteBox:       { padding: 11, backgroundColor: 'rgba(255,200,0,0.08)', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,200,0,0.25)' },
  noteText:      { color: 'rgba(255,225,100,0.9)', fontSize: 12 },
  sectionLabel:  { fontSize: 10, color: Colors.gray, letterSpacing: 1.5, fontWeight: '700' },
  signsList:     { gap: 8, marginTop: -6 },
  signRow:       { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  signDot:       { width: 6, height: 6, borderRadius: 3, marginTop: 8, flexShrink: 0 },
  signText:      { color: 'rgba(255,255,255,0.75)', fontSize: 13, lineHeight: 20, flex: 1 },
  questionBox:   { padding: 16, borderRadius: 12, borderWidth: 1 },
  questionText:  { fontSize: 14, fontWeight: '600', lineHeight: 22, fontStyle: 'italic' },
  correctionBox: { padding: 14, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginTop: -6 },
  correctionText:{ color: 'rgba(255,255,255,0.8)', fontSize: 13, lineHeight: 21 },
  ruleBox:       { padding: 13, backgroundColor: 'rgba(14,224,229,0.06)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(14,224,229,0.2)' },
  ruleText:      { color: 'rgba(255,255,255,0.5)', fontSize: 12, lineHeight: 19 },
  navRow:        { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  navBtn:        { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  navBtnText:    { color: Colors.gray, fontSize: 13, fontWeight: '600' },
});
