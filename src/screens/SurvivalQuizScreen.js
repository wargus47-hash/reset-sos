import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, ScrollView, Animated,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '../theme/colors';

// ─────────────────────────────────────────────────────────────────────────────
// QUIZ — 12 scénarios · 4 stratégies de survie
// F = Fuite  |  I = Inhibition (Figement)  |  A = Attaque  |  C = Contrôle
// ─────────────────────────────────────────────────────────────────────────────

const STRATEGIES = {
  F: { id: 'F', label: 'Fuite',       emoji: '🏃', color: '#4A90D9',
       desc: 'Évitement, procrastination, décrochage. Le système fuit ce qu\'il perçoit comme un danger pour préserver l\'énergie.',
       tip:  'Travailler les perturbations liées à l\'insécurité, au danger, au manque de confiance en soi.' },
  I: { id: 'I', label: 'Inhibition',  emoji: '🧊', color: Colors.purple,
       desc: 'Figement, paralysie, perte de moyens. Le corps se fige pour "passer inaperçu" — la réponse la plus profondément enkystée.',
       tip:  'Travailler les perturbations liées à la sidération, à la honte, à la peur d\'être vu.' },
  A: { id: 'A', label: 'Attaque',     emoji: '⚡', color: Colors.pink,
       desc: 'Réactions vives, colère, impulsivité. L\'énergie de survie se libère par l\'explosion pour faire face à la menace perçue.',
       tip:  'Travailler les perturbations liées à l\'injustice, la frustration, la violation des limites.' },
  C: { id: 'C', label: 'Contrôle',    emoji: '🎯', color: Colors.turquoise,
       desc: 'Perfectionnisme, hyperactivité, besoin de maîtrise. Le système cherche à tout anticiper pour neutraliser le danger.',
       tip:  'Travailler les perturbations liées au manque de sécurité, à la peur de l\'échec, au besoin de prévisibilité.' },
};

