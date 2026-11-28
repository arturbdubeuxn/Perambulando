import RoadmapButton from './RoadmapButton';
import { Fredoka_700Bold } from '@expo-google-fonts/fredoka/700Bold';
import { useFonts } from 'expo-font';
import { router, useFocusEffect, useLocalSearchParams, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState, type ComponentRef } from 'react';
import { ActivityIndicator, Image, Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import AppBottomNav from './components/AppBottomNav';
import { responsiveShellWidth } from './theme/responsive';
import { openingDayLabels, openingDayOrder } from './openingHours';
import { groupHostEvents, hostEventDate, hostEventStatus, type HostDetails, type HostEvent } from './hostDetails';
import NearbyPlaces from './NearbyPlaces';
import NearbyDestinationList from './NearbyDestinationList';
import type { NearbyPin } from './nearbyPins';
import HostPhotoGallery from './HostPhotoGallery';
import AddressMap, { type AddressCoordinates } from './AddressMap';
import { geocodeAddress } from './addressLocation';
import referenceAddresses from '../assets/enderecos-demonstracao-recife.json';
import { useFavorite } from './useFavorite';

const colors = { ink: '#002B5C', orange: '#FF5A0A', background: '#F8F5EE', card: '#FFFEFC', line: '#E7E0D6', muted: '#667085' };
const apiBaseUrl = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:5014').replace(/\/$/, '');

function Cover({ uri, name, hero = false }: { uri: string; name: string; hero?: boolean }) {
  const [failed, setFailed] = useState(false);
  return uri && !failed ? <Image accessibilityLabel={`Imagem de ${name}`} source={{ uri }} resizeMode="cover" onError={() => setFailed(true)} style={hero ? styles.heroImage : styles.eventImage} /> : <View style={[styles.imageFallback, hero ? styles.heroImage : styles.eventImage]}><Text style={styles.imageInitial}>{name.charAt(0).toUpperCase() || 'P'}</Text></View>;
}

function EventRail({ title, description, events, now, management }: { title: string; description: string; events: HostEvent[]; now: number; management: boolean }) {
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const offset = useRef(0);
  const [canPrevious, setCanPrevious] = useState(false);
  const [canNext, setCanNext] = useState(events.length > 1);
  const { width } = useWindowDimensions();
  const cardWidth = Math.max(190, Math.min(300, width - 74));
  return <View style={styles.rail}>
    <View style={styles.sectionHeading}><View style={styles.headingCopy}><Text accessibilityRole="header" style={styles.sectionTitle}>{title} <Text style={styles.count}>{events.length}</Text></Text><Text style={styles.helper}>{description}</Text></View>
      {events.length > 1 ? <View style={styles.arrows}>
        <Pressable accessibilityRole="button" accessibilityLabel={`Anteriores em ${title}`} disabled={!canPrevious} onPress={() => scroll.current?.scrollTo({ x: Math.max(0, offset.current - cardWidth - 12), animated: true })} style={[styles.arrow, !canPrevious && styles.disabled]}><Text style={styles.arrowText}>‹</Text></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={`Próximos em ${title}`} disabled={!canNext} onPress={() => scroll.current?.scrollTo({ x: offset.current + cardWidth + 12, animated: true })} style={[styles.arrow, !canNext && styles.disabled]}><Text style={styles.arrowText}>›</Text></Pressable>
      </View> : null}
    </View>
    {events.length ? <>
      <Text style={styles.swipeHint}>Deslize para os lados para ver os eventos →</Text>
      <ScrollView horizontal ref={scroll} accessibilityLabel={title} showsHorizontalScrollIndicator contentContainerStyle={styles.eventList} scrollEventThrottle={16} onScroll={({ nativeEvent }) => { offset.current = nativeEvent.contentOffset.x; setCanPrevious(nativeEvent.contentOffset.x > 1); setCanNext(nativeEvent.contentSize.width - nativeEvent.layoutMeasurement.width - nativeEvent.contentOffset.x > 1); }}>
        {events.map((event) => <View key={event.id} style={{ width: cardWidth }}><Pressable accessibilityRole="button" accessibilityLabel={`${management ? 'Editar' : 'Ver'} evento ${event.name}`} key={event.id} onPress={() => router.push(management ? { pathname: '/editar_evento', params: { programmingId: String(event.id), hostId: String(event.hostId) } } : { pathname: '/programacao/[programmingId]', params: { programmingId: String(event.id), origin: 'estabelecimento' } } as Href)} style={({ pressed }) => [styles.eventCard, { width: cardWidth }, pressed && styles.pressed]}>
          <Cover uri={event.imageUrl} name={event.name} />
          <View style={styles.eventCopy}><Text style={styles.eyebrow}>{hostEventStatus(event, now)}</Text><Text style={styles.eventTitle}>{event.name}</Text><Text style={styles.eventDate}>{hostEventDate(event.startDate)}</Text><Text style={styles.helper}>Até {hostEventDate(event.endDate)}</Text><Text style={styles.eventPrice}>{event.isFree ? 'Grátis' : 'A partir de ' + new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(event.minPrice)}</Text><Text style={styles.body}>{event.description?.trim() || 'Descrição ainda não informada.'}</Text><Text style={styles.eventLink}>{management ? 'Editar evento' : 'Ver detalhes do evento'} ›</Text></View>
        </Pressable>{!management ? <RoadmapButton kind="programming" id={event.id} name={event.name} /> : null}</View>)}
      </ScrollView>
    </> : <View style={styles.empty}><Text style={styles.helper}>{title === 'Próximos eventos' ? 'Nenhum próximo evento publicado por este estabelecimento.' : 'Ainda não há eventos anteriores disponíveis neste estabelecimento.'}</Text></View>}
  </View>;
}

export default function HostDetailsScreen() {
  const { width: viewportWidth } = useWindowDimensions();
  const params = useLocalSearchParams<{ hostId?: string | string[]; origin?: string | string[] }>();
  const hostId = Number(Array.isArray(params.hostId) ? params.hostId[0] : params.hostId);
  const origin = Array.isArray(params.origin) ? params.origin[0] : params.origin;
  const management = origin === 'comercio-gestao';
  const { favorite, busy: favoriteBusy, message: favoriteMessage, toggle: toggleFavorite } = useFavorite(`host:${hostId}`);
  const [fontsLoaded] = useFonts({ Fredoka_700Bold });
  const [host, setHost] = useState<HostDetails | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [message, setMessage] = useState('Carregando estabelecimento...');
  const [reload, setReload] = useState(0);
  const [now, setNow] = useState(Date.now);
  const [mapAttempt, setMapAttempt] = useState(0);
  const [location, setLocation] = useState<{ address: HostDetails['address']; attempt: number; coordinates: AddressCoordinates | null; message: string } | null>(null);
  const loadedHostId = useRef<number | null>(null);
  const lastReload = useRef(-1);

  useFocusEffect(useCallback(() => {
    let active = true;
    const controller = new AbortController();
    const load = async () => {
      if (loadedHostId.current !== hostId || lastReload.current !== reload) {
        setState('loading');
        setHost(null);
      }
      lastReload.current = reload;
      if (!Number.isInteger(hostId) || hostId <= 0) {
        setState('error'); setMessage('O estabelecimento selecionado não é válido.'); return;
      }
      const token = Platform.OS === 'web' ? (globalThis as { sessionStorage?: { getItem: (key: string) => string | null } }).sessionStorage?.getItem('perambulando.accessToken') ?? '' : '';
      try {
        const response = await fetch(`${apiBaseUrl}/api/Host/Details/${hostId}`, { headers: { Accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, signal: controller.signal });
        const body = await response.json().catch(() => null);
        if (!active) {
          return;
        }
        if (!response.ok) {
          throw new Error(body?.detail || body?.title || 'Não foi possível carregar este estabelecimento.');
        }
        if (!body || body.id !== hostId || !Array.isArray(body.programmings)) {
          throw new Error('As informações do estabelecimento não estão disponíveis.');
        }
        loadedHostId.current = hostId;
        setHost(body as HostDetails); setNow(Date.now()); setState('ready');
      } catch (error) {
        if (!active || controller.signal.aborted) {
          return;
        }
        setState('error'); setMessage(error instanceof TypeError ? 'Não foi possível acessar o serviço. Verifique sua conexão e tente novamente.' : error instanceof Error ? error.message : 'Não foi possível carregar o estabelecimento.');
      }
    };
    void load();
    return () => { active = false; controller.abort(); };
  }, [hostId, reload]));

  const hostAddress = host?.address;
  useEffect(() => {
    if (!hostAddress) {
      return;
    }
    const controller = new AbortController();
    const storage = Platform.OS === 'web' ? globalThis.sessionStorage : null;
    geocodeAddress(hostAddress, referenceAddresses, storage, controller.signal)
      .then((coordinates) => {
        if (!controller.signal.aborted) {
          setLocation({ address: hostAddress, attempt: mapAttempt, coordinates, message: '' });
        }
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setLocation({ address: hostAddress, attempt: mapAttempt, coordinates: null, message: error instanceof Error ? error.message : 'Não foi possível localizar o endereço.' });
        }
      });
    return () => controller.abort();
  }, [hostAddress, mapAttempt]);

  const currentLocation = location?.address === hostAddress && location?.attempt === mapAttempt ? location : null;

  const events = useMemo(() => groupHostEvents(host?.programmings ?? [], now), [host, now]);
  const goBack = () => {
    if (router.canGoBack()) {
      router.back(); return;
    }
    if (management) {
      router.replace({ pathname: '/comercio', params: { gestao: '1' } } as Href); return;
    }
    router.replace(origin === 'nearby-map' ? '/perto_de_voce' : origin === 'favoritos' ? '/favoritos' : origin === 'comercio' ? '/comercio' : '/explorar');
  };
  const address = host ? [[host.address.street, host.address.number].filter(Boolean).join(', '), host.address.complement, host.address.neighborhood, host.address.city].filter(Boolean).join(' · ') : '';
  const openNearby = (item: NearbyPin) => router.push(item.type === 'Host'
    ? { pathname: '/estabelecimento', params: { hostId: String(item.id), origin: 'estabelecimento' } }
    : { pathname: '/programacao/[programmingId]', params: { programmingId: String(item.id), origin: 'estabelecimento' } } as Href);

  return <View style={styles.viewport}><View style={[styles.shell, { width: responsiveShellWidth(viewportWidth) }]}>
    <StatusBar style="dark" />
    <View style={styles.header}><Pressable accessibilityRole="button" accessibilityLabel={origin === 'nearby-map' ? 'Voltar ao mapa' : 'Voltar'} onPress={goBack} style={styles.back}><Text style={styles.backText}>‹</Text></Pressable><View style={styles.brand}><Text style={[styles.brandName, fontsLoaded && styles.brandFont]}>Perambulando</Text><Image accessibilityLabel="Marca Perambulando" source={require('../assets/perambulando-mark.png')} resizeMode="contain" style={styles.brandMark} /></View><View style={{ width: 36 }} /></View>
    <ScrollView contentContainerStyle={styles.content}>
      {state !== 'ready' || !host ? <View style={styles.stateCard}>
        {state === 'loading' ? <ActivityIndicator color={colors.orange} /> : null}
        <Text accessibilityRole="header" style={styles.sectionTitle}>{state === 'loading' ? 'Conhecendo o lugar...' : 'Estabelecimento indisponível'}</Text>
        <Text accessibilityRole={state === 'error' ? 'alert' : undefined} style={styles.body}>{message}</Text>
        {state === 'error' ? <Pressable accessibilityRole="button" onPress={() => setReload((value) => value + 1)} style={styles.secondaryButton}><Text style={styles.secondaryText}>Tentar novamente</Text></Pressable> : null}
        {state !== 'loading' ? <Pressable accessibilityRole="button" onPress={goBack} style={styles.primaryButton}><Text style={styles.primaryText}>{origin === 'nearby-map' ? 'Voltar ao mapa' : 'Voltar'}</Text></Pressable> : null}
      </View> : <>
        {favoriteMessage ? <Text accessibilityRole="status" style={styles.helper}>{favoriteMessage}</Text> : null}
        <View style={styles.heroCard}><View style={styles.heroImageFrame}><Cover key={host.logoUrl} uri={host.logoUrl} name={host.name} hero /><Pressable accessibilityRole="button" accessibilityLabel={favorite ? 'Remover estabelecimento dos favoritos' : 'Adicionar estabelecimento aos favoritos'} accessibilityState={{ selected: favorite, disabled: favoriteBusy || state !== 'ready' }} disabled={favoriteBusy || state !== 'ready'} onPress={toggleFavorite} style={({ pressed }) => [styles.favoriteButton, pressed && styles.pressed]}><Text style={[styles.favoriteIcon, favorite && styles.favoriteIconActive]}>{favorite ? '♥' : '♡'}</Text></Pressable></View><View style={styles.heroCopy}><Text style={styles.eyebrow}>{host.typeofhost === 1 ? 'GASTRONOMIA' : host.typeofhost === 2 ? 'COMÉRCIO' : 'PRODUTOR DE EVENTOS'}</Text><Text accessibilityRole="header" style={styles.title}>{host.name}</Text><Text selectable style={styles.body}>⌖ {address || 'Endereço ainda não informado.'}</Text>{host.phone ? <Text selectable style={styles.body}>Contato: {host.phone}</Text> : null}{host.minPrice != null && host.maxPrice != null ? <Text style={styles.helper}>Estimativa por pessoa: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(host.minPrice)} a {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(host.maxPrice)}</Text> : null}</View></View>
        {!management ? <RoadmapButton kind="host" id={host.id} name={host.name} /> : null}
        <View style={styles.card}><Text accessibilityRole="header" style={styles.sectionTitle}>Sobre o estabelecimento</Text><Text selectable style={styles.body}>{host.description?.trim() || 'Este estabelecimento ainda não publicou uma descrição.'}</Text></View>
        {host.typeofhost === 1 || host.typeofhost === 2 ? (
          <HostPhotoGallery key={host.id} hostId={host.id} hostName={host.name} management={management} />
        ) : null}
        <View style={styles.card}><Text accessibilityRole="header" style={styles.sectionTitle}>Dias e horários</Text><Text style={styles.helper}>Horários locais de atendimento</Text>
          {host.typeofhost === 0 ? <Text style={styles.body}>Atendimento conforme a programação. Consulte as datas e horários de cada evento.</Text> : host.openingWeek?.days?.length ? openingDayOrder.map((dayOfWeek) => {
            const day = host.openingWeek.days.find((item) => item.dayOfWeek === dayOfWeek);
            return <View key={dayOfWeek} style={styles.hoursRow}><Text style={styles.dayName}>{openingDayLabels[dayOfWeek]}</Text><View style={styles.periods}>{!day ? <Text style={styles.helper}>Não informado</Text> : day.isClosed ? <Text style={styles.closed}>Fechado</Text> : day.periods.length ? [...day.periods].sort((a, b) => a.openingTime.localeCompare(b.openingTime)).map((period, index) => <Text key={index} style={styles.hours}>{period.openingTime.slice(0, 5)}–{period.closingTime.slice(0, 5)}{period.closesNextDay ? ' (dia seguinte)' : ''}</Text>) : <Text style={styles.helper}>Horário não informado</Text>}</View></View>;
          }) : <Text style={styles.body}>O estabelecimento ainda não informou seus horários de funcionamento.</Text>}
        </View>
        <View style={styles.card}>
          <Text accessibilityRole="header" style={styles.sectionTitle}>Onde fica</Text>
          <AddressMap address={address} coordinates={currentLocation?.coordinates ?? null} loading={!currentLocation}
            message={currentLocation?.message ?? 'Localizando o endereço cadastrado…'}
            place={{ id: host.id, type: 'Host', name: host.name, imageUrl: host.logoUrl }} />
          {currentLocation && !currentLocation.coordinates ? (
            <Pressable accessibilityRole="button" onPress={() => setMapAttempt((attempt) => attempt + 1)} style={styles.primaryButton}>
              <Text style={styles.primaryText}>Tentar localizar novamente</Text>
            </Pressable>
          ) : null}
        </View>
        <EventRail key={`next-${host.id}`} title="Próximos eventos" description="O que acontece agora e o que vem por aí" events={events.upcoming} now={now} management={management} />
        <EventRail key={`past-${host.id}`} title="Eventos anteriores" description="Programações que já passaram por aqui" events={events.past} now={now} management={management} />
        <NearbyPlaces key={`nearby-${host.id}`} hostId={host.id} origin={currentLocation?.coordinates ?? null} locating={!currentLocation} onSelect={openNearby} />
        <NearbyDestinationList key={`nearby-destination-${host.id}`} kind="host" id={host.id} ownProgrammings={host.programmings} onSelect={openNearby} />
      </>}
    </ScrollView>
    {management
      ? <AppBottomNav active="commerce" mode="host" />
      : <AppBottomNav active={origin === 'roteiro' ? 'roadmap' : origin === 'nearby-map' ? 'nearby' : origin === 'favoritos' ? 'favorites' : origin === 'comercio' ? 'commerce' : 'explore'} lastItem={origin === 'comercio' ? 'commerce' : 'profile'} mode="user" />}
  </View></View>;
}

