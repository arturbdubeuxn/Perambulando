import RoadmapButton from './RoadmapButton';
import { router, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { hostEventDate } from './hostDetails';
import { sendTravelChatMessage, type ChatAddress, type TravelChatResult } from './travelChat';

const colors = { ink: '#002B5C', orange: '#FF5A0A', purple: '#7044E8', background: '#F8F5EE', card: '#FFFEFC', line: '#E7E0D6', muted: '#667085' };
const suggestions = [
  { label: 'Um sábado em Recife', text: 'Quero passear no próximo sábado em Recife, com música, feiras e gastronomia.' },
  { label: 'Programação gratuita', text: 'Quero eventos gratuitos no próximo sábado em Recife, com música, arte e feiras.' },
  { label: 'Cultura e gastronomia', text: 'Quero um passeio de cultura e gastronomia em Recife no próximo sábado.' },
  { label: 'Algo perto de mim', text: '' },
];
type Message = { id: number; role: 'user' | 'assistant'; text: string; result?: TravelChatResult; retryText?: string };

function ResultImage({ uri, name }: { uri: string; name: string }) {
  const [failed, setFailed] = useState(false);
  return uri && !failed ? <Image source={{ uri }} resizeMode="cover" onError={() => setFailed(true)} style={styles.resultImage} /> : <View style={[styles.resultImage, styles.resultFallback]}><Text style={styles.resultInitial}>{name.charAt(0).toUpperCase()}</Text></View>;
}

function addressLabel(address: ChatAddress | undefined) {
  return address ? [address.neighborhood, address.city].filter(Boolean).join(' · ') : '';
}

function ChatResults({ result }: { result: TravelChatResult }) {
  return <View style={styles.results}>
    {result.programmings.map((event) => <View key={`event-${event.id}`}><Pressable accessibilityRole="button" accessibilityLabel={`Ver evento ${event.name}`} key={`event-${event.id}`} onPress={() => router.push({ pathname: '/programacao/[programmingId]', params: { programmingId: String(event.id), origin: 'roteiro' } } as Href)} style={({ pressed }) => [styles.resultCard, pressed && styles.pressed]}>
      <ResultImage uri={event.imageUrl} name={event.name} /><View style={styles.resultCopy}><Text style={styles.resultType}>PROGRAMAÇÃO</Text><Text style={styles.resultName}>{event.name}</Text><Text style={styles.small}>{hostEventDate(event.startDate)} → {hostEventDate(event.endDate)}</Text><Text style={styles.price}>{event.isFree ? 'Grátis' : Number.isFinite(event.minPrice) ? 'A partir de ' + new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(event.minPrice) : 'Valor a consultar'}</Text><Text style={styles.small}>{addressLabel(event.address)}</Text><Text numberOfLines={2} style={styles.small}>{event.description}</Text><Text style={styles.resultLink}>Ver detalhes ›</Text></View>
    </Pressable><RoadmapButton kind="programming" id={event.id} name={event.name} /></View>)}
    {result.hosts.map((host) => <View key={`host-${host.id}`}><Pressable accessibilityRole="button" accessibilityLabel={`Ver estabelecimento ${host.name}`} key={`host-${host.id}`} onPress={() => router.push({ pathname: '/estabelecimento', params: { hostId: String(host.id), origin: 'roteiro' } } as Href)} style={({ pressed }) => [styles.resultCard, pressed && styles.pressed]}>
      <ResultImage uri={host.logoUrl} name={host.name} /><View style={styles.resultCopy}><Text style={styles.resultType}>{host.typeofhost === 1 ? 'GASTRONOMIA' : host.typeofhost === 2 ? 'COMÉRCIO' : 'ESTABELECIMENTO'}</Text><Text style={styles.resultName}>{host.name}</Text><Text style={styles.small}>{addressLabel(host.address)}</Text><Text numberOfLines={2} style={styles.small}>{host.description}</Text><Text style={styles.resultLink}>Conhecer o local ›</Text></View>
    </Pressable><RoadmapButton kind="host" id={host.id} name={host.name} /></View>)}
  </View>;
}

export default function TravelChatScreen() {
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [sending, setSending] = useState(false);
  const [hint, setHint] = useState('Diga a cidade, o dia e o que você gosta de fazer.');
  const input = useRef<ComponentRef<typeof TextInput>>(null);
  const conversation = useRef<ComponentRef<typeof ScrollView>>(null);
  const pending = useRef(false);
  const mounted = useRef(true);
  const controller = useRef<AbortController | null>(null);
  const nextId = useRef(1);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; controller.current?.abort(); };
  }, []);

  const send = async (value: string) => {
    const text = value.trim();
    if (!text || text.length > 4000 || pending.current) {
      return;
    }
    pending.current = true;
    setSending(true);
    setDraft('');
    setMessages((current) => [...current, { id: nextId.current++, role: 'user', text }]);
    const requestController = new AbortController();
    controller.current = requestController;
    const timeout = setTimeout(() => requestController.abort(), 40000);
    try {
      let token = '';
      if (Platform.OS === 'web') {
        try {
          token = (globalThis as { sessionStorage?: { getItem: (key: string) => string | null } }).sessionStorage?.getItem('perambulando.accessToken') ?? '';
        } catch {
          token = '';
        }
      }
      const result = await sendTravelChatMessage(text, token, requestController.signal);
      if (mounted.current) {
        const hasResults = result.programmings.length + result.hosts.length > 0;
        setMessages((current) => [...current, { id: nextId.current++, role: 'assistant', result, text: hasResults ? 'Encontrei estas opções para o seu passeio. Confira os detalhes e os horários antes de escolher.' : 'Não encontrei opções para esse pedido. Experimente outra data, cidade ou faixa de preço.' }]);
      }
    } catch (error) {
      if (mounted.current) {
        const textMessage = requestController.signal.aborted ? 'O assistente demorou para responder. Tente novamente.' : error instanceof TypeError ? 'Não consegui acessar o assistente. Confira sua conexão e tente novamente.' : error instanceof Error ? error.message : 'Não foi possível consultar as opções agora.';
        setMessages((current) => [...current, { id: nextId.current++, role: 'assistant', text: textMessage, retryText: text }]);
      }
    } finally {
      clearTimeout(timeout);
      controller.current = null;
      pending.current = false;
      if (mounted.current) {
        setSending(false);
      }
    }
  };

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/explorar' as Href);
    }
  };

  return <View style={styles.viewport}><KeyboardAvoidingView style={styles.shell} behavior={Platform.OS === 'ios' ? 'padding' : Platform.OS === 'android' ? 'height' : undefined}>
    <StatusBar style="dark" />
    <View style={styles.header}><Pressable accessibilityRole="button" accessibilityLabel="Voltar para explorar" onPress={goBack} style={styles.back}><Text style={styles.backText}>‹</Text></Pressable><View style={styles.headerCopy}><Text style={styles.eyebrow}>ASSISTENTE DE PASSEIOS</Text><Text accessibilityRole="header" style={styles.title}>Meu roteiro</Text><View style={styles.badge}><Text style={styles.badgeText}>COM IA</Text></View></View></View>
    <View style={styles.panel}>
      <ScrollView ref={conversation} style={styles.conversation} contentContainerStyle={styles.messages} keyboardShouldPersistTaps="handled" onContentSizeChange={() => { if (messages.length) { conversation.current?.scrollToEnd({ animated: true }); } }}>
        <View style={styles.assistantRow}><View style={styles.assistantIcon}><Text style={styles.routeGlyph}>⌁</Text></View><View style={styles.welcome}><Text style={styles.welcomeTitle}>O que você quer fazer hoje?</Text><Text style={styles.body}>Conte como imagina seu passeio. Vou buscar eventos e estabelecimentos do catálogo para você explorar.</Text></View></View>
        {!messages.length ? <View style={styles.suggestions}>{suggestions.map((suggestion) => <Pressable accessibilityRole="button" accessibilityLabel={suggestion.label} key={suggestion.label} onPress={() => { if (suggestion.text) { void send(suggestion.text); } else { setDraft('Quero passear em '); setHint('Complete com a cidade onde você quer passear.'); input.current?.focus(); } }} style={({ pressed }) => [styles.suggestion, pressed && styles.pressed]}><Text style={styles.suggestionLabel}>{suggestion.label}</Text><Text style={styles.chevron}>›</Text></Pressable>)}</View> : null}
        {messages.map((message) => <View key={message.id} style={message.role === 'user' ? styles.userBubble : styles.assistantBubble}><Text selectable accessibilityRole={message.retryText ? 'alert' : undefined} style={message.role === 'user' ? styles.userText : styles.body}>{message.text}</Text>{message.result ? <ChatResults result={message.result} /> : null}{message.retryText ? <Pressable accessibilityRole="button" accessibilityLabel="Tentar novamente o pedido" disabled={sending} onPress={() => void send(message.retryText!)} style={[styles.retry, sending && styles.disabled]}><Text style={styles.retryText}>Tentar novamente</Text></Pressable> : null}</View>)}
        {sending ? <View accessibilityRole="status" style={styles.typing}><ActivityIndicator color={colors.purple} /><Text style={styles.small}>Buscando opções para você...</Text></View> : null}
      </ScrollView>
      <View style={styles.composerArea}><Text style={styles.hint}>{hint}</Text><View style={styles.composer}><TextInput ref={input} accessibilityLabel="Mensagem para montar roteiro" placeholder="Ex.: sábado à tarde, até R$ 50, em Recife" placeholderTextColor="#98A2B3" value={draft} onChangeText={setDraft} maxLength={4000} returnKeyType="send" onSubmitEditing={() => void send(draft)} style={styles.input} /><Pressable accessibilityRole="button" accessibilityLabel="Enviar mensagem" disabled={sending || !draft.trim()} onPress={() => void send(draft)} style={[styles.send, (sending || !draft.trim()) && styles.disabled]}><Text style={styles.sendGlyph}>➤</Text></Pressable></View><Text style={styles.disclaimer}>Sugestões do catálogo. Confira disponibilidade, horários e valores.</Text></View>
    </View>
  </KeyboardAvoidingView></View>;
}

