import { isValidEmail } from './registerValidation';

export type LoginForm = {
  email: string;
  password: string;
};

export type LoginErrors = Partial<Record<keyof LoginForm, string>>;

// No login só exigimos que os campos estejam preenchidos e que o e-mail tenha
// formato válido. A força da senha é regra do cadastro, não do login.
export function validateLogin(form: LoginForm): LoginErrors {
  const errors: LoginErrors = {};
  const email = form.email.trim();

  if (!email) {
    errors.email = 'Informe seu e-mail.';
  } else if (!isValidEmail(email)) {
    errors.email = 'Informe um e-mail válido.';
  }

  if (!form.password) {
    errors.password = 'Informe sua senha.';
  }

  return errors;
}

export const hasLoginErrors = (errors: LoginErrors) => Object.keys(errors).length > 0;
