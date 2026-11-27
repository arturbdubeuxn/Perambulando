import RoadmapButton from '../RoadmapButton';
import { Fredoka_700Bold } from '@expo-google-fonts/fredoka/700Bold';
import { useFonts } from 'expo-font';
import * as Location from 'expo-location';
import { router, type Href, useFocusEffect } from 'expo-router';
import { getFavoriteKeys, storeFavoriteKeys, setLocalFavorite, subscribeToFavorites } from '../favorites';
import { StatusBar } from 'expo-status-bar';
import { type ComponentRef, useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
  hero: '#062D5B',
};

const apiBaseUrl = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:5014').replace(/\/$/, '');
const accessTokenStorageKey = 'perambulando.accessToken';


type Category = {
  id: number;
  name: string;
  isActive: boolean;
};

type Address = {
  id: number;
  city: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  cep: string;
};

type Programming = {
  id: number;
  name: string;
  isActive: boolean;
  description: string;
  startDate: string;
  endDate: string;
  isFree: boolean;
  imageUrl: string;
  hostId: number;
  minPrice: number;
  maxPrice: number;
  address: Address;
  categories: Category[];
};

type Host = {
  id: number;
  typeofhost: number;
  logoUrl: string;
  name: string;
  description: string;
  address: Address;
  isActive: boolean;
};

type UserProfile = {
  name: string;
};

type FavoritePreview = { key: string; name: string; imageUrl: string; type: string; address: string } & ({ programmingId: number } | { hostId: number });

type FavoriteResponse = {
  programmingId: number;
};

type NearbyItem = {
  id: number;
  type: 'Host' | 'Programming';
  name: string;
  description: string;
  address: string;
  imageUrl: string | null;
  distanceMeters: number;
};

type NearbyResponse = {
  items: NearbyItem[];
  hasMore: boolean;
};

type NearbyState = 'idle' | 'locating' | 'loading' | 'ready' | 'empty' | 'denied' | 'error';

type StorageLike = {
  getItem: (key: string) => string | null;
  setItem?: (key: string, value: string) => void;
};

type LoadState = 'loading' | 'ready' | 'error';

const categoryStyles = [
  { background: '#FFE7E1', foreground: '#D94635' },
  { background: '#EDE7FF', foreground: '#7258C7' },
  { background: '#E8F6DD', foreground: '#417E27' },
  { background: '#FFF0C7', foreground: '#9B6A00' },
  { background: '#DFF4FB', foreground: '#16758F' },
  { background: '#E2F1E9', foreground: '#23714A' },
] as const;

function categoryIcon(name: string) {
  const normalized = name.toLocaleLowerCase('pt-BR');
  if (normalized.includes('mús') || normalized.includes('music')) return '♫';
  if (normalized.includes('gastro') || normalized.includes('comida')) return '●';
  if (normalized.includes('arte') || normalized.includes('expos')) return '✦';
  if (normalized.includes('teatro')) return '◐';
  if (normalized.includes('cinema')) return '▶';
  if (normalized.includes('esporte')) return '◆';
  if (normalized.includes('feira') || normalized.includes('mercado')) return '⌁';
  if (normalized.includes('dança')) return '♪';
  return '✦';
}

function getSessionToken() {
  if (Platform.OS !== 'web') return '';
  return (globalThis as { sessionStorage?: StorageLike }).sessionStorage?.getItem(accessTokenStorageKey) ?? '';
}

async function requestJson<T>(path: string, options: RequestInit = {}) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: { Accept: 'application/json', ...options.headers },
  });
  const body = (await response.json().catch(() => null)) as T | { detail?: string; title?: string } | null;
  if (!response.ok) {
    const error = body as { detail?: string; title?: string } | null;
    throw new Error(error?.detail || error?.title || 'Não foi possível carregar as informações.');
  }
  return body as T;
}

function formatEventDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Data a confirmar';
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
    .format(date)
    .replace('.', '')
    .toUpperCase();
}

function formatPrice(programming: Programming) {
  if (programming.isFree) return 'GRÁTIS';
  const formatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  if (programming.minPrice === programming.maxPrice) return formatter.format(programming.minPrice);
  return `A partir de ${formatter.format(programming.minPrice)}`;
}

function formatDistance(meters: number) {
  if (meters < 1000) return `${Math.max(0, Math.round(meters))} m`;
  return `${(meters / 1000).toFixed(1).replace('.', ',')} km`;
}

function addressLabel(address: Address) {
  return [address.street, address.neighborhood, address.city].filter(Boolean).join(' · ');
}

function Header({ initial, fontsLoaded }: { initial: string; fontsLoaded: boolean }) {
  return (
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
      <Pressable
        accessibilityLabel="Abrir perfil do usuário"
        accessibilityRole="button"
        onPress={() => router.push('/perfil')}
        style={({ pressed }) => [styles.avatar, pressed && styles.pressed]}
      >
        <Text style={styles.avatarText}>{initial}</Text>
      </Pressable>
    </View>
  );
}

function CategoryButton({
  category,
  index,
  selected,
  onPress,
}: {
  category: Category;
  index: number;
  selected: boolean;
  onPress: () => void;
}) {
  const palette = categoryStyles[index % categoryStyles.length];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.categoryCard, selected && styles.categoryCardSelected, pressed && styles.pressed]}
    >
      <View style={[styles.categoryIcon, { backgroundColor: palette.background }]}>
        <Text style={[styles.categoryIconText, { color: palette.foreground }]}>{categoryIcon(category.name)}</Text>
      </View>
      <Text numberOfLines={2} style={[styles.categoryName, selected && styles.categoryNameSelected]}>
        {category.name}
      </Text>
    </Pressable>
  );
}

function FavoriteButton({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityLabel={active ? `Remover ${label} dos favoritos` : `Adicionar ${label} aos favoritos`}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={(event) => {
        event.stopPropagation();
        onPress();
      }}
      style={({ pressed }) => [styles.favoriteButton, pressed && styles.pressed]}
    >
      <Text style={[styles.favoriteIcon, active && styles.favoriteIconActive]}>{active ? '♥' : '♡'}</Text>
    </Pressable>
  );
}

