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

type FieldProps = {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'numeric' | 'url';
  secureTextEntry?: boolean;
  multiline?: boolean;
  editable?: boolean;
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
}: FieldProps) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'}
        editable={editable}
        keyboardType={keyboardType}
        multiline={multiline}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9297A3"
        secureTextEntry={secureTextEntry}
        style={[styles.input, multiline && styles.textArea, !editable && styles.inputDisabled]}
        textAlignVertical={multiline ? 'top' : 'center'}
        value={value}
      />
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

const hostTypes: { label: string; value: HostType }[] = [
  { label: 'Produtor de eventos', value: 0 },
  { label: 'Gastronomia', value: 1 },
  { label: 'Empresa', value: 2 },
];

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
  const [legalName] = useState('');
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

  const updateUser = (field: keyof Omit<UserRegistrationDraft, 'typeofUser'>, value: string) => {
    setUserDraft((current) => ({ ...current, [field]: value }));
  };

  const updateHost = (
    field: Exclude<keyof HostRegistrationDraft, 'typeofhost' | 'address'>,
    value: string,
  ) => {
    setHostDraft((current) => ({ ...current, [field]: value }));
  };

  const updateAddress = (field: keyof AddressDraft, value: string) => {
    setHostDraft((current) => ({
      ...current,
      address: { ...current.address, [field]: value },
    }));
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
                label="Nome completo *"
                onChangeText={(value) => updateUser('name', value)}
                placeholder="Nome e sobrenome"
                value={userDraft.name}
              />
              <Field
                keyboardType="email-address"
                label="E-mail *"
                onChangeText={(value) => updateUser('email', value)}
                placeholder="voce@email.com"
                value={userDraft.email}
              />
              <Field
                label="Senha *"
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
                onChangeText={() => undefined}
                placeholder="Preenchida após validar o CNPJ"
                value={legalName}
              />
              <Field
                label="Nome fantasia *"
                onChangeText={(value) => updateHost('name', value)}
                placeholder="Nome da empresa"
                value={hostDraft.name}
              />
              <Field
                keyboardType="numeric"
                label="CNPJ *"
                onChangeText={(value) => updateHost('cnpj', value)}
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
              </View>

              <Field
                keyboardType="phone-pad"
                label="Telefone"
                onChangeText={(value) => updateHost('phone', value)}
                placeholder="(81) 99999-9999"
                value={hostDraft.phone}
              />
              <Field
                label="Descrição da empresa *"
                multiline
                onChangeText={(value) => updateHost('description', value)}
                placeholder="Conte brevemente sobre a empresa"
                value={hostDraft.description}
              />
              <Field
                keyboardType="url"
                label="URL da logo"
                onChangeText={(value) => updateHost('logoUrl', value)}
                placeholder="https://..."
                value={hostDraft.logoUrl}
              />
              <Field
                keyboardType="url"
                label="Instagram"
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
                label="CEP *"
                keyboardType="numeric"
                onChangeText={(value) => updateAddress('cep', value)}
                placeholder="00000-000"
                value={hostDraft.address.cep}
              />
              <Field
                label="Cidade"
                onChangeText={(value) => updateAddress('city', value)}
                placeholder="Recife"
                value={hostDraft.address.city}
              />
              <Field
                label="Logradouro *"
                onChangeText={(value) => updateAddress('street', value)}
                placeholder="Rua ou avenida"
                value={hostDraft.address.street}
              />
              <Field
                label="Número *"
                onChangeText={(value) => updateAddress('number', value)}
                placeholder="77"
                value={hostDraft.address.number}
              />
              <Field
                label="Complemento"
                onChangeText={(value) => updateAddress('complement', value)}
                placeholder="Sala, bloco ou ponto de referência"
                value={hostDraft.address.complement}
              />
              <Field
                label="Bairro"
                onChangeText={(value) => updateAddress('neighborhood', value)}
                placeholder="Bairro do Recife"
                value={hostDraft.address.neighborhood}
              />

              <Pressable
                accessibilityRole="button"
                style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
              >
                <Text style={styles.secondaryButtonText}>＋ Adicionar outro CNPJ / Estabelecimento</Text>
              </Pressable>
            </View>

            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
            >
              <Text style={styles.primaryButtonText}>Validar CNPJ</Text>
            </Pressable>

            <View style={styles.securityNotice}>
              <Text style={styles.securityIcon}>✓</Text>
              <View style={styles.securityCopy}>
                <Text style={styles.securityTitle}>Aprovação segura</Text>
                <Text style={styles.securityDescription}>
                  Após o cadastro, simularemos a análise da empresa e liberaremos seu painel.
                </Text>
              </View>
            </View>

            <View style={styles.loginRow}>
              <Text style={styles.loginText}>Já tem conta? </Text>
              <Text style={styles.loginLink}>Entrar</Text>
            </View>
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
  secondaryButton: {
    minHeight: 48,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF4EC',
    borderColor: '#FFD7C2',
    borderRadius: 13,
    borderWidth: 1,
  },
  secondaryButtonText: {
    color: colors.orange,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
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
  loginRow: {
    paddingTop: 6,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  loginText: {
    color: colors.muted,
    fontSize: 12,
  },
  loginLink: {
    color: colors.orange,
    fontSize: 12,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.72,
  },
});
