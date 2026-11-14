export type RegisterForm = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export type RegisterErrors = Partial<Record<keyof RegisterForm, string>>;

// Limites do UserDTO do backend: Name e Email com no máximo 256 caracteres.
const MAX_LENGTH = 256;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isValidEmail = (value: string) => EMAIL_PATTERN.test(value.trim());

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
    errors.name = 'Informe seu nome completo.';
  } else if (name.length > MAX_LENGTH) {
    errors.name = `O nome deve ter no máximo ${MAX_LENGTH} caracteres.`;
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
