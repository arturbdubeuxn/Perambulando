import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, ActivityIndicator, Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { getRoadmapDraft, subscribeToRoadmap, toggleRoadmapStop, type RoadmapKind } from './roadmap';

export default function RoadmapButton({ kind, id, name }: { kind: RoadmapKind; id: number; name: string }) {
  const [included, setIncluded] = useState(() => getRoadmapDraft().stops.some((stop) => stop.key === `${kind}:${id}`));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [scale] = useState(() => new Animated.Value(1));
  const locked = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    const update = () => setIncluded(getRoadmapDraft().stops.some((stop) => stop.key === `${kind}:${id}`));
    update();
    const unsubscribe = subscribeToRoadmap(update);
    return () => { mounted.current = false; unsubscribe(); scale.stopAnimation(); };
  }, [kind, id, scale]);

  const toggle = async () => {
    if (locked.current) { return; }
    locked.current = true; setBusy(true); setMessage('');
    try {
      await toggleRoadmapStop(kind, id);
      const reducedMotion = await AccessibilityInfo.isReduceMotionEnabled().catch(() => true);
      if (mounted.current && !reducedMotion) {
        Animated.sequence([Animated.timing(scale, { toValue: 1.06, duration: 130, useNativeDriver: Platform.OS !== 'web' }), Animated.timing(scale, { toValue: 1, duration: 170, useNativeDriver: Platform.OS !== 'web' })]).start();
      }
    } catch (error) {
      if (mounted.current) { setMessage(error instanceof Error ? error.message : 'Não foi possível atualizar o roteiro.'); }
    } finally {
      locked.current = false;
      if (mounted.current) { setBusy(false); }
    }
  };

  return <View style={styles.container}><Animated.View style={{ transform: [{ scale }] }}>
    <Pressable accessibilityRole="button" accessibilityLabel={`${included ? 'Retirar' : 'Adicionar'} ${name} ${included ? 'do' : 'ao'} roteiro`} accessibilityState={{ selected: included, disabled: busy }} disabled={busy} onPress={(event) => { event.stopPropagation(); void toggle(); }} style={({ pressed }) => [styles.button, included && styles.included, pressed && styles.pressed]}>
      {busy ? <ActivityIndicator size="small" color={included ? '#FFFFFF' : '#002B5C'} /> : <Text style={[styles.glyph, included && styles.white]}>{included ? '✓' : '+'}</Text>}
      <Text style={[styles.label, included && styles.white]}>{included ? 'Incluído no roteiro' : 'Adicionar ao roteiro'}</Text>
    </Pressable>
  </Animated.View>{message ? <Text accessibilityRole="alert" style={styles.error}>{message}</Text> : null}</View>;
}

const styles = StyleSheet.create({
  container: { margin: 9, alignSelf: 'stretch' }, button: { minHeight: 44, paddingHorizontal: 10, paddingVertical: 8, borderWidth: 1, borderColor: '#E7E0D6', borderRadius: 13, backgroundColor: '#FFFEFC', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  included: { backgroundColor: '#257A48', borderColor: '#257A48' }, glyph: { color: '#002B5C', fontSize: 20, lineHeight: 23 }, label: { color: '#002B5C', fontSize: 10, fontWeight: '700', flexShrink: 1 }, white: { color: '#FFFFFF' }, error: { color: '#B42318', fontSize: 10, lineHeight: 15, marginTop: 7 }, pressed: { opacity: 0.8 },
});
