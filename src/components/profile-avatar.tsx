import { Text, View } from 'react-native';
import { profileItems, ProfileItemId } from '@/lib/profile-contract';

export function ProfileAvatar({ name, itemId, size = 82 }: { name: string; itemId: ProfileItemId; size?: number }) {
  const item = profileItems.find((item) => item.id === itemId) ?? profileItems[0];
  const initials = name.trim().split(/\s+/).slice(0, 2).map((part) => part.slice(0, 1).toUpperCase()).join('');
  return <View accessibilityLabel={`Estilo ${item.name}`} style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 3,
    borderColor: item.border, backgroundColor: item.background, alignItems: 'center', justifyContent: 'center' }}>
    <Text style={{ color: item.ink, fontSize: size * 0.28, fontWeight: '800' }}>{initials}</Text>
    {item.symbol ? <Text accessible={false} style={{ position: 'absolute', bottom: -5, right: -4, color: item.ink,
      backgroundColor: item.background, borderRadius: 14, paddingHorizontal: 4, fontSize: size * 0.27 }}>{item.symbol}</Text> : null}
  </View>;
}
