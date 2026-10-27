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
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'numeric';
  secureTextEntry?: boolean;
};

function Field({
  label,
  placeholder,
  keyboardType = 'default',
  secureTextEntry = false,
}: FieldProps) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'}
        keyboardType={keyboardType}
        placeholder={placeholder}
        placeholderTextColor="#9297A3"
        secureTextEntry={secureTextEntry}
        style={styles.input}
      />
    </View>
  );
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
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [category, setCategory] = useState('Selecione');

  const categories = ['Bar e restaurante', 'Casa de shows', 'Espaço cultural', 'Outro'];

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

              <Field label="Nome completo" placeholder="Nome e sobrenome" />
              <Field label="E-mail" keyboardType="email-address" placeholder="voce@email.com" />
              <Field label="Senha" placeholder="Mínimo 8 caracteres" secureTextEntry />
              <Field label="CPF" keyboardType="numeric" placeholder="000.000.000-00" />
              <Field label="Telefone" keyboardType="phone-pad" placeholder="(81) 99999-9999" />
            </View>

            <View style={styles.card}>
              <SectionTitle
                description="Você poderá adicionar outras depois"
                number="02"
                title="Dados empresariais"
              />

              <Field label="Razão social" placeholder="Razão social" />
              <Field label="Nome fantasia" placeholder="Nome da empresa" />
              <Field label="CNPJ" keyboardType="numeric" placeholder="00.000.000/0000-00" />

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Categoria do negócio</Text>
                <Pressable
                  accessibilityLabel="Selecionar categoria do negócio"
                  accessibilityRole="button"
                  onPress={() => setCategoryOpen((current) => !current)}
                  style={({ pressed }) => [styles.select, pressed && styles.pressed]}
                >
                  <Text style={styles.selectText}>{category}</Text>
                  <Text style={styles.chevron}>{categoryOpen ? '⌃' : '⌄'}</Text>
                </Pressable>

                {categoryOpen && (
                  <View style={styles.selectMenu}>
                    {categories.map((item) => (
                      <Pressable
                        key={item}
                        onPress={() => {
                          setCategory(item);
                          setCategoryOpen(false);
                        }}
                        style={({ pressed }) => [
                          styles.selectOption,
                          item === category && styles.selectOptionActive,
                          pressed && styles.pressed,
                        ]}
                      >
                        <Text style={styles.selectOptionText}>{item}</Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>

              <Field label="Endereço do estabelecimento" placeholder="Rua, número, bairro e cidade" />

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
