import RoadmapButton from '../RoadmapButton';
import * as Location from 'expo-location';
import { router, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { createElement, type ComponentRef, type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import NearbyMap from '../NearbyMap';
import { loadNearbyPinDetails, resolveNearbyPins, type EnrichedPin, type NearbyPin } from '../nearbyPins';
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

import AppBottomNav from '../components/AppBottomNav';
import AppHeader from '../components/AppHeader';
import { responsiveShellWidth } from '../theme/responsive';
import { useUserInitial } from '../useUserInitial';

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
type NearbyItem = NearbyPin;
type NearbyResponse = { items: NearbyItem[]; skip: number; pageSize: number; hasMore: boolean };
type Category = { id: number; name: string; isActive: boolean };
type ScreenState = 'idle' | 'locating' | 'loading' | 'ready' | 'empty' | 'denied' | 'services-off' | 'error';

function getSessionToken() {
  if (Platform.OS !== 'web') return '';
  return (globalThis as { sessionStorage?: StorageLike }).sessionStorage?.getItem(accessTokenStorageKey) ?? '';
}

async function requestJson<T>(path: string, token = '') {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    headers: { Accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
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

function Header({ initial }: { initial: string }) {
  return <AppHeader initial={initial} />;
}

export default function NearMeScreen() {
  const { width: viewportWidth } = useWindowDimensions();
  const [token] = useState(getSessionToken);
  const userInitial = useUserInitial();
  const [state, setState] = useState<ScreenState>('idle');
  const [message, setMessage] = useState('Toque em “Usar minha localização” para permitir o acesso.');
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [distanceKm, setDistanceKm] = useState(1);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [items, setItems] = useState<EnrichedPin[]>([]);
  const [now, setNow] = useState(Date.now);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selection, setSelectedItem] = useState<NearbyItem | null>(null);
  const [mapFocusKey, setMapFocusKey] = useState<string | undefined>();
  const [mapSectionY, setMapSectionY] = useState(0);
  const lastLoadedQuery = useRef('');
  const nextSkip = useRef(0);
  const requestVersion = useRef(0);
  const pageScroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const filterKey = `${distanceKm}|${selectedCategoryIds.join(',')}`;

  const loadNearby = useCallback(async (location: Coordinates, maxDistanceKm: number, skip = 0) => {
    const query = new URLSearchParams({
      Latitude: String(location.latitude),
      Longitude: String(location.longitude),
      MaxDistanceKm: String(maxDistanceKm),
      Skip: String(skip),
    });
    selectedCategoryIds.forEach((categoryId) => query.append('CategoriesId', String(categoryId)));
    return requestJson<NearbyResponse>(`/api/Nearby/GetNearMe?${query.toString()}`, token);
  }, [selectedCategoryIds, token]);

  const loadMapItems = useCallback(async (location: Coordinates, maxDistanceKm: number) => {
    let response = await loadNearby(location, maxDistanceKm);
    const combined = [...response.items];
    let availableTypes = new Set(combined.map((item) => item.type));
    let skip = response.skip + response.items.length;
    while (response.hasMore && response.items.length > 0 && (selectedCategoryIds.length > 0 || (availableTypes.size < 2 && combined.length < 50))) {
      response = await loadNearby(location, maxDistanceKm, skip);
      combined.push(...response.items);
      skip = response.skip + response.items.length;
      availableTypes = new Set(combined.map((item) => item.type));
    }
    const unique = [...new Map(combined.map((item) => [`${item.type}-${item.id}`, item])).values()];
    const enriched = await loadNearbyPinDetails(unique, <T,>(path: string) => requestJson<T>(path, token));
    return { ...response, hasMore: response.hasMore && response.items.length > 0, items: enriched, nextSkip: skip };
  }, [loadNearby, selectedCategoryIds.length, token]);

  const requestLocation = useCallback(async () => {
    const version = ++requestVersion.current;
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
      if (version !== requestVersion.current) {
        return;
      }
      lastLoadedQuery.current = filterKey;
      setState('loading');
      setMessage('Calculando o que está perto de você...');
      const response = await loadMapItems(nextCoordinates, distanceKm);
      if (version !== requestVersion.current) {
        return;
      }
      lastLoadedQuery.current = filterKey;
      nextSkip.current = response.nextSkip;
      setItems(response.items);
      setSelectedItem(null);
      setMapFocusKey(undefined);
      setHasMore(response.hasMore);
      setState(response.items.length > 0 ? 'ready' : 'empty');
      setMessage(response.items.length > 0 ? '' : `Não encontramos resultados em até ${distanceKm} km.`);
    } catch (error) {
      if (version !== requestVersion.current) {
        return;
      }
      setState('error');
      setMessage(error instanceof Error ? error.message : 'Não foi possível obter sua localização.');
    }
  }, [distanceKm, filterKey, loadMapItems]);

  useEffect(() => {
    let active = true;
    requestJson<Category[]>('/api/Category/GetallCategories')
      .then((result) => { if (active) setCategories(result.filter((category) => category.isActive)); })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!coordinates || lastLoadedQuery.current === filterKey) return;
    const version = ++requestVersion.current;
    let active = true;
    const timer = setTimeout(() => {
      void loadMapItems(coordinates, distanceKm)
        .then((response) => {
          if (!active || version !== requestVersion.current) {
            return;
          }
          lastLoadedQuery.current = filterKey;
          nextSkip.current = response.nextSkip;
          setItems(response.items);
          setSelectedItem(null);
          setMapFocusKey(undefined);
          setHasMore(response.hasMore);
          setState(response.items.length > 0 ? 'ready' : 'empty');
          setMessage(response.items.length > 0 ? '' : `Não encontramos resultados em até ${distanceKm} km.`);
        })
        .catch((error) => {
          if (!active || version !== requestVersion.current) {
            return;
          }
          setState('error');
          setMessage(error instanceof Error ? error.message : 'Não foi possível atualizar a consulta.');
        });
    }, 300);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [coordinates, distanceKm, filterKey, loadMapItems]);

  const toggleCategory = (categoryId: number) => {
    requestVersion.current += 1;
    lastLoadedQuery.current = '';
    setSelectedCategoryIds((current) => current.includes(categoryId) ? current.filter((id) => id !== categoryId) : [...current, categoryId]);
    setSelectedItem(null);
    setMapFocusKey(undefined);
    if (coordinates) {
      setState('loading');
      setMessage('Aplicando os filtros de categoria...');
    }
  };

  const loadMore = async () => {
    if (!coordinates || loadingMore || state !== 'ready' || lastLoadedQuery.current !== filterKey) {
      return;
    }
    const version = requestVersion.current;
    setLoadingMore(true);
    try {
      const response = await loadNearby(coordinates, distanceKm, nextSkip.current);
      const enriched = await loadNearbyPinDetails(response.items, <T,>(path: string) => requestJson<T>(path, token));
      if (version !== requestVersion.current) {
        return;
      }
      nextSkip.current = response.skip + response.items.length;
      setItems((current) => [...new Map([...current, ...enriched].map((item) => [`${item.type}-${item.id}`, item])).values()]);
      setHasMore(response.hasMore && response.items.length > 0);
    } catch (error) {
      if (version === requestVersion.current) {
        setMessage(error instanceof Error ? error.message : 'Não foi possível carregar mais resultados.');
      }
    } finally {
      setLoadingMore(false);
    }
  };

  const openItem = (item: NearbyItem) => {
    if (item.type === 'Programming') {
      router.push({ pathname: '/programacao/[programmingId]', params: { programmingId: String(item.id), origin: 'nearby-map' } } as Href);
    } else {
      router.push({ pathname: '/estabelecimento', params: { hostId: String(item.id), origin: 'nearby-map' } } as Href);
    }
  };

  const focusItemOnMap = (item: NearbyItem) => {
    setSelectedItem(item);
    setMapFocusKey(`${item.type}-${item.id}`);
    pageScroll.current?.scrollTo({ animated: true, y: Math.max(0, mapSectionY - 12) });
  };

  const mapItems = useMemo(() => resolveNearbyPins(items, now, selectedCategoryIds.length > 0), [items, now, selectedCategoryIds.length]);
  const nearestItems = mapItems.slice(0, 5);
  const selectedItem = selection ? mapItems.find((item) => item.id === selection.id && item.type === selection.type) ?? null : null;

  useEffect(() => {
    const boundaries = items.flatMap((item) => item.host?.programmings.flatMap((event) => [Date.parse(event.startDate), Date.parse(event.endDate)]) ?? [])
      .filter((time) => Number.isFinite(time) && time > now);
    if (!boundaries.length) {
      return;
    }
    const timer = setTimeout(() => setNow(Date.now()), Math.min(2147483647, Math.max(1, Math.min(...boundaries) - Date.now() + 25)));
    return () => clearTimeout(timer);
  }, [items, now]);

  const showStateCard = state !== 'ready';

  return (
    <View style={styles.viewport}>
      <View style={[styles.appShell, { width: responsiveShellWidth(viewportWidth) }]}>
        <StatusBar style="dark" />
        <Header initial={userInitial} />

        <ScrollView contentContainerStyle={styles.scrollContent} ref={pageScroll} showsVerticalScrollIndicator>
          <View style={styles.hero}>
            <Text style={styles.heroEyebrow}>PERTO DE VOCÊ</Text>
            <Text style={styles.heroTitle}>O que acontece por aí?</Text>
            <Text style={styles.heroSubtitle}>Ordenamos eventos e estabelecimentos pela sua distância.</Text>
            <Pressable accessibilityRole="button" onPress={requestLocation} style={({ pressed }) => [styles.locationButton, pressed && styles.pressed]}>
              <Text style={styles.locationButtonIcon}>⌖</Text>
              <Text numberOfLines={1} style={styles.locationButtonText}>{coordinates ? 'Atualizar localização' : 'Usar localização'}</Text>
            </Pressable>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Distância</Text>
            <View style={styles.distanceControl}>
              <View style={styles.distanceHeader}>
                <Text style={styles.distanceHint}>Arraste para escolher o raio</Text>
                <View style={styles.distanceValue}><Text style={styles.distanceValueText}>{distanceKm} km</Text></View>
              </View>
              {Platform.OS === 'web' ? createElement('input', {
                'aria-label': 'Distância máxima em quilômetros',
                max: 20,
                min: 1,
                onInput: (event: FormEvent<HTMLInputElement>) => setDistanceKm(Number(event.currentTarget.value)),
                step: 1,
                style: { width: '100%', height: 34, cursor: 'pointer', accentColor: colors.orange },
                type: 'range',
                value: distanceKm,
              }) : (
                <View style={styles.nativeDistanceControls}>
                  <Pressable accessibilityLabel="Diminuir distância" disabled={distanceKm === 1} onPress={() => setDistanceKm((value) => Math.max(1, value - 1))} style={styles.distanceStepButton}><Text style={styles.distanceStepText}>−</Text></Pressable>
                  <View style={styles.nativeDistanceTrack}><View style={[styles.nativeDistanceFill, { width: `${((distanceKm - 1) / 19) * 100}%` }]} /></View>
                  <Pressable accessibilityLabel="Aumentar distância" disabled={distanceKm === 20} onPress={() => setDistanceKm((value) => Math.min(20, value + 1))} style={styles.distanceStepButton}><Text style={styles.distanceStepText}>+</Text></Pressable>
                </View>
              )}
              <View style={styles.distanceEndpoints}><Text style={styles.distanceEndpointText}>1 km</Text><Text style={styles.distanceEndpointText}>20 km</Text></View>
            </View>
          </View>

          <View onLayout={(event) => setMapSectionY(event.nativeEvent.layout.y)} style={styles.section}>
            <Text style={styles.sectionTitle}>Mais próximos primeiro</Text>
            <Text style={styles.sectionSubtitle}>Resultados registrados no Perambulando e ordenados pela distância real.</Text>

            {categories.length > 0 ? <View style={styles.categoryFilter}>
              <Pressable accessibilityRole="button" accessibilityState={{ selected: selectedCategoryIds.length === 0 }} onPress={() => { if (selectedCategoryIds.length === 0) { return; } requestVersion.current += 1; lastLoadedQuery.current = ''; setSelectedCategoryIds([]); setSelectedItem(null); setMapFocusKey(undefined); if (coordinates) { setState('loading'); setMessage('Exibindo todas as categorias...'); } }} style={[styles.categoryBullet, selectedCategoryIds.length === 0 && styles.categoryBulletActive]}><Text style={[styles.categoryBulletText, selectedCategoryIds.length === 0 && styles.categoryBulletTextActive]}>Todas</Text></Pressable>
              {categories.map((category) => {
                const selected = selectedCategoryIds.includes(category.id);
                return <Pressable accessibilityRole="button" accessibilityState={{ selected }} key={category.id} onPress={() => toggleCategory(category.id)} style={[styles.categoryBullet, selected && styles.categoryBulletActive]}><Text style={[styles.categoryBulletText, selected && styles.categoryBulletTextActive]}>{category.name}</Text></Pressable>;
              })}
            </View> : null}

            {selectedCategoryIds.length > 0 ? <Text style={styles.sectionSubtitle}>{categories.filter((category) => selectedCategoryIds.includes(category.id)).map((category) => category.name).join(' + ')}{'\n'}Mostrando locais de qualquer uma das categorias selecionadas.</Text> : null}

            {showStateCard ? (
              <View accessibilityRole={state === 'error' ? 'alert' : undefined} style={[styles.stateCard, state === 'error' && styles.errorCard]}>
                {state === 'locating' || state === 'loading' ? <ActivityIndicator color={colors.orange} /> : <Text style={styles.stateIcon}>⌖</Text>}
                <Text style={[styles.stateTitle, state === 'error' && styles.errorText]}>
                  {state === 'idle' ? 'Encontre o que está por perto' : state === 'denied' ? 'Permissão necessária' : state === 'services-off' ? 'Localização desativada' : state === 'empty' ? 'Nada por aqui ainda' : state === 'error' ? 'Localização indisponível' : 'Localizando você'}
                </Text>
                <Text style={styles.stateMessage}>{message}</Text>
                {state === 'denied' || state === 'services-off' || state === 'error' || state === 'empty' ? <Pressable onPress={requestLocation} style={styles.outlineButton}><Text style={styles.outlineButtonText}>Tentar novamente</Text></Pressable> : null}
              </View>
            ) : null}

            {state === 'ready' && coordinates ? (
              <View style={styles.mapArea}>
                <View style={styles.mapFrame}>
                  <NearbyMap focusKey={mapFocusKey} items={mapItems} onSelect={setSelectedItem} origin={coordinates} />
                  {selectedItem ? (
                    <View style={styles.selectedCard}>
                      <Pressable accessibilityLabel="Fechar detalhes do local" accessibilityRole="button" onPress={(event) => { event.stopPropagation(); setSelectedItem(null); }} style={styles.closeCardButton}>
                        <Text style={styles.closeCardText}>×</Text>
                      </Pressable>
                      <Pressable accessibilityRole="button" accessibilityLabel={`Ver ${selectedItem.type === 'Host' ? 'estabelecimento' : 'programação'} ${selectedItem.name}`} onPress={() => openItem(selectedItem)} style={styles.selectedOpen}>
                      {selectedItem.imageUrl ? <Image resizeMode="cover" source={{ uri: selectedItem.imageUrl }} style={styles.selectedImage} /> : <View style={styles.selectedFallback}><Text style={styles.selectedFallbackText}>{selectedItem.name.charAt(0).toUpperCase()}</Text></View>}
                      <View style={styles.selectedCopy}>
                        <Text style={styles.selectedType}>{selectedItem.type === 'Programming' ? 'PROGRAMAÇÃO' : 'ESTABELECIMENTO'} · {formatDistance(selectedItem.distanceMeters)}</Text>
                        <Text numberOfLines={1} style={styles.selectedName}>{selectedItem.name}</Text>
                        <Text numberOfLines={2} style={styles.selectedDescription}>{selectedItem.description || selectedItem.address}</Text>
                        <Text numberOfLines={1} style={styles.selectedAddress}>⌖ {selectedItem.address}</Text>
                        <View style={styles.detailsButton}><Text style={styles.detailsButtonText}>{selectedItem.type === 'Programming' ? 'Ver programação' : 'Ver estabelecimento'} ›</Text></View>
                      </View>
                      </Pressable>
                      <RoadmapButton kind={selectedItem.type === 'Host' ? 'host' : 'programming'} id={selectedItem.id} name={selectedItem.name} />
                    </View>
                  ) : null}
                </View>
                {hasMore ? <Pressable disabled={loadingMore} onPress={loadMore} style={styles.moreButton}>{loadingMore ? <ActivityIndicator color={colors.ink} /> : <Text style={styles.moreButtonText}>Carregar mais</Text>}</Pressable> : null}
                <View style={styles.nearestSection}>
                  <Text style={styles.nearestTitle}>Mais perto de mim</Text>
                  <Text style={styles.nearestSubtitle}>Os cinco eventos ou estabelecimentos com menor distância.</Text>
                  <View style={styles.nearestList}>
                    {nearestItems.map((item, index) => (
                      <View key={`${item.type}-${item.id}`}><Pressable accessibilityHint={item.type === 'Host' ? 'Abre descrição, horários e eventos do estabelecimento' : 'Centraliza o mapa e abre o card deste local'} accessibilityRole="button" key={`${item.type}-${item.id}`} onPress={() => item.type === 'Host' ? openItem(item) : focusItemOnMap(item)} style={({ pressed }) => [styles.nearestCard, selectedItem?.id === item.id && selectedItem.type === item.type && styles.nearestCardSelected, pressed && styles.pressed]}>
                        <View style={styles.nearestPosition}><Text style={styles.nearestPositionText}>{index + 1}</Text></View>
                        {item.imageUrl ? <Image resizeMode="cover" source={{ uri: item.imageUrl }} style={styles.nearestImage} /> : <View style={styles.nearestFallback}><Text style={styles.nearestFallbackText}>{item.name.charAt(0).toUpperCase()}</Text></View>}
                        <View style={styles.nearestCopy}>
                          <Text style={styles.nearestType}>{item.type === 'Programming' ? 'PROGRAMAÇÃO' : 'ESTABELECIMENTO'}</Text>
                          <Text numberOfLines={1} style={styles.nearestName}>{item.name}</Text>
                          <Text style={styles.nearestDistance}>⌖ {formatDistance(item.distanceMeters)}</Text>
                        </View>
                        <Text style={styles.nearestArrow}>›</Text>
                      </Pressable><RoadmapButton kind={item.type === 'Host' ? 'host' : 'programming'} id={item.id} name={item.name} /></View>
                    ))}
                  </View>
                </View>
                {message ? <Text accessibilityRole="alert" style={styles.inlineError}>{message}</Text> : null}
              </View>
            ) : null}
          </View>
        </ScrollView>

        <AppBottomNav active="nearby" mode="user" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  selectedOpen: { flex: 1, minWidth: 0, flexDirection: 'row', gap: 11 },
  viewport: { flex: 1, alignItems: 'center', backgroundColor: '#E6DED2' },
  appShell: { flex: 1, maxWidth: 760, minWidth: 0, overflow: 'hidden', backgroundColor: colors.background, borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#DDD8D2' },
  header: { minHeight: 70, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.line },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  brandName: { color: colors.ink, fontSize: 18, fontWeight: '700', letterSpacing: -0.5 },
  brandNameFredoka: { fontFamily: 'Fredoka_700Bold', fontWeight: 'normal' },
  brandMark: { width: 40, height: 40 },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.ink },
  avatarText: { color: colors.card, fontSize: 14, fontWeight: '800' },
  scrollContent: { paddingBottom: 36 },
  hero: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12, backgroundColor: colors.hero },
  heroEyebrow: { color: '#A9D7C2', fontSize: 8, fontWeight: '800', letterSpacing: 1.4 },
  heroTitle: { maxWidth: 350, marginTop: 4, color: colors.card, fontSize: 20, lineHeight: 23, letterSpacing: -0.6 },
  heroSubtitle: { maxWidth: 340, marginTop: 4, color: '#CDD8E5', fontSize: 10, lineHeight: 14 },
  locationButton: { minHeight: 36, marginTop: 9, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 12, backgroundColor: colors.orange },
  locationButtonIcon: { color: colors.card, fontSize: 14, fontWeight: '800' },
  locationButtonText: { flexShrink: 1, color: colors.card, fontSize: 10, fontWeight: '800', textAlign: 'center' },
  section: { paddingHorizontal: 20, paddingVertical: 22, borderBottomWidth: 1, borderBottomColor: colors.line },
  sectionTitle: { color: colors.ink, fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  sectionSubtitle: { marginTop: 5, color: colors.muted, fontSize: 10, lineHeight: 15 },
  categoryFilter: { marginTop: 14, flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  categoryBullet: { minHeight: 32, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 16, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card },
  categoryBulletActive: { borderColor: colors.orange, backgroundColor: colors.orangeSoft },
  categoryBulletText: { color: colors.muted, fontSize: 9, fontWeight: '700' },
  categoryBulletTextActive: { color: colors.orange, fontWeight: '800' },
  distanceControl: { marginTop: 14, padding: 14, borderRadius: 18, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card },
  distanceHeader: { marginBottom: 5, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  distanceHint: { flex: 1, color: colors.muted, fontSize: 10, lineHeight: 14 },
  distanceValue: { minWidth: 62, minHeight: 32, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: colors.orangeSoft },
  distanceValueText: { color: colors.orange, fontSize: 12, fontWeight: '800' },
  distanceEndpoints: { marginTop: -2, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  distanceEndpointText: { color: colors.muted, fontSize: 9, fontWeight: '700' },
  nativeDistanceControls: { minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: 10 },
  distanceStepButton: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 17, backgroundColor: colors.orangeSoft },
  distanceStepText: { color: colors.orange, fontSize: 20, lineHeight: 22, fontWeight: '800' },
  nativeDistanceTrack: { flex: 1, height: 6, overflow: 'hidden', borderRadius: 3, backgroundColor: colors.line },
  nativeDistanceFill: { height: '100%', borderRadius: 3, backgroundColor: colors.orange },
  stateCard: { minHeight: 190, marginTop: 16, padding: 20, alignItems: 'center', justifyContent: 'center', gap: 9, borderRadius: 20, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card },
  errorCard: { borderColor: '#FFB4AA', backgroundColor: '#FFF3F1' },
  stateIcon: { color: colors.orange, fontSize: 28 },
  stateTitle: { color: colors.ink, fontSize: 14, fontWeight: '800', textAlign: 'center' },
  errorText: { color: colors.danger },
  stateMessage: { maxWidth: 300, color: colors.muted, fontSize: 11, lineHeight: 17, textAlign: 'center' },
  outlineButton: { minWidth: 155, minHeight: 42, marginTop: 4, alignItems: 'center', justifyContent: 'center', borderRadius: 12, borderWidth: 1, borderColor: colors.ink },
  outlineButtonText: { color: colors.ink, fontSize: 10, fontWeight: '800' },
  mapArea: { marginTop: 16, gap: 10 },
  mapFrame: { position: 'relative', height: 285, overflow: 'hidden', borderRadius: 22, borderWidth: 1, borderColor: colors.line, backgroundColor: '#E8EEE9' },
  nativeMapFallback: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#E8EEE9' },
  nativeMapIcon: { color: colors.orange, fontSize: 30 },
  nativeMapText: { maxWidth: 240, color: colors.muted, fontSize: 11, lineHeight: 17, textAlign: 'center' },
  selectedCard: { position: 'absolute', left: 12, right: 12, bottom: 12, minHeight: 145, padding: 11, paddingRight: 36, flexDirection: 'column', gap: 11, borderRadius: 18, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card, ...Platform.select({ web: { boxShadow: '0 8px 24px rgba(0,43,92,0.24)' }, default: { elevation: 8 } }) },
  closeCardButton: { position: 'absolute', top: 7, right: 7, width: 28, height: 28, zIndex: 3, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: colors.orangeSoft },
  closeCardText: { color: colors.orange, fontSize: 22, lineHeight: 23, fontWeight: '700' },
  selectedImage: { width: 94, minHeight: 123, borderRadius: 14 },
  selectedFallback: { width: 94, minHeight: 123, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: colors.ink },
  selectedFallbackText: { color: colors.card, fontSize: 28, fontWeight: '800' },
  selectedCopy: { flex: 1, minWidth: 0, paddingTop: 3 },
  selectedType: { paddingRight: 12, color: colors.orange, fontSize: 8, fontWeight: '800', letterSpacing: 0.4 },
  selectedName: { marginTop: 4, paddingRight: 8, color: colors.ink, fontSize: 14, lineHeight: 18, fontWeight: '800' },
  selectedDescription: { marginTop: 4, color: colors.muted, fontSize: 9, lineHeight: 13 },
  selectedAddress: { marginTop: 4, color: colors.muted, fontSize: 8, lineHeight: 11 },
  detailsButton: { alignSelf: 'flex-start', minHeight: 27, marginTop: 7, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center', borderRadius: 9, backgroundColor: colors.ink },
  detailsButtonText: { color: colors.card, fontSize: 8, fontWeight: '800' },
  moreButton: { minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 13, borderWidth: 1, borderColor: colors.ink, backgroundColor: colors.card },
  moreButtonText: { color: colors.ink, fontSize: 11, fontWeight: '800' },
  nearestSection: { marginTop: 12, paddingTop: 18, borderTopWidth: 1, borderTopColor: colors.line },
  nearestTitle: { color: colors.ink, fontSize: 18, fontWeight: '800', letterSpacing: -0.4 },
  nearestSubtitle: { marginTop: 4, color: colors.muted, fontSize: 10, lineHeight: 15 },
  nearestList: { marginTop: 12, gap: 8 },
  nearestCard: { minHeight: 72, padding: 8, flexDirection: 'row', alignItems: 'center', gap: 9, borderRadius: 16, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card },
  nearestCardSelected: { borderColor: colors.orange, backgroundColor: colors.orangeSoft },
  nearestPosition: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: colors.ink },
  nearestPositionText: { color: colors.card, fontSize: 9, fontWeight: '800' },
  nearestImage: { width: 54, height: 54, borderRadius: 12 },
  nearestFallback: { width: 54, height: 54, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: colors.ink },
  nearestFallbackText: { color: colors.card, fontSize: 18, fontWeight: '800' },
  nearestCopy: { flex: 1, minWidth: 0 },
  nearestType: { color: colors.orange, fontSize: 7, fontWeight: '800', letterSpacing: 0.7 },
  nearestName: { marginTop: 3, color: colors.ink, fontSize: 12, lineHeight: 15, fontWeight: '800' },
  nearestDistance: { marginTop: 4, color: colors.muted, fontSize: 9 },
  nearestArrow: { color: colors.orange, fontSize: 23 },
  inlineError: { color: colors.danger, fontSize: 10, lineHeight: 15, textAlign: 'center' },
  bottomNav: { minHeight: 72, paddingHorizontal: 6, paddingBottom: 5, flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.card },
  navItem: { flex: 1, minHeight: 56, alignItems: 'center', justifyContent: 'center', gap: 4, borderRadius: 12 },
  navItemActive: { backgroundColor: colors.orangeSoft },
  navIcon: { color: '#8C8C93', fontSize: 18 },
  navLabel: { color: '#8C8C93', fontSize: 8, textAlign: 'center' },
  navTextActive: { color: colors.orange, fontWeight: '800' },
  pressed: { opacity: 0.7 },
});

