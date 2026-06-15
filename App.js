import React, { useEffect } from 'react';
import { Platform, LogBox } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import HomeScreen              from './src/screens/HomeScreen';
import BriefingScreen          from './src/screens/BriefingScreen';
import ListenScreen            from './src/screens/ListenScreen';
import ResultScreen            from './src/screens/ResultScreen';
import PractitionersScreen     from './src/screens/PractitionersScreen';
import JournalScreen           from './src/screens/JournalScreen';
import CompanionScreen         from './src/screens/CompanionScreen';
import PractitionerModeScreen  from './src/screens/PractitionerModeScreen';
import ComprendreScreen        from './src/screens/ComprendreScreen';
import LegalScreen             from './src/screens/LegalScreen';
import SessionTimerScreen      from './src/screens/SessionTimerScreen';
import InvestigationScreen     from './src/screens/InvestigationScreen';
import PrepRDVScreen           from './src/screens/PrepRDVScreen';
import BilanEmotionnelScreen   from './src/screens/BilanEmotionnelScreen';
import SurvivalQuizScreen      from './src/screens/SurvivalQuizScreen';
import CertificationScreen     from './src/screens/CertificationScreen';

// Notifications uniquement sur mobile
let Notifications = null;
if (Platform.OS !== 'web') {
  Notifications = require('expo-notifications');
  LogBox.ignoreLogs([
    'expo-notifications: Android Push',
    'expo-notifications: Error encountered',
  ]);
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge:  false,
    }),
  });
}

const Stack = createStackNavigator();

export default function App() {

  useEffect(() => {
    if (Platform.OS === 'android' && Notifications) {
      Notifications.setNotificationChannelAsync('reset-followup', {
        name:             'Suivi clients RESET',
        importance:       Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 250, 250],
        sound:            true,
      });
    }
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerShown:      false,
          cardStyle:        { backgroundColor: '#060084' },
          animationEnabled: true,
        }}
      >
        <Stack.Screen name="Home"              component={HomeScreen} />
        <Stack.Screen name="Briefing"          component={BriefingScreen} />
        <Stack.Screen name="Listen"            component={ListenScreen} />
        <Stack.Screen name="Result"            component={ResultScreen} />
        <Stack.Screen name="Practitioners"     component={PractitionersScreen} />
        <Stack.Screen name="Journal"           component={JournalScreen} />
        <Stack.Screen name="Companion"         component={CompanionScreen} />
        <Stack.Screen name="PractitionerMode"  component={PractitionerModeScreen} />
        <Stack.Screen name="Comprendre"        component={ComprendreScreen} />
        <Stack.Screen name="Legal"             component={LegalScreen} />
        <Stack.Screen name="SessionTimer"      component={SessionTimerScreen} />
        <Stack.Screen name="Investigation"     component={InvestigationScreen} />
        <Stack.Screen name="PrepRDV"           component={PrepRDVScreen} />
        <Stack.Screen name="BilanEmotionnel"   component={BilanEmotionnelScreen} />
        <Stack.Screen name="SurvivalQuiz"      component={SurvivalQuizScreen} />
        <Stack.Screen name="Certification"     component={CertificationScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
