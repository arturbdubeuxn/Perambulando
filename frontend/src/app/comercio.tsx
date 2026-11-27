import RoadmapButton from '../RoadmapButton';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';

import AppBottomNav from '../components/AppBottomNav';
import AppHeader from '../components/AppHeader';
import { responsiveShellWidth } from '../theme/responsive';
import { useUserInitial } from '../useUserInitial';

const colors = { ink: '#002B5C', orange: '#FF5A0A', orangeSoft: '#FFF0E7', background: '#F8F5EE', card: '#FFFEFC', line: '#E7E0D6', muted: '#667085', danger: '#B42318' };
const apiBaseUrl = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:5014').replace(/\/$/, '');

type Address = { city: string; street: string; number: string; complement: string; neighborhood: string; cep: string };
type Host = { id: number; typeofhost: number; logoUrl: string; instagranUrl: string; phone: string; name: string; description: string; minPrice?: number | null; maxPrice?: number | null; address: Address; isActive: boolean };
type HostType = 'all' | 'gastronomy' | 'commerce';
type LoadState = 'loading' | 'ready' | 'error';

async function loadHosts(type: HostType, search: string, management: boolean, token: string) {
  if (management && !token) {
    throw new Error('Entre com sua conta de host para gerenciar seus estabelecimentos.');
  }
  const query = new URLSearchParams({ Take: '100', Skip: '0' });
  if (type === 'all' || type === 'gastronomy') query.append('Types', '1');
  if (type === 'all' || type === 'commerce') query.append('Types', '2');
  if (search.trim()) query.set('Name', search.trim());
  const response = await fetch(`${apiBaseUrl}${management ? '/api/Host/GetAllHostsbyUserId' : `/api/Host/HostFilter?${query.toString()}`}`, { headers: { Accept: 'application/json', ...(management ? { Authorization: `Bearer ${token}` } : {}) } });
  const body = (await response.json().catch(() => null)) as Host[] | { detail?: string; title?: string } | null;
  if (!response.ok) {
    const error = body as { detail?: string; title?: string } | null;
    throw new Error(error?.detail || error?.title || 'Não foi possível carregar os estabelecimentos.');
  }
  const items = body as Host[];
  return {
    hasProfile: management && items.length > 0,
    items: items.filter((host) => host.isActive && (!management ||
      ((host.typeofhost === 1 || host.typeofhost === 2) &&
       (type === 'all' || host.typeofhost === (type === 'gastronomy' ? 1 : 2)) &&
       (!search.trim() || host.name.toLocaleLowerCase('pt-BR').includes(search.trim().toLocaleLowerCase('pt-BR')))))),
  };
}

function addressLabel(address: Address) {
  const street = [address.street, address.number].filter(Boolean).join(', ');
  return [street, address.neighborhood, address.city].filter(Boolean).join(' · ');
}

