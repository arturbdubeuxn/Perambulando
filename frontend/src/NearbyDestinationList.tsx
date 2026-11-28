import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { NearbyPlaceGrid } from './NearbyPlaces';
import { apiRequest } from './lib/api';
import { authedRequest, getToken } from './lib/session';
import type { NearbyPin } from './nearbyPins';

type Page = { items: NearbyPin[]; skip: number; hasMore: boolean };

export default function NearbyDestinationList({ id, kind, ownProgrammings, onSelect }: {
  ownProgrammings?: readonly { id: number }[];
  id: number; kind: 'host' | 'programming'; onSelect: (item: NearbyPin) => void;
}) {
  const [authorized, setAuthorized] = useState(false);
  const [open, setOpen] = useState(false);
  const [pageRequest, setPageRequest] = useState({ skip: 0 });
  const [page, setPage] = useState<Page | null>(null);
  const [items, setItems] = useState<NearbyPin[]>([]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const isHost = kind === 'host';

  useEffect(() => {
    if (!isHost) {
      return;
    }
    let active = true;
    getToken().then((token) => {
      if (active) {
        setAuthorized(Boolean(token));
      }
    }).catch(() => undefined);
    return () => { active = false; };
  }, [isHost]);

  useEffect(() => {
    if (!open || (isHost && !authorized)) {
      return;
    }
    const controller = new AbortController();
    const endpoint = isHost ? 'GetNearHost' : 'GetNearProgramming';
    const request = isHost ? authedRequest : apiRequest;
    request<Page>(`/api/Nearby/${endpoint}/${id}?skip=${pageRequest.skip}`, { signal: controller.signal })
      .then((result) => {
        if (!controller.signal.aborted) {
          setPage(result);
          setItems((existing) => pageRequest.skip === 0 ? result.items : [...existing, ...result.items]);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setFailed(true);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });
    return () => controller.abort();
  }, [authorized, id, isHost, open, pageRequest]);

  if (isHost && !authorized) {
    return null;
  }
  const ownIds = new Set(ownProgrammings?.map((programming) => programming.id));
  const visibleItems = items.filter((item) => item.type !== 'Programming' || !ownIds.has(item.id));

  function requestPage(skip: number) {
    setPageRequest({ skip });
    setFailed(false);
    setLoading(true);
  }

  return (
    <View style={styles.section}>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} style={styles.button} onPress={() => {
        if (!open) {
          setItems([]);
          setPage(null);
          requestPage(0);
        }
        setOpen(!open);
      }}>
        <Text style={styles.buttonText}>{open ? 'Recolher resultados' : isHost ? 'Ver locais em até 2 km' : 'Explorar somente programações próximas'}</Text>
      </Pressable>
      {open && (
        <>
          <Text style={styles.helper}>{isHost ? 'Locais a até 2 km do endereço cadastrado.' : 'Outras programações em ordem de distância, sem limite de raio.'}</Text>
          <NearbyPlaceGrid places={visibleItems.map((item) => ({ item, label: item.type === 'Host' ? 'Estabelecimento' : 'Programação' }))} onSelect={onSelect} />
          {loading && <ActivityIndicator color="#FF5A0A" />}
          {!loading && !failed && !page?.hasMore && visibleItems.length === 0 && <Text style={styles.helper}>Nenhum resultado encontrado.</Text>}
          {failed && <Text accessibilityRole="alert" style={styles.helper}>Não foi possível carregar esta consulta.</Text>}
          {!loading && (failed || (page?.hasMore && page.items.length > 0)) && (
            <Pressable accessibilityRole="button" style={styles.button} onPress={() => requestPage(failed ? pageRequest.skip : items.length)}>
              <Text style={styles.buttonText}>{failed ? 'Tentar novamente' : 'Mostrar mais resultados'}</Text>
            </Pressable>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 9 },
  helper: { color: '#667085', fontSize: 11, lineHeight: 17 },
  button: { minHeight: 44, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center', borderRadius: 12, borderWidth: 1, borderColor: '#E7E0D6', backgroundColor: '#FFFEFC' },
  buttonText: { color: '#002B5C', textAlign: 'center', fontSize: 12, fontWeight: '700' },
});
