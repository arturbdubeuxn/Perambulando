import { Fredoka_700Bold } from '@expo-google-fonts/fredoka/700Bold';
import { useFonts } from 'expo-font';
import * as Location from 'expo-location';
import { router, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

const colors = {
  background: '#F8F5EE',
  card: '#FFFEFC',
  orange: '#FF5A0A',
  orangeSoft: '#FFF0E7',
  ink: '#002B5C',
  muted: '#667085',
  line: '#E7E0D6',
  danger: '#B42318',
  hero: '#062D5B',
};

const apiBaseUrl = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:5014').replace(/\/$/, '');
const accessTokenStorageKey = 'perambulando.accessToken';

type StorageLike = { getItem: (key: string) => string | null };
type Coordinates = { latitude: number; longitude: number };
type NearbyItem = {
  id: number;
  type: 'Host' | 'Programming';
  name: string;
  imageUrl?: string;
  distanceMeters: number;
  latitude: number;
  longitude: number;
};
type NearbyResponse = { items: NearbyItem[]; skip: number; pageSize: number; hasMore: boolean };
type UserProfile = { name: string };
type ScreenState = 'unauthenticated' | 'idle' | 'locating' | 'loading' | 'ready' | 'empty' | 'denied' | 'services-off' | 'error';

const ranges = [
  { value: 0, label: 'Até 2 km' },
  { value: 1, label: '2 a 5 km' },
  { value: 2, label: '5 a 10 km' },
  { value: 3, label: '10 a 20 km' },
] as const;

function getSessionToken() {
  if (Platform.OS !== 'web') return '';
  return (globalThis as { sessionStorage?: StorageLike }).sessionStorage?.getItem(accessTokenStorageKey) ?? '';
}

async function requestJson<T>(path: string, token: string) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
  });
  const body = (await response.json().catch(() => null)) as T | { detail?: string; title?: string } | null;
  if (!response.ok) {
    const error = body as { detail?: string; title?: string } | null;
    throw new Error(error?.detail || error?.title || 'Não foi possível consultar os locais próximos.');
  }
  return body as T;
}

function formatDistance(meters: number) {
  if (meters < 1000) return `${Math.max(0, Math.round(meters))} m`;
  return `${(meters / 1000).toFixed(1).replace('.', ',')} km`;
}

function Header({ initial, fontsLoaded }: { initial: string; fontsLoaded: boolean }) {
  return (
    <View style={styles.header}>
      <View accessible accessibilityLabel="Perambulando" style={styles.brand}>
        <Text style={[styles.brandName, fontsLoaded && styles.brandNameFredoka]}>Perambulando</Text>
        <Image resizeMode="contain" source={require('../../assets/perambulando-mark.png')} style={styles.brandMark} />
      </View>
      <Pressable accessibilityLabel="Abrir perfil" onPress={() => router.push('/perfil' as Href)} style={styles.avatar}>
        <Text style={styles.avatarText}>{initial}</Text>
      </Pressable>
    </View>
  );
}

function NavItem({ active = false, icon, label, onPress }: { active?: boolean; icon: string; label: string; onPress?: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active, disabled: !active && !onPress }}
      disabled={!active && !onPress}
      onPress={onPress}
      style={({ pressed }) => [styles.navItem, active && styles.navItemActive, pressed && styles.pressed]}
    >
      <Text style={[styles.navIcon, active && styles.navTextActive]}>{icon}</Text>
      <Text style={[styles.navLabel, active && styles.navTextActive]}>{label}</Text>
    </Pressable>
  );
}

