import { useEffect, useState } from 'react';

import { authedRequest, getToken } from './lib/session';

type UserProfile = {
  name: string;
};

let cachedToken = '';
let cachedInitial = '';
let pendingToken = '';
let pendingInitial: Promise<string> | null = null;

function initialFromName(name: string, fallback: string) {
  return name.trim().charAt(0).toLocaleUpperCase('pt-BR') || fallback;
}

async function loadInitial(fallback: string) {
  const token = await getToken();
  if (!token) {
    return fallback;
  }
  if (cachedToken === token && cachedInitial) {
    return cachedInitial;
  }
  if (pendingToken === token && pendingInitial) {
    return pendingInitial;
  }

  pendingToken = token;
  pendingInitial = authedRequest<UserProfile>('/api/User/Profile')
    .then((profile) => {
      const initial = initialFromName(profile.name, fallback);
      cachedToken = token;
      cachedInitial = initial;
      return initial;
    })
    .catch(() => fallback)
    .finally(() => {
      if (pendingToken === token) {
        pendingToken = '';
        pendingInitial = null;
      }
    });

  return pendingInitial;
}

export function useUserInitial(fallback = 'U') {
  const [initial, setInitial] = useState(fallback);

  useEffect(() => {
    let active = true;
    void loadInitial(fallback).then((value) => {
      if (active) {
        setInitial(value);
      }
    });
    return () => {
      active = false;
    };
  }, [fallback]);

  return initial;
}
