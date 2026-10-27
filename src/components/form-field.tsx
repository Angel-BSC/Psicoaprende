import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

import { colors, radii, spacing, typography } from '@/constants/design';

type FormFieldProps = TextInputProps & {
  label: string;
  error?: string;
};

export function FormField({ label, error, style, ...props }: FormFieldProps) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.inkFaint}
        style={[styles.input, error && styles.inputError, style]}
        {...props}
      />
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.xs },
  label: { color: colors.ink, fontSize: typography.small, fontWeight: '700' },
  input: {
    minHeight: 54,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.ink,
    fontSize: typography.body,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  inputError: { borderColor: colors.danger },
  error: { color: colors.danger, fontSize: 12 },
});
