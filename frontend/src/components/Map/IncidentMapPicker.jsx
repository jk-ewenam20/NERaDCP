import { useState, useCallback, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';

const ACCRA = [5.6037, -0.1870];

const TYPE_COLORS = {
  medical:  '#059669',
  fire:     '#ea580c',
  crime:    '#2563eb',
  accident: '#d97706',
};

function makePinIcon(color) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36">
      <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 24 12 24S24 21 24 12C24 5.373 18.627 0 12 0z"
            fill="${color}" stroke="white" stroke-width="1.5"/>
      <circle cx="12" cy="12" r="5" fill="white"/>
    </svg>`;
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [24, 36],
    iconAnchor: [12, 36],
    popupAnchor: [0, -36],
  });
}

function ClickHandler({ onMapClick }) {
  useMapEvents({ click(e) { onMapClick(e.latlng); } });
  return null;
}

// Moves the map view when the address search selects a location
function PanController({ target }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.setView([target.lat, target.lng], 15, { animate: true });
  }, [target, map]);
  return null;
}

export default function IncidentMapPicker({ onLocationSelect, incidentType = 'medical', externalPin }) {
  const [marker, setMarker] = useState(null);

  // Sync marker when address search resolves a location
  useEffect(() => {
    if (externalPin) setMarker({ lat: externalPin.lat, lng: externalPin.lng });
  }, [externalPin]);

  const handleMapClick = useCallback((latlng) => {
    setMarker(latlng);
    onLocationSelect({ lat: latlng.lat, lng: latlng.lng });
  }, [onLocationSelect]);

  const icon = makePinIcon(TYPE_COLORS[incidentType] ?? TYPE_COLORS.medical);

  return (
    <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm">
      <MapContainer
        center={ACCRA}
        zoom={13}
        style={{ width: '100%', height: '280px' }}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler onMapClick={handleMapClick} />
        <PanController target={externalPin} />
        {marker && <Marker position={[marker.lat, marker.lng]} icon={icon} />}
      </MapContainer>
    </div>
  );
}
