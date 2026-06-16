import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, ScrollView, Linking,
} from 'react-native';
import { Colors } from '../theme/colors';

// ─── Numéros d'urgence ─────────────────────────────────────────────────────
const EMERGENCY = [
  { label: 'Prévention suicide',    number: '3114',  color: '#E05050' },
  { label: 'SAMU',                  number: '15',    color: '#E08020' },
  { label: 'Urgences',              number: '15',    color: '#E08020' },
  { label: 'Écoute psy (gratuit)',  number: '0800 235 236', color: Colors.turquoise },
];

// ─── Onglets ───────────────────────────────────────────────────────────────
const TABS = ['Avertissement', 'CGU', 'Confidentialité', 'Mentions légales'];

// ─── Bloc de texte légal ────────────────────────────────────────────────────
function Section({ title, children }) {
  return (
    <View style={s.section}>
      {title && <Text style={s.sectionTitle}>{title}</Text>}
      {children}
    </View>
  );
}

function Para({ children }) {
  return <Text style={s.para}>{children}</Text>;
}

function BulletList({ items }) {
  return (
    <View style={s.bulletList}>
      {items.map((item, i) => (
        <View key={i} style={s.bulletRow}>
          <Text style={s.bullet}>•</Text>
          <Text style={s.bulletText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

// ─── Onglet 1 : Avertissement médical ──────────────────────────────────────
function TabAvertissement() {
  return (
    <ScrollView contentContainerStyle={s.tabContent} showsVerticalScrollIndicator={false}>

      <View style={s.warningCard}>
        <Text style={s.warningIcon}>⚠️</Text>
        <Text style={s.warningTitle}>Cette application n'est pas un dispositif médical</Text>
        <Text style={s.warningBody}>
          RESET SOS est un outil d'aide à l'auto-régulation émotionnelle. Elle ne remplace
          en aucun cas une consultation médicale, psychologique ou psychiatrique.
        </Text>
      </View>

      <Section title="En cas de détresse sévère">
        <Para>
          Si vous traversez une crise grave, des pensées suicidaires, ou si vous êtes en
          danger, contactez immédiatement un service d'urgence.
        </Para>
        {EMERGENCY.map((e, i) => (
          <TouchableOpacity
            key={i}
            style={[s.emergencyBtn, { borderColor: e.color + '55', backgroundColor: e.color + '18' }]}
            onPress={() => Linking.openURL(`tel:${e.number.replace(/\s/g, '')}`)}
            activeOpacity={0.75}
          >
            <Text style={[s.emergencyLabel, { color: e.color }]}>{e.label}</Text>
            <Text style={[s.emergencyNumber, { color: e.color }]}>{e.number}</Text>
          </TouchableOpacity>
        ))}
      </Section>

      <Section title="Limites de l'application">
        <BulletList items={[
          'RESET SOS n\'établit aucun diagnostic médical ou psychologique.',
          'Les exercices proposés ne constituent pas un traitement thérapeutique.',
          'L\'application ne convient pas aux personnes souffrant de troubles psychiatriques sévères non stabilisés, sans accompagnement professionnel.',
          'En cas de doute sur votre état de santé mentale, consultez un professionnel de santé.',
          'L\'application est destinée aux personnes majeures (18 ans et plus).',
        ]} />
      </Section>

      <Section title="À propos de la méthode RESET">
        <Para>
          La méthode RESET est une approche de régulation émotionnelle développée par
          Maryse Ménec (Atypikali). Elle repose sur des mécanismes neuro-physiologiques
          validés mais ne constitue pas un acte médical.{'\n\n'}
          Pour un accompagnement approfondi, nous vous recommandons de consulter un
          praticien certifié RESET ou un professionnel de santé mentale.
        </Para>
      </Section>

    </ScrollView>
  );
}

// ─── Onglet 2 : CGU ────────────────────────────────────────────────────────
function TabCGU() {
  return (
    <ScrollView contentContainerStyle={s.tabContent} showsVerticalScrollIndicator={false}>

      <Para>Dernière mise à jour : mai 2025</Para>

      <Section title="1. Objet">
        <Para>
          Les présentes Conditions Générales d'Utilisation (CGU) régissent l'accès et
          l'utilisation de l'application mobile RESET SOS, outil d'aide à l'auto-régulation
          émotionnelle basé sur la méthode RESET de Maryse Ménec (Atypikali).
        </Para>
      </Section>

      <Section title="2. Acceptation des conditions">
        <Para>
          L'utilisation de l'application implique l'acceptation pleine et entière des
          présentes CGU. Si vous n'acceptez pas ces conditions, vous ne devez pas utiliser
          l'application.
        </Para>
      </Section>

      <Section title="3. Public concerné">
        <Para>L'application est destinée exclusivement aux personnes majeures (18 ans et plus).</Para>
        <Para>
          Elle n'est pas adaptée comme seul recours pour les personnes souffrant de :
        </Para>
        <BulletList items={[
          'Troubles psychiatriques sévères non stabilisés',
          'Épisodes dissociatifs fréquents',
          'Idéations suicidaires actives',
          'État de stress post-traumatique (ESPT) sans suivi professionnel',
        ]} />
      </Section>

      <Section title="4. Usage de l'application">
        <Para>RESET SOS est fournie à titre personnel et non commercial. Vous vous engagez à :</Para>
        <BulletList items={[
          'Utiliser l\'application uniquement à des fins d\'auto-régulation émotionnelle personnelle.',
          'Ne pas reproduire, distribuer ou exploiter commercialement le contenu de l\'application.',
          'Ne pas tenter de contourner ou d\'altérer les mesures de protection mises en place.',
          'Signaler tout dysfonctionnement à l\'éditeur.',
        ]} />
      </Section>

      <Section title="5. Propriété intellectuelle">
        <Para>
          La méthode RESET est la propriété intellectuelle de Maryse Ménec / Atypikali.
          L'ensemble du contenu de l'application (textes, sons, design, code) est protégé
          par le droit d'auteur. Toute reproduction sans autorisation écrite est interdite.
        </Para>
      </Section>

      <Section title="6. Limitation de responsabilité">
        <Para>
          L'éditeur s'efforce de maintenir l'application fonctionnelle mais ne peut garantir
          une disponibilité ininterrompue. L'éditeur décline toute responsabilité en cas de :
        </Para>
        <BulletList items={[
          'Utilisation inappropriée de l\'application',
          'Dommages directs ou indirects résultant de l\'usage de l\'app',
          'Perte de données liée à un dysfonctionnement technique',
          'Décision prise sur la base des fonctionnalités de l\'application',
        ]} />
        <Para>
          L'application ne saurait en aucun cas engager la responsabilité de son éditeur
          pour des conséquences médicales ou psychologiques.
        </Para>
      </Section>

      <Section title="7. Disponibilité et modifications">
        <Para>
          L'éditeur se réserve le droit de modifier, suspendre ou interrompre l'application
          à tout moment, ainsi que de mettre à jour les présentes CGU. Les utilisateurs seront
          informés des modifications significatives lors de la mise à jour de l'application.
        </Para>
      </Section>

      <Section title="8. Droit applicable">
        <Para>
          Les présentes CGU sont soumises au droit français. Tout litige sera soumis à la
          compétence exclusive des tribunaux français.
        </Para>
      </Section>

    </ScrollView>
  );
}

// ─── Onglet 3 : Politique de confidentialité ───────────────────────────────
function TabConfidentialite() {
  return (
    <ScrollView contentContainerStyle={s.tabContent} showsVerticalScrollIndicator={false}>

      <Para>Dernière mise à jour : mai 2025 — Conformité RGPD</Para>

      <View style={s.infoCard}>
        <Text style={s.infoCardText}>
          🔒 Vos données ne quittent jamais votre appareil. Aucune donnée n'est transmise
          à des serveurs externes.
        </Text>
      </View>

      <Section title="1. Responsable du traitement">
        <Para>
          Maryse Ménec — Atypikali (Entreprise Individuelle){'\n'}
          16 route du moulin, 29550 Plonevez-Porzay{'\n'}
          SIRET : 805 111 523 000 33{'\n'}
          Contact : maryse.menec@atypikali.com{'\n'}
          Site web : atypikali.com
        </Para>
      </Section>

      <Section title="2. Données collectées et traitées">
        <Para>
          RESET SOS ne collecte et ne transmet aucune donnée personnelle vers des
          serveurs externes. Toutes les données sont stockées localement sur votre
          appareil via AsyncStorage (stockage chiffré du système).
        </Para>
        <Para>Les données stockées localement sont :</Para>
        <BulletList items={[
          'Journal de séances : date, mode, durée, scores avant/après, notes libres',
          'Bibliothèque de perturbations : étiquettes textuelles saisies par l\'utilisateur',
          'Mode praticien : informations clients (nom, téléphone, email, notes), historique de séances',
          'Préférences d\'application : consentement CGU',
          'Notifications locales planifiées (rappels J+10) — traitées par iOS/Android, jamais envoyées à un serveur',
        ]} />
      </Section>

      <Section title="3. Finalité des traitements">
        <BulletList items={[
          'Journal personnel : suivi de votre progression émotionnelle',
          'Mode praticien : gestion de votre activité professionnelle RESET',
          'Notifications : rappels de suivi client programmés en local',
          'Consentement : preuve d\'acceptation des CGU (obligatoire légalement)',
        ]} />
      </Section>

      <Section title="4. Durée de conservation">
        <Para>
          Les données sont conservées sur votre appareil tant que l'application est
          installée. Elles sont supprimées automatiquement lors de la désinstallation
          de l'application.
        </Para>
      </Section>

      <Section title="5. Vos droits (RGPD)">
        <Para>
          Conformément au Règlement Général sur la Protection des Données (RGPD —
          Règlement UE 2016/679), vous disposez des droits suivants :
        </Para>
        <BulletList items={[
          'Droit d\'accès : vos données sont consultables directement dans l\'application (Journal, Mode Praticien)',
          'Droit de rectification : modifiez vos données directement dans l\'app',
          'Droit à l\'effacement : supprimez vos données depuis l\'app ou en désinstallant l\'application',
          'Droit à la portabilité : non applicable (données non transmises)',
          'Droit d\'opposition : non applicable (aucun traitement commercial)',
        ]} />
        <Para>
          Pour exercer vos droits ou pour toute question relative à vos données :
          maryse.menec@atypikali.com
        </Para>
      </Section>

      <Section title="6. Sécurité des données">
        <Para>
          Les données sont stockées via le mécanisme AsyncStorage du système d'exploitation,
          soumis au chiffrement natif de l'appareil (si activé). Nous vous recommandons
          d'activer le code PIN ou la protection biométrique de votre appareil, notamment
          si vous utilisez le Mode Praticien contenant des données clients.
        </Para>
      </Section>

      <Section title="7. Données des clients (Mode Praticien)">
        <Para>
          Si vous utilisez le Mode Praticien, vous êtes responsable en tant que
          praticien des données personnelles de vos clients (RGPD, Art. 4). Ces données
          (nom, téléphone, email, notes de séance) sont stockées localement sur votre
          appareil professionnel. Vous vous engagez à :
        </Para>
        <BulletList items={[
          'Informer vos clients du traitement de leurs données',
          'Obtenir leur consentement explicite',
          'Sécuriser votre appareil (code PIN, biométrie)',
          'Supprimer les données à leur demande',
        ]} />
      </Section>

      <Section title="8. Cookies et traceurs">
        <Para>
          L'application n'utilise aucun cookie, traceur, outil d'analyse (analytics),
          SDK publicitaire ou outil de tracking tiers.
        </Para>
      </Section>

      <Section title="9. Contact et réclamations">
        <Para>
          Pour toute question : contact@atypikali.com{'\n\n'}
          Vous pouvez également introduire une réclamation auprès de la CNIL :{'\n'}
          www.cnil.fr — 3 Place de Fontenoy, 75007 Paris
        </Para>
      </Section>

    </ScrollView>
  );
}

// ─── Onglet 4 : Mentions légales ───────────────────────────────────────────
function TabMentions() {
  return (
    <ScrollView contentContainerStyle={s.tabContent} showsVerticalScrollIndicator={false}>

      <Section title="Éditeur de l'application">
        <Para>
          Raison sociale : Atypikali{'\n'}
          Nom commercial de Maryse Ménec — Entreprise Individuelle (EI){'\n'}
          Siège social : 16 route du moulin, 29550 Plonevez-Porzay{'\n'}
          SIRET : 805 111 523 000 33{'\n'}
          Téléphone : +33 6 40 60 64 72{'\n'}
          Directeur de la publication : Mme Maryse Ménec{'\n'}
          Contact : contact@atypikali.com{'\n'}
          Site web : atypikali.com
        </Para>
      </Section>

      <Section title="Hébergement des données utilisateurs">
        <Para>
          Les données utilisateurs sont exclusivement stockées en local sur l'appareil
          de l'utilisateur. L'application ne dispose d'aucun serveur de stockage de
          données personnelles.{'\n\n'}
          Hébergeur du site web formations.atypikali.com :{'\n'}
          Hostinger — 61 Lordou Vironos Street, 6023 Larnaca, Chypre{'\n\n'}
          Distribution de l'application :{'\n'}
          • Apple App Store — Apple Inc., One Apple Park Way, Cupertino, CA 95014, USA{'\n'}
          • Google Play Store — Google LLC, 1600 Amphitheatre Pkwy, Mountain View, CA 94043, USA
        </Para>
      </Section>

      <Section title="Propriété intellectuelle">
        <Para>
          La méthode RESET et l'ensemble des contenus pédagogiques sont la propriété
          exclusive de Maryse Ménec / Atypikali. Toute reproduction, représentation,
          modification, publication ou adaptation de tout ou partie de ces éléments,
          quel que soit le moyen ou le procédé utilisé, est interdite sauf autorisation
          écrite préalable de l'éditeur.
        </Para>
      </Section>

      <Section title="Crédits">
        <Para>
          Développement : Jonathan Cassagne{'\n'}
          Voix : générées avec ElevenLabs (elevenlabs.io){'\n'}
          Icônes : React Native / Emoji natifs du système
        </Para>
      </Section>

      <Section title="Droit applicable">
        <Para>
          Le présent document est soumis au droit français. En cas de litige, et à
          défaut de résolution amiable, les tribunaux français seront seuls compétents.
        </Para>
      </Section>

      <TouchableOpacity
        style={s.linkBtn}
        onPress={() => Linking.openURL('https://formations.atypikali.com/')}
        activeOpacity={0.75}
      >
        <Text style={s.linkBtnText}>formations.atypikali.com →</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

// ─── Écran principal ────────────────────────────────────────────────────────
export default function LegalScreen({ navigation }) {
  const [tab, setTab] = useState(0);

  const TabContent = [TabAvertissement, TabCGU, TabConfidentialite, TabMentions][tab];

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.darkBlue} />

      {/* Top bar */}
      <View style={s.topBar}>
        <TouchableOpacity
          style={s.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={s.backText}>‹ Retour</Text>
        </TouchableOpacity>
        <Text style={s.screenTitle}>Informations légales</Text>
      </View>

      {/* Onglets */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.tabBar}
      >
        {TABS.map((t, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => setTab(i)}
            style={[s.tabBtn, tab === i && s.tabBtnActive]}
          >
            <Text style={[s.tabLabel, tab === i && s.tabLabelActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Contenu */}
      <TabContent />

    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.darkBlue },

  // Top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
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
  screenTitle: { color: Colors.white, fontSize: 15, fontWeight: '700' },

  // Tab bar
  tabBar: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
    flexDirection: 'row',
  },
  tabBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: 'rgba(253,250,244,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(253,250,244,0.08)',
  },
  tabBtnActive: {
    backgroundColor: 'rgba(1,219,238,0.15)',
    borderColor: Colors.turquoise + '55',
  },
  tabLabel: { color: Colors.gray, fontSize: 12, fontWeight: '600' },
  tabLabelActive: { color: Colors.turquoise },

  // Content
  tabContent: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40, gap: 20 },

  // Section
  section: { gap: 10 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: 0.3,
    marginBottom: 2,
  },

  // Paragraphe
  para: {
    fontSize: 12,
    color: 'rgba(253,250,244,0.65)',
    lineHeight: 20,
  },

  // Bullet list
  bulletList: { gap: 6 },
  bulletRow: { flexDirection: 'row', gap: 8 },
  bullet: { color: Colors.turquoise, fontSize: 12, lineHeight: 20 },
  bulletText: { flex: 1, fontSize: 12, color: 'rgba(253,250,244,0.65)', lineHeight: 20 },

  // Warning card
  warningCard: {
    backgroundColor: 'rgba(224,80,80,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(224,80,80,0.3)',
    borderRadius: 16,
    padding: 18,
    gap: 8,
    alignItems: 'center',
  },
  warningIcon: { fontSize: 28 },
  warningTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FF8888',
    textAlign: 'center',
    lineHeight: 22,
  },
  warningBody: {
    fontSize: 12,
    color: 'rgba(255,200,200,0.8)',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Emergency buttons
  emergencyBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  emergencyLabel: { fontSize: 13, fontWeight: '600' },
  emergencyNumber: { fontSize: 16, fontWeight: '800', letterSpacing: 1 },

  // Info card
  infoCard: {
    backgroundColor: 'rgba(1,219,238,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(1,219,238,0.25)',
    borderRadius: 12,
    padding: 14,
  },
  infoCardText: { fontSize: 12, color: Colors.turquoise, lineHeight: 20 },

  // Link button
  linkBtn: {
    padding: 14,
    backgroundColor: 'rgba(1,219,238,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(1,219,238,0.25)',
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  linkBtnText: { color: Colors.turquoise, fontSize: 13, fontWeight: '600' },
});
