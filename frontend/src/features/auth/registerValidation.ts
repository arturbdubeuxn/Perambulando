export type RegisterForm = {
  // Nome de usuário (UserName do Identity). O campo continua se chamando "name"
  // porque é assim que a API o recebe.
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export type RegisterErrors = Partial<Record<keyof RegisterForm, string>>;

// Limites do UserDTO do backend: Name e Email com no máximo 256 caracteres.
const MAX_LENGTH = 256;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Caracteres aceitos pelo Identity por padrão (o backend não os personaliza):
// letras sem acento, números e - . _ @ +. Espaço e acento não são aceitos.
const USERNAME_PATTERN = /^[A-Za-z0-9\-._@+]+$/;

export const isValidEmail = (value: string) => EMAIL_PATTERN.test(value.trim());

export const isValidUserName = (value: string) => USERNAME_PATTERN.test(value);

// Requisitos de senha (mesma regra do cadastro de host): 8+ caracteres,
// com minúscula, maiúscula, número e símbolo.
export const PASSWORD_RULES = [
  { id: 'length', label: 'Pelo menos 8 caracteres', test: (v: string) => v.length >= 8 },
  { id: 'lower', label: 'Uma letra minúscula', test: (v: string) => /[a-z]/.test(v) },
  { id: 'upper', label: 'Uma letra maiúscula', test: (v: string) => /[A-Z]/.test(v) },
  { id: 'digit', label: 'Um número', test: (v: string) => /\d/.test(v) },
  { id: 'symbol', label: 'Um símbolo (ex.: ! @ # $)', test: (v: string) => /[^A-Za-z0-9]/.test(v) },
];

export type PasswordLevel = 'empty' | 'weak' | 'medium' | 'strong';

export function getPasswordStrength(value: string) {
  const checks = PASSWORD_RULES.map((rule) => ({ ...rule, ok: rule.test(value) }));
  const score = checks.filter((check) => check.ok).length;
  let level: PasswordLevel = 'weak';
  if (!value) level = 'empty';
  else if (score === PASSWORD_RULES.length) level = 'strong';
  else if (score === PASSWORD_RULES.length - 1) level = 'medium';
  return { checks, score, level };
}

export function isStrongPassword(value: string) {
  return PASSWORD_RULES.every((rule) => rule.test(value));
}

export function validateRegister(form: RegisterForm): RegisterErrors {
  const errors: RegisterErrors = {};
  const name = form.name.trim();
  const email = form.email.trim();

  if (!name) {
    errors.name = 'Informe seu nome de usuário.';
  } else if (name.length > MAX_LENGTH) {
    errors.name = `O nome de usuário deve ter no máximo ${MAX_LENGTH} caracteres.`;
  } else if (!isValidUserName(name)) {
    errors.name =
      'Use apenas letras sem acento, números e os símbolos - . _ @ +, sem espaços.';
  }

  if (!email) {
    errors.email = 'Informe seu e-mail.';
  } else if (!isValidEmail(email)) {
    errors.email = 'Informe um e-mail válido.';
  } else if (email.length > MAX_LENGTH) {
    errors.email = `O e-mail deve ter no máximo ${MAX_LENGTH} caracteres.`;
  }

  if (!form.password) {
    errors.password = 'Crie uma senha.';
  } else if (!isStrongPassword(form.password)) {
    errors.password = 'Use 8 caracteres, com maiúscula, minúscula, número e símbolo.';
  }

  if (!form.confirmPassword) {
    errors.confirmPassword = 'Confirme sua senha.';
  } else if (form.confirmPassword !== form.password) {
    errors.confirmPassword = 'As senhas não coincidem.';
  }

  return errors;
}

export const hasErrors = (errors: RegisterErrors) => Object.keys(errors).length > 0;
