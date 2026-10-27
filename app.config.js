// Only the private-network test APK permits HTTP. Normal builds keep HTTPS-only defaults.
module.exports = ({ config }) => {
  const preview = process.env.PSICO_BUILD_VARIANT === 'preview';
  if (preview) {
    const url = new URL(process.env.EXPO_PUBLIC_API_URL || 'https://missing.invalid');
    const parts = url.hostname.split('.').map(Number);
    const privateHost = parts.length === 4 && parts.every((n) => Number.isInteger(n) && n >= 0 && n <= 255) &&
      (parts[0] === 10 || (parts[0] === 192 && parts[1] === 168) || (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31));
    if (url.protocol !== 'http:' || !privateHost || url.username || url.password || url.pathname !== '/' || url.search || url.hash)
      throw new Error('El APK local requiere EXPO_PUBLIC_API_URL=http://IP-PRIVADA:PUERTO, sin credenciales.');
  }
  return {
    ...config,
    name: preview ? 'PsicoAprende Prueba' : config.name,
    android: { ...config.android, ...(preview ? { package: 'com.angelbsc.psicoaprende.preview' } : {}) },
    plugins: [...(config.plugins || []), ['expo-build-properties', { android: { usesCleartextTraffic: preview } }]],
  };
};
