import { Fredoka_700Bold } from '@expo-google-fonts/fredoka/700Bold';
import { useFonts } from 'expo-font';
import { router, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

const colors = { ink: '#002B5C', orange: '#FF5A0A', orangeSoft: '#FFF0E7', background: '#F8F5EE', card: '#FFFEFC', line: '#E7E0D6', muted: '#667085', danger: '#B42318', success: '#257A48' };
const apiBaseUrl = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:5014').replace(/\/$/, '');
const accessTokenStorageKey = 'perambulando.accessToken';
const periods = [{ label: '7 dias', days: 7 }, { label: '30 dias', days: 30 }, { label: '90 dias', days: 90 }] as const;
type Period = typeof periods[number]['label'];
type Tab = 'results' | 'subscription';
type DataState = 'loading' | 'ready' | 'forbidden' | 'empty' | 'error' | 'unauthenticated';

type Host = { id: number; name: string; isActive: boolean };
type Profile = { name: string };
type Summary = { detailViews: number; roadmapInclusions: number; carouselClicks: number; ticketClicks: number; nearbyClicks: number; activeFavoritesNow: number };
type Daily = { date: string; detailViews: number; roadmapInclusions: number; carouselClicks: number; ticketClicks: number; nearbyClicks: number };
type Ranking = { position: number; programmingId: number; name: string; detailViews: number; carouselClicks: number; ticketClicks: number; nearbyClicks: number; activeFavoritesNow: number };
type Subscription = { id: number | null; status: number; startsAt: string | null; expiresAt: string | null };
type StorageLike = { getItem: (key: string) => string | null };

class ApiError extends Error { constructor(message: string, readonly status: number) { super(message); } }

function getToken() {
  if (Platform.OS !== 'web') return '';
  return (globalThis as { sessionStorage?: StorageLike }).sessionStorage?.getItem(accessTokenStorageKey) ?? '';
}

async function apiRequest<T>(path: string, token: string, init: RequestInit = {}) {
  const response = await fetch(`${apiBaseUrl}${path}`, { ...init, headers: { Accept: 'application/json', Authorization: `Bearer ${token}`, ...init.headers } });
  const body = (await response.json().catch(() => null)) as T | { detail?: string; title?: string } | null;
  if (!response.ok) {
    const error = body as { detail?: string; title?: string } | null;
    throw new ApiError(error?.detail || error?.title || 'Não foi possível carregar o painel.', response.status);
  }
  return body as T;
}

function periodQuery(period: Period) {
  const days = periods.find((item) => item.label === period)?.days ?? 7;
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - days + 1);
  return new URLSearchParams({ StartDate: start.toISOString(), EndDate: end.toISOString() }).toString();
}

function formatDate(value: string | null) {
  if (!value) return 'Não informada';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Não informada' : new Intl.DateTimeFormat('pt-BR').format(date);
}

function NavItem({ active = false, icon, label, onPress }: { active?: boolean; icon: string; label: string; onPress?: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ selected: active }} onPress={onPress} style={({ pressed }) => [styles.navItem, active && styles.navItemActive, pressed && styles.pressed]}><Text style={[styles.navIcon, active && styles.navActive]}>{icon}</Text><Text style={[styles.navLabel, active && styles.navActive]}>{label}</Text></Pressable>;
}

