import { StyleSheet, Text, View } from 'react-native';

import { getPasswordStrength } from './registerValidation';
import type { PasswordLevel } from './registerValidation';

const LEVELS: Record<PasswordLevel, { label: string; color: string; segments: number }> = {
  empty: { label: '', color: '#D9D4CA', segments: 0 },
  weak: { label: 'Senha fraca', color: '#D64545', segments: 1 },
  medium: { label: 'Senha média', color: '#E0A100', segments: 2 },
  strong: { label: 'Senha forte', color: '#2E9E5B', segments: 3 },
};

export default function PasswordStrength({ password }: { password: string }) {
  const { checks, level } = getPasswordStrength(password);
  const info = LEVELS[level];

  return (
    <View style={styles.container}>
      <View style={styles.bar}>
        {[1, 2, 3].map((segment) => (
          <View
            key={segment}
            style={[
              styles.segment,
              { backgroundColor: segment <= info.segments ? info.color : '#E6E1D8' },
            ]}
          />
        ))}
      </View>
      {info.label ? (
        <Text accessibilityLiveRegion="polite" style={[styles.label, { color: info.color }]}>
          {info.label}
        </Text>
      ) : null}
      <View style={styles.list}>
        {checks.map((check) => (
          <Text key={check.id} style={[styles.item, check.ok && styles.itemOk]}>
            {check.ok ? '✓' : '○'} {check.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6, marginTop: -4 },
  bar: { flexDirection: 'row', gap: 6 },
  segment: { flex: 1, height: 6, borderRadius: 3 },
  label: { fontSize: 13, fontWeight: '700' },
  list: { gap: 2 },
  item: { fontSize: 13, color: '#6B7280' },
  itemOk: { color: '#2E9E5B' },
});
