import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, ScrollView,
  Animated, LayoutAnimation, UIManager, Platform,
} from 'react-native';
import { Colors } from '../theme/colors';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ─────────────────────────────────────────────────────────────────────────────
// DONNÉES — tirées du Livret de Formation RESET et de l'Ebook
// ─────────────────────────────────────────────────────────────────────────────

const EMOTIONS = [
  { emoji: '😨', name: 'Peur',      color: '#4A90D9', desc: 'Signal de danger. Prépare le corps à fuir ou à se figer.' },
  { emoji: '😠', name: 'Colère',    color: Colors.pink, desc: 'Signal de violation. Prépare le corps à se défendre ou attaquer.' },
  { emoji: '😢', name: 'Tristesse', color: '#7B9EC8', desc: 'Signal de perte. Invite au repli et à l\'intégration.' },
  { emoji: '🤢', name: 'Dégoût',    color: '#6BBF6B', desc: 'Signal de rejet. Protège des situations ou personnes nuisibles.' },
  { emoji: '😊', name: 'Joie',      color: Colors.turquoise, desc: 'Signal de satisfaction. Renforce les comportements bénéfiques.' },
];

const RESPONSES = [
  {
    emoji: '🏃', name: 'La Fuite',    color: '#4A90D9',
    desc:  'Le système nerveux choisit de fuir la situation perçue comme dangereuse. En cas de fuite impossible, la charge émotionnelle reste figée.',
    signs: ['Évitement des situations', 'Procrastination', 'Fuite dans l\'activité', 'Comportements addictifs'],
  },
  {
    emoji: '🧊', name: 'Le Figement', color: Colors.purple,
    desc:  'Le corps se paralyse pour passer inaperçu ou minimiser le danger. C\'est la réponse la plus profondément enkystée.',
    signs: ['Tétanisation face au stress', 'Perte de moyens', 'Dissociation', 'Sentiment d\'être bloqué'],
  },
  {
    emoji: '⚡', name: 'L\'Attaque',  color: Colors.pink,
    desc:  'Le corps mobilise toute son énergie pour faire face. Souvent confondue à tort avec une "mauvaise" personnalité.',
    signs: ['Colères disproportionnées', 'Irritabilité chronique', 'Réactions impulsives', 'Tension relationnelle'],
  },
];

const WHY_NOT = [
  {
    emoji: '🧘', title: 'Se calmer',     color: Colors.gray,
    text: 'Les techniques de relaxation, de respiration ou de méditation apaisent temporairement les symptômes. Mais la charge émotionnelle reste intacte dans la mémoire du corps — elle reviendra.',
  },
  {
    emoji: '🧠', title: 'Comprendre',    color: Colors.gray,
    text: 'Identifier l\'origine d\'une réaction ne la désactive pas. "Je sais pourquoi j\'ai peur mais j\'ai toujours peur." Le problème n\'est pas dans la tête, il est dans le corps.',
  },
  {
    emoji: '💬', title: 'En parler',     color: Colors.gray,
    text: 'Verbaliser peut aider à prendre du recul, mais revivre l\'événement sans le réguler peut même renforcer l\'empreinte émotionnelle.',
  },
];

const HOW_RESET = [
  { step: '01', text: 'Ferme les yeux et porte ton attention sur tes sensations physiques.' },
  { step: '02', text: 'Laisse ces sensations évoluer par elles-mêmes, sans les juger ni les contrôler.' },
  { step: '03', text: 'Reste présent à ce qui se passe dans le corps, sans interférer.' },
  { step: '04', text: 'Le corps termine le cycle émotionnel laissé en suspens — définitivement.' },
  { step: '05', text: 'Ouvre les yeux quand tu sens que la perturbation s\'est apaisée d\'elle-même.' },
];

// ─────────────────────────────────────────────────────────────────────────────

