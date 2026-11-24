import { Fredoka_700Bold } from '@expo-google-fonts/fredoka/700Bold';
import { useFonts } from 'expo-font';
import { router, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';

const colors = { ink: '#002B5C', orange: '#FF5A0A', orangeSoft: '#FFF0E7', background: '#F8F5EE', card: '#FFFEFC', line: '#E7E0D6', muted: '#667085', danger: '#B42318' };
const apiBaseUrl = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:5014').replace(/\/$/, '');

type Address = { city: string; street: string; number: string; complement: string; neighborhood: string; cep: string };
type Host = { id: number; typeofhost: number; logoUrl: string; instagranUrl: string; phone: string; name: string; description: string; minPrice?: number | null; maxPrice?: number | null; address: Address; isActive: boolean };
type Programming = { id: number; hostId: number; name: string; startDate: string; isActive: boolean };
type HostType = 'all' | 'gastronomy' | 'commerce';
type LoadState = 'loading' | 'ready' | 'error';

async function loadHosts(type: HostType, search: string) {
  const query = new URLSearchParams({ Take: '100', Skip: '0' });
  if (type === 'all' || type === 'gastronomy') query.append('Types', '1');
  if (type === 'all' || type === 'commerce') query.append('Types', '2');
  if (search.trim()) query.set('Name', search.trim());
  const response = await fetch(`${apiBaseUrl}/api/Host/HostFilter?${query.toString()}`, { headers: { Accept: 'application/json' } });
  const body = (await response.json().catch(() => null)) as Host[] | { detail?: string; title?: string } | null;
  if (!response.ok) {
    const error = body as { detail?: string; title?: string } | null;
    throw new Error(error?.detail || error?.title || 'Não foi possível carregar os estabelecimentos.');
  }
  return (body as Host[]).filter((host) => host.isActive);
}

function addressLabel(address: Address) {
  const street = [address.street, address.number].filter(Boolean).join(', ');
  return [street, address.neighborhood, address.city].filter(Boolean).join(' · ');
}

function NavItem({ active = false, icon, label, onPress }: { active?: boolean; icon: string; label: string; onPress?: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ selected: active }} onPress={onPress} style={({ pressed }) => [styles.navItem, active && styles.navItemActive, pressed && styles.pressed]}><Text style={[styles.navIcon, active && styles.navActive]}>{icon}</Text><Text style={[styles.navLabel, active && styles.navActive]}>{label}</Text></Pressable>;
}

