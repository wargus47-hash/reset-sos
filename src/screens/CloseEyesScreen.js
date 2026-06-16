import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, Animated,
} from 'react-native';
import { Colors } from '../theme/colors';

export default function CloseEyesScreen({ navigation }) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1, duration: 800, useNativeDriver: true,
    }).start();
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#001A4D" />

      {/* Barre de progression */}
      <View style={styles.progressBar}>
        <View style={[styles.step, styles.stepDone]} />
        <View style={[styles.step, styles.stepActive]} />
        <View style={styles.step} />
      </View>

      <Animated.View style={[styles.content, { opacity }]}>
        <Text style={styles.eyeIcon}>👁️</Text>

        <Text style={styles.title}>Ferme{'\n'}les yeux</Text>

        <Text style={styles.body}>
          Pose ton téléphone.{'\n\n'}
          <Text style={styles.highlight}>Écoute ce qui se passe dans ton corps.</Text>
          {'\n\n'}
          Tu n'as rien à faire,{'\n'}juste ressentir.
        </Text>

        <TouchableOpacity
          style={styles.btn}
          onPress={() => navigation.navigate('Listen')}
          activeOpacity={0.8}
        >
          <Text style={styles.btnText}>Je ferme les yeux →</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backText}>← Retour</Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#001A4D',
  },
  progressBar: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 8,
    paddingTop: 12,
  },
  step: {
    flex: 1, height: 3, borderRadius: 2,
    backgroundColor: 'rgba(253,250,244,0.1)',
  },
  stepDone:   { backgroundColor: Colors.turquoise },
  stepActive: { backgroundColor: Colors.pink },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 24,
  },
  eyeIcon: {
    fontSize: 52,
  },
  title: {
    fontFamily: 'System',
    fontSize: 36,
    fontWeight: '700',
    color: Colors.white,
    textAlign: 'center',
    lineHeight: 44,
    letterSpacing: 1,
  },
  body: {
    fontSize: 15,
    color: Colors.gray,
    textAlign: 'center',
    lineHeight: 26,
  },
  highlight: {
    color: Colors.turquoise,
    fontStyle: 'normal',
  },
  btn: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderWidth: 1.5,
    borderColor: 'rgba(253,250,244,0.2)',
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
  },
  btnText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 1,
  },
  backBtn: { marginTop: 8 },
  backText: { color: 'rgba(253,250,244,0.25)', fontSize: 13 },
});
