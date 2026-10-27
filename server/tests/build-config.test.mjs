import { test } from 'node:test';
import assert from 'node:assert/strict';
import configure from '../../app.config.js';

const base = { name: 'PsicoAprende', android: { package: 'com.angelbsc.psicoaprende' }, plugins: ['expo-router'] };
function config(variant, url) {
  const oldVariant = process.env.PSICO_BUILD_VARIANT, oldUrl = process.env.EXPO_PUBLIC_API_URL;
  try {
    process.env.PSICO_BUILD_VARIANT = variant;
    process.env.EXPO_PUBLIC_API_URL = url;
    return configure({ config: base });
  } finally {
    if (oldVariant === undefined) delete process.env.PSICO_BUILD_VARIANT; else process.env.PSICO_BUILD_VARIANT = oldVariant;
    if (oldUrl === undefined) delete process.env.EXPO_PUBLIC_API_URL; else process.env.EXPO_PUBLIC_API_URL = oldUrl;
  }
}
test('APK: HTTP limitado a variante de prueba con dirección privada', () => {
  const preview = config('preview', 'http://192.168.123.100:3001');
  assert.equal(preview.android.package, 'com.angelbsc.psicoaprende.preview');
  assert.equal(preview.plugins.at(-1)[1].android.usesCleartextTraffic, true);
  const normal = config('', 'https://example.test');
  assert.equal(normal.android.package, base.android.package);
  assert.equal(normal.plugins.at(-1)[1].android.usesCleartextTraffic, false);
  assert.equal(normal.name, base.name);
});
test('APK: rechaza localhost, IP pública, credenciales y URL incompleta para prueba LAN', () => {
  for (const url of ['', 'http://localhost:3001', 'http://8.8.8.8', 'http://user:pass@192.168.1.1', 'http://192.168.1.1/?key=value'])
    assert.throws(() => config('preview', url));
});