const QUESTIONS = [
  {
    scenario: 'Face à un conflit avec un proche, tu tends à :',
    answers: [
      { text: 'Changer de sujet ou quitter la pièce',                           strat: 'F' },
      { text: 'Te figer, ne plus savoir quoi dire',                              strat: 'I' },
      { text: 'Hausser le ton ou te défendre vigoureusement',                    strat: 'A' },
      { text: 'Chercher à avoir le dernier mot et à "gagner"',                   strat: 'C' },
    ],
  },
  {
    scenario: 'Quand tu as un délai important à respecter :',
    answers: [
      { text: 'Procrastiner jusqu\'au dernier moment',                            strat: 'F' },
      { text: 'Te paralyser devant la tâche, incapable de commencer',             strat: 'I' },
      { text: 'Devenir irritable et brusque avec ton entourage',                  strat: 'A' },
      { text: 'Tout contrôler, re-vérifier sans cesse pour être sûr(e)',         strat: 'C' },
    ],
  },
  {
    scenario: 'Dans une situation sociale gênante, tu :',
    answers: [
      { text: 'Trouves une excuse pour partir le plus vite possible',             strat: 'F' },
      { text: 'Restes figé(e), sourire forcé, sans savoir quoi faire',            strat: 'I' },
      { text: 'Dis franchement ce que tu penses, même si ça dérange',            strat: 'A' },
      { text: 'Prends le contrôle de la conversation',                           strat: 'C' },
    ],
  },
  {
    scenario: 'Face à une injustice que tu vis directement :',
    answers: [
      { text: 'Te dire que ça va passer et éviter d\'en parler',                  strat: 'F' },
      { text: 'Rester pétrifié(e), incapable de réagir sur le moment',           strat: 'I' },
      { text: 'Réagir immédiatement et avec force',                              strat: 'A' },
      { text: 'Trouver un moyen de rétablir l\'équilibre à ta façon',            strat: 'C' },
    ],
  },
  {
    scenario: 'Quand quelqu\'un ne fait pas ce que tu attends de lui :',
    answers: [
      { text: 'Tu finis par le faire toi-même pour éviter les frictions',         strat: 'F' },
      { text: 'Tu n\'arrives pas à exprimer ta déception, tu te tais',            strat: 'I' },
      { text: 'Tu montres clairement ta contrariété',                             strat: 'A' },
      { text: 'Tu reprends toi-même les rênes de la situation',                  strat: 'C' },
    ],
  },
  {
    scenario: 'Face à une peur intense ou un danger soudain :',
    answers: [
      { text: 'Tu t\'éloignes ou tu évites systématiquement la situation',        strat: 'F' },
      { text: 'Ton corps se fige, tu ne peux plus bouger ni parler',              strat: 'I' },
      { text: 'Tu cries, réagis de façon explosive ou défensive',                strat: 'A' },
      { text: 'Tu rationalises et essaies de tout contrôler mentalement',        strat: 'C' },
    ],
  },
  {
    scenario: 'Quand on te critique ou te remet en question :',
    answers: [
      { text: 'Tu changes de sujet ou minimises la critique',                    strat: 'F' },
      { text: 'Tu te tais, tu te refermes et tu rumines seul(e)',                strat: 'I' },
      { text: 'Tu te défends immédiatement et avec vigueur',                     strat: 'A' },
      { text: 'Tu analyses la critique et corriges le tir sur-le-champ',         strat: 'C' },
    ],
  },
  {
    scenario: 'Avant un événement important (présentation, exam, entretien) :',
    answers: [
      { text: 'Tu hésites longtemps, parfois tu déclines ou tu annules',          strat: 'F' },
      { text: 'Tu te sens paralysé(e), incapable de commencer à préparer',        strat: 'I' },
      { text: 'Tu deviens irritable et tendu(e) avec tes proches',                strat: 'A' },
      { text: 'Tu prépares à l\'excès pour ne rien laisser au hasard',            strat: 'C' },
    ],
  },
  {
    scenario: 'Quand tu dois faire une demande importante :',
    answers: [
      { text: 'Tu attends le "bon moment" qui n\'arrive jamais',                  strat: 'F' },
      { text: 'Tu voudrais demander mais tu n\'arrives pas à formuler',           strat: 'I' },
      { text: 'Tu formules ta demande de façon directe, voire insistante',        strat: 'A' },
      { text: 'Tu prépares ta stratégie dans les moindres détails d\'abord',      strat: 'C' },
    ],
  },
  {
    scenario: 'Face à une surcharge de travail ou de pression :',
    answers: [
      { text: 'Tu te réfugies dans d\'autres activités (réseaux, café, séries…)',  strat: 'F' },
      { text: 'Tu restes devant ta tâche sans pouvoir avancer',                   strat: 'I' },
      { text: 'Tu montres ton mécontentement clairement autour de toi',           strat: 'A' },
      { text: 'Tu fais des heures supplémentaires pour tout maîtriser',          strat: 'C' },
    ],
  },
  {
    scenario: 'Quand quelqu\'un te blesse émotionnellement :',
    answers: [
      { text: 'Tu prends tes distances sans rien dire',                           strat: 'F' },
      { text: 'Tu restes sidéré(e), incapable de répondre sur le moment',         strat: 'I' },
      { text: 'Tu rends le coup ou tu verbalises fort ce que tu ressens',         strat: 'A' },
      { text: 'Tu calcules comment reprendre le pouvoir dans la relation',        strat: 'C' },
    ],
  },
  {
    scenario: 'En cas d\'imprévu ou de changement non désiré :',
    answers: [
      { text: 'Tu cherches à esquiver ou à reporter le changement',               strat: 'F' },
      { text: 'Tu te sens bloqué(e) et incapable de t\'adapter',                  strat: 'I' },
      { text: 'Tu réagis avec frustration ou irritation visibles',                strat: 'A' },
      { text: 'Tu reprends immédiatement le contrôle de la situation',           strat: 'C' },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
export default function SurvivalQuizScreen({ navigation }) {
  const [currentQ,  setCurrentQ]  = useState(0);
  const [answers,   setAnswers]   = useState([]); // array of strat codes
  const [selected,  setSelected]  = useState(null);
  const [showResult, setShowResult] = useState(false);

  const choose = (strat) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelected(strat);
  };

  const next = () => {
    if (!selected) return;
    const newAnswers = [...answers, selected];
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (currentQ < QUESTIONS.length - 1) {
      setAnswers(newAnswers);
      setCurrentQ(currentQ + 1);
      setSelected(null);
    } else {
      setAnswers(newAnswers);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowResult(true);
    }
  };

  const restart = () => {
    setCurrentQ(0); setAnswers([]); setSelected(null); setShowResult(false);
  };

  const counts = () => {
    const c = { F: 0, I: 0, A: 0, C: 0 };
    answers.forEach(a => { c[a]++; });
    return c;
  };

  const dominant = () => {
    const c = counts();
    return Object.entries(c).sort((a, b) => b[1] - a[1])[0]?.[0];
  };

  // ── Vue résultats ──────────────────────────────────────────────────────────
  if (showResult) {
    const c = counts();
    const dom = dominant();
    const sorted = Object.entries(c).sort((a, b) => b[1] - a[1]);

    return (
      <SafeAreaView style={s.safe}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.darkBlue} />
        <View style={s.header}>
          <TouchableOpacity style={s.back} onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={s.backText}>‹ Retour</Text>
          </TouchableOpacity>
          <View style={s.badge}><Text style={s.badgeText}>TON PROFIL</Text></View>
          <View style={{ width: 70 }} />
        </View>
        <ScrollView contentContainerStyle={s.body}>

          {/* Dominant */}
          {dom && (
            <View style={[s.dominantCard, { borderColor: STRATEGIES[dom].color + '50' }]}>
              <Text style={s.dominantEmoji}>{STRATEGIES[dom].emoji}</Text>
              <Text style={s.dominantLabel}>Stratégie dominante</Text>
              <Text style={[s.dominantName, { color: STRATEGIES[dom].color }]}>
                {STRATEGIES[dom].label}
              </Text>
              <Text style={s.dominantDesc}>{STRATEGIES[dom].desc}</Text>
              <View style={[s.tipBox, { borderColor: STRATEGIES[dom].color + '35', backgroundColor: STRATEGIES[dom].color + '0A' }]}>
                <Text style={s.tipLabel}>PISTE DE TRAVAIL</Text>
                <Text style={[s.tipText, { color: STRATEGIES[dom].color }]}>{STRATEGIES[dom].tip}</Text>
              </View>
            </View>
          )}

          {/* Barres par stratégie */}
          <Text style={s.sectionLabel}>RÉPARTITION DE TES RÉPONSES</Text>
          {sorted.map(([key, val]) => {
            const strat = STRATEGIES[key];
            const pct = Math.round((val / QUESTIONS.length) * 100);
            return (
              <View key={key} style={s.stratRow}>
                <Text style={s.stratEmoji}>{strat.emoji}</Text>
                <View style={{ flex: 1, gap: 4 }}>
                  <View style={s.stratLabelRow}>
                    <Text style={[s.stratLabel, { color: strat.color }]}>{strat.label}</Text>
                    <Text style={s.stratCount}>{val} / {QUESTIONS.length}  ({pct}%)</Text>
                  </View>
                  <View style={s.stratBarBg}>
                    <View style={[s.stratBarFill, { width: `${pct}%`, backgroundColor: strat.color }]} />
                  </View>
                </View>
              </View>
            );
          })}

          {/* Toutes les stratégies */}
          <Text style={[s.sectionLabel, { marginTop: 8 }]}>LES 4 STRATÉGIES</Text>
          {Object.values(STRATEGIES).map(st => (
            <View key={st.id} style={[s.stratDetailCard, { borderLeftColor: st.color, borderLeftWidth: 3 }]}>
              <View style={s.stratDetailHeader}>
                <Text style={s.stratDetailEmoji}>{st.emoji}</Text>
                <Text style={[s.stratDetailName, { color: st.color }]}>{st.label}</Text>
              </View>
              <Text style={s.stratDetailDesc}>{st.desc}</Text>
            </View>
          ))}

          <TouchableOpacity style={s.restartBtn} onPress={restart}>
            <Text style={s.restartBtnText}>↺  Refaire le quiz</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Vue question ───────────────────────────────────────────────────────────
  const q = QUESTIONS[currentQ];
  const progress = currentQ / QUESTIONS.length;

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.darkBlue} />

      <View style={s.header}>
        <TouchableOpacity style={s.back}
          onPress={currentQ === 0 ? () => navigation.goBack() : () => { setCurrentQ(currentQ - 1); setAnswers(answers.slice(0, -1)); setSelected(null); }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={s.backText}>‹ {currentQ === 0 ? 'Retour' : 'Préc.'}</Text>
        </TouchableOpacity>
        <View style={s.badge}><Text style={s.badgeText}>STRATÉGIES DE SURVIE</Text></View>
        <Text style={s.qCounter}>{currentQ + 1} / {QUESTIONS.length}</Text>
      </View>

      {/* Barre de progression */}
      <View style={s.progressBg}>
        <View style={[s.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      <ScrollView contentContainerStyle={s.body}>
        <Text style={s.scenarioText}>{q.scenario}</Text>

        <View style={s.answersBlock}>
          {q.answers.map((ans, i) => {
            const strat = STRATEGIES[ans.strat];
            const isSelected = selected === ans.strat;
            return (
              <TouchableOpacity
                key={i}
                style={[s.answerBtn,
                  isSelected && { borderColor: strat.color + '80', backgroundColor: strat.color + '12' }
                ]}
                onPress={() => choose(ans.strat)}
                activeOpacity={0.8}
              >
                {isSelected && (
                  <View style={[s.answerDot, { backgroundColor: strat.color }]} />
                )}
                <Text style={[s.answerText, isSelected && { color: Colors.white }]}>
                  {ans.text}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={[s.nextBtn, !selected && { opacity: 0.35 }]}
          onPress={next}
          disabled={!selected}
        >
          <Text style={s.nextBtnText}>
            {currentQ < QUESTIONS.length - 1 ? 'Question suivante  →' : 'Voir mes résultats  →'}
          </Text>
        </TouchableOpacity>
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
  qCounter:  { color: Colors.gray, fontSize: 12, fontWeight: '600', minWidth: 40, textAlign: 'right' },

  progressBg:   { height: 3, backgroundColor: 'rgba(255,255,255,0.08)', marginHorizontal: 16, borderRadius: 2 },
  progressFill: { height: '100%', backgroundColor: Colors.turquoise, borderRadius: 2 },

  body:         { padding: 20, gap: 20, paddingBottom: 48 },
  scenarioText: { color: Colors.white, fontSize: 18, fontWeight: '700', lineHeight: 27 },

  answersBlock: { gap: 10 },
  answerBtn:    { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 14, borderRadius: 13, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.04)' },
  answerDot:    { width: 8, height: 8, borderRadius: 4, marginTop: 6, flexShrink: 0 },
  answerText:   { flex: 1, color: Colors.gray, fontSize: 13, lineHeight: 20 },

  nextBtn:     { backgroundColor: Colors.turquoise, padding: 16, borderRadius: 14, alignItems: 'center' },
  nextBtnText: { color: Colors.darkBlue, fontSize: 15, fontWeight: '700' },

  // ── Résultats ──
  sectionLabel:  { fontSize: 10, color: Colors.gray, letterSpacing: 1.5, fontWeight: '700' },
  dominantCard:  { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16, borderWidth: 1, padding: 20, gap: 10, alignItems: 'center' },
  dominantEmoji: { fontSize: 40 },
  dominantLabel: { fontSize: 10, color: Colors.gray, letterSpacing: 1.5, fontWeight: '700' },
  dominantName:  { fontSize: 26, fontWeight: '700' },
  dominantDesc:  { color: 'rgba(255,255,255,0.65)', fontSize: 13, lineHeight: 21, textAlign: 'center' },
  tipBox:        { width: '100%', padding: 12, borderRadius: 12, borderWidth: 1, gap: 4 },
  tipLabel:      { fontSize: 9, color: Colors.gray, letterSpacing: 1.5, fontWeight: '700' },
  tipText:       { fontSize: 12, lineHeight: 19 },

  stratRow:       { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stratEmoji:     { fontSize: 22, width: 28 },
  stratLabelRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stratLabel:     { fontSize: 13, fontWeight: '700' },
  stratCount:     { color: Colors.gray, fontSize: 11 },
  stratBarBg:     { height: 8, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden' },
  stratBarFill:   { height: '100%', borderRadius: 4 },

  stratDetailCard:   { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', padding: 13, gap: 6 },
  stratDetailHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stratDetailEmoji:  { fontSize: 18 },
  stratDetailName:   { fontSize: 14, fontWeight: '700' },
  stratDetailDesc:   { color: Colors.gray, fontSize: 12, lineHeight: 19 },

  restartBtn:     { padding: 13, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  restartBtnText: { color: 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: '600' },
});
