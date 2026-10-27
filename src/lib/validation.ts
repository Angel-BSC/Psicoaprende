export type UserRole = 'student' | 'professional';
export type RegisterInput = { name: string; email: string; password: string; role?: 'student'; acceptedPrivacy: boolean };
export type LoginInput = { email: string; password: string };
export const PRIVACY_VERSION = 'local-v4';
export const normalizeEmail = (email: string) => email.trim().toLowerCase();
export const validEmail = (email: unknown): email is string =>
  typeof email === 'string' && email.trim().length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

export function registrationErrors(input: unknown): Record<string, string> {
  const data = (input && typeof input === 'object' ? input : {}) as Partial<RegisterInput>;
  const errors: Record<string, string> = {};
  if (typeof data.name !== 'string' || data.name.trim().length < 2 || data.name.trim().length > 80)
    errors.name = 'Escribe un nombre de 2 a 80 caracteres.';
  if (!validEmail(data.email)) errors.email = 'Ingresa un correo válido.';
  if (typeof data.password !== 'string' || data.password.length < 12 || data.password.length > 128 || !data.password.trim())
    errors.password = 'Usa una contraseña de 12 a 128 caracteres.';
  if (data.role !== undefined && data.role !== 'student') errors.role = 'Por ahora solo se permiten cuentas de estudiantes.';
  if (data.acceptedPrivacy !== true) errors.terms = 'Confirma que leíste el uso de datos.';
  return errors;
}
