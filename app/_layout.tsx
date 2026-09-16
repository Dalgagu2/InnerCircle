import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import OnboardingScreen from '../components/OnboardingScreen';
import { COLORS } from '../constants/theme';
import { hasOnboarded, setOnboarded } from '../utils/storage';

export default function RootLayout() {
  const [checking, setChecking] = useState(true);
  const [onboarded, setOnboardedState] = useState(false);

  useEffect(() => {
    (async () => {
      setOnboardedState(await hasOnboarded());
      setChecking(false);
    })();
  }, []);

  const handleOnboardingComplete = async () => {
    await setOnboarded();
    setOnboardedState(true);
  };

  return (
    <>
      <StatusBar style="light" />
      {checking ? (
        <View style={{ flex: 1, backgroundColor: COLORS.bg }} />
      ) : !onboarded ? (
        <OnboardingScreen onComplete={handleOnboardingComplete} />
      ) : (
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
        </Stack>
      )}
    </>
  );
}
