import { Fredoka_700Bold } from '@expo-google-fonts/fredoka/700Bold';
import { useFonts } from 'expo-font';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import AppBottomNav from '../components/AppBottomNav';
import { responsiveShellWidth } from '../theme/responsive';

const colors = {
  background: '#F8F5EE',
  card: '#FFFEFC',
  orange: '#FF5A0A',
  ink: '#002B5C',
  muted: '#667085',
  line: '#E7E0D6',
  input: '#FCFAF6',
  success: '#257A48',
  successBackground: '#EFF9F0',
  danger: '#B42318',
  dangerBackground: '#FFF1F0',
};

const apiBaseUrl = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:5014').replace(/\/$/, '');
const accessTokenStorageKey = 'perambulando.accessToken';

type StorageLike = {
  getItem: (key: string) => string | null;
};

type UserProfile = {
  id: string;
  name: string;
  email: string;
  typeofUser: number;
  isPro: boolean;
  createdAt: string;
};

type ApiErrorBody = {
  title?: string;
  detail?: string;
  errors?: Record<string, string[]>;
};

type LoadState = 'loading' | 'ready' | 'unauthenticated' | 'error';

function getWebSessionToken() {
  if (Platform.OS !== 'web') {
    return '';
  }

  const storage = (globalThis as { sessionStorage?: StorageLike }).sessionStorage;
  return storage?.getItem(accessTokenStorageKey) ?? '';
}

