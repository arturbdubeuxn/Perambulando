import { Fredoka_700Bold } from '@expo-google-fonts/fredoka/700Bold';
import { useFonts } from 'expo-font';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
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
  ink: '#002B5C',
  muted: '#667085',
  line: '#E7E0D6',
  input: '#FCFAF6',
  danger: '#B42318',
  dangerBackground: '#FFF1F0',
  success: '#257A48',
  successBackground: '#EFF9F0',
};

const apiBaseUrl = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:5014').replace(/\/$/, '');
const accessTokenStorageKey = 'perambulando.accessToken';
const hostIdStorageKey = 'perambulando.hostId';

type StorageLike = {
  getItem: (key: string) => string | null;
};

type CategoryResponse = { id: number; name: string; isActive: boolean };
type HostResponse = { id: number; name: string; isActive: boolean };
type ProgrammingResponse = { id: number; name: string; hostId: number; addressId: number };
type ApiErrorBody = { title?: string; detail?: string; errors?: Record<string, string[]> };
type SubmissionState = {
  status: 'idle' | 'submitting' | 'success' | 'error';
  message: string;
  programmingId?: number;
};

type EventDraft = {
  name: string;
  description: string;
  ticketUrl: string;
  imageUrl: string;
  instagranUrl: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  isFree: boolean;
  minPrice: string;
  maxPrice: string;
  city: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  cep: string;
};

const initialDraft: EventDraft = {
  name: '',
  description: '',
  ticketUrl: '',
  imageUrl: '',
  instagranUrl: '',
  startDate: '',
  startTime: '',
  endDate: '',
  endTime: '',
  isFree: false,
  minPrice: '',
  maxPrice: '',
  city: '',
  street: '',
  number: '',
  complement: '',
  neighborhood: '',
  cep: '',
};

class ApiRequestError extends Error {
  status: number;

  constructor(status: number, body: ApiErrorBody | null, fallback: string) {
    const validationMessages = body?.errors ? Object.values(body.errors).flat() : [];
    super(body?.detail || validationMessages.join(' ') || body?.title || fallback);
    this.status = status;
  }
}

type FieldProps = {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  multiline?: boolean;
  keyboardType?: 'default' | 'url' | 'numeric' | 'decimal-pad';
  editable?: boolean;
  maxLength?: number;
};

function Field({
  label,
  placeholder,
  value,
  onChangeText,
  multiline = false,
  keyboardType = 'default',
  editable = true,
  maxLength,
}: FieldProps) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        autoCapitalize={keyboardType === 'url' ? 'none' : 'sentences'}
        editable={editable}
        keyboardType={keyboardType}
        maxLength={maxLength}
        multiline={multiline}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9297A3"
        style={[styles.input, multiline && styles.textArea, !editable && styles.inputDisabled]}
        textAlignVertical={multiline ? 'top' : 'center'}
        value={value}
      />
    </View>
  );
}

function SectionTitle({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <View style={styles.sectionTitleRow}>
      <View style={styles.sectionNumber}>
        <Text style={styles.sectionNumberText}>{number}</Text>
      </View>
      <View style={styles.sectionTitleCopy}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionDescription}>{description}</Text>
      </View>
    </View>
  );
}

function NavItem({ icon, label, onPress }: { icon: string; label: string; onPress?: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.navItem}>
      <Text style={styles.navIcon}>{icon}</Text>
      <Text style={styles.navLabel}>{label}</Text>
    </Pressable>
  );
}

function getWebSessionStorage(): StorageLike | null {
  if (Platform.OS !== 'web') {
    return null;
  }

  return (globalThis as { sessionStorage?: StorageLike }).sessionStorage ?? null;
}

async function apiRequest<T>(path: string, options: RequestInit = {}) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });
  const responseText = await response.text();
  let body: T | ApiErrorBody | null = null;

  if (responseText) {
    try {
      body = JSON.parse(responseText) as T | ApiErrorBody;
    } catch {
      body = null;
    }
  }

  if (!response.ok) {
    throw new ApiRequestError(
      response.status,
      body as ApiErrorBody | null,
      `A requisição falhou (${response.status}).`,
    );
  }

  return body as T;
}

const onlyDigits = (value: string) => value.replace(/\D/g, '');
const isValidUrl = (value: string) => !value.trim() || /^https?:\/\/\S+$/i.test(value.trim());

