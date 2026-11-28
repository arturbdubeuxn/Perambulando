import { useEffect, useId, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import type { NearbyPin } from './nearbyPins';
type MapCoordinates = { latitude: number; longitude: number };

export default function NearbyMap({ focusKey, origin, userPosition = origin, items, onSelect, title = 'Mapa dos locais mais próximos' }: {
  focusKey?: string; origin: MapCoordinates; userPosition?: MapCoordinates | null;
  items: NearbyPin[]; onSelect?: (item: NearbyPin | null) => void; title?: string;
}) {
  const mapId = `nearby-map-${useId()}`;
  const frameRef = useRef<HTMLIFrameElement | null>(null);
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const receiveSelection = (event: MessageEvent) => {
      const data = event.data as { source?: string; mapId?: string; key?: string; action?: string } | null;
      if (event.source !== frameRef.current?.contentWindow || data?.source !== 'perambulando-nearby-map' || data.mapId !== mapId) {
        return;
      }
      if (data.action === 'retry') {
        setReloadCount((count) => count + 1);
        return;
      }
      if (data.action === 'error') {
        onSelect?.(null);
        return;
      }
      if (!data.key) {
        return;
      }
      const selected = items.find((item) => `${item.type}-${item.id}` === data.key);
      if (selected) { onSelect?.(selected); }
    };
    globalThis.addEventListener('message', receiveSelection);
    return () => globalThis.removeEventListener('message', receiveSelection);
  }, [items, mapId, onSelect]);

  if (Platform.OS !== 'web') {
    return (
      <View style={styles.nativeMapFallback}>
        <Text style={styles.nativeMapIcon}>⌖</Text>
        <Text style={styles.nativeMapText}>O mapa interativo está disponível na versão Web.</Text>
      </View>
    );
  }

  const markerData = JSON.stringify(items.map((item) => ({
    key: `${item.type}-${item.id}`,
    type: item.type,
    name: item.name,
    imageUrl: item.imageUrl ?? '',
    latitude: item.latitude,
    longitude: item.longitude,
  }))).replace(/</g, '\\u003c');
  const mapDocument = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
