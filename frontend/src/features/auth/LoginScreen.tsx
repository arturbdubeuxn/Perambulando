import { Fredoka_700Bold } from '@expo-google-fonts/fredoka/700Bold';
import { useFonts } from 'expo-font';
import { router } from 'expo-router';
import type { Href } from 'expo-router';
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
  useWindowDimensions,
  View,
} from 'react-native';

import { FormField } from '../../components/FormField';
import { colors } from '../../theme/colors';
import { describeLoginError, loginUser } from './loginApi';
import { hasLoginErrors, validateLogin } from './loginValidation';
import type { LoginErrors, LoginForm } from './loginValidation';

const REGISTER_ROUTE = '/cadastro' as Href;

const emptyForm: LoginForm = {
  email: '',
  password: '',
};

type SubmitStatus = 'idle' | 'submitting' | 'success' | 'error';

export default function LoginScreen() {
  const { width: viewportWidth } = useWindowDimensions();
  const [fontsLoaded] = useFonts({ Fredoka_700Bold });
  const [form, setForm] = useState<LoginForm>(emptyForm);
  const [errors, setErrors] = useState<LoginErrors>({});
  const [status, setStatus] = useState<SubmitStatus>('idle');
  const [formError, setFormError] = useState('');
  const [showForgotNotice, setShowForgotNotice] = useState(false);

  const submitting = status === 'submitting';

  const updateField = (field: keyof LoginForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setFormError('');
    setStatus((current) => (current === 'submitting' ? current : 'idle'));
  };

  const handleSubmit = async () => {
    if (submitting) {
      return;
    }

    const nextErrors = validateLogin(form);
    setErrors(nextErrors);
    setFormError('');
    if (hasLoginErrors(nextErrors)) {
      setStatus('idle');
      return;
    }

    setStatus('submitting');
    try {
      await loginUser(form);
      // Por enquanto o token ainda não é guardado nem há redirecionamento:
      // isso entra na próxima subtarefa (módulo de sessão).
      setForm(emptyForm);
      setStatus('success');
    } catch (error) {
      setFormError(describeLoginError(error));
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
              <Text style={styles.eyebrow}>BEM-VINDO DE VOLTA</Text>
              <Text style={styles.pageTitle}>Bora perambular?</Text>
              <Text style={styles.pageSubtitle}>Preencha seus dados para continuar.</Text>
            </View>

            <View style={styles.card}>
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
                autoComplete="current-password"
                error={errors.password}
                label="Senha"
                maxLength={128}
                onChangeText={(value) => updateField('password', value)}
                placeholder="Sua senha"
                secureTextEntry
                value={form.password}
              />

              <Pressable
                accessibilityRole="button"
                onPress={() => setShowForgotNotice((current) => !current)}
                style={({ pressed }) => [styles.forgotButton, pressed && styles.pressed]}
              >
                <Text style={styles.forgotText}>Esqueci minha senha</Text>
              </Pressable>

              {showForgotNotice && (
                <Text style={styles.forgotNotice}>
                  A recuperação de senha ainda não está disponível no app.
                </Text>
              )}
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
              <Text style={styles.primaryButtonText}>{submitting ? 'Entrando...' : 'Entrar'}</Text>
            </Pressable>

            {status === 'success' && (
              <View accessibilityRole="alert" style={styles.notice}>
                <Text style={styles.noticeTitle}>Login realizado</Text>
              </View>
            )}

            {status === 'error' && formError !== '' && (
              <View accessibilityRole="alert" style={styles.errorNotice}>
                <Text style={styles.errorNoticeTitle}>Não foi possível entrar</Text>
                <Text style={styles.errorNoticeText}>{formError}</Text>
              </View>
            )}

            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Ainda não tem conta? </Text>
              <Pressable accessibilityRole="link" onPress={() => router.push(REGISTER_ROUTE)}>
                <Text style={styles.footerLink}>Criar conta</Text>
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
  forgotButton: {
    alignSelf: 'flex-end',
    paddingVertical: 2,
  },
  forgotText: {
    color: colors.orange,
    fontSize: 12,
    fontWeight: '800',
  },
  forgotNotice: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 16,
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
