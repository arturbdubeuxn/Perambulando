import { Fredoka_700Bold } from '@expo-google-fonts/fredoka/700Bold';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFonts } from 'expo-font';
import { router } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';

type AppHeaderProps = {
  avatarLabel?: string;
  backLabel?: string;
  initial?: string;
  onAvatarPress?: () => void;
  onBackPress?: () => void;
};

export default function AppHeader({
  avatarLabel = 'Abrir perfil do usuário',
  backLabel = 'Voltar',
  initial,
  onAvatarPress = () => router.push('/perfil'),
  onBackPress,
}: AppHeaderProps) {
  const [fontsLoaded] = useFonts({ Fredoka_700Bold });
  const hasBack = typeof onBackPress === 'function';

  return (
    <View style={styles.header}>
      {hasBack ? (
        <Pressable
          accessibilityLabel={backLabel}
          accessibilityRole="button"
          onPress={onBackPress}
          style={({ pressed }) => [styles.sideButton, styles.backButton, pressed && styles.pressed]}
        >
          <Ionicons color={colors.ink} name="chevron-back" size={23} />
        </Pressable>
      ) : null}

      <View
        accessible
        accessibilityLabel="Perambulando"
        style={[styles.brand, hasBack && styles.centeredBrand]}
      >
        <Text style={[styles.brandName, fontsLoaded && styles.brandFont]}>Perambulando</Text>
        <Image
          accessibilityIgnoresInvertColors
          resizeMode="contain"
          source={require('../../assets/perambulando-mark.png')}
          style={styles.brandMark}
        />
      </View>

      {initial ? (
        <Pressable
          accessibilityLabel={avatarLabel}
          accessibilityRole="button"
          onPress={onAvatarPress}
          style={({ pressed }) => [styles.sideButton, styles.avatar, pressed && styles.pressed]}
        >
          <Text style={styles.avatarText}>{initial}</Text>
        </Pressable>
      ) : hasBack ? <View style={styles.sideButton} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    width: '100%',
    height: 88,
    minHeight: 88,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    backgroundColor: colors.card,
  },
  brand: {
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  centeredBrand: {
    flex: 1,
    justifyContent: 'center',
  },
  brandName: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  brandFont: {
    fontFamily: 'Fredoka_700Bold',
    fontWeight: 'normal',
  },
  brandMark: {
    width: 43,
    height: 48,
  },
  sideButton: {
    width: 42,
    height: 42,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    borderRadius: 21,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.background,
  },
  avatar: {
    borderRadius: 21,
    backgroundColor: colors.ink,
  },
  avatarText: {
    color: colors.card,
    fontSize: 16,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.7,
  },
});