<link rel="stylesheet" href="https://unpkg.com/maplibre-gl@5.24.1/dist/maplibre-gl.css">
<style>
html,body,#map{height:100%;margin:0;background:#e8eee9} .leaflet-control-attribution{font:9px/1.2 Arial,sans-serif}
.place-marker{position:relative;width:70px;height:88px;filter:drop-shadow(0 6px 5px rgba(0,43,92,.3))}
.pin-body{position:absolute;top:10px;left:10px;width:50px;height:50px;border:3px solid #ff7a1a;border-radius:50% 50% 50% 0;box-sizing:border-box;background:linear-gradient(145deg,#ff7a1a,#ff4f00);transform:rotate(-45deg)}
.pin-photo{position:absolute;top:5px;left:5px;width:34px;height:34px;overflow:hidden;border:3px solid #fff;border-radius:50%;box-sizing:border-box;background:#fff;transform:rotate(45deg)}
.pin-photo img,.pin-photo span{width:100%;height:100%;object-fit:cover}
.pin-photo span{display:flex;align-items:center;justify-content:center;color:#002b5c;font:800 14px Arial,sans-serif;background:#fff}
.pin-shadow{position:absolute;left:17px;bottom:5px;width:36px;height:10px;border:4px solid #ff5a0a;border-radius:50%;box-sizing:border-box;opacity:.82}
.pin-rays{position:absolute;top:0;right:0;width:24px;height:27px}
.pin-rays i{position:absolute;display:block;width:13px;height:4px;border-radius:4px;background:#ff5a0a;transform-origin:left center}
.pin-rays i:nth-child(1){left:2px;top:4px;transform:rotate(-66deg)} .pin-rays i:nth-child(2){left:8px;top:10px;transform:rotate(-28deg)} .pin-rays i:nth-child(3){left:10px;top:18px;transform:rotate(6deg)}
.host-marker .pin-body{border-color:#1976d2;background:linear-gradient(145deg,#268de8,#0057b8)}
.host-marker .pin-shadow{border-color:#1976d2}
.host-marker .pin-rays i{background:#1976d2}
.user-pin{width:18px;height:18px;border:4px solid #fff;border-radius:50%;background:#1976d2;box-shadow:0 2px 8px rgba(0,43,92,.38)}
.map-error{position:absolute;inset:0;z-index:1200;padding:24px;background:#f8f5ee;color:#002b5c;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;text-align:center;font:14px/1.5 Arial,sans-serif}.map-error[hidden]{display:none}.map-error p{margin:0;color:#667085}.map-error button{min-height:44px;padding:10px 18px;border:0;border-radius:12px;background:#002b5c;color:white;font-weight:bold;cursor:pointer}
</style></head><body><div id="map" aria-busy="true"></div><div id="map-error" class="map-error" role="alert" hidden><strong>Não foi possível carregar o mapa</strong><p>Confira sua conexão. A lista de locais continua disponível abaixo.</p><button type="button">Tentar novamente</button></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script src="https://unpkg.com/maplibre-gl@5.24.1/dist/maplibre-gl.js"></script>
<script src="https://unpkg.com/@maplibre/maplibre-gl-leaflet@0.1.3/leaflet-maplibre-gl.js"></script><script>
(function(){
var items=${markerData}; var mapId=${JSON.stringify(mapId)}; var focusKey=${JSON.stringify(focusKey ?? '')}; var markers={};
var errorBox=document.getElementById('map-error');
errorBox.querySelector('button').onclick=function(){parent.postMessage({source:'perambulando-nearby-map',mapId:mapId,action:'retry'},'*')};
function showMapError(){errorBox.hidden=false;parent.postMessage({source:'perambulando-nearby-map',mapId:mapId,action:'error'},'*')}
if(!window.L||!window.maplibregl||!L.maplibreGL){showMapError();return}
var map=L.map('map',{zoomControl:true,minZoom:1,maxZoom:19,maxBounds:[[-85,-180],[85,180]]}).setView([${origin.latitude},${origin.longitude}],14);
try{
  var basemap=L.maplibreGL({style:'https://tiles.openfreemap.org/styles/liberty',attribution:'<a href="https://openfreemap.org/" target="_blank" rel="noopener noreferrer">OpenFreeMap</a> &copy; <a href="https://openmaptiles.org/" target="_blank" rel="noopener noreferrer">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a>'}).addTo(map);
  var ready=false;
  var loadingTimer=setTimeout(function(){if(!ready){showMapError()}},20000);
  basemap.getMaplibreMap().once('load',function(){ready=true;clearTimeout(loadingTimer);errorBox.hidden=true;document.getElementById('map').setAttribute('aria-busy','false')});
  basemap.getMaplibreMap().on('error',function(){if(!ready){showMapError()}});
}catch(error){showMapError()}
var bounds=L.latLngBounds([[${origin.latitude},${origin.longitude}]]);
var userPosition=${JSON.stringify(userPosition ? [userPosition.latitude, userPosition.longitude] : null)};
if(userPosition){
  L.marker(userPosition,{title:'Sua localização',icon:L.divIcon({html:'<div class="user-pin"></div>',className:'',iconSize:[26,26],iconAnchor:[13,13]})}).addTo(map).bindTooltip('Sua localização');
  bounds.extend(userPosition);
}
function safe(value){return String(value||'').replace(/[&<>"']/g,function(char){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]})}
items.forEach(function(item){
  var visual=item.imageUrl?'<img src="'+safe(item.imageUrl)+'" alt="">':'<span>'+safe(item.name.charAt(0).toUpperCase())+'</span>';
  var marker='<div class="place-marker'+(item.type==='Host'?' host-marker':'')+'"><div class="pin-rays"><i></i><i></i><i></i></div><div class="pin-body"><div class="pin-photo">'+visual+'</div></div><div class="pin-shadow"></div></div>';
  var icon=L.divIcon({html:marker,className:'',iconSize:[70,88],iconAnchor:[35,82]});
  var placeMarker=L.marker([item.latitude,item.longitude],{icon:icon,title:item.name}).addTo(map).on('click',function(){parent.postMessage({source:'perambulando-nearby-map',mapId:mapId,key:item.key},'*')});
  var photo=placeMarker.getElement().querySelector('img');
  if(photo){
    function showInitial(){var initial=document.createElement('span');initial.textContent=item.name.charAt(0).toUpperCase();photo.replaceWith(initial)}
    photo.addEventListener('error',showInitial,{once:true});
    if(photo.complete&&!photo.naturalWidth){showInitial()}
  }
  markers[item.key]=placeMarker;
  bounds.extend([item.latitude,item.longitude]);
});
if(items.length){map.fitBounds(bounds,{padding:[45,45],maxZoom:16})}
if(focusKey&&markers[focusKey]){var focusedMarker=markers[focusKey];setTimeout(function(){map.flyTo(focusedMarker.getLatLng(),17,{duration:.65});focusedMarker.setZIndexOffset(1000)},180)}
})();
</script></body></html>`;

  return <iframe
    key={reloadCount}
    ref={frameRef}
    srcDoc={mapDocument}
    title={title}
    sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
    style={{ width: '100%', height: '100%', border: 0 }}
  />;
}

const styles = StyleSheet.create({
  nativeMapFallback: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#E8EEE9' },
  nativeMapIcon: { color: '#FF5A0A', fontSize: 30 },
  nativeMapText: { maxWidth: 240, color: '#667085', fontSize: 11, lineHeight: 17, textAlign: 'center' },
});
