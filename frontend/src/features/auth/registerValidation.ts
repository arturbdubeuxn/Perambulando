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

// Mesma regra de senha usada hoje no cadastro de host: 8+ caracteres,
// com maiúscula, minúscula, número e símbolo.
export function isStrongPassword(value: string) {
  return (
    value.length >= 8 &&
    /[a-z]/.test(value) &&
    /[A-Z]/.test(value) &&
    /\d/.test(value) &&
    /[^A-Za-z0-9]/.test(value)
  );
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
