import { router } from 'expo-router';
import { ScrollView, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton } from '@/components/app-button';
import { colors } from '@/constants/design';

export default function PrivacyScreen() {
  return <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
    <ScrollView contentContainerStyle={{ padding: 24, gap: 20 }}>
      <Text accessibilityRole="header" style={{ fontSize: 28, fontWeight: '800' }}>Uso de tus datos</Text>
      <Text style={{ fontSize: 16, lineHeight: 25 }}>Esta versión local guarda tu nombre, correo, tipo de cuenta de estudiante, fecha de aceptación y progreso en la base de datos del equipo que ejecuta el servicio. Si realizas exámenes, también se guardan las preguntas elegidas, respuestas, duración, fechas y resultados.</Text>
      <Text style={{ fontSize: 16, lineHeight: 25 }}>Si juegas a la máquina de cápsulas, se conservan el tablero, los casos clínicos ficticios asignados, tus respuestas, resultados y premios de XP y monedas. Esto permite retomar un caso y evitar premios duplicados. No introduzcas información de pacientes reales. Las monedas son internas y no tienen valor económico.</Text>
      <Text style={{ fontSize: 16, lineHeight: 25 }}>Tu contraseña se transforma en un hash con sal; no se guarda en texto legible. Usamos una sesión de hasta 30 días para mantener tu acceso. Al cerrar sesión se revoca ese acceso.</Text>
      <Text style={{ fontSize: 16, lineHeight: 25 }}>Guardamos tu meta diaria, preferencias de lectura, estilos de avatar conseguidos, canjes de monedas y estilo elegido. Puedes editar tu nombre en Perfil. Los recordatorios son locales al teléfono y usan su permiso de notificaciones; no requieren un servicio de envío remoto y se cancelan al cerrar sesión.</Text>
      <Text style={{ fontSize: 16, lineHeight: 25 }}>Los datos permiten recuperar tu actividad y preferencias. Para corregir otros datos o eliminar una cuenta en esta versión, solicita la gestión a quien administra este proyecto local. La eliminación automática desde la app aún no está disponible.</Text>
      <Text style={{ fontSize: 16, lineHeight: 25 }}>Este aviso corresponde a las pruebas locales (versión local-v4). Antes de distribuir la app se deberá identificar al responsable del servicio y publicar las condiciones de su versión pública.</Text>
      <AppButton label="Volver" onPress={() => router.canGoBack() ? router.back() : router.replace('/register')} />
    </ScrollView>
  </SafeAreaView>;
}
