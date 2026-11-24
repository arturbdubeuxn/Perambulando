import { Fredoka_700Bold } from '@expo-google-fonts/fredoka/700Bold';
import { useFonts } from 'expo-font';
import * as Location from 'expo-location';
import { router, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { createElement, type ComponentRef, type FormEvent, useCallback, useEffect, useId, useRef, useState } from 'react';
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
  description: string;
  address: string;
  imageUrl?: string;
  distanceMeters: number;
  latitude: number;
  longitude: number;
};
type NearbyResponse = { items: NearbyItem[]; skip: number; pageSize: number; hasMore: boolean };
type UserProfile = { name: string };
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

function NearbyMap({ focusKey, origin, items, onSelect }: { focusKey?: string; origin: Coordinates; items: NearbyItem[]; onSelect: (item: NearbyItem) => void }) {
  const mapId = `nearby-map-${useId()}`;

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const receiveSelection = (event: MessageEvent) => {
      const data = event.data as { source?: string; mapId?: string; key?: string } | null;
      if (data?.source !== 'perambulando-nearby-map' || data.mapId !== mapId || !data.key) return;
      const selected = items.find((item) => `${item.type}-${item.id}` === data.key);
      if (selected) onSelect(selected);
    };
    globalThis.addEventListener('message', receiveSelection);
    return () => globalThis.removeEventListener('message', receiveSelection);
  }, [items, mapId, onSelect]);

  if (Platform.OS !== 'web') {
    return (
      <View style={styles.nativeMapFallback}>
        <Text style={styles.nativeMapIcon}>⌖</Text>
        <Text style={styles.nativeMapText}>O mapa interativo está disponível na versão Web.</Text>
      </View>
    );
  }

  const markerData = JSON.stringify(items.map((item) => ({
    key: `${item.type}-${item.id}`,
    name: item.name,
    imageUrl: item.imageUrl ?? '',
    latitude: item.latitude,
    longitude: item.longitude,
  }))).replace(/</g, '\\u003c');
  const mapDocument = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
