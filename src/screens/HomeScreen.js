import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, SafeAreaView, StatusBar, Linking, Image, ScrollView,
  Modal, Platform,
} from 'react-native';
import { Colors } from '../theme/colors';
import { hasGivenConsent, saveConsent } from '../storage/consent';

const FORMATIONS_URL = 'https://formations.atypikali.com/formations/';

// Détecte si on est en mode nuit (23h–6h)
function isNightTime() {
  const h = new Date().getHours();
  return h >= 23 || h < 6;
}

export default function HomeScreen({ navigation }) {
  const pulse     = useRef(new Animated.Value(1)).current;
  const [night, setNight]           = useState(isNightTime());
  const [showConsent, setShowConsent] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);

  // Vérifie le consentement au premier lancement
  useEffect(() => {
    hasGivenConsent().then(given => {
      if (!given) setShowConsent(true);
    });
  }, []);

  const handleAcceptConsent = async () => {
    if (!consentChecked) return;
    await saveConsent();
    setShowConsent(false);
  };

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.06, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,    duration: 1200, useNativeDriver: true }),
      ])
    ).start();
    // Réévalue le mode nuit toutes les minutes
    const t = setInterval(() => setNight(isNightTime()), 60000);
    return () => clearInterval(t);
  }, []);

  const goSOS      = () => navigation.navigate('Briefing', { mode: 'sos' });
  const goNight    = () => navigation.navigate('Briefing', { mode: 'night' });
  const goDiscreet = () => navigation.navigate('Briefing', { mode: 'discreet' });

  return (
    <SafeAreaView style={[styles.safe, night && styles.safeNight]}>
      <StatusBar barStyle="light-content" backgroundColor={night ? '#000010' : Colors.darkBlue} />

      {/* ── Modal de consentement premier lancement ── */}
      <Modal
        visible={showConsent}
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        <View style={styles.overlay}>
          <View style={styles.consentCard}>

            <Text style={styles.consentLogo}>RESET SOS</Text>
            <Text style={styles.consentTitle}>Avant de commencer</Text>

            {/* Avertissement médical */}
            <View style={styles.consentWarning}>
              <Text style={styles.consentWarningText}>
                ⚠️ Cette application n'est pas un dispositif médical et ne remplace
                pas un suivi professionnel.
              </Text>
            </View>

            {/* Urgences */}
            <View style={styles.consentEmergency}>
              <Text style={styles.consentEmergencyTitle}>EN CAS DE CRISE SÉVÈRE</Text>
              <View style={styles.consentEmergencyRow}>
                <TouchableOpacity
                  style={styles.consentEmergencyBtn}
                  onPress={() => Linking.openURL('tel:3114')}
                >
                  <Text style={styles.consentEmergencyNum}>3114</Text>
                  <Text style={styles.consentEmergencyLabel}>Prévention suicide</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.consentEmergencyBtn}
                  onPress={() => Linking.openURL('tel:15')}
                >
                  <Text style={styles.consentEmergencyNum}>15</Text>
                  <Text style={styles.consentEmergencyLabel}>SAMU</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Points clés */}
            <View style={styles.consentPoints}>
              {[
                'Réservé aux personnes majeures (18 ans +)',
                'Données stockées uniquement sur votre appareil',
                'Aucune donnée transmise à des serveurs externes',
              ].map((p, i) => (
                <View key={i} style={styles.consentPointRow}>
                  <Text style={styles.consentPointDot}>✓</Text>
                  <Text style={styles.consentPointText}>{p}</Text>
                </View>
              ))}
            </View>

            {/* Checkbox */}
            <TouchableOpacity
              style={styles.consentCheckRow}
              onPress={() => setConsentChecked(v => !v)}
              activeOpacity={0.75}
            >
              <View style={[styles.consentCheckBox, consentChecked && styles.consentCheckBoxActive]}>
                {consentChecked && <Text style={styles.consentCheckMark}>✓</Text>}
              </View>
              <Text style={styles.consentCheckLabel}>
                J'ai lu et j'accepte les{' '}
                <Text
                  style={styles.consentCheckLink}
                  onPress={() => navigation.navigate('Legal')}
                >
                  CGU et la politique de confidentialité
                </Text>
              </Text>
            </TouchableOpacity>

            {/* Bouton */}
            <TouchableOpacity
              style={[styles.consentBtn, !consentChecked && styles.consentBtnDisabled]}
              onPress={handleAcceptConsent}
              activeOpacity={consentChecked ? 0.85 : 1}
            >
              <Text style={[styles.consentBtnText, !consentChecked && styles.consentBtnTextDisabled]}>
                Accéder à l'application →
              </Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header logo */}
        <View style={styles.header}>
          <Image
            source={require('../../assets/logo_reset.png')}
            style={styles.logoImg}
            resizeMode="contain"
          />
          {night && (
            <View style={styles.nightBadge}>
              <Text style={styles.nightBadgeText}>🌙 MODE NUIT</Text>
            </View>
          )}
        </View>

        {/* Bouton SOS principal */}
        <View style={styles.heroArea}>
          <Animated.View style={{ transform: [{ scale: pulse }] }}>
            <TouchableOpacity
              style={[styles.sosBtn, night && styles.sosBtnNight]}
              onPress={night ? goNight : goSOS}
              activeOpacity={0.85}
            >
              <Text style={styles.sosBtnIcon}>{night ? '🌙' : '⚡'}</Text>
              <Text style={styles.sosBtnLabel}>
                {night ? 'JE N\'ARRIVE\nPAS À DORMIR' : 'JE SUIS\nSUBMERGÉ(E)'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Séparateur */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>autres modes</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Grille des modes */}
        <View style={styles.modeGrid}>
          <TouchableOpacity
            style={[styles.modeCard, { borderColor: 'rgba(128,0,128,0.3)' }]}
            onPress={goDiscreet}
            activeOpacity={0.75}
          >
            <Text style={styles.modeIcon}>🔕</Text>
            <Text style={styles.modeTitle}>Mode discret</Text>
            <Text style={styles.modeSub}>Sans son, en public</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeCard, { borderColor: 'rgba(128,0,128,0.3)' }]}
            onPress={() => navigation.navigate('Companion')}
            activeOpacity={0.75}
          >
            <Text style={styles.modeIcon}>🤝</Text>
            <Text style={styles.modeTitle}>Accompagnateur</Text>
            <Text style={styles.modeSub}>Guider quelqu'un</Text>
          </TouchableOpacity>
        </View>

        {/* Séparateur */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>outils</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Menu liste */}
        <View style={styles.menuList}>
          <TouchableOpacity
            style={styles.menuBtn}
            onPress={() => navigation.navigate('Practitioners')}
            activeOpacity={0.75}
          >
            <View style={[styles.menuIcon, { backgroundColor: 'rgba(14,224,229,0.15)' }]}>
              <Text style={styles.menuIconEmoji}>🎯</Text>
            </View>
            <View style={styles.menuTextBlock}>
              <Text style={styles.menuTitle}>Travailler une émotion</Text>
              <Text style={styles.menuSub}>Praticiens certifiés RESET</Text>
            </View>
            <Text style={styles.menuChevron}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuBtn}
            onPress={() => navigation.navigate('Journal')}
            activeOpacity={0.75}
          >
            <View style={[styles.menuIcon, { backgroundColor: 'rgba(128,0,128,0.2)' }]}>
              <Text style={styles.menuIconEmoji}>📓</Text>
            </View>
            <View style={styles.menuTextBlock}>
              <Text style={styles.menuTitle}>Mon journal</Text>
              <Text style={styles.menuSub}>Séances et perturbations</Text>
            </View>
            <Text style={styles.menuChevron}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuBtn}
            onPress={() => navigation.navigate('PractitionerMode')}
            activeOpacity={0.75}
          >
            <View style={[styles.menuIcon, { backgroundColor: 'rgba(219,0,115,0.15)' }]}>
              <Text style={styles.menuIconEmoji}>📋</Text>
            </View>
            <View style={styles.menuTextBlock}>
              <Text style={styles.menuTitle}>Mode praticien</Text>
              <Text style={styles.menuSub}>Suivi de séances clients</Text>
            </View>
            <Text style={styles.menuChevron}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuBtn}
            onPress={() => navigation.navigate('Comprendre')}
            activeOpacity={0.75}
          >
            <View style={[styles.menuIcon, { backgroundColor: 'rgba(14,224,229,0.1)' }]}>
              <Text style={styles.menuIconEmoji}>📖</Text>
            </View>
            <View style={styles.menuTextBlock}>
              <Text style={styles.menuTitle}>Comprendre RESET</Text>
              <Text style={styles.menuSub}>Méthode · Applications · IE</Text>
            </View>
            <Text style={styles.menuChevron}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuBtn}
            onPress={() => navigation.navigate('BilanEmotionnel')}
            activeOpacity={0.75}
          >
            <View style={[styles.menuIcon, { backgroundColor: 'rgba(128,0,128,0.2)' }]}>
              <Text style={styles.menuIconEmoji}>🗺️</Text>
            </View>
            <View style={styles.menuTextBlock}>
              <Text style={styles.menuTitle}>Bilan émotionnel</Text>
              <Text style={styles.menuSub}>7 domaines de vie · Cartographie</Text>
            </View>
            <Text style={styles.menuChevron}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuBtn}
            onPress={() => navigation.navigate('SurvivalQuiz')}
            activeOpacity={0.75}
          >
            <View style={[styles.menuIcon, { backgroundColor: 'rgba(219,0,115,0.12)' }]}>
              <Text style={styles.menuIconEmoji}>🧬</Text>
            </View>
            <View style={styles.menuTextBlock}>
              <Text style={styles.menuTitle}>Stratégies de survie</Text>
              <Text style={styles.menuSub}>Quiz · Fuite · Figement · Attaque</Text>
            </View>
            <Text style={styles.menuChevron}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Bannière formation */}
        <TouchableOpacity
          style={styles.bottomBanner}
          onPress={() => Linking.openURL(FORMATIONS_URL)}
          activeOpacity={0.75}
        >
          <Text style={styles.bottomBannerText}>
            🎓 <Text style={styles.bottomBannerLink}>Se former à RESET — formations.atypikali.com</Text>
          </Text>
        </TouchableOpacity>

        {/* Footer légal */}
        <View style={styles.legalFooter}>
          <TouchableOpacity onPress={() => navigation.navigate('Legal')}>
            <Text style={styles.legalFooterLink}>Mentions légales · CGU · Confidentialité</Text>
          </TouchableOpacity>
          <Text style={styles.legalFooterSub}>
            Application non médicale — En cas de crise : 3114
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: Colors.darkBlue },
  safeNight:    { backgroundColor: '#000010' },
  scroll:       { padding: 0, paddingBottom: 32 },
  header:       { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  logoImg:      { width: 140, height: 90 },
  nightBadge:   { backgroundColor: 'rgba(0,0,80,0.6)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(100,100,200,0.3)' },
  nightBadgeText:{ color: '#8899FF', fontSize: 9, fontWeight: '700', letterSpacing: 1.5 },
  heroArea:     { alignItems: 'center', paddingVertical: 24 },
  sosBtn:       { width: 180, height: 180, borderRadius: 90, backgroundColor: Colors.pink, alignItems: 'center', justifyContent: 'center' },
  sosBtnNight:  { backgroundColor: '#1a1a5e', borderWidth: 1, borderColor: 'rgba(100,100,200,0.4)' },
  sosBtnIcon:   { fontSize: 28, marginBottom: 4 },
  sosBtnLabel:  { color: Colors.white, fontSize: 14, fontWeight: '700', letterSpacing: 1.5, textAlign: 'center', lineHeight: 21 },
  dividerRow:   { flexDirection: 'row', alignItems: 'center', marginHorizontal: 24, gap: 10, marginBottom: 14 },
  dividerLine:  { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.08)' },
  dividerText:  { fontSize: 10, color: Colors.gray, letterSpacing: 1 },
  modeGrid:     { flexDirection: 'row', gap: 10, paddingHorizontal: 24, marginBottom: 20 },
  modeCard:     { flex: 1, padding: 14, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14, borderWidth: 1, alignItems: 'center', gap: 4 },
  modeIcon:     { fontSize: 24 },
  modeTitle:    { color: Colors.white, fontSize: 12, fontWeight: '700', textAlign: 'center' },
  modeSub:      { color: Colors.gray, fontSize: 10, textAlign: 'center' },
  menuList:     { paddingHorizontal: 24, gap: 8, marginBottom: 20 },
  menuBtn:      { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  menuIcon:     { width: 40, height: 40, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  menuIconEmoji:{ fontSize: 18 },
  menuTextBlock:{ flex: 1 },
  menuTitle:    { color: Colors.white, fontSize: 13, fontWeight: '600' },
  menuSub:      { color: Colors.gray, fontSize: 11, marginTop: 2 },
  menuChevron:  { color: Colors.gray, fontSize: 20 },
  bottomBanner: { marginHorizontal: 24, padding: 12, backgroundColor: 'rgba(14,224,229,0.07)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(14,224,229,0.2)' },
  bottomBannerText:{ fontSize: 11, color: Colors.gray, textAlign: 'center' },
  bottomBannerLink:{ color: Colors.turquoise },

  // ── Footer légal ──
  legalFooter: { marginHorizontal: 24, marginTop: 12, alignItems: 'center', gap: 4 },
  legalFooterLink: { fontSize: 10, color: 'rgba(255,255,255,0.2)', textDecorationLine: 'underline', textAlign: 'center' },
  legalFooterSub: { fontSize: 10, color: 'rgba(255,255,255,0.12)', textAlign: 'center' },

  // ── Modal consentement ──
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  consentCard: {
    width: '100%',
    backgroundColor: '#0a0060',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(14,224,229,0.25)',
    gap: 16,
    maxHeight: '90%',
  },
  consentLogo: {
    color: Colors.turquoise,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 3,
    textAlign: 'center',
  },
  consentTitle: {
    color: Colors.white,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  consentWarning: {
    backgroundColor: 'rgba(224,80,80,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(224,80,80,0.3)',
    borderRadius: 12,
    padding: 12,
  },
  consentWarningText: {
    color: '#FF9999',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  consentEmergency: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  consentEmergencyTitle: {
    color: Colors.gray,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  consentEmergencyRow: {
    flexDirection: 'row',
    gap: 8,
  },
  consentEmergencyBtn: {
    flex: 1,
    backgroundColor: 'rgba(224,80,80,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(224,80,80,0.3)',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    gap: 2,
  },
  consentEmergencyNum: {
    color: '#FF8888',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 1,
  },
  consentEmergencyLabel: {
    color: 'rgba(255,180,180,0.7)',
    fontSize: 10,
  },
  consentPoints: { gap: 8 },
  consentPointRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  consentPointDot: { color: Colors.turquoise, fontSize: 12, fontWeight: '700', marginTop: 1 },
  consentPointText: { flex: 1, color: 'rgba(255,255,255,0.6)', fontSize: 12, lineHeight: 18 },
  consentCheckRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  consentCheckBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  consentCheckBoxActive: {
    backgroundColor: Colors.turquoise,
    borderColor: Colors.turquoise,
  },
  consentCheckMark: { color: Colors.darkBlue, fontSize: 13, fontWeight: '800' },
  consentCheckLabel: { flex: 1, color: 'rgba(255,255,255,0.65)', fontSize: 12, lineHeight: 19 },
  consentCheckLink: { color: Colors.turquoise, textDecorationLine: 'underline' },
  consentBtn: {
    backgroundColor: Colors.turquoise,
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  consentBtnDisabled: {
    backgroundColor: 'rgba(14,224,229,0.2)',
  },
  consentBtnText: {
    color: Colors.darkBlue,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  consentBtnTextDisabled: {
    color: 'rgba(14,224,229,0.4)',
  },
});
