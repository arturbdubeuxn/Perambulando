import { Fredoka_700Bold } from '@expo-google-fonts/fredoka/700Bold';
import { useFonts } from 'expo-font';
import { router } from 'expo-router';
import type { Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { colors } from './theme/colors';
import { getToken } from './lib/session';
import { responsiveShellWidth } from './theme/responsive';

const LOGIN_ROUTE = '/login' as Href;
const REGISTER_ROUTE = '/cadastro' as Href;
const EXPLORE_ROUTE = '/explorar' as Href;
const HOST_ROUTE = '/meus_eventos' as Href;
const HERO_IMAGE = {
  uri: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200',
};

type QuickAccessProps = {
  description: string;
  icon: string;
  label: string;
  onPress: () => void;
};

function QuickAccess({ description, icon, label, onPress }: QuickAccessProps) {
  return (
    <Pressable
      accessibilityLabel={`${label}: ${description}`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.quickCard, pressed && styles.pressed]}
    >
      <View style={styles.quickIconBox}><Text style={styles.quickIcon}>{icon}</Text></View>
      <View style={styles.quickCopy}>
        <Text style={styles.quickTitle}>{label}</Text>
        <Text style={styles.quickDescription}>{description}</Text>
      </View>
      <Text aria-hidden style={styles.quickArrow}>›</Text>
    </Pressable>
  );
}

