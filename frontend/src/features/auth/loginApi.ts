import { apiBaseUrl, ApiRequestError, apiRequest, isNetworkError } from '../../lib/api';
import type { LoginForm } from './loginValidation';

// Formato confirmado no UserController: o login devolve o resultado de
// _tokenService.CreateAsync (accessToken, tokenType e expiresAt).
export type LoginResponse = {
  accessToken: string;
  tokenType: string;
  expiresAt: string;
};

export function loginUser(form: LoginForm) {
  return apiRequest<LoginResponse>('/api/User/auth/Login', {
    method: 'POST',
    body: JSON.stringify({
      email: form.email.trim(),
      password: form.password,
    }),
  });
}

// Usuário inexistente, inativo ou senha errada voltam como 401 com o mesmo
// texto no campo detail ("E-mail ou senha inválidos."), de propósito.
export function describeLoginError(error: unknown): string {
  if (error instanceof ApiRequestError) {
    return error.message || 'E-mail ou senha inválidos.';
  }

  if (isNetworkError(error)) {
    return `Não foi possível acessar a API em ${apiBaseUrl}. Verifique se ela está ativa.`;
  }

  return 'Não foi possível entrar. Tente novamente.';
}
