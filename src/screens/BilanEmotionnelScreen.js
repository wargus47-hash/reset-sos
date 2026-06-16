import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, ScrollView,
  LayoutAnimation, UIManager, Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '../theme/colors';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ─────────────────────────────────────────────────────────────────────────────
// DOMAINES DE VIE — 7 domaines, 4 situations chacun
// ─────────────────────────────────────────────────────────────────────────────

const DOMAINS = [
  {
    id: 'transport', emoji: '🚗', label: 'Transport', color: '#4A90D9',
    situations: [
      'Conduire sur autoroute ou route rapide',
      'Être passager (quelqu\'un d\'autre conduit)',
      'Prendre l\'avion',
      'Transports en commun bondés',
    ],
  },
  {
    id: 'voyages', emoji: '🧳', label: 'Voyages', color: '#7B9EC8',
    situations: [
      'Dormir seul(e) dans un lieu inconnu',
      'Se retrouver perdu(e) ou désorienté(e)',
      'Être loin de chez soi pour longtemps',
      'Situations imprévues hors de son pays',
    ],
  },
  {
    id: 'animaux', emoji: '🐝', label: 'Animaux', color: '#E0A030',
    situations: [
      'Insectes (guêpes, araignées, cafards…)',
      'Chiens ou grands animaux',
      'Serpents ou reptiles',
      'Animaux qui se déplacent vite',
    ],
  },
  {
    id: 'nourriture', emoji: '🍽️', label: 'Nourriture', color: '#6BBF6B',
    situations: [
      'Certains aliments (texture, odeur, goût…)',
      'Nausée intense à la vue ou l\'odeur',
      'Manger en public ou sous le regard',
      'Comportements compulsifs autour de la nourriture',
    ],
  },
  {
    id: 'relations', emoji: '👥', label: 'Relations', color: Colors.pink,
    situations: [
      'Conflits avec des proches ou collègues',
      'Peur de l\'abandon ou du rejet',
      'Sentiment d\'être incompris(e)',
      'Jalousie ou dépendance affective',
    ],
  },
  {
    id: 'corps', emoji: '💊', label: 'Corps / Santé', color: Colors.purple,
    situations: [
      'Douleurs physiques inexpliquées',
      'Peur de tomber malade',
      'Relation difficile avec son propre corps',
      'Examens médicaux ou hôpitaux',
    ],
  },
  {
    id: 'pro', emoji: '⏰', label: 'Pro / Temps', color: Colors.turquoise,
    situations: [
      'Délais, deadlines et urgences',
      'Peur de l\'échec ou du jugement professionnel',
      'Relations difficiles avec la hiérarchie',
      'Surcharge, burn-out ou perfectionnisme',
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
export default function BilanEmotionnelScreen({ navigation }) {
  // scores[domainId][situationIndex] = 0-10 | null
  const initScores = () => {
    const obj = {};
    DOMAINS.forEach(d => { obj[d.id] = d.situations.map(() => null); });
    return obj;
  };

  const [scores,       setScores]       = useState(initScores());
  const [expanded,     setExpanded]     = useState(null);
  const [showResults,  setShowResults]  = useState(false);

  const toggle = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(p => p === id ? null : id);
  };

  const setScore = (domainId, idx, val) => {
    setScores(prev => {
      const copy = { ...prev, [domainId]: [...prev[domainId]] };
      copy[domainId][idx] = val;
      return copy;
    });
  };

  const domainMax = (domainId) => {
    const vals = scores[domainId].filter(v => v !== null);
    return vals.length ? Math.max(...vals) : null;
  };

  const domainAnswered = (domainId) => scores[domainId].some(v => v !== null);

  const totalAnswered = DOMAINS.filter(d => domainAnswered(d.id)).length;

  // Résultats triés
  const results = DOMAINS
    .map(d => ({ ...d, maxScore: domainMax(d.id), avgScore: (() => {
      const vals = scores[d.id].filter(v => v !== null);
      return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
    })() }))
    .filter(d => d.maxScore !== null)
    .sort((a, b) => b.maxScore - a.maxScore);

  const colorForScore = (n) => n >= 7 ? Colors.pink : n >= 4 ? '#E08030' : Colors.turquoise;

  // ── Vue résultats ──────────────────────────────────────────────────────────
  if (showResults) {
    return (
      <SafeAreaView style={s.safe}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.darkBlue} />
        <View style={s.header}>
          <TouchableOpacity style={s.back} onPress={() => setShowResults(false)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={s.backText}>‹ Retour</Text>
          </TouchableOpacity>
          <View style={s.badge}><Text style={s.badgeText}>RÉSULTATS</Text></View>
          <View style={{ width: 70 }} />
        </View>

        <ScrollView contentContainerStyle={s.body}>

          {results.length === 0 ? (
            <View style={s.emptyBox}>
              <Text style={s.emptyText}>Aucune perturbation évaluée.</Text>
            </View>
          ) : (
            <>
              <View style={s.resultIntro}>
                <Text style={s.resultIntroText}>
                  {results.length} domaine{results.length > 1 ? 's' : ''} identifié{results.length > 1 ? 's' : ''}, classés par intensité maximale.
                </Text>
              </View>

              {results.map((d, i) => {
                const c = colorForScore(d.maxScore);
                return (
                  <View key={d.id} style={[s.resultCard, { borderLeftColor: c, borderLeftWidth: 3 }]}>
                    <View style={s.resultCardTop}>
                      <View style={[s.resultRank, { backgroundColor: c + '20' }]}>
                        <Text style={[s.resultRankText, { color: c }]}>{i + 1}</Text>
                      </View>
                      <Text style={s.resultEmoji}>{d.emoji}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={s.resultLabel}>{d.label}</Text>
                        <Text style={s.resultMeta}>
                          Max : <Text style={{ color: c, fontWeight: '700' }}>{d.maxScore}/10</Text>
                          {d.avgScore !== null && d.avgScore !== d.maxScore
                            ? `  ·  Moy : ${d.avgScore}/10` : ''}
                        </Text>
                      </View>
                      <View style={s.resultBarWrap}>
                        <View style={[s.resultBar, { width: `${d.maxScore * 10}%`, backgroundColor: c }]} />
                      </View>
                    </View>
                    {/* Situations avec scores */}
                    {scores[d.id].map((val, idx) => val !== null ? (
                      <View key={idx} style={s.resultSitRow}>
                        <View style={[s.resultSitDot, { backgroundColor: colorForScore(val) }]} />
                        <Text style={s.resultSitText}>{d.situations[idx]}</Text>
                        <Text style={[s.resultSitScore, { color: colorForScore(val) }]}>{val}</Text>
                      </View>
                    ) : null)}
                  </View>
                );
              })}

              <View style={s.conclusionBox}>
                <Text style={s.conclusionTitle}>À RETENIR</Text>
                <Text style={s.conclusionText}>
                  Les perturbations identifiées avec une intensité élevée (7-10) sont celles qui
                  réagissent le mieux à RESET. Chaque domaine peut être travaillé séance par séance.
                </Text>
              </View>
            </>
          )}

          <TouchableOpacity style={s.resetBtn} onPress={() => { setScores(initScores()); setShowResults(false); }}>
            <Text style={s.resetBtnText}>↺  Recommencer le bilan</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Vue formulaire ─────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.darkBlue} />

      <View style={s.header}>
        <TouchableOpacity style={s.back} onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={s.backText}>‹ Retour</Text>
        </TouchableOpacity>
        <View style={s.badge}><Text style={s.badgeText}>BILAN ÉMOTIONNEL</Text></View>
        <View style={{ width: 70 }} />
      </View>

      <ScrollView contentContainerStyle={s.body}>

        <View style={s.introCard}>
          <Text style={s.introText}>
            Pour chaque situation ci-dessous, appuie sur le score qui correspond à l'intensité
            de ton ressenti (0 = rien, 10 = très fort).
          </Text>
        </View>

        {DOMAINS.map(domain => {
          const isOpen    = expanded === domain.id;
          const answered  = domainAnswered(domain.id);
          const maxVal    = domainMax(domain.id);

          return (
            <TouchableOpacity
              key={domain.id}
              style={[s.domainCard, isOpen && { borderColor: domain.color + '50' }]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); toggle(domain.id); }}
              activeOpacity={0.85}
            >
              <View style={s.domainHeader}>
                <Text style={s.domainEmoji}>{domain.emoji}</Text>
                <Text style={[s.domainLabel, isOpen && { color: domain.color }]}>{domain.label}</Text>
                {answered && maxVal !== null && (
                  <View style={[s.domainBadge, { backgroundColor: colorForScore(maxVal) + '22', borderColor: colorForScore(maxVal) + '50' }]}>
                    <Text style={[s.domainBadgeText, { color: colorForScore(maxVal) }]}>
                      {maxVal}/10
                    </Text>
                  </View>
                )}
                {answered && <Text style={[s.domainCheck, { color: domain.color }]}>✓</Text>}
                <Text style={s.domainChevron}>{isOpen ? '▲' : '▼'}</Text>
              </View>

              {isOpen && (
                <View style={s.domainBody}>
                  {domain.situations.map((sit, idx) => {
                    const val = scores[domain.id][idx];
                    return (
                      <View key={idx} style={s.situationBlock}>
                        <Text style={s.situationText}>{sit}</Text>
                        <View style={s.scoreRow}>
                          {[0,1,2,3,4,5,6,7,8,9,10].map(n => (
                            <TouchableOpacity
                              key={n}
                              style={[s.scoreDot,
                                val === n && { backgroundColor: colorForScore(n), transform: [{ scale: 1.2 }] },
                                val !== n && n === 0 && { backgroundColor: 'rgba(253,250,244,0.15)' },
                              ]}
                              onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                setScore(domain.id, idx, n);
                              }}
                              hitSlop={{ top: 4, bottom: 4 }}
                            >
                              <Text style={[s.scoreDotText, val === n && { color: Colors.darkBlue }]}>
                                {n}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity
          style={[s.ctaBtn, totalAnswered === 0 && { opacity: 0.4 }]}
          onPress={() => {
            if (totalAnswered === 0) return;
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setShowResults(true);
          }}
          disabled={totalAnswered === 0}
        >
          <Text style={s.ctaBtnText}>
            Voir mon bilan  →  ({totalAnswered}/{DOMAINS.length} domaines)
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
  back:      { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 20, backgroundColor: 'rgba(253,250,244,0.07)', borderWidth: 1, borderColor: 'rgba(253,250,244,0.12)', minWidth: 70 },
  backText:  { color: 'rgba(253,250,244,0.55)', fontSize: 13, fontWeight: '600' },
  badge:     { backgroundColor: 'rgba(1,219,238,0.1)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(1,219,238,0.3)' },
  badgeText: { color: Colors.turquoise, fontSize: 9, fontWeight: '700', letterSpacing: 1.5 },

  body:      { padding: 16, gap: 10, paddingBottom: 48 },
  introCard: { padding: 13, backgroundColor: 'rgba(1,219,238,0.07)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(1,219,238,0.2)' },
  introText: { color: 'rgba(253,250,244,0.6)', fontSize: 12, lineHeight: 20 },

  domainCard:   { backgroundColor: 'rgba(253,250,244,0.04)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(253,250,244,0.08)', overflow: 'hidden' },
  domainHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14 },
  domainEmoji:  { fontSize: 22 },
  domainLabel:  { flex: 1, color: Colors.white, fontSize: 14, fontWeight: '700' },
  domainBadge:  { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  domainBadgeText: { fontSize: 11, fontWeight: '700' },
  domainCheck:  { fontSize: 14, fontWeight: '700' },
  domainChevron:{ color: 'rgba(253,250,244,0.25)', fontSize: 10 },

  domainBody:       { paddingHorizontal: 14, paddingBottom: 14, gap: 14 },
  situationBlock:   { gap: 8 },
  situationText:    { color: 'rgba(253,250,244,0.75)', fontSize: 12, lineHeight: 18 },
  scoreRow:         { flexDirection: 'row', gap: 4 },
  scoreDot:         { flex: 1, height: 28, borderRadius: 6, backgroundColor: 'rgba(253,250,244,0.08)', alignItems: 'center', justifyContent: 'center' },
  scoreDotText:     { fontSize: 9, color: Colors.gray, fontWeight: '700' },

  ctaBtn:     { backgroundColor: Colors.turquoise, padding: 16, borderRadius: 14, alignItems: 'center', marginTop: 4 },
  ctaBtnText: { color: Colors.darkBlue, fontSize: 15, fontWeight: '700' },

  // ── Résultats ──
  resultIntro:     { padding: 12, backgroundColor: 'rgba(253,250,244,0.04)', borderRadius: 12 },
  resultIntroText: { color: Colors.gray, fontSize: 12, textAlign: 'center' },
  emptyBox:        { paddingTop: 48, alignItems: 'center' },
  emptyText:       { color: Colors.gray, fontSize: 14 },

  resultCard:      { backgroundColor: 'rgba(253,250,244,0.04)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(253,250,244,0.07)', overflow: 'hidden', padding: 14, gap: 10 },
  resultCardTop:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  resultRank:      { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  resultRankText:  { fontSize: 13, fontWeight: '800' },
  resultEmoji:     { fontSize: 20 },
  resultLabel:     { color: Colors.white, fontSize: 14, fontWeight: '700' },
  resultMeta:      { color: Colors.gray, fontSize: 11, marginTop: 2 },
  resultBarWrap:   { width: 60, height: 6, backgroundColor: 'rgba(253,250,244,0.08)', borderRadius: 3, overflow: 'hidden' },
  resultBar:       { height: '100%', borderRadius: 3 },
  resultSitRow:    { flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 4 },
  resultSitDot:    { width: 5, height: 5, borderRadius: 2.5, flexShrink: 0 },
  resultSitText:   { flex: 1, color: Colors.gray, fontSize: 11, lineHeight: 16 },
  resultSitScore:  { fontSize: 12, fontWeight: '700', minWidth: 20, textAlign: 'right' },

  conclusionBox:   { padding: 14, backgroundColor: 'rgba(1,219,238,0.06)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(1,219,238,0.2)', gap: 6 },
  conclusionTitle: { fontSize: 9, color: Colors.turquoise, letterSpacing: 1.5, fontWeight: '700' },
  conclusionText:  { color: 'rgba(253,250,244,0.55)', fontSize: 12, lineHeight: 20 },

  resetBtn:     { padding: 13, backgroundColor: 'rgba(253,250,244,0.05)', borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(253,250,244,0.08)' },
  resetBtnText: { color: 'rgba(253,250,244,0.4)', fontSize: 13, fontWeight: '600' },
});