<style>
html,body,#map{height:100%;margin:0;background:#e8eee9} .leaflet-control-attribution{font:9px/1.2 Arial,sans-serif}
.place-marker{position:relative;width:70px;height:88px;filter:drop-shadow(0 6px 5px rgba(0,43,92,.3))}
.pin-body{position:absolute;top:10px;left:10px;width:50px;height:50px;border:3px solid #ff7a1a;border-radius:50% 50% 50% 0;box-sizing:border-box;background:linear-gradient(145deg,#ff7a1a,#ff4f00);transform:rotate(-45deg)}
.pin-photo{position:absolute;top:5px;left:5px;width:34px;height:34px;overflow:hidden;border:3px solid #fff;border-radius:50%;box-sizing:border-box;background:#fff;transform:rotate(45deg)}
.pin-photo img,.pin-photo span{width:100%;height:100%;object-fit:cover}
.pin-photo span{display:flex;align-items:center;justify-content:center;color:#002b5c;font:800 14px Arial,sans-serif;background:#fff}
.pin-shadow{position:absolute;left:17px;bottom:5px;width:36px;height:10px;border:4px solid #ff5a0a;border-radius:50%;box-sizing:border-box;opacity:.82}
.pin-rays{position:absolute;top:0;right:0;width:24px;height:27px}
.pin-rays i{position:absolute;display:block;width:13px;height:4px;border-radius:4px;background:#ff5a0a;transform-origin:left center}
.pin-rays i:nth-child(1){left:2px;top:4px;transform:rotate(-66deg)} .pin-rays i:nth-child(2){left:8px;top:10px;transform:rotate(-28deg)} .pin-rays i:nth-child(3){left:10px;top:18px;transform:rotate(6deg)}
.user-pin{width:18px;height:18px;border:4px solid #fff;border-radius:50%;background:#1976d2;box-shadow:0 2px 8px rgba(0,43,92,.38)}
</style></head><body><div id="map"></div><script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script><script>
(function(){
var items=${markerData}; var mapId=${JSON.stringify(mapId)}; var focusKey=${JSON.stringify(focusKey ?? '')}; var markers={};
var map=L.map('map',{zoomControl:true}).setView([${origin.latitude},${origin.longitude}],14);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; OpenStreetMap'}).addTo(map);
var bounds=L.latLngBounds([[${origin.latitude},${origin.longitude}]]);
L.marker([${origin.latitude},${origin.longitude}],{icon:L.divIcon({html:'<div class="user-pin"></div>',className:'',iconSize:[26,26],iconAnchor:[13,13]})}).addTo(map).bindTooltip('Sua localização');
function safe(value){return String(value||'').replace(/[&<>"']/g,function(char){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]})}
items.forEach(function(item){
  var visual=item.imageUrl?'<img src="'+safe(item.imageUrl)+'" alt="">':'<span>'+safe(item.name.charAt(0).toUpperCase())+'</span>';
  var marker='<div class="place-marker"><div class="pin-rays"><i></i><i></i><i></i></div><div class="pin-body"><div class="pin-photo">'+visual+'</div></div><div class="pin-shadow"></div></div>';
  var icon=L.divIcon({html:marker,className:'',iconSize:[70,88],iconAnchor:[35,82]});
  var placeMarker=L.marker([item.latitude,item.longitude],{icon:icon,title:item.name}).addTo(map).on('click',function(){parent.postMessage({source:'perambulando-nearby-map',mapId:mapId,key:item.key},'*')});
  markers[item.key]=placeMarker;
  bounds.extend([item.latitude,item.longitude]);
});
if(items.length){map.fitBounds(bounds,{padding:[45,45],maxZoom:16})}
if(focusKey&&markers[focusKey]){var focusedMarker=markers[focusKey];setTimeout(function(){map.flyTo(focusedMarker.getLatLng(),17,{duration:.65});focusedMarker.setZIndexOffset(1000)},180)}
})();
</script></body></html>`;

  return createElement('iframe', {
    srcDoc: mapDocument,
    title: 'Mapa dos locais mais próximos',
    sandbox: 'allow-scripts',
    style: { width: '100%', height: '100%', border: 0 },
  });
}

export default function NearMeScreen() {
  const { width: viewportWidth } = useWindowDimensions();
  const [fontsLoaded] = useFonts({ Fredoka_700Bold });
  const [token] = useState(getSessionToken);
  const [userInitial, setUserInitial] = useState('U');
  const [state, setState] = useState<ScreenState>('idle');
  const [message, setMessage] = useState('Toque em “Usar minha localização” para permitir o acesso.');
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [distanceKm, setDistanceKm] = useState(1);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [items, setItems] = useState<NearbyItem[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedItem, setSelectedItem] = useState<NearbyItem | null>(null);
  const [mapFocusKey, setMapFocusKey] = useState<string | undefined>();
  const [mapSectionY, setMapSectionY] = useState(0);
  const lastLoadedQuery = useRef('');
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
    const requiredTypes = selectedCategoryIds.length > 0 ? 1 : 2;
    while (response.hasMore && availableTypes.size < requiredTypes && combined.length < 50) {
      response = await loadNearby(location, maxDistanceKm, combined.length);
      combined.push(...response.items);
      availableTypes = new Set(combined.map((item) => item.type));
    }
    return { ...response, items: combined };
  }, [loadNearby, selectedCategoryIds.length]);

  const requestLocation = useCallback(async () => {
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
      setState('loading');
      setMessage('Calculando o que está perto de você...');
      const response = await loadMapItems(nextCoordinates, distanceKm);
      lastLoadedQuery.current = filterKey;
      setCoordinates(nextCoordinates);
      setItems(response.items);
      setSelectedItem(null);
      setMapFocusKey(undefined);
      setHasMore(response.hasMore);
      setState(response.items.length > 0 ? 'ready' : 'empty');
      setMessage(response.items.length > 0 ? '' : `Não encontramos resultados em até ${distanceKm} km.`);
    } catch (error) {
      setState('error');
      setMessage(error instanceof Error ? error.message : 'Não foi possível obter sua localização.');
    }
  }, [distanceKm, filterKey, loadMapItems]);

  useEffect(() => {
    let active = true;
    requestJson<Category[]>('/api/Category/GetallCategories')
      .then((result) => { if (active) setCategories(result.filter((category) => category.isActive)); })
      .catch(() => undefined);
    if (token) {
      requestJson<UserProfile>('/api/User/Profile', token)
        .then((profile) => {
          if (active) setUserInitial(profile.name.trim().charAt(0).toUpperCase() || 'U');
        })
        .catch(() => undefined);
    }
    return () => { active = false; };
  }, [token]);

  useEffect(() => {
    if (!coordinates || lastLoadedQuery.current === filterKey) return;
    let active = true;
    const timer = setTimeout(() => {
      void loadMapItems(coordinates, distanceKm)
        .then((response) => {
          if (!active) return;
          lastLoadedQuery.current = filterKey;
          setItems(response.items);
          setSelectedItem(null);
          setMapFocusKey(undefined);
          setHasMore(response.hasMore);
          setState(response.items.length > 0 ? 'ready' : 'empty');
          setMessage(response.items.length > 0 ? '' : `Não encontramos resultados em até ${distanceKm} km.`);
        })
        .catch((error) => {
          if (!active) return;
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
    setSelectedCategoryIds((current) => current.includes(categoryId) ? current.filter((id) => id !== categoryId) : [...current, categoryId]);
    setSelectedItem(null);
    setMapFocusKey(undefined);
    if (coordinates) {
      setState('loading');
      setMessage('Aplicando os filtros de categoria...');
    }
  };

  const loadMore = async () => {
    if (!coordinates || loadingMore) return;
    setLoadingMore(true);
    try {
      const response = await loadNearby(coordinates, distanceKm, items.length);
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
      router.push({ pathname: '/programacao/[programmingId]', params: { programmingId: String(item.id), origin: 'nearby-map' } } as Href);
    }
  };

  const focusItemOnMap = (item: NearbyItem) => {
    setSelectedItem(item);
    setMapFocusKey(`${item.type}-${item.id}`);
    pageScroll.current?.scrollTo({ animated: true, y: Math.max(0, mapSectionY - 12) });
  };

  const nearestItems = [...items].sort((left, right) => left.distanceMeters - right.distanceMeters).slice(0, 5);

  const showStateCard = state !== 'ready';

  return (
    <View style={styles.viewport}>
      <View style={[styles.appShell, { width: Math.min(viewportWidth, 430) }]}>
        <StatusBar style="dark" />
        <Header fontsLoaded={fontsLoaded} initial={userInitial} />

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
              <Pressable accessibilityRole="button" accessibilityState={{ selected: selectedCategoryIds.length === 0 }} onPress={() => { if (selectedCategoryIds.length === 0) return; setSelectedCategoryIds([]); setSelectedItem(null); setMapFocusKey(undefined); if (coordinates) { setState('loading'); setMessage('Exibindo todas as categorias...'); } }} style={[styles.categoryBullet, selectedCategoryIds.length === 0 && styles.categoryBulletActive]}><Text style={[styles.categoryBulletText, selectedCategoryIds.length === 0 && styles.categoryBulletTextActive]}>Todas</Text></Pressable>
              {categories.map((category) => {
                const selected = selectedCategoryIds.includes(category.id);
                return <Pressable accessibilityRole="button" accessibilityState={{ selected }} key={category.id} onPress={() => toggleCategory(category.id)} style={[styles.categoryBullet, selected && styles.categoryBulletActive]}><Text style={[styles.categoryBulletText, selected && styles.categoryBulletTextActive]}>{category.name}</Text></Pressable>;
              })}
            </View> : null}

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
                  <NearbyMap focusKey={mapFocusKey} items={items} onSelect={setSelectedItem} origin={coordinates} />
                  {selectedItem ? (
                    <Pressable accessibilityHint={selectedItem.type === 'Programming' ? 'Abre os detalhes desta programação' : undefined} accessibilityRole={selectedItem.type === 'Programming' ? 'button' : undefined} onPress={selectedItem.type === 'Programming' ? () => openItem(selectedItem) : undefined} style={styles.selectedCard}>
                      <Pressable accessibilityLabel="Fechar detalhes do local" accessibilityRole="button" onPress={(event) => { event.stopPropagation(); setSelectedItem(null); }} style={styles.closeCardButton}>
                        <Text style={styles.closeCardText}>×</Text>
                      </Pressable>
                      {selectedItem.imageUrl ? <Image resizeMode="cover" source={{ uri: selectedItem.imageUrl }} style={styles.selectedImage} /> : <View style={styles.selectedFallback}><Text style={styles.selectedFallbackText}>{selectedItem.name.charAt(0).toUpperCase()}</Text></View>}
                      <View style={styles.selectedCopy}>
                        <Text style={styles.selectedType}>{selectedItem.type === 'Programming' ? 'PROGRAMAÇÃO' : 'ESTABELECIMENTO'} · {formatDistance(selectedItem.distanceMeters)}</Text>
                        <Text numberOfLines={1} style={styles.selectedName}>{selectedItem.name}</Text>
                        <Text numberOfLines={2} style={styles.selectedDescription}>{selectedItem.description || selectedItem.address}</Text>
                        <Text numberOfLines={1} style={styles.selectedAddress}>⌖ {selectedItem.address}</Text>
                        {selectedItem.type === 'Programming' ? <Pressable accessibilityRole="button" onPress={(event) => { event.stopPropagation(); openItem(selectedItem); }} style={styles.detailsButton}><Text style={styles.detailsButtonText}>Ver programação</Text></Pressable> : null}
                      </View>
                    </Pressable>
                  ) : null}
                </View>
                {hasMore ? <Pressable disabled={loadingMore} onPress={loadMore} style={styles.moreButton}>{loadingMore ? <ActivityIndicator color={colors.ink} /> : <Text style={styles.moreButtonText}>Carregar mais</Text>}</Pressable> : null}
                <View style={styles.nearestSection}>
                  <Text style={styles.nearestTitle}>Mais perto de mim</Text>
                  <Text style={styles.nearestSubtitle}>Os cinco eventos ou estabelecimentos com menor distância.</Text>
                  <View style={styles.nearestList}>
                    {nearestItems.map((item, index) => (
                      <Pressable accessibilityHint="Centraliza o mapa e abre o card deste local" accessibilityRole="button" key={`${item.type}-${item.id}`} onPress={() => focusItemOnMap(item)} style={({ pressed }) => [styles.nearestCard, selectedItem?.id === item.id && selectedItem.type === item.type && styles.nearestCardSelected, pressed && styles.pressed]}>
                        <View style={styles.nearestPosition}><Text style={styles.nearestPositionText}>{index + 1}</Text></View>
                        {item.imageUrl ? <Image resizeMode="cover" source={{ uri: item.imageUrl }} style={styles.nearestImage} /> : <View style={styles.nearestFallback}><Text style={styles.nearestFallbackText}>{item.name.charAt(0).toUpperCase()}</Text></View>}
                        <View style={styles.nearestCopy}>
                          <Text style={styles.nearestType}>{item.type === 'Programming' ? 'PROGRAMAÇÃO' : 'ESTABELECIMENTO'}</Text>
                          <Text numberOfLines={1} style={styles.nearestName}>{item.name}</Text>
                          <Text style={styles.nearestDistance}>⌖ {formatDistance(item.distanceMeters)}</Text>
                        </View>
                        <Text style={styles.nearestArrow}>›</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
                {message ? <Text accessibilityRole="alert" style={styles.inlineError}>{message}</Text> : null}
              </View>
            ) : null}
          </View>
        </ScrollView>

        <View style={styles.bottomNav}>
          <NavItem icon="⌾" label="Explorar" onPress={() => router.push('/explorar' as Href)} />
          <NavItem icon="⌕" label="Buscar" onPress={() => router.push('/explorar' as Href)} />
          <NavItem active icon="⌖" label="Perto de você" />
          <NavItem icon="♡" label="Favoritos" onPress={() => router.push('/favoritos' as Href)} />
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
  selectedCard: { position: 'absolute', left: 12, right: 12, bottom: 12, minHeight: 145, padding: 11, paddingRight: 36, flexDirection: 'row', gap: 11, borderRadius: 18, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card, ...Platform.select({ web: { boxShadow: '0 8px 24px rgba(0,43,92,0.24)' }, default: { elevation: 8 } }) },
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
