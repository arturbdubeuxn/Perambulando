import { StatusBar } from 'expo-status-bar';
import { Fredoka_700Bold, useFonts } from '@expo-google-fonts/fredoka';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Image,
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
};

const categories = ['Música', 'Gastronomia', 'Arte', 'Esporte'];

type FieldProps = {
  label: string;
  placeholder: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'url' | 'numeric';
};

function Field({ label, placeholder, multiline = false, keyboardType = 'default' }: FieldProps) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        keyboardType={keyboardType}
        multiline={multiline}
        placeholder={placeholder}
        placeholderTextColor="#9A9AA2"
        style={[styles.input, multiline && styles.textArea]}
        textAlignVertical={multiline ? 'top' : 'center'}
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

type NavItemProps = {
  icon: string;
  label: string;
};

function NavItem({ icon, label }: NavItemProps) {
  return (
    <Pressable accessibilityRole="button" style={styles.navItem}>
      <Text style={styles.navIcon}>{icon}</Text>
      <Text style={styles.navLabel}>{label}</Text>
    </Pressable>
  );
}

export default function App() {
  const { width: viewportWidth } = useWindowDimensions();
  const [fontsLoaded] = useFonts({ Fredoka_700Bold });
  const [category, setCategory] = useState(categories[0]);
  const [categoryOpen, setCategoryOpen] = useState(false);

  return (
    <View style={styles.viewport}>
      <View style={[styles.appShell, { width: Math.min(viewportWidth, 430) }]}>
        <StatusBar style="dark" />

        <View style={styles.header}>
          <View accessible accessibilityLabel="Perambulando" style={styles.brand}>
            <Text style={[styles.brandName, fontsLoaded && styles.brandNameFredoka]}>
              Perambulando
            </Text>
            <Image
              accessibilityIgnoresInvertColors
              resizeMode="contain"
              source={require('./assets/perambulando-mark.png')}
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
              <Text style={styles.pageSubtitle}>
                Capriche nos detalhes para seu evento chegar em mais gente.
              </Text>
            </View>

            <View style={styles.card}>
              <SectionTitle
                description="O básico para apresentar seu evento."
                number="01"
                title="Informações principais"
              />

              <Field label="Nome do evento" placeholder="Ex: Festival Recife Frequência" />
              <Field
                label="Descrição"
                multiline
                placeholder="Conte o que torna esse evento imperdível..."
              />

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Categoria</Text>
                <Pressable
                  accessibilityLabel="Selecionar categoria"
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

              <Field label="Link de ingressos" keyboardType="url" placeholder="https://..." />
            </View>

            <View style={styles.card}>
              <SectionTitle
                description="Uma boa foto faz toda diferença."
                number="02"
                title="Imagem de capa"
              />

              <Pressable
                accessibilityLabel="Adicionar imagem de capa"
                accessibilityRole="button"
                style={({ pressed }) => [styles.uploadArea, pressed && styles.pressed]}
              >
                <Text style={styles.uploadPlus}>＋</Text>
                <Text style={styles.uploadTitle}>Adicionar imagem</Text>
                <Text style={styles.uploadHint}>JPG ou PNG · recomendado 1600 × 900</Text>
              </Pressable>
            </View>

            <View style={styles.card}>
              <SectionTitle
                description="Ajude todo mundo a chegar na hora certa."
                number="03"
                title="Quando e onde"
              />

              <Field label="Data" placeholder="20/07/2025" />
              <Field label="Horário" placeholder="19:00" />
              <Field label="Preço" keyboardType="numeric" placeholder="R$ 0,00" />
              <Field label="Local" placeholder="Nome do espaço ou endereço" />
            </View>

            <View style={styles.secondaryActions}>
              <Pressable
                accessibilityRole="button"
                style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
              >
                <Text style={styles.secondaryButtonText}>Cancelar</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
              >
                <Text style={styles.secondaryButtonText}>Salvar rascunho</Text>
              </Pressable>
            </View>

            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => [styles.publishButton, pressed && styles.publishButtonPressed]}
            >
              <Text style={styles.publishButtonText}>✓  Publicar evento</Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>

        <View style={styles.bottomNav}>
          <NavItem icon="▦" label="Painel" />
          <NavItem icon="▣" label="Meus eventos" />
          <Pressable accessibilityRole="button" style={styles.activeNavItem}>
            <View style={styles.activeNavButton}>
              <Text style={styles.activeNavPlus}>＋</Text>
            </View>
            <Text style={styles.activeNavLabel}>Criar evento</Text>
          </Pressable>
          <NavItem icon="⊙" label="Explorar" />
          <NavItem icon="▥" label="Empresa" />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  viewport: {
    flex: 1,
    width: '100%',
    minWidth: 0,
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
    width: 42,
    height: 42,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.ink,
  },
  avatarText: {
    color: colors.card,
    fontSize: 14,
    fontWeight: '800',
  },
  keyboardArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingTop: 34,
    paddingBottom: 28,
    gap: 14,
  },
  intro: {
    paddingHorizontal: 2,
    paddingBottom: 10,
  },
  eyebrow: {
    marginBottom: 15,
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
    marginTop: 10,
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21,
  },
  card: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderColor: colors.line,
    borderWidth: 1,
    gap: 16,
    ...Platform.select({
      web: { boxShadow: '0 8px 24px rgba(20, 18, 16, 0.035)' },
      default: {
        elevation: 1,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
      },
    }),
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 4,
  },
  sectionNumber: {
    width: 34,
    height: 34,
    borderRadius: 9,
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
    fontWeight: '500',
  },
  sectionDescription: {
    marginTop: 3,
    color: colors.muted,
    fontSize: 10,
    lineHeight: 14,
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
    minHeight: 52,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderColor: colors.line,
    borderWidth: 1,
    backgroundColor: colors.input,
    color: colors.ink,
    fontSize: 14,
  },
  textArea: {
    minHeight: 112,
    paddingTop: 14,
    lineHeight: 20,
  },
  select: {
    minHeight: 52,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderColor: colors.line,
    borderWidth: 1,
    backgroundColor: colors.input,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectText: {
    color: colors.ink,
    fontSize: 14,
  },
  chevron: {
    color: colors.ink,
    fontSize: 18,
  },
  selectMenu: {
    overflow: 'hidden',
    marginTop: -2,
    borderRadius: 12,
    borderColor: colors.line,
    borderWidth: 1,
    backgroundColor: colors.card,
  },
  selectOption: {
    minHeight: 44,
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
    fontSize: 14,
  },
  uploadArea: {
    minHeight: 150,
    borderRadius: 15,
    borderColor: '#CBC5BF',
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
  },
  uploadPlus: {
    marginBottom: 7,
    color: colors.orange,
    fontSize: 28,
    fontWeight: '300',
  },
  uploadTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '800',
  },
  uploadHint: {
    marginTop: 4,
    color: colors.muted,
    fontSize: 9,
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 2,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    borderColor: colors.line,
    borderWidth: 1,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '700',
  },
  publishButton: {
    minHeight: 52,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.orange,
    ...Platform.select({
      web: { boxShadow: '0 8px 18px rgba(255, 90, 82, 0.24)' },
      default: { elevation: 3 },
    }),
  },
  publishButtonPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },
  publishButtonText: {
    color: colors.card,
    fontSize: 14,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.72,
  },
  bottomNav: {
    minHeight: 74,
    paddingHorizontal: 5,
    paddingBottom: 7,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: colors.card,
    borderTopColor: colors.line,
    borderTopWidth: 1,
  },
  navItem: {
    flex: 1,
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 3,
  },
  navIcon: {
    color: '#8C8C93',
    fontSize: 19,
    lineHeight: 20,
  },
  navLabel: {
    color: '#8C8C93',
    fontSize: 8,
  },
  activeNavItem: {
    flex: 1.18,
    minHeight: 68,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  activeNavButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.orange,
    borderColor: colors.card,
    borderWidth: 4,
    ...Platform.select({
      web: { boxShadow: '0 5px 14px rgba(255, 90, 82, 0.3)' },
      default: { elevation: 4 },
    }),
  },
  activeNavPlus: {
    color: colors.card,
    fontSize: 24,
    fontWeight: '300',
    lineHeight: 25,
  },
  activeNavLabel: {
    color: colors.orange,
    fontSize: 8,
    fontWeight: '800',
  },
});