function maskCep(value: string) {
  return onlyDigits(value).slice(0, 8).replace(/^(\d{5})(\d)/, '$1-$2');
}

function parseLocalDateTime(dateValue: string, timeValue: string) {
  const dateMatch = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(dateValue.trim());
  const timeMatch = /^(\d{2}):(\d{2})$/.exec(timeValue.trim());
  if (!dateMatch || !timeMatch) {
    return null;
  }

  const day = Number(dateMatch[1]);
  const month = Number(dateMatch[2]);
  const year = Number(dateMatch[3]);
  const hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);
  const value = new Date(year, month - 1, day, hour, minute, 0, 0);

  if (
    value.getFullYear() !== year ||
    value.getMonth() !== month - 1 ||
    value.getDate() !== day ||
    value.getHours() !== hour ||
    value.getMinutes() !== minute
  ) {
    return null;
  }

  return value;
}

function parsePrice(value: string) {
  const normalized = value.trim().replace(',', '.');
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export default function CreateEventScreen() {
  const { width: viewportWidth } = useWindowDimensions();
  const [fontsLoaded] = useFonts({ Fredoka_700Bold });
  const [draft, setDraft] = useState<EventDraft>(initialDraft);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [hosts, setHosts] = useState<HostResponse[]>([]);
  const [selectedHostId, setSelectedHostId] = useState<number | null>(null);
  const [hostOpen, setHostOpen] = useState(false);
  const [accessToken, setAccessToken] = useState('');
  const [loadingReferences, setLoadingReferences] = useState(true);
  const [referenceMessage, setReferenceMessage] = useState('');
  const [submission, setSubmission] = useState<SubmissionState>({ status: 'idle', message: '' });

  const selectedHost = useMemo(
    () => hosts.find((host) => host.id === selectedHostId) ?? null,
    [hosts, selectedHostId],
  );

  useEffect(() => {
    let active = true;

    async function loadReferences() {
      setLoadingReferences(true);
      setReferenceMessage('');
      try {
        const categoryList = await apiRequest<CategoryResponse[]>('/api/Category/GetallCategories');
        if (!active) {
          return;
        }
        setCategories(categoryList.filter((category) => category.isActive));

        const storage = getWebSessionStorage();
        const token = storage?.getItem(accessTokenStorageKey) ?? '';
        const preferredHostId = Number(storage?.getItem(hostIdStorageKey) ?? 0);
        setAccessToken(token);

        if (!token) {
          setReferenceMessage(
            'Sua sessão de host não foi encontrada. Conclua o cadastro de host nesta mesma aba antes de publicar um evento.',
          );
          return;
        }

        const hostList = await apiRequest<HostResponse[]>('/api/Host/GetAllHostsbyUserId', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!active) {
          return;
        }

        const activeHosts = hostList.filter((host) => host.isActive);
        setHosts(activeHosts);
        const preferredHost = activeHosts.find((host) => host.id === preferredHostId);
        setSelectedHostId(preferredHost?.id ?? activeHosts[0]?.id ?? null);

        if (activeHosts.length === 0) {
          setReferenceMessage('Nenhum host ativo foi encontrado para esta conta.');
        }
      } catch (error) {
        if (active) {
          setReferenceMessage(error instanceof Error ? error.message : 'Não foi possível carregar hosts e categorias.');
        }
      } finally {
        if (active) {
          setLoadingReferences(false);
        }
      }
    }

    void loadReferences();
    return () => {
      active = false;
    };
  }, []);

  const updateDraft = <Key extends keyof EventDraft>(key: Key, value: EventDraft[Key]) => {
    setDraft((current) => ({ ...current, [key]: value }));
    if (submission.status === 'error') {
      setSubmission({ status: 'idle', message: '' });
    }
  };

  const toggleCategory = (categoryId: number) => {
    setSelectedCategoryIds((current) =>
      current.includes(categoryId)
        ? current.filter((currentId) => currentId !== categoryId)
        : [...current, categoryId],
    );
  };

  const resetForm = () => {
    setDraft(initialDraft);
    setSelectedCategoryIds([]);
    setSubmission({ status: 'idle', message: '' });
  };

  const publishEvent = async () => {
    const start = parseLocalDateTime(draft.startDate, draft.startTime);
    const end = parseLocalDateTime(draft.endDate, draft.endTime);
    const minPrice = draft.isFree ? 0 : parsePrice(draft.minPrice);
    const maxPrice = draft.isFree ? 0 : parsePrice(draft.maxPrice);

    if (!accessToken) {
      setSubmission({ status: 'error', message: 'Cadastre ou autentique um host antes de publicar o evento.' });
      return;
    }
    if (!selectedHostId) {
      setSubmission({ status: 'error', message: 'Selecione um host ativo para o evento.' });
      return;
    }
    if (!draft.name.trim() || !draft.description.trim()) {
      setSubmission({ status: 'error', message: 'Informe o nome e a descrição do evento.' });
      return;
    }
    if (selectedCategoryIds.length === 0) {
      setSubmission({ status: 'error', message: 'Selecione pelo menos uma categoria cadastrada na API.' });
      return;
    }
    if (!start || !end) {
      setSubmission({ status: 'error', message: 'Informe início e término no formato dd/mm/aaaa e HH:mm.' });
      return;
    }
    if (start <= new Date()) {
      setSubmission({ status: 'error', message: 'A data de início deve ser futura.' });
      return;
    }
    if (end <= start) {
      setSubmission({ status: 'error', message: 'O término deve ser posterior ao início.' });
      return;
    }
    if (
      minPrice === null ||
      maxPrice === null ||
      minPrice < 0 ||
      maxPrice < minPrice ||
      maxPrice > 9999999999.99
    ) {
      setSubmission({
        status: 'error',
        message: 'Informe preços válidos, com até duas casas, e mínimo menor ou igual ao máximo.',
      });
      return;
    }
    if (!draft.isFree && minPrice === 0 && maxPrice === 0) {
      setSubmission({ status: 'error', message: 'Eventos pagos precisam ter pelo menos um preço maior que zero.' });
      return;
    }
    if (!isValidUrl(draft.ticketUrl) || !isValidUrl(draft.imageUrl) || !isValidUrl(draft.instagranUrl)) {
      setSubmission({ status: 'error', message: 'Links devem começar com http:// ou https://.' });
      return;
    }
    if (
      !draft.city.trim() ||
      !draft.street.trim() ||
      !draft.number.trim() ||
      onlyDigits(draft.cep).length !== 8
    ) {
      setSubmission({ status: 'error', message: 'Informe cidade, logradouro, número e CEP válido.' });
      return;
    }

    setSubmission({ status: 'submitting', message: 'Publicando evento...' });
    try {
      const created = await apiRequest<ProgrammingResponse>(`/api/Programming/${selectedHostId}/Create`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          name: draft.name.trim(),
          description: draft.description.trim(),
          startDate: start.toISOString(),
          endDate: end.toISOString(),
          isFree: draft.isFree,
          address: {
            city: draft.city.trim(),
            street: draft.street.trim(),
            number: draft.number.trim(),
            complement: draft.complement.trim(),
            neighborhood: draft.neighborhood.trim(),
            cep: onlyDigits(draft.cep),
          },
          imageUrl: draft.imageUrl.trim(),
          ticketUrl: draft.ticketUrl.trim(),
          instagranUrl: draft.instagranUrl.trim(),
          minPrice,
          maxPrice,
          categoryIds: selectedCategoryIds,
        }),
      });

      setSubmission({
        status: 'success',
        message: `${created.name} foi publicado com sucesso.`,
        programmingId: created.id,
      });
    } catch (error) {
      const message =
        error instanceof TypeError
          ? `Não foi possível acessar ${apiBaseUrl}. Verifique a API e o CORS.`
          : error instanceof Error
            ? error.message
            : 'Não foi possível publicar o evento.';
      setSubmission({ status: 'error', message });
    }
  };

  return (
    <View style={styles.viewport}>
      <View style={[styles.appShell, { width: Math.min(viewportWidth, 430) }]}>
        <StatusBar style="dark" />
        <View style={styles.header}>
          <View accessible accessibilityLabel="Perambulando" style={styles.brand}>
            <Text style={[styles.brandName, fontsLoaded && styles.brandNameFredoka]}>Perambulando</Text>
            <Image
              accessibilityIgnoresInvertColors
              resizeMode="contain"
              source={require('../assets/perambulando-mark.png')}
              style={styles.brandMark}
            />
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>A</Text>
          </View>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardArea}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator
          >
            <View style={styles.intro}>
              <Text style={styles.eyebrow}>PUBLICAR NA CIDADE</Text>
              <Text style={styles.pageTitle}>Criar novo evento</Text>
              <Text style={styles.pageSubtitle}>Preencha os dados exigidos pela API para publicar a programação.</Text>
            </View>

            <View style={styles.sessionCard}>
              <Text style={styles.sessionLabel}>HOST RESPONSÁVEL</Text>
              {loadingReferences ? (
                <Text style={styles.sessionText}>Carregando sessão, hosts e categorias...</Text>
              ) : hosts.length > 0 ? (
                <View style={styles.fieldGroup}>
                  <Pressable
                    accessibilityLabel="Selecionar host"
                    accessibilityRole="button"
                    onPress={() => setHostOpen((current) => !current)}
                    style={({ pressed }) => [styles.select, pressed && styles.pressed]}
                  >
                    <Text style={styles.selectText}>{selectedHost?.name ?? 'Selecione o host'}</Text>
                    <Text style={styles.chevron}>{hostOpen ? '⌃' : '⌄'}</Text>
                  </Pressable>
                  {hostOpen && (
                    <View style={styles.selectMenu}>
                      {hosts.map((host) => (
                        <Pressable
                          key={host.id}
                          onPress={() => {
                            setSelectedHostId(host.id);
                            setHostOpen(false);
                          }}
                          style={({ pressed }) => [
                            styles.selectOption,
                            host.id === selectedHostId && styles.selectOptionActive,
                            pressed && styles.pressed,
                          ]}
                        >
                          <Text style={styles.selectOptionText}>{host.name}</Text>
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>
              ) : (
                <>
                  <Text style={styles.sessionText}>{referenceMessage || 'Nenhum host disponível.'}</Text>
                  <Pressable onPress={() => router.push('/cadastro_host')} style={styles.sessionButton}>
                    <Text style={styles.sessionButtonText}>Ir para cadastro de host</Text>
                  </Pressable>
                </>
              )}
            </View>

            <View style={styles.card}>
              <SectionTitle description="O básico para apresentar seu evento." number="01" title="Informações principais" />
              <Field label="Nome do evento" maxLength={200} onChangeText={(value) => updateDraft('name', value)} placeholder="Ex: Festival Recife Frequência" value={draft.name} />
              <Field label="Descrição" maxLength={2000} multiline onChangeText={(value) => updateDraft('description', value)} placeholder="Conte o que torna esse evento imperdível..." value={draft.description} />
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Categorias</Text>
                {categories.length === 0 ? (
                  <Text style={styles.emptyText}>A API não possui categorias ativas. Cadastre categorias antes de publicar.</Text>
                ) : (
                  <View style={styles.chipList}>
                    {categories.map((category) => {
                      const selected = selectedCategoryIds.includes(category.id);
                      return (
                        <Pressable
                          key={category.id}
                          accessibilityRole="checkbox"
                          accessibilityState={{ checked: selected }}
                          onPress={() => toggleCategory(category.id)}
                          style={[styles.chip, selected && styles.chipSelected]}
                        >
                          <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{category.name}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </View>
              <Field keyboardType="url" label="Link de ingressos" maxLength={2048} onChangeText={(value) => updateDraft('ticketUrl', value)} placeholder="https://..." value={draft.ticketUrl} />
              <Field keyboardType="url" label="Instagram do evento" maxLength={2048} onChangeText={(value) => updateDraft('instagranUrl', value)} placeholder="https://instagram.com/..." value={draft.instagranUrl} />
            </View>

            <View style={styles.card}>
              <SectionTitle description="O backend recebe a URL pública da imagem." number="02" title="Imagem de capa" />
              <Field keyboardType="url" label="URL da imagem" maxLength={2048} onChangeText={(value) => updateDraft('imageUrl', value)} placeholder="https://servidor.com/imagem.jpg" value={draft.imageUrl} />
              <Text style={styles.helperText}>O upload de arquivo ainda não existe na API; por isso a programação envia imageUrl.</Text>
            </View>

            <View style={styles.card}>
              <SectionTitle description="Início futuro, término posterior e preços compatíveis." number="03" title="Quando e quanto" />
              <View style={styles.inlineFields}>
                <View style={styles.inlineField}>
                  <Field label="Data de início" onChangeText={(value) => updateDraft('startDate', value)} placeholder="dd/mm/aaaa" value={draft.startDate} />
                </View>
                <View style={styles.inlineFieldSmall}>
                  <Field label="Horário" onChangeText={(value) => updateDraft('startTime', value)} placeholder="19:00" value={draft.startTime} />
                </View>
              </View>
              <View style={styles.inlineFields}>
                <View style={styles.inlineField}>
                  <Field label="Data de término" onChangeText={(value) => updateDraft('endDate', value)} placeholder="dd/mm/aaaa" value={draft.endDate} />
                </View>
                <View style={styles.inlineFieldSmall}>
                  <Field label="Horário" onChangeText={(value) => updateDraft('endTime', value)} placeholder="22:00" value={draft.endTime} />
                </View>
              </View>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>O evento é gratuito?</Text>
                <View style={styles.segmentedControl}>
                  <Pressable onPress={() => updateDraft('isFree', true)} style={[styles.segment, draft.isFree && styles.segmentActive]}>
                    <Text style={[styles.segmentText, draft.isFree && styles.segmentTextActive]}>Sim</Text>
                  </Pressable>
                  <Pressable onPress={() => updateDraft('isFree', false)} style={[styles.segment, !draft.isFree && styles.segmentActive]}>
                    <Text style={[styles.segmentText, !draft.isFree && styles.segmentTextActive]}>Não</Text>
                  </Pressable>
                </View>
              </View>
              <View style={styles.inlineFields}>
                <View style={styles.inlineField}>
                  <Field editable={!draft.isFree} keyboardType="decimal-pad" label="Preço mínimo" onChangeText={(value) => updateDraft('minPrice', value)} placeholder={draft.isFree ? 'R$ 0,00' : 'Ex: 40,00'} value={draft.isFree ? '' : draft.minPrice} />
                </View>
                <View style={styles.inlineField}>
                  <Field editable={!draft.isFree} keyboardType="decimal-pad" label="Preço máximo" onChangeText={(value) => updateDraft('maxPrice', value)} placeholder={draft.isFree ? 'R$ 0,00' : 'Ex: 80,00'} value={draft.isFree ? '' : draft.maxPrice} />
                </View>
              </View>
            </View>

            <View style={styles.card}>
              <SectionTitle description="O endereço precisa ser enviado em campos separados." number="04" title="Onde acontece" />
              <Field label="Cidade" maxLength={150} onChangeText={(value) => updateDraft('city', value)} placeholder="Recife" value={draft.city} />
              <Field label="Logradouro" maxLength={300} onChangeText={(value) => updateDraft('street', value)} placeholder="Avenida Cais do Apolo" value={draft.street} />
              <View style={styles.inlineFields}>
                <View style={styles.inlineFieldSmall}>
                  <Field label="Número" maxLength={20} onChangeText={(value) => updateDraft('number', value)} placeholder="77" value={draft.number} />
                </View>
                <View style={styles.inlineField}>
                  <Field label="Complemento" maxLength={200} onChangeText={(value) => updateDraft('complement', value)} placeholder="Opcional" value={draft.complement} />
                </View>
              </View>
              <Field label="Bairro" maxLength={150} onChangeText={(value) => updateDraft('neighborhood', value)} placeholder="Bairro do Recife" value={draft.neighborhood} />
              <Field keyboardType="numeric" label="CEP" maxLength={9} onChangeText={(value) => updateDraft('cep', maskCep(value))} placeholder="50030-220" value={draft.cep} />
            </View>

            {submission.status === 'error' ? (
              <View style={[styles.notice, styles.errorNotice]}>
                <Text style={styles.errorNoticeTitle}>Publicação não concluída</Text>
                <Text style={styles.errorNoticeText}>{submission.message}</Text>
              </View>
            ) : null}
            {submission.status === 'success' ? (
              <View style={[styles.notice, styles.successNotice]}>
                <Text style={styles.successNoticeTitle}>Evento publicado</Text>
                <Text style={styles.successNoticeText}>{submission.message}</Text>
                <Text style={styles.successNoticeMeta}>ID da programação: {submission.programmingId}</Text>
              </View>
            ) : null}

            <View style={styles.secondaryActions}>
              <Pressable accessibilityRole="button" onPress={resetForm} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
                <Text style={styles.secondaryButtonText}>Limpar</Text>
              </Pressable>
              <View style={[styles.secondaryButton, styles.secondaryButtonDisabled]}>
                <Text style={styles.secondaryButtonDisabledText}>Rascunho indisponível</Text>
              </View>
            </View>
            <Pressable
              accessibilityRole="button"
              disabled={submission.status === 'submitting'}
              onPress={() => void publishEvent()}
              style={({ pressed }) => [styles.publishButton, pressed && styles.publishButtonPressed, submission.status === 'submitting' && styles.buttonDisabled]}
            >
              <Text style={styles.publishButtonText}>{submission.status === 'submitting' ? 'Publicando...' : '✓  Publicar evento'}</Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>

        <View style={styles.bottomNav}>
          <NavItem icon="▦" label="Painel" />
          <NavItem icon="▣" label="Meus eventos" />
          <Pressable accessibilityRole="button" style={styles.activeNavItem}>
            <View style={styles.activeNavButton}><Text style={styles.activeNavPlus}>＋</Text></View>
            <Text style={styles.activeNavLabel}>Criar evento</Text>
          </Pressable>
          <NavItem icon="⊙" label="Explorar" />
          <NavItem icon="▥" label="Empresa" onPress={() => router.push('/cadastro_host')} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  viewport: { flex: 1, width: '100%', minWidth: 0, alignItems: 'center', backgroundColor: '#E6DED2' },
  appShell: { flex: 1, width: '100%', maxWidth: 430, minWidth: 0, alignSelf: 'center', overflow: 'hidden', backgroundColor: colors.background, borderColor: '#DDD8D2', borderLeftWidth: 1, borderRightWidth: 1 },
  header: { minHeight: 70, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.card, borderBottomColor: colors.line, borderBottomWidth: 1 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  brandName: { color: colors.ink, fontSize: 18, fontWeight: '700', letterSpacing: -0.5 },
  brandNameFredoka: { fontFamily: 'Fredoka_700Bold', fontWeight: 'normal' },
  brandMark: { width: 42, height: 42 },
  avatar: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.ink },
  avatarText: { color: colors.card, fontSize: 14, fontWeight: '800' },
  keyboardArea: { flex: 1 },
  scrollContent: { paddingHorizontal: 12, paddingTop: 34, paddingBottom: 28, gap: 14 },
  intro: { paddingHorizontal: 2, paddingBottom: 10 },
  eyebrow: { marginBottom: 15, color: colors.orange, fontSize: 10, fontWeight: '800', letterSpacing: 1.7 },
  pageTitle: { color: colors.ink, fontSize: 30, fontWeight: '400', letterSpacing: -1.2 },
  pageSubtitle: { maxWidth: 360, marginTop: 10, color: colors.muted, fontSize: 14, lineHeight: 21 },
  card: { padding: 16, borderRadius: 20, backgroundColor: colors.card, borderColor: colors.line, borderWidth: 1, gap: 16, ...Platform.select({ web: { boxShadow: '0 8px 24px rgba(20, 18, 16, 0.035)' }, default: { elevation: 1, shadowColor: '#000000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12 } }) },
  sessionCard: { padding: 16, borderRadius: 18, backgroundColor: '#FFF7F1', borderColor: '#FFD8C2', borderWidth: 1, gap: 10 },
  sessionLabel: { color: colors.orange, fontSize: 10, fontWeight: '800', letterSpacing: 1.3 },
  sessionText: { color: colors.ink, fontSize: 12, lineHeight: 18 },
  sessionButton: { minHeight: 42, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.ink },
  sessionButtonText: { color: colors.card, fontSize: 12, fontWeight: '800' },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 4 },
  sectionNumber: { width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.ink },
  sectionNumberText: { color: colors.card, fontSize: 11, fontWeight: '800' },
  sectionTitleCopy: { flex: 1, paddingTop: 1 },
  sectionTitle: { color: colors.ink, fontSize: 16, fontWeight: '500' },
  sectionDescription: { marginTop: 3, color: colors.muted, fontSize: 10, lineHeight: 14 },
  fieldGroup: { gap: 8 },
  fieldLabel: { color: colors.ink, fontSize: 11, fontWeight: '700' },
  input: { minHeight: 52, paddingHorizontal: 14, borderRadius: 12, borderColor: colors.line, borderWidth: 1, backgroundColor: colors.input, color: colors.ink, fontSize: 14 },
  inputDisabled: { opacity: 0.65, backgroundColor: '#F1EEE9' },
  textArea: { minHeight: 112, paddingTop: 14, lineHeight: 20 },
  inlineFields: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  inlineField: { flex: 1, minWidth: 0 },
  inlineFieldSmall: { flex: 0.68, minWidth: 0 },
  select: { minHeight: 52, paddingHorizontal: 14, borderRadius: 12, borderColor: colors.line, borderWidth: 1, backgroundColor: colors.input, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  selectText: { color: colors.ink, fontSize: 14 },
  chevron: { color: colors.ink, fontSize: 18 },
  selectMenu: { overflow: 'hidden', marginTop: -2, borderRadius: 12, borderColor: colors.line, borderWidth: 1, backgroundColor: colors.card },
  selectOption: { minHeight: 44, paddingHorizontal: 14, justifyContent: 'center', borderBottomColor: colors.line, borderBottomWidth: 1 },
  selectOptionActive: { backgroundColor: '#FFF0E6' },
  selectOptionText: { color: colors.ink, fontSize: 14 },
  chipList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minHeight: 36, paddingHorizontal: 12, borderRadius: 18, borderColor: colors.line, borderWidth: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.input },
  chipSelected: { borderColor: colors.orange, backgroundColor: '#FFF0E6' },
  chipText: { color: colors.ink, fontSize: 12, fontWeight: '600' },
  chipTextSelected: { color: colors.orange, fontWeight: '800' },
  emptyText: { padding: 12, borderRadius: 10, color: colors.danger, backgroundColor: colors.dangerBackground, fontSize: 11, lineHeight: 17 },
  helperText: { color: colors.muted, fontSize: 10, lineHeight: 15 },
  segmentedControl: { flexDirection: 'row', padding: 3, borderRadius: 12, backgroundColor: '#F1EEE9' },
  segment: { flex: 1, minHeight: 40, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  segmentActive: { backgroundColor: colors.orange },
  segmentText: { color: colors.ink, fontSize: 12, fontWeight: '700' },
  segmentTextActive: { color: colors.card },
  notice: { padding: 16, borderRadius: 18, borderWidth: 1, gap: 6 },
  errorNotice: { backgroundColor: colors.dangerBackground, borderColor: '#FFB4AE' },
  errorNoticeTitle: { color: colors.danger, fontSize: 16, fontWeight: '800' },
  errorNoticeText: { color: '#8F2D24', fontSize: 12, lineHeight: 19 },
  successNotice: { backgroundColor: colors.successBackground, borderColor: '#B7E0C2' },
  successNoticeTitle: { color: colors.success, fontSize: 16, fontWeight: '800' },
  successNoticeText: { color: '#356B47', fontSize: 12, lineHeight: 19 },
  successNoticeMeta: { color: colors.success, fontSize: 11, fontWeight: '700' },
  secondaryActions: { flexDirection: 'row', gap: 10, marginTop: 2 },
  secondaryButton: { flex: 1, minHeight: 48, borderRadius: 12, borderColor: colors.line, borderWidth: 1, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  secondaryButtonText: { color: colors.ink, fontSize: 13, fontWeight: '700' },
  secondaryButtonDisabled: { backgroundColor: '#F1EEE9' },
  secondaryButtonDisabledText: { color: '#9A9AA2', fontSize: 11, fontWeight: '700' },
  publishButton: { minHeight: 52, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.orange, ...Platform.select({ web: { boxShadow: '0 8px 18px rgba(255, 90, 10, 0.24)' }, default: { elevation: 3 } }) },
  publishButtonPressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
  publishButtonText: { color: colors.card, fontSize: 14, fontWeight: '800' },
  buttonDisabled: { opacity: 0.55 },
  pressed: { opacity: 0.72 },
  bottomNav: { minHeight: 74, paddingHorizontal: 5, paddingBottom: 7, flexDirection: 'row', alignItems: 'flex-end', backgroundColor: colors.card, borderTopColor: colors.line, borderTopWidth: 1 },
  navItem: { flex: 1, minHeight: 54, alignItems: 'center', justifyContent: 'flex-end', gap: 3 },
  navIcon: { color: '#8C8C93', fontSize: 19, lineHeight: 20 },
  navLabel: { color: '#8C8C93', fontSize: 8 },
  activeNavItem: { flex: 1.18, minHeight: 68, alignItems: 'center', justifyContent: 'flex-end', gap: 4 },
  activeNavButton: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.orange, borderColor: colors.card, borderWidth: 4, ...Platform.select({ web: { boxShadow: '0 5px 14px rgba(255, 90, 10, 0.3)' }, default: { elevation: 4 } }) },
  activeNavPlus: { color: colors.card, fontSize: 24, fontWeight: '300', lineHeight: 25 },
  activeNavLabel: { color: colors.orange, fontSize: 8, fontWeight: '800' },
});
