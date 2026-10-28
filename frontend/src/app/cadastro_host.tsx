import { Fredoka_700Bold } from '@expo-google-fonts/fredoka/700Bold';
import { useFonts } from 'expo-font';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
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
  success: '#257A48',
  successBackground: '#EFF9F0',
};

const apiBaseUrl = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:5014').replace(/\/$/, '');
const accessTokenStorageKey = 'perambulando.accessToken';
const hostIdStorageKey = 'perambulando.hostId';

type WritableStorageLike = {
  setItem: (key: string, value: string) => void;
};

function storeWebSession(accessToken: string, hostId?: number) {
  if (Platform.OS !== 'web') {
    return;
  }

  const storage = (globalThis as { sessionStorage?: WritableStorageLike }).sessionStorage;
  storage?.setItem(accessTokenStorageKey, accessToken);
  if (hostId) {
    storage?.setItem(hostIdStorageKey, String(hostId));
  }
}

type FieldProps = {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'numeric' | 'url';
  secureTextEntry?: boolean;
  multiline?: boolean;
  editable?: boolean;
  error?: string;
  maxLength?: number;
};

function Field({
  label,
  placeholder,
  value,
  onChangeText,
  keyboardType = 'default',
  secureTextEntry = false,
  multiline = false,
  editable = true,
  error,
  maxLength,
}: FieldProps) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'}
        editable={editable}
        keyboardType={keyboardType}
        maxLength={maxLength}
        multiline={multiline}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9297A3"
        secureTextEntry={secureTextEntry}
        style={[
          styles.input,
          multiline && styles.textArea,
          !editable && styles.inputDisabled,
          error && styles.inputError,
        ]}
        textAlignVertical={multiline ? 'top' : 'center'}
        value={value}
      />
      {error && <Text style={styles.fieldError}>{error}</Text>}
    </View>
  );
}

type UserRegistrationDraft = {
  name: string;
  email: string;
  password: string;
  typeofUser: 0;
};

type AddressDraft = {
  city: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  cep: string;
};

type HostType = 0 | 1 | 2;

type HostRegistrationDraft = {
  typeofhost: HostType | null;
  cnpj: string;
  logoUrl: string;
  instagranUrl: string;
  phone: string;
  name: string;
  description: string;
  address: AddressDraft;
};

type RegistrationErrors = Partial<{
  userName: string;
  email: string;
  password: string;
  hostType: string;
  cnpj: string;
  phone: string;
  hostName: string;
  description: string;
  logoUrl: string;
  instagranUrl: string;
  city: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  cep: string;
}>;

type PreparedRegistration = {
  user: UserRegistrationDraft;
  host: Omit<HostRegistrationDraft, 'typeofhost'> & { typeofhost: HostType };
};

type AuthResponse = {
  accessToken: string;
};

type CompanyRegistrationResponse = {
  legalName: string;
  tradeName: string;
};

type HostCreateResponse = {
  result: {
    id: number;
    addressId: number;
    name: string;
  };
  auth: AuthResponse;
};

type ApiErrorBody = {
  title?: string;
  detail?: string;
  errors?: Record<string, string[]>;
};

type SubmissionState = {
  status: 'idle' | 'submitting' | 'success' | 'error';
  message: string;
  hostId?: number;
  addressId?: number;
};

class ApiRequestError extends Error {
  status: number;
  body: ApiErrorBody | null;

  constructor(status: number, body: ApiErrorBody | null) {
    const validationMessages = body?.errors ? Object.values(body.errors).flat() : [];
    super(body?.detail || validationMessages.join(' ') || body?.title || 'A requisição falhou.');
    this.status = status;
    this.body = body;
  }
}

const hostTypes: { label: string; value: HostType }[] = [
  { label: 'Produtor de eventos', value: 0 },
  { label: 'Gastronomia', value: 1 },
  { label: 'Empresa', value: 2 },
];

const onlyDigits = (value: string) => value.replace(/\D/g, '');

