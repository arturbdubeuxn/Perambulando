import { Fredoka_700Bold } from '@expo-google-fonts/fredoka/700Bold';
import { useFonts } from 'expo-font';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

const colors = { ink: '#002B5C', orange: '#FF5A0A', background: '#F8F5EE', card: '#FFFEFC', line: '#E7E0D6', muted: '#667085' };
const periods = ['7 dias', '30 dias', '90 dias'] as const;
type Period = typeof periods[number];
type SubscriptionStatus = 'pendente' | 'ativa' | 'vencida' | 'cancelada';
type PlanId = 'essencial' | 'impulso' | 'destaque';
const plans: { id: PlanId; name: string; price: string; benefits: string[] }[] = [
  { id: 'essencial', name: 'Essencial', price: 'Grátis', benefits: ['Página do estabelecimento', 'Publicação de programações', 'Resumo de visitas e cliques'] },
  { id: 'impulso', name: 'Impulso', price: 'R$ 39,90', benefits: ['Tudo do Essencial', 'Destaque nas buscas da cidade', 'Evolução e comparação de resultados', 'Mais espaços de divulgação'] },
  { id: 'destaque', name: 'Destaque', price: 'R$ 79,90', benefits: ['Tudo do Impulso', 'Maior exposição em espaços de destaque', 'Análise por programação', 'Relatórios de desempenho'] },
];
// Cenários de apresentação: nunca representam métricas ou assinaturas do usuário autenticado.
const samples: Record<Period, { visits: number; profile: number; clicks: number; previous: number; bars: number[] }> = {
  '7 dias': { visits: 1240, profile: 386, clicks: 186, previous: 1000, bars: [35, 50, 42, 65, 80, 100, 72] },
  '30 dias': { visits: 4860, profile: 1458, clicks: 632, previous: 4050, bars: [42, 66, 80, 100] },
  '90 dias': { visits: 13500, profile: 4120, clicks: 1620, previous: 12000, bars: [65, 83, 100] },
};
const statusCopy: Record<SubscriptionStatus, string> = {
  pendente: 'Aguardando confirmação do pagamento. O plano só é ativado após a confirmação do provedor.',
  ativa: 'Benefícios disponíveis durante o período contratado.',
  vencida: 'O período contratado terminou. Inicie uma nova contratação para voltar a usar os benefícios.',
  cancelada: 'A renovação foi cancelada. Consulte a data de término dos benefícios no contrato.',
};

function Action({ label, onPress, secondary = false }: { label: string; onPress: () => void; secondary?: boolean }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.button, secondary && styles.secondaryButton, pressed && styles.pressed]}><Text style={[styles.buttonText, secondary && styles.secondaryText]}>{label}</Text></Pressable>;
}

