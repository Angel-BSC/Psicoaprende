import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const key = 'psicoaprende.session';
export const readSession = () => Platform.OS === 'web' ? Promise.resolve(null) : SecureStore.getItemAsync(key);
export const saveSession = (token: string) => Platform.OS === 'web' ? Promise.resolve() : SecureStore.setItemAsync(key, token);
export const removeSession = () => Platform.OS === 'web' ? Promise.resolve() : SecureStore.deleteItemAsync(key);
