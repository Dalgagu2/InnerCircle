import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, SpaceGrotesk_500Medium, SpaceGrotesk_600SemiBold, SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk';
import { IBMPlexSans_400Regular, IBMPlexSans_500Medium, IBMPlexSans_600SemiBold } from '@expo-google-fonts/ibm-plex-sans';
import OnboardingScreen from '../components/OnboardingScreen';
import { useColors, useColorSchemeName } from '../constants/theme';
import { hasOnboarded, setOnboarded } from '../utils/storage';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [checking, setChecking] = useState(true);
  const [onboarded, setOnboardedState] = useState(false);
  const colors = useColors();
  const scheme = useColorSchemeName();

  const [fontsLoaded] = useFonts({
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
    IBMPlexSans_400Regular,
    IBMPlexSans_500Medium,
    IBMPlexSans_600SemiBold,
  });

  useEffect(() => {
    (async () => {
      setOnboardedState(await hasOnboarded());
      setChecking(false);
    })();
  }, []);

  const ready = fontsLoaded && !checking;

  const onLayoutReady = useCallback(async () => {
    if (ready) {
      await SplashScreen.hideAsync();
    }
  }, [ready]);

  useEffect(() => {
    onLayoutReady();
  }, [onLayoutReady]);

  const handleOnboardingComplete = async () => {
    await setOnboarded();
    setOnboardedState(true);
  };

  return (
    <>
      <StatusBar style={scheme === 'light' ? 'dark' : 'light'} />
      {!ready ? (
        <View style={{ flex: 1, backgroundColor: colors.bg }} />
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
