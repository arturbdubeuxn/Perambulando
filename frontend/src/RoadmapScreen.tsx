import { Fredoka_700Bold } from '@expo-google-fonts/fredoka/700Bold';
import { useFonts } from 'expo-font';
import { router, useFocusEffect, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import RoadmapButton from './RoadmapButton';
import { deleteRoadmap, formatRoadmapTime, getRoadmapDraft, listAccessibleRoadmaps, listRoadmaps, loadRoadmap, parseRoadmapTime, rememberVisitorRoadmap, resetRoadmapDraft, roadmapCatalogQueries, roadmapError, roadmapFromResponse, roadmapRequest, roadmapToken, saveRoadmap, storeRoadmapDraft, subscribeToRoadmap, type RoadmapDraft, type RoadmapKind, type RoadmapResponse, type RoadmapStop } from './roadmap';

const colors = { ink: '#002B5C', orange: '#FF5A0A', background: '#F8F5EE', card: '#FFFEFC', line: '#E7E0D6', muted: '#667085', green: '#257A48' };
type CatalogItem = { id: number; name: string; imageUrl?: string; logoUrl?: string; description: string; address?: { neighborhood: string; city: string }; startDate?: string; kind: RoadmapKind };
const explain = (error: unknown) => error instanceof Error ? error.message : 'Não foi possível concluir. Tente novamente.';
function openStop(stop: { kind: RoadmapKind; id: number }) {
  router.push(stop.kind === 'host' ? { pathname: '/estabelecimento', params: { hostId: String(stop.id), origin: 'roteiro' } } as Href : { pathname: '/programacao/[programmingId]', params: { programmingId: String(stop.id), origin: 'roteiro' } } as Href);
}
function Cover({ uri }: { uri?: string }) {
  const [failed, setFailed] = useState(false);
  return uri && !failed ? <Image source={{ uri }} onError={() => setFailed(true)} style={styles.cover} /> : <View style={[styles.cover, styles.coverFallback]}><Text style={styles.coverGlyph}>⌖</Text></View>;
}

function StopPicker({ close }: { close: () => void }) {
  const [hosts, setHosts] = useState(true); const [events, setEvents] = useState(true);
  const [hostTypes, setHostTypes] = useState<number[]>([]); const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [city, setCity] = useState('Recife'); const [text, setText] = useState('');
  const [items, setItems] = useState<CatalogItem[]>([]); const [page, setPage] = useState({ filter: '', skip: 0 }); const [hasMore, setHasMore] = useState(false);
  const [loadedFilter, setLoadedFilter] = useState('');
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading'); const [message, setMessage] = useState(''); const [reload, setReload] = useState(0);
  const filterKey = JSON.stringify({ hosts, events, hostTypes, categories: selectedCategories, city, text });
  const skip = page.filter === filterKey ? page.skip : 0;
  useEffect(() => {
    const controller = new AbortController();
    void roadmapRequest<{ id: number; name: string; isActive?: boolean }[]>('/api/Category/GetallCategories', { signal: controller.signal }).then((result) => setCategories(result.filter((item) => item.isActive !== false))).catch(() => undefined);
    return () => controller.abort();
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      setState('loading'); setMessage('');
      const queries = roadmapCatalogQueries(JSON.parse(filterKey), skip);
      void Promise.all([queries.hosts ? roadmapRequest<CatalogItem[]>(queries.hosts, { signal: controller.signal }) : [], queries.events ? roadmapRequest<CatalogItem[]>(queries.events, { signal: controller.signal }) : []]).then(([hostResults, eventResults]) => {
        if (controller.signal.aborted) { return; }
        const result = [...hostResults.map((item): CatalogItem => ({ ...item, kind: 'host' })), ...eventResults.map((item): CatalogItem => ({ ...item, kind: 'programming' }))];
        setItems((previous) => [...new Map([...(skip ? previous : []), ...result].map((item) => [`${item.kind}:${item.id}`, item])).values()]);
        setHasMore(hostResults.length === 20 || eventResults.length === 20); setLoadedFilter(filterKey); setState('ready');
      }).catch((error) => { if (!controller.signal.aborted) { setState('error'); setLoadedFilter(filterKey); setMessage(explain(error)); } });
    }, 300);
    return () => { clearTimeout(timeout); controller.abort(); };
  }, [filterKey, skip, reload]);
  const chip = (label: string, selected: boolean, action: () => void) => <Pressable key={label} accessibilityRole="button" accessibilityState={{ selected }} onPress={action} style={[styles.chip, selected && styles.chipSelected]}><Text style={[styles.chipText, selected && styles.orange]}>{label}</Text></Pressable>;
  const toggle = (ids: number[], id: number) => ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id];
  return <Modal visible transparent animationType="slide" onRequestClose={close}><View style={styles.overlay}><View style={styles.sheet}>
    <View style={styles.row}><Text accessibilityRole="header" style={styles.sectionTitle}>Adicionar uma parada</Text><Pressable accessibilityRole="button" accessibilityLabel="Fechar seleção de paradas" onPress={close} style={styles.close}><Text style={styles.closeText}>×</Text></Pressable></View>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.pickerContent}>
      <Text style={styles.body}>O que você quer encontrar? Combine locais, eventos e categorias.</Text>
      <View style={styles.chips}>{chip('Estabelecimentos', hosts, () => { if (events) { setHosts(!hosts); } })}{chip('Eventos', events, () => { if (hosts) { setEvents(!events); } })}</View>
      <TextInput accessibilityLabel="Cidade das paradas" placeholder="Cidade" value={city} onChangeText={setCity} style={styles.input} />
      <TextInput accessibilityLabel="Buscar paradas" placeholder="Buscar por nome ou evento" value={text} onChangeText={setText} style={styles.input} />
      {hosts ? <><Text style={styles.label}>Tipos de estabelecimento · seleção somada</Text><View style={styles.chips}>{[[1, 'Gastronomia'], [2, 'Comércio'], [0, 'Produtores de eventos']].map(([id, label]) => chip(String(label), hostTypes.includes(Number(id)), () => setHostTypes(toggle(hostTypes, Number(id)))))}</View></> : null}
      {events ? <><Text style={styles.label}>Categorias de eventos · seleção somada</Text><Text style={styles.small}>Sem seleção, mostramos todas. As categorias de eventos não restringem os estabelecimentos.</Text><View style={styles.chips}>{categories.map((category) => chip(category.name, selectedCategories.includes(category.id), () => setSelectedCategories(toggle(selectedCategories, category.id))))}</View></> : null}
      {state === 'loading' || loadedFilter !== filterKey ? <ActivityIndicator color={colors.orange} /> : null}
      {message ? <View><Text accessibilityRole="alert" style={styles.error}>{message}</Text><Pressable accessibilityRole="button" onPress={() => setReload((value) => value + 1)} style={styles.secondary}><Text style={styles.secondaryText}>Tentar novamente</Text></Pressable></View> : null}
      {state === 'ready' && !items.length ? <Text style={styles.body}>Nenhum local encontrado. Experimente outros filtros.</Text> : null}
      {(loadedFilter === filterKey ? items : []).map((item) => <View key={`${item.kind}:${item.id}`} style={styles.catalogCard}><Pressable accessibilityRole="button" accessibilityLabel={`Ver ${item.name}`} onPress={() => openStop(item)} style={styles.catalogSummary}><Cover uri={item.imageUrl ?? item.logoUrl} /><View style={styles.flex}><Text style={styles.eyebrow}>{item.kind === 'host' ? 'ESTABELECIMENTO' : 'PROGRAMAÇÃO'}</Text><Text style={styles.stopName}>{item.name}</Text><Text style={styles.small}>{[item.address?.neighborhood, item.address?.city].filter(Boolean).join(' · ')}</Text>{item.startDate ? <Text style={styles.small}>{formatRoadmapTime(item.startDate)}</Text> : null}<Text numberOfLines={2} style={styles.small}>{item.description}</Text></View></Pressable><RoadmapButton kind={item.kind} id={item.id} name={item.name} /></View>)}
      {hasMore && state === 'ready' ? <Pressable accessibilityRole="button" onPress={() => setPage({ filter: filterKey, skip: skip + 20 })} style={styles.secondary}><Text style={styles.secondaryText}>Carregar mais opções</Text></Pressable> : null}
    </ScrollView><Pressable accessibilityRole="button" onPress={close} style={styles.primary}><Text style={styles.primaryText}>Voltar para minha timeline</Text></Pressable>
  </View></View></Modal>;
}

