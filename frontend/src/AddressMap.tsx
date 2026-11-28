import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import NearbyMap from './NearbyMap';
import type { NearbyPin } from './nearbyPins';

export type AddressCoordinates = { latitude: number; longitude: number; displayName: string };

export default function AddressMap({ address, coordinates, message, place, loading }: {
  address: string;
  coordinates: AddressCoordinates | null;
  message: string;
  place: Pick<NearbyPin, 'id' | 'name' | 'type' | 'imageUrl'>;
  loading: boolean;
}) {
  const query = coordinates ? `${coordinates.latitude},${coordinates.longitude}` : address;
  const openMap = () => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`);
  const [userPosition, setUserPosition] = useState<Location.LocationObjectCoords | null>(null);
  const [locationRequest, setLocationRequest] = useState(false);
  const [locationMessage, setLocationMessage] = useState('');
  const locateUser = useCallback(async (requestPermission: boolean) => {
    let permission = await Location.getForegroundPermissionsAsync();
    if (requestPermission && !permission.granted) {
      permission = await Location.requestForegroundPermissionsAsync();
    }
    return permission.granted
      ? (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })).coords
      : null;
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      return;
    }
    let active = true;
    locateUser(false).then((position) => {
      if (active && position) {
        setUserPosition(position);
      }
    }).catch(() => undefined);
    return () => { active = false; };
  }, [locateUser]);

  async function showUserPosition() {
    setLocationRequest(true);
    setLocationMessage('');
    try {
      const position = await locateUser(true);
      setUserPosition(position);
      if (!position) {
        setLocationMessage('Permita o acesso à localização no navegador para aparecer no mapa.');
      }
    } catch {
      setLocationMessage('Não foi possível obter sua localização.');
    } finally {
      setLocationRequest(false);
    }
  }

  const marker: NearbyPin | null = coordinates ? {
    ...place, latitude: coordinates.latitude, longitude: coordinates.longitude,
    address, description: '', distanceMeters: 0,
  } : null;
  return (
    <>
      <View style={styles.frame}>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color="#FF5A0A" />
            <Text style={styles.helper}>{message}</Text>
          </View>
        ) : coordinates ? (
          Platform.OS === 'web'
            ? <NearbyMap origin={coordinates} userPosition={userPosition} title={`Mapa de ${place.name}`} items={marker ? [marker] : []} />
            : <Pressable accessibilityRole="link" onPress={openMap} style={styles.center}>
                <Text style={styles.pin}>⌖</Text>
                <Text style={styles.title}>Abrir localização no mapa</Text>
              </Pressable>
        ) : (
          <View style={styles.center}>
            <Text style={styles.title}>Mapa indisponível</Text>
            <Text style={styles.helper}>{message}</Text>
          </View>
        )}
      </View>
      {coordinates && Platform.OS === 'web' && !userPosition ? (
        <Pressable accessibilityRole="button" disabled={locationRequest} onPress={() => void showUserPosition()} style={styles.link}>
          <Text style={styles.linkText}>{locationRequest ? 'Obtendo localização…' : 'Mostrar minha localização'}</Text>
        </Pressable>
      ) : null}
      {locationMessage ? <Text accessibilityRole="alert" style={styles.helper}>{locationMessage}</Text> : null}
      {address ? <Text selectable style={styles.address}>{address}</Text> : null}
      {coordinates ? <Text style={styles.helper}>{coordinates.displayName}</Text> : null}
      {query ? (
        <Pressable accessibilityRole="link" onPress={openMap} style={styles.link}>
          <Text style={styles.linkText}>Abrir no Google Maps ↗</Text>
        </Pressable>
      ) : null}
      {coordinates && Platform.OS === 'web' ? (
        <Text style={styles.attribution}>Mapa OpenFreeMap · dados © colaboradores do OpenStreetMap (ODbL)</Text>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  frame: { height: 225, marginTop: 7, overflow: 'hidden', borderRadius: 17, borderWidth: 1, borderColor: '#E7E0D6', backgroundColor: '#E8EEE9' },
  center: { flex: 1, padding: 18, alignItems: 'center', justifyContent: 'center', gap: 8 },
  pin: { color: '#FF5A0A', fontSize: 28 },
  title: { color: '#002B5C', fontSize: 12, fontWeight: '800' },
  address: { marginTop: 4, color: '#002B5C', fontSize: 11, lineHeight: 16, fontWeight: '700' },
  helper: { color: '#667085', fontSize: 10, lineHeight: 15 },
  link: { minHeight: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 12, borderWidth: 1, borderColor: '#E7E0D6', backgroundColor: '#FFFEFC' },
  linkText: { color: '#FF5A0A', fontSize: 10, fontWeight: '800' },
  attribution: { color: '#667085', fontSize: 8, textAlign: 'right' },
});