function maskCnpj(value: string) {
  return onlyDigits(value)
    .slice(0, 14)
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

function maskCep(value: string) {
  return onlyDigits(value).slice(0, 8).replace(/^(\d{5})(\d)/, '$1-$2');
}

function maskPhone(value: string) {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length <= 10) {
    return digits
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }
  return digits
    .replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2');
}

function isValidCnpj(value: string) {
  const digits = onlyDigits(value);
  if (digits.length !== 14 || /^(\d)\1{13}$/.test(digits)) {
    return false;
  }

  const calculateDigit = (length: number) => {
    let sum = 0;
    let weight = 2;
    for (let index = length - 1; index >= 0; index -= 1) {
      sum += Number(digits[index]) * weight;
      weight = weight === 9 ? 2 : weight + 1;
    }
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  return Number(digits[12]) === calculateDigit(12) && Number(digits[13]) === calculateDigit(13);
}

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
const isValidUrl = (value: string) => /^https?:\/\/\S+$/i.test(value.trim());

async function apiRequest<T>(path: string, options: RequestInit = {}) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });
  const body = (await response.json().catch(() => null)) as T | ApiErrorBody | null;

  if (!response.ok) {
    throw new ApiRequestError(response.status, body as ApiErrorBody | null);
  }

  return body as T;
}

type SectionTitleProps = {
  number: string;
  title: string;
  description: string;
};