export default function HomeScreen() {
  const { width: viewportWidth } = useWindowDimensions();
  const [fontsLoaded] = useFonts({ Fredoka_700Bold });

  const openParticipantArea = async () => {
    router.push((await getToken()) ? EXPLORE_ROUTE : REGISTER_ROUTE);
  };

  const openHostArea = async () => {
    if (await getToken()) {
      router.push(HOST_ROUTE);
      return;
    }
    router.push({ pathname: '/cadastro_host', params: { origem: 'home' } });
  };

  return (
    <View style={styles.viewport}>
      <View style={[styles.appShell, { width: responsiveShellWidth(viewportWidth) }]}>
        <StatusBar style="light" />
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <ImageBackground
            accessibilityLabel="Vista cultural da cidade do Recife"
            imageStyle={styles.heroImage}
            resizeMode="cover"
            source={HERO_IMAGE}
            style={styles.hero}
          >
            <View style={styles.heroShade} />
            <View style={styles.heroCopy}>
              <Text style={styles.heroTitle}>A cidade chama.</Text>
              <Text style={styles.heroText}>Descubra o rolê, salve o que importa e vá perambular.</Text>
            </View>
          </ImageBackground>

          <View style={styles.content}>
            <View accessible accessibilityLabel="Perambulando" style={styles.brand}>
              <Image
                accessibilityIgnoresInvertColors
                resizeMode="contain"
                source={require('../assets/perambulando-mark.png')}
                style={styles.brandMark}
              />
              <Text style={styles.brandName}>PERAMBULANDO</Text>
            </View>

            <View style={styles.intro}>
              <Text style={styles.eyebrow}>SEU PRÓXIMO ROLÊ COMEÇA AGORA</Text>
              <Text style={styles.title}>Entra, a cidade tá te esperando.</Text>
              <Text style={styles.subtitle}>Eventos, encontros e experiências de um Recife que não para.</Text>
            </View>

            <View style={styles.actions}>
              <Pressable accessibilityRole="button" onPress={() => router.push(LOGIN_ROUTE)} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
                <Text style={[styles.primaryText, fontsLoaded && styles.fredoka]}>Entrar</Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={() => router.push(REGISTER_ROUTE)} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
                <Text style={[styles.secondaryText, fontsLoaded && styles.fredoka]}>Criar minha conta</Text>
              </Pressable>
              <Pressable accessibilityRole="link" onPress={() => router.push(EXPLORE_ROUTE)} style={({ pressed }) => [styles.guestButton, pressed && styles.pressed]}>
                <Text style={styles.guestText}>Continuar como visitante</Text><Text style={styles.guestArrow}>›</Text>
              </Pressable>
            </View>

            <View style={styles.dividerRow}><View style={styles.divider} /><Text style={styles.dividerText}>ACESSO RÁPIDO</Text><View style={styles.divider} /></View>

            <View style={styles.quickList}>
              <QuickAccess description="Explorar eventos" icon="♙" label="Participante" onPress={openParticipantArea} />
              <QuickAccess description="Gerenciar eventos" icon="▥" label="Host" onPress={openHostArea} />
            </View>

            <Text style={styles.terms}>Ao continuar, você concorda com nossos Termos e Política de Privacidade.</Text>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  viewport: { flex: 1, alignItems: 'center', backgroundColor: '#E6DED2' },
  appShell: { flex: 1, width: '100%', maxWidth: 760, minWidth: 0, alignSelf: 'center', overflow: 'hidden', backgroundColor: colors.background, borderColor: colors.line, borderLeftWidth: 1, borderRightWidth: 1 },
  scrollContent: { flexGrow: 1, backgroundColor: colors.background },
  hero: { minHeight: 176, justifyContent: 'flex-end', backgroundColor: colors.ink },
  heroImage: { backgroundColor: colors.ink },
  heroShade: { position: 'absolute', inset: 0, backgroundColor: 'rgba(0, 25, 53, 0.52)' },
  heroCopy: { maxWidth: 340, paddingHorizontal: 18, paddingBottom: 20 },
  heroTitle: { color: '#FFFFFF', fontSize: 38, fontWeight: '300', lineHeight: 40, letterSpacing: -1.7 },
  heroText: { maxWidth: 290, marginTop: 9, color: '#FFFFFF', fontSize: 12, fontWeight: '700', lineHeight: 18 },
  content: { flex: 1, paddingHorizontal: 16, paddingTop: 17, paddingBottom: 24 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandMark: { width: 31, height: 31 },
  brandName: { color: colors.ink, fontSize: 13, fontWeight: '900', letterSpacing: 1.2 },
  intro: { marginTop: 27 },
  eyebrow: { color: colors.orange, fontSize: 9, fontWeight: '900', letterSpacing: 1.65 },
  title: { maxWidth: 350, marginTop: 16, color: colors.ink, fontSize: 30, fontWeight: '300', lineHeight: 33, letterSpacing: -1.3 },
  subtitle: { maxWidth: 340, marginTop: 13, color: colors.muted, fontSize: 13, lineHeight: 20 },
  actions: { marginTop: 24, gap: 9 },
  primaryButton: { minHeight: 50, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.orange, borderRadius: 12, shadowColor: colors.orange, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 8 },
  primaryText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  secondaryButton: { minHeight: 50, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card, borderColor: colors.line, borderRadius: 12, borderWidth: 1 },
  secondaryText: { color: colors.ink, fontSize: 14, fontWeight: '900' },
  fredoka: { fontFamily: 'Fredoka_700Bold', fontWeight: 'normal' },
  guestButton: { minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  guestText: { color: colors.orange, fontSize: 13, fontWeight: '800' },
  guestArrow: { color: colors.orange, fontSize: 21, lineHeight: 21 },
  dividerRow: { marginTop: 6, flexDirection: 'row', alignItems: 'center', gap: 11 },
  divider: { flex: 1, height: 1, backgroundColor: colors.line },
  dividerText: { color: '#A0A6AF', fontSize: 8, fontWeight: '700', letterSpacing: 1.25 },
  quickList: { marginTop: 14, gap: 9 },
  quickCard: { minHeight: 66, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderColor: colors.line, borderWidth: 1, borderRadius: 13 },
  quickIconBox: { width: 30, alignItems: 'center' },
  quickIcon: { color: colors.orange, fontSize: 23 },
  quickCopy: { flex: 1, paddingHorizontal: 10 },
  quickTitle: { color: colors.ink, fontSize: 13, fontWeight: '900' },
  quickDescription: { marginTop: 3, color: '#8A8F98', fontSize: 10 },
  quickArrow: { color: colors.ink, fontSize: 25, fontWeight: '400' },
  terms: { maxWidth: 310, marginTop: 22, alignSelf: 'center', color: '#A0A6AF', fontSize: 8, lineHeight: 12, textAlign: 'center' },
  pressed: { opacity: 0.72 },
});
