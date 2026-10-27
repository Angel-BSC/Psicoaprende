import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Text, View } from 'react-native';
import { AppButton } from '@/components/app-button';

import { colors } from '@/constants/design';
import { AuthProvider, useAuth } from '@/context/auth-context';
import { ProgressProvider } from '@/context/progress-context';
import { ProfileProvider } from '@/context/profile-context';
import { ReminderLifecycle } from '@/components/reminder-settings';

function Navigation() {
  const { user, initializing, initializationError, restore } = useAuth();
  if (initializing || initializationError) return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 24, gap: 16, backgroundColor: colors.background }}>
      {initializing ? <ActivityIndicator accessibilityLabel="Recuperando sesión" color={colors.primary} /> : <>
        <Text accessibilityRole="alert">{initializationError}</Text>
        <AppButton label="Reintentar conexión" onPress={() => void restore()} />
      </>}
    </View>
  );

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'slide_from_right',
        }}>
        <Stack.Protected guard={!user}>
          <Stack.Screen name="index" />
          <Stack.Screen name="login" />
          <Stack.Screen name="register" />
        </Stack.Protected>

        <Stack.Protected guard={Boolean(user)}>
          <Stack.Screen name="(app)" />
          <Stack.Screen name="lesson/[lessonId]" />
          <Stack.Screen name="exam/[examId]" />
          <Stack.Screen name="claw" />
        </Stack.Protected>
        <Stack.Screen name="privacy" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <ProgressProvider>
        <ProfileProvider>
          <ReminderLifecycle />
          <Navigation />
        </ProfileProvider>
      </ProgressProvider>
    </AuthProvider>
  );
}
