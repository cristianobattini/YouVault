import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus, View, Text } from 'react-native';
import 'react-native-reanimated';
import { RealmProvider } from "@realm/react";

import { Credential } from '@/models/Credential';
import { Tag } from '@/models/Tag';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';
import { LockScreen } from '@/components/LockScreen';
import { BiometricService } from '@/services/biometricService';
import React from 'react';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('@/assets/fonts/SpaceMono-Regular.ttf'),
  });

  const [isUnlocked, setIsUnlocked] = useState<boolean | null>(null);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    if (loaded && isUnlocked !== null) {
      SplashScreen.hideAsync();
    }
  }, [loaded, isUnlocked]);

  useEffect(() => {
    const checkBiometric = async () => {
      try {
        const timeoutPromise = new Promise<boolean>(resolve =>
          setTimeout(() => resolve(true), 5000)
        );
        const checkPromise = BiometricService.isEnabled();
        const enabled = await Promise.race([checkPromise, timeoutPromise]);
        setIsUnlocked(enabled ? false : true);
      } catch (error) {
        console.log('BiometricService error:', error);
        setIsUnlocked(true);
      }
    };
    checkBiometric();
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextState: AppStateStatus) => {
      if (appState.current === 'active' && nextState === 'background') {
        const enabled = await BiometricService.isEnabled();
        if (enabled) {
          setIsUnlocked(false);
        }
      }
      appState.current = nextState;
    });
    return () => subscription.remove();
  }, []);

  if (!loaded || isUnlocked === null) {
    return (
      <View style={{ flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#000' }}>
          {!loaded ? 'Loading fonts...' : 'Checking auth...'}
        </Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider>
        {!isUnlocked ? (
          <LockScreen onUnlock={() => setIsUnlocked(true)} />
        ) : (
          <RealmProvider schemaVersion={1} schema={[Credential, Tag]}>
            <Stack>
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen
                name="credential-detail"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="settings"
                options={{ headerShown: false }}
              />
              <Stack.Screen name="+not-found" />
            </Stack>
            <StatusBar style="auto" />
          </RealmProvider>
        )}
      </PaperProvider>
    </GestureHandlerRootView>
  );
}
