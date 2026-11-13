import { Fredoka_700Bold } from '@expo-google-fonts/fredoka/700Bold';
import { useFonts } from 'expo-font';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
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
import type { ScrollViewInstance } from 'react-native';

const colors = {
  background: '#F8F5EE',
  card: '#FFFEFC',
  orange: '#FF5A0A',
  ink: '#002B5C',
  muted: '#667085',
  line: '#E7E0D6',
  success: '#257A48',
  successBackground: '#EFF9F0',
  warning: '#9A5B13',
  warningBackground: '#FFF5E7',
  danger: '#B42318',
  dangerBackground: '#FFF1F0',
};

const apiBaseUrl = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:5014').replace(/\/$/, '');
const accessTokenStorageKey = 'perambulando.accessToken';
const hostIdStorageKey = 'perambulando.hostId';

type StorageLike = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
};

type AddressResponse = {
  id: number;
  city: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  cep: string;
};

type HostResponse = {
  id: number;
  typeofhost: number;
  name: string;
  description: string;
  logoUrl: string;
  isActive: boolean;
  address: AddressResponse;
};

type ProgrammingDetails = {
  id: number;
  hostId: number;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  isFree: boolean;
  minPrice: number;
  maxPrice: number;
  imageUrl: string;
  address: AddressResponse;
};

type HostDetails = {
  id: number;
  name: string;
  programmings: ProgrammingDetails[];
};

type ApiErrorBody = { title?: string; detail?: string; errors?: Record<string, string[]> };
type LoadStatus = 'loading' | 'ready' | 'unauthenticated' | 'error';

class ApiRequestError extends Error {
  status: number;

  constructor(status: number, body: ApiErrorBody | null) {
    const validationMessages = body?.errors ? Object.values(body.errors).flat() : [];
    super(
      body?.detail ||
        validationMessages.join(' ') ||
        body?.title ||
        `A requisição falhou (${status}).`,
    );
    this.status = status;
  }
}

function getWebSessionStorage(): StorageLike | null {
  if (Platform.OS !== 'web') {
    return null;
  }

  return (globalThis as { sessionStorage?: StorageLike }).sessionStorage ?? null;
}

async function apiRequest<T>(path: string, token: string) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
  const responseText = await response.text();
  let body: T | ApiErrorBody | null = null;

  if (responseText) {
    try {
      body = JSON.parse(responseText) as T | ApiErrorBody;
    } catch {
      body = null;
    }
  }

  if (!response.ok) {
    throw new ApiRequestError(response.status, body as ApiErrorBody | null);
  }

  return body as T;
}

function NavItem({
  icon,
  label,
  active = false,
  onPress,
}: {
  icon: string;
  label: string;
  active?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [styles.navItem, active && styles.navItemActive, pressed && styles.pressed]}
    >
      <Text style={[styles.navIcon, active && styles.navIconActive]}>{icon}</Text>
      <Text style={[styles.navLabel, active && styles.navLabelActive]}>{label}</Text>
    </Pressable>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Data indisponível';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function getProgrammingStatus(programming: ProgrammingDetails, currentTime: number) {
  const start = new Date(programming.startDate).getTime();
  const end = new Date(programming.endDate).getTime();

  if (end < currentTime) {
    return { label: 'Encerrada', style: styles.statusEnded, textStyle: styles.statusEndedText };
  }
  if (start > currentTime) {
    return { label: 'Futura', style: styles.statusFuture, textStyle: styles.statusFutureText };
  }

  return { label: 'Em andamento', style: styles.statusCurrent, textStyle: styles.statusCurrentText };
}

const hostTypeLabels: Record<number, string> = {
  0: 'Produtor de eventos',
  1: 'Gastronomia',
  2: 'Comércio',
};