export default function DashboardScreen() {
  const [fontsLoaded] = useFonts({ Fredoka_700Bold });
  const [period, setPeriod] = useState<Period>('7 dias');
  const [tab, setTab] = useState<'results' | 'subscription'>('results');
  const [demo, setDemo] = useState(false);
  const [status, setStatus] = useState<SubscriptionStatus>('ativa');
  const [currentPlan, setCurrentPlan] = useState<PlanId>('impulso');
  const [selectedPlan, setSelectedPlan] = useState<PlanId | null>(null);
  const [dialog, setDialog] = useState<'checkout' | 'cancel' | 'details' | null>(null);
  const [message, setMessage] = useState('');
  const data = samples[period];
  const number = (value: number) => value.toLocaleString('pt-BR');
  const current = plans.find((plan) => plan.id === currentPlan)!;
  const selected = plans.find((plan) => plan.id === selectedPlan);
  const hasBenefits = demo && status === 'ativa';

  function resetDemo() {
    setDemo((value) => !value);
    setStatus('ativa');
    setCurrentPlan('impulso');
    setMessage('');
  }

  return (
    <View style={styles.viewport}>
      <View style={styles.shell}>
        <StatusBar style="dark" />
        <View style={styles.header}>
          <View style={styles.brand}>
            <Text style={[styles.brandName, fontsLoaded && { fontFamily: 'Fredoka_700Bold', fontWeight: 'normal' }]}>Perambulando</Text>
            <Image source={require('../assets/perambulando-mark.png')} resizeMode="contain" style={styles.mark} accessibilityLabel="Marca Perambulando" />
          </View>
          <View style={styles.avatar}><Text style={styles.avatarText}>P</Text></View>
        </View>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.intro}>
            <Text style={styles.eyebrow}>SEU NEGÓCIO EM MOVIMENTO</Text>
            <Text accessibilityRole="header" style={styles.title}>Seu painel</Text>
            <Text style={styles.body}>Entenda o interesse do público e dê o próximo passo na sua divulgação.</Text>
          </View>
          <View style={styles.demoNotice}>
            <Text style={styles.cardTitle}>{demo ? 'Você está explorando uma demonstração' : 'Conheça seu futuro painel'}</Text>
            <Text style={styles.body}>{demo ? 'Números, estabelecimento, planos e assinatura são fictícios. Nenhuma ação aqui gera cobrança.' : 'Os dados reais ainda não estão conectados. Explore um exemplo de como acompanhar seus resultados.'}</Text>
            <Action secondary label={demo ? 'Sair da demonstração' : 'Explorar demonstração'} onPress={resetDemo} />
          </View>
          <View accessibilityRole="tablist" style={styles.tabs}>
            {([{ id: 'results', label: 'Visão geral' }, { id: 'subscription', label: 'Minha assinatura' }] as const).map((item) => (
              <Pressable accessibilityRole="tab" accessibilityState={{ selected: tab === item.id }} key={item.id} onPress={() => setTab(item.id)} style={[styles.tab, tab === item.id && styles.selectedTab]}><Text style={[styles.tabText, tab === item.id && styles.selectedTabText]}>{item.label}</Text></Pressable>
            ))}
          </View>
          {tab === 'results' ? <>
            <View style={styles.row}><Text style={styles.sectionTitle}>{demo ? 'Casa Aurora · Exemplo' : 'Seus resultados'}</Text><Text style={styles.caption}>{demo ? 'Dados ilustrativos' : 'Sem conexão'}</Text></View>
            <View style={styles.periods}>{periods.map((item) => <Pressable key={item} accessibilityRole="button" accessibilityState={{ selected: period === item }} onPress={() => setPeriod(item)} style={[styles.period, period === item && styles.periodActive]}><Text style={[styles.caption, period === item && styles.orangeText]}>Últimos {item}</Text></Pressable>)}</View>
            <View style={styles.metrics}>
              {[
                { label: 'Visitas às programações', value: number(data.visits), note: `+${Math.round((data.visits / data.previous - 1) * 100)}% vs. período anterior` },
                { label: 'Visitas ao estabelecimento', value: number(data.profile), note: 'Acessos à página do negócio' },
                { label: 'Cliques para ingressos', value: number(data.clicks), note: 'Saídas para o link de ingressos' },
                { label: 'Taxa de interesse', value: `${(data.clicks / data.visits * 100).toFixed(1).replace('.', ',')}%`, note: 'Cliques ÷ visitas às programações' },
              ].map((metric) => <View key={metric.label} style={styles.metric}><Text style={styles.caption}>{metric.label}</Text><Text style={styles.metricValue}>{demo ? metric.value : '—'}</Text><Text style={styles.small}>{demo ? metric.note : 'Aguardando dados reais'}</Text></View>)}
            </View>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Interesse ao longo do tempo</Text>
              <Text style={styles.body}>Visitas às suas programações</Text>
              {demo ? <>
                <View style={styles.chart} accessible accessibilityLabel={`Gráfico ilustrativo de visitas, últimos ${period}. ${data.bars.map((bar, index) => `${period === '7 dias' ? 'Dia' : period === '30 dias' ? 'Semana' : 'Mês'} ${index + 1}: ${Math.round(data.visits * bar / data.bars.reduce((sum, value) => sum + value, 0))}`).join('; ')}`}>
                  {data.bars.map((bar, index) => <View key={index} style={styles.chartColumn}><View style={[styles.bar, { height: bar, backgroundColor: index === data.bars.indexOf(100) ? colors.orange : '#CBD9E6' }]} /><Text style={styles.small}>{period === '7 dias' ? `D${index + 1}` : period === '30 dias' ? `S${index + 1}` : `M${index + 1}`}</Text></View>)}
                </View>
                <Text style={styles.small}>D = dia · S = semana · M = mês, do início ao fim do período. Valores ilustrativos.</Text>
              </> : <Text style={styles.empty}>Seu histórico aparecerá aqui quando as métricas estiverem disponíveis.</Text>}
              <Text style={styles.small}>Visitas são acessos, não pessoas únicas. Cliques não comprovam vendas ou presença.</Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Programações em foco</Text>
              <Text style={styles.body}>Compare o interesse de cada divulgação.</Text>
              {demo ? [
                ['Jazz no Quintal', 0.5, 0.6], ['Feira Criativa', 0.3, 0.25], ['Cinema ao Ar Livre', 0.2, 0.15],
              ].map(([name, visits, clicks]) => <View key={String(name)} style={styles.eventRow}><Text style={styles.eventName}>{name}</Text><Text style={styles.caption}>{number(Math.round(data.visits * Number(visits)))} visitas · {number(Math.round(data.clicks * Number(clicks)))} cliques</Text></View>) : <Text style={styles.empty}>Ainda não há resultados conectados para comparar.</Text>}
            </View>
            <View style={styles.insightCard}>
              <Text style={styles.eyebrow}>IDEIAS PARA CRESCER</Text>
              <Text style={styles.cardTitle}>Seu negócio merece ser visto</Text>
              <Text style={styles.body}>Leve suas programações para além da sua página. Conheça opções de divulgação para apresentar seu espaço a quem está descobrindo o que fazer na cidade.</Text>
              <Text style={styles.small}>Vitrine de serviços propostos. A contratação real ainda não está disponível.</Text>
              <View style={styles.divider} />
              <Text style={styles.eventName}>Sua programação na homepage</Text>
              <Text style={styles.body}>Apresente seu próximo evento em uma vitrine de destaques na página inicial. Uma nova oportunidade de ser descoberto enquanto o público escolhe seu próximo passeio.</Text>
              <Action secondary label="Conhecer opções de destaque" onPress={() => setTab('subscription')} />
              <View style={styles.divider} />
              <Text style={styles.eventName}>Mais presença com anúncios</Text>
              <Text style={styles.body}>Amplie seus espaços de divulgação com inserções patrocinadas na plataforma. Coloque sua programação no caminho de quem explora a cidade.</Text>
              <Action secondary label="Explorar planos de divulgação" onPress={() => setTab('subscription')} />
              <View style={styles.divider} />
              <Text style={styles.eventName}>Mostre seu estabelecimento para o mundo</Text>
              <Text style={styles.body}>Dê protagonismo ao seu espaço em vitrines de estabelecimentos. Apresente sua identidade e convide novos públicos a conhecer sua programação.</Text>
              <Action secondary label="Conhecer planos para meu espaço" onPress={() => setTab('subscription')} />
              <View style={styles.divider} />
              <Text style={styles.eventName}>Uma ocasião especial merece destaque</Text>
              <Text style={styles.body}>Vai lançar uma programação ou celebrar uma data importante? Conheça os planos para dar mais presença à sua divulgação dentro do Perambulando.</Text>
              <Action label="Ver planos e benefícios" onPress={() => setTab('subscription')} />
            </View>
          </> : <>
            <View style={styles.card}>
              <View style={styles.row}><Text style={styles.cardTitle}>Minha assinatura</Text><View style={styles.badge}><Text style={styles.badgeText}>{demo ? status : 'Não consultada'}</Text></View></View>
              <Text style={styles.planName}>{demo ? current.name : 'Sua assinatura aparecerá aqui'}</Text>
              <Text style={styles.body}>{demo ? statusCopy[status] : 'A consulta da assinatura real ainda não está disponível. Nenhum plano atual foi confirmado.'}</Text>
              {demo ? <>
                <Text style={styles.small}>Cenário de demonstração · escolha um estado para visualizar:</Text>
                <View style={styles.periods}>{(['pendente', 'ativa', 'vencida', 'cancelada'] as const).map((value) => <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: status === value }} onPress={() => { setStatus(value); setMessage(''); }} style={[styles.period, status === value && styles.periodActive]}><Text style={styles.caption}>{value}</Text></Pressable>)}</View>
                <Action secondary label="Consultar assinatura de exemplo" onPress={() => setDialog('details')} />
                {status === 'ativa' || status === 'pendente' ? <Action secondary label="Cancelar assinatura de exemplo" onPress={() => setDialog('cancel')} /> : null}
              </> : null}
            </View>
            <View><Text style={styles.sectionTitle}>Mais visibilidade, no seu ritmo</Text><Text style={styles.body}>Proposta de planos e preços para avaliação. Valores e benefícios ainda não são ofertas comerciais.</Text></View>
            {plans.map((plan) => {
              const isCurrent = hasBenefits && currentPlan === plan.id;
              return <View key={plan.id} style={[styles.card, plan.id === 'impulso' && styles.featuredPlan]}>
                <View style={styles.row}><Text style={styles.planName}>{plan.name}</Text>{isCurrent ? <Text style={styles.currentBadge}>Plano atual · exemplo</Text> : plan.id === 'impulso' ? <Text style={styles.currentBadge}>Para ganhar alcance</Text> : null}</View>
                <Text style={styles.price}>{plan.price}<Text style={styles.body}>{plan.id !== 'essencial' ? ' / mês' : ''}</Text></Text>
                {plan.benefits.map((benefit) => <Text key={benefit} style={styles.benefit}>✓  {benefit}</Text>)}
                {isCurrent ? <Text style={styles.currentBadge}>Você está visualizando este plano no exemplo</Text> : plan.id === 'essencial' ? <Text style={styles.small}>Plano sem cobrança na proposta apresentada.</Text> : <Action label={`Conhecer contratação · ${plan.name}`} onPress={() => { setSelectedPlan(plan.id); setDialog('checkout'); }} />}
              </View>;
            })}
            <View style={styles.insightCard}><Text style={styles.cardTitle}>Pagamento no ambiente do provedor</Text><Text style={styles.body}>Você não informa os dados completos do cartão no Perambulando. A contratação real usará o checkout seguro do provedor de pagamento.</Text><Text style={styles.small}>Checkout, consulta e cancelamento reais aguardam integração. Não há redirecionamento externo nesta demonstração.</Text></View>
          </>}
          {message ? <Text accessibilityRole="alert" style={styles.feedback}>{message}</Text> : null}
        </ScrollView>
        <View style={styles.nav}>
          <View accessibilityLabel="Painel, página atual" style={styles.navItem}><Text style={styles.orangeText}>▦</Text><Text style={[styles.navLabel, styles.orangeText]}>Painel</Text></View>
          <View accessibilityLabel="Meus eventos, indisponível" style={styles.navItem}><Text style={styles.disabledIcon}>▣</Text><Text style={styles.navLabel}>Meus eventos</Text></View>
          <Pressable accessibilityRole="button" accessibilityLabel="Criar evento" onPress={() => router.navigate('/')} style={styles.navItem}><View style={styles.plus}><Text style={styles.plusText}>＋</Text></View><Text style={styles.navLabel}>Criar evento</Text></Pressable>
          <View accessibilityLabel="Explorar, indisponível" style={styles.navItem}><Text style={styles.disabledIcon}>⊙</Text><Text style={styles.navLabel}>Explorar</Text></View>
          <Pressable accessibilityRole="button" onPress={() => router.navigate('/cadastro_host')} style={styles.navItem}><Text style={styles.disabledIcon}>▥</Text><Text style={styles.navLabel}>Comércio</Text></Pressable>
        </View>
        <Modal transparent visible={dialog !== null} animationType="fade" onRequestClose={() => setDialog(null)}>
          <View style={styles.overlay}><View accessibilityViewIsModal style={styles.dialog}><ScrollView contentContainerStyle={styles.dialogContent}>
            <Text accessibilityRole="header" style={styles.sectionTitle}>{dialog === 'checkout' ? 'Antes de contratar' : dialog === 'cancel' ? 'Cancelar assinatura?' : 'Detalhes da assinatura'}</Text>
            {dialog === 'checkout' ? <>
              <Text style={styles.planName}>{selected?.name} · {selected?.price}/mês</Text>
              <Text style={styles.body}>Este é um exemplo de contratação, sem cobrança. O pagamento real ainda não está disponível.</Text>
              <Text style={styles.body}>Na versão integrada, você revisará o plano e seguirá para o provedor. A assinatura ficará pendente até a confirmação do pagamento.</Text>
              <Action label="Simular início da contratação" onPress={() => { if (selectedPlan) { setDemo(true); setCurrentPlan(selectedPlan); setStatus('pendente'); setMessage('Simulação iniciada: assinatura pendente. Nenhum pagamento ou redirecionamento foi realizado.'); setDialog(null); } }} />
            </> : dialog === 'cancel' ? <>
              <Text style={styles.body}>Deseja cancelar a assinatura de exemplo? Esta ação altera somente a demonstração e não afeta contratos reais.</Text>
              <Action label="Confirmar cancelamento de exemplo" onPress={() => { setStatus('cancelada'); setMessage('Assinatura de exemplo cancelada. Nenhum contrato real foi alterado.'); setDialog(null); }} />
            </> : <>
              <Text style={styles.body}>Plano: {current.name}{'\n'}Preço proposto: {current.price}/mês{'\n'}Estado de exemplo: {status}</Text>
              <Text style={styles.body}>{statusCopy[status]}</Text>
              <Text style={styles.small}>Datas de vigência, renovação, cobrança e histórico serão exibidos após consulta real ao serviço de assinatura.</Text>
            </>}
            <Action secondary label={dialog === 'cancel' ? 'Manter assinatura' : 'Fechar'} onPress={() => setDialog(null)} />
          </ScrollView></View></View>
        </Modal>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  viewport: { flex: 1, alignItems: 'center', backgroundColor: '#E6DED2' },
  shell: { flex: 1, width: '100%', maxWidth: 430, backgroundColor: colors.background },
  header: { minHeight: 70, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.card, borderBottomWidth: 1, borderColor: colors.line },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 7 }, brandName: { fontSize: 18, fontWeight: '700', color: colors.ink }, mark: { width: 42, height: 42 },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' }, avatarText: { color: 'white', fontWeight: '800' },
  content: { padding: 16, paddingTop: 28, paddingBottom: 32, gap: 18 }, intro: { gap: 10 },
  eyebrow: { color: colors.orange, fontSize: 10, letterSpacing: 1.5, fontWeight: '800' }, title: { color: colors.ink, fontSize: 32, letterSpacing: -1 },
  body: { color: colors.muted, fontSize: 13, lineHeight: 20 }, caption: { color: colors.muted, fontSize: 11, lineHeight: 16 }, small: { color: colors.muted, fontSize: 10, lineHeight: 16 },
  demoNotice: { backgroundColor: '#FFF0E5', borderColor: '#FFD8C2', borderWidth: 1, borderRadius: 16, padding: 15, gap: 10 },
  tabs: { flexDirection: 'row', padding: 4, backgroundColor: '#EEEAE2', borderRadius: 14 }, tab: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 10 }, selectedTab: { backgroundColor: colors.ink }, tabText: { color: colors.muted, fontSize: 12, fontWeight: '700' }, selectedTabText: { color: 'white' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }, sectionTitle: { fontSize: 19, fontWeight: '600', color: colors.ink },
  periods: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' }, period: { paddingHorizontal: 10, paddingVertical: 9, borderWidth: 1, borderColor: colors.line, borderRadius: 20, backgroundColor: colors.card }, periodActive: { borderColor: colors.orange, backgroundColor: '#FFF0E5' }, orangeText: { color: colors.orange, fontWeight: '700' },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, metric: { flexBasis: '46%', flexGrow: 1, padding: 14, backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.line, gap: 8 }, metricValue: { color: colors.ink, fontSize: 29, fontWeight: '600' },
  card: { padding: 18, backgroundColor: colors.card, borderRadius: 20, borderWidth: 1, borderColor: colors.line, gap: 12 }, cardTitle: { color: colors.ink, fontSize: 16, fontWeight: '600' },
  chart: { height: 145, flexDirection: 'row', alignItems: 'flex-end', gap: 12, paddingTop: 12 }, chartColumn: { flex: 1, gap: 8, alignItems: 'center' }, bar: { width: '100%', borderTopLeftRadius: 6, borderTopRightRadius: 6 },
  empty: { paddingVertical: 24, color: colors.muted, fontSize: 13, lineHeight: 21, textAlign: 'center' }, eventRow: { borderTopWidth: 1, borderColor: colors.line, paddingTop: 12, gap: 5 }, eventName: { color: colors.ink, fontSize: 13, fontWeight: '600' },
  insightCard: { padding: 18, gap: 12, borderRadius: 20, backgroundColor: '#EDF2F6' }, divider: { height: 1, backgroundColor: '#D8E1E9' },
  button: { minHeight: 46, paddingHorizontal: 12, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: colors.orange }, buttonText: { color: 'white', fontSize: 12, fontWeight: '700', textAlign: 'center' }, secondaryButton: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line }, secondaryText: { color: colors.ink }, pressed: { opacity: 0.7 },
  badge: { backgroundColor: '#EDF2F6', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 20 }, badgeText: { color: colors.ink, fontSize: 11, fontWeight: '700' }, planName: { color: colors.ink, fontSize: 21, fontWeight: '600' }, price: { color: colors.ink, fontSize: 30, fontWeight: '600' }, benefit: { color: colors.ink, fontSize: 12, lineHeight: 21 }, featuredPlan: { borderColor: colors.orange, borderWidth: 2 }, currentBadge: { color: colors.orange, fontSize: 11, fontWeight: '700' }, feedback: { color: colors.ink, fontSize: 13, lineHeight: 20, padding: 16, borderRadius: 12, backgroundColor: '#E8F1E8' },
  nav: { minHeight: 78, flexDirection: 'row', alignItems: 'flex-end', paddingBottom: 10, paddingHorizontal: 5, backgroundColor: colors.card, borderTopWidth: 1, borderColor: colors.line }, navItem: { flex: 1, minHeight: 52, alignItems: 'center', justifyContent: 'flex-end', gap: 5 }, navLabel: { color: '#8C8C93', fontSize: 8 }, disabledIcon: { color: '#8C8C93', fontSize: 19 }, plus: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.orange, alignItems: 'center', justifyContent: 'center' }, plusText: { color: 'white', fontSize: 27 },
  overlay: { flex: 1, backgroundColor: 'rgba(0, 26, 55, 0.55)', alignItems: 'center', justifyContent: 'center', padding: 20 }, dialog: { width: '100%', maxWidth: 390, maxHeight: '85%', backgroundColor: colors.card, borderRadius: 22, overflow: 'hidden' }, dialogContent: { padding: 24, gap: 18 },
});
