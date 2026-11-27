import { router } from 'expo-router';
import type { Href } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { clearSession } from '../../lib/session';
import { colors } from '../../theme/colors';

// Área pública para onde o logout leva. Hoje é o login; trocar aqui quando a
// tela de boas-vindas do Figma existir no app.
const PUBLIC_ROUTE = '/login' as Href;

// Rota /sair: apaga os dados locais da sessão e redireciona. Qualquer botão
// "Sair" do app só precisa navegar para /sair. Não existe endpoint de logout
// na API: sair é apagar o token no cliente.
export default function LogoutScreen() {
  useEffect(() => {
    let active = true;

    clearSession().finally(() => {
      if (active) {
        // replace evita que o "voltar" reabra uma tela da área logada.
        router.replace(PUBLIC_ROUTE);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator color={colors.orange} />
      <Text style={styles.text}>Saindo...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: colors.background,
  },
  text: {
    color: colors.muted,
    fontSize: 14,
  },
});