export default function CommerceScreen() {
  const { width } = useWindowDimensions();
  const [fontsLoaded] = useFonts({ Fredoka_700Bold });
  const [type, setType] = useState<HostType>('all');
  const [search, setSearch] = useState('');
  const [hosts, setHosts] = useState<Host[]>([]);
  const [state, setState] = useState<LoadState>('loading');
  const [message, setMessage] = useState('Carregando estabelecimentos...');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [programmingsByHost, setProgrammingsByHost] = useState<Record<number, Programming[]>>({});
  const [loadingHostId, setLoadingHostId] = useState<number | null>(null);
  const requestId = useRef(0);

  useEffect(() => {
    const currentRequest = ++requestId.current;
    const timer = setTimeout(() => {
      setState('loading');
      loadHosts(type, search)
        .then((items) => {
          if (requestId.current !== currentRequest) return;
          setHosts(items);
          setState('ready');
          setMessage('');
        })
        .catch((error) => {
          if (requestId.current !== currentRequest) return;
          setHosts([]);
          setState('error');
          setMessage(error instanceof TypeError ? `Não foi possível acessar ${apiBaseUrl}. Verifique se a API está ativa.` : error instanceof Error ? error.message : 'Não foi possível carregar os estabelecimentos.');
        });
    }, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [search, type]);

  const toggleHost = async (hostId: number) => {
    if (expandedId === hostId) { setExpandedId(null); return; }
    setExpandedId(hostId);
    if (programmingsByHost[hostId]) return;
    setLoadingHostId(hostId);
    try {
      const response = await fetch(`${apiBaseUrl}/api/Programming/Filter?HostId=${hostId}&Take=100&Skip=0`, { headers: { Accept: 'application/json' } });
      const body = (await response.json().catch(() => null)) as Programming[] | null;
      setProgrammingsByHost((current) => ({ ...current, [hostId]: response.ok && body ? body.filter((item) => item.isActive) : [] }));
    } finally {
      setLoadingHostId((current) => current === hostId ? null : current);
    }
  };

  return (
    <View style={styles.viewport}>
      <View style={[styles.shell, { width: Math.min(width, 430) }]}>
        <StatusBar style="dark" />
        <View style={styles.header}>
          <View style={styles.brand}><Text style={[styles.brandName, fontsLoaded && styles.brandFont]}>Perambulando</Text><Image accessibilityLabel="Marca Perambulando" resizeMode="contain" source={require('../../assets/perambulando-mark.png')} style={styles.mark} /></View>
          <Pressable accessibilityLabel="Abrir perfil" onPress={() => router.push('/perfil' as Href)} style={styles.avatar}><Text style={styles.avatarText}>U</Text></Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View><Text style={styles.eyebrow}>ESTABELECIMENTOS</Text><Text style={styles.title}>Comércios para conhecer</Text><Text style={styles.subtitle}>Informações reais dos estabelecimentos cadastrados no Perambulando.</Text></View>
          <View style={styles.searchBox}><Text style={styles.searchIcon}>⌕</Text><TextInput accessibilityLabel="Buscar estabelecimento" onChangeText={setSearch} placeholder="Buscar por nome" placeholderTextColor="#8A93A0" style={styles.searchInput} value={search} /></View>
          <View style={styles.filters}>
            {([{ id: 'all', label: 'Todos' }, { id: 'gastronomy', label: 'Gastronomia' }, { id: 'commerce', label: 'Comércio' }] as const).map((filter) => <Pressable accessibilityState={{ selected: type === filter.id }} key={filter.id} onPress={() => setType(filter.id)} style={[styles.filter, type === filter.id && styles.filterActive]}><Text style={[styles.filterText, type === filter.id && styles.filterTextActive]}>{filter.label}</Text></Pressable>)}
          </View>
          {state === 'loading' ? <View style={styles.stateCard}><ActivityIndicator color={colors.orange} /><Text style={styles.stateText}>Consultando o catálogo...</Text></View> : null}
          {state === 'error' ? <View style={[styles.stateCard, styles.errorCard]}><Text style={styles.errorTitle}>Comércios indisponíveis</Text><Text style={styles.stateText}>{message}</Text></View> : null}
          {state === 'ready' && hosts.length === 0 ? <View style={styles.stateCard}><Text style={styles.cardTitle}>Nenhum resultado</Text><Text style={styles.stateText}>Tente outro nome ou tipo de estabelecimento.</Text></View> : null}
          {state === 'ready' ? <View style={styles.list}>{hosts.map((host) => {
            const expanded = expandedId === host.id;
            return <Pressable accessibilityHint="Exibe as informações do estabelecimento" accessibilityRole="button" key={host.id} onPress={() => void toggleHost(host.id)} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
              {host.logoUrl ? <Image resizeMode="cover" source={{ uri: host.logoUrl }} style={styles.hostImage} /> : <View style={styles.imageFallback}><Text style={styles.imageFallbackText}>{host.name.charAt(0).toUpperCase()}</Text></View>}
              <View style={styles.cardCopy}><Text style={styles.hostType}>{host.typeofhost === 1 ? 'GASTRONOMIA' : 'COMÉRCIO'}</Text><Text style={styles.cardTitle}>{host.name}</Text><Text numberOfLines={expanded ? undefined : 2} style={styles.description}>{host.description || 'Estabelecimento cadastrado no Perambulando.'}</Text><Text style={styles.address}>⌖ {addressLabel(host.address) || 'Endereço não informado'}</Text>
                {expanded ? <View style={styles.details}><Text style={styles.detailText}>Telefone: {host.phone || 'Não informado'}</Text><Text style={styles.detailText}>Instagram: {host.instagranUrl || 'Não informado'}</Text>{host.minPrice != null && host.maxPrice != null ? <Text style={styles.detailText}>Faixa estimada: R$ {host.minPrice.toFixed(2).replace('.', ',')} a R$ {host.maxPrice.toFixed(2).replace('.', ',')}</Text> : null}<Text style={styles.programmingTitle}>Programações</Text>{loadingHostId === host.id ? <ActivityIndicator color={colors.orange} /> : (programmingsByHost[host.id]?.length ?? 0) > 0 ? programmingsByHost[host.id].map((programming) => <Pressable key={programming.id} onPress={(event) => { event.stopPropagation(); router.push({ pathname: '/programacao/[programmingId]', params: { programmingId: String(programming.id) } } as Href); }} style={styles.programmingRow}><Text style={styles.programmingName}>{programming.name}</Text><Text style={styles.programmingDate}>{new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(programming.startDate))}</Text></Pressable>) : <Text style={styles.detailText}>Nenhuma programação publicada.</Text>}</View> : null}
                <Text style={styles.expandText}>{expanded ? 'Ocultar informações' : 'Ver informações'}</Text>
              </View>
            </Pressable>;
          })}</View> : null}
        </ScrollView>
        <View style={styles.bottomNav}><NavItem icon="⌾" label="Explorar" onPress={() => router.push('/explorar' as Href)} /><NavItem icon="⌕" label="Buscar" onPress={() => router.push('/explorar' as Href)} /><NavItem icon="⌖" label="Perto de você" onPress={() => router.push('/perto_de_voce' as Href)} /><NavItem icon="♡" label="Favoritos" onPress={() => router.push('/explorar' as Href)} /><NavItem active icon="▥" label="Comércio" /></View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  viewport: { flex: 1, alignItems: 'center', backgroundColor: '#E6DED2' }, shell: { flex: 1, maxWidth: 430, overflow: 'hidden', backgroundColor: colors.background, borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#DDD8D2' },
  header: { minHeight: 70, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: colors.line, backgroundColor: colors.card }, brand: { flexDirection: 'row', alignItems: 'center', gap: 7 }, brandName: { color: colors.ink, fontSize: 18, fontWeight: '700' }, brandFont: { fontFamily: 'Fredoka_700Bold', fontWeight: 'normal' }, mark: { width: 40, height: 40 }, avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.ink }, avatarText: { color: colors.card, fontWeight: '800' },
  content: { padding: 18, paddingBottom: 36, gap: 16 }, eyebrow: { color: colors.orange, fontSize: 10, fontWeight: '800', letterSpacing: 1.6 }, title: { marginTop: 8, color: colors.ink, fontSize: 30, lineHeight: 34, fontWeight: '700' }, subtitle: { marginTop: 7, color: colors.muted, fontSize: 12, lineHeight: 18 },
  searchBox: { minHeight: 48, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 14, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card }, searchIcon: { color: colors.ink, fontSize: 18 }, searchInput: { flex: 1, minHeight: 46, color: colors.ink, fontSize: 12, outlineStyle: 'none' } as never,
  filters: { flexDirection: 'row', gap: 7 }, filter: { flex: 1, minHeight: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 19, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card }, filterActive: { borderColor: colors.orange, backgroundColor: colors.orangeSoft }, filterText: { color: colors.muted, fontSize: 9, fontWeight: '700' }, filterTextActive: { color: colors.orange },
  stateCard: { minHeight: 150, padding: 20, alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 20, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card }, errorCard: { borderColor: '#FECACA', backgroundColor: '#FFF1F0' }, errorTitle: { color: colors.danger, fontSize: 16, fontWeight: '800' }, stateText: { color: colors.muted, fontSize: 11, lineHeight: 17, textAlign: 'center' },
  list: { gap: 12 }, card: { overflow: 'hidden', borderRadius: 20, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card }, hostImage: { width: '100%', height: 150 }, imageFallback: { height: 120, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.ink }, imageFallbackText: { color: colors.card, fontSize: 34, fontWeight: '800' }, cardCopy: { padding: 15 }, hostType: { color: colors.orange, fontSize: 8, fontWeight: '800', letterSpacing: 1.2 }, cardTitle: { marginTop: 5, color: colors.ink, fontSize: 18, fontWeight: '800' }, description: { marginTop: 7, color: colors.muted, fontSize: 11, lineHeight: 17 }, address: { marginTop: 9, color: colors.muted, fontSize: 10, lineHeight: 15 }, details: { marginTop: 12, paddingTop: 10, gap: 6, borderTopWidth: 1, borderTopColor: colors.line }, detailText: { color: colors.ink, fontSize: 10, lineHeight: 15 }, programmingTitle: { marginTop: 9, color: colors.orange, fontSize: 9, fontWeight: '800', letterSpacing: 1 }, programmingRow: { paddingVertical: 8, borderTopWidth: 1, borderTopColor: colors.line }, programmingName: { color: colors.ink, fontSize: 11, fontWeight: '800' }, programmingDate: { marginTop: 3, color: colors.muted, fontSize: 9 }, expandText: { marginTop: 12, color: colors.orange, fontSize: 10, fontWeight: '800' },
  pressed: { opacity: 0.72 }, bottomNav: { minHeight: 72, paddingHorizontal: 5, paddingBottom: 5, flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.card }, navItem: { flex: 1, minHeight: 56, alignItems: 'center', justifyContent: 'center', gap: 4, borderRadius: 12 }, navItemActive: { backgroundColor: colors.orangeSoft }, navIcon: { color: '#8C8C93', fontSize: 18 }, navLabel: { color: '#8C8C93', fontSize: 8 }, navActive: { color: colors.orange, fontWeight: '800' },
});
