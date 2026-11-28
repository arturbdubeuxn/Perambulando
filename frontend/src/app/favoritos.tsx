import RoadmapButton from '../RoadmapButton';
import { router, type Href, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { getFavoriteKeys as getLocalKeys, storeFavoriteKeys as storeLocalKeys } from '../favorites';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Image, Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import AppBottomNav from '../components/AppBottomNav';
import AppHeader from '../components/AppHeader';
import { responsiveShellWidth } from '../theme/responsive';
import { useUserInitial } from '../useUserInitial';

const gridGap = 12;
const contentPadding = 16;

const colors = { ink: '#002B5C', orange: '#FF5A0A', orangeSoft: '#FFF0E7', background: '#F8F5EE', card: '#FFFEFC', line: '#E7E0D6', muted: '#667085', danger: '#B42318', success: '#257A48' };
const apiBaseUrl = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:5014').replace(/\/$/, '');
const accessTokenStorageKey = 'perambulando.accessToken';


type StorageLike = { getItem: (key: string) => string | null; setItem?: (key: string, value: string) => void };
type Category = { id: number; name: string; isActive: boolean };
type Address = { city: string; street: string; number: string; neighborhood: string };
type Programming = { id: number; name: string; description: string; startDate: string; isActive?: boolean; isFree: boolean; imageUrl: string; minPrice: number; maxPrice: number; address: Address; categories: Category[] };
type Host = { id: number; typeofhost: number; logoUrl: string; name: string; description: string; address: Address; isActive: boolean };
type FavoriteItem = { key: string; kind: 'programming'; programming: Programming } | { key: string; kind: 'host'; host: Host };
type FavoriteResponse = { programmingId: number };
type LoadState = 'loading' | 'ready' | 'empty' | 'error';

function getStorage(name: 'localStorage' | 'sessionStorage') {
  if (Platform.OS !== 'web') return undefined;
  return (globalThis as { localStorage?: StorageLike; sessionStorage?: StorageLike })[name];
}

function getToken() { return getStorage('sessionStorage')?.getItem(accessTokenStorageKey) ?? ''; }

async function requestJson<T>(path: string, init: RequestInit = {}) {
  const response = await fetch(`${apiBaseUrl}${path}`, { ...init, headers: { Accept: 'application/json', ...init.headers } });
  const body = (await response.json().catch(() => null)) as T | { detail?: string; title?: string } | null;
  if (!response.ok) {
    const error = body as { detail?: string; title?: string } | null;
    throw new Error(error?.detail || error?.title || 'Não foi possível carregar seus favoritos.');
  }
  return body as T;
}

async function loadFavoriteHosts(ids: number[]) {
  if (ids.length === 0) return [];
  const wanted = new Set(ids);
  const found = new Map<number, Host>();
  let skip = 0;
  const take = 100;
  while (wanted.size > 0) {
    const hosts = await requestJson<Host[]>(`/api/Host/HostFilter?Types=0&Types=1&Types=2&Take=${take}&Skip=${skip}`);
    hosts.forEach((host) => {
      if (wanted.has(host.id) && host.isActive) {
        found.set(host.id, host);
        wanted.delete(host.id);
      }
    });
    if (hosts.length < take) break;
    skip += take;
  }
  return [...found.values()];
}

function hostTypeLabel(type: number) {
  if (type === 0) return 'Produtor de eventos';
  if (type === 1) return 'Gastronomia';
  return 'Comércio';
}

function favoriteCategories(item: FavoriteItem): string[] {
  if (item.kind === 'host') {
    return [hostTypeLabel(item.host.typeofhost)];
  }
  const labels = item.programming.categories.filter((category) => category.isActive).map((category) => category.name);
  return item.programming.isFree ? [...labels, 'Gratuito'] : labels;
}

function categoryKey(label: string) {
  return label.trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function dateLabel(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Data a confirmar' : new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(date).replace('.', '').toUpperCase();
}

function priceLabel(item: Programming) {
  if (item.isFree) return 'GRÁTIS';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.minPrice);
}

function addressLabel(address: Address) { return [address.street, address.number, address.neighborhood, address.city].filter(Boolean).join(' · '); }

export default function FavoritesScreen() {
  const { width } = useWindowDimensions();
  const shellWidth = responsiveShellWidth(width);
  const cardWidth = Math.max(0, (shellWidth - 2 - contentPadding * 2 - gridGap) / 2);
  const imageHeight = Math.min(190, Math.max(112, cardWidth * 0.56));
  const [token] = useState(getToken);
  const initial = useUserInitial();
  const [items, setItems] = useState<FavoriteItem[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [state, setState] = useState<LoadState>('loading');
  const [message, setMessage] = useState('Carregando seus rolês salvos...');
  const [removingKeys, setRemovingKeys] = useState<string[]>([]);

  useFocusEffect(useCallback(() => {
    let active = true;
    const load = async () => {
      try {
        const localKeys = getLocalKeys();
        const localIds = localKeys.filter((key) => key.startsWith('programming:')).map((key) => Number(key.split(':')[1])).filter(Number.isInteger);
        const localHostIds = localKeys.filter((key) => key.startsWith('host:')).map((key) => Number(key.split(':')[1])).filter(Number.isInteger);
        let ids = [...new Set(localIds)];
        if (token) {
          const serverFavorites = await requestJson<FavoriteResponse[]>('/api/Favorite/GetAllByUserId', { headers: { Authorization: `Bearer ${token}` } }).catch(() => null);
          if (serverFavorites) {
            const serverIds = new Set(serverFavorites.map((favorite) => favorite.programmingId));
            await Promise.all(localIds.filter((id) => !serverIds.has(id)).map((id) => requestJson(`/api/Favorite/${id}/Create`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } }).then(() => serverIds.add(id)).catch(() => undefined)));
            ids = [...new Set([...localIds, ...serverIds])];
            storeLocalKeys([...getLocalKeys().filter((key) => key.startsWith('host:')), ...ids.map((id) => `programming:${id}`)]);
          }
        }
        const [details, favoriteHosts] = await Promise.all([
          Promise.all(ids.map((id) => requestJson<Programming>(`/api/Programming/Details/${id}`).catch(() => null))),
          loadFavoriteHosts([...new Set(localHostIds)]).catch(() => []),
        ]);
        if (!active) return;
        const programmingById = new Map(details.filter((item): item is Programming => item !== null).map((item) => [item.id, item]));
        const hostById = new Map(favoriteHosts.map((host) => [host.id, host]));
        const orderedKeys = [...localKeys, ...ids.map((id) => `programming:${id}`)].filter((key, index, keys) => keys.indexOf(key) === index);
        const available = orderedKeys.flatMap<FavoriteItem>((key) => {
          const [kind, rawId] = key.split(':');
          const id = Number(rawId);
          if (kind === 'programming') {
            const programming = programmingById.get(id);
            return programming ? [{ key, kind, programming }] : [];
          }
          const host = hostById.get(id);
          return kind === 'host' && host ? [{ key, kind, host }] : [];
        });
        setItems(available);
        setState(available.length > 0 ? 'ready' : 'empty');
        setMessage(available.length > 0 ? '' : 'Você ainda não favoritou nenhuma programação ou estabelecimento.');
      } catch (error) {
        if (!active) return;
        setState('error');
        setMessage(error instanceof TypeError ? `Não foi possível acessar ${apiBaseUrl}. Verifique se a API está ativa.` : error instanceof Error ? error.message : 'Não foi possível carregar seus favoritos.');
      }
    };
    void load();
    return () => { active = false; };
  }, [token]));

  const removeFavorite = async (item: FavoriteItem) => {
    const id = item.kind === 'programming' ? item.programming.id : item.host.id;
    if (removingKeys.includes(item.key)) return;
    const previous = items;
    setRemovingKeys((current) => [...current, item.key]);
    setItems((current) => current.filter((favorite) => favorite.key !== item.key));
    setMessage('');
    const localKeys = getLocalKeys().filter((key) => key !== item.key);
    storeLocalKeys(localKeys);
    try {
      if (token && item.kind === 'programming') await requestJson(`/api/Favorite/${id}/Delete`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}` } });
      if (previous.length === 1) { setState('empty'); setMessage('Você ainda não favoritou nenhuma programação ou estabelecimento.'); }
    } catch {
      if (previous.length === 1) {
        setState('empty');
      }
      setMessage('Favorito removido neste navegador. Não foi possível sincronizar com a conta agora.');
    } finally {
      setRemovingKeys((current) => current.filter((key) => key !== item.key));
    }
  };

  const categorizedItems = items.map((item) => ({ item, labels: favoriteCategories(item) }));
  const categoryOptions = new Map(categorizedItems.flatMap(({ labels }) => labels.map((label) => [categoryKey(label), label] as const)));
  const sortedCategories = [...categoryOptions].sort(([, left], [, right]) => left.localeCompare(right, 'pt-BR'));
  const activeCategories = selectedCategories.filter((key) => categoryOptions.has(key));
  const visibleItems = categorizedItems
    .filter(({ labels }) => activeCategories.length === 0 || labels.some((label) => activeCategories.includes(categoryKey(label))))
    .map(({ item }) => item);

  return <View style={styles.viewport}><View style={[styles.shell, { width: shellWidth }]}><StatusBar style="dark" />
    <AppHeader initial={initial} />
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator>
      <View><Text style={styles.eyebrow}>SUA COLEÇÃO</Text><Text style={styles.title}>Rolês salvos</Text><Text style={styles.subtitle}>Suas programações e seus estabelecimentos favoritos, todos aqui.</Text></View>
      {state === 'loading' ? <View style={styles.stateCard}><ActivityIndicator color={colors.orange} /><Text style={styles.stateText}>{message}</Text></View> : null}
      {state === 'empty' ? <View style={styles.stateCard}><Text style={styles.stateIcon}>♡</Text><Text style={styles.stateTitle}>Nenhum favorito salvo</Text><Text style={styles.stateText}>{message}</Text><Pressable onPress={() => router.push('/explorar' as Href)} style={styles.exploreButton}><Text style={styles.exploreButtonText}>Explorar opções</Text></Pressable></View> : null}
      {state === 'error' ? <View style={[styles.stateCard, styles.errorCard]}><Text style={styles.errorTitle}>Favoritos indisponíveis</Text><Text style={styles.stateText}>{message}</Text></View> : null}
      {state === 'ready' && message ? <Text accessibilityRole="status" style={styles.stateText}>{message}</Text> : null}
      {items.length > 0 && sortedCategories.length > 0 ? (
        <View accessibilityLabel="Filtrar favoritos por categoria" style={styles.categoryFilters}>
          <Pressable accessibilityRole="button" accessibilityState={{ selected: activeCategories.length === 0 }}
            onPress={() => setSelectedCategories([])} style={[styles.filterBullet, activeCategories.length === 0 && styles.filterBulletActive]}>
            <Text style={[styles.filterBulletText, activeCategories.length === 0 && styles.filterBulletTextActive]}>Todas</Text>
          </Pressable>
          {sortedCategories.map(([key, label]) => {
            const selected = activeCategories.includes(key);
            return (
              <Pressable key={key} accessibilityRole="button" accessibilityState={{ selected }}
                onPress={() => setSelectedCategories(selected ? activeCategories.filter((category) => category !== key) : [...activeCategories, key])}
                style={[styles.filterBullet, selected && styles.filterBulletActive]}>
                <Text style={[styles.filterBulletText, selected && styles.filterBulletTextActive]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
      {visibleItems.length > 0 ? <View style={styles.grid}>{visibleItems.map((item) => {
        const isProgramming = item.kind === 'programming';
        const data = isProgramming ? item.programming : item.host;
        return <View key={item.key} style={[styles.card, { width: cardWidth }]}><Pressable accessibilityHint={isProgramming ? 'Abre os detalhes da programação' : 'Abre horários, descrição e eventos do estabelecimento'} accessibilityRole="button" key={item.key} onPress={() => isProgramming ? router.push({ pathname: '/programacao/[programmingId]', params: { programmingId: String(item.programming.id) } } as Href) : router.push({ pathname: '/estabelecimento', params: { hostId: String(item.host.id), origin: 'favoritos' } } as Href)} style={({ pressed }) => [styles.cardDetails, pressed && styles.pressed]}>
          <View style={[styles.imageFrame, { height: imageHeight }]}>{(isProgramming ? item.programming.imageUrl : item.host.logoUrl) ? <Image resizeMode="cover" source={{ uri: isProgramming ? item.programming.imageUrl : item.host.logoUrl }} style={styles.eventImage} /> : <View style={styles.imageFallback}><Image resizeMode="contain" source={require('../../assets/perambulando-mark.png')} style={styles.fallbackMark} /></View>}{isProgramming ? <View style={styles.dateBadge}><Text style={styles.dateDay}>{new Date(item.programming.startDate).getDate() || '--'}</Text><Text style={styles.dateMonth}>{new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(new Date(item.programming.startDate)).replace('.', '').toUpperCase()}</Text></View> : <View style={styles.hostBadge}><Text accessibilityLabel="Estabelecimento" style={styles.hostBadgeText}>{cardWidth < 170 ? 'LOCAL' : 'ESTABELECIMENTO'}</Text></View>}<Pressable accessibilityLabel={`Remover ${data.name} dos favoritos`} disabled={removingKeys.includes(item.key)} onPress={(event) => { event.stopPropagation(); void removeFavorite(item); }} style={styles.heartButton}>{removingKeys.includes(item.key) ? <ActivityIndicator color="#EF4444" /> : <Text style={styles.heart}>♥</Text>}</Pressable></View>
          {isProgramming ? <View style={styles.cardCopy}><View style={styles.categories}>{item.programming.categories.filter((category) => category.isActive).slice(0, 2).map((category) => <View key={category.id} style={styles.category}><Text style={styles.categoryText}>{category.name}</Text></View>)}</View><View style={styles.meta}><Text style={styles.date}>{dateLabel(item.programming.startDate)}</Text><Text style={[styles.price, item.programming.isFree && styles.free]}>{priceLabel(item.programming)}</Text></View><Text style={styles.eventName}>{item.programming.name}</Text><Text numberOfLines={2} style={styles.address}>⌖ {addressLabel(item.programming.address) || 'Local a confirmar'}</Text></View> : <View style={styles.cardCopy}><View style={styles.categories}><View style={styles.category}><Text style={styles.categoryText}>{hostTypeLabel(item.host.typeofhost)}</Text></View></View><Text style={styles.eventName}>{item.host.name}</Text><Text numberOfLines={3} style={styles.hostDescription}>{item.host.description || 'Conheça este estabelecimento.'}</Text><Text numberOfLines={2} style={styles.address}>⌖ {addressLabel(item.host.address) || 'Local a confirmar'}</Text></View>}
        </Pressable><RoadmapButton kind={item.kind} id={data.id} name={data.name} /></View>;
      })}</View> : null}
    </ScrollView>
    <AppBottomNav active="favorites" mode="user" />
  </View></View>;
}

const styles = StyleSheet.create({
  categoryFilters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterBullet: { minHeight: 36, paddingHorizontal: 12, justifyContent: 'center', borderRadius: 18, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card },
  filterBulletActive: { borderColor: colors.orange, backgroundColor: colors.orangeSoft },
  filterBulletText: { color: colors.ink, fontSize: 11, fontWeight: '700' },
  filterBulletTextActive: { color: '#9F3909', fontWeight: '800' },
  viewport: { flex: 1, alignItems: 'center', backgroundColor: '#E6DED2' }, shell: { flex: 1, maxWidth: 760, overflow: 'hidden', backgroundColor: colors.background, borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#DDD8D2' }, header: { minHeight: 70, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: colors.line, backgroundColor: colors.card }, brand: { flexDirection: 'row', alignItems: 'center', gap: 7 }, brandName: { color: colors.ink, fontSize: 18, fontWeight: '700' }, brandFont: { fontFamily: 'Fredoka_700Bold', fontWeight: 'normal' }, mark: { width: 40, height: 40 }, avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.ink }, avatarText: { color: colors.card, fontSize: 14, fontWeight: '800' },
  content: { padding: contentPadding, paddingTop: 26, paddingBottom: 36, gap: 18 }, eyebrow: { color: colors.orange, fontSize: 9, fontWeight: '800', letterSpacing: 1.6 }, title: { marginTop: 8, color: colors.ink, fontSize: 32, lineHeight: 36, fontWeight: '400', letterSpacing: -1.2 }, subtitle: { marginTop: 7, color: colors.muted, fontSize: 12, lineHeight: 18 }, grid: { flexDirection: 'row', flexWrap: 'wrap', gap: gridGap }, cardDetails: { flex: 1 }, card: { minWidth: 0, overflow: 'hidden', borderRadius: 20, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card }, imageFrame: { position: 'relative', backgroundColor: '#DCE7E9' }, eventImage: { width: '100%', height: '100%' }, imageFallback: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E9F1EF' }, fallbackMark: { width: 72, height: 72 }, dateBadge: { position: 'absolute', top: 12, left: 12, width: 48, height: 54, alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: colors.card }, dateDay: { color: colors.ink, fontSize: 17, lineHeight: 19, fontWeight: '800' }, dateMonth: { color: colors.orange, fontSize: 8, fontWeight: '800' }, hostBadge: { position: 'absolute', top: 12, left: 12, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10, backgroundColor: colors.card }, hostBadgeText: { color: colors.orange, fontSize: 8, fontWeight: '800', letterSpacing: 0.7 }, heartButton: { position: 'absolute', top: 12, right: 12, width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 21, backgroundColor: colors.card }, heart: { color: '#EF4444', fontSize: 24, lineHeight: 26 }, cardCopy: { padding: 14 }, categories: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 }, category: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 9, backgroundColor: colors.orangeSoft }, categoryText: { color: colors.orange, fontSize: 8, fontWeight: '800' }, meta: { marginTop: 10, flexDirection: 'row', justifyContent: 'space-between', gap: 10 }, date: { flex: 1, color: colors.orange, fontSize: 9, fontWeight: '800' }, price: { color: colors.ink, fontSize: 9, fontWeight: '800' }, free: { color: colors.success }, eventName: { marginTop: 7, color: colors.ink, fontSize: 18, lineHeight: 22, fontWeight: '800' }, hostDescription: { marginTop: 7, color: colors.muted, fontSize: 11, lineHeight: 16 }, address: { marginTop: 7, color: colors.muted, fontSize: 10, lineHeight: 15 },
  stateCard: { minHeight: 190, padding: 22, alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 20, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card }, errorCard: { borderColor: '#FECACA', backgroundColor: '#FFF1F0' }, stateIcon: { color: colors.orange, fontSize: 32 }, stateTitle: { color: colors.ink, fontSize: 16, fontWeight: '800' }, errorTitle: { color: colors.danger, fontSize: 16, fontWeight: '800' }, stateText: { color: colors.muted, fontSize: 11, lineHeight: 17, textAlign: 'center' }, exploreButton: { minHeight: 42, marginTop: 5, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: colors.ink }, exploreButtonText: { color: colors.card, fontSize: 10, fontWeight: '800' }, pressed: { opacity: 0.75 },
  bottomNav: { minHeight: 72, paddingHorizontal: 6, paddingBottom: 5, flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.card }, navItem: { flex: 1, minHeight: 56, alignItems: 'center', justifyContent: 'center', gap: 4, borderRadius: 12 }, navItemActive: { backgroundColor: colors.orangeSoft }, navIcon: { color: '#8C8C93', fontSize: 18 }, navLabel: { color: '#8C8C93', fontSize: 8, textAlign: 'center' }, navActive: { color: colors.orange, fontWeight: '800' },
});