export default function DashboardScreen() {
  const [fontsLoaded] = useFonts({ Fredoka_700Bold });
  const [token] = useState(getToken);
  const [tab, setTab] = useState<Tab>('results');
  const [period, setPeriod] = useState<Period>('7 dias');
  const [hosts, setHosts] = useState<Host[]>([]);
  const [selectedHostId, setSelectedHostId] = useState<number | null>(null);
  const [initial, setInitial] = useState('U');
  const [summary, setSummary] = useState<Summary | null>(null);
  const [daily, setDaily] = useState<Daily[]>([]);
  const [ranking, setRanking] = useState<Ranking[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [state, setState] = useState<DataState>(token ? 'loading' : 'unauthenticated');
  const [subscriptionState, setSubscriptionState] = useState<DataState>(token ? 'loading' : 'unauthenticated');
  const [message, setMessage] = useState(token ? 'Carregando seus estabelecimentos...' : 'Entre na sua conta HOST para acessar o painel.');
  const [subscriptionMessage, setSubscriptionMessage] = useState('Consultando sua assinatura...');
  const [demo, setDemo] = useState(false);

  useEffect(() => {
    if (!token) return;
    let active = true;
    Promise.all([
      apiRequest<Host[]>('/api/Host/GetAllHostsbyUserId', token),
      apiRequest<Profile>('/api/User/Profile', token).catch(() => null),
      apiRequest<Subscription>('/api/Subscription/MySubscription', token).catch((error) => {
        if (active) {
          setSubscriptionState('error');
          setSubscriptionMessage(error instanceof Error ? error.message : 'Não foi possível consultar a assinatura.');
        }
        return null;
      }),
    ]).then(([hostList, profile, currentSubscription]) => {
      if (!active) return;
      const availableHosts = hostList.filter((host) => host.isActive);
      setHosts(availableHosts);
      setSelectedHostId(availableHosts[0]?.id ?? null);
      setInitial(profile?.name.trim().charAt(0).toUpperCase() || 'U');
      setSubscription(currentSubscription);
      if (currentSubscription) { setSubscriptionState('ready'); setSubscriptionMessage(''); }
      if (availableHosts.length === 0) { setState('empty'); setMessage('Cadastre um estabelecimento para começar a acompanhar seus resultados.'); }
    }).catch((error) => {
      if (!active) return;
      const text = error instanceof ApiError ? error.message : error instanceof TypeError ? `Não foi possível acessar ${apiBaseUrl}. Verifique se a API está ativa.` : 'Não foi possível carregar o painel.';
      setState('error'); setSubscriptionState('error'); setMessage(text); setSubscriptionMessage(text);
    });
    return () => { active = false; };
  }, [token]);

  useEffect(() => {
    if (!token || selectedHostId === null) return;
    let active = true;
    const query = periodQuery(period);
    Promise.all([
      apiRequest<Summary>(`/api/Host/${selectedHostId}/Statistics/Summary?${query}`, token),
      apiRequest<Daily[]>(`/api/Host/${selectedHostId}/Statistics/Daily?${query}`, token),
      apiRequest<Ranking[]>(`/api/Host/${selectedHostId}/Statistics/Ranking?${query}&Take=5&Skip=0&SortBy=detailViews`, token),
    ]).then(([nextSummary, nextDaily, nextRanking]) => {
      if (!active) return;
      setSummary(nextSummary); setDaily(nextDaily); setRanking(nextRanking); setState('ready'); setMessage(''); setDemo(false);
    }).catch((error) => {
      if (!active) return;
      setSummary(null); setDaily([]); setRanking([]);
      if (error instanceof ApiError && error.status === 403) { setState('forbidden'); setMessage(error.message); }
      else { setState('error'); setMessage(error instanceof Error ? error.message : 'Não foi possível carregar as estatísticas.'); }
    });
    return () => { active = false; };
  }, [period, selectedHostId, token]);

  const selectedHost = hosts.find((host) => host.id === selectedHostId);
  const number = (value: number) => value.toLocaleString('pt-BR');
  const chart = useMemo(() => {
    const values = daily.map((item) => item.detailViews);
    const maximum = Math.max(...values, 1);
    return daily.map((item) => ({ ...item, height: Math.max(8, Math.round((item.detailViews / maximum) * 100)) }));
  }, [daily]);
  const subscriptionLabels = ['Inativa', 'Ativa', 'Cancelada', 'Expirada'];

  async function changeSubscription(action: 'Activate' | 'Cancel') {
    if (!token) return;
    setSubscriptionState('loading'); setSubscriptionMessage(action === 'Activate' ? 'Ativando assinatura...' : 'Cancelando assinatura...');
    try {
      const result = await apiRequest<Subscription>(`/api/Subscription/${action}`, token, { method: action === 'Activate' ? 'POST' : 'PATCH' });
      setSubscription(result); setSubscriptionState('ready'); setSubscriptionMessage(action === 'Activate' ? 'Assinatura ativada.' : 'Assinatura cancelada.');
    } catch (error) {
      setSubscriptionState('error'); setSubscriptionMessage(error instanceof Error ? error.message : 'Não foi possível atualizar a assinatura.');
    }
  }

  return <View style={styles.viewport}><View style={styles.shell}><StatusBar style="dark" />
    <View style={styles.header}><View style={styles.brand}><Text style={[styles.brandName, fontsLoaded && styles.brandFont]}>Perambulando</Text><Image accessibilityLabel="Marca Perambulando" resizeMode="contain" source={require('../assets/perambulando-mark.png')} style={styles.mark} /></View><Pressable accessibilityLabel="Abrir perfil" onPress={() => router.push('/perfil')} style={styles.avatar}><Text style={styles.avatarText}>{initial}</Text></Pressable></View>
    <ScrollView contentContainerStyle={styles.content}>
      <View><Text style={styles.eyebrow}>SEU NEGÓCIO EM MOVIMENTO</Text><Text style={styles.title}>Seu painel</Text><Text style={styles.body}>Dados dos endpoints de estatísticas e assinatura do Perambulando.</Text></View>
      {!token ? <View style={styles.notice}><Text style={styles.cardTitle}>Sessão necessária</Text><Text style={styles.body}>{message}</Text><Pressable onPress={() => router.push('/cadastro_host' as Href)} style={styles.primaryButton}><Text style={styles.primaryText}>Acessar cadastro</Text></Pressable></View> : null}
      {token && hosts.length > 0 ? <View><Text style={styles.caption}>Estabelecimento analisado</Text><ScrollView horizontal contentContainerStyle={styles.hostSelector} showsHorizontalScrollIndicator={false}>{hosts.map((host) => <Pressable key={host.id} onPress={() => { setState('loading'); setMessage('Carregando estatísticas reais...'); setSelectedHostId(host.id); }} style={[styles.hostChip, selectedHostId === host.id && styles.hostChipActive]}><Text style={[styles.hostChipText, selectedHostId === host.id && styles.hostChipTextActive]}>{host.name}</Text></Pressable>)}</ScrollView></View> : null}
      <View accessibilityRole="tablist" style={styles.tabs}>{([{ id: 'results', label: 'Visão geral' }, { id: 'subscription', label: 'Minha assinatura' }] as const).map((item) => <Pressable accessibilityRole="tab" accessibilityState={{ selected: tab === item.id }} key={item.id} onPress={() => setTab(item.id)} style={[styles.tab, tab === item.id && styles.tabActive]}><Text style={[styles.tabText, tab === item.id && styles.tabTextActive]}>{item.label}</Text></Pressable>)}</View>
      {tab === 'results' ? <>
        <View style={styles.row}><Text style={styles.sectionTitle}>{selectedHost?.name ?? 'Seus resultados'}</Text><Text style={styles.caption}>{state === 'ready' ? 'Dados reais' : demo ? 'Demonstração' : 'Indisponível'}</Text></View>
        <View style={styles.periods}>{periods.map((item) => <Pressable key={item.label} onPress={() => { setState('loading'); setMessage('Carregando estatísticas reais...'); setPeriod(item.label); }} style={[styles.period, period === item.label && styles.periodActive]}><Text style={[styles.caption, period === item.label && styles.orangeText]}>{item.label}</Text></Pressable>)}</View>
        {state === 'loading' ? <View style={styles.stateCard}><ActivityIndicator color={colors.orange} /><Text style={styles.body}>{message}</Text></View> : null}
        {state === 'empty' ? <View style={styles.stateCard}><Text style={styles.cardTitle}>Nenhum estabelecimento</Text><Text style={styles.body}>{message}</Text><Pressable onPress={() => router.push('/cadastro_host' as Href)} style={styles.primaryButton}><Text style={styles.primaryText}>Cadastrar host</Text></Pressable></View> : null}
        {(state === 'forbidden' || state === 'error') && !demo ? <View style={[styles.stateCard, state === 'error' && styles.errorCard]}><Text style={styles.cardTitle}>{state === 'forbidden' ? 'Estatísticas não disponíveis no plano atual' : 'Painel indisponível'}</Text><Text style={styles.body}>{message}</Text><Pressable onPress={() => setDemo(true)} style={styles.secondaryButton}><Text style={styles.secondaryText}>Ver demonstração</Text></Pressable></View> : null}
        {(state === 'ready' || demo) ? <>
          <View style={styles.metrics}>{[
            { label: 'Visualizações', value: state === 'ready' ? summary?.detailViews ?? 0 : 1240 },
            { label: 'Favoritos ativos', value: state === 'ready' ? summary?.activeFavoritesNow ?? 0 : 186 },
            { label: 'Cliques em ingressos', value: state === 'ready' ? summary?.ticketClicks ?? 0 : 96 },
            { label: 'Ações de proximidade', value: state === 'ready' ? summary?.nearbyClicks ?? 0 : 74 },
          ].map((metric) => <View key={metric.label} style={styles.metric}><Text style={styles.caption}>{metric.label}</Text><Text style={styles.metricValue}>{number(metric.value)}</Text><Text style={styles.small}>{state === 'ready' ? `Últimos ${period}` : 'Valor ilustrativo'}</Text></View>)}</View>
          <View style={styles.card}><Text style={styles.cardTitle}>Interesse ao longo do tempo</Text>{state === 'ready' && chart.length > 0 ? <View style={styles.chart}>{chart.map((item) => <View key={item.date} style={styles.chartColumn}><View style={[styles.bar, { height: item.height }]} /><Text style={styles.small}>{new Date(item.date).getDate()}</Text></View>)}</View> : demo ? <View style={styles.chart}>{[35, 50, 42, 65, 80, 100, 72].map((height, index) => <View key={index} style={styles.chartColumn}><View style={[styles.bar, { height }]} /><Text style={styles.small}>D{index + 1}</Text></View>)}</View> : <Text style={styles.empty}>Ainda não há visualizações neste período.</Text>}</View>
          <View style={styles.card}><Text style={styles.cardTitle}>Programações em foco</Text>{state === 'ready' && ranking.length > 0 ? ranking.map((item) => <View key={item.programmingId} style={styles.eventRow}><Text style={styles.eventName}>{item.position}. {item.name}</Text><Text style={styles.caption}>{number(item.detailViews)} visualizações · {number(item.ticketClicks)} cliques em ingressos</Text></View>) : demo ? <Text style={styles.body}>Jazz no Quintal · Feira Criativa · Cinema ao Ar Livre</Text> : <Text style={styles.empty}>Nenhuma programação com interação neste período.</Text>}</View>
        </> : null}
      </> : <>
        <View style={styles.card}><View style={styles.row}><Text style={styles.cardTitle}>Minha assinatura</Text><View style={styles.badge}><Text style={styles.badgeText}>{subscription ? subscriptionLabels[subscription.status] ?? 'Desconhecida' : 'Não consultada'}</Text></View></View>
          {subscriptionState === 'loading' ? <ActivityIndicator color={colors.orange} /> : null}
          <Text style={styles.body}>{subscription ? `Início: ${formatDate(subscription.startsAt)}\nTérmino: ${formatDate(subscription.expiresAt)}` : subscriptionMessage}</Text>
          {subscription?.status === 1 ? <Pressable onPress={() => void changeSubscription('Cancel')} style={styles.secondaryButton}><Text style={styles.secondaryText}>Cancelar assinatura</Text></Pressable> : <Pressable onPress={() => void changeSubscription('Activate')} style={styles.primaryButton}><Text style={styles.primaryText}>Ativar assinatura disponível</Text></Pressable>}
          {subscriptionMessage ? <Text style={[styles.small, subscriptionState === 'error' && styles.errorText]}>{subscriptionMessage}</Text> : null}
        </View>
        <View style={styles.card}><Text style={styles.cardTitle}>Benefícios do acesso PRO</Text><Text style={styles.body}>Resumo de visitas e cliques, ranking das programações e evolução diária. A ativação depende da configuração disponibilizada pelo backend.</Text></View>
      </>}
    </ScrollView>
    <View style={styles.bottomNav}><NavItem active icon="▦" label="Painel" /><NavItem icon="▣" label="Meus eventos" onPress={() => router.push('/meus_eventos')} /><Pressable onPress={() => router.push('/')} style={styles.createNav}><View style={styles.createButton}><Text style={styles.createPlus}>+</Text></View><Text style={styles.createLabel}>Criar evento</Text></Pressable><NavItem icon="⊙" label="Explorar" onPress={() => router.push('/explorar' as Href)} /><NavItem icon="▥" label="Comércio" onPress={() => router.push({ pathname: '/comercio', params: { gestao: '1' } } as Href)} /></View>
  </View></View>;
}

const styles = StyleSheet.create({
  viewport: { flex: 1, alignItems: 'center', backgroundColor: '#E6DED2' }, shell: { flex: 1, width: '100%', maxWidth: 430, overflow: 'hidden', backgroundColor: colors.background, borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#DDD8D2' }, header: { minHeight: 70, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: colors.line, backgroundColor: colors.card }, brand: { flexDirection: 'row', alignItems: 'center', gap: 7 }, brandName: { color: colors.ink, fontSize: 18, fontWeight: '700' }, brandFont: { fontFamily: 'Fredoka_700Bold', fontWeight: 'normal' }, mark: { width: 42, height: 42 }, avatar: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.ink }, avatarText: { color: colors.card, fontWeight: '800' },
  content: { padding: 16, paddingTop: 28, paddingBottom: 34, gap: 15 }, eyebrow: { color: colors.orange, fontSize: 9, fontWeight: '800', letterSpacing: 1.6 }, title: { marginTop: 8, color: colors.ink, fontSize: 30, fontWeight: '700' }, body: { color: colors.muted, fontSize: 12, lineHeight: 19 }, caption: { color: colors.muted, fontSize: 10, lineHeight: 15 }, small: { color: colors.muted, fontSize: 9, lineHeight: 14 }, notice: { padding: 17, gap: 10, borderRadius: 18, borderWidth: 1, borderColor: '#FFD8C2', backgroundColor: '#FFF7F1' }, stateCard: { minHeight: 145, padding: 18, alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 18, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card }, errorCard: { borderColor: '#FECACA', backgroundColor: '#FFF1F0' },
  hostSelector: { paddingTop: 9, paddingRight: 12, gap: 7 }, hostChip: { minHeight: 38, paddingHorizontal: 13, alignItems: 'center', justifyContent: 'center', borderRadius: 19, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card }, hostChipActive: { borderColor: colors.orange, backgroundColor: colors.orangeSoft }, hostChipText: { color: colors.muted, fontSize: 10, fontWeight: '700' }, hostChipTextActive: { color: colors.orange }, tabs: { padding: 4, flexDirection: 'row', borderRadius: 14, backgroundColor: '#EEEAE2' }, tab: { flex: 1, minHeight: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 10 }, tabActive: { backgroundColor: colors.ink }, tabText: { color: colors.muted, fontSize: 11, fontWeight: '700' }, tabTextActive: { color: colors.card },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }, sectionTitle: { color: colors.ink, fontSize: 19, fontWeight: '800' }, periods: { flexDirection: 'row', gap: 7 }, period: { flex: 1, minHeight: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card }, periodActive: { borderColor: colors.orange, backgroundColor: colors.orangeSoft }, orangeText: { color: colors.orange, fontWeight: '800' }, metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 }, metric: { flexBasis: '46%', flexGrow: 1, padding: 13, gap: 6, borderRadius: 16, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card }, metricValue: { color: colors.ink, fontSize: 26, fontWeight: '800' }, card: { padding: 16, gap: 11, borderRadius: 19, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card }, cardTitle: { color: colors.ink, fontSize: 16, fontWeight: '800' }, chart: { height: 126, paddingTop: 12, flexDirection: 'row', alignItems: 'flex-end', gap: 5 }, chartColumn: { flex: 1, alignItems: 'center', gap: 5 }, bar: { width: '100%', borderTopLeftRadius: 5, borderTopRightRadius: 5, backgroundColor: colors.orange }, empty: { paddingVertical: 20, color: colors.muted, fontSize: 11, textAlign: 'center' }, eventRow: { paddingTop: 10, gap: 4, borderTopWidth: 1, borderTopColor: colors.line }, eventName: { color: colors.ink, fontSize: 12, fontWeight: '800' }, badge: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 12, backgroundColor: '#EDF2F6' }, badgeText: { color: colors.ink, fontSize: 9, fontWeight: '800' },
  primaryButton: { minHeight: 43, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: colors.ink }, primaryText: { color: colors.card, fontSize: 11, fontWeight: '800' }, secondaryButton: { minHeight: 43, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center', borderRadius: 12, borderWidth: 1, borderColor: colors.ink, backgroundColor: colors.card }, secondaryText: { color: colors.ink, fontSize: 11, fontWeight: '800' }, errorText: { color: colors.danger }, pressed: { opacity: 0.72 },
  bottomNav: { minHeight: 74, paddingHorizontal: 5, paddingBottom: 7, flexDirection: 'row', alignItems: 'flex-end', borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.card }, navItem: { flex: 1, minHeight: 54, alignItems: 'center', justifyContent: 'flex-end', gap: 3, borderRadius: 12 }, navItemActive: { backgroundColor: colors.orangeSoft }, navIcon: { color: '#8C8C93', fontSize: 19 }, navLabel: { color: '#8C8C93', fontSize: 8 }, navActive: { color: colors.orange, fontWeight: '800' }, createNav: { flex: 1.18, minHeight: 68, alignItems: 'center', justifyContent: 'flex-end', gap: 4 }, createButton: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: colors.card, backgroundColor: colors.ink }, createPlus: { color: colors.card, fontSize: 24 }, createLabel: { color: colors.ink, fontSize: 8, fontWeight: '700' },
});
