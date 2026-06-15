import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, StatusBar, SafeAreaView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '../theme/colors';

// Les 4 cartes d'information — courtes, rassurantes
const CARDS = [
  {
    icon:  '🎧',
    title: 'Une voix, de temps en temps',
    body:  'Elle te rappellera juste d\'écouter. Tu n\'as pas à répondre.',
  },
  {
    icon:  '📳',
    title: 'Une légère vibration, parfois',
    body:  'C\'est l\'app qui te dit : je suis là. Continue simplement.',
  },
  {
    icon:  '✋',
    title: 'Un bouton, quand tu es prêt(e)',
    body:  'Il apparaîtra sans bruit. Prends tout le temps qu\'il te faut.',
  },
  {
    icon:  '👁',
    title: 'Garde les yeux fermés jusqu\'au bout',
    body:  'Ne les rouvre que lorsque tu sens que la perturbation s\'est apaisée. C\'est ton corps qui décide, pas toi.',
    highlight: true,
  },
];

// Délai entre l'apparition de chaque carte (ms)
const CARD_DELAY = 2200;

export default function BriefingScreen({ navigation, route }) {
  const [visibleCards, setVisibleCards] = useState(0);
  const [showCta, setShowCta]           = useState(false);
  const [launching, setLaunching]       = useState(false);

  // Opacités individuelles pour chaque carte
  const cardOpacities = useRef(CARDS.map(() => new Animated.Value(0))).current;
  const cardTranslates = useRef(CARDS.map(() => new Animated.Value(12))).current;

  // Opacités globales pour le fondu final
  const bgOpacity    = useRef(new Animated.Value(1)).current;
  const ctaOpacity   = useRef(new Animated.Value(0)).current;
  const missionOpacity = useRef(new Animated.Value(0)).current;

  // Révèle les cartes une par une
  useEffect(() => {
    CARDS.forEach((_, i) => {
      setTimeout(() => {
        // Vibration douce à chaque nouvelle carte
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        Animated.parallel([
          Animated.timing(cardOpacities[i],  { toValue: 1, duration: 500, useNativeDriver: true }),
          Animated.timing(cardTranslates[i], { toValue: 0, duration: 500, useNativeDriver: true }),
        ]).start();

        setVisibleCards(i + 1);

        // Après la dernière carte : affiche le message mission + CTA
        if (i === CARDS.length - 1) {
          setTimeout(() => {
            Animated.timing(missionOpacity, {
              toValue: 1, duration: 600, useNativeDriver: true,
            }).start();
            setTimeout(() => {
              Animated.timing(ctaOpacity, {
                toValue: 1, duration: 500, useNativeDriver: true,
              }).start(() => setShowCta(true));
            }, 500);
          }, 800);
        }
      }, 800 + i * CARD_DELAY);
    });
  }, []);

  // Appui sur "Je ferme les yeux" :
  // 1. Vibration de confirmation
  // 2. Fondu vers le noir
  // 3. Navigation vers la session d'écoute
  const handleStart = () => {
    if (!showCta || launching) return;
    setLaunching(true);

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const mode     = route?.params?.mode     || 'sos';
    const preLabel = route?.params?.preLabel || null;
    Animated.timing(bgOpacity, {
      toValue: 0, duration: 1200, useNativeDriver: true,
    }).start(() => {
      navigation.replace('Listen', { mode, preLabel });
    });
  };

  return (
    <Animated.View style={[styles.root, { opacity: bgOpacity }]}>
      <StatusBar barStyle="light-content" backgroundColor="#010030" />
      <SafeAreaView style={styles.safe}>

        {/* Barre de navigation + progression */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.backText}>‹ Retour</Text>
          </TouchableOpacity>
          <View style={styles.progressBar}>
            <View style={[styles.step, styles.stepDone]} />
            <View style={[styles.step, styles.stepActive]} />
            <View style={styles.step} />
          </View>
        </View>

        <View style={styles.content}>

          {/* En-tête */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Avant de commencer</Text>
            <Text style={styles.headerSub}>
              Voici ce qui va se passer une fois les yeux fermés.
            </Text>
          </View>

          {/* Cartes — apparaissent une par une */}
          <View style={styles.cards}>
            {CARDS.map((card, i) => (
              <Animated.View
                key={i}
                style={[
                  styles.card,
                  card.highlight && styles.cardHighlight,
                  {
                    opacity:   cardOpacities[i],
                    transform: [{ translateY: cardTranslates[i] }],
                  },
                ]}
              >
                <View style={[styles.cardIcon, card.highlight && styles.cardIconHighlight]}>
                  <Text style={styles.cardIconText}>{card.icon}</Text>
                </View>
                <View style={styles.cardText}>
                  <Text style={[styles.cardTitle, card.highlight && styles.cardTitleHighlight]}>
                    {card.title}
                  </Text>
                  <Text style={styles.cardBody}>{card.body}</Text>
                </View>
              </Animated.View>
            ))}
          </View>

          {/* Message mission */}
          <Animated.Text style={[styles.mission, { opacity: missionOpacity }]}>
            Ta seule mission :{' '}
            <Text style={styles.missionHighlight}>
              garder les yeux fermés et écouter ce qui se passe dans ton corps.
            </Text>
          </Animated.Text>

          <View style={styles.spacer} />

          {/* CTA — apparaît en dernier */}
          <Animated.View style={{ opacity: ctaOpacity, width: '100%' }}>
            <TouchableOpacity
              style={[styles.ctaBtn, launching && styles.ctaBtnLaunching]}
              onPress={handleStart}
              activeOpacity={0.85}
            >
              <Text style={styles.ctaBtnText}>
                {launching ? 'Ferme les yeux…' : 'Je ferme les yeux →'}
              </Text>
            </TouchableOpacity>
          </Animated.View>

        </View>
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#010030',
  },
  safe: {
    flex: 1,
  },
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
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  backText: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 13,
    fontWeight: '600',
  },
  progressBar: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  step: {
    flex: 1, height: 3, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  stepDone:   { backgroundColor: Colors.turquoise },
  stepActive: { backgroundColor: Colors.pink },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 16,
    gap: 20,
  },
  header: {
    gap: 6,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: 0.3,
  },
  headerSub: {
    fontSize: 13,
    color: Colors.gray,
    lineHeight: 20,
  },
  cards: {
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 16,
  },
  cardHighlight: {
    backgroundColor: 'rgba(14,224,229,0.07)',
    borderColor: 'rgba(14,224,229,0.3)',
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(14,224,229,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardIconHighlight: {
    backgroundColor: 'rgba(14,224,229,0.2)',
  },
  cardIconText: {
    fontSize: 20,
  },
  cardText: {
    flex: 1,
    gap: 3,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: 0.2,
  },
  cardTitleHighlight: {
    color: Colors.turquoise,
  },
  cardBody: {
    fontSize: 12,
    color: Colors.gray,
    lineHeight: 18,
  },
  mission: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  missionHighlight: {
    color: Colors.turquoise,
    fontWeight: '600',
  },
  spacer: { flex: 1 },
  ctaBtn: {
    backgroundColor: Colors.turquoise,
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  ctaBtnLaunching: {
    backgroundColor: 'rgba(14,224,229,0.3)',
  },
  ctaBtnText: {
    color: Colors.darkBlue,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
