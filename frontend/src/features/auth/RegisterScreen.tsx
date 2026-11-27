import { Fredoka_700Bold } from '@expo-google-fonts/fredoka/700Bold';
import { useFonts } from 'expo-font';
import { router } from 'expo-router';
import type { Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { FormField } from '../../components/FormField';
import { colors } from '../../theme/colors';
import { describeRegisterError, registerUser } from './authApi';
import PasswordStrength from './PasswordStrength';
import { hasErrors, validateRegister } from './registerValidation';
import type { RegisterErrors, RegisterForm } from './registerValidation';

const LOGIN_ROUTE = '/login' as Href;
const HOST_REGISTER_ROUTE = '/cadastro_host' as Href;
// Tempo para a pessoa ler o aviso de sucesso antes de ir para o login.
const REDIRECT_DELAY_MS = 1500;

const emptyForm: RegisterForm = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
};

type SubmitStatus = 'idle' | 'submitting' | 'success' | 'error';

export default function RegisterScreen() {
  const { width: viewportWidth } = useWindowDimensions();
  const [fontsLoaded] = useFonts({ Fredoka_700Bold });
  const [form, setForm] = useState<RegisterForm>(emptyForm);
  const [errors, setErrors] = useState<RegisterErrors>({});
  const [status, setStatus] = useState<SubmitStatus>('idle');
  const [formError, setFormError] = useState('');

  const submitting = status === 'submitting';

  // Depois do cadastro, leva ao login. replace evita que o "voltar" reabra o formulário.
  useEffect(() => {
    if (status !== 'success') {
      return undefined;
    }
    const timer = setTimeout(() => router.replace(LOGIN_ROUTE), REDIRECT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [status]);

  const updateField = (field: keyof RegisterForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setFormError('');
    setStatus((current) => (current === 'submitting' ? current : 'idle'));
  };

  const handleSubmit = async () => {
    if (submitting) {
      return;
    }

    const nextErrors = validateRegister(form);
    setErrors(nextErrors);
    setFormError('');
    if (hasErrors(nextErrors)) {
      setStatus('idle');
      return;
    }

    setStatus('submitting');
    try {
      await registerUser(form);
      // Não guardamos a senha na tela depois do cadastro.
      setForm(emptyForm);
      setStatus('success');
    } catch (error) {
      const failure = describeRegisterError(error);
      setErrors(failure.fieldErrors);
      setFormError(failure.formError ?? 'Revise os campos destacados.');
      setStatus('error');
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
              source={require('../../../assets/perambulando-mark.png')}
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
              <Text style={styles.eyebrow}>CRIAR CONTA</Text>
              <Text style={styles.pageTitle}>Chega mais!</Text>
              <Text style={styles.pageSubtitle}>Preencha seus dados para continuar.</Text>
            </View>

            <View style={styles.card}>
              <FormField
                autoCapitalize="none"
                autoComplete="username"
                error={errors.name}
                label="Nome de usuário"
                maxLength={256}
                onChangeText={(value) => updateField('name', value)}
                placeholder="ex.: maria_silva"
                value={form.name}
              />
              <FormField
                autoCapitalize="none"
                autoComplete="email"
                error={errors.email}
                keyboardType="email-address"
                label="E-mail"
                maxLength={256}
                onChangeText={(value) => updateField('email', value)}
                placeholder="voce@email.com"
                value={form.email}
              />
              <FormField
                autoCapitalize="none"
                autoComplete="new-password"
                error={errors.password}
                label="Senha"
                maxLength={128}
                onChangeText={(value) => updateField('password', value)}
                placeholder="Mínimo 8 caracteres"
                secureTextEntry
                value={form.password}
              />
              <PasswordStrength password={form.password} />
              <FormField
                autoCapitalize="none"
                autoComplete="new-password"
                error={errors.confirmPassword}
                label="Confirmar senha"
                maxLength={128}
                onChangeText={(value) => updateField('confirmPassword', value)}
                placeholder="Repita a senha"
                secureTextEntry
                value={form.confirmPassword}
              />

              <View style={styles.hostCard}>
                <Text style={styles.hostTitle}>Quer cadastrar sua empresa ou evento?</Text>
                <Text style={styles.hostText}>Crie uma conta empresarial para publicar na cidade.</Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.push(HOST_REGISTER_ROUTE)}
                  style={({ pressed }) => [styles.hostButton, pressed && styles.pressed]}
                >
                  <Text style={styles.hostButtonText}>Torne-se Host / Cadastrar CNPJ</Text>
                </Pressable>
              </View>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: submitting }}
              disabled={submitting}
              onPress={handleSubmit}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.pressed,
                submitting && styles.buttonDisabled,
              ]}
            >
              <Text style={styles.primaryButtonText}>
                {submitting ? 'Criando conta...' : 'Criar conta'}
              </Text>
            </Pressable>

            {status === 'success' && (
              <View accessibilityRole="alert" style={styles.notice}>
                <Text style={styles.noticeTitle}>Conta criada</Text>
                <Text style={styles.noticeText}>
                  Seu cadastro foi concluído. Levando você para o login...
                </Text>
              </View>
            )}

            {status === 'error' && formError !== '' && (
              <View accessibilityRole="alert" style={styles.errorNotice}>
                <Text style={styles.errorNoticeTitle}>Cadastro não concluído</Text>
                <Text style={styles.errorNoticeText}>{formError}</Text>
              </View>
            )}

            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Já tem conta? </Text>
              <Pressable accessibilityRole="link" onPress={() => router.push(LOGIN_ROUTE)}>
                <Text style={styles.footerLink}>Entrar</Text>
              </Pressable>
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
  hostCard: {
    padding: 14,
    gap: 6,
    backgroundColor: colors.hostBackground,
    borderColor: colors.hostBorder,
    borderRadius: 14,
    borderWidth: 1,
  },
  hostTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '800',
  },
  hostText: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 16,
  },
  hostButton: {
    minHeight: 44,
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.host,
    borderRadius: 11,
  },
  hostButtonText: {
    paddingHorizontal: 8,
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
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
  buttonDisabled: {
    opacity: 0.62,
  },
  errorNotice: {
    padding: 15,
    backgroundColor: colors.errorBackground,
    borderColor: '#FECACA',
    borderRadius: 14,
    borderWidth: 1,
  },
  errorNoticeTitle: {
    color: colors.error,
    fontSize: 14,
    fontWeight: '800',
  },
  errorNoticeText: {
    marginTop: 4,
    color: '#7A271A',
    fontSize: 11,
    lineHeight: 16,
  },
  notice: {
    padding: 15,
    backgroundColor: colors.successBackground,
    borderRadius: 14,
  },
  noticeTitle: {
    color: colors.success,
    fontSize: 14,
    fontWeight: '800',
  },
  noticeText: {
    marginTop: 4,
    color: '#4F755E',
    fontSize: 11,
    lineHeight: 16,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 4,
  },
  footerText: {
    color: colors.muted,
    fontSize: 12,
  },
  footerLink: {
    color: colors.orange,
    fontSize: 12,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.72,
  },
});