export default function RoadmapScreen() {
  const [fontsLoaded] = useFonts({ Fredoka_700Bold });
  const [draft, setDraft] = useState(getRoadmapDraft); const [saved, setSaved] = useState<RoadmapResponse[]>([]);
  const [busy, setBusy] = useState(false); const [listing, setListing] = useState(false); const [message, setMessage] = useState(''); const [listError, setListError] = useState('');
  const [picker, setPicker] = useState(false); const [editing, setEditing] = useState<RoadmapStop | null>(null);
  const [start, setStart] = useState(''); const [end, setEnd] = useState(''); const [timeError, setTimeError] = useState('');
  const [confirm, setConfirm] = useState<{ title: string; text: string; run: () => void } | null>(null);
  const lock = useRef(false); const token = roadmapToken();
  useEffect(() => subscribeToRoadmap(() => setDraft(getRoadmapDraft())), []);
  useFocusEffect(useCallback(() => {
    let active = true; const session = roadmapToken(); setDraft(getRoadmapDraft()); setListError('');
    setListing(true);
    void listAccessibleRoadmaps().then((result) => { if (active && roadmapToken() === session) { setSaved(result); } }).catch((error) => { if (active) { setListError(explain(error)); } }).finally(() => { if (active) { setListing(false); } });
    return () => { active = false; };
  }, []));
  const update = (change: Partial<RoadmapDraft>) => storeRoadmapDraft({ ...getRoadmapDraft(), ...change, dirty: true });
  const protectDraft = (run: () => void) => {
    if (getRoadmapDraft().dirty) { setConfirm({ title: 'Trocar de roteiro?', text: 'Há alterações no roteiro atual que ainda não foram salvas. Ao continuar, elas serão descartadas.', run }); }
    else { run(); }
  };
  const select = async (id: number) => {
    if (lock.current) { return; }
    lock.current = true; setBusy(true); setMessage('');
    const revision = getRoadmapDraft().revision; const session = roadmapToken();
    try {
      const result = await loadRoadmap(id);
      if (roadmapToken() !== session || getRoadmapDraft().revision !== revision) { throw new Error('Seu roteiro ou sua sessão mudou durante a consulta. Selecione novamente para trocar.'); }
      storeRoadmapDraft(roadmapFromResponse(result, Boolean(session) && (saved.some((item) => item.id === id) || (getRoadmapDraft().id === id && getRoadmapDraft().owned))));
    } catch (error) { setMessage(explain(error)); }
    finally { lock.current = false; setBusy(false); }
  };
  const save = async () => {
    if (lock.current) { return; }
    lock.current = true; setBusy(true); setMessage('');
    const snapshot = getRoadmapDraft(); const session = roadmapToken();
    try {
      const result = await saveRoadmap(snapshot);
      if (roadmapToken() !== session) { throw new Error('A sessão mudou durante o envio. Consulte os roteiros na conta utilizada para salvar.'); }
      if (getRoadmapDraft().revision === snapshot.revision) {
        storeRoadmapDraft({ ...snapshot, id: result.id, owned: Boolean(roadmapToken()), dirty: false });
        setMessage('Roteiro salvo! Seus horários foram validados.');
      } else { setMessage('A versão enviada foi salva. Há novas alterações no rascunho; confira antes de salvar novamente.'); }
      if (session) {
        try { setSaved(await listRoadmaps()); }
        catch (error) { setListError(explain(error)); }
      } else {
        rememberVisitorRoadmap(result.id);
        try { setSaved(await listAccessibleRoadmaps()); }
        catch (error) { setListError(explain(error)); }
      }
    } catch (error) { setMessage(explain(error)); }
    finally { lock.current = false; setBusy(false); }
  };
  const remove = async () => {
    if (lock.current || !draft.id || !draft.owned) { return; }
    const id = draft.id; const session = roadmapToken(); lock.current = true; setBusy(true);
    try {
      await deleteRoadmap(id);
      if (roadmapToken() !== session) { throw new Error('A sessão mudou. Consulte a lista na conta utilizada para excluir.'); }
      resetRoadmapDraft(); setSaved((previous) => previous.filter((item) => item.id !== id)); setMessage('Roteiro excluído. Você pode começar outro passeio.');
    }
    catch (error) { setMessage(explain(error)); }
    finally { lock.current = false; setBusy(false); }
  };
  const beginTimeEdit = (stop: RoadmapStop) => { setEditing(stop); setStart(formatRoadmapTime(stop.startDate)); setEnd(formatRoadmapTime(stop.endDate)); setTimeError(''); };
  const applyTimes = () => {
    try {
      const startDate = parseRoadmapTime(start); const endDate = parseRoadmapTime(end);
      if (Date.parse(startDate) >= Date.parse(endDate)) { throw new Error('O término precisa ser depois do início.'); }
      if (editing?.eventStart && (Date.parse(startDate) < Date.parse(editing.eventStart) || Date.parse(endDate) > Date.parse(editing.eventEnd!))) { throw new Error('A visita precisa estar dentro do horário do evento.'); }
      update({ stops: getRoadmapDraft().stops.map((stop) => stop.key === editing?.key ? { ...stop, startDate, endDate } : stop).sort((a, b) => Date.parse(a.startDate) - Date.parse(b.startDate)) }); setEditing(null);
    } catch (error) { setTimeError(explain(error)); }
  };
  const validation = roadmapError(draft);
  return <View style={styles.viewport}><View style={styles.shell}><StatusBar style="dark" />
    <View style={styles.header}><Text style={[styles.brand, fontsLoaded && { fontFamily: 'Fredoka_700Bold' }]}>Perambulando</Text><Image source={require('../assets/perambulando-mark.png')} resizeMode="contain" style={styles.mark} /><Pressable accessibilityRole="button" accessibilityLabel="Abrir perfil" onPress={() => router.push('/perfil' as Href)} style={styles.avatar}><Text style={styles.avatarText}>U</Text></Pressable></View>
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.eyebrow}>UM PASSEIO DO SEU JEITO</Text><View style={styles.row}><Text accessibilityRole="header" style={styles.title}>Meu roteiro</Text><Pressable accessibilityRole="button" disabled={busy} onPress={() => protectDraft(() => { resetRoadmapDraft(); setMessage(''); })} style={styles.secondary}><Text style={styles.secondaryText}>+ Novo</Text></Pressable></View>
      <Text style={styles.body}>Junte eventos e estabelecimentos. Organize cada parada nos horários do seu passeio.</Text>
      {draft.id ? <Pressable accessibilityRole="button" disabled={busy} onPress={() => protectDraft(() => void select(draft.id!))} style={styles.secondary}><Text style={styles.secondaryText}>Consultar versão salva</Text></Pressable> : null}
      <Pressable accessibilityRole="button" onPress={() => router.push('/roteiro_ia' as Href)} style={styles.ai}><Text style={styles.aiTitle}>⌁  Montar roteiro com IA  ›</Text><Text style={styles.small}>Busque sugestões e inclua suas preferidas na timeline.</Text></Pressable>
      <View style={styles.section}><Text style={styles.sectionTitle}>Meus roteiros</Text>{listing ? <ActivityIndicator color={colors.orange} /> : null}<ScrollView horizontal contentContainerStyle={styles.chips}>{saved.map((item) => <Pressable accessibilityRole="button" accessibilityState={{ selected: item.id === draft.id, disabled: busy }} key={item.id} disabled={busy} onPress={() => protectDraft(() => void select(item.id))} style={[styles.chip, item.id === draft.id && styles.chipSelected]}><Text style={styles.chipText}>{item.name}</Text></Pressable>)}</ScrollView>{!listing && !saved.length && !listError ? <Text style={styles.small}>{token ? 'Seus roteiros salvos na conta aparecerão aqui.' : 'Seus roteiros salvos neste navegador aparecerão aqui.'}</Text> : null}{!token && saved.length ? <Text style={styles.small}>Disponíveis neste navegador. Entre na sua conta para manter novos roteiros vinculados ao seu perfil e gerenciá-los em outros dispositivos.</Text> : null}{listError ? <><Text accessibilityRole="alert" style={styles.error}>{listError}</Text><Pressable accessibilityRole="button" onPress={() => { setListing(true); void listAccessibleRoadmaps().then((result) => { setSaved(result); setListError(''); }).catch((error) => setListError(explain(error))).finally(() => setListing(false)); }} style={styles.secondary}><Text style={styles.secondaryText}>Recarregar roteiros</Text></Pressable></> : null}</View>
      <View style={styles.section}><Text style={styles.label}>Nome do passeio</Text><TextInput accessibilityLabel="Nome do roteiro" value={draft.name} editable={!busy} onChangeText={(name) => update({ name })} style={styles.input} /><Text style={styles.label}>Uma descrição, se quiser</Text><TextInput accessibilityLabel="Descrição do roteiro" multiline value={draft.description} editable={!busy} onChangeText={(description) => update({ description })} placeholder="Como você imagina esse passeio?" style={styles.input} /><Text style={styles.small}>{draft.dirty ? 'Alterações ainda não salvas' : draft.id ? `Roteiro salvo · #${draft.id}` : 'Comece adicionando uma parada'} · Horários de Recife</Text></View>
      <View style={styles.row}><Text style={styles.sectionTitle}>Seu passeio em {draft.stops.length} parada{draft.stops.length === 1 ? '' : 's'}</Text></View>
      {!draft.stops.length ? <View style={styles.section}><Text style={styles.stopName}>Seu próximo passeio começa aqui</Text><Text style={styles.body}>Toque no + para escolher um evento ou estabelecimento. Você também pode incluir locais nos cards do catálogo e do mapa.</Text></View> : null}
      <View style={styles.timeline}>{draft.stops.map((stop, index) => <View key={stop.key} style={styles.timelineRow}><View style={styles.rail}><View style={styles.dot}><Text style={styles.dotText}>{index + 1}</Text></View><View style={styles.line} /></View><View style={styles.stopCard}><Pressable accessibilityRole="button" accessibilityLabel={`Detalhes de ${stop.name}`} onPress={() => openStop(stop)} style={styles.catalogSummary}><Cover uri={stop.imageUrl} /><View style={styles.flex}><Text style={styles.eyebrow}>{stop.kind === 'host' ? 'ESTABELECIMENTO' : 'PROGRAMAÇÃO'}</Text><Text style={styles.stopName}>{stop.name}</Text></View></Pressable><Text style={styles.schedule}>{formatRoadmapTime(stop.startDate)}{ '\n'}até {formatRoadmapTime(stop.endDate)}</Text><View style={styles.row}><Pressable accessibilityRole="button" accessibilityLabel={`Alterar horário de ${stop.name}`} disabled={busy} onPress={() => beginTimeEdit(stop)} style={styles.secondary}><Text style={styles.secondaryText}>Alterar horário</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel={`Retirar ${stop.name} do roteiro`} disabled={busy} onPress={() => update({ stops: draft.stops.filter((item) => item.key !== stop.key) })} style={styles.secondary}><Text style={styles.error}>Retirar</Text></Pressable></View></View></View>)}</View>
      <Pressable accessibilityRole="button" accessibilityLabel="Adicionar nova parada ao roteiro" disabled={busy} onPress={() => setPicker(true)} style={styles.add}><Text style={styles.addGlyph}>+</Text><Text style={styles.secondaryText}>Adicionar uma parada</Text></Pressable>
      {draft.stops.length > 0 && validation ? <Text accessibilityRole="alert" style={styles.error}>{validation}</Text> : null}
      <Text style={styles.small}>As paradas seguem a ordem dos horários. Eventos precisam respeitar sua duração e visitas a locais precisam caber no funcionamento. O roteiro salvo é validado pelo serviço.</Text>
      {message ? <Text accessibilityRole="status" style={styles.feedback}>{message}</Text> : null}
      <Pressable accessibilityRole="button" disabled={busy || Boolean(validation)} onPress={() => void save()} style={[styles.primary, (busy || Boolean(validation)) && styles.disabled]}>{busy ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryText}>{draft.id && !draft.owned ? 'Salvar nova versão do roteiro' : draft.id ? 'Salvar alterações' : 'Salvar roteiro'}</Text>}</Pressable>
      {draft.id && draft.owned && token ? <Pressable accessibilityRole="button" disabled={busy} onPress={() => setConfirm({ title: 'Excluir este roteiro?', text: 'O roteiro será desativado e deixará de aparecer na sua lista. Os eventos e estabelecimentos serão preservados.', run: () => void remove() })} style={styles.secondary}><Text style={styles.error}>Excluir roteiro</Text></Pressable> : null}
    </ScrollView>
    <View style={styles.nav}>{[{ label: 'Explorar', icon: '⌾', path: '/explorar' }, { label: 'Roteiro', icon: '⌁', path: '/roteiro' }, { label: 'Perto de você', icon: '⌖', path: '/perto_de_voce' }, { label: 'Favoritos', icon: '♡', path: '/favoritos' }, { label: 'Perfil', icon: '♙', path: '/perfil' }].map((item) => <Pressable key={item.path} accessibilityRole="button" accessibilityState={{ selected: item.path === '/roteiro' }} onPress={() => { if (item.path !== '/roteiro') { router.push(item.path as Href); } }} style={styles.navItem}><Text style={[styles.navIcon, item.path === '/roteiro' && styles.orange]}>{item.icon}</Text><Text style={[styles.navLabel, item.path === '/roteiro' && styles.orange]}>{item.label}</Text></Pressable>)}</View>
    {picker ? <StopPicker close={() => setPicker(false)} /> : null}
    <Modal visible={Boolean(editing)} transparent animationType="fade" onRequestClose={() => setEditing(null)}><View style={styles.overlay}><View style={styles.dialog}><Text style={styles.sectionTitle}>Horário da parada</Text><Text style={styles.body}>{editing?.name}</Text><Text style={styles.small}>Use DD/MM/AAAA HH:mm · Horário de Recife{editing?.eventStart ? `\nEvento: ${formatRoadmapTime(editing.eventStart)} a ${formatRoadmapTime(editing.eventEnd!)}` : '\nConfira os dias e intervalos de funcionamento nos detalhes do local.'}</Text><Text style={styles.label}>Início da visita</Text><TextInput accessibilityLabel="Início da visita" value={start} onChangeText={setStart} placeholder="27/11/2026 14:00" style={styles.input} /><Text style={styles.label}>Fim da visita</Text><TextInput accessibilityLabel="Fim da visita" value={end} onChangeText={setEnd} placeholder="27/11/2026 15:00" style={styles.input} />{timeError ? <Text accessibilityRole="alert" style={styles.error}>{timeError}</Text> : null}<Pressable accessibilityRole="button" onPress={applyTimes} style={styles.primary}><Text style={styles.primaryText}>Aplicar horário</Text></Pressable><Pressable accessibilityRole="button" onPress={() => setEditing(null)} style={styles.secondary}><Text style={styles.secondaryText}>Cancelar</Text></Pressable></View></View></Modal>
    <Modal visible={Boolean(confirm)} transparent animationType="fade" onRequestClose={() => setConfirm(null)}><View style={styles.overlay}><View style={styles.dialog}><Text style={styles.sectionTitle}>{confirm?.title}</Text><Text style={styles.body}>{confirm?.text}</Text><Pressable accessibilityRole="button" onPress={() => { const action = confirm?.run; setConfirm(null); action?.(); }} style={styles.primary}><Text style={styles.primaryText}>Continuar</Text></Pressable><Pressable accessibilityRole="button" onPress={() => setConfirm(null)} style={styles.secondary}><Text style={styles.secondaryText}>Cancelar</Text></Pressable></View></View></Modal>
  </View></View>;
}

