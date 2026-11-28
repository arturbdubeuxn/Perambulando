import RoadmapButton from './RoadmapButton';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { AddressCoordinates } from './AddressMap';
import { formatDistance, loadNearbyPlaces, type NearbyPin, type NearbyPlace } from './nearbyPins';

const apiBaseUrl = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:5014').replace(/\/$/, '');

export default function NearbyPlaces({ hostId, origin, locating, onSelect }: {
  hostId: number; origin: AddressCoordinates | null; locating: boolean; onSelect: (item: NearbyPin) => void;
}) {
  const [places, setPlaces] = useState<NearbyPlace[]>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'empty' | 'error'>('loading');
  const [reload, setReload] = useState(0);

  useFocusEffect(useCallback(() => {
    if (!origin) {
      return;
    }
    let active = true;
    const controller = new AbortController();
    const load = async () => {
      setState('loading');
      try {
        const request = async <T,>(path: string): Promise<T> => {
          const response = await fetch(`${apiBaseUrl}${path}`, { cache: reload > 0 ? 'no-store' : 'default', headers: { Accept: 'application/json' }, signal: controller.signal });
          if (!response.ok) {
            throw new Error('Não foi possível consultar os locais próximos.');
          }
          return response.json() as Promise<T>;
        };
        const results = await loadNearbyPlaces(origin, request, { hostId }, controller.signal);
        if (active) {
          setPlaces(results);
          setState(results.length ? 'ready' : 'empty');
        }
      } catch {
        if (active && !controller.signal.aborted) {
          setState('error');
        }
      }
    };
    void load();
    return () => { active = false; controller.abort(); };
  }, [hostId, origin, reload]));

  const displayState = origin ? state : locating ? 'loading' : 'no-location';

  return <View style={styles.section}>
    <Text accessibilityRole="header" style={styles.title}>Locais mais próximos</Text>
    <Text style={styles.helper}>Até 5 programações ou estabelecimentos, ordenados pela distância até este local, em até 20 km.</Text>
    {displayState === 'loading' ? <View style={styles.state}><ActivityIndicator color="#FF5A0A" /><Text style={styles.helper}>Calculando locais próximos...</Text></View> : null}
    {displayState === 'empty' ? <View style={styles.state}><Text style={styles.helper}>Nenhum outro local encontrado nas proximidades.</Text></View> : null}
    {displayState === 'no-location' ? <Text style={styles.helper}>Localize o endereço do estabelecimento para consultar os arredores.</Text> : null}
    {displayState === 'error' ? <View style={styles.state}><Text style={styles.helper}>Não foi possível consultar os locais próximos agora.</Text><Pressable accessibilityRole="button" accessibilityLabel="Tentar novamente os locais próximos" onPress={() => setReload((value) => value + 1)} style={styles.retry}><Text style={styles.retryText}>Tentar novamente</Text></Pressable></View> : null}
    {displayState === 'ready' ? <NearbyPlaceGrid places={places} onSelect={onSelect} /> : null}
  </View>;
}

export function NearbyPlaceGrid({ places, onSelect }: { places: NearbyPlace[]; onSelect: (item: NearbyPin) => void }) {
  const rows = Array.from({ length: Math.ceil(places.length / 2) }, (_, index) => places.slice(index * 2, index * 2 + 2));

  return (
    <View style={styles.grid}>
      {rows.map((row) => (
        <View key={`${row[0].item.type}-${row[0].item.id}`} style={styles.row}>
          {row.map(({ item, label }) => (
            <View key={`${item.type}-${item.id}`} style={styles.card}>
              <Pressable accessibilityRole="button" accessibilityLabel={`Ver ${item.type === 'Host' ? 'estabelecimento' : 'evento'} ${item.name}`}
                onPress={() => onSelect(item)} style={({ pressed }) => [styles.cardLink, pressed && styles.pressed]}>
                {item.imageUrl ? (
                  <Image source={{ uri: item.imageUrl }} resizeMode="cover" style={styles.image} />
                ) : (
                  <View style={[styles.image, styles.fallback]}><Text style={styles.initial}>{item.name.charAt(0).toUpperCase()}</Text></View>
                )}
                <View style={styles.copy}>
                  <Text numberOfLines={2} style={styles.name}>{item.name}</Text>
                  <Text numberOfLines={1} style={styles.category}>{label}</Text>
                  <Text style={styles.distance}>⌖ {formatDistance(item.distanceMeters)}</Text>
                </View>
              </Pressable>
              <RoadmapButton kind={item.type === 'Host' ? 'host' : 'programming'} id={item.id} name={item.name} />
            </View>
          ))}
          {row.length === 1 ? <View style={styles.emptyColumn} /> : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 9 }, title: { color: '#002B5C', fontSize: 18, fontWeight: '700' }, helper: { color: '#667085', fontSize: 11, lineHeight: 17 },
  grid: { gap: 12 }, row: { flexDirection: 'row', alignItems: 'stretch', gap: 12 },
  card: { flex: 1, minWidth: 0, overflow: 'hidden', borderRadius: 15, borderWidth: 1, borderColor: '#E7E0D6', backgroundColor: '#FFFEFC' },
  emptyColumn: { flex: 1 },
  cardLink: { flex: 1 },
  image: { width: '100%', aspectRatio: 2.8, minHeight: 60, maxHeight: 120, backgroundColor: '#E9F1EF' },
  fallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#002B5C' },
  initial: { color: '#FFFEFC', fontSize: 24, fontWeight: '800' },
  copy: { padding: 10 },
  name: { color: '#002B5C', fontSize: 12, lineHeight: 16, fontWeight: '800' }, category: { color: '#9F3909', fontSize: 10, marginTop: 4, fontWeight: '700' }, distance: { marginTop: 4, color: '#667085', fontSize: 10 }, pressed: { opacity: 0.75 },
  state: { padding: 18, gap: 12, borderRadius: 15, borderWidth: 1, borderColor: '#E7E0D6', backgroundColor: '#FFFEFC' }, retry: { minHeight: 44, borderWidth: 1, borderColor: '#E7E0D6', borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, retryText: { color: '#002B5C', fontSize: 11, fontWeight: '700' },
});