const styles = StyleSheet.create({
  heroImageFrame: { position: 'relative' },
  favoriteButton: { position: 'absolute', top: 12, right: 12, width: 38, height: 38, zIndex: 3, alignItems: 'center', justifyContent: 'center', borderRadius: 19, backgroundColor: colors.card, ...Platform.select({ web: { boxShadow: '0 4px 12px rgba(0,43,92,0.16)' }, default: { elevation: 4 } }) },
  favoriteIcon: { color: '#F25555', fontSize: 22, lineHeight: 24 }, favoriteIconActive: { color: '#EF4444' },
  viewport: { flex: 1, alignItems: 'center', backgroundColor: '#E6DED2' }, shell: { flex: 1, width: '100%', maxWidth: 760, minWidth: 0, backgroundColor: colors.background }, header: { minHeight: 70, paddingHorizontal: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderColor: colors.line, backgroundColor: colors.card }, brand: { flexDirection: 'row', alignItems: 'center', gap: 6 }, brandName: { color: colors.ink, fontSize: 18, fontWeight: '700' }, brandFont: { fontFamily: 'Fredoka_700Bold', fontWeight: 'normal' }, brandMark: { width: 40, height: 40 }, back: { width: 36, height: 40, borderRadius: 20, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' }, backText: { fontSize: 27, color: colors.ink },
  content: { padding: 16, paddingBottom: 32, gap: 20 }, heroCard: { borderRadius: 22, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card, overflow: 'hidden' }, heroImage: { width: '100%', height: 205 }, heroCopy: { padding: 18, gap: 10 }, title: { fontSize: 25, lineHeight: 31, fontWeight: '700', color: colors.ink, letterSpacing: -0.5 }, eyebrow: { fontSize: 9, letterSpacing: 1, fontWeight: '800', color: colors.orange }, body: { color: colors.muted, fontSize: 13, lineHeight: 21 }, helper: { color: colors.muted, fontSize: 11, lineHeight: 17 }, card: { padding: 18, borderRadius: 20, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card, gap: 12 }, sectionTitle: { color: colors.ink, fontSize: 18, fontWeight: '700' }, count: { color: colors.orange, fontSize: 14 },
  hoursRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between', paddingTop: 10, borderTopWidth: 1, borderColor: colors.line }, dayName: { color: colors.ink, fontSize: 11, fontWeight: '600', width: 100, lineHeight: 18 }, periods: { flex: 1, minWidth: 145, gap: 5 }, hours: { color: colors.ink, fontSize: 11, lineHeight: 18 }, closed: { color: colors.muted, fontSize: 11, lineHeight: 18 },
  rail: { minWidth: 0, gap: 9 }, sectionHeading: { flexDirection: 'row', alignItems: 'center', gap: 8 }, headingCopy: { flex: 1, gap: 5 }, arrows: { flexDirection: 'row', gap: 5 }, arrow: { width: 36, height: 38, borderRadius: 19, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' }, arrowText: { color: colors.ink, fontSize: 24 }, disabled: { opacity: 0.35 }, swipeHint: { color: colors.orange, fontSize: 10 }, eventList: { gap: 12, paddingBottom: 10, alignItems: 'flex-start' }, eventCard: { borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card }, eventImage: { width: '100%', height: 140 }, eventCopy: { padding: 15, gap: 8 }, eventTitle: { color: colors.ink, fontSize: 17, fontWeight: '700', lineHeight: 23 }, eventDate: { color: colors.ink, fontSize: 12, fontWeight: '600' }, eventPrice: { color: '#257A48', fontSize: 12, fontWeight: '700' }, eventLink: { color: colors.orange, fontSize: 11, fontWeight: '700', marginTop: 6 }, imageFallback: { backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' }, imageInitial: { fontSize: 40, fontWeight: '700', color: '#FFFFFF' }, empty: { padding: 18, borderRadius: 16, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card },
  stateCard: { minHeight: 280, padding: 22, gap: 16, justifyContent: 'center', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, borderRadius: 20 }, primaryButton: { minHeight: 44, padding: 12, borderRadius: 12, backgroundColor: colors.orange, alignItems: 'center', justifyContent: 'center' }, primaryText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' }, secondaryButton: { minHeight: 44, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' }, secondaryText: { color: colors.ink, fontSize: 12, fontWeight: '700' },
  nav: { minHeight: 74, paddingHorizontal: 5, paddingBottom: 6, flexDirection: 'row', borderTopWidth: 1, borderColor: colors.line, backgroundColor: colors.card }, navItem: { flex: 1, minHeight: 60, justifyContent: 'center', alignItems: 'center', gap: 5 }, navIcon: { fontSize: 20, color: '#8C8C93' }, navLabel: { fontSize: 8, color: '#8C8C93' }, createCircle: { width: 46, height: 46, marginTop: -16, borderRadius: 25, borderWidth: 3, borderColor: colors.card, backgroundColor: colors.orange, alignItems: 'center', justifyContent: 'center' }, createIcon: { color: '#FFFFFF', fontSize: 27, fontWeight: '300' }, orange: { color: colors.orange, fontWeight: '700' }, pressed: { opacity: 0.75 },
});
