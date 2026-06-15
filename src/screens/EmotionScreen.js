import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, ScrollView, TextInput,
} from 'react-native';
import { Colors } from '../theme/colors';

const EMOTIONS = [
  { emoji: '😨', label: 'Une peur',        sub: 'Anxiété, appréhension, phobie' },
  { emoji: '😤', label: 'De la colère',    sub: 'Frustration, agacement, rage' },
  { emoji: '😢', label: 'De la tristesse', sub: 'Peine, mélancolie, chagrin' },
  { emoji: '🤢', label: 'Du dégoût',       sub: 'Répulsion, malaise, rejet' },
];

export default function EmotionScreen({ navigation }) {
  const [selected, setSelected] = useState(null);
  const [freeText, setFreeText] = useState('');

  const canContinue = selected !== null || freeText.trim().length > 0;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.darkBlue} />

      {/* Barre de progression */}
      <View style={styles.progressBar}>
        <View style={[styles.step, styles.stepActive]} />
        <View style={styles.step} />
        <View style={styles.step} />
      </View>

      {/* Retour */}
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>← Retour</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>
          Qu'est-ce qui te{'\n'}
          <Text style={styles.titleAccent}>perturbe</Text> ?
        </Text>
        <Text style={styles.subtitle}>Nomme ce qui déclenche cette réaction en toi</Text>

        <View style={styles.choices}>
          {EMOTIONS.map((e, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.card, selected === i && styles.cardSelected]}
              onPress={() => setSelected(i)}
              activeOpacity={0.75}
            >
              <Text style={styles.cardEmoji}>{e.emoji}</Text>
              <View>
                <Text style={styles.cardLabel}>{e.label}</Text>
                <Text style={styles.cardSub}>{e.sub}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput
          style={styles.textInput}
          placeholder="Ou décris la situation en quelques mots…"
          placeholderTextColor="rgba(170,170,204,0.5)"
          value={freeText}
          onChangeText={setFreeText}
          multiline
          numberOfLines={2}
        />

        <TouchableOpacity
          style={[styles.primaryBtn, !canContinue && styles.primaryBtnDisabled]}
          onPress={() => canContinue && navigation.navigate('Briefing')}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryBtnText}>COMMENCER LE PROTOCOLE →</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.darkBlue },
  progressBar: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 8,
    paddingTop: 12,
  },
  step: {
    flex: 1, height: 3, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  stepActive: { backgroundColor: Colors.pink },
  backBtn: { padding: 16, paddingBottom: 0 },
  backText: { color: Colors.gray, fontSize: 13 },
  body: {
    padding: 24,
    gap: 14,
    paddingBottom: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.white,
    lineHeight: 34,
    letterSpacing: 0.5,
  },
  titleAccent: { color: Colors.turquoise },
  subtitle: { fontSize: 12, color: Colors.gray, lineHeight: 18, marginTop: -6 },
  choices: { gap: 10 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  cardSelected: {
    borderColor: Colors.turquoise,
    backgroundColor: 'rgba(14,224,229,0.08)',
  },
  cardEmoji: { fontSize: 22 },
  cardLabel: { color: Colors.white, fontSize: 14, fontWeight: '600' },
  cardSub: { color: Colors.gray, fontSize: 10.5, marginTop: 2 },
  textInput: {
    padding: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    color: Colors.white,
    fontSize: 13,
    fontFamily: 'System',
  },
  primaryBtn: {
    padding: 16,
    backgroundColor: Colors.turquoise,
    borderRadius: 14,
    alignItems: 'center',
  },
  primaryBtnDisabled: { opacity: 0.35 },
  primaryBtnText: {
    color: Colors.darkBlue,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
