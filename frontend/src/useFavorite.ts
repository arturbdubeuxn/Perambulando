import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { getFavoriteKeys, setLocalFavorite, storeFavoriteKeys, subscribeToFavorites } from './favorites';

const apiBaseUrl = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:5014').replace(/\/$/, '');

function getToken() {
  try {
    return (globalThis as { sessionStorage?: { getItem: (key: string) => string | null } }).sessionStorage?.getItem('perambulando.accessToken') ?? '';
  } catch {
    return '';
  }
}

export function useFavorite(key: string) {
  const [favorite, setFavorite] = useState(() => getFavoriteKeys().includes(key));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const pending = useRef(false);
  const revision = useRef(0);

  useFocusEffect(useCallback(() => {
    let active = true;
    const controller = new AbortController();
    const refresh = () => { if (active) { setFavorite(getFavoriteKeys().includes(key)); } };
    const unsubscribe = subscribeToFavorites(refresh);
    const load = async () => {
      refresh();
      setMessage('');
      const token = getToken();
      const startedAt = revision.current;
      if (!token || !key.startsWith('programming:') || pending.current) {
        return;
      }
      try {
        const response = await fetch(`${apiBaseUrl}/api/Favorite/GetAllByUserId`, { headers: { Accept: 'application/json', Authorization: `Bearer ${token}` }, signal: controller.signal });
        if (!response.ok) {
          return;
        }
        const entries = await response.json() as { programmingId: number }[];
        if (active && Array.isArray(entries) && startedAt === revision.current && !pending.current) {
          storeFavoriteKeys([...getFavoriteKeys(), ...entries.map((entry) => `programming:${entry.programmingId}`)]);
        }
      } catch {
        // Local favorites remain usable without an authenticated connection.
      }
    };
    void load();
    return () => { active = false; controller.abort(); unsubscribe(); };
  }, [key]));

  const toggle = async () => {
    if (pending.current || !/^(host|programming):[1-9]\d*$/.test(key)) {
      return;
    }
    pending.current = true;
    revision.current += 1;
    setBusy(true);
    const wasFavorite = getFavoriteKeys().includes(key);
    const { persisted } = setLocalFavorite(key, !wasFavorite);
    setMessage(persisted ? '' : 'Favorito atualizado nesta sessão. O navegador não permitiu salvar para depois.');
    try {
      const token = getToken();
      if (token && key.startsWith('programming:')) {
        const id = Number(key.split(':')[1]);
        const response = await fetch(`${apiBaseUrl}/api/Favorite/${id}/${wasFavorite ? 'Delete' : 'Create'}`, { method: wasFavorite ? 'PATCH' : 'POST', headers: { Accept: 'application/json', Authorization: `Bearer ${token}` } });
        if (!response.ok) {
          setMessage('Favorito atualizado neste navegador. Não foi possível sincronizar com a conta agora.');
        }
      }
    } catch {
      setMessage('Favorito atualizado neste navegador. Não foi possível sincronizar com a conta agora.');
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };

  return { favorite, busy, message, toggle };
}
