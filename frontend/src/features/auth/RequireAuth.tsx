import type { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { colors } from '../../theme/colors';
import { useRequireAuth } from './useRequireAuth';

// Envolve uma tela que exige login:
//   <RequireAuth><MinhaTela /></RequireAuth>
// Sem sessão válida, a pessoa é levada ao login e a tela nunca chega a aparecer.
export function RequireAuth({ children }: { children: ReactNode }) {
  const status = useRequireAuth();

  if (status !== 'authenticated') {
    return (
      <View style={styles.container}>
        <ActivityIndicator color={colors.orange} />
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