const styles = StyleSheet.create({
  viewport: { flex: 1, backgroundColor: '#E6DED2', alignItems: 'center' }, shell: { flex: 1, width: '100%', maxWidth: 430, backgroundColor: colors.background },
  header: { paddingHorizontal: 16, paddingTop: 28, paddingBottom: 22, flexDirection: 'row', gap: 14, alignItems: 'center', ...Platform.select({ web: { backgroundImage: 'radial-gradient(ellipse at 85% 0%, #EDE6FF 0%, #F8F5EE 75%)' } }) }, back: { width: 38, height: 40, borderRadius: 20, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, justifyContent: 'center', alignItems: 'center' }, backText: { color: colors.ink, fontSize: 27 }, headerCopy: { flex: 1, gap: 8 }, eyebrow: { color: colors.orange, fontSize: 9, fontWeight: '700', letterSpacing: 1.8 }, title: { color: colors.ink, fontSize: 30, letterSpacing: -1 }, badge: { alignSelf: 'flex-start', backgroundColor: '#EDE8DF', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 }, badgeText: { color: colors.muted, fontSize: 8, fontWeight: '700', letterSpacing: 0.8 },
  panel: { flex: 1, minHeight: 0, marginHorizontal: 14, marginBottom: 16, borderWidth: 1, borderColor: colors.line, borderRadius: 23, backgroundColor: colors.card, overflow: 'hidden', ...Platform.select({ web: { boxShadow: '0 8px 28px rgba(0,43,92,.05)' } }) }, conversation: { flex: 1 }, messages: { padding: 16, gap: 16 }, assistantRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 9 }, assistantIcon: { width: 35, height: 37, borderRadius: 12, borderBottomLeftRadius: 3, backgroundColor: colors.purple, alignItems: 'center', justifyContent: 'center' }, routeGlyph: { color: '#FFFFFF', fontSize: 25, fontWeight: '700' }, welcome: { flex: 1, minWidth: 0, padding: 14, borderRadius: 17, borderTopLeftRadius: 4, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.background, gap: 7 }, welcomeTitle: { color: colors.ink, fontSize: 15, fontWeight: '700', lineHeight: 21 }, body: { color: colors.muted, fontSize: 12, lineHeight: 19 }, small: { color: colors.muted, fontSize: 10, lineHeight: 16 },
  suggestions: { gap: 9 }, suggestion: { minHeight: 49, borderRadius: 14, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 13, paddingVertical: 11, flexDirection: 'row', alignItems: 'center', gap: 8 }, suggestionLabel: { flex: 1, color: colors.ink, fontSize: 13, fontWeight: '600' }, chevron: { color: colors.muted, fontSize: 23 }, userBubble: { maxWidth: '90%', alignSelf: 'flex-end', backgroundColor: colors.ink, borderRadius: 17, borderBottomRightRadius: 4, padding: 13 }, userText: { color: '#FFFFFF', fontSize: 13, lineHeight: 20 }, assistantBubble: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.line, borderRadius: 17, borderTopLeftRadius: 4, padding: 12, gap: 12 }, typing: { flexDirection: 'row', gap: 10, alignItems: 'center', padding: 10 },
  composerArea: { paddingHorizontal: 13, paddingTop: 10, paddingBottom: 14, borderTopWidth: 1, borderColor: colors.line, gap: 8 }, hint: { color: colors.muted, fontSize: 10, lineHeight: 15 }, composer: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 7, padding: 6, borderWidth: 1, borderColor: colors.line, borderRadius: 17, backgroundColor: colors.card }, input: { flex: 1, minWidth: 0, paddingHorizontal: 8, minHeight: 40, color: colors.ink, fontSize: 12 }, send: { width: 42, height: 42, borderRadius: 13, backgroundColor: colors.orange, justifyContent: 'center', alignItems: 'center' }, sendGlyph: { fontSize: 22, color: '#FFFFFF', transform: [{ rotate: '-28deg' }] }, disabled: { opacity: 0.45 }, disclaimer: { color: '#8A93A0', fontSize: 9, lineHeight: 13 }, retry: { minHeight: 40, borderWidth: 1, borderColor: colors.line, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, retryText: { color: colors.ink, fontSize: 11, fontWeight: '700' },
  results: { gap: 10 }, resultCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, padding: 10, borderWidth: 1, borderColor: colors.line, borderRadius: 14, backgroundColor: colors.card }, resultImage: { width: 48, height: 52, borderRadius: 10 }, resultFallback: { backgroundColor: '#EDE7FF', justifyContent: 'center', alignItems: 'center' }, resultInitial: { color: colors.purple, fontSize: 21, fontWeight: '700' }, resultCopy: { flex: 1, minWidth: 0, gap: 5 }, resultType: { color: colors.purple, fontSize: 8, fontWeight: '700', letterSpacing: 0.7 }, resultName: { color: colors.ink, fontSize: 13, lineHeight: 18, fontWeight: '700' }, price: { color: '#257A48', fontSize: 10, fontWeight: '700' }, resultLink: { color: colors.orange, fontSize: 10, fontWeight: '700', marginTop: 3 }, pressed: { opacity: 0.75 },
});
