import { router } from 'expo-router';
import type { Href } from 'expo-router';
import { useEffect, useState } from 'react';

import { getToken } from '../../lib/session';

const LOGIN_ROUTE = '/login' as Href;
// De tempos em tempos a sessão é conferida de novo: se o token venceu (ou foi
// apagado) com a tela aberta, a pessoa volta ao login sem precisar recarregar.
const RECHECK_INTERVAL_MS = 30000;

export type AuthStatus = 'checking' | 'authenticated';

// Uso em telas que exigem login: se não houver sessão válida, redireciona para
// o login. Enquanto confere, devolve 'checking'. A API continua sendo quem
// decide de verdade (401/403); isto só evita mostrar a tela a quem não entrou.
export function useRequireAuth(): AuthStatus {
  const [status, setStatus] = useState<AuthStatus>('checking');

  useEffect(() => {
    let active = true;

    const verify = async () => {
      const token = await getToken();
      if (!active) {
        return;
      }
      if (token) {
        setStatus('authenticated');
      } else {
        // replace evita que o "voltar" reabra a tela protegida.
        router.replace(LOGIN_ROUTE);
      }
    };

    verify();
    const timer = setInterval(verify, RECHECK_INTERVAL_MS);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  return status;
}