export default function CommerceScreen() {
  const params = useLocalSearchParams<{ gestao?: string }>();
  const management = params.gestao === '1';
  const [token] = useState(() => Platform.OS === 'web' ? (globalThis as { sessionStorage?: { getItem: (key: string) => string | null } }).sessionStorage?.getItem('perambulando.accessToken') ?? '' : '');
  const { width } = useWindowDimensions();
  const userInitial = useUserInitial();
  const [type, setType] = useState<HostType>('all');
  const [search, setSearch] = useState('');
  const [hosts, setHosts] = useState<Host[]>([]);
  const [state, setState] = useState<LoadState>('loading');
  const [message, setMessage] = useState('Carregando estabelecimentos...');
  const [hasProfile, setHasProfile] = useState(false);
  const requestId = useRef(0);

  useEffect(() => {
    const currentRequest = ++requestId.current;
    const timer = setTimeout(() => {
      setState('loading');
      loadHosts(type, search, management, token)
        .then((result) => {
          if (requestId.current !== currentRequest) return;
          setHosts(result.items);
          setHasProfile(result.hasProfile);
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
  }, [search, type, management, token]);

  const manageHost = (hostId: number, edit: boolean) => {
    if (Platform.OS === 'web') {
      (globalThis as { sessionStorage?: { setItem: (key: string, value: string) => void } }).sessionStorage?.setItem('perambulando.hostId', String(hostId));
    }
    if (edit) {
      router.push({ pathname: '/cadastro_host', params: { editarHost: '1', hostId: String(hostId), origem: 'comercio' } });
    } else {
      router.push('/meus_eventos');
    }
  };

  const openHostDetails = (hostId: number) => router.push({ pathname: '/estabelecimento', params: { hostId: String(hostId), origin: management ? 'comercio-gestao' : 'comercio' } } as Href);

  return (
    <View style={styles.viewport}>
      <View style={[styles.shell, { width: responsiveShellWidth(width) }]}>
        <StatusBar style="dark" />
        <AppHeader avatarLabel={management ? 'Voltar ao painel' : 'Abrir perfil'} initial={userInitial} onAvatarPress={() => router.push(management ? '/painel' : '/perfil' as Href)} />
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View><Text style={styles.eyebrow}>{management ? 'GESTÃO DO SEU NEGÓCIO' : 'ESTABELECIMENTOS'}</Text><Text style={styles.title}>{management ? 'Meus estabelecimentos' : 'Comércios para conhecer'}</Text><Text style={styles.subtitle}>{management ? 'Gerencie seus espaços, ajuste o funcionamento e acompanhe suas programações.' : 'Informações reais dos estabelecimentos cadastrados no Perambulando.'}</Text></View>
          {management && token && state === 'ready' ? <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/cadastro_host', params: { ...(hasProfile ? { novoHost: '1' } : {}), origem: 'comercio' } })} style={styles.managementPrimary}><Text style={styles.managementPrimaryText}>+ Cadastrar estabelecimento</Text></Pressable> : null}
          <View style={styles.searchBox}><Text style={styles.searchIcon}>⌕</Text><TextInput accessibilityLabel="Buscar estabelecimento" onChangeText={setSearch} placeholder="Buscar por nome" placeholderTextColor="#8A93A0" style={styles.searchInput} value={search} /></View>
          <View style={styles.filters}>
            {([{ id: 'all', label: 'Todos' }, { id: 'gastronomy', label: 'Gastronomia' }, { id: 'commerce', label: 'Comércio' }] as const).map((filter) => <Pressable accessibilityState={{ selected: type === filter.id }} key={filter.id} onPress={() => setType(filter.id)} style={[styles.filter, type === filter.id && styles.filterActive]}><Text style={[styles.filterText, type === filter.id && styles.filterTextActive]}>{filter.label}</Text></Pressable>)}
          </View>
          {state === 'loading' ? <View style={styles.stateCard}><ActivityIndicator color={colors.orange} /><Text style={styles.stateText}>Consultando o catálogo...</Text></View> : null}
          {state === 'error' ? <View style={[styles.stateCard, styles.errorCard]}><Text style={styles.errorTitle}>Comércios indisponíveis</Text><Text style={styles.stateText}>{message}</Text></View> : null}
          {state === 'ready' && hosts.length === 0 ? <View style={styles.stateCard}><Text style={styles.cardTitle}>{management ? 'Nenhum estabelecimento encontrado' : 'Nenhum resultado'}</Text><Text style={styles.stateText}>{management && !search && type === 'all' ? 'Seus perfis de gastronomia e comércio aparecerão aqui após o cadastro.' : 'Tente outro nome ou tipo de estabelecimento.'}</Text></View> : null}
          {state === 'ready' ? <View style={styles.list}>{hosts.map((host) => {
            return <View key={host.id} style={styles.card}>
              <Pressable accessibilityRole="button" accessibilityLabel={`Abrir estabelecimento ${host.name}`} onPress={() => openHostDetails(host.id)}>{host.logoUrl ? <Image resizeMode="cover" source={{ uri: host.logoUrl }} style={styles.hostImage} /> : <View style={styles.imageFallback}><Text style={styles.imageFallbackText}>{host.name.charAt(0).toUpperCase()}</Text></View>}</Pressable>
              <View style={styles.cardCopy}><Pressable accessibilityRole="button" accessibilityLabel={`Resumo de ${host.name}`} onPress={() => openHostDetails(host.id)}><Text style={styles.hostType}>{host.typeofhost === 1 ? 'GASTRONOMIA' : 'COMÉRCIO'}</Text><Text style={styles.cardTitle}>{host.name}</Text><Text numberOfLines={2} style={styles.description}>{host.description || 'Estabelecimento cadastrado no Perambulando.'}</Text><Text style={styles.address}>⌖ {addressLabel(host.address) || 'Endereço não informado'}</Text></Pressable>
                {management ? <View style={styles.managementActions}>
                  <Pressable accessibilityRole="button" accessibilityLabel={`Editar estabelecimento ${host.name}`} onPress={(event) => { event.stopPropagation(); manageHost(host.id, true); }} style={styles.managementPrimary}><Text style={styles.managementPrimaryText}>Editar estabelecimento e horários</Text></Pressable>
                  <Pressable accessibilityRole="button" accessibilityLabel={`Gerenciar eventos de ${host.name}`} onPress={(event) => { event.stopPropagation(); manageHost(host.id, false); }} style={styles.managementSecondary}><Text style={styles.managementSecondaryText}>Gerenciar eventos</Text></Pressable>
                </View> : null}
                <RoadmapButton kind="host" id={host.id} name={host.name} />
                <Pressable accessibilityHint="Exibe as informações do estabelecimento" accessibilityLabel={`Informações de ${host.name}`} accessibilityRole="button" onPress={() => openHostDetails(host.id)} style={{ minHeight: 44, justifyContent: 'center' }}><Text style={styles.expandText}>Ver estabelecimento</Text></Pressable>
              </View>
            </View>;
          })}</View> : null}
        </ScrollView>
        {management ? <AppBottomNav active="commerce" mode="host" /> : <AppBottomNav active="commerce" lastItem="commerce" mode="user" />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  managementActions: { marginTop: 14, gap: 8 },
  managementPrimary: { minHeight: 44, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.orange }, managementPrimaryText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800', textAlign: 'center' },
  managementSecondary: { minHeight: 42, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' }, managementSecondaryText: { color: colors.ink, fontSize: 11, fontWeight: '700' },
  managementNav: { minHeight: 78, alignItems: 'flex-end', paddingBottom: 7 }, createNav: { flex: 1.18, minHeight: 68, alignItems: 'center', justifyContent: 'flex-end', gap: 4 }, createCircle: { width: 48, height: 48, borderRadius: 24, borderWidth: 4, borderColor: colors.card, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.orange }, createPlus: { color: '#FFFFFF', fontSize: 25, lineHeight: 27 }, createLabel: { color: colors.orange, fontSize: 8, fontWeight: '800' },
  viewport: { flex: 1, alignItems: 'center', backgroundColor: '#E6DED2' }, shell: { flex: 1, maxWidth: 760, overflow: 'hidden', backgroundColor: colors.background, borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#DDD8D2' },
  header: { minHeight: 70, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: colors.line, backgroundColor: colors.card }, brand: { flexDirection: 'row', alignItems: 'center', gap: 7 }, brandName: { color: colors.ink, fontSize: 18, fontWeight: '700' }, brandFont: { fontFamily: 'Fredoka_700Bold', fontWeight: 'normal' }, mark: { width: 40, height: 40 }, avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.ink }, avatarText: { color: colors.card, fontWeight: '800' },
  content: { padding: 18, paddingBottom: 36, gap: 16 }, eyebrow: { color: colors.orange, fontSize: 10, fontWeight: '800', letterSpacing: 1.6 }, title: { marginTop: 8, color: colors.ink, fontSize: 30, lineHeight: 34, fontWeight: '700' }, subtitle: { marginTop: 7, color: colors.muted, fontSize: 12, lineHeight: 18 },
  searchBox: { minHeight: 48, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 14, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card }, searchIcon: { color: colors.ink, fontSize: 18 }, searchInput: { flex: 1, minHeight: 46, color: colors.ink, fontSize: 12, outlineStyle: 'none' } as never,
  filters: { flexDirection: 'row', gap: 7 }, filter: { flex: 1, minHeight: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 19, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card }, filterActive: { borderColor: colors.orange, backgroundColor: colors.orangeSoft }, filterText: { color: colors.muted, fontSize: 9, fontWeight: '700' }, filterTextActive: { color: colors.orange },
  stateCard: { minHeight: 150, padding: 20, alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 20, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card }, errorCard: { borderColor: '#FECACA', backgroundColor: '#FFF1F0' }, errorTitle: { color: colors.danger, fontSize: 16, fontWeight: '800' }, stateText: { color: colors.muted, fontSize: 11, lineHeight: 17, textAlign: 'center' },
  list: { gap: 12 }, card: { overflow: 'hidden', borderRadius: 20, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card }, hostImage: { width: '100%', height: 150 }, imageFallback: { height: 120, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.ink }, imageFallbackText: { color: colors.card, fontSize: 34, fontWeight: '800' }, cardCopy: { padding: 15 }, hostType: { color: colors.orange, fontSize: 8, fontWeight: '800', letterSpacing: 1.2 }, cardTitle: { marginTop: 5, color: colors.ink, fontSize: 18, fontWeight: '800' }, description: { marginTop: 7, color: colors.muted, fontSize: 11, lineHeight: 17 }, address: { marginTop: 9, color: colors.muted, fontSize: 10, lineHeight: 15 }, details: { marginTop: 12, paddingTop: 10, gap: 6, borderTopWidth: 1, borderTopColor: colors.line }, detailText: { color: colors.ink, fontSize: 10, lineHeight: 15 }, programmingTitle: { marginTop: 9, color: colors.orange, fontSize: 9, fontWeight: '800', letterSpacing: 1 }, programmingRow: { paddingVertical: 8, borderTopWidth: 1, borderTopColor: colors.line }, programmingName: { color: colors.ink, fontSize: 11, fontWeight: '800' }, programmingDate: { marginTop: 3, color: colors.muted, fontSize: 9 }, expandText: { marginTop: 12, color: colors.orange, fontSize: 10, fontWeight: '800' },
  pressed: { opacity: 0.72 }, bottomNav: { minHeight: 72, paddingHorizontal: 5, paddingBottom: 5, flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.card }, navItem: { flex: 1, minHeight: 56, alignItems: 'center', justifyContent: 'center', gap: 4, borderRadius: 12 }, navItemActive: { backgroundColor: colors.orangeSoft }, navIcon: { color: '#8C8C93', fontSize: 18 }, navLabel: { color: '#8C8C93', fontSize: 8 }, navActive: { color: colors.orange, fontWeight: '800' },
});