const APPLICATIONS = [
  {
    id: 'peurs', emoji: '😨', label: 'Peurs',        color: '#4A90D9',
    items: [
      'Peur de l\'échec',         'Peur du jugement des autres',
      'Peur de l\'abandon',       'Phobies (araignées, avion, foule…)',
      'Peur du vide ou des hauteurs', 'Peur de la maladie',
      'Peur d\'être seul(e)',     'Anxiété sociale',
      'Agoraphobie / claustrophobie', 'Peur de la mort',
      'Peur de l\'intimité',      'Peur de l\'avenir',
    ],
  },
  {
    id: 'comportements', emoji: '🔄', label: 'Comportements', color: Colors.purple,
    items: [
      'Procrastination chronique',    'Perfectionnisme paralysant',
      'Syndrome de l\'imposteur',     'Sabotage personnel',
      'Dépendance affective',         'Relations toxiques répétées',
      'Hyperactivité / agitation',    'Burn-out émotionnel',
      'Comportements compulsifs',     'Difficultés à s\'affirmer',
      'Besoin de contrôle excessif',  'Hypersensibilité',
    ],
  },
  {
    id: 'sentiments', emoji: '💭', label: 'Sentiments',   color: Colors.pink,
    items: [
      'Colère récurrente ou incontrôlable', 'Tristesse chronique',
      'Anxiété généralisée',               'Culpabilité persistante',
      'Honte profonde',                    'Jalousie envahissante',
      'Sentiment d\'injustice',            'Impression d\'être incompris(e)',
      'Sentiment de vide intérieur',       'Ressentiment tenace',
      'Frustration permanente',            'Solitude émotionnelle',
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────

const IE_DIMENSIONS = [
  {
    id: 'conscience',
    emoji: '🔍',
    name: 'Conscience de soi',
    color: Colors.turquoise,
    desc: 'Capacité à reconnaître ses propres émotions, ses forces et ses limites au moment où elles se manifestent.',
    indicators: ['Je reconnais rapidement ce que je ressens', 'Je comprends l\'impact de mes émotions sur mes actes', 'J\'accepte mes limites sans me dévaloriser'],
    resetHelp: 'En régulant les perturbations, RESET libère ton accès aux émotions réelles. Tu ressens mieux ce qui se passe en toi, sans bruit de fond émotionnel.',
  },
  {
    id: 'maitrise',
    emoji: '🎯',
    name: 'Maîtrise de soi',
    color: Colors.purple,
    desc: 'Capacité à gérer ses impulsions, à rester calme sous pression et à s\'adapter aux changements.',
    indicators: ['Je ne réagis pas impulsivement', 'Je reste calme dans les situations stressantes', 'Je m\'adapte facilement aux imprévus'],
    resetHelp: 'Chaque perturbation régulée réduit les déclencheurs de réactions automatiques. Le calme devient ton état naturel, pas un effort constant.',
  },
  {
    id: 'empathie',
    emoji: '🤝',
    name: 'Empathie',
    color: '#4A90D9',
    desc: 'Capacité à percevoir et comprendre les émotions des autres, à se connecter réellement à leur vécu.',
    indicators: ['Je sens facilement l\'état émotionnel des autres', 'Je m\'adapte à leur besoin du moment', 'Je ne projette pas mes propres émotions sur eux'],
    resetHelp: 'Moins perturbé(e) par tes propres réactivités, tu as davantage d\'espace intérieur pour percevoir l\'autre sans filtres.',
  },
  {
    id: 'social',
    emoji: '🌐',
    name: 'Compétences sociales',
    color: Colors.pink,
    desc: 'Capacité à communiquer clairement, à gérer les conflits, à inspirer et à influencer positivement.',
    indicators: ['Je communique clairement sous pression', 'Je gère les conflits sans escalade', 'Je crée facilement un lien de confiance'],
    resetHelp: 'Tes perturbations relationnelles régulées (peur du jugement, colère, sentiment de rejet) transforment la qualité de tes interactions.',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Composant : section accordéon
// ─────────────────────────────────────────────────────────────────────────────
function Accordion({ title, icon, color, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen(o => !o);
  };
  return (
    <View style={[acc.wrap, open && { borderColor: color + '40' }]}>
      <TouchableOpacity style={acc.header} onPress={toggle} activeOpacity={0.8}>
        <Text style={acc.icon}>{icon}</Text>
        <Text style={[acc.title, open && { color }]}>{title}</Text>
        <Text style={acc.chevron}>{open ? '▲' : '▼'}</Text>
      </TouchableOpacity>
      {open && <View style={acc.body}>{children}</View>}
    </View>
  );
}
const acc = StyleSheet.create({
  wrap:    { backgroundColor: 'rgba(253,250,244,0.04)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(253,250,244,0.08)', overflow: 'hidden' },
  header:  { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  icon:    { fontSize: 22 },
  title:   { flex: 1, fontSize: 14, fontWeight: '700', color: Colors.white },
  chevron: { color: 'rgba(253,250,244,0.25)', fontSize: 10 },
  body:    { paddingHorizontal: 16, paddingBottom: 16, gap: 10 },
});

// ─────────────────────────────────────────────────────────────────────────────
// TAB 1 — La Méthode
// ─────────────────────────────────────────────────────────────────────────────
function TabMethode({ onGoToPractitioners }) {
  return (
    <ScrollView contentContainerStyle={styles.tabBody} showsVerticalScrollIndicator={false}>

      {/* Intro */}
      <View style={styles.introCard}>
        <Text style={styles.introText}>
          RESET ne cherche pas à <Text style={styles.introHighlight}>comprendre</Text> ni à{' '}
          <Text style={styles.introHighlight}>contrôler</Text>. Il invite simplement le corps à faire
          ce qu'il sait faire naturellement : <Text style={styles.introHighlight}>réguler l'émotion.</Text>
        </Text>
      </View>

      {/* Émotion vs Perturbation */}
      <Accordion title="Émotion vs Perturbation" icon="⚡" color={Colors.turquoise} defaultOpen>
        <View style={styles.compareRow}>
          <View style={[styles.compareCard, { borderColor: Colors.turquoise + '40' }]}>
            <Text style={[styles.compareTitle, { color: Colors.turquoise }]}>Émotion</Text>
            <Text style={styles.compareText}>Réaction naturelle et temporaire. Quelques secondes à quelques minutes. Elle passe d'elle-même.</Text>
          </View>
          <View style={[styles.compareCard, { borderColor: Colors.pink + '40' }]}>
            <Text style={[styles.compareTitle, { color: Colors.pink }]}>Perturbation</Text>
            <Text style={styles.compareText}>Résidu non régulé d'une émotion passée. Réaction disproportionnée. Elle revient dans des contextes similaires.</Text>
          </View>
        </View>
        <View style={styles.quoteBox}>
          <Text style={styles.quoteText}>
            "Ce n'est pas vous qui réagissez mal. C'est votre système de survie qui réactive une mémoire non régulée."
          </Text>
        </View>
      </Accordion>

      {/* 5 émotions */}
      <Accordion title="Les 5 émotions fondamentales" icon="🎭" color="#4A90D9">
        <Text style={styles.sectionNote}>Toute perturbation émotionnelle prend racine dans l'une de ces 5 émotions de base.</Text>
        {EMOTIONS.map(e => (
          <View key={e.name} style={[styles.emotionRow, { borderLeftColor: e.color }]}>
            <Text style={styles.emotionEmoji}>{e.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.emotionName, { color: e.color }]}>{e.name}</Text>
              <Text style={styles.emotionDesc}>{e.desc}</Text>
            </View>
          </View>
        ))}
      </Accordion>

      {/* 3 réponses */}
      <Accordion title="Les 3 réponses de survie" icon="🧬" color={Colors.purple}>
        <Text style={styles.sectionNote}>
          Face au danger, le système nerveux choisit instantanément l'une de ces 3 réponses.
          Quand elles ne peuvent pas se terminer, elles restent figées dans le corps.
        </Text>
        {RESPONSES.map(r => (
          <View key={r.name} style={[styles.responseCard, { borderColor: r.color + '40' }]}>
            <View style={styles.responseHeader}>
              <Text style={styles.responseEmoji}>{r.emoji}</Text>
              <Text style={[styles.responseName, { color: r.color }]}>{r.name}</Text>
            </View>
            <Text style={styles.responseDesc}>{r.desc}</Text>
            <View style={styles.signsList}>
              {r.signs.map(s => (
                <View key={s} style={styles.signItem}>
                  <Text style={[styles.signDot, { color: r.color }]}>·</Text>
                  <Text style={styles.signText}>{s}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}
      </Accordion>

      {/* Pourquoi les méthodes habituelles ne suffisent pas */}
      <Accordion title="Pourquoi les méthodes habituelles ne suffisent pas" icon="🔄" color={Colors.gray}>
        {WHY_NOT.map(w => (
          <View key={w.title} style={styles.whyCard}>
            <View style={styles.whyHeader}>
              <Text style={styles.whyEmoji}>{w.emoji}</Text>
              <Text style={styles.whyTitle}>{w.title}</Text>
            </View>
            <Text style={styles.whyText}>{w.text}</Text>
          </View>
        ))}
        <View style={styles.quoteBox}>
          <Text style={styles.quoteText}>
            "Le problème n'est pas dans la tête. Il est dans le corps."
          </Text>
        </View>
      </Accordion>

      {/* Comment RESET agit */}
      <Accordion title="Comment RESET agit" icon="✨" color={Colors.turquoise}>
        <Text style={styles.sectionNote}>
          RESET invite à aller à la rencontre des sensations désagréables — non pas pour les revivre,
          mais pour permettre au corps de terminer ce qu'il n'a pas pu finir.
        </Text>
        {HOW_RESET.map(h => (
          <View key={h.step} style={styles.stepRow}>
            <View style={styles.stepNum}>
              <Text style={styles.stepNumText}>{h.step}</Text>
            </View>
            <Text style={styles.stepText}>{h.text}</Text>
          </View>
        ))}
        <View style={[styles.quoteBox, { borderColor: 'rgba(1,219,238,0.3)', backgroundColor: 'rgba(1,219,238,0.06)' }]}>
          <Text style={[styles.quoteText, { color: Colors.turquoise }]}>
            "La charge émotionnelle est régulée, la mémoire du traumatisme libérée — et c'est définitif."
          </Text>
        </View>
        <TouchableOpacity style={styles.ctaBtn} onPress={onGoToPractitioners} activeOpacity={0.85}>
          <Text style={styles.ctaBtnText}>Trouver un praticien certifié →</Text>
        </TouchableOpacity>
      </Accordion>

    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 2 — Domaines d'application
// ─────────────────────────────────────────────────────────────────────────────
function TabApplications({ onGoToPractitioners }) {
  const [activeCategory, setActiveCategory] = useState('peurs');
  const [expandedItem, setExpandedItem]     = useState(null);

  const category = APPLICATIONS.find(a => a.id === activeCategory);

  return (
    <ScrollView contentContainerStyle={styles.tabBody} showsVerticalScrollIndicator={false}>

      <View style={styles.introCard}>
        <Text style={styles.introText}>
          RESET peut traiter toutes les perturbations émotionnelles, quelle que soit leur origine.
          Voici les domaines les plus fréquemment travaillés.
        </Text>
      </View>

      {/* Sélecteur de catégorie */}
      <View style={styles.categoryPicker}>
        {APPLICATIONS.map(a => (
          <TouchableOpacity
            key={a.id}
            style={[styles.categoryBtn, activeCategory === a.id && { backgroundColor: a.color + '25', borderColor: a.color + '70' }]}
            onPress={() => { setActiveCategory(a.id); setExpandedItem(null); }}
            activeOpacity={0.8}
          >
            <Text style={styles.categoryEmoji}>{a.emoji}</Text>
            <Text style={[styles.categoryLabel, activeCategory === a.id && { color: a.color }]}>{a.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Liste des items */}
      <View style={styles.itemsBlock}>
        <Text style={[styles.itemsTitle, { color: category.color }]}>
          {category.emoji} {category.label}
        </Text>
        {category.items.map((item, i) => {
          const isExp = expandedItem === i;
          return (
            <TouchableOpacity
              key={i}
              style={[styles.appItem, isExp && { borderColor: category.color + '50', backgroundColor: category.color + '08' }]}
              onPress={() => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setExpandedItem(isExp ? null : i);
              }}
              activeOpacity={0.85}
            >
              <View style={styles.appItemRow}>
                <View style={[styles.appItemDot, { backgroundColor: category.color }]} />
                <Text style={styles.appItemText}>{item}</Text>
                <Text style={[styles.appItemChevron, isExp && { color: category.color }]}>
                  {isExp ? '▲' : '▼'}
                </Text>
              </View>
              {isExp && (
                <View style={styles.appItemExpanded}>
                  <Text style={styles.appItemExpandedText}>
                    Cette perturbation s'est probablement formée lors d'une expérience passée
                    où ton système de survie n'a pas pu terminer sa réponse. RESET permet au
                    corps de la réguler définitivement, sans revivre l'événement.
                  </Text>
                  <TouchableOpacity
                    style={[styles.appItemBtn, { backgroundColor: category.color + '20', borderColor: category.color + '50' }]}
                    onPress={onGoToPractitioners}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.appItemBtnText, { color: category.color }]}>
                      Trouver un praticien pour "{item}" →
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.appFootnote}>
        <Text style={styles.appFootnoteText}>
          💡 Cette liste n'est pas exhaustive. RESET peut s'appliquer à toute perturbation
          émotionnelle dès lors qu'elle génère des sensations dans le corps.
        </Text>
      </View>

    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 3 — Intelligence Émotionnelle
// ─────────────────────────────────────────────────────────────────────────────
const IE_LABELS = ['Faible', 'Basique', 'Moyen', 'Bon', 'Excellent'];

function TabIE() {
  const [scores, setScores] = useState({ conscience: 3, maitrise: 3, empathie: 3, social: 3 });
  const [showHelp, setShowHelp] = useState(null);

  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  const avgScore   = Math.round(totalScore / 4);

  const profileLabel = avgScore <= 1 ? 'À développer' : avgScore <= 2 ? 'En construction' : avgScore <= 3 ? 'En développement' : avgScore <= 4 ? 'Mature' : 'Expert';
  const profileColor = avgScore <= 2 ? Colors.pink : avgScore <= 3 ? '#E0A030' : Colors.turquoise;

  return (
    <ScrollView contentContainerStyle={styles.tabBody} showsVerticalScrollIndicator={false}>

      {/* Score global */}
      <View style={[styles.ieGlobal, { borderColor: profileColor + '50' }]}>
        <Text style={styles.ieGlobalLabel}>MON PROFIL IE</Text>
        <Text style={[styles.ieGlobalScore, { color: profileColor }]}>{profileLabel}</Text>
        <View style={styles.ieGlobalBar}>
          {IE_DIMENSIONS.map(d => (
            <View
              key={d.id}
              style={[styles.ieGlobalSegment, { backgroundColor: d.color, flex: scores[d.id] }]}
            />
          ))}
        </View>
        <Text style={styles.ieGlobalSub}>
          Évalue chaque dimension ci-dessous pour affiner ton profil
        </Text>
      </View>

      {/* Dimensions */}
      {IE_DIMENSIONS.map(dim => {
        const score = scores[dim.id];
        const isOpen = showHelp === dim.id;
        return (
          <View key={dim.id} style={[styles.ieCard, { borderColor: dim.color + '30' }]}>

            {/* En-tête */}
            <View style={styles.ieCardHeader}>
              <View style={[styles.ieCardIcon, { backgroundColor: dim.color + '20' }]}>
                <Text style={styles.ieCardEmoji}>{dim.emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.ieCardName, { color: dim.color }]}>{dim.name}</Text>
                <Text style={styles.ieCardDesc}>{dim.desc}</Text>
              </View>
            </View>

            {/* Indicateurs */}
            <View style={styles.ieIndicators}>
              {dim.indicators.map((ind, i) => (
                <View key={i} style={styles.ieIndicatorRow}>
                  <Text style={[styles.ieIndicatorDot, { color: dim.color }]}>·</Text>
                  <Text style={styles.ieIndicatorText}>{ind}</Text>
                </View>
              ))}
            </View>

            {/* Sélecteur de score */}
            <View style={styles.ieScoreBlock}>
              <Text style={styles.ieScoreLabel}>
                MON NIVEAU : <Text style={{ color: dim.color }}>{IE_LABELS[score - 1]}</Text>
              </Text>
              <View style={styles.ieScoreRow}>
                {[1, 2, 3, 4, 5].map(n => (
                  <TouchableOpacity
                    key={n}
                    style={[styles.ieScoreDot, { backgroundColor: score >= n ? dim.color : 'rgba(253,250,244,0.08)' }]}
                    onPress={() => setScores(s => ({ ...s, [dim.id]: n }))}
                    hitSlop={{ top: 8, bottom: 8 }}
                  />
                ))}
              </View>
            </View>

            {/* Comment RESET aide */}
            <TouchableOpacity
              style={[styles.ieHelpBtn, isOpen && { borderColor: dim.color + '50', backgroundColor: dim.color + '08' }]}
              onPress={() => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setShowHelp(isOpen ? null : dim.id);
              }}
            >
              <Text style={[styles.ieHelpBtnText, isOpen && { color: dim.color }]}>
                {isOpen ? '▲ ' : '▼ '}Comment RESET développe cette dimension
              </Text>
            </TouchableOpacity>
            {isOpen && (
              <View style={[styles.ieHelpContent, { borderColor: dim.color + '30', backgroundColor: dim.color + '06' }]}>
                <Text style={styles.ieHelpText}>{dim.resetHelp}</Text>
              </View>
            )}

          </View>
        );
      })}

      <View style={styles.ieCitation}>
        <Text style={styles.ieCitationText}>
          "L'intelligence émotionnelle n'est pas un trait de caractère fixe. C'est une compétence
          qui se développe — et RESET en déverrouille l'accès en supprimant les perturbations qui la bloquent."
        </Text>
        <Text style={styles.ieCitationAuthor}>— Livret de Formation RESET, Module 05</Text>
      </View>

    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 4 — Exercice : Émotions vs Interprétations
// ─────────────────────────────────────────────────────────────────────────────
const GAME_ITEMS = [
  // isEmotion = true → émotion pure (ressenti direct)
  { text: 'J\'ai peur',                           isEmotion: true  },
  { text: 'Je me sens en colère',                 isEmotion: true  },
  { text: 'Je suis triste',                       isEmotion: true  },
  { text: 'Je ressens de la joie',                isEmotion: true  },
  { text: 'Je me sens dégoûté(e)',                isEmotion: true  },
  // isEmotion = false → interprétation (histoire, jugement, sens donné)
  { text: 'Il ne m\'aime pas',                    isEmotion: false },
  { text: 'Je suis nul(le)',                      isEmotion: false },
  { text: 'Elle fait exprès de m\'énerver',        isEmotion: false },
  { text: 'C\'est entièrement ma faute',           isEmotion: false },
  { text: 'On me rejette toujours',               isEmotion: false },
  { text: 'Je ne mérite pas ça',                  isEmotion: false },
  { text: 'Ils pensent du mal de moi',            isEmotion: false },
  { text: 'Je n\'y arriverai jamais',              isEmotion: false },
  { text: 'Il me manque de respect',              isEmotion: false },
  { text: 'Cette situation est injuste',          isEmotion: false },
];

function TabExercice() {
  const [current,   setCurrent]   = useState(0);
  const [answers,   setAnswers]   = useState([]); // true/false per item
  const [selected,  setSelected]  = useState(null); // 'emotion' | 'interpretation' | null
  const [showResult, setShowResult] = useState(false);

  const items = GAME_ITEMS;
  const item  = items[current];

  const choose = (isEmotion) => {
    setSelected(isEmotion ? 'emotion' : 'interpretation');
  };

  const confirm = () => {
    if (selected === null) return;
    const userSaidEmotion = selected === 'emotion';
    const newAnswers = [...answers, userSaidEmotion];
    if (current < items.length - 1) {
      setAnswers(newAnswers);
      setCurrent(current + 1);
      setSelected(null);
    } else {
      setAnswers(newAnswers);
      setShowResult(true);
    }
  };

  const restart = () => {
    setCurrent(0); setAnswers([]); setSelected(null); setShowResult(false);
  };

  const score = answers.filter((a, i) => a === items[i].isEmotion).length;

  if (showResult) {
    const pct = Math.round((score / items.length) * 100);
    return (
      <ScrollView contentContainerStyle={styles.tabBody} showsVerticalScrollIndicator={false}>
        <View style={styles.introCard}>
          <Text style={[styles.introText, { textAlign: 'center', fontSize: 15, fontWeight: '700', color: Colors.white }]}>
            {score} / {items.length}
          </Text>
          <Text style={[styles.introText, { textAlign: 'center', marginTop: 4 }]}>
            {pct >= 80 ? '🎉 Excellente distinction !' : pct >= 60 ? '👍 Bien — encore un peu de pratique' : '💡 À retravailler — la distinction est subtile'}
          </Text>
        </View>

        <View style={[styles.quoteBox, { borderColor: 'rgba(1,219,238,0.3)', backgroundColor: 'rgba(1,219,238,0.06)' }]}>
          <Text style={[styles.quoteText, { color: Colors.turquoise }]}>
            Une émotion = une réaction physique directe.{'\n'}
            Une interprétation = une histoire ou un sens qu'on donne à un événement.
          </Text>
        </View>

        {items.map((it, i) => {
          const correct = answers[i] === it.isEmotion;
          return (
            <View key={i} style={[styles.reviewRow, correct ? styles.reviewOk : styles.reviewKo]}>
              <Text style={styles.reviewIcon}>{correct ? '✓' : '✗'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.reviewText}>« {it.text} »</Text>
                <Text style={[styles.reviewAnswer,
                  { color: it.isEmotion ? Colors.turquoise : Colors.pink }]}>
                  {it.isEmotion ? 'Émotion' : 'Interprétation'}
                </Text>
              </View>
            </View>
          );
        })}

        <TouchableOpacity style={styles.ctaBtn} onPress={restart}>
          <Text style={styles.ctaBtnText}>↺  Rejouer</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  const progress = current / items.length;

  return (
    <ScrollView contentContainerStyle={styles.tabBody} showsVerticalScrollIndicator={false}>

      <View style={styles.introCard}>
        <Text style={styles.introText}>
          Chaque phrase ci-dessous est-elle une{' '}
          <Text style={[styles.introHighlight, { color: Colors.turquoise }]}>émotion</Text>
          {' '}(ressenti direct) ou une{' '}
          <Text style={[styles.introHighlight, { color: Colors.pink }]}>interprétation</Text>
          {' '}(histoire / jugement) ?
        </Text>
      </View>

      {/* Barre de progression */}
      <View style={styles.gameProgressBg}>
        <View style={[styles.gameProgressFill, { width: `${progress * 100}%` }]} />
      </View>
      <Text style={styles.gameCounter}>{current + 1} / {items.length}</Text>

      {/* Phrase */}
      <View style={styles.gameCard}>
        <Text style={styles.gameQuote}>« {item.text} »</Text>
      </View>

      {/* Choix */}
      <View style={styles.gameChoices}>
        <TouchableOpacity
          style={[styles.gameChoiceBtn,
            selected === 'emotion' && { borderColor: Colors.turquoise + '80', backgroundColor: 'rgba(1,219,238,0.12)' }
          ]}
          onPress={() => choose(true)}
          activeOpacity={0.8}
        >
          <Text style={[styles.gameChoiceIcon, selected === 'emotion' && { color: Colors.turquoise }]}>😊</Text>
          <Text style={[styles.gameChoiceLabel, selected === 'emotion' && { color: Colors.turquoise }]}>Émotion</Text>
          <Text style={styles.gameChoiceSub}>Ressenti direct</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.gameChoiceBtn,
            selected === 'interpretation' && { borderColor: Colors.pink + '80', backgroundColor: 'rgba(218,142,69,0.1)' }
          ]}
          onPress={() => choose(false)}
          activeOpacity={0.8}
        >
          <Text style={[styles.gameChoiceIcon, selected === 'interpretation' && { color: Colors.pink }]}>💭</Text>
          <Text style={[styles.gameChoiceLabel, selected === 'interpretation' && { color: Colors.pink }]}>Interprétation</Text>
          <Text style={styles.gameChoiceSub}>Histoire / jugement</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.ctaBtn, !selected && { opacity: 0.35 }]}
        onPress={confirm}
        disabled={!selected}
      >
        <Text style={styles.ctaBtnText}>
          {current < items.length - 1 ? 'Suivant  →' : 'Voir mon score  →'}
        </Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ÉCRAN PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
export default function ComprendreScreen({ navigation }) {
  const [tab, setTab] = useState('methode');

  const handleGoToPractitioners = () => {
    navigation.navigate('Practitioners');
  };

  const TABS = [
    { id: 'methode',      label: 'Méthode' },
    { id: 'applications', label: 'Domaines' },
    { id: 'ie',           label: 'IE' },
    { id: 'exercice',     label: 'Exercice' },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.darkBlue} />

      {/* Topbar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.backText}>‹ Retour</Text>
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Comprendre RESET</Text>
        <View style={{ width: 70 }} />
      </View>

      {/* Onglets */}
      <View style={styles.tabs}>
        {TABS.map(t => (
          <TouchableOpacity
            key={t.id}
            style={[styles.tab, tab === t.id && styles.tabActive]}
            onPress={() => setTab(t.id)}
          >
            <Text style={[styles.tabText, tab === t.id && styles.tabTextActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Contenu */}
      {tab === 'methode'      && <TabMethode      onGoToPractitioners={handleGoToPractitioners} />}
      {tab === 'applications' && <TabApplications onGoToPractitioners={handleGoToPractitioners} />}
      {tab === 'ie'           && <TabIE />}
      {tab === 'exercice'     && <TabExercice />}

    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: Colors.darkBlue },
  topBar:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn:     { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 20, backgroundColor: 'rgba(253,250,244,0.07)', borderWidth: 1, borderColor: 'rgba(253,250,244,0.12)', width: 70 },
  backText:    { color: 'rgba(253,250,244,0.55)', fontSize: 13, fontWeight: '600' },
  screenTitle: { color: Colors.white, fontSize: 15, fontWeight: '700' },

  tabs:          { flexDirection: 'row', marginHorizontal: 16, gap: 6, marginBottom: 4 },
  tab:           { flex: 1, paddingVertical: 9, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(253,250,244,0.08)', alignItems: 'center', backgroundColor: 'rgba(253,250,244,0.03)' },
  tabActive:     { backgroundColor: 'rgba(1,219,238,0.1)', borderColor: Colors.turquoise },
  tabText:       { color: Colors.gray, fontSize: 11, fontWeight: '600' },
  tabTextActive: { color: Colors.turquoise },

  tabBody: { padding: 16, gap: 12, paddingBottom: 48 },

  // ── Intro ──
  introCard:      { backgroundColor: 'rgba(1,219,238,0.07)', borderWidth: 1, borderColor: 'rgba(1,219,238,0.2)', borderRadius: 14, padding: 14 },
  introText:      { color: 'rgba(253,250,244,0.75)', fontSize: 13, lineHeight: 22 },
  introHighlight: { color: Colors.turquoise, fontWeight: '700' },

  // ── Sections ──
  sectionNote:  { color: Colors.gray, fontSize: 12, lineHeight: 19, marginBottom: 4 },

  compareRow:   { flexDirection: 'row', gap: 8 },
  compareCard:  { flex: 1, backgroundColor: 'rgba(253,250,244,0.04)', borderRadius: 10, borderWidth: 1, padding: 12, gap: 6 },
  compareTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  compareText:  { color: Colors.gray, fontSize: 11, lineHeight: 17 },

  quoteBox:     { backgroundColor: 'rgba(253,250,244,0.04)', borderRadius: 10, padding: 12, borderLeftWidth: 2, borderLeftColor: 'rgba(253,250,244,0.2)' },
  quoteText:    { color: 'rgba(253,250,244,0.6)', fontSize: 12, fontStyle: 'italic', lineHeight: 19 },

  emotionRow:   { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingLeft: 10, borderLeftWidth: 2 },
  emotionEmoji: { fontSize: 22, marginTop: 2 },
  emotionName:  { fontSize: 13, fontWeight: '700' },
  emotionDesc:  { color: Colors.gray, fontSize: 11, lineHeight: 17, marginTop: 2 },

  responseCard:   { backgroundColor: 'rgba(253,250,244,0.04)', borderRadius: 12, borderWidth: 1, padding: 14, gap: 8 },
  responseHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  responseEmoji:  { fontSize: 20 },
  responseName:   { fontSize: 14, fontWeight: '700' },
  responseDesc:   { color: Colors.gray, fontSize: 12, lineHeight: 18 },
  signsList:      { gap: 4 },
  signItem:       { flexDirection: 'row', gap: 6 },
  signDot:        { fontSize: 16, lineHeight: 18 },
  signText:       { color: 'rgba(253,250,244,0.55)', fontSize: 11, flex: 1 },

  whyCard:    { backgroundColor: 'rgba(253,250,244,0.03)', borderRadius: 10, padding: 12, gap: 6 },
  whyHeader:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  whyEmoji:   { fontSize: 18 },
  whyTitle:   { color: Colors.white, fontSize: 13, fontWeight: '700' },
  whyText:    { color: Colors.gray, fontSize: 12, lineHeight: 18 },

  stepRow:     { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  stepNum:     { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(1,219,238,0.15)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  stepNumText: { color: Colors.turquoise, fontSize: 11, fontWeight: '700' },
  stepText:    { color: 'rgba(253,250,244,0.75)', fontSize: 13, lineHeight: 20, flex: 1, paddingTop: 4 },

  ctaBtn:     { backgroundColor: Colors.turquoise, padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 4 },
  ctaBtnText: { color: Colors.darkBlue, fontSize: 14, fontWeight: '700' },

  // ── Applications ──
  categoryPicker: { flexDirection: 'row', gap: 8 },
  categoryBtn:    { flex: 1, alignItems: 'center', gap: 4, padding: 10, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(253,250,244,0.08)', backgroundColor: 'rgba(253,250,244,0.03)' },
  categoryEmoji:  { fontSize: 22 },
  categoryLabel:  { color: Colors.gray, fontSize: 11, fontWeight: '600' },

  itemsBlock:    { gap: 6 },
  itemsTitle:    { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  appItem:       { backgroundColor: 'rgba(253,250,244,0.04)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(253,250,244,0.07)', overflow: 'hidden' },
  appItemRow:    { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 13 },
  appItemDot:    { width: 6, height: 6, borderRadius: 3 },
  appItemText:   { flex: 1, color: Colors.white, fontSize: 13 },
  appItemChevron:{ color: 'rgba(253,250,244,0.25)', fontSize: 10 },
  appItemExpanded:  { paddingHorizontal: 13, paddingBottom: 13, gap: 10 },
  appItemExpandedText: { color: Colors.gray, fontSize: 12, lineHeight: 19 },
  appItemBtn:    { padding: 10, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
  appItemBtnText:{ fontSize: 12, fontWeight: '600' },

  appFootnote:     { padding: 12, backgroundColor: 'rgba(253,250,244,0.03)', borderRadius: 12 },
  appFootnoteText: { color: 'rgba(253,250,244,0.3)', fontSize: 11, lineHeight: 18 },

  // ── IE ──
  ieGlobal:        { backgroundColor: 'rgba(253,250,244,0.04)', borderRadius: 16, borderWidth: 1, padding: 16, gap: 10, alignItems: 'center' },
  ieGlobalLabel:   { fontSize: 9, color: Colors.gray, letterSpacing: 2, fontWeight: '700' },
  ieGlobalScore:   { fontSize: 24, fontWeight: '700' },
  ieGlobalBar:     { flexDirection: 'row', width: '100%', height: 6, borderRadius: 3, overflow: 'hidden', gap: 2 },
  ieGlobalSegment: { borderRadius: 3 },
  ieGlobalSub:     { fontSize: 11, color: Colors.gray, textAlign: 'center' },

  ieCard:         { backgroundColor: 'rgba(253,250,244,0.04)', borderRadius: 16, borderWidth: 1, padding: 14, gap: 12 },
  ieCardHeader:   { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  ieCardIcon:     { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  ieCardEmoji:    { fontSize: 20 },
  ieCardName:     { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  ieCardDesc:     { color: Colors.gray, fontSize: 12, lineHeight: 18 },

  ieIndicators:    { gap: 4 },
  ieIndicatorRow:  { flexDirection: 'row', gap: 6 },
  ieIndicatorDot:  { fontSize: 16, lineHeight: 18, fontWeight: '700' },
  ieIndicatorText: { color: 'rgba(253,250,244,0.55)', fontSize: 11, flex: 1 },

  ieScoreBlock:  { gap: 8 },
  ieScoreLabel:  { fontSize: 10, color: Colors.gray, letterSpacing: 1.5, fontWeight: '700' },
  ieScoreRow:    { flexDirection: 'row', gap: 6 },
  ieScoreDot:    { flex: 1, height: 10, borderRadius: 5 },

  ieHelpBtn:      { padding: 10, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(253,250,244,0.08)', alignItems: 'center' },
  ieHelpBtnText:  { color: Colors.gray, fontSize: 12 },
  ieHelpContent:  { padding: 12, borderRadius: 10, borderWidth: 1 },
  ieHelpText:     { color: 'rgba(253,250,244,0.7)', fontSize: 12, lineHeight: 20 },

  ieCitation:       { padding: 14, borderLeftWidth: 2, borderLeftColor: 'rgba(1,219,238,0.3)', gap: 6 },
  ieCitationText:   { color: 'rgba(253,250,244,0.5)', fontSize: 12, fontStyle: 'italic', lineHeight: 20 },
  ieCitationAuthor: { color: 'rgba(253,250,244,0.25)', fontSize: 10 },

  // ── Exercice ──
  gameProgressBg:   { height: 4, backgroundColor: 'rgba(253,250,244,0.08)', borderRadius: 2 },
  gameProgressFill: { height: '100%', backgroundColor: Colors.turquoise, borderRadius: 2 },
  gameCounter:      { color: Colors.gray, fontSize: 11, textAlign: 'right' },
  gameCard:         { backgroundColor: 'rgba(253,250,244,0.06)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(253,250,244,0.12)', padding: 24, alignItems: 'center', minHeight: 100, justifyContent: 'center' },
  gameQuote:        { color: Colors.white, fontSize: 17, fontWeight: '600', textAlign: 'center', lineHeight: 26, fontStyle: 'italic' },
  gameChoices:      { flexDirection: 'row', gap: 10 },
  gameChoiceBtn:    { flex: 1, alignItems: 'center', gap: 6, padding: 16, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(253,250,244,0.1)', backgroundColor: 'rgba(253,250,244,0.04)' },
  gameChoiceIcon:   { fontSize: 28, color: Colors.gray },
  gameChoiceLabel:  { color: Colors.white, fontSize: 13, fontWeight: '700' },
  gameChoiceSub:    { color: Colors.gray, fontSize: 10, textAlign: 'center' },
  reviewRow:        { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 11, borderRadius: 10, borderWidth: 1 },
  reviewOk:         { backgroundColor: 'rgba(1,219,238,0.05)', borderColor: 'rgba(1,219,238,0.2)' },
  reviewKo:         { backgroundColor: 'rgba(218,142,69,0.05)', borderColor: 'rgba(218,142,69,0.2)' },
  reviewIcon:       { fontSize: 16, width: 20 },
  reviewText:       { color: 'rgba(253,250,244,0.8)', fontSize: 12, lineHeight: 18 },
  reviewAnswer:     { fontSize: 11, fontWeight: '700', marginTop: 2 },
});
