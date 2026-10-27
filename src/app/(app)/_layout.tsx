import { Tabs } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '@/components/app-button';
import { useProgress } from '@/context/progress-context';

import { colors } from '@/constants/design';

const tabIcon = (symbol: string, focused: boolean) => (
  <Text style={[styles.icon, focused && styles.iconFocused]}>{symbol}</Text>
);

// Draw the outline directly so Android cannot substitute a colorful emoji.
const profileIcon = (focused: boolean) => {
  const borderColor = focused ? colors.primaryDark : colors.inkFaint;
  return (
    <View
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.profileIcon, focused && styles.profileIconFocused]}>
      <View style={[styles.profileHead, { borderColor }]} />
      <View style={[styles.profileShoulders, { borderColor }]} />
    </View>
  );
};

export default function AppTabsLayout() {
  const { loading, error, retry } = useProgress();
  if (loading || error) return <View style={{ flex: 1, justifyContent: 'center', gap: 16, padding: 24 }}>
    {loading ? <ActivityIndicator accessibilityLabel="Cargando progreso" /> : <>
      <Text accessibilityRole="alert">{error}</Text>
      <AppButton label="Reintentar" onPress={retry} />
    </>}
  </View>;
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primaryDark,
        tabBarInactiveTintColor: colors.inkFaint,
        tabBarLabelStyle: styles.label,
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: styles.tabItem,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ focused }) => tabIcon('⌂', focused),
        }}
      />
      <Tabs.Screen
        name="learn"
        options={{
          title: 'Aprender',
          tabBarIcon: ({ focused }) => tabIcon('◎', focused),
        }}
      />
      <Tabs.Screen
        name="exams"
        options={{ title: 'Exámenes', tabBarIcon: ({ focused }) => tabIcon('▤', focused) }}
      />
      <Tabs.Screen
        name="arcade"
        options={{ title: 'Jugar', tabBarIcon: ({ focused }) => tabIcon('◇', focused) }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ focused }) => profileIcon(focused),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 76,
    paddingTop: 8,
    paddingBottom: 10,
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
  },
  tabItem: { gap: 2 },
  label: { fontSize: 11, fontWeight: '700' },
  icon: { color: colors.inkFaint, fontSize: 23, fontWeight: '700' },
  iconFocused: { color: colors.primaryDark, transform: [{ scale: 1.08 }] },
  profileIcon: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center', gap: 3 },
  profileIconFocused: { transform: [{ scale: 1.08 }] },
  profileHead: { width: 9, height: 9, borderWidth: 2, borderRadius: 5 },
  profileShoulders: { width: 19, height: 10, borderWidth: 2, borderTopLeftRadius: 9, borderTopRightRadius: 9, borderBottomLeftRadius: 2, borderBottomRightRadius: 2 },
});
