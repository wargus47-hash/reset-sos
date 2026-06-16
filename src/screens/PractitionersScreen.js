import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, ScrollView, Linking,
} from 'react-native';
import { Colors } from '../theme/colors';

const PRACTITIONERS = [
  {
    name:       'Line ALAYRAC-BENAZECH',
    specialty:  'Accompagnement personnel et professionnel',
    phone:      '06 70 75 16 19',
    email:      'line.alayrac@orange.fr',
  },
  {
    name:       'Marion BEGEL RIGAUX',
    specialty:  'Développement personnel et libération émotionnelle',
    phone:      '07 78 42 25 15',
    email:      'mrigaux@hotmail.fr',
  },
  {
    name:       'Cédric BREANT',
    specialty:  'Accompagnement individualisé — changements de vie',
    phone:      '06 80 07 57 68',
    email:      'batced@hotmail.com',
  },
  {
    name:       'Sylvie BARRAU',
    specialty:  'Infirmière et sophrologue — libération émotionnelle',
    phone:      '07 82 44 56 44',
    email:      'allerversoi@gmail.com',
    website:    'allerversoi.wixsite.com',
  },
  {
    name:       'Mélissa LEFAUCHEUX',
    specialty:  'Accompagnement bienveillant — libération émotionnelle',
    phone:      '06 64 55 45 69',
    email:      'melissafontainepro@gmail.com',
    instagram:  '@meli_rose_',
  },
  {
    name:       'Mélanie ASSAILLY',
    specialty:  'Libération émotionnelle et Design Humain',
    phone:      '06 58 62 59 39',
    email:      'melanie.aupetit@serhum.net',
  },
  {
    name:       'Jonathan CASSAGNE',
    specialty:  'Thérapeute, Constellateur et Praticien RESET',
    phone:      '06 43 47 42 47',
    email:      'cassagne.jonathan@orange.fr',
  },
];

export default function PractitionersScreen({ navigation }) {
  const call  = (phone) => Linking.openURL(`tel:${phone.replace(/\s/g, '')}`);
  const mail  = (email) => Linking.openURL(`mailto:${email}`);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.darkBlue} />

      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.backText}>‹ Retour</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Praticiens{'\n'}<Text style={styles.titleAccent}>certifiés RESET</Text></Text>
        <Text style={styles.subtitle}>
          Pour un accompagnement approfondi sur une perturbation récurrente, contacte l'un de ces praticiens certifiés par Atypikali.
        </Text>

        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            💡 Cette application gère l'<Text style={styles.infoHighlight}>urgence émotionnelle</Text>. Pour travailler en profondeur sur une difficulté, un praticien certifié est ton meilleur allié.
          </Text>
        </View>

        {PRACTITIONERS.map((p, i) => (
          <View key={i} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{p.name.charAt(0)}</Text>
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.name}>{p.name}</Text>
                <Text style={styles.specialty}>{p.specialty}</Text>
              </View>
            </View>

            <View style={styles.cardActions}>
              <TouchableOpacity
                style={[styles.actionBtn, { borderColor: Colors.turquoise }]}
                onPress={() => call(p.phone)}
              >
                <Text style={styles.actionIcon}>📞</Text>
                <Text style={[styles.actionText, { color: Colors.turquoise }]}>{p.phone}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, { borderColor: Colors.purple }]}
                onPress={() => mail(p.email)}
              >
                <Text style={styles.actionIcon}>✉️</Text>
                <Text style={[styles.actionText, { color: Colors.purple }]} numberOfLines={1}>{p.email}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <TouchableOpacity
          style={styles.trainBtn}
          onPress={() => Linking.openURL('https://formations.atypikali.com/formations/')}
        >
          <Text style={styles.trainBtnText}>Devenir praticien certifié →</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: Colors.darkBlue },
  topBar:     { padding: 16, paddingBottom: 0 },
  backBtn:    { alignSelf: 'flex-start', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 20, backgroundColor: 'rgba(253,250,244,0.07)', borderWidth: 1, borderColor: 'rgba(253,250,244,0.12)' },
  backText:   { color: 'rgba(253,250,244,0.55)', fontSize: 13, fontWeight: '600' },
  body:       { padding: 24, gap: 14, paddingBottom: 40 },
  title:      { fontSize: 26, fontWeight: '700', color: Colors.white, lineHeight: 34 },
  titleAccent:{ color: Colors.turquoise },
  subtitle:   { fontSize: 13, color: Colors.gray, lineHeight: 20 },
  infoCard:   {
    backgroundColor: 'rgba(1,219,238,0.07)',
    borderWidth: 1, borderColor: 'rgba(1,219,238,0.2)',
    borderRadius: 14, padding: 14,
  },
  infoText:   { fontSize: 13, color: Colors.gray, lineHeight: 20 },
  infoHighlight: { color: Colors.turquoise, fontWeight: '600' },
  card:       {
    backgroundColor: 'rgba(253,250,244,0.04)',
    borderWidth: 1, borderColor: 'rgba(253,250,244,0.08)',
    borderRadius: 16, padding: 16, gap: 14,
  },
  cardHeader: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  avatar:     {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(1,219,238,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: Colors.turquoise, fontSize: 18, fontWeight: '700' },
  cardInfo:   { flex: 1 },
  name:       { color: Colors.white, fontSize: 14, fontWeight: '700' },
  specialty:  { color: Colors.gray, fontSize: 11, marginTop: 2, lineHeight: 16 },
  cardActions:{ gap: 8 },
  actionBtn:  {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 10, borderRadius: 10, borderWidth: 1,
    backgroundColor: 'rgba(253,250,244,0.03)',
  },
  actionIcon: { fontSize: 14 },
  actionText: { fontSize: 12, fontWeight: '600', flex: 1 },
  trainBtn:   {
    padding: 16, backgroundColor: 'rgba(218,142,69,0.1)',
    borderWidth: 1, borderColor: 'rgba(218,142,69,0.3)',
    borderRadius: 14, alignItems: 'center',
  },
  trainBtnText: { color: Colors.pink, fontSize: 14, fontWeight: '700' },
});