function EventCard({ programming, favorite, onToggleFavorite }: { programming: Programming; favorite: boolean; onToggleFavorite: () => void }) {
  const [imageFailed, setImageFailed] = useState(false);
  const categories = programming.categories.filter((category) => category.isActive).slice(0, 2);

  const openProgramming = () => {
    void requestJson(`/api/Programming/${programming.id}/Interactions`, {
      method: 'POST',
      body: JSON.stringify({ eventId: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${programming.id}`, type: 1 }),
      headers: { 'Content-Type': 'application/json' },
    }).catch(() => undefined);
    router.push({ pathname: '/programacao/[programmingId]', params: { programmingId: String(programming.id) } } as Href);
  };

  return (
    <View style={styles.eventCard}>
      <View style={styles.eventImageFrame}>
        <Pressable accessibilityRole="button" accessibilityLabel={`Ver programação ${programming.name}`} onPress={openProgramming} style={styles.eventImageLink}>
        {programming.imageUrl && !imageFailed ? (
          <Image
            accessibilityIgnoresInvertColors
            accessibilityLabel={`Imagem da programação ${programming.name}`}
            onError={() => setImageFailed(true)}
            resizeMode="cover"
            source={{ uri: programming.imageUrl }}
            style={styles.eventImage}
          />
        ) : (
          <View style={styles.eventImageFallback}>
            <Image
              accessibilityIgnoresInvertColors
              resizeMode="contain"
              source={require('../../assets/perambulando-mark.png')}
              style={styles.eventFallbackMark}
            />
            <Text style={styles.eventFallbackText}>Perambulando</Text>
          </View>
        )}
        <View style={styles.dateBadge}>
          <Text style={styles.dateBadgeDay}>{new Date(programming.startDate).getDate() || '--'}</Text>
          <Text style={styles.dateBadgeMonth}>
            {new Intl.DateTimeFormat('pt-BR', { month: 'short' })
              .format(new Date(programming.startDate))
              .replace('.', '')
              .toUpperCase()}
          </Text>
        </View>
        </Pressable>
        <FavoriteButton active={favorite} label={programming.name} onPress={onToggleFavorite} />
      </View>

      <Pressable accessibilityRole="button" accessibilityLabel={`Detalhes da programação ${programming.name}`} onPress={openProgramming} style={({ pressed }) => [styles.eventContent, pressed && styles.eventCardPressed]}>
        <View style={styles.categoryChips}>
          {categories.length > 0 ? (
            categories.map((category) => (
              <View key={category.id} style={styles.eventCategoryChip}>
                <Text style={styles.eventCategoryText}>{category.name}</Text>
              </View>
            ))
          ) : (
            <View style={styles.eventCategoryChip}>
              <Text style={styles.eventCategoryText}>Programação</Text>
            </View>
          )}
        </View>
        <View style={styles.eventMetaRow}>
          <Text style={styles.eventDate}>{formatEventDate(programming.startDate)}</Text>
          <Text style={[styles.eventPrice, programming.isFree && styles.eventPriceFree]}>{formatPrice(programming)}</Text>
        </View>
        <Text numberOfLines={2} style={styles.eventName}>{programming.name}</Text>
        <Text numberOfLines={2} style={styles.eventAddress}>⌖ {addressLabel(programming.address) || 'Local a confirmar'}</Text>
      </Pressable>
      <RoadmapButton kind="programming" id={programming.id} name={programming.name} />
    </View>
  );
}

function HostCard({ host, favorite, onToggleFavorite }: { host: Host; favorite: boolean; onToggleFavorite: () => void }) {
  const [imageFailed, setImageFailed] = useState(false);
  const typeLabel = host.typeofhost === 1 ? 'Gastronomia' : 'Comércio';
  const openHost = () => router.push({ pathname: '/estabelecimento', params: { hostId: String(host.id), origin: 'explorar' } } as Href);
  return (
    <View style={styles.hostCard}>
      <View style={styles.hostImageFrame}>
        <Pressable accessibilityRole="button" accessibilityLabel={`Ver estabelecimento ${host.name}`} onPress={openHost}>
        {host.logoUrl && !imageFailed ? (
          <Image onError={() => setImageFailed(true)} resizeMode="cover" source={{ uri: host.logoUrl }} style={styles.hostImage} />
        ) : (
          <View style={styles.hostImageFallback}><Text style={styles.hostImageText}>{host.name.charAt(0).toUpperCase()}</Text></View>
        )}
        </Pressable>
        <FavoriteButton active={favorite} label={host.name} onPress={onToggleFavorite} />
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel={`Detalhes de ${host.name}`} onPress={openHost} style={styles.hostCardCopy}>
        <Text style={styles.hostType}>{typeLabel}</Text>
        <Text numberOfLines={2} style={styles.hostName}>{host.name}</Text>
        <Text numberOfLines={2} style={styles.hostAddress}>⌖ {addressLabel(host.address)}</Text>
      </Pressable>
      <RoadmapButton kind="host" id={host.id} name={host.name} />
    </View>
  );
}

function FavoriteCard({ item, onOpen, onRemove }: { item: { key: string; name: string; imageUrl: string; type: string; address: string }; onOpen?: () => void; onRemove: () => void }) {
  const [imageFailed, setImageFailed] = useState(false);
  return (
    <View style={styles.favoriteCard}><Pressable onPress={onOpen} style={({ pressed }) => [onOpen && pressed && styles.eventCardPressed]}>
      <View style={styles.favoriteImageFrame}>
        {item.imageUrl && !imageFailed ? <Image onError={() => setImageFailed(true)} resizeMode="cover" source={{ uri: item.imageUrl }} style={styles.favoriteImage} /> : <View style={styles.favoriteImageFallback}><Text style={styles.favoriteImageFallbackText}>{item.name.charAt(0).toUpperCase()}</Text></View>}
        <FavoriteButton active label={item.name} onPress={onRemove} />
      </View>
      <View style={styles.favoriteCopy}>
        <Text style={styles.favoriteType}>{item.type}</Text>
        <Text numberOfLines={2} style={styles.favoriteName}>{item.name}</Text>
        <Text numberOfLines={2} style={styles.favoriteAddress}>⌖ {item.address}</Text>
      </View>
    </Pressable><RoadmapButton kind={item.key.startsWith('host:') ? 'host' : 'programming'} id={Number(item.key.split(':')[1])} name={item.name} /></View>
  );
}

function NearbyCard({ item }: { item: NearbyItem }) {
  const [imageFailed, setImageFailed] = useState(false);
  const openItem = () => {
    if (item.type === 'Programming') {
      router.push({ pathname: '/programacao/[programmingId]', params: { programmingId: String(item.id) } } as Href);
    } else {
      router.push({ pathname: '/estabelecimento', params: { hostId: String(item.id), origin: 'explorar' } } as Href);
    }
  };
  return (
    <View><Pressable accessibilityHint="Abre as informações deste local" accessibilityRole="button" onPress={openItem} style={({ pressed }) => [styles.nearbyCard, pressed && styles.eventCardPressed]}>
      <View style={styles.nearbyImageFrame}>
        {item.imageUrl && !imageFailed ? <Image onError={() => setImageFailed(true)} resizeMode="cover" source={{ uri: item.imageUrl }} style={styles.nearbyImage} /> : <View style={styles.nearbyImageFallback}><Text style={styles.nearbyImageFallbackText}>{item.name.charAt(0).toUpperCase()}</Text></View>}
        <View style={styles.nearbyDistanceBadge}><Text style={styles.nearbyDistanceText}>⌖ {formatDistance(item.distanceMeters)}</Text></View>
      </View>
      <View style={styles.nearbyCopy}><Text style={styles.nearbyType}>{item.type === 'Programming' ? 'PROGRAMAÇÃO' : 'ESTABELECIMENTO'}</Text><Text numberOfLines={2} style={styles.nearbyName}>{item.name}</Text><Text numberOfLines={2} style={styles.nearbyAddress}>{item.address || 'Endereço não informado'}</Text></View>
    </Pressable><RoadmapButton kind={item.type === 'Host' ? 'host' : 'programming'} id={item.id} name={item.name} /></View>
  );
}

function NavItem({ icon, label, active = false, onPress }: { icon: string; label: string; active?: boolean; onPress?: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active, disabled: !onPress && !active }}
      disabled={!onPress && !active}
      onPress={onPress}
      style={({ pressed }) => [styles.navItem, pressed && styles.pressed]}
    >
      <Text style={[styles.navIcon, active && styles.navIconActive]}>{icon}</Text>
      <Text style={[styles.navLabel, active && styles.navLabelActive]}>{label}</Text>
    </Pressable>
  );
}

export default function ExploreScreen() {
  const { width: viewportWidth } = useWindowDimensions();
  const [fontsLoaded] = useFonts({ Fredoka_700Bold });
  const [token] = useState(getSessionToken);
  const [categories, setCategories] = useState<Category[]>([]);
  const [programmings, setProgrammings] = useState<Programming[]>([]);
  const [hosts, setHosts] = useState<Host[]>([]);
  const [knownProgrammings, setKnownProgrammings] = useState<Programming[]>([]);
  const [hostsLoading, setHostsLoading] = useState(true);
  const [favoriteKeys, setFavoriteKeys] = useState<string[]>(getFavoriteKeys);
  const [favoriteBusy, setFavoriteBusy] = useState<string[]>([]);
  const [favoriteMessage, setFavoriteMessage] = useState('');
  const [preferenceIds, setPreferenceIds] = useState<number[]>([]);
  const [preferenceDraft, setPreferenceDraft] = useState<number[]>([]);
  const [preferenceSaving, setPreferenceSaving] = useState(false);
  const [preferenceMessage, setPreferenceMessage] = useState('');
  const [nearbyItems, setNearbyItems] = useState<NearbyItem[]>([]);
  const [nearbyVisibleCount, setNearbyVisibleCount] = useState(5);
  const [nearbyHasMore, setNearbyHasMore] = useState(false);
  const [nearbyState, setNearbyState] = useState<NearbyState>('idle');
  const [nearbyMessage, setNearbyMessage] = useState('Use sua localização para ordenar eventos e estabelecimentos pela distância.');
  const nearbyCoordinates = useRef<{ latitude: number; longitude: number } | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [searchText, setSearchText] = useState('');
  const [state, setState] = useState<LoadState>('loading');
  const [message, setMessage] = useState('Buscando experiências para você...');
  const [userInitial, setUserInitial] = useState('U');
  const programmingRequest = useRef(0);
  const searchInput = useRef<ComponentRef<typeof TextInput>>(null);
  const pageScroll = useRef<ComponentRef<typeof ScrollView>>(null);

  useEffect(() => {
    let active = true;
    requestJson<Category[]>('/api/Category/GetallCategories')
      .then((items) => {
        if (active) setCategories(items.filter((item) => item.isActive));
      })
      .catch((error) => {
        if (active) {
          setState('error');
          setMessage(error instanceof Error ? error.message : 'Não foi possível carregar as categorias.');
        }
      });

    requestJson<Host[]>('/api/Host/HostFilter?Types=1&Types=2&City=Recife&Take=100&Skip=0')
      .then((items) => {
        if (active) setHosts(items.filter((item) => item.isActive));
      })
      .catch(() => {
        if (active) setHosts([]);
      })
      .finally(() => {
        if (active) setHostsLoading(false);
      });

    if (token) {
      requestJson<UserProfile>('/api/User/Profile', { headers: { Authorization: `Bearer ${token}` } })
        .then((profile) => {
          if (active) setUserInitial(profile.name.trim().charAt(0).toUpperCase() || 'U');
        })
        .catch(() => undefined);

      requestJson<Category[]>('/api/Category/GetUserCategoriesPreferences', { headers: { Authorization: `Bearer ${token}` } })
        .then((items) => {
          if (!active) return;
          const ids = items.filter((item) => item.isActive).map((item) => item.id);
          setPreferenceIds(ids);
          setPreferenceDraft(ids);
        })
        .catch(() => {
          if (active) setPreferenceMessage('Não foi possível carregar suas preferências.');
        });

      requestJson<FavoriteResponse[]>('/api/Favorite/GetAllByUserId', { headers: { Authorization: `Bearer ${token}` } })
        .then(async (serverFavorites) => {
          if (!active) return;
          const localKeys = getFavoriteKeys();
          const localProgrammingIds = localKeys.filter((key) => key.startsWith('programming:')).map((key) => Number(key.split(':')[1])).filter(Number.isInteger);
          const serverIds = new Set(serverFavorites.map((item) => item.programmingId));
          const missingIds = localProgrammingIds.filter((id) => !serverIds.has(id));
          await Promise.all(missingIds.map((id) => requestJson(`/api/Favorite/${id}/Create`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } }).then(() => serverIds.add(id)).catch(() => undefined)));
          if (!active) return;
          const mergedKeys = [...new Set([...localKeys, ...[...serverIds].map((id) => `programming:${id}`)])];
          setFavoriteKeys(mergedKeys);
          storeFavoriteKeys(mergedKeys);
          const details = await Promise.all([...serverIds].map((id) => requestJson<Programming>(`/api/Programming/Details/${id}`).catch(() => null)));
          if (active) setKnownProgrammings((current) => {
            const merged = new Map(current.map((item) => [item.id, item]));
            details.forEach((item) => { if (item) merged.set(item.id, item); });
            return [...merged.values()];
          });
        })
        .catch(() => {
          if (active) setFavoriteMessage('Seus favoritos locais continuam disponíveis, mas não foi possível sincronizá-los.');
        });
    }

    return () => {
      active = false;
    };
  }, [token]);

  const loadNearby = async (latitude: number, longitude: number, skip = 0) => {
    const query = new URLSearchParams({ Latitude: String(latitude), Longitude: String(longitude), MaxDistanceKm: '20', Skip: String(skip) });
    return requestJson<NearbyResponse>(`/api/Nearby/GetNearMe?${query.toString()}`, token ? { headers: { Authorization: `Bearer ${token}` } } : {});
  };

  const requestCurrentLocation = async (requestPermission = true) => {
    setNearbyState('locating');
    setNearbyMessage('Obtendo sua localização...');
    try {
      let permission = await Location.getForegroundPermissionsAsync();
      if (permission.status !== 'granted' && requestPermission) permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        setNearbyState('denied');
        setNearbyMessage('Autorize a localização para ver os lugares mais próximos.');
        return;
      }
      const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const coordinates = { latitude: current.coords.latitude, longitude: current.coords.longitude };
      nearbyCoordinates.current = coordinates;
      setNearbyState('loading');
      setNearbyMessage('Ordenando os lugares mais próximos...');
      const response = await loadNearby(coordinates.latitude, coordinates.longitude);
      setNearbyItems(response.items);
      setNearbyVisibleCount(5);
      setNearbyHasMore(response.hasMore);
      setNearbyState(response.items.length > 0 ? 'ready' : 'empty');
      setNearbyMessage(response.items.length > 0 ? '' : 'Nenhum evento ou estabelecimento foi encontrado em até 20 km.');
    } catch (error) {
      setNearbyState('error');
      setNearbyMessage(error instanceof Error ? error.message : 'Não foi possível consultar os locais próximos.');
    }
  };

  useEffect(() => {
    let active = true;
    Location.getForegroundPermissionsAsync().then((permission) => {
      if (active && permission.status === 'granted') void requestCurrentLocation(false);
    }).catch(() => undefined);
    return () => { active = false; };
    // A localização é reutilizada automaticamente somente quando a permissão já foi concedida.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showMoreNearby = async () => {
    if (nearbyVisibleCount < nearbyItems.length) {
      setNearbyVisibleCount((current) => Math.min(current + 5, nearbyItems.length));
      return;
    }
    const coordinates = nearbyCoordinates.current;
    if (!coordinates || !nearbyHasMore) return;
    setNearbyState('loading');
    try {
      const response = await loadNearby(coordinates.latitude, coordinates.longitude, nearbyItems.length);
      setNearbyItems((current) => [...current, ...response.items]);
      setNearbyVisibleCount((current) => current + Math.min(5, response.items.length));
      setNearbyHasMore(response.hasMore);
      setNearbyState('ready');
    } catch (error) {
      setNearbyState('error');
      setNearbyMessage(error instanceof Error ? error.message : 'Não foi possível carregar mais opções.');
    }
  };

  useEffect(() => {
    const requestId = programmingRequest.current + 1;
    programmingRequest.current = requestId;
    const timer = setTimeout(() => {
      const query = new URLSearchParams({ take: '20', skip: '0' });
      const text = searchText.trim();
      if (text) query.set('text', text);
      if (selectedCategoryId !== null) query.append('categoriesId', String(selectedCategoryId));

      setState('loading');
      setMessage('Buscando experiências para você...');
      requestJson<Programming[]>(`/api/Programming/Filter?${query.toString()}`)
        .then((items) => {
          if (programmingRequest.current !== requestId) return;
          setProgrammings(items.filter((item) => item.isActive));
          setKnownProgrammings((current) => {
            const merged = new Map(current.map((item) => [item.id, item]));
            items.filter((item) => item.isActive).forEach((item) => merged.set(item.id, item));
            return [...merged.values()];
          });
          setState('ready');
          setMessage('');
        })
        .catch((error) => {
          if (programmingRequest.current !== requestId) return;
          setProgrammings([]);
          setState('error');
          setMessage(
            error instanceof TypeError
              ? `Não foi possível acessar ${apiBaseUrl}. Verifique se a API está ativa.`
              : error instanceof Error
                ? error.message
                : 'Não foi possível carregar as programações.',
          );
        });
    }, searchText ? 350 : 0);

    return () => clearTimeout(timer);
  }, [searchText, selectedCategoryId]);

  const selectedCategory = categories.find((category) => category.id === selectedCategoryId);
  useFocusEffect(useCallback(() => {
    let active = true;
    const refresh = () => {
      const keys = getFavoriteKeys();
      setFavoriteKeys(keys);
      const ids = keys.filter((key) => key.startsWith('programming:')).map((key) => Number(key.split(':')[1]));
      if (!ids.length) {
        return;
      }
      void Promise.all(ids.map((id) => requestJson<Programming>(`/api/Programming/Details/${id}`).catch(() => null))).then((details) => {
        if (active) {
          setKnownProgrammings((current) => {
            const merged = new Map(current.map((item) => [item.id, item]));
            details.forEach((item) => { if (item) { merged.set(item.id, item); } });
            return [...merged.values()];
          });
        }
      });
    };
    refresh();
    const unsubscribe = subscribeToFavorites(refresh);
    return () => { active = false; unsubscribe(); };
  }, []));
  const favoriteSet = new Set(favoriteKeys);
  const updateLocalFavorite = (key: string, active: boolean) => {
    setFavoriteKeys(setLocalFavorite(key, active).keys);
  };
  const toggleFavorite = async (key: string) => {
    if (favoriteBusy.includes(key)) return;
    const wasFavorite = favoriteKeys.includes(key);
    const [kind, rawId] = key.split(':');
    const programmingId = Number(rawId);
    updateLocalFavorite(key, !wasFavorite);
    setFavoriteMessage('');
    if (!token || kind !== 'programming' || !Number.isInteger(programmingId)) return;
    setFavoriteBusy((current) => [...current, key]);
    try {
      await requestJson(`/api/Favorite/${programmingId}/${wasFavorite ? 'Delete' : 'Create'}`, {
        method: wasFavorite ? 'PATCH' : 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      setFavoriteMessage('Favorito atualizado neste navegador. Não foi possível sincronizar com a conta agora.');
    } finally {
      setFavoriteBusy((current) => current.filter((item) => item !== key));
    }
  };

  const togglePreference = (categoryId: number) => {
    setPreferenceMessage('');
    setPreferenceDraft((current) => {
      if (current.includes(categoryId)) return current.filter((id) => id !== categoryId);
      if (current.length >= 3) {
        setPreferenceMessage('Selecione no máximo 3 categorias.');
        return current;
      }
      return [...current, categoryId];
    });
  };

  const savePreferences = async () => {
    if (!token || preferenceSaving) return;
    setPreferenceSaving(true);
    setPreferenceMessage('');
    try {
      await requestJson('/api/Category/' + (preferenceIds.length === 0 ? 'AddCategoryToUser' : 'EditCategoryToUser'), {
        method: preferenceIds.length === 0 ? 'POST' : 'PUT',
        body: JSON.stringify(preferenceDraft),
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      setPreferenceIds(preferenceDraft);
      setPreferenceMessage('Preferências atualizadas.');
    } catch (error) {
      setPreferenceMessage(error instanceof Error ? error.message : 'Não foi possível atualizar suas preferências.');
    } finally {
      setPreferenceSaving(false);
    }
  };
  const favoriteItems = favoriteKeys.flatMap<FavoritePreview>((key) => {
    const [kind, rawId] = key.split(':');
    const id = Number(rawId);
    if (kind === 'programming') {
      const programming = knownProgrammings.find((item) => item.id === id);
      return programming ? [{ key, name: programming.name, imageUrl: programming.imageUrl, type: programming.categories[0]?.name ?? 'Programação', address: addressLabel(programming.address), programmingId: programming.id }] : [];
    }
    const host = hosts.find((item) => item.id === id);
    return host ? [{ key, name: host.name, imageUrl: host.logoUrl, type: host.typeofhost === 1 ? 'Gastronomia' : 'Comércio', address: addressLabel(host.address), hostId: host.id }] : [];
  });

  return (
    <View style={styles.viewport}>
      <View style={[styles.appShell, { width: Math.min(viewportWidth, 430) }]}>
        <StatusBar style="dark" />
        <Header fontsLoaded={fontsLoaded} initial={userInitial} />

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" ref={pageScroll} showsVerticalScrollIndicator>
          <View style={styles.hero}>
            <Text style={styles.heroEyebrow}>DESCUBRA SUA CIDADE</Text>
            <Text style={styles.heroTitle}>Bora perambular?</Text>
            <Text style={styles.heroSubtitle}>Sempre tem uma programação esperando por você.</Text>

            <View style={styles.searchBox}>
              <Text style={styles.searchIcon}>⌕</Text>
              <TextInput
                accessibilityLabel="Buscar programações"
                autoCapitalize="none"
                onChangeText={setSearchText}
                placeholder="Buscar eventos..."
                placeholderTextColor="#8A93A0"
                ref={searchInput}
                returnKeyType="search"
                style={styles.searchInput}
                value={searchText}
              />
              {searchText ? (
                <Pressable accessibilityLabel="Limpar busca" accessibilityRole="button" onPress={() => setSearchText('')} style={styles.clearSearch}>
                  <Text style={styles.clearSearchText}>×</Text>
                </Pressable>
              ) : null}
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Montar roteiro com IA" onPress={() => router.push('/roteiro_ia' as Href)} style={({ pressed }) => [styles.itineraryButton, pressed && styles.pressedItinerary]}>
              <View style={styles.itineraryIcon}><Text style={styles.itineraryGlyph}>⌁</Text></View><View style={styles.itineraryCopy}><Text style={styles.itineraryTitle}>Montar roteiro com IA</Text><Text style={styles.itinerarySubtitle}>Um passeio do seu jeito, em poucos passos.</Text></View><Text style={styles.itineraryArrow}>›</Text>
            </Pressable>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeadingRow}>
              <View style={styles.sectionHeadingCopy}>
                <Text style={styles.sectionTitle}>Estabelecimentos no Recife Antigo</Text>
                <Text style={styles.sectionSubtitle}>Gastronomia e comércio para conhecer durante o passeio.</Text>
              </View>
            </View>
            {hostsLoading ? <View style={styles.inlineLoading}><ActivityIndicator color={colors.orange} /></View> : null}
            {!hostsLoading && hosts.length > 0 ? (
              <ScrollView horizontal contentContainerStyle={styles.hostList} showsHorizontalScrollIndicator={false}>
                {hosts.map((host) => <HostCard favorite={favoriteSet.has(`host:${host.id}`)} host={host} key={host.id} onToggleFavorite={() => void toggleFavorite(`host:${host.id}`)} />)}
              </ScrollView>
            ) : null}
            {!hostsLoading && hosts.length === 0 ? <Text style={styles.hostEmpty}>Nenhum estabelecimento disponível agora.</Text> : null}
          </View>

          {favoriteItems.length > 0 ? (
            <View style={styles.section}>
              <View style={styles.sectionHeadingRow}>
                <View style={styles.sectionHeadingCopy}>
                  <Text style={styles.sectionTitle}>Seus favoritos</Text>
                  <Text style={styles.sectionSubtitle}>Eventos e estabelecimentos que você salvou para não perder.</Text>
                </View>
              </View>
              <ScrollView horizontal contentContainerStyle={styles.favoriteList} showsHorizontalScrollIndicator={false}>
                {favoriteItems.map((item) => (
                  <FavoriteCard
                    item={item}
                    key={item.key}
                    onOpen={'programmingId' in item ? () => router.push({ pathname: '/programacao/[programmingId]', params: { programmingId: String(item.programmingId) } } as Href) : () => router.push({ pathname: '/estabelecimento', params: { hostId: String(item.hostId), origin: 'favoritos' } } as Href)}
                    onRemove={() => void toggleFavorite(item.key)}
                  />
                ))}
              </ScrollView>
            </View>
          ) : null}

          {favoriteMessage ? <Text accessibilityRole="alert" style={styles.syncMessage}>{favoriteMessage}</Text> : null}

          <View style={styles.section}>
            <View style={styles.sectionHeadingRow}><View style={styles.sectionHeadingCopy}><Text style={styles.sectionTitle}>Mais próximos de você</Text><Text style={styles.sectionSubtitle}>Eventos e estabelecimentos ordenados pela distância real.</Text></View></View>
            {(nearbyState === 'idle' || nearbyState === 'denied' || nearbyState === 'error') ? <View style={styles.nearbyStateCard}><Text style={styles.nearbyStateText}>{nearbyMessage}</Text><Pressable onPress={() => void requestCurrentLocation(true)} style={styles.nearbyLocationButton}><Text style={styles.nearbyLocationButtonText}>{nearbyState === 'idle' ? 'Usar minha localização' : 'Tentar novamente'}</Text></Pressable></View> : null}
            {(nearbyState === 'locating' || (nearbyState === 'loading' && nearbyItems.length === 0)) ? <View style={styles.inlineLoading}><ActivityIndicator color={colors.orange} /><Text style={styles.nearbyStateText}>{nearbyMessage}</Text></View> : null}
            {nearbyState === 'empty' ? <View style={styles.nearbyStateCard}><Text style={styles.nearbyStateText}>{nearbyMessage}</Text></View> : null}
            {nearbyItems.length > 0 ? <><ScrollView horizontal contentContainerStyle={styles.nearbyList} showsHorizontalScrollIndicator={false}>{nearbyItems.slice(0, nearbyVisibleCount).map((item) => <NearbyCard item={item} key={`${item.type}-${item.id}`} />)}</ScrollView>{nearbyVisibleCount < nearbyItems.length || nearbyHasMore ? <Pressable disabled={nearbyState === 'loading'} onPress={() => void showMoreNearby()} style={styles.showMoreNearby}>{nearbyState === 'loading' ? <ActivityIndicator color={colors.ink} /> : <Text style={styles.showMoreNearbyText}>Mostrar mais</Text>}</Pressable> : null}</> : null}
          </View>

          {token ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Minhas preferências</Text>
              <Text style={styles.sectionSubtitle}>Escolha até 3 categorias para personalizar suas sugestões.</Text>
              <View style={styles.preferenceList}>
                {categories.map((category) => <Pressable accessibilityState={{ selected: preferenceDraft.includes(category.id) }} key={category.id} onPress={() => togglePreference(category.id)} style={[styles.preferenceChip, preferenceDraft.includes(category.id) && styles.preferenceChipActive]}><Text style={[styles.preferenceChipText, preferenceDraft.includes(category.id) && styles.preferenceChipTextActive]}>{category.name}</Text></Pressable>)}
              </View>
              <Pressable disabled={preferenceSaving || preferenceDraft.join(',') === preferenceIds.join(',')} onPress={() => void savePreferences()} style={[styles.preferenceButton, (preferenceSaving || preferenceDraft.join(',') === preferenceIds.join(',')) && styles.preferenceButtonDisabled]}>{preferenceSaving ? <ActivityIndicator color={colors.card} /> : <Text style={styles.preferenceButtonText}>Salvar preferências</Text>}</Pressable>
              {preferenceMessage ? <Text accessibilityRole="alert" style={styles.preferenceMessage}>{preferenceMessage}</Text> : null}
            </View>
          ) : null}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Qual é a sua vibe?</Text>
            <Text style={styles.sectionSubtitle}>Escolha uma categoria e deixe a cidade te levar.</Text>
            {categories.length > 0 ? (
              <View style={styles.categoryGrid}>
                {categories.slice(0, 6).map((category, index) => (
                  <CategoryButton
                    category={category}
                    index={index}
                    key={category.id}
                    onPress={() => setSelectedCategoryId((current) => (current === category.id ? null : category.id))}
                    selected={selectedCategoryId === category.id}
                  />
                ))}
              </View>
            ) : state === 'loading' ? (
              <View style={styles.inlineLoading}><ActivityIndicator color={colors.orange} /></View>
            ) : null}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeadingRow}>
              <View style={styles.sectionHeadingCopy}>
                <Text style={styles.sectionTitle}>{selectedCategory ? selectedCategory.name : 'Destaques da semana'}</Text>
                <Text style={styles.sectionSubtitle}>
                  {selectedCategory ? 'Programações desta categoria.' : 'Eventos publicados pelos estabelecimentos.'}
                </Text>
              </View>
              {selectedCategory ? (
                <Pressable accessibilityRole="button" onPress={() => setSelectedCategoryId(null)}>
                  <Text style={styles.seeAll}>Ver todos ›</Text>
                </Pressable>
              ) : null}
            </View>

            {state === 'loading' ? (
              <View style={styles.stateCard}>
                <ActivityIndicator color={colors.orange} />
                <Text style={styles.stateText}>{message}</Text>
              </View>
            ) : null}

            {state === 'error' ? (
              <View accessibilityRole="alert" style={[styles.stateCard, styles.errorCard]}>
                <Text style={styles.errorTitle}>Explorar indisponível</Text>
                <Text style={styles.stateText}>{message}</Text>
              </View>
            ) : null}

            {state === 'ready' && programmings.length === 0 ? (
              <View style={styles.stateCard}>
                <Text style={styles.emptyIcon}>⌕</Text>
                <Text style={styles.emptyTitle}>Nenhuma programação encontrada</Text>
                <Text style={styles.stateText}>Tente outra busca ou escolha uma categoria diferente.</Text>
              </View>
            ) : null}

            {state === 'ready' && programmings.length > 0 ? (
              <ScrollView
                contentContainerStyle={styles.eventList}
                decelerationRate="fast"
                disableIntervalMomentum
                horizontal
                showsHorizontalScrollIndicator={false}
                snapToInterval={300}
              >
                {programmings.map((programming) => <EventCard favorite={favoriteSet.has(`programming:${programming.id}`)} key={programming.id} onToggleFavorite={() => void toggleFavorite(`programming:${programming.id}`)} programming={programming} />)}
              </ScrollView>
            ) : null}
          </View>
        </ScrollView>

        <View style={styles.bottomNav}>
          <NavItem active icon="⌾" label="Explorar" />
          <NavItem icon="⌁" label="Roteiro" onPress={() => router.push('/roteiro' as Href)} />
          <NavItem icon="⌖" label="Perto de você" onPress={() => router.push('/perto_de_voce' as Href)} />
          <NavItem icon="♡" label="Favoritos" onPress={() => router.push('/favoritos' as Href)} />
          <NavItem icon="♙" label="Perfil" onPress={() => router.push('/perfil' as Href)} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  eventImageLink: { width: '100%', height: '100%' },
  itineraryButton: { marginTop: 12, minHeight: 78, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 17, borderWidth: 1, borderColor: '#47607C', backgroundColor: '#1C3D63' }, itineraryIcon: { width: 39, height: 40, borderRadius: 12, backgroundColor: '#D4FF48', alignItems: 'center', justifyContent: 'center' }, itineraryGlyph: { color: '#23350B', fontSize: 25, fontWeight: '700' }, itineraryCopy: { flex: 1 }, itineraryTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' }, itinerarySubtitle: { color: '#CDD8E5', fontSize: 11, lineHeight: 17, marginTop: 3 }, itineraryArrow: { color: '#FFFFFF', fontSize: 25 }, pressedItinerary: { opacity: 0.8 },
  viewport: { flex: 1, alignItems: 'center', backgroundColor: '#E6DED2' },
  appShell: { flex: 1, maxWidth: 430, minWidth: 0, backgroundColor: colors.background, borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#DDD8D2', overflow: 'hidden' },
  header: { minHeight: 70, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.line },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  brandName: { color: colors.ink, fontSize: 18, fontWeight: '700', letterSpacing: -0.5 },
  brandNameFredoka: { fontFamily: 'Fredoka_700Bold', fontWeight: 'normal' },
  brandMark: { width: 40, height: 40 },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.ink },
  avatarText: { color: colors.card, fontSize: 14, fontWeight: '800' },
  scrollContent: { paddingBottom: 30 },
  hero: { paddingHorizontal: 20, paddingTop: 28, paddingBottom: 24, backgroundColor: colors.hero },
  heroEyebrow: { color: '#A9D7C2', fontSize: 9, fontWeight: '800', letterSpacing: 1.6 },
  heroTitle: { marginTop: 10, color: colors.card, fontSize: 38, lineHeight: 43, fontWeight: '400', letterSpacing: -1.5 },
  heroSubtitle: { maxWidth: 300, marginTop: 8, color: '#CDD8E5', fontSize: 13, lineHeight: 19 },
  searchBox: { minHeight: 52, marginTop: 20, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 9, borderRadius: 14, backgroundColor: colors.card },
  searchIcon: { color: colors.ink, fontSize: 20 },
  searchInput: { flex: 1, minHeight: 50, color: colors.ink, fontSize: 13, outlineStyle: 'none' } as never,
  clearSearch: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.orangeSoft },
  clearSearchText: { color: colors.orange, fontSize: 20, lineHeight: 22 },
  section: { paddingHorizontal: 16, paddingTop: 26 },
  sectionTitle: { color: colors.ink, fontSize: 22, fontWeight: '700', letterSpacing: -0.6 },
  sectionSubtitle: { marginTop: 4, color: colors.muted, fontSize: 11, lineHeight: 16 },
  categoryGrid: { marginTop: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  categoryCard: { width: '31%', minHeight: 94, padding: 10, alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 16, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card },
  categoryCardSelected: { borderColor: colors.orange, backgroundColor: colors.orangeSoft },
  categoryIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  categoryIconText: { fontSize: 18, fontWeight: '800' },
  categoryName: { color: colors.ink, fontSize: 10, lineHeight: 13, fontWeight: '700', textAlign: 'center' },
  categoryNameSelected: { color: colors.orange },
  syncMessage: { marginHorizontal: 16, marginTop: 12, padding: 10, color: colors.muted, fontSize: 10, lineHeight: 15, borderRadius: 12, backgroundColor: colors.orangeSoft },
  preferenceList: { marginTop: 14, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  preferenceChip: { minHeight: 34, paddingHorizontal: 11, alignItems: 'center', justifyContent: 'center', borderRadius: 17, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card },
  preferenceChipActive: { borderColor: colors.orange, backgroundColor: colors.orangeSoft },
  preferenceChipText: { color: colors.muted, fontSize: 9, fontWeight: '700' },
  preferenceChipTextActive: { color: colors.orange },
  preferenceButton: { minHeight: 42, marginTop: 13, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: colors.ink },
  preferenceButtonDisabled: { opacity: 0.45 },
  preferenceButtonText: { color: colors.card, fontSize: 10, fontWeight: '800' },
  preferenceMessage: { marginTop: 8, color: colors.muted, fontSize: 10, lineHeight: 15 },
  inlineLoading: { minHeight: 100, alignItems: 'center', justifyContent: 'center' },
  sectionHeadingRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 },
  sectionHeadingCopy: { flex: 1 },
  seeAll: { color: colors.orange, fontSize: 10, fontWeight: '800' },
  eventList: { paddingTop: 16, paddingRight: 20, gap: 16 },
  hostList: { paddingTop: 16, paddingRight: 20, gap: 12 },
  hostCard: { width: 205, overflow: 'hidden', borderRadius: 18, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card },
  hostImageFrame: { position: 'relative', width: '100%', height: 112 },
  hostImage: { width: '100%', height: 112 },
  hostImageFallback: { width: '100%', height: 112, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.hero },
  hostImageText: { color: colors.card, fontSize: 30, fontWeight: '800' },
  hostCardCopy: { minHeight: 105, padding: 12 },
  hostType: { color: colors.orange, fontSize: 8, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.7 },
  hostName: { marginTop: 5, color: colors.ink, fontSize: 14, lineHeight: 18, fontWeight: '800' },
  hostAddress: { marginTop: 8, color: colors.muted, fontSize: 9, lineHeight: 13 },
  hostEmpty: { marginTop: 14, color: colors.muted, fontSize: 11 },
  favoriteButton: { position: 'absolute', top: 12, right: 12, width: 38, height: 38, zIndex: 3, alignItems: 'center', justifyContent: 'center', borderRadius: 19, backgroundColor: colors.card, ...Platform.select({ web: { boxShadow: '0 4px 12px rgba(0,43,92,0.16)' }, default: { elevation: 4 } }) },
  favoriteIcon: { color: '#F25555', fontSize: 22, lineHeight: 24 },
  favoriteIconActive: { color: '#EF4444' },
  favoriteList: { paddingTop: 16, paddingRight: 20, gap: 12 },
  favoriteCard: { width: 195, overflow: 'hidden', borderRadius: 18, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card },
  favoriteImageFrame: { position: 'relative', height: 125, backgroundColor: '#DCE7E9' },
  favoriteImage: { width: '100%', height: '100%' },
  favoriteImageFallback: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.hero },
  favoriteImageFallbackText: { color: colors.card, fontSize: 28, fontWeight: '800' },
  favoriteCopy: { minHeight: 98, padding: 12 },
  favoriteType: { color: colors.orange, fontSize: 8, fontWeight: '800' },
  favoriteName: { marginTop: 5, color: colors.ink, fontSize: 14, lineHeight: 18, fontWeight: '800' },
  favoriteAddress: { marginTop: 7, color: colors.muted, fontSize: 9, lineHeight: 13 },
  nearbyList: { paddingTop: 16, paddingRight: 20, gap: 12 },
  nearbyCard: { width: 205, overflow: 'hidden', borderRadius: 18, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card },
  nearbyImageFrame: { position: 'relative', height: 122, backgroundColor: '#DCE7E9' },
  nearbyImage: { width: '100%', height: '100%' },
  nearbyImageFallback: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.hero },
  nearbyImageFallbackText: { color: colors.card, fontSize: 30, fontWeight: '800' },
  nearbyDistanceBadge: { position: 'absolute', left: 9, bottom: 9, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 10, backgroundColor: colors.orange },
  nearbyDistanceText: { color: colors.card, fontSize: 8, fontWeight: '800' },
  nearbyCopy: { minHeight: 98, padding: 12 },
  nearbyType: { color: colors.orange, fontSize: 8, fontWeight: '800', letterSpacing: 0.6 },
  nearbyName: { marginTop: 5, color: colors.ink, fontSize: 14, lineHeight: 18, fontWeight: '800' },
  nearbyAddress: { marginTop: 7, color: colors.muted, fontSize: 9, lineHeight: 13 },
  nearbyStateCard: { marginTop: 14, padding: 16, alignItems: 'center', gap: 10, borderRadius: 16, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card },
  nearbyStateText: { color: colors.muted, fontSize: 10, lineHeight: 15, textAlign: 'center' },
  nearbyLocationButton: { minHeight: 40, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: colors.ink },
  nearbyLocationButtonText: { color: colors.card, fontSize: 10, fontWeight: '800' },
  showMoreNearby: { minHeight: 42, marginTop: 12, alignItems: 'center', justifyContent: 'center', borderRadius: 12, borderWidth: 1, borderColor: colors.ink, backgroundColor: colors.card },
  showMoreNearbyText: { color: colors.ink, fontSize: 10, fontWeight: '800' },
  eventCard: { width: 284, overflow: 'hidden', borderRadius: 20, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card },
  eventCardPressed: { opacity: 0.82, transform: [{ scale: 0.992 }] },
  eventImageFrame: { height: 190, position: 'relative', backgroundColor: '#DCE7E9' },
  eventImage: { width: '100%', height: '100%' },
  eventImageFallback: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E9F1EF' },
  eventFallbackMark: { width: 58, height: 58, opacity: 0.75 },
  eventFallbackText: { marginTop: 4, color: colors.ink, fontSize: 12, fontWeight: '800' },
  dateBadge: { position: 'absolute', top: 12, left: 12, width: 45, height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card, ...Platform.select({ web: { boxShadow: '0 4px 12px rgba(0,43,92,0.14)' }, default: { elevation: 3 } }) },
  dateBadgeDay: { color: colors.ink, fontSize: 16, fontWeight: '800', lineHeight: 18 },
  dateBadgeMonth: { color: colors.orange, fontSize: 8, fontWeight: '800' },
  eventContent: { padding: 14 },
  categoryChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  eventCategoryChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 9, backgroundColor: colors.orangeSoft },
  eventCategoryText: { color: colors.orange, fontSize: 8, fontWeight: '800' },
  eventMetaRow: { marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  eventDate: { flex: 1, color: colors.orange, fontSize: 9, fontWeight: '800' },
  eventPrice: { color: colors.ink, fontSize: 9, fontWeight: '800' },
  eventPriceFree: { color: colors.success },
  eventName: { marginTop: 7, color: colors.ink, fontSize: 18, lineHeight: 22, fontWeight: '700' },
  eventAddress: { marginTop: 7, color: colors.muted, fontSize: 10, lineHeight: 15 },
  stateCard: { minHeight: 140, marginTop: 16, padding: 20, alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 18, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card },
  errorCard: { borderColor: '#F1B5AE', backgroundColor: '#FFF1F0' },
  errorTitle: { color: '#B42318', fontSize: 14, fontWeight: '800' },
  emptyIcon: { color: colors.orange, fontSize: 26 },
  emptyTitle: { color: colors.ink, fontSize: 14, fontWeight: '800', textAlign: 'center' },
  stateText: { color: colors.muted, fontSize: 11, lineHeight: 16, textAlign: 'center' },
  bottomNav: { minHeight: 72, paddingHorizontal: 6, paddingBottom: 5, flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.card },
  navItem: { flex: 1, minHeight: 56, alignItems: 'center', justifyContent: 'center', gap: 4 },
  navIcon: { color: '#8C8C93', fontSize: 18 },
  navIconActive: { color: colors.orange },
  navLabel: { color: '#8C8C93', fontSize: 8, textAlign: 'center' },
  navLabelActive: { color: colors.orange, fontWeight: '800' },
  pressed: { opacity: 0.72 },
});