async function loadProfile(accessToken: string) {
  const response = await fetch(`${apiBaseUrl}/api/User/Profile`, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const body = (await response.json().catch(() => null)) as UserProfile | ApiErrorBody | null;

  if (!response.ok) {
    const errorBody = body as ApiErrorBody | null;
    const validationMessages = errorBody?.errors ? Object.values(errorBody.errors).flat() : [];
    throw new Error(
      errorBody?.detail ||
        validationMessages.join(' ') ||
        errorBody?.title ||
        'Não foi possível carregar o perfil.',
    );
  }

  return body as UserProfile;
}

function formatCreatedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Não informada';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

type ProfileFieldProps = {
  label: string;
  value: string;
};

function ProfileField({ label, value }: ProfileFieldProps) {
  return (
    <View style={styles.profileField}>
      <Text style={styles.profileFieldLabel}>{label}</Text>
      <Text selectable style={styles.profileFieldValue}>
        {value}
      </Text>
    </View>
  );
}

export default function ProfileScreen() {
  const { width: viewportWidth } = useWindowDimensions();
  const [fontsLoaded] = useFonts({ Fredoka_700Bold });
  const [accessToken] = useState(getWebSessionToken);
  const [state, setState] = useState<LoadState>(accessToken ? 'loading' : 'unauthenticated');
  const [message, setMessage] = useState(
    accessToken ? 'Carregando os dados da sua conta...' : 'Entre na sua conta para visualizar o perfil.',
  );
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    let active = true;

    if (!accessToken) {
      return () => {
        active = false;
      };
    }

    loadProfile(accessToken)
      .then((result) => {
        if (active) {
          setProfile(result);
          setState('ready');
          setMessage('');
        }
      })
      .catch((error) => {
        if (active) {
          setState('error');
          setMessage(
            error instanceof TypeError
              ? `Não foi possível acessar ${apiBaseUrl}. Verifique se a API está ativa.`
              : error instanceof Error
                ? error.message
                : 'Não foi possível carregar o perfil.',
          );
        }
      });

    return () => {
      active = false;
    };
  }, [accessToken]);

  const initial = profile?.name.trim().charAt(0).toUpperCase() || 'A';
  const userType = profile?.typeofUser === 1 ? 'Turista' : 'Local';

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/explorar');
  };

  return (
    <View style={styles.viewport}>
      <View style={[styles.appShell, { width: responsiveShellWidth(viewportWidth) }]}>
        <StatusBar style="dark" />
        <View style={styles.header}>
          <Pressable
            accessibilityLabel="Voltar"
            accessibilityRole="button"
            onPress={goBack}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          >
            <Text style={styles.backIcon}>‹</Text>
          </Pressable>

          <View accessible accessibilityLabel="Perambulando" style={styles.brand}>
            <Text style={[styles.brandName, fontsLoaded && styles.brandNameFredoka]}>Perambulando</Text>
            <Image
              accessibilityIgnoresInvertColors
              resizeMode="contain"
              source={require('../../assets/perambulando-mark.png')}
              style={styles.brandMark}
            />
          </View>

          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>{initial}</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator>
          <View style={styles.intro}>
            <Text style={styles.eyebrow}>MINHA CONTA</Text>
            <Text style={styles.pageTitle}>Meu perfil</Text>
            <Text style={styles.pageSubtitle}>Confira os dados informados durante o seu cadastro.</Text>
          </View>

          {state !== 'ready' ? (
            <View style={[styles.stateCard, state === 'error' && styles.errorCard]}>
              <Text style={[styles.stateTitle, state === 'error' && styles.errorTitle]}>
                {state === 'loading'
                  ? 'Preparando seu perfil'
                  : state === 'unauthenticated'
                    ? 'Sessão necessária'
                    : 'Perfil indisponível'}
              </Text>
              <Text style={styles.stateText}>{message}</Text>
              {state === 'unauthenticated' ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.replace({ pathname: '/cadastro_host', params: { origem: 'perfil' } })}
                  style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
                >
                  <Text style={styles.primaryButtonText}>Ir para cadastro e acesso</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}

          {state === 'ready' && profile ? (
            <>
              <View style={styles.identityCard}>
                <View style={styles.profileAvatar}>
                  <Text style={styles.profileAvatarText}>{initial}</Text>
                </View>
                <Text style={styles.profileName}>{profile.name}</Text>
                <Text style={styles.profileEmail}>{profile.email}</Text>
                <View style={styles.planBadge}>
                  <Text style={styles.planBadgeText}>{profile.isPro ? 'Plano PRO' : 'Plano gratuito'}</Text>
                </View>
              </View>

              <View style={styles.detailsCard}>
                <Text style={styles.cardEyebrow}>DADOS CADASTRAIS</Text>
                <Text style={styles.cardTitle}>Informações da conta</Text>
                <ProfileField label="Nome completo" value={profile.name} />
                <ProfileField label="E-mail" value={profile.email} />
                <ProfileField label="Perfil de uso" value={userType} />
                <ProfileField label="Assinatura" value={profile.isPro ? 'PRO' : 'Gratuita'} />
                <ProfileField label="Cadastrado em" value={formatCreatedAt(profile.createdAt)} />
                <ProfileField label="Identificador da conta" value={profile.id} />
              </View>

              <View style={styles.securityNotice}>
                <Text style={styles.securityIcon}>●</Text>
                <View style={styles.securityCopy}>
                  <Text style={styles.securityTitle}>Senha protegida</Text>
                  <Text style={styles.securityText}>
                    Sua senha não é retornada nem exibida pela plataforma.
                  </Text>
                </View>
              </View>
            </>
          ) : null}
        </ScrollView>
        <AppBottomNav active="profile" mode="user" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  viewport: {
    flex: 1,
    width: '100%',
    minWidth: 0,
    alignItems: 'center',
    backgroundColor: '#E6DED2',
  },
  appShell: {
    flex: 1,
    width: '100%',
    maxWidth: 760,
    minWidth: 0,
    alignSelf: 'center',
    overflow: 'hidden',
    backgroundColor: colors.background,
    borderColor: '#DDD8D2',
    borderLeftWidth: 1,
    borderRightWidth: 1,
  },
  header: {
    minHeight: 70,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderBottomColor: colors.line,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  backIcon: { color: colors.ink, fontSize: 28, lineHeight: 29 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  brandName: { color: colors.ink, fontSize: 16, fontWeight: '700', letterSpacing: -0.4 },
  brandNameFredoka: { fontFamily: 'Fredoka_700Bold', fontWeight: 'normal' },
  brandMark: { width: 36, height: 36 },
  headerAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.ink,
  },
  headerAvatarText: { color: colors.card, fontSize: 14, fontWeight: '800' },
  scrollContent: { paddingHorizontal: 14, paddingTop: 28, paddingBottom: 36, gap: 16 },
  intro: { paddingHorizontal: 2, paddingBottom: 6 },
  eyebrow: { marginBottom: 10, color: colors.orange, fontSize: 10, fontWeight: '800', letterSpacing: 1.7 },
  pageTitle: { color: colors.ink, fontSize: 30, fontWeight: '400', letterSpacing: -1.2 },
  pageSubtitle: { marginTop: 8, color: colors.muted, fontSize: 13, lineHeight: 20 },
  stateCard: {
    padding: 20,
    borderRadius: 20,
    borderColor: colors.line,
    borderWidth: 1,
    backgroundColor: colors.card,
    gap: 10,
  },
  errorCard: { borderColor: '#FECACA', backgroundColor: colors.dangerBackground },
  stateTitle: { color: colors.ink, fontSize: 17, fontWeight: '800' },
  errorTitle: { color: colors.danger },
  stateText: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  primaryButton: {
    minHeight: 44,
    marginTop: 6,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.ink,
  },
  primaryButtonText: { color: colors.card, fontSize: 12, fontWeight: '800' },
  identityCard: {
    padding: 22,
    alignItems: 'center',
    borderRadius: 24,
    backgroundColor: colors.ink,
    ...Platform.select({
      web: { boxShadow: '0 12px 30px rgba(0, 43, 92, 0.17)' },
      default: { elevation: 3 },
    }),
  },
  profileAvatar: {
    width: 68,
    height: 68,
    marginBottom: 13,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.orange,
    borderColor: colors.card,
    borderWidth: 4,
  },
  profileAvatarText: { color: colors.card, fontSize: 27, fontWeight: '800' },
  profileName: { color: colors.card, fontSize: 21, fontWeight: '800', textAlign: 'center' },
  profileEmail: { marginTop: 5, color: '#C6D2DF', fontSize: 12, textAlign: 'center' },
  planBadge: {
    marginTop: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#174A72',
  },
  planBadgeText: { color: '#AEE4C0', fontSize: 10, fontWeight: '800' },
  detailsCard: {
    padding: 18,
    borderRadius: 22,
    borderColor: colors.line,
    borderWidth: 1,
    backgroundColor: colors.card,
    gap: 12,
  },
  cardEyebrow: { color: colors.orange, fontSize: 9, fontWeight: '800', letterSpacing: 1.4 },
  cardTitle: { marginBottom: 2, color: colors.ink, fontSize: 19, fontWeight: '800' },
  profileField: {
    minHeight: 62,
    paddingHorizontal: 14,
    paddingVertical: 11,
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: colors.input,
    borderColor: colors.line,
    borderWidth: 1,
  },
  profileFieldLabel: { marginBottom: 4, color: colors.muted, fontSize: 9, fontWeight: '700' },
  profileFieldValue: { color: colors.ink, fontSize: 13, fontWeight: '700' },
  securityNotice: {
    padding: 15,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 17,
    backgroundColor: colors.successBackground,
    borderColor: '#CDE8D6',
    borderWidth: 1,
    gap: 10,
  },
  securityIcon: { color: colors.success, fontSize: 13 },
  securityCopy: { flex: 1 },
  securityTitle: { color: colors.success, fontSize: 12, fontWeight: '800' },
  securityText: { marginTop: 3, color: colors.muted, fontSize: 10, lineHeight: 15 },
  pressed: { opacity: 0.75 },
});
