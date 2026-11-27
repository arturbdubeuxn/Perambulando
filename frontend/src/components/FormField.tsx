import { StyleSheet, Text, TextInput, View } from 'react-native';
import type { TextInputProps } from 'react-native';

import { colors } from '../theme/colors';

type FormFieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  error?: string;
  secureTextEntry?: boolean;
  keyboardType?: TextInputProps['keyboardType'];
  autoCapitalize?: TextInputProps['autoCapitalize'];
  autoComplete?: TextInputProps['autoComplete'];
  maxLength?: number;
  editable?: boolean;
};

export function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  autoComplete,
  maxLength,
  editable = true,
}: FormFieldProps) {
  return (
    <View style={styles.group}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        autoCapitalize={autoCapitalize}
        autoComplete={autoComplete}
        autoCorrect={false}
        editable={editable}
        keyboardType={keyboardType}
        maxLength={maxLength}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9297A3"
        secureTextEntry={secureTextEntry}
        style={[styles.input, !editable && styles.inputDisabled, error ? styles.inputError : null]}
        value={value}
      />
      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: 8,
  },
  label: {
    color: colors.ink,
    fontSize: 11,
    fontWeight: '700',
  },
  input: {
    width: '100%',
    minHeight: 52,
    paddingHorizontal: 14,
    color: colors.ink,
    fontSize: 14,
    backgroundColor: colors.input,
    borderColor: colors.line,
    borderRadius: 13,
    borderWidth: 1,
  },
  inputDisabled: {
    color: colors.muted,
    backgroundColor: '#F3F0EA',
  },
  inputError: {
    borderColor: colors.errorBorder,
  },
  error: {
    color: colors.error,
    fontSize: 11,
    lineHeight: 15,
  },
});