const styles = StyleSheet.create({
  viewport: { flex: 1, alignItems: 'center', backgroundColor: '#E6DED2' }, shell: { flex: 1, width: '100%', maxWidth: 520, backgroundColor: colors.background },
  header: { minHeight: 78, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, gap: 12, borderBottomWidth: 1, borderBottomColor: colors.line, backgroundColor: colors.card }, brand: { color: colors.ink, fontSize: 22, fontWeight: '800' }, mark: { width: 40, height: 46 }, avatar: { marginLeft: 'auto', width: 38, height: 38, borderRadius: 19, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' }, avatarText: { color: '#FFFFFF', fontWeight: '800' },
  content: { padding: 18, gap: 16, paddingBottom: 30 }, eyebrow: { color: colors.orange, fontSize: 9, fontWeight: '800', letterSpacing: 1 }, title: { color: colors.ink, fontSize: 30, letterSpacing: -1 }, sectionTitle: { color: colors.ink, fontSize: 18, fontWeight: '700', flexShrink: 1 }, body: { color: colors.muted, fontSize: 13, lineHeight: 21 }, small: { color: colors.muted, fontSize: 11, lineHeight: 17 }, label: { color: colors.ink, fontSize: 12, fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }, flex: { flex: 1, gap: 5, minWidth: 0 }, section: { padding: 18, borderRadius: 21, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card, gap: 12 }, input: { color: colors.ink, minHeight: 49, paddingHorizontal: 13, paddingVertical: 12, borderRadius: 14, borderWidth: 1, borderColor: colors.line, backgroundColor: '#FBF9F5', fontSize: 13 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, chip: { minHeight: 40, paddingHorizontal: 12, paddingVertical: 11, borderRadius: 20, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card, justifyContent: 'center' }, chipSelected: { borderColor: colors.orange, backgroundColor: '#FFF0E7' }, chipText: { color: colors.ink, fontSize: 11, fontWeight: '600' }, orange: { color: colors.orange },
  ai: { padding: 16, borderRadius: 18, backgroundColor: '#EEE8FF', gap: 6 }, aiTitle: { color: '#643CDD', fontSize: 14, fontWeight: '700' }, primary: { minHeight: 49, padding: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.orange, borderRadius: 15 }, primaryText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' }, secondary: { minHeight: 44, paddingHorizontal: 12, paddingVertical: 11, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.line, borderRadius: 13, backgroundColor: colors.card }, secondaryText: { color: colors.ink, fontSize: 11, fontWeight: '700' }, disabled: { opacity: 0.45 }, error: { color: '#B42318', fontSize: 11, lineHeight: 18 }, feedback: { color: colors.ink, fontSize: 12, lineHeight: 19, padding: 13, borderRadius: 13, backgroundColor: '#EAF2F5' },
  timeline: { gap: 0 }, timelineRow: { flexDirection: 'row', gap: 10 }, rail: { alignItems: 'center', width: 30 }, dot: { width: 29, height: 29, borderRadius: 15, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' }, dotText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' }, line: { flex: 1, width: 2, backgroundColor: colors.line, minHeight: 20 }, stopCard: { flex: 1, minWidth: 0, padding: 12, borderRadius: 18, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card, marginBottom: 14, gap: 12 }, catalogSummary: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 }, cover: { width: 54, height: 57, borderRadius: 12 }, coverFallback: { backgroundColor: '#EAF2F5', alignItems: 'center', justifyContent: 'center' }, coverGlyph: { color: colors.ink, fontSize: 24 }, stopName: { color: colors.ink, fontSize: 14, lineHeight: 19, fontWeight: '700' }, schedule: { color: colors.green, fontSize: 12, lineHeight: 20, fontWeight: '600' },
  add: { minHeight: 70, borderStyle: 'dashed', borderWidth: 1, borderColor: colors.orange, borderRadius: 18, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 12, backgroundColor: '#FFF4EB' }, addGlyph: { fontSize: 32, color: colors.orange }, nav: { flexDirection: 'row', minHeight: 70, backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.line }, navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 }, navIcon: { fontSize: 20, color: '#8C8C93' }, navLabel: { fontSize: 8, color: '#8C8C93' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,24,49,0.4)', justifyContent: 'center', alignItems: 'center', padding: 14 }, sheet: { width: '100%', maxWidth: 500, maxHeight: '94%', minHeight: '65%', backgroundColor: colors.background, borderRadius: 24, padding: 16, gap: 12 }, dialog: { width: '100%', maxWidth: 430, backgroundColor: colors.card, borderRadius: 22, padding: 20, gap: 13 }, close: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF0E7', borderRadius: 22 }, closeText: { color: colors.orange, fontSize: 24 }, pickerContent: { gap: 14, paddingBottom: 20 }, catalogCard: { borderWidth: 1, borderColor: colors.line, borderRadius: 17, backgroundColor: colors.card, padding: 10 },
});
