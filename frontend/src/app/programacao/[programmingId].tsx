import { Fredoka_700Bold } from '@expo-google-fonts/fredoka/700Bold';
import { useFonts } from 'expo-font';
import { router, type Href, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { createElement, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Share,
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
  success: '#257A48',
  danger: '#B42318',
};

const apiBaseUrl = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:5014').replace(/\/$/, '');
const accessTokenStorageKey = 'perambulando.accessToken';

type StorageLike = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
};

type Category = { id: number; name: string; isActive: boolean };
type Address = {
  id: number;
  city: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  cep: string;
};

type ProgrammingDetail = {
  id: number;
  hostId: number;
  hostName: string;
  hostLogoUrl: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  isFree: boolean;
  address: Address;
  imageUrl: string;
  ticketUrl: string;
  instagranUrl: string;
  minPrice: number;
  maxPrice: number;
  categories: Category[];
};

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
type FavoriteResponse = { programmingId: number };
type GeoResult = { lat: string; lon: string; display_name: string };
type Coordinates = { latitude: number; longitude: number; displayName: string };
type LoadState = 'loading' | 'ready' | 'error';
type NearbyState = 'loading' | 'ready' | 'empty' | 'error';

function getStorage() {
  if (Platform.OS !== 'web') return null;
  return (globalThis as { sessionStorage?: StorageLike }).sessionStorage ?? null;
}

function getAccessToken() {
  return getStorage()?.getItem(accessTokenStorageKey) ?? '';
}

async function requestJson<T>(path: string, options: RequestInit = {}) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });
  const body = (await response.json().catch(() => null)) as T | { detail?: string; title?: string } | null;
  if (!response.ok) {
    const error = body as { detail?: string; title?: string } | null;
    throw new Error(error?.detail || error?.title || 'Não foi possível carregar as informações.');
  }
  return body as T;
}

function createEventId() {
  return globalThis.crypto?.randomUUID?.() ?? `00000000-0000-4000-8000-${Date.now().toString().padStart(12, '0').slice(-12)}`;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Data a confirmar';
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function formatPrice(programming: ProgrammingDetail) {
  if (programming.isFree) return 'Grátis';
  const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  if (programming.minPrice === programming.maxPrice) return currency.format(programming.minPrice);
  return `${currency.format(programming.minPrice)} a ${currency.format(programming.maxPrice)}`;
}

function formatDistance(meters: number) {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1).replace('.', ',')} km`;
}

function fullAddress(address: Address) {
  return [
    [address.street, address.number].filter(Boolean).join(', '),
    address.complement,
    address.neighborhood,
    address.city,
    address.cep,
    'Brasil',
  ].filter(Boolean).join(', ');
}

async function geocodeAddress(address: Address) {
  const cep = address.cep.replace(/\D/g, '');
  const streetAndNumber = [address.street, address.number].filter(Boolean).join(', ');
  const queries = [
    [streetAndNumber, address.city, cep, 'Brasil'].filter(Boolean).join(', '),
    [cep, 'Brasil'].filter(Boolean).join(', '),
    [streetAndNumber, address.city, 'Brasil'].filter(Boolean).join(', '),
    [address.street, address.city, 'Brasil'].filter(Boolean).join(', '),
  ].filter((query, index, all) => query && all.indexOf(query) === index);
  const cacheKey = `perambulando.geocode.v2.${address.id}.${cep}`;
  const storage = getStorage();
  const cached = storage?.getItem(cacheKey);
  if (cached) {
    try {
      return JSON.parse(cached) as Coordinates;
    } catch {
      storage?.setItem(cacheKey, '');
    }
  }

  for (let index = 0; index < queries.length; index += 1) {
    if (index > 0) {
      await new Promise((resolve) => setTimeout(resolve, 1100));
    }
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=br&q=${encodeURIComponent(queries[index])}`;
    const response = await fetch(url, { headers: { Accept: 'application/json', 'Accept-Language': 'pt-BR' } });
    if (!response.ok) {
      continue;
    }
    const results = (await response.json()) as GeoResult[];
    const first = results[0];
    if (!first) {
      continue;
    }
    const coordinates = {
      latitude: Number(first.lat),
      longitude: Number(first.lon),
      displayName: first.display_name,
    };
    if (!Number.isFinite(coordinates.latitude) || !Number.isFinite(coordinates.longitude)) {
      continue;
    }
    storage?.setItem(cacheKey, JSON.stringify(coordinates));
    return coordinates;
  }

  throw new Error('O mapa não encontrou uma coordenada para o endereço ou CEP cadastrado.');
}

