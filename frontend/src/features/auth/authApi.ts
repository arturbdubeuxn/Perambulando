import { apiBaseUrl, ApiRequestError, apiRequest, isNetworkError } from '../../lib/api';
import type { RegisterErrors, RegisterForm } from './registerValidation';

// typeofUser: 0 = Local, 1 = Turist. O Figma não pergunta o tipo, então cadastramos como Local.
const USER_TYPE_LOCAL = 0;

export type RegisterResponse = {
  message: string;
};

export function registerUser(form: RegisterForm) {
  return apiRequest<RegisterResponse>('/api/User/auth/Register', {
    method: 'POST',
    body: JSON.stringify({
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password,
      typeofUser: USER_TYPE_LOCAL,
    }),
  });
}

export type RegisterFailure = {
  fieldErrors: RegisterErrors;
  formError?: string;
};

// Mensagens em português para códigos conhecidos do Identity. Os demais mostram
// o texto que a própria API devolveu.
const FRIENDLY_MESSAGES: Record<string, string> = {
  DuplicateEmail: 'Este e-mail já está cadastrado.',
  InvalidEmail: 'Informe um e-mail válido.',
  // Hoje o backend usa o nome como UserName do Identity: ele precisa ser único
  // e só aceita letras e números.
  DuplicateUserName: 'Este nome já está em uso. Tente outro.',
  InvalidUserName: 'Use apenas letras e números no nome (a API ainda não aceita espaços).',
  PasswordTooShort: 'A senha é curta demais.',
  PasswordRequiresDigit: 'A senha precisa ter pelo menos um número.',
  PasswordRequiresLower: 'A senha precisa ter pelo menos uma letra minúscula.',
  PasswordRequiresUpper: 'A senha precisa ter pelo menos uma letra maiúscula.',
  PasswordRequiresNonAlphanumeric: 'A senha precisa ter pelo menos um símbolo.',
};

function fieldForCode(code: string): keyof RegisterForm | null {
  const normalized = code.toLowerCase();
  if (normalized.includes('password')) return 'password';
  if (normalized.includes('email')) return 'email';
  if (normalized.includes('username') || normalized === 'name') return 'name';
  return null;
}

export function describeRegisterError(error: unknown): RegisterFailure {
  if (error instanceof ApiRequestError) {
    const fieldErrors: RegisterErrors = {};
    const generalMessages: string[] = [];

    for (const [code, messages] of Object.entries(error.body?.errors ?? {})) {
      const text = FRIENDLY_MESSAGES[code] ?? messages.join(' ');
      const field = fieldForCode(code);
      if (field) {
        fieldErrors[field] = fieldErrors[field] ? `${fieldErrors[field]} ${text}` : text;
      } else {
        generalMessages.push(text);
      }
    }

    if (Object.keys(fieldErrors).length > 0 || generalMessages.length > 0) {
      return {
        fieldErrors,
        formError: generalMessages.length > 0 ? generalMessages.join(' ') : undefined,
      };
    }

    // ProblemDetails sem lista de erros (por exemplo, "Dados inválidos" com detail).
    return { fieldErrors, formError: error.message };
  }

  if (isNetworkError(error)) {
    return {
      fieldErrors: {},
      formError: `Não foi possível acessar a API em ${apiBaseUrl}. Verifique se ela está ativa.`,
    };
  }

  return { fieldErrors: {}, formError: 'Não foi possível concluir o cadastro. Tente novamente.' };
}