function SectionTitle({ number, title, description }: SectionTitleProps) {
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

export default function HostRegistrationScreen() {
  const { width: viewportWidth } = useWindowDimensions();
  const [fontsLoaded] = useFonts({ Fredoka_700Bold });
  const [hostTypeOpen, setHostTypeOpen] = useState(false);
  const [legalName, setLegalName] = useState('');
  const [errors, setErrors] = useState<RegistrationErrors>({});
  const [userRegistered, setUserRegistered] = useState(false);
  const [submission, setSubmission] = useState<SubmissionState>({
    status: 'idle',
    message: '',
  });
  const [userDraft, setUserDraft] = useState<UserRegistrationDraft>({
    name: '',
    email: '',
    password: '',
    typeofUser: 0,
  });
  const [hostDraft, setHostDraft] = useState<HostRegistrationDraft>({
    typeofhost: null,
    cnpj: '',
    logoUrl: '',
    instagranUrl: '',
    phone: '',
    name: '',
    description: '',
    address: {
      city: '',
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      cep: '',
    },
  });

  const selectedHostType = hostTypes.find((item) => item.value === hostDraft.typeofhost);

  const resetValidation = () => {
    setErrors({});
    setSubmission({ status: 'idle', message: '' });
  };

  const updateUser = (field: keyof Omit<UserRegistrationDraft, 'typeofUser'>, value: string) => {
    resetValidation();
    setUserRegistered(false);
    setUserDraft((current) => ({ ...current, [field]: value }));
  };

  const updateHost = (
    field: Exclude<keyof HostRegistrationDraft, 'typeofhost' | 'address'>,
    value: string,
  ) => {
    resetValidation();
    setHostDraft((current) => ({ ...current, [field]: value }));
  };

  const updateAddress = (field: keyof AddressDraft, value: string) => {
    resetValidation();
    setHostDraft((current) => ({
      ...current,
      address: { ...current.address, [field]: value },
    }));
  };

  const validateRegistration = (): PreparedRegistration | null => {
    const nextErrors: RegistrationErrors = {};
    const normalizedEmail = userDraft.email.trim();
    const phoneDigits = onlyDigits(hostDraft.phone);

    if (!userDraft.name.trim()) {
      nextErrors.userName = 'Informe o nome completo.';
    }
    if (!isValidEmail(normalizedEmail)) {
      nextErrors.email = 'Informe um e-mail válido.';
    }
    if (
      userDraft.password.length < 8 ||
      !/[a-z]/.test(userDraft.password) ||
      !/[A-Z]/.test(userDraft.password) ||
      !/\d/.test(userDraft.password) ||
      !/[^A-Za-z0-9]/.test(userDraft.password)
    ) {
      nextErrors.password = 'Use 8 caracteres, com maiúscula, minúscula, número e símbolo.';
    }
    if (!hostDraft.name.trim()) {
      nextErrors.hostName = 'Informe o nome fantasia.';
    }
    if (!isValidCnpj(hostDraft.cnpj)) {
      nextErrors.cnpj = 'Informe um CNPJ válido.';
    }
    if (hostDraft.typeofhost === null) {
      nextErrors.hostType = 'Selecione um tipo de host.';
    }
    if (phoneDigits.length > 0 && phoneDigits.length !== 10 && phoneDigits.length !== 11) {
      nextErrors.phone = 'Informe um telefone com DDD.';
    }
    if (!hostDraft.description.trim()) {
      nextErrors.description = 'Informe uma descrição da empresa.';
    }
    if (hostDraft.logoUrl && !isValidUrl(hostDraft.logoUrl)) {
      nextErrors.logoUrl = 'Use uma URL iniciada por http:// ou https://.';
    }
    if (hostDraft.instagranUrl && !isValidUrl(hostDraft.instagranUrl)) {
      nextErrors.instagranUrl = 'Use uma URL iniciada por http:// ou https://.';
    }
    if (hostDraft.address.city.length > 150) {
      nextErrors.city = 'A cidade deve ter no máximo 150 caracteres.';
    }
    if (!hostDraft.address.street.trim()) {
      nextErrors.street = 'Informe o logradouro.';
    }
    if (!hostDraft.address.number.trim()) {
      nextErrors.number = 'Informe o número.';
    }
    if (onlyDigits(hostDraft.address.cep).length !== 8) {
      nextErrors.cep = 'Informe um CEP com oito dígitos.';
    }

    if (Object.keys(nextErrors).length > 0 || hostDraft.typeofhost === null) {
      setErrors(nextErrors);
      return null;
    }

    const prepared: PreparedRegistration = {
      user: {
        name: userDraft.name.trim(),
        email: normalizedEmail,
        password: userDraft.password,
        typeofUser: 0,
      },
      host: {
        typeofhost: hostDraft.typeofhost,
        cnpj: onlyDigits(hostDraft.cnpj),
        logoUrl: hostDraft.logoUrl.trim(),
        instagranUrl: hostDraft.instagranUrl.trim(),
        phone: hostDraft.phone.trim(),
        name: hostDraft.name.trim(),
        description: hostDraft.description.trim(),
        address: {
          city: hostDraft.address.city.trim(),
          street: hostDraft.address.street.trim(),
          number: hostDraft.address.number.trim(),
          complement: hostDraft.address.complement.trim(),
          neighborhood: hostDraft.address.neighborhood.trim(),
          cep: hostDraft.address.cep,
        },
      },
    };

    setErrors({});
    return prepared;
  };

  const submitRegistration = async () => {
    const prepared = validateRegistration();
    if (!prepared) {
      setSubmission({ status: 'error', message: 'Revise os campos destacados.' });
      return;
    }

    setSubmission({ status: 'submitting', message: 'Enviando cadastro...' });
    let accountCreatedDuringAttempt = false;

    try {
      if (!userRegistered) {
        try {
          await apiRequest<{ message: string }>('/api/User/auth/Register', {
            method: 'POST',
            body: JSON.stringify(prepared.user),
          });
          setUserRegistered(true);
          accountCreatedDuringAttempt = true;
        } catch (error) {
          const duplicateAccount =
            error instanceof ApiRequestError &&
            Object.keys(error.body?.errors ?? {}).some((key) => key.startsWith('Duplicate'));
          if (!duplicateAccount) {
            throw error;
          }
          setUserRegistered(true);
        }
      }

      const auth = await apiRequest<AuthResponse>('/api/User/auth/Login', {
        method: 'POST',
        body: JSON.stringify({
          email: prepared.user.email,
          password: prepared.user.password,
        }),
      });
      storeWebSession(auth.accessToken);

      const authorization = { Authorization: `Bearer ${auth.accessToken}` };
      const company = await apiRequest<CompanyRegistrationResponse>(
        `/api/Host/GetByCNPJ?cnpj=${encodeURIComponent(prepared.host.cnpj)}`,
        { headers: authorization },
      );
      setLegalName(company.legalName);

      const created = await apiRequest<HostCreateResponse>('/api/Host/Create', {
        method: 'POST',
        headers: authorization,
        body: JSON.stringify(prepared.host),
      });
      storeWebSession(created.auth.accessToken, created.result.id);

      setSubmission({
        status: 'success',
        message: `${created.result.name} foi cadastrado com sucesso.`,
        hostId: created.result.id,
        addressId: created.result.addressId,
      });
    } catch (error) {
      const baseMessage =
        error instanceof TypeError
          ? `Não foi possível acessar ${apiBaseUrl}. Verifique se a API está ativa e se o CORS permite esta origem.`
          : error instanceof Error
            ? error.message
            : 'Não foi possível concluir o cadastro.';
      const partialMessage = accountCreatedDuringAttempt
        ? `A conta foi criada, mas o host não foi gravado. ${baseMessage}`
        : baseMessage;
      setSubmission({ status: 'error', message: partialMessage });
    }
  };

  return (
    <View style={styles.viewport}>
      <View style={[styles.appShell, { width: Math.min(viewportWidth, 430) }]}>
        <StatusBar style="dark" />

        <View style={styles.header}>
          <Pressable
            accessibilityLabel="Voltar"
            accessibilityRole="button"
            onPress={() => router.replace('/')}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          >
            <Text style={styles.backIcon}>‹</Text>
          </Pressable>

          <View accessible accessibilityLabel="Perambulando" style={styles.brand}>
            <Text style={[styles.brandName, fontsLoaded && styles.brandNameFredoka]}>
              Perambulando
            </Text>
            <Image
              accessibilityIgnoresInvertColors
              resizeMode="contain"
              source={require('../../assets/perambulando-mark.png')}
              style={styles.brandMark}
            />
          </View>

          <View style={styles.headerSpacer} />
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
              <Text style={styles.eyebrow}>CADASTRO HOST</Text>
              <Text style={styles.pageTitle}>Conte sobre sua empresa</Text>
              <Text style={styles.pageSubtitle}>
                Validaremos os dados antes da primeira publicação.
              </Text>
            </View>

            <View style={styles.card}>
              <SectionTitle
                description="Seus dados de acesso e contato"
                number="01"
                title="Dados pessoais"
              />

              <Field
                error={errors.userName}
                label="Nome completo *"
                maxLength={256}
                onChangeText={(value) => updateUser('name', value)}
                placeholder="Nome e sobrenome"
                value={userDraft.name}
              />
              <Field
                error={errors.email}
                keyboardType="email-address"
                label="E-mail *"
                maxLength={256}
                onChangeText={(value) => updateUser('email', value)}
                placeholder="voce@email.com"
                value={userDraft.email}
              />
              <Field
                error={errors.password}
                label="Senha *"
                maxLength={128}
                onChangeText={(value) => updateUser('password', value)}
                placeholder="Mínimo 8 caracteres"
                secureTextEntry
                value={userDraft.password}
              />

              <View style={styles.hostAccountNotice}>
                <Text style={styles.hostAccountNoticeTitle}>Conta destinada a host</Text>
                <Text style={styles.hostAccountNoticeText}>
                  O perfil será vinculado automaticamente à função HOST ao concluir o cadastro da empresa.
                </Text>
              </View>
            </View>

            <View style={styles.card}>
              <SectionTitle
                description="Você poderá adicionar outras depois"
                number="02"
                title="Dados empresariais"
              />

              <Field
                editable={false}
                label="Razão social"
                maxLength={256}
                onChangeText={() => undefined}
                placeholder="Preenchida após validar o CNPJ"
                value={legalName}
              />
              <Field
                error={errors.hostName}
                label="Nome fantasia *"
                maxLength={150}
                onChangeText={(value) => updateHost('name', value)}
                placeholder="Nome da empresa"
                value={hostDraft.name}
              />
              <Field
                error={errors.cnpj}
                keyboardType="numeric"
                label="CNPJ *"
                maxLength={18}
                onChangeText={(value) => updateHost('cnpj', maskCnpj(value))}
                placeholder="00.000.000/0000-00"
                value={hostDraft.cnpj}
              />

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Tipo de host *</Text>
                <Pressable
                  accessibilityLabel="Selecionar tipo de host"
                  accessibilityRole="button"
                  onPress={() => setHostTypeOpen((current) => !current)}
                  style={({ pressed }) => [styles.select, pressed && styles.pressed]}
                >
                  <Text style={styles.selectText}>{selectedHostType?.label ?? 'Selecione'}</Text>
                  <Text style={styles.chevron}>{hostTypeOpen ? '⌃' : '⌄'}</Text>
                </Pressable>

                {hostTypeOpen && (
                  <View style={styles.selectMenu}>
                    {hostTypes.map((item) => (
                      <Pressable
                        key={item.value}
                        onPress={() => {
                          resetValidation();
                          setHostDraft((current) => ({ ...current, typeofhost: item.value }));
                          setHostTypeOpen(false);
                        }}
                        style={({ pressed }) => [
                          styles.selectOption,
                          item.value === hostDraft.typeofhost && styles.selectOptionActive,
                          pressed && styles.pressed,
                        ]}
                      >
                        <Text style={styles.selectOptionText}>{item.label}</Text>
                      </Pressable>
                    ))}
                  </View>
                )}
                {errors.hostType && <Text style={styles.fieldError}>{errors.hostType}</Text>}
              </View>

              <Field
                error={errors.phone}
                keyboardType="phone-pad"
                label="Telefone"
                maxLength={15}
                onChangeText={(value) => updateHost('phone', maskPhone(value))}
                placeholder="(81) 99999-9999"
                value={hostDraft.phone}
              />
              <Field
                error={errors.description}
                label="Descrição da empresa *"
                maxLength={2000}
                multiline
                onChangeText={(value) => updateHost('description', value)}
                placeholder="Conte brevemente sobre a empresa"
                value={hostDraft.description}
              />
              <Field
                error={errors.logoUrl}
                keyboardType="url"
                label="URL da logo"
                maxLength={2048}
                onChangeText={(value) => updateHost('logoUrl', value)}
                placeholder="https://..."
                value={hostDraft.logoUrl}
              />
              <Field
                error={errors.instagranUrl}
                keyboardType="url"
                label="Instagram"
                maxLength={2048}
                onChangeText={(value) => updateHost('instagranUrl', value)}
                placeholder="https://instagram.com/..."
                value={hostDraft.instagranUrl}
              />
            </View>

            <View style={styles.card}>
              <SectionTitle
                description="Informe o endereço usado no cadastro do estabelecimento"
                number="03"
                title="Endereço"
              />

              <Field
                error={errors.cep}
                label="CEP *"
                keyboardType="numeric"
                maxLength={9}
                onChangeText={(value) => updateAddress('cep', maskCep(value))}
                placeholder="00000-000"
                value={hostDraft.address.cep}
              />
              <Field
                error={errors.city}
                label="Cidade"
                maxLength={150}
                onChangeText={(value) => updateAddress('city', value)}
                placeholder="Recife"
                value={hostDraft.address.city}
              />
              <Field
                error={errors.street}
                label="Logradouro *"
                maxLength={300}
                onChangeText={(value) => updateAddress('street', value)}
                placeholder="Rua ou avenida"
                value={hostDraft.address.street}
              />
              <Field
                error={errors.number}
                label="Número *"
                maxLength={20}
                onChangeText={(value) => updateAddress('number', value)}
                placeholder="77"
                value={hostDraft.address.number}
              />
              <Field
                error={errors.complement}
                label="Complemento"
                maxLength={200}
                onChangeText={(value) => updateAddress('complement', value)}
                placeholder="Sala, bloco ou ponto de referência"
                value={hostDraft.address.complement}
              />
              <Field
                error={errors.neighborhood}
                label="Bairro"
                maxLength={150}
                onChangeText={(value) => updateAddress('neighborhood', value)}
                placeholder="Bairro do Recife"
                value={hostDraft.address.neighborhood}
              />

            </View>

            <Pressable
              accessibilityRole="button"
              disabled={submission.status === 'submitting'}
              onPress={submitRegistration}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.pressed,
                submission.status === 'submitting' && styles.buttonDisabled,
              ]}
            >
              <Text style={styles.primaryButtonText}>
                {submission.status === 'submitting' ? 'Enviando...' : 'Cadastrar host'}
              </Text>
            </Pressable>

            {submission.status === 'success' ? (
              <View accessibilityRole="alert" style={styles.securityNotice}>
                <Text style={styles.securityIcon}>✓</Text>
                <View style={styles.securityCopy}>
                  <Text style={styles.securityTitle}>Host cadastrado</Text>
                  <Text style={styles.securityDescription}>
                    {submission.message} ID do host: {submission.hostId}. ID do endereço:{' '}
                    {submission.addressId}.
                  </Text>
                </View>
              </View>
            ) : submission.status === 'error' ? (
              <View accessibilityRole="alert" style={styles.errorNotice}>
                <Text style={styles.errorNoticeTitle}>Cadastro não concluído</Text>
                <Text style={styles.errorNoticeText}>{submission.message}</Text>
              </View>
            ) : (
              <View style={styles.pendingNotice}>
                <Text style={styles.pendingNoticeTitle}>
                  {submission.status === 'submitting' ? 'Cadastro em andamento' : 'Cadastro seguro'}
                </Text>
                <Text style={styles.pendingNoticeText}>
                  {submission.status === 'submitting'
                    ? submission.message
                    : 'Validaremos a conta, o CNPJ e o endereço antes de concluir o cadastro.'}
                </Text>
              </View>
            )}

          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  viewport: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#E6DED2',
  },
  appShell: {
    flex: 1,
    width: '100%',
    maxWidth: 430,
    minWidth: 0,
    alignSelf: 'center',
    overflow: 'hidden',
    backgroundColor: colors.background,
    borderColor: '#DDD8D2',
    borderLeftWidth: 1,
    borderRightWidth: 1,
  },
  header: {
    minHeight: 70,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderBottomColor: colors.line,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderColor: colors.line,
    borderWidth: 1,
  },
  backIcon: {
    marginTop: -2,
    color: colors.ink,
    fontSize: 28,
    lineHeight: 28,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  brandName: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  brandNameFredoka: {
    fontFamily: 'Fredoka_700Bold',
    fontWeight: 'normal',
  },
  brandMark: {
    width: 40,
    height: 40,
  },
  headerSpacer: {
    width: 34,
  },
  keyboardArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingTop: 32,
    paddingBottom: 34,
    gap: 14,
  },
  intro: {
    paddingHorizontal: 2,
    paddingBottom: 10,
  },
  eyebrow: {
    marginBottom: 14,
    color: colors.orange,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.7,
  },
  pageTitle: {
    color: colors.ink,
    fontSize: 30,
    fontWeight: '400',
    letterSpacing: -1.2,
  },
  pageSubtitle: {
    maxWidth: 340,
    marginTop: 9,
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21,
  },
  card: {
    padding: 16,
    gap: 16,
    backgroundColor: colors.card,
    borderColor: colors.line,
    borderRadius: 20,
    borderWidth: 1,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 2,
  },
  sectionNumber: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.ink,
  },
  sectionNumberText: {
    color: colors.card,
    fontSize: 11,
    fontWeight: '800',
  },
  sectionTitleCopy: {
    flex: 1,
    paddingTop: 1,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '700',
  },
  sectionDescription: {
    marginTop: 3,
    color: colors.muted,
    fontSize: 11,
    lineHeight: 15,
  },
  fieldGroup: {
    gap: 8,
  },
  fieldLabel: {
    color: colors.ink,
    fontSize: 11,
    fontWeight: '700',
  },
  input: {
    width: '100%',
    minHeight: 52,
    paddingHorizontal: 14,
    color: colors.ink,
    fontSize: 14,
    backgroundColor: colors.input,
    borderColor: colors.line,
    borderRadius: 13,
    borderWidth: 1,
  },
  inputDisabled: {
    color: colors.muted,
    backgroundColor: '#F3F0EA',
  },
  inputError: {
    borderColor: '#C62828',
  },
  fieldError: {
    color: '#B42318',
    fontSize: 11,
    lineHeight: 15,
  },
  textArea: {
    minHeight: 104,
    paddingTop: 14,
  },
  hostAccountNotice: {
    padding: 13,
    backgroundColor: '#FFF4EC',
    borderRadius: 13,
  },
  hostAccountNoticeTitle: {
    color: colors.orange,
    fontSize: 12,
    fontWeight: '800',
  },
  hostAccountNoticeText: {
    marginTop: 4,
    color: colors.muted,
    fontSize: 11,
    lineHeight: 16,
  },
  select: {
    minHeight: 52,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.input,
    borderColor: colors.line,
    borderRadius: 13,
    borderWidth: 1,
  },
  selectText: {
    color: colors.ink,
    fontSize: 14,
  },
  chevron: {
    color: colors.ink,
    fontSize: 16,
  },
  selectMenu: {
    overflow: 'hidden',
    backgroundColor: colors.card,
    borderColor: colors.line,
    borderRadius: 13,
    borderWidth: 1,
  },
  selectOption: {
    minHeight: 42,
    paddingHorizontal: 14,
    justifyContent: 'center',
    borderBottomColor: colors.line,
    borderBottomWidth: 1,
  },
  selectOptionActive: {
    backgroundColor: '#FFF0E6',
  },
  selectOptionText: {
    color: colors.ink,
    fontSize: 13,
  },
  primaryButton: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.orange,
    borderRadius: 13,
    shadowColor: colors.orange,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  buttonDisabled: {
    opacity: 0.62,
  },
  securityNotice: {
    padding: 15,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: colors.successBackground,
    borderRadius: 14,
  },
  securityIcon: {
    color: colors.success,
    fontSize: 16,
    fontWeight: '800',
  },
  securityCopy: {
    flex: 1,
  },
  securityTitle: {
    color: colors.success,
    fontSize: 14,
    fontWeight: '800',
  },
  securityDescription: {
    marginTop: 4,
    color: '#4F755E',
    fontSize: 11,
    lineHeight: 16,
  },
  pendingNotice: {
    padding: 15,
    backgroundColor: '#FFF4EC',
    borderRadius: 14,
  },
  pendingNoticeTitle: {
    color: colors.orange,
    fontSize: 14,
    fontWeight: '800',
  },
  pendingNoticeText: {
    marginTop: 4,
    color: colors.muted,
    fontSize: 11,
    lineHeight: 16,
  },
  errorNotice: {
    padding: 15,
    backgroundColor: '#FFF1F0',
    borderColor: '#FECACA',
    borderRadius: 14,
    borderWidth: 1,
  },
  errorNoticeTitle: {
    color: '#B42318',
    fontSize: 14,
    fontWeight: '800',
  },
  errorNoticeText: {
    marginTop: 4,
    color: '#7A271A',
    fontSize: 11,
    lineHeight: 16,
  },
  pressed: {
    opacity: 0.72,
  },
});
