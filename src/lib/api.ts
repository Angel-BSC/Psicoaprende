import Constants from 'expo-constants';
import { Platform } from 'react-native';

let token: string | null = null;
let onExpired: (() => void) | undefined;
export const setApiToken = (value: string | null) => { token = value; };
export const onSessionExpired = (callback: () => void) => {
  onExpired = callback;
  return () => { if (onExpired === callback) onExpired = undefined; };
};

export class ApiError extends Error {
  constructor(message: string, public status: number, public fields?: Record<string, string>) { super(message); }
}

function baseUrl() {
  const configured = process.env.EXPO_PUBLIC_API_URL;
  if (configured) return configured.replace(/\/$/, '');
  if (!__DEV__) throw new Error('Falta configurar la dirección del servicio.');
  const host = Platform.OS === 'web' && typeof window !== 'undefined'
    ? window.location.hostname : Constants.expoConfig?.hostUri?.split(':')[0];
  return `http://${host || (Platform.OS === 'android' ? '10.0.2.2' : 'localhost')}:3001`;
}

export async function api<T>(path: string, body?: unknown, authenticated = true): Promise<T> {
  const requestToken = token;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`${baseUrl()}${path}`, {
      method: body === undefined ? 'GET' : 'POST',
      credentials: Platform.OS === 'web' ? 'include' : 'omit',
      headers: {
        'Content-Type': 'application/json',
        'X-Psico-Client': Platform.OS === 'web' ? 'web' : 'native',
        ...(requestToken && authenticated ? { Authorization: `Bearer ${requestToken}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
    if (response.status === 204) return undefined as T;
    const data = await response.json();
    if (!response.ok) {
      if (response.status === 401 && authenticated && requestToken === token) onExpired?.();
      throw new ApiError(data.error || 'No se pudo completar la solicitud.', response.status, data.fields);
    }
    return data as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('No pudimos conectar con el servicio. Revisa tu conexión e intenta nuevamente.', 0);
  } finally { clearTimeout(timer); }
}
