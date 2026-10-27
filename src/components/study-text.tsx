import { Text, TextProps, StyleSheet } from 'react-native';
import { useProfile } from '@/context/profile-context';
import { readingMetrics } from '@/lib/profile-contract';

// Keep system font scaling enabled; this preference supplements accessibility settings.
export function StudyText({ style, ...props }: TextProps) {
  const { profile } = useProfile();
  const base = StyleSheet.flatten(style) ?? {};
  return <Text {...props} style={[style, readingMetrics(profile.readingSize, profile.roomyReading, base.fontSize, base.lineHeight)]} />;
}
