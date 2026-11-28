import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { ApiRequestError, apiRequest } from './lib/api';
import { authedRequest } from './lib/session';

type HostPhoto = { id: number; hostId: number; photoUrl: string };

function isPhotoUrl(value: string) {
  if (value.length > 2048 || !/^https?:\/\/\S+$/.test(value)) {
    return false;
  }
  try {
    return Boolean(new URL(value).hostname);
  } catch {
    return false;
  }
}

function GalleryImage({ url, label, enlarged = false }: { url: string; label: string; enlarged?: boolean }) {
  const [failed, setFailed] = useState(false);
  const imageStyle = enlarged ? styles.enlarged : styles.thumbnail;

  return failed ? (
    <View style={[imageStyle, styles.imageFallback]}><Text style={styles.helper}>Imagem indisponível</Text></View>
  ) : (
    <Image accessibilityLabel={label} onError={() => setFailed(true)} resizeMode={enlarged ? 'contain' : 'cover'}
      source={{ uri: url }} style={imageStyle} />
  );
}

export default function HostPhotoGallery({ hostId, hostName, management }: {
  hostId: number; hostName: string; management: boolean;
}) {
  const [photos, setPhotos] = useState<HostPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [canManage, setCanManage] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<HostPhoto | null>(null);
  const [pendingPhoto, setPendingPhoto] = useState<HostPhoto | null>(null);
  const [adding, setAdding] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [preview, setPreview] = useState<{ url: string; loaded: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const writeInProgress = useRef(false);
  const [message, setMessage] = useState('');
  const [mutationError, setMutationError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    apiRequest<HostPhoto[]>(`/api/Host/${hostId}/GetAllHostsPhotos`, { signal })
      .then((result) => {
        if (!signal.aborted) {
          setPhotos(result);
        }
      })
      .catch(() => {
        if (!signal.aborted) {
          setLoadError(true);
        }
      })
      .finally(() => {
        if (!signal.aborted) {
          setLoading(false);
        }
      });
    return () => controller.abort();
  }, [hostId, loadAttempt]);

  useEffect(() => {
    if (!management) {
      return;
    }
    const controller = new AbortController();
    const { signal } = controller;
    authedRequest<{ id: number; isActive: boolean }[]>('/api/Host/GetAllHostsbyUserId', { signal })
      .then((hosts) => {
        if (!signal.aborted) {
          setCanManage(hosts.some((host) => host.id === hostId && host.isActive));
        }
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, [hostId, management]);

  const editable = management && canManage;
  const url = urlInput.trim();
  const validUrl = isPhotoUrl(url);
  const currentPreview = preview?.url === url ? preview : null;

  function closeForm() {
    setAdding(false);
    setUrlInput('');
    setPreview(null);
    setMutationError('');
  }

  async function changePhoto(action: 'add' | 'remove') {
    if (!editable || writeInProgress.current || (action === 'add' && !currentPreview?.loaded) || (action === 'remove' && !pendingPhoto)) {
      return;
    }
    writeInProgress.current = true;
    setBusy(true);
    setMutationError('');
    setMessage('');
    try {
      if (action === 'add') {
        const photo = await authedRequest<HostPhoto>('/api/Host/CreateHostPhoto', {
          method: 'POST',
          body: JSON.stringify({ hostId, photoUrl: url }),
        });
        setPhotos((current) => [...current, photo]);
        closeForm();
        setMessage('Foto adicionada à galeria.');
      } else if (pendingPhoto) {
        await authedRequest<void>(`/api/Host/DeleteHostPhoto/${pendingPhoto.id}`, { method: 'DELETE' });
        setPhotos((current) => current.filter((photo) => photo.id !== pendingPhoto.id));
        setPendingPhoto(null);
        setMessage('Foto removida da galeria.');
      }
    } catch (error) {
      setMutationError(error instanceof ApiRequestError && error.status === 401
        ? 'Sua sessão expirou. Entre novamente para gerenciar as fotos.'
        : error instanceof ApiRequestError && error.status === 403
          ? 'Você não tem permissão para gerenciar as fotos deste estabelecimento.'
          : action === 'add' ? 'Não foi possível adicionar a foto. Tente novamente.'
            : 'Não foi possível remover a foto. Tente novamente.');
    } finally {
      writeInProgress.current = false;
      setBusy(false);
    }
  }

  if (!management && photos.length === 0) {
    return null;
  }

  return (
    <View style={styles.card}>
      <View style={styles.heading}>
        <Text accessibilityRole="header" style={styles.title}>Fotos do estabelecimento</Text>
        {editable && !adding && !loading && !loadError ? (
          <Pressable accessibilityRole="button" style={styles.button} onPress={() => { setMessage(''); setAdding(true); }}>
            <Text style={styles.buttonText}>Adicionar foto</Text>
          </Pressable>
        ) : null}
      </View>
      {loading ? <ActivityIndicator accessibilityLabel="Carregando fotos" color="#FF5A0A" /> : null}
      {loadError ? (
        <View style={styles.form}>
          <Text accessibilityRole="alert" style={styles.error}>Não foi possível carregar as fotos.</Text>
          <Pressable accessibilityRole="button" style={[styles.button, styles.inline]} onPress={() => {
            setLoadError(false);
            setLoading(true);
            setLoadAttempt((attempt) => attempt + 1);
          }}><Text style={styles.buttonText}>Tentar novamente</Text></Pressable>
        </View>
      ) : null}
      {!loading && !loadError && photos.length === 0 && !adding ? <Text style={styles.helper}>Nenhuma foto na galeria.</Text> : null}
      {message ? <Text accessibilityRole="status" style={styles.helper}>{message}</Text> : null}

      {photos.length > 0 ? (
        <ScrollView horizontal contentContainerStyle={styles.rail} showsHorizontalScrollIndicator={false}>
          {photos.map((photo, index) => (
            <View key={photo.id} style={styles.photoTile}>
              <Pressable accessibilityRole="button" accessibilityLabel={`Ampliar foto ${index + 1} de ${hostName}`} onPress={() => setPreviewPhoto(photo)}>
                <GalleryImage url={photo.photoUrl} label={`Foto ${index + 1} de ${hostName}`} />
              </Pressable>
              {editable ? (
                <Pressable accessibilityRole="button" accessibilityLabel={`Remover foto ${index + 1}`} disabled={busy}
                  onPress={() => { setMutationError(''); setPendingPhoto(photo); }} style={styles.remove}>
                  <Text style={styles.removeText}>Remover foto</Text>
                </Pressable>
              ) : null}
            </View>
          ))}
        </ScrollView>
      ) : null}

      {editable && adding ? (
        <View style={styles.form}>
          <Text style={styles.buttonText}>Link direto da imagem</Text>
          <TextInput accessibilityLabel="Link direto da imagem" autoCapitalize="none" autoCorrect={false} keyboardType="url"
            editable={!busy} maxLength={2048} onChangeText={(value) => { setUrlInput(value); setPreview(null); setMutationError(''); }}
            placeholder="https://…" style={styles.input} value={urlInput} />
          {url && !validUrl ? <Text style={styles.helper}>Use um link válido iniciado por http:// ou https://.</Text> : null}
          {validUrl ? (
            <Image key={url} accessibilityLabel="Prévia da foto" resizeMode="contain" source={{ uri: url }} style={styles.formPreview}
              onLoad={() => setPreview({ url, loaded: true })} onError={() => setPreview({ url, loaded: false })} />
          ) : null}
          {currentPreview && !currentPreview.loaded ? (
            <Text accessibilityRole="alert" style={styles.error}>A imagem não carregou. Confira se o link é direto e está acessível.</Text>
          ) : null}
          {mutationError && !pendingPhoto ? <Text accessibilityRole="alert" style={styles.error}>{mutationError}</Text> : null}
          <View style={styles.actions}>
            <Pressable accessibilityRole="button" disabled={busy} onPress={closeForm} style={styles.button}><Text style={styles.buttonText}>Cancelar</Text></Pressable>
            <Pressable accessibilityRole="button" disabled={busy || !currentPreview?.loaded} onPress={() => void changePhoto('add')}
              style={[styles.button, styles.primary, (busy || !currentPreview?.loaded) && styles.disabled]}>
              <Text style={styles.primaryText}>{busy ? 'Salvando…' : 'Salvar foto'}</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      <Modal animationType="fade" transparent visible={previewPhoto !== null} onRequestClose={() => setPreviewPhoto(null)}>
        <View style={styles.backdrop}>
          <View style={styles.dialog} accessibilityViewIsModal>
            {previewPhoto ? <GalleryImage key={previewPhoto.id} url={previewPhoto.photoUrl} label={`Foto ampliada de ${hostName}`} enlarged /> : null}
            <Pressable accessibilityRole="button" onPress={() => setPreviewPhoto(null)} style={[styles.button, styles.inline]}>
              <Text style={styles.buttonText}>Fechar foto</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal animationType="fade" transparent visible={pendingPhoto !== null} onRequestClose={() => { if (!busy) { setPendingPhoto(null); setMutationError(''); } }}>
        <View style={styles.backdrop}>
          <View style={styles.dialog} accessibilityViewIsModal>
            <Text accessibilityRole="header" style={styles.title}>Remover esta foto?</Text>
            <Text style={styles.helper}>Ela deixará de aparecer na galeria do estabelecimento.</Text>
            {mutationError ? <Text accessibilityRole="alert" style={styles.error}>{mutationError}</Text> : null}
            <View style={styles.actions}>
              <Pressable accessibilityRole="button" disabled={busy} onPress={() => { setPendingPhoto(null); setMutationError(''); }} style={styles.button}>
                <Text style={styles.buttonText}>Cancelar</Text>
              </Pressable>
              <Pressable accessibilityRole="button" disabled={busy} onPress={() => void changePhoto('remove')} style={[styles.button, styles.danger, busy && styles.disabled]}>
                <Text style={styles.primaryText}>{busy ? 'Removendo…' : 'Confirmar remoção'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 18, borderRadius: 20, borderWidth: 1, borderColor: '#E7E0D6', backgroundColor: '#FFFEFC', gap: 12 },
  heading: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  title: { color: '#002B5C', fontSize: 18, fontWeight: '700' },
  helper: { color: '#667085', fontSize: 12, lineHeight: 18 },
  rail: { gap: 10 },
  photoTile: { gap: 4 },
  thumbnail: { width: 144, height: 104, borderRadius: 12, backgroundColor: '#E9F1EF' },
  enlarged: { width: '100%', height: 300, borderRadius: 12, backgroundColor: '#E9F1EF' },
  imageFallback: { alignItems: 'center', justifyContent: 'center' },
  button: { minHeight: 44, paddingHorizontal: 12, justifyContent: 'center', borderColor: '#E7E0D6', borderWidth: 1, borderRadius: 11 },
  buttonText: { color: '#002B5C', fontSize: 12, fontWeight: '700' },
  inline: { alignSelf: 'flex-start' },
  remove: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  removeText: { color: '#B42318', fontSize: 11, fontWeight: '700' },
  form: { gap: 8 },
  input: { minHeight: 44, paddingHorizontal: 12, borderWidth: 1, borderColor: '#E7E0D6', borderRadius: 11, color: '#002B5C', backgroundColor: '#F8F5EE' },
  formPreview: { width: '100%', height: 150, borderRadius: 12, backgroundColor: '#E9F1EF' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 8 },
  primary: { backgroundColor: '#002B5C', borderColor: '#002B5C' },
  danger: { backgroundColor: '#B42318', borderColor: '#B42318' },
  primaryText: { color: '#FFFEFC', fontSize: 12, fontWeight: '700' },
  disabled: { opacity: 0.55 },
  error: { color: '#B42318', fontSize: 12, lineHeight: 18 },
  backdrop: { flex: 1, padding: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0, 43, 92, 0.55)' },
  dialog: { width: '100%', maxWidth: 560, padding: 16, gap: 12, borderRadius: 18, backgroundColor: '#FFFEFC' },
});
