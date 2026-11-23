import { Fredoka_700Bold } from '@expo-google-fonts/fredoka/700Bold';
import { useFonts } from 'expo-font';
import { router, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { type ComponentRef, useEffect, useRef, useState } from 'react';
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

type UserProfile = {
  name: string;
};

type StorageLike = {
  getItem: (key: string) => string | null;
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

function EventCard({ programming }: { programming: Programming }) {
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
    <Pressable
      accessibilityHint="Abre os detalhes desta programação"
      accessibilityRole="button"
      onPress={openProgramming}
      style={({ pressed }) => [styles.eventCard, pressed && styles.eventCardPressed]}
    >
      <View style={styles.eventImageFrame}>
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
      </View>

      <View style={styles.eventContent}>
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
      </View>
    </Pressable>
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
  const [categories, setCategories] = useState<Category[]>([]);
  const [programmings, setProgrammings] = useState<Programming[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [searchText, setSearchText] = useState('');
  const [state, setState] = useState<LoadState>('loading');
  const [message, setMessage] = useState('Buscando experiências para você...');
  const [userInitial, setUserInitial] = useState('U');
  const programmingRequest = useRef(0);
  const searchInput = useRef<ComponentRef<typeof TextInput>>(null);

  useEffect(() => {
    let active = true;
    requestJson<Category[]>('/api/Category/GetallCategories')
      .then((items) => {
        if (active) setCategories(items.filter((item) => item.isActive).slice(0, 6));
      })
      .catch((error) => {
        if (active) {
          setState('error');
          setMessage(error instanceof Error ? error.message : 'Não foi possível carregar as categorias.');
        }
      });

    const token = getSessionToken();
    if (token) {
      requestJson<UserProfile>('/api/User/Profile', { headers: { Authorization: `Bearer ${token}` } })
        .then((profile) => {
          if (active) setUserInitial(profile.name.trim().charAt(0).toUpperCase() || 'U');
        })
        .catch(() => undefined);
    }

    return () => {
      active = false;
    };
  }, []);

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

  return (
    <View style={styles.viewport}>
      <View style={[styles.appShell, { width: Math.min(viewportWidth, 430) }]}>
        <StatusBar style="dark" />
        <Header fontsLoaded={fontsLoaded} initial={userInitial} />

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator>
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
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Qual é a sua vibe?</Text>
            <Text style={styles.sectionSubtitle}>Escolha uma categoria e deixe a cidade te levar.</Text>
            {categories.length > 0 ? (
              <View style={styles.categoryGrid}>
                {categories.map((category, index) => (
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
              <View style={styles.eventList}>
                {programmings.map((programming) => <EventCard key={programming.id} programming={programming} />)}
              </View>
            ) : null}
          </View>
        </ScrollView>

        <View style={styles.bottomNav}>
          <NavItem active icon="⌾" label="Explorar" />
          <NavItem icon="⌕" label="Buscar" onPress={() => searchInput.current?.focus()} />
          <NavItem icon="⌖" label="Perto de você" onPress={() => router.push('/perto_de_voce' as Href)} />
          <NavItem icon="♡" label="Favoritos" />
          <NavItem icon="♙" label="Perfil" onPress={() => router.push('/perfil' as Href)} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
  inlineLoading: { minHeight: 100, alignItems: 'center', justifyContent: 'center' },
  sectionHeadingRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 },
  sectionHeadingCopy: { flex: 1 },
  seeAll: { color: colors.orange, fontSize: 10, fontWeight: '800' },
  eventList: { marginTop: 16, gap: 16 },
  eventCard: { overflow: 'hidden', borderRadius: 20, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card },
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