export default function NearMeScreen() {
  const { width: viewportWidth } = useWindowDimensions();
  const [fontsLoaded] = useFonts({ Fredoka_700Bold });
  const [token] = useState(getSessionToken);
  const [userInitial, setUserInitial] = useState('U');
  const [state, setState] = useState<ScreenState>(token ? 'idle' : 'unauthenticated');
  const [message, setMessage] = useState(token ? 'Toque em “Usar minha localização” para permitir o acesso.' : 'Entre na sua conta para encontrar lugares próximos.');
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [distanceRange, setDistanceRange] = useState(0);
  const [items, setItems] = useState<NearbyItem[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadNearby = useCallback(async (location: Coordinates, range: number, skip = 0) => {
    const query = new URLSearchParams({
      Latitude: String(location.latitude),
      Longitude: String(location.longitude),
      DistanceRange: String(range),
      Skip: String(skip),
    });
    return requestJson<NearbyResponse>(`/api/Nearby/GetNearMe?${query.toString()}`, token);
  }, [token]);

  const requestLocation = useCallback(async () => {
    if (!token) {
      setState('unauthenticated');
      setMessage('Entre na sua conta para encontrar lugares próximos.');
      return;
    }

    setState('locating');
    setMessage('Solicitando sua localização...');
    try {
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        setState('services-off');
        setMessage('Ative a localização do dispositivo para continuar.');
        return;
      }

      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== Location.PermissionStatus.GRANTED) {
        setState('denied');
        setMessage('A permissão de localização foi recusada. Autorize-a nas configurações do navegador ou dispositivo.');
        return;
      }

      const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const nextCoordinates = {
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
      };
      setCoordinates(nextCoordinates);
      setState('loading');
      setMessage('Calculando o que está perto de você...');
      const response = await loadNearby(nextCoordinates, distanceRange);
      setItems(response.items);
      setHasMore(response.hasMore);
      setState(response.items.length > 0 ? 'ready' : 'empty');
      setMessage(response.items.length > 0 ? '' : 'Não encontramos resultados nesta faixa de distância.');
    } catch (error) {
      setState('error');
      setMessage(error instanceof Error ? error.message : 'Não foi possível obter sua localização.');
    }
  }, [distanceRange, loadNearby, token]);

  useEffect(() => {
    let active = true;
    if (token) {
      requestJson<UserProfile>('/api/User/Profile', token)
        .then((profile) => {
          if (active) setUserInitial(profile.name.trim().charAt(0).toUpperCase() || 'U');
        })
        .catch(() => undefined);
    }
    return () => { active = false; };
  }, [token]);

  const changeRange = async (range: number) => {
    setDistanceRange(range);
    if (!coordinates) return;
    setState('loading');
    setMessage('Atualizando a distância...');
    try {
      const response = await loadNearby(coordinates, range);
      setItems(response.items);
      setHasMore(response.hasMore);
      setState(response.items.length > 0 ? 'ready' : 'empty');
      setMessage(response.items.length > 0 ? '' : 'Não encontramos resultados nesta faixa de distância.');
    } catch (error) {
      setState('error');
      setMessage(error instanceof Error ? error.message : 'Não foi possível atualizar a consulta.');
    }
  };

  const loadMore = async () => {
    if (!coordinates || loadingMore) return;
    setLoadingMore(true);
    try {
      const response = await loadNearby(coordinates, distanceRange, items.length);
      setItems((current) => [...current, ...response.items]);
      setHasMore(response.hasMore);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Não foi possível carregar mais resultados.');
    } finally {
      setLoadingMore(false);
    }
  };

  const openItem = (item: NearbyItem) => {
    if (item.type === 'Programming') {
      router.push({ pathname: '/programacao/[programmingId]', params: { programmingId: String(item.id) } } as Href);
    }
  };

  const showStateCard = state !== 'ready';

  return (
    <View style={styles.viewport}>
      <View style={[styles.appShell, { width: Math.min(viewportWidth, 430) }]}>
        <StatusBar style="dark" />
        <Header fontsLoaded={fontsLoaded} initial={userInitial} />

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator>
          <View style={styles.hero}>
            <Text style={styles.heroEyebrow}>PERTO DE VOCÊ</Text>
            <Text style={styles.heroTitle}>O que está acontecendo por aí?</Text>
            <Text style={styles.heroSubtitle}>Usamos sua localização somente para ordenar eventos e estabelecimentos pela distância.</Text>
            <Pressable accessibilityRole="button" onPress={requestLocation} style={({ pressed }) => [styles.locationButton, pressed && styles.pressed]}>
              <Text style={styles.locationButtonIcon}>⌖</Text>
              <Text style={styles.locationButtonText}>{coordinates ? 'Atualizar minha localização' : 'Usar minha localização'}</Text>
            </Pressable>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Distância</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.rangeScroller}>
              <View style={styles.rangeList}>
                {ranges.map((range) => (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ selected: distanceRange === range.value }}
                    key={range.value}
                    onPress={() => void changeRange(range.value)}
                    style={[styles.rangeButton, distanceRange === range.value && styles.rangeButtonActive]}
                  >
                    <Text style={[styles.rangeText, distanceRange === range.value && styles.rangeTextActive]}>{range.label}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mais próximos primeiro</Text>
            <Text style={styles.sectionSubtitle}>Resultados registrados no Perambulando e ordenados pela distância real.</Text>

            {showStateCard ? (
              <View accessibilityRole={state === 'error' ? 'alert' : undefined} style={[styles.stateCard, state === 'error' && styles.errorCard]}>
                {state === 'locating' || state === 'loading' ? <ActivityIndicator color={colors.orange} /> : <Text style={styles.stateIcon}>{state === 'unauthenticated' ? '♧' : '⌖'}</Text>}
                <Text style={[styles.stateTitle, state === 'error' && styles.errorText]}>
                  {state === 'unauthenticated' ? 'Entre na sua conta' : state === 'idle' ? 'Encontre o que está por perto' : state === 'denied' ? 'Permissão necessária' : state === 'services-off' ? 'Localização desativada' : state === 'empty' ? 'Nada por aqui ainda' : state === 'error' ? 'Localização indisponível' : 'Localizando você'}
                </Text>
                <Text style={styles.stateMessage}>{message}</Text>
                {state === 'unauthenticated' ? <Pressable onPress={() => router.push('/cadastro_host' as Href)} style={styles.stateButton}><Text style={styles.stateButtonText}>Acessar cadastro</Text></Pressable> : null}
                {state === 'denied' || state === 'services-off' || state === 'error' || state === 'empty' ? <Pressable onPress={requestLocation} style={styles.outlineButton}><Text style={styles.outlineButtonText}>Tentar novamente</Text></Pressable> : null}
              </View>
            ) : null}

            {state === 'ready' ? (
              <View style={styles.resultList}>
                {items.map((item) => (
                  <Pressable
                    accessibilityRole={item.type === 'Programming' ? 'button' : undefined}
                    disabled={item.type !== 'Programming'}
                    key={`${item.type}-${item.id}`}
                    onPress={() => openItem(item)}
                    style={({ pressed }) => [styles.resultCard, pressed && styles.pressed]}
                  >
                    {item.imageUrl ? <Image resizeMode="cover" source={{ uri: item.imageUrl }} style={styles.resultImage} /> : <View style={styles.resultFallback}><Text style={styles.resultFallbackText}>{item.name.charAt(0).toUpperCase()}</Text></View>}
                    <View style={styles.resultCopy}>
                      <Text style={styles.resultType}>{item.type === 'Programming' ? 'PROGRAMAÇÃO' : 'ESTABELECIMENTO'}</Text>
                      <Text numberOfLines={2} style={styles.resultName}>{item.name}</Text>
                      <Text style={styles.resultDistance}>⌖ {formatDistance(item.distanceMeters)} de você</Text>
                    </View>
                    {item.type === 'Programming' ? <Text style={styles.resultArrow}>›</Text> : null}
                  </Pressable>
                ))}
                {hasMore ? <Pressable disabled={loadingMore} onPress={loadMore} style={styles.moreButton}>{loadingMore ? <ActivityIndicator color={colors.ink} /> : <Text style={styles.moreButtonText}>Carregar mais</Text>}</Pressable> : null}
                {message ? <Text accessibilityRole="alert" style={styles.inlineError}>{message}</Text> : null}
              </View>
            ) : null}
          </View>
        </ScrollView>

        <View style={styles.bottomNav}>
          <NavItem icon="⌾" label="Explorar" onPress={() => router.push('/explorar' as Href)} />
          <NavItem icon="⌕" label="Buscar" onPress={() => router.push('/explorar' as Href)} />
          <NavItem active icon="⌖" label="Perto de você" />
          <NavItem icon="♡" label="Favoritos" />
          <NavItem icon="♙" label="Perfil" onPress={() => router.push('/perfil' as Href)} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  viewport: { flex: 1, alignItems: 'center', backgroundColor: '#E6DED2' },
  appShell: { flex: 1, maxWidth: 430, minWidth: 0, overflow: 'hidden', backgroundColor: colors.background, borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#DDD8D2' },
  header: { minHeight: 70, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.line },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  brandName: { color: colors.ink, fontSize: 18, fontWeight: '700', letterSpacing: -0.5 },
  brandNameFredoka: { fontFamily: 'Fredoka_700Bold', fontWeight: 'normal' },
  brandMark: { width: 40, height: 40 },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.ink },
  avatarText: { color: colors.card, fontSize: 14, fontWeight: '800' },
  scrollContent: { paddingBottom: 36 },
  hero: { paddingHorizontal: 20, paddingTop: 28, paddingBottom: 24, backgroundColor: colors.hero },
  heroEyebrow: { color: '#A9D7C2', fontSize: 9, fontWeight: '800', letterSpacing: 1.6 },
  heroTitle: { maxWidth: 360, marginTop: 10, color: colors.card, fontSize: 32, lineHeight: 37, letterSpacing: -1.2 },
  heroSubtitle: { maxWidth: 350, marginTop: 10, color: '#CDD8E5', fontSize: 12, lineHeight: 18 },
  locationButton: { minHeight: 48, marginTop: 20, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, borderRadius: 14, backgroundColor: colors.orange },
  locationButtonIcon: { color: colors.card, fontSize: 19, fontWeight: '800' },
  locationButtonText: { color: colors.card, fontSize: 12, fontWeight: '800' },
  section: { paddingHorizontal: 20, paddingVertical: 22, borderBottomWidth: 1, borderBottomColor: colors.line },
  sectionTitle: { color: colors.ink, fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  sectionSubtitle: { marginTop: 5, color: colors.muted, fontSize: 10, lineHeight: 15 },
  rangeScroller: { marginHorizontal: -20, marginTop: 14 },
  rangeList: { paddingHorizontal: 20, flexDirection: 'row', gap: 8 },
  rangeButton: { minHeight: 38, paddingHorizontal: 13, alignItems: 'center', justifyContent: 'center', borderRadius: 19, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card },
  rangeButtonActive: { borderColor: colors.orange, backgroundColor: colors.orangeSoft },
  rangeText: { color: colors.muted, fontSize: 10, fontWeight: '700' },
  rangeTextActive: { color: colors.orange },
  stateCard: { minHeight: 190, marginTop: 16, padding: 20, alignItems: 'center', justifyContent: 'center', gap: 9, borderRadius: 20, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card },
  errorCard: { borderColor: '#FFB4AA', backgroundColor: '#FFF3F1' },
  stateIcon: { color: colors.orange, fontSize: 28 },
  stateTitle: { color: colors.ink, fontSize: 14, fontWeight: '800', textAlign: 'center' },
  errorText: { color: colors.danger },
  stateMessage: { maxWidth: 300, color: colors.muted, fontSize: 11, lineHeight: 17, textAlign: 'center' },
  stateButton: { minWidth: 190, minHeight: 44, marginTop: 4, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: colors.ink },
  stateButtonText: { color: colors.card, fontSize: 11, fontWeight: '800' },
  outlineButton: { minWidth: 155, minHeight: 42, marginTop: 4, alignItems: 'center', justifyContent: 'center', borderRadius: 12, borderWidth: 1, borderColor: colors.ink },
  outlineButtonText: { color: colors.ink, fontSize: 10, fontWeight: '800' },
  resultList: { marginTop: 16, gap: 10 },
  resultCard: { minHeight: 88, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 11, borderRadius: 18, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card },
  resultImage: { width: 68, height: 68, borderRadius: 14 },
  resultFallback: { width: 68, height: 68, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: colors.ink },
  resultFallbackText: { color: colors.card, fontSize: 22, fontWeight: '800' },
  resultCopy: { flex: 1 },
  resultType: { color: colors.orange, fontSize: 8, fontWeight: '800', letterSpacing: 0.8 },
  resultName: { marginTop: 4, color: colors.ink, fontSize: 13, lineHeight: 17, fontWeight: '800' },
  resultDistance: { marginTop: 6, color: colors.muted, fontSize: 9 },
  resultArrow: { color: colors.orange, fontSize: 25 },
  moreButton: { minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 13, borderWidth: 1, borderColor: colors.ink },
  moreButtonText: { color: colors.ink, fontSize: 11, fontWeight: '800' },
  inlineError: { color: colors.danger, fontSize: 10, lineHeight: 15, textAlign: 'center' },
  bottomNav: { minHeight: 72, paddingHorizontal: 6, paddingBottom: 5, flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.card },
  navItem: { flex: 1, minHeight: 56, alignItems: 'center', justifyContent: 'center', gap: 4, borderRadius: 12 },
  navItemActive: { backgroundColor: colors.orangeSoft },
  navIcon: { color: '#8C8C93', fontSize: 18 },
  navLabel: { color: '#8C8C93', fontSize: 8, textAlign: 'center' },
  navTextActive: { color: colors.orange, fontWeight: '800' },
  pressed: { opacity: 0.7 },
});