export default function MyEventsScreen() {
  const { width: viewportWidth } = useWindowDimensions();
  const [fontsLoaded] = useFonts({ Fredoka_700Bold });
  const scrollRef = useRef<ScrollViewInstance>(null);
  const [currentTime] = useState(() => Date.now());
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [message, setMessage] = useState('Carregando seu painel...');
  const [hosts, setHosts] = useState<HostResponse[]>([]);
  const [detailsByHost, setDetailsByHost] = useState<Record<number, HostDetails>>({});
  const [selectedHostId, setSelectedHostId] = useState<number | null>(null);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      const storage = getWebSessionStorage();
      const token = storage?.getItem(accessTokenStorageKey) ?? '';
      const preferredHostId = Number(storage?.getItem(hostIdStorageKey) ?? 0);

      if (!token) {
        setStatus('unauthenticated');
        setMessage('Entre na sua conta para visualizar e administrar seus estabelecimentos e programações.');
        return;
      }

      try {
        const hostList = await apiRequest<HostResponse[]>('/api/Host/GetAllHostsbyUserId', token);
        if (!active) {
          return;
        }

        const activeHosts = hostList.filter((host) => host.isActive);
        const details = await Promise.all(
          activeHosts.map((host) => apiRequest<HostDetails>(`/api/Host/Details/${host.id}`, token)),
        );
        if (!active) {
          return;
        }

        const detailsIndex = Object.fromEntries(details.map((host) => [host.id, host]));
        const preferredHost = activeHosts.find((host) => host.id === preferredHostId);
        const initialHost = preferredHost ?? activeHosts[0] ?? null;

        setHosts(activeHosts);
        setDetailsByHost(detailsIndex);
        setSelectedHostId(initialHost?.id ?? null);
        setStatus('ready');
        setMessage('');
      } catch (error) {
        if (!active) {
          return;
        }

        if (error instanceof ApiRequestError && (error.status === 401 || error.status === 403)) {
          setStatus('unauthenticated');
          setMessage('Sua sessão expirou ou não possui acesso ao painel. Entre novamente para continuar.');
          return;
        }

        setStatus('error');
        setMessage(
          error instanceof TypeError
            ? `Não foi possível acessar ${apiBaseUrl}. Verifique se a API está em execução.`
            : error instanceof Error
              ? error.message
              : 'Não foi possível carregar o painel.',
        );
      }
    }

    void loadDashboard();
    return () => {
      active = false;
    };
  }, []);

  const selectedHost = useMemo(
    () => hosts.find((host) => host.id === selectedHostId) ?? null,
    [hosts, selectedHostId],
  );
  const selectedProgrammings = selectedHostId
    ? detailsByHost[selectedHostId]?.programmings ?? []
    : [];
  const futureCount = selectedProgrammings.filter(
    (programming) => new Date(programming.startDate).getTime() > currentTime,
  ).length;
  const endedCount = selectedProgrammings.filter(
    (programming) => new Date(programming.endDate).getTime() < currentTime,
  ).length;

  const selectHost = (hostId: number) => {
    setSelectedHostId(hostId);
    getWebSessionStorage()?.setItem(hostIdStorageKey, String(hostId));
  };

  return (
    <View style={styles.viewport}>
      <View style={[styles.appShell, { width: Math.min(viewportWidth, 430) }]}>
        <StatusBar style="dark" />
        <View style={styles.header}>
          <View accessible accessibilityLabel="Perambulando" style={styles.brand}>
            <Text style={[styles.brandName, fontsLoaded && styles.brandNameFredoka]}>Perambulando</Text>
            <Image
              accessibilityIgnoresInvertColors
              resizeMode="contain"
              source={require('../../assets/perambulando-mark.png')}
              style={styles.brandMark}
            />
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>A</Text>
          </View>
        </View>

        <ScrollView ref={scrollRef} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator>
          <View style={styles.intro}>
            <Text style={styles.eyebrow}>AREA DO HOST</Text>
            <Text style={styles.pageTitle}>Meus eventos</Text>
            <Text style={styles.pageSubtitle}>
              Acompanhe seus estabelecimentos e administre as programações em um só lugar.
            </Text>
          </View>

          {status === 'loading' ? (
            <View style={styles.stateCard}>
              <Text style={styles.stateTitle}>Preparando seu painel</Text>
              <Text style={styles.stateText}>{message}</Text>
            </View>
          ) : null}

          {status === 'unauthenticated' ? (
            <View style={[styles.stateCard, styles.warningCard]}>
              <Text style={styles.warningTitle}>Sessão necessária</Text>
              <Text style={styles.stateText}>{message}</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push('/cadastro_host')}
                style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
              >
                <Text style={styles.primaryButtonText}>Acessar cadastro</Text>
              </Pressable>
            </View>
          ) : null}

          {status === 'error' ? (
            <View style={[styles.stateCard, styles.errorCard]}>
              <Text style={styles.errorTitle}>Painel indisponível</Text>
              <Text style={styles.stateText}>{message}</Text>
            </View>
          ) : null}

          {status === 'ready' && hosts.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <Text style={styles.emptyIconText}>+</Text>
              </View>
              <Text style={styles.emptyTitle}>Cadastre seu primeiro estabelecimento</Text>
              <Text style={styles.emptyText}>
                Depois do cadastro, você poderá publicar e acompanhar todas as programações por aqui.
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push('/cadastro_host')}
                style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
              >
                <Text style={styles.primaryButtonText}>Cadastrar estabelecimento</Text>
              </Pressable>
            </View>
          ) : null}

          {status === 'ready' && selectedHost ? (
            <>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.sectionEyebrow}>ESTABELECIMENTOS</Text>
                  <Text style={styles.sectionTitle}>Escolha o perfil</Text>
                </View>
                <Text style={styles.sectionCount}>{hosts.length}</Text>
              </View>

              <ScrollView
                horizontal
                contentContainerStyle={styles.hostList}
                showsHorizontalScrollIndicator={false}
              >
                {hosts.map((host) => {
                  const isSelected = host.id === selectedHostId;
                  return (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityState={{ selected: isSelected }}
                      key={host.id}
                      onPress={() => selectHost(host.id)}
                      style={({ pressed }) => [
                        styles.hostOption,
                        isSelected && styles.hostOptionSelected,
                        pressed && styles.pressed,
                      ]}
                    >
                      <View style={[styles.hostBadge, isSelected && styles.hostBadgeSelected]}>
                        <Text style={[styles.hostBadgeText, isSelected && styles.hostBadgeTextSelected]}>
                          {host.name.trim().charAt(0).toUpperCase() || 'H'}
                        </Text>
                      </View>
                      <Text numberOfLines={1} style={[styles.hostName, isSelected && styles.hostNameSelected]}>
                        {host.name}
                      </Text>
                      <Text numberOfLines={1} style={[styles.hostType, isSelected && styles.hostTypeSelected]}>
                        {hostTypeLabels[host.typeofhost] ?? 'Estabelecimento'}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              <View style={styles.hostSummary}>
                <View style={styles.hostSummaryTop}>
                  <View style={styles.hostSummaryCopy}>
                    <Text style={styles.hostSummaryLabel}>PERFIL SELECIONADO</Text>
                    <Text style={styles.hostSummaryName}>{selectedHost.name}</Text>
                    <Text style={styles.hostSummaryAddress}>
                      {[selectedHost.address.neighborhood, selectedHost.address.city].filter(Boolean).join(' · ') ||
                        'Endereço não informado'}
                    </Text>
                  </View>
                  <View style={styles.activeBadge}>
                    <Text style={styles.activeBadgeText}>Ativo</Text>
                  </View>
                </View>

                <View style={styles.statsRow}>
                  <View style={styles.statCard}>
                    <Text style={styles.statValue}>{selectedProgrammings.length}</Text>
                    <Text style={styles.statLabel}>Ativas</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statValue}>{futureCount}</Text>
                    <Text style={styles.statLabel}>Futuras</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statValue}>{endedCount}</Text>
                    <Text style={styles.statLabel}>Encerradas</Text>
                  </View>
                </View>

                <View style={styles.actionRow}>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => router.push('/')}
                    style={({ pressed }) => [styles.primaryAction, pressed && styles.pressed]}
                  >
                    <Text style={styles.primaryActionIcon}>+</Text>
                    <Text style={styles.primaryActionText}>Criar programação</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => scrollRef.current?.scrollToEnd({ animated: true })}
                    style={({ pressed }) => [styles.secondaryAction, pressed && styles.pressed]}
                  >
                    <Text style={styles.secondaryActionText}>Administrar</Text>
                  </Pressable>
                </View>
              </View>

              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.sectionEyebrow}>PROGRAMACOES</Text>
                  <Text style={styles.sectionTitle}>Administrar eventos</Text>
                </View>
                <Text style={styles.sectionCount}>{selectedProgrammings.length}</Text>
              </View>

              {selectedProgrammings.length === 0 ? (
                <View style={styles.emptyProgrammingCard}>
                  <Text style={styles.emptyProgrammingTitle}>Nenhuma programação cadastrada</Text>
                  <Text style={styles.emptyProgrammingText}>
                    Crie o primeiro evento de {selectedHost.name} para ele aparecer neste painel.
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => router.push('/')}
                    style={({ pressed }) => [styles.outlineButton, pressed && styles.pressed]}
                  >
                    <Text style={styles.outlineButtonText}>Criar evento</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.programmingList}>
                  {selectedProgrammings.map((programming) => {
                    const programmingStatus = getProgrammingStatus(programming, currentTime);
                    return (
                      <View key={programming.id} style={styles.programmingCard}>
                        <View style={styles.programmingHeader}>
                          <View style={[styles.statusBadge, programmingStatus.style]}>
                            <Text style={[styles.statusText, programmingStatus.textStyle]}>
                              {programmingStatus.label}
                            </Text>
                          </View>
                          <Text style={styles.programmingId}>#{programming.id}</Text>
                        </View>
                        <Text style={styles.programmingName}>{programming.name}</Text>
                        <Text style={styles.programmingDate}>{formatDate(programming.startDate)}</Text>
                        <Text numberOfLines={1} style={styles.programmingAddress}>
                          {[programming.address?.street, programming.address?.city].filter(Boolean).join(' · ')}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              )}
            </>
          ) : null}
        </ScrollView>

        <View style={styles.bottomNav}>
          <NavItem icon="▦" label="Painel" />
          <NavItem active icon="▣" label="Meus eventos" />
          <Pressable
            accessibilityLabel="Criar evento"
            accessibilityRole="button"
            onPress={() => router.push('/')}
            style={({ pressed }) => [styles.createNavItem, pressed && styles.pressed]}
          >
            <View style={styles.createNavButton}>
              <Text style={styles.createNavPlus}>+</Text>
            </View>
            <Text style={styles.createNavLabel}>Criar evento</Text>
          </Pressable>
          <NavItem icon="⊙" label="Explorar" />
          <NavItem icon="▥" label="Comércio" onPress={() => router.push('/cadastro_host')} />
        </View>
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
    maxWidth: 430,
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
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderBottomColor: colors.line,
    borderBottomWidth: 1,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  brandName: { color: colors.ink, fontSize: 18, fontWeight: '700', letterSpacing: -0.5 },
  brandNameFredoka: { fontFamily: 'Fredoka_700Bold', fontWeight: 'normal' },
  brandMark: { width: 42, height: 42 },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.ink,
  },
  avatarText: { color: colors.card, fontSize: 14, fontWeight: '800' },
  scrollContent: { paddingHorizontal: 14, paddingTop: 30, paddingBottom: 30, gap: 16 },
  intro: { paddingHorizontal: 2, paddingBottom: 8 },
  eyebrow: { marginBottom: 12, color: colors.orange, fontSize: 10, fontWeight: '800', letterSpacing: 1.7 },
  pageTitle: { color: colors.ink, fontSize: 30, fontWeight: '400', letterSpacing: -1.2 },
  pageSubtitle: { maxWidth: 365, marginTop: 9, color: colors.muted, fontSize: 14, lineHeight: 21 },
  stateCard: {
    padding: 20,
    borderRadius: 20,
    borderColor: colors.line,
    borderWidth: 1,
    backgroundColor: colors.card,
    gap: 10,
  },
  stateTitle: { color: colors.ink, fontSize: 17, fontWeight: '800' },
  stateText: { color: colors.muted, fontSize: 12, lineHeight: 19 },
  warningCard: { borderColor: '#F1C78F', backgroundColor: colors.warningBackground },
  warningTitle: { color: colors.warning, fontSize: 17, fontWeight: '800' },
  errorCard: { borderColor: '#FFB4AE', backgroundColor: colors.dangerBackground },
  errorTitle: { color: colors.danger, fontSize: 17, fontWeight: '800' },
  primaryButton: {
    minHeight: 46,
    marginTop: 4,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.ink,
  },
  primaryButtonText: { color: colors.card, fontSize: 12, fontWeight: '800' },
  emptyCard: {
    padding: 24,
    borderRadius: 22,
    alignItems: 'center',
    borderColor: colors.line,
    borderWidth: 1,
    backgroundColor: colors.card,
    gap: 10,
  },
  emptyIcon: {
    width: 52,
    height: 52,
    marginBottom: 2,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF0E6',
  },
  emptyIconText: { color: colors.orange, fontSize: 30, fontWeight: '300' },
  emptyTitle: { color: colors.ink, fontSize: 17, fontWeight: '800', textAlign: 'center' },
  emptyText: { color: colors.muted, fontSize: 12, lineHeight: 19, textAlign: 'center' },
  sectionHeader: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  sectionEyebrow: { marginBottom: 3, color: colors.orange, fontSize: 9, fontWeight: '800', letterSpacing: 1.3 },
  sectionTitle: { color: colors.ink, fontSize: 18, fontWeight: '800' },
  sectionCount: {
    minWidth: 28,
    height: 28,
    paddingHorizontal: 8,
    borderRadius: 14,
    color: colors.ink,
    backgroundColor: '#EEE9E1',
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 28,
    textAlign: 'center',
  },
  hostList: { gap: 10, paddingRight: 8 },
  hostOption: {
    width: 146,
    minHeight: 112,
    padding: 14,
    borderRadius: 17,
    borderColor: colors.line,
    borderWidth: 1,
    backgroundColor: colors.card,
    gap: 4,
  },
  hostOptionSelected: { borderColor: colors.orange, backgroundColor: '#FFF4EC' },
  hostBadge: {
    width: 34,
    height: 34,
    marginBottom: 4,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E9EEF4',
  },
  hostBadgeSelected: { backgroundColor: colors.orange },
  hostBadgeText: { color: colors.ink, fontSize: 14, fontWeight: '800' },
  hostBadgeTextSelected: { color: colors.card },
  hostName: { color: colors.ink, fontSize: 13, fontWeight: '800' },
  hostNameSelected: { color: colors.orange },
  hostType: { color: colors.muted, fontSize: 10 },
  hostTypeSelected: { color: '#A8400D' },
  hostSummary: {
    padding: 17,
    borderRadius: 22,
    backgroundColor: colors.ink,
    gap: 17,
    ...Platform.select({
      web: { boxShadow: '0 10px 28px rgba(0, 43, 92, 0.16)' },
      default: { elevation: 3 },
    }),
  },
  hostSummaryTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  hostSummaryCopy: { flex: 1 },
  hostSummaryLabel: { color: '#AFC3D9', fontSize: 8, fontWeight: '800', letterSpacing: 1.2 },
  hostSummaryName: { marginTop: 5, color: colors.card, fontSize: 20, fontWeight: '800' },
  hostSummaryAddress: { marginTop: 4, color: '#D3DDE8', fontSize: 10 },
  activeBadge: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 10, backgroundColor: '#174A72' },
  activeBadgeText: { color: '#AEE4C0', fontSize: 9, fontWeight: '800' },
  statsRow: { flexDirection: 'row', gap: 8 },
  statCard: { flex: 1, minWidth: 0, padding: 11, borderRadius: 13, backgroundColor: '#123D69', gap: 2 },
  statValue: { color: colors.card, fontSize: 21, fontWeight: '800' },
  statLabel: { color: '#B9C9D9', fontSize: 9 },
  actionRow: { flexDirection: 'row', gap: 9 },
  primaryAction: {
    flex: 1.35,
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: colors.orange,
  },
  primaryActionIcon: { color: colors.card, fontSize: 19, fontWeight: '400' },
  primaryActionText: { color: colors.card, fontSize: 11, fontWeight: '800' },
  secondaryAction: {
    flex: 0.85,
    minHeight: 44,
    paddingHorizontal: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: '#41678C',
    borderWidth: 1,
  },
  secondaryActionText: { color: colors.card, fontSize: 11, fontWeight: '800' },
  emptyProgrammingCard: {
    padding: 20,
    borderRadius: 18,
    borderColor: colors.line,
    borderWidth: 1,
    backgroundColor: colors.card,
    gap: 8,
  },
  emptyProgrammingTitle: { color: colors.ink, fontSize: 15, fontWeight: '800' },
  emptyProgrammingText: { color: colors.muted, fontSize: 11, lineHeight: 17 },
  outlineButton: {
    minHeight: 42,
    marginTop: 5,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: colors.orange,
    borderWidth: 1,
  },
  outlineButtonText: { color: colors.orange, fontSize: 11, fontWeight: '800' },
  programmingList: { gap: 10 },
  programmingCard: {
    padding: 15,
    borderRadius: 17,
    borderColor: colors.line,
    borderWidth: 1,
    backgroundColor: colors.card,
    gap: 6,
  },
  programmingHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 9, fontWeight: '800' },
  statusCurrent: { backgroundColor: colors.successBackground },
  statusCurrentText: { color: colors.success },
  statusFuture: { backgroundColor: '#EAF1FA' },
  statusFutureText: { color: colors.ink },
  statusEnded: { backgroundColor: '#F0EDE8' },
  statusEndedText: { color: colors.muted },
  programmingId: { color: '#9A9AA2', fontSize: 9, fontWeight: '700' },
  programmingName: { color: colors.ink, fontSize: 15, fontWeight: '800' },
  programmingDate: { color: colors.orange, fontSize: 10, fontWeight: '700' },
  programmingAddress: { color: colors.muted, fontSize: 10 },
  pressed: { opacity: 0.72 },
  bottomNav: {
    minHeight: 74,
    paddingHorizontal: 5,
    paddingBottom: 7,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: colors.card,
    borderTopColor: colors.line,
    borderTopWidth: 1,
  },
  navItem: {
    flex: 1,
    minHeight: 54,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 3,
  },
  navItemActive: { backgroundColor: '#FFF0E6' },
  navIcon: { color: '#8C8C93', fontSize: 19, lineHeight: 20 },
  navIconActive: { color: colors.orange },
  navLabel: { color: '#8C8C93', fontSize: 8 },
  navLabelActive: { color: colors.orange, fontWeight: '800' },
  createNavItem: { flex: 1.18, minHeight: 68, alignItems: 'center', justifyContent: 'flex-end', gap: 4 },
  createNavButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.ink,
    borderColor: colors.card,
    borderWidth: 4,
    ...Platform.select({ web: { boxShadow: '0 5px 14px rgba(0, 43, 92, 0.22)' }, default: { elevation: 4 } }),
  },
  createNavPlus: { color: colors.card, fontSize: 24, fontWeight: '300', lineHeight: 25 },
  createNavLabel: { color: colors.ink, fontSize: 8, fontWeight: '700' },
});