function MapView({ coordinates, address }: { coordinates: Coordinates; address: string }) {
  const deltaLongitude = 0.008;
  const deltaLatitude = 0.005;
  const bbox = [
    coordinates.longitude - deltaLongitude,
    coordinates.latitude - deltaLatitude,
    coordinates.longitude + deltaLongitude,
    coordinates.latitude + deltaLatitude,
  ].join(',');
  const source = `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${coordinates.latitude}%2C${coordinates.longitude}`;

  if (Platform.OS !== 'web') {
    return (
      <Pressable
        accessibilityRole="link"
        onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`)}
        style={styles.nativeMapFallback}
      >
        <Text style={styles.nativeMapPin}>⌖</Text>
        <Text style={styles.nativeMapTitle}>Abrir localização no mapa</Text>
      </Pressable>
    );
  }

  return createElement('iframe', {
    src: source,
    title: `Mapa de ${address}`,
    loading: 'lazy',
    style: { width: '100%', height: '100%', border: 0 },
  });
}

function BottomNav() {
  const item = (icon: string, label: string, onPress?: () => void) => (
    <Pressable accessibilityRole="button" disabled={!onPress} onPress={onPress} style={styles.navItem}>
      <Text style={styles.navIcon}>{icon}</Text>
      <Text style={styles.navLabel}>{label}</Text>
    </Pressable>
  );
  return (
    <View style={styles.bottomNav}>
      {item('⌾', 'Explorar', () => router.push('/explorar' as Href))}
      {item('⌕', 'Buscar', () => router.push('/explorar' as Href))}
      {item('⌖', 'Perto de você', () => router.push('/perto_de_voce' as Href))}
      {item('♡', 'Favoritos', () => router.push('/favoritos' as Href))}
      {item('♙', 'Perfil', () => router.push('/perfil' as Href))}
    </View>
  );
}

export default function ProgrammingDetailsScreen() {
  const params = useLocalSearchParams<{ programmingId?: string | string[]; origin?: string | string[] }>();
  const programmingId = Number(Array.isArray(params.programmingId) ? params.programmingId[0] : params.programmingId);
  const origin = Array.isArray(params.origin) ? params.origin[0] : params.origin;
  const cameFromNearbyMap = origin === 'nearby-map';
  const hasValidProgrammingId = Number.isInteger(programmingId) && programmingId > 0;
  const { width: viewportWidth } = useWindowDimensions();
  const [fontsLoaded] = useFonts({ Fredoka_700Bold });
  const [token] = useState(getAccessToken);
  const [state, setState] = useState<LoadState>(hasValidProgrammingId ? 'loading' : 'error');
  const [message, setMessage] = useState(
    hasValidProgrammingId ? 'Carregando a programação...' : 'A programação informada é inválida.',
  );
  const [programming, setProgramming] = useState<ProgrammingDetail | null>(null);
  const [nearby, setNearby] = useState<{ item: NearbyItem; label: string }[]>([]);
  const [nearbyState, setNearbyState] = useState<NearbyState>('loading');
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [mapState, setMapState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [mapMessage, setMapMessage] = useState('Localizando o endereço cadastrado...');
  const [favorite, setFavorite] = useState(false);
  const [favoriteBusy, setFavoriteBusy] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [heroImageFailed, setHeroImageFailed] = useState(false);

  useEffect(() => {
    let active = true;
    if (!hasValidProgrammingId) {
      return () => { active = false; };
    }

    requestJson<ProgrammingDetail>(`/api/Programming/Details/${programmingId}`)
      .then((details) => {
        if (!active) return;
        setProgramming(details);
        setState('ready');
        setMessage('');
        void requestJson(`/api/Programming/${programmingId}/Interactions`, {
          method: 'POST',
          body: JSON.stringify({ eventId: createEventId(), type: 0 }),
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        }).catch(() => undefined);
      })
      .catch((error) => {
        if (!active) return;
        setState('error');
        setMessage(error instanceof Error ? error.message : 'Não foi possível carregar a programação.');
      });

    if (token) {
      requestJson<FavoriteResponse[]>('/api/Favorite/GetAllByUserId', { headers: { Authorization: `Bearer ${token}` } })
        .then((favorites) => { if (active) setFavorite(favorites.some((item) => item.programmingId === programmingId)); })
        .catch(() => undefined);
    }

    return () => { active = false; };
  }, [hasValidProgrammingId, programmingId, token]);

  useEffect(() => {
    let active = true;
    if (!programming) return () => { active = false; };
    geocodeAddress(programming.address)
      .then((result) => {
        if (!active) return;
        setCoordinates(result);
        setMapState('ready');
        setMapMessage('');
      })
      .catch((error) => {
        if (!active) return;
        setMapState('error');
        setMapMessage(error instanceof Error ? error.message : 'Não foi possível carregar o mapa.');
        setNearbyState('error');
      });
    return () => { active = false; };
  }, [programming]);

  useEffect(() => {
    let active = true;
    if (!hasValidProgrammingId || !coordinates) {
      return () => { active = false; };
    }

    const loadNearby = async () => {
      const selected: NearbyItem[] = [];
      let skip = 0;
      let hasMore = true;
      while (selected.length < 5 && hasMore) {
        const query = new URLSearchParams({
          Latitude: String(coordinates.latitude),
          Longitude: String(coordinates.longitude),
          MaxDistanceKm: '20',
          Skip: String(skip),
        });
        const response = await requestJson<NearbyResponse>(`/api/Nearby/GetNearMe?${query.toString()}`);
        response.items.forEach((item) => {
          if (selected.length < 5 && !(item.type === 'Programming' && item.id === programmingId)) selected.push(item);
        });
        skip += response.items.length;
        hasMore = response.hasMore && response.items.length > 0;
      }
      const categoryEntries = await Promise.all(selected.map(async (item) => {
        if (item.type === 'Host') return { item, label: 'Estabelecimento' };
        const details = await requestJson<ProgrammingDetail>(`/api/Programming/Details/${item.id}`).catch(() => null);
        return { item, label: details?.categories[0]?.name ?? 'Programação' };
      }));
      return categoryEntries;
    };

    loadNearby()
      .then((items) => {
        if (!active) return;
        setNearby(items);
        setNearbyState(items.length > 0 ? 'ready' : 'empty');
      })
      .catch(() => {
        if (active) setNearbyState('error');
      });
    return () => { active = false; };
  }, [coordinates, hasValidProgrammingId, programmingId]);

  const address = useMemo(() => programming ? fullAddress(programming.address) : '', [programming]);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

  const toggleFavorite = async () => {
    if (!token || !programming) {
      setFeedback('Entre na sua conta para favoritar esta programação.');
      return;
    }
    setFavoriteBusy(true);
    setFeedback('');
    try {
      await requestJson(`/api/Favorite/${programming.id}/${favorite ? 'Delete' : 'Create'}`, {
        method: favorite ? 'PATCH' : 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      setFavorite((current) => !current);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Não foi possível atualizar o favorito.');
    } finally {
      setFavoriteBusy(false);
    }
  };

  const shareProgramming = async () => {
    if (!programming) return;
    const url = Platform.OS === 'web' ? globalThis.location?.href ?? '' : '';
    await Share.share({ message: `${programming.name}\n${url}`, url, title: programming.name }).catch(() => undefined);
  };

  const openTicket = async () => {
    if (!programming?.ticketUrl) return;
    void requestJson(`/api/Programming/${programming.id}/Interactions`, {
      method: 'POST',
      body: JSON.stringify({ eventId: createEventId(), type: 2 }),
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    }).catch(() => undefined);
    await Linking.openURL(programming.ticketUrl);
  };

  const openNearby = (item: NearbyItem) => {
    if (item.type === 'Host') {
      router.push('/comercio' as Href);
      return;
    }
    void requestJson(`/api/Programming/${programmingId}/Interactions`, {
      method: 'POST',
      body: JSON.stringify({ eventId: createEventId(), type: 3 }),
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    }).catch(() => undefined);
    router.push({ pathname: '/programacao/[programmingId]', params: { programmingId: String(item.id) } } as Href);
  };

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(cameFromNearbyMap ? '/perto_de_voce' as Href : '/explorar' as Href);
  };

  return (
    <View style={styles.viewport}>
      <View style={[styles.appShell, { width: Math.min(viewportWidth, 430) }]}>
        <StatusBar style="dark" />
        <View style={styles.header}>
          <View style={styles.brand}>
            <Text style={[styles.brandName, fontsLoaded && styles.brandNameFredoka]}>Perambulando</Text>
            <Image resizeMode="contain" source={require('../../../assets/perambulando-mark.png')} style={styles.brandMark} />
          </View>
          <Pressable accessibilityLabel="Abrir perfil" onPress={() => router.push('/perfil' as Href)} style={styles.avatar}>
            <Text style={styles.avatarText}>U</Text>
          </Pressable>
        </View>

        {state === 'loading' ? (
          <View style={styles.fullState}><ActivityIndicator color={colors.orange} /><Text style={styles.stateText}>{message}</Text></View>
        ) : null}
        {state === 'error' ? (
          <View style={styles.fullState}><Text style={styles.errorTitle}>Programação indisponível</Text><Text style={styles.stateText}>{message}</Text><Pressable onPress={goBack} style={styles.outlineButton}><Text style={styles.outlineButtonText}>{cameFromNearbyMap ? 'Voltar ao mapa' : 'Voltar'}</Text></Pressable></View>
        ) : null}

        {state === 'ready' && programming ? (
          <>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator>
              <View style={styles.hero}>
                {programming.imageUrl && !heroImageFailed ? (
                  <Image onError={() => setHeroImageFailed(true)} resizeMode="cover" source={{ uri: programming.imageUrl }} style={styles.heroImage} />
                ) : (
                  <View style={styles.heroFallback}><Image resizeMode="contain" source={require('../../../assets/perambulando-mark.png')} style={styles.heroFallbackMark} /></View>
                )}
                <View style={styles.heroShade} />
                <View style={styles.heroActions}>
                  <Pressable accessibilityLabel={cameFromNearbyMap ? 'Voltar ao ponto selecionado no mapa' : 'Voltar'} onPress={goBack} style={styles.roundAction}><Text style={styles.roundActionText}>‹</Text></Pressable>
                  <View style={styles.heroActionsRight}>
                    <Pressable accessibilityLabel="Favoritar" disabled={favoriteBusy} onPress={toggleFavorite} style={styles.roundAction}><Text style={[styles.roundIcon, favorite && styles.favoriteActive]}>{favorite ? '♥' : '♡'}</Text></Pressable>
                    <Pressable accessibilityLabel="Compartilhar" onPress={shareProgramming} style={styles.roundAction}><Text style={styles.roundIcon}>↗</Text></Pressable>
                  </View>
                </View>
                <View style={styles.heroCopy}>
                  <View style={styles.heroCategory}><Text style={styles.heroCategoryText}>{programming.categories[0]?.name ?? 'Programação'}</Text></View>
                  <Text style={styles.heroTitle}>{programming.name}</Text>
                  <Text style={styles.heroAddress}>⌖ {programming.address.neighborhood || programming.address.street}, {programming.address.city}</Text>
                </View>
              </View>

              {feedback ? <Text accessibilityRole="alert" style={styles.feedback}>{feedback}</Text> : null}

              <View style={styles.factsCard}>
                <View style={styles.factRow}><View style={styles.factIcon}><Text style={styles.factIconText}>▣</Text></View><View style={styles.factCopy}><Text style={styles.factTitle}>{formatDate(programming.startDate)}</Text><Text style={styles.factSubtitle}>Término: {formatDate(programming.endDate)}</Text></View></View>
                <View style={styles.factRow}><View style={styles.factIcon}><Text style={styles.factIconText}>⌖</Text></View><View style={styles.factCopy}><Text style={styles.factTitle}>{programming.address.street}, {programming.address.number}</Text><Text style={styles.factSubtitle}>{programming.address.neighborhood} · {programming.address.city}</Text></View></View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Sobre o evento</Text>
                <Text style={styles.description}>{programming.description || 'O host ainda não adicionou uma descrição para esta programação.'}</Text>
                <View style={styles.categoryList}>{programming.categories.map((category) => <View key={category.id} style={styles.categoryChip}><Text style={styles.categoryText}>{category.name}</Text></View>)}</View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Onde vai ser</Text>
                <Text style={styles.sectionSubtitle}>Localização real baseada no endereço cadastrado pelo host.</Text>
                <View style={styles.mapFrame}>
                  {mapState === 'loading' ? <View style={styles.mapState}><ActivityIndicator color={colors.orange} /><Text style={styles.stateText}>{mapMessage}</Text></View> : null}
                  {mapState === 'ready' && coordinates ? <MapView address={address} coordinates={coordinates} /> : null}
                  {mapState === 'error' ? <View style={styles.mapState}><Text style={styles.errorTitle}>Mapa indisponível</Text><Text style={styles.stateText}>{mapMessage}</Text></View> : null}
                </View>
                <Text style={styles.addressText}>{address}</Text>
                {coordinates ? <Text style={styles.mapResolvedText}>{coordinates.displayName}</Text> : null}
                <Pressable accessibilityRole="link" onPress={() => Linking.openURL(mapsUrl)} style={styles.mapLink}><Text style={styles.mapLinkText}>Abrir no Google Maps ↗</Text></Pressable>
                <Text style={styles.attribution}>Mapa © colaboradores do OpenStreetMap</Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Locais próximos</Text>
                <Text style={styles.sectionSubtitle}>As 5 programações ou estabelecimentos mais próximos, ordenados pela distância real até este evento.</Text>
                {nearbyState === 'loading' ? <View style={styles.nearbyState}><ActivityIndicator color={colors.orange} /><Text style={styles.stateText}>Calculando locais próximos...</Text></View> : null}
                {nearbyState === 'empty' ? <View style={styles.nearbyState}><Text style={styles.nearbyTitle}>Nenhum outro local</Text><Text style={styles.stateText}>Ainda não existem programações ou estabelecimentos próximos cadastrados.</Text></View> : null}
                {nearbyState === 'error' ? <View style={styles.nearbyState}><Text style={styles.errorTitle}>Proximidade indisponível</Text><Text style={styles.stateText}>Não foi possível calcular os locais próximos agora.</Text></View> : null}
                {nearbyState === 'ready' ? (
                  <View style={styles.nearbyList}>
                    {nearby.map(({ item, label }) => (
                      <Pressable key={`${item.type}-${item.id}`} onPress={() => openNearby(item)} style={({ pressed }) => [styles.nearbyCard, pressed && styles.pressed]}>
                        {item.imageUrl ? <Image resizeMode="cover" source={{ uri: item.imageUrl }} style={styles.nearbyImage} /> : <View style={styles.nearbyImageFallback}><Text style={styles.nearbyImageText}>{item.name.charAt(0).toUpperCase()}</Text></View>}
                        <View style={styles.nearbyCopy}><Text numberOfLines={1} style={styles.nearbyName}>{item.name}</Text><Text style={styles.nearbyCategory}>{label}</Text><Text style={styles.nearbyDistance}>⌖ {formatDistance(item.distanceMeters)}</Text></View>
                        <Text style={styles.nearbyArrow}>›</Text>
                      </Pressable>
                    ))}
                  </View>
                ) : null}
              </View>

              <View style={[styles.section, styles.hostSection]}>
                <Text style={styles.hostEyebrow}>HOST DO EVENTO</Text>
                <View style={styles.hostCard}>
                  {programming.hostLogoUrl ? <Image resizeMode="cover" source={{ uri: programming.hostLogoUrl }} style={styles.hostLogo} /> : <View style={styles.hostLogoFallback}><Text style={styles.hostLogoText}>{programming.hostName.charAt(0).toUpperCase()}</Text></View>}
                  <View style={styles.hostCopy}><Text style={styles.hostName}>{programming.hostName}</Text><Text style={styles.hostDescription}>Responsável por esta programação</Text></View>
                </View>
              </View>
            </ScrollView>

            <View style={styles.purchaseBar}>
              <View><Text style={styles.purchaseLabel}>Valor</Text><Text style={styles.purchasePrice}>{formatPrice(programming)}</Text></View>
              <Pressable accessibilityRole="link" disabled={!programming.ticketUrl} onPress={openTicket} style={[styles.ticketButton, !programming.ticketUrl && styles.ticketButtonDisabled]}><Text style={styles.ticketButtonText}>{programming.ticketUrl ? 'Comprar ingressos' : 'Sem link de ingresso'}</Text></Pressable>
            </View>
            <BottomNav />
          </>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  viewport: { flex: 1, alignItems: 'center', backgroundColor: '#E6DED2' },
  appShell: { flex: 1, maxWidth: 430, minWidth: 0, position: 'relative', overflow: 'hidden', backgroundColor: colors.background, borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#DDD8D2' },
  header: { minHeight: 64, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.line },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  brandName: { color: colors.ink, fontSize: 17, fontWeight: '700' },
  brandNameFredoka: { fontFamily: 'Fredoka_700Bold', fontWeight: 'normal' },
  brandMark: { width: 38, height: 38 },
  avatar: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.ink },
  avatarText: { color: colors.card, fontSize: 13, fontWeight: '800' },
  fullState: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center', gap: 12 },
  stateText: { color: colors.muted, fontSize: 11, lineHeight: 16, textAlign: 'center' },
  errorTitle: { color: colors.danger, fontSize: 13, fontWeight: '800', textAlign: 'center' },
  outlineButton: { minWidth: 120, minHeight: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 12, borderWidth: 1, borderColor: colors.ink },
  outlineButtonText: { color: colors.ink, fontSize: 11, fontWeight: '800' },
  scrollContent: { paddingBottom: 165 },
  hero: { height: 330, position: 'relative', backgroundColor: '#DCE7E9' },
  heroImage: { width: '100%', height: '100%' },
  heroFallback: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#DDEBEA' },
  heroFallbackMark: { width: 95, height: 95, opacity: 0.8 },
  heroShade: { position: 'absolute', inset: 0, backgroundColor: 'rgba(0, 28, 55, 0.28)' },
  heroActions: { position: 'absolute', top: 16, left: 14, right: 14, flexDirection: 'row', justifyContent: 'space-between' },
  heroActionsRight: { flexDirection: 'row', gap: 9 },
  roundAction: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card, ...Platform.select({ web: { boxShadow: '0 4px 12px rgba(0,43,92,0.18)' }, default: { elevation: 3 } }) },
  roundActionText: { marginTop: -3, color: colors.ink, fontSize: 29, lineHeight: 31 },
  roundIcon: { color: colors.ink, fontSize: 19, fontWeight: '800' },
  favoriteActive: { color: colors.orange },
  heroCopy: { position: 'absolute', left: 17, right: 17, bottom: 20 },
  heroCategory: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8, backgroundColor: '#D8FF54' },
  heroCategoryText: { color: colors.ink, fontSize: 8, fontWeight: '800' },
  heroTitle: { marginTop: 12, color: colors.card, fontSize: 30, lineHeight: 34, fontWeight: '500', letterSpacing: -1 },
  heroAddress: { marginTop: 8, color: colors.card, fontSize: 11, fontWeight: '700' },
  feedback: { paddingHorizontal: 16, paddingTop: 10, color: colors.danger, fontSize: 10 },
  factsCard: { margin: 14, padding: 14, gap: 14, borderRadius: 18, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card },
  factRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  factIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFE8E4' },
  factIconText: { color: colors.orange, fontSize: 17, fontWeight: '800' },
  factCopy: { flex: 1 },
  factTitle: { color: colors.ink, fontSize: 11, lineHeight: 16, fontWeight: '800' },
  factSubtitle: { marginTop: 2, color: colors.muted, fontSize: 9, lineHeight: 13 },
  section: { marginHorizontal: 14, paddingVertical: 23, borderTopWidth: 1, borderTopColor: colors.line },
  sectionTitle: { color: colors.ink, fontSize: 20, fontWeight: '700', letterSpacing: -0.5 },
  sectionSubtitle: { marginTop: 5, color: colors.muted, fontSize: 10, lineHeight: 15 },
  description: { marginTop: 12, color: '#4E5D70', fontSize: 12, lineHeight: 20 },
  categoryList: { marginTop: 14, flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  categoryChip: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 10, backgroundColor: colors.orangeSoft },
  categoryText: { color: colors.orange, fontSize: 8, fontWeight: '800' },
  mapFrame: { height: 225, marginTop: 14, overflow: 'hidden', borderRadius: 17, borderWidth: 1, borderColor: colors.line, backgroundColor: '#E8EEE9' },
  mapState: { flex: 1, padding: 18, alignItems: 'center', justifyContent: 'center', gap: 9 },
  nativeMapFallback: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  nativeMapPin: { color: colors.orange, fontSize: 28 },
  nativeMapTitle: { color: colors.ink, fontSize: 12, fontWeight: '800' },
  addressText: { marginTop: 11, color: colors.ink, fontSize: 11, lineHeight: 16, fontWeight: '700' },
  mapResolvedText: { marginTop: 3, color: colors.muted, fontSize: 9, lineHeight: 13 },
  mapLink: { marginTop: 10, minHeight: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 12, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card },
  mapLinkText: { color: colors.orange, fontSize: 10, fontWeight: '800' },
  attribution: { marginTop: 7, color: colors.muted, fontSize: 8, textAlign: 'right' },
  nearbyState: { minHeight: 110, marginTop: 14, padding: 16, alignItems: 'center', justifyContent: 'center', gap: 7, borderRadius: 15, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card },
  nearbyTitle: { color: colors.ink, fontSize: 12, fontWeight: '800' },
  nearbyList: { marginTop: 14, gap: 9 },
  nearbyCard: { minHeight: 72, padding: 9, flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 15, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card },
  nearbyImage: { width: 54, height: 54, borderRadius: 12 },
  nearbyImageFallback: { width: 54, height: 54, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.ink },
  nearbyImageText: { color: colors.card, fontSize: 18, fontWeight: '800' },
  nearbyCopy: { flex: 1 },
  nearbyName: { color: colors.ink, fontSize: 12, fontWeight: '800' },
  nearbyCategory: { marginTop: 3, color: colors.orange, fontSize: 8, fontWeight: '700' },
  nearbyDistance: { marginTop: 4, color: colors.muted, fontSize: 9 },
  nearbyArrow: { color: colors.orange, fontSize: 23 },
  hostSection: { paddingBottom: 30 },
  hostEyebrow: { color: colors.orange, fontSize: 9, fontWeight: '800', letterSpacing: 1.3 },
  hostCard: { marginTop: 12, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 17, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card },
  hostLogo: { width: 48, height: 48, borderRadius: 13 },
  hostLogoFallback: { width: 48, height: 48, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: '#7450E6' },
  hostLogoText: { color: colors.card, fontSize: 17, fontWeight: '800' },
  hostCopy: { flex: 1 },
  hostName: { color: colors.ink, fontSize: 13, fontWeight: '800' },
  hostDescription: { marginTop: 3, color: colors.muted, fontSize: 9 },
  purchaseBar: { position: 'absolute', left: 0, right: 0, bottom: 70, minHeight: 66, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.card },
  purchaseLabel: { color: colors.muted, fontSize: 8 },
  purchasePrice: { marginTop: 2, color: colors.ink, fontSize: 16, fontWeight: '700' },
  ticketButton: { flex: 1, maxWidth: 190, minHeight: 44, paddingHorizontal: 15, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: colors.orange },
  ticketButtonDisabled: { backgroundColor: '#B9C0C8' },
  ticketButtonText: { color: colors.card, fontSize: 11, fontWeight: '800', textAlign: 'center' },
  bottomNav: { position: 'absolute', left: 0, right: 0, bottom: 0, minHeight: 70, paddingHorizontal: 5, paddingBottom: 4, flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.card },
  navItem: { flex: 1, minHeight: 55, alignItems: 'center', justifyContent: 'center', gap: 3 },
  navIcon: { color: '#8C8C93', fontSize: 17 },
  navLabel: { color: '#8C8C93', fontSize: 7, textAlign: 'center' },
  pressed: { opacity: 0.72 },
});
