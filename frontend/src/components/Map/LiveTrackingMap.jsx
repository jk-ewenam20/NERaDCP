import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

const ACCRA = [5.6037, -0.1870];

const TYPE_COLORS = {
  medical:  '#059669',
  fire:     '#ea580c',
  crime:    '#2563eb',
  accident: '#d97706',
};

// ── Incident pin (teardrop) ───────────────────────────────────────────────────
function makeIncidentIcon(color = '#ef4444') {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 30" width="20" height="30">
      <path d="M10 0C4.477 0 0 4.477 0 10c0 7.5 10 20 10 20S20 17.5 20 10C20 4.477 15.523 0 10 0z"
            fill="${color}" stroke="white" stroke-width="1.5"/>
      <circle cx="10" cy="10" r="4" fill="white"/>
    </svg>`;
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [20, 30],
    iconAnchor: [10, 30],
    popupAnchor: [0, -30],
  });
}

// ── Emoji-based vehicle icons ─────────────────────────────────────────────────
// Modern OS / browsers (Windows 11, Chrome, Safari) render emoji as colourful
// pseudo-3D illustrations — far more recognisable than flat top-down SVGs.
//
// Emoji natural heading (the direction the vehicle faces at 0° rotation):
//   🚑  faces RIGHT  → subtract 90° so it points UP at heading=0
//   🚒  faces LEFT   → add    90° so it points UP at heading=0
//   🚓  faces RIGHT  → subtract 90°
//   🚐  faces RIGHT  → subtract 90°
//
// A small white directional triangle sits behind the emoji to show exact heading.

function makeEmojiVehicleIcon(emoji, accentColor, emojiOffset, heading = 0, speed = 0) {
  const moving = speed > 0;
  const effectiveRotation = heading + emojiOffset;

  const pulse = moving
    ? `<div style="
          position:absolute;top:50%;left:50%;
          width:52px;height:52px;
          margin:-26px 0 0 -26px;
          border-radius:50%;
          background-color:${accentColor};
          opacity:0.20;
          animation:ping 1.4s cubic-bezier(0,0,0.2,1) infinite;">
       </div>`
    : '';

  // Heading arrow — always points in the direction of travel (uses raw heading, not emojiOffset)
  const arrow = `
    <div style="
        position:absolute;top:50%;left:50%;
        width:0;height:0;
        margin:-30px 0 0 -7px;
        border-left:7px solid transparent;
        border-right:7px solid transparent;
        border-bottom:12px solid ${accentColor};
        opacity:0.85;
        transform:rotate(${heading}deg);
        transform-origin:7px 30px;
        filter:drop-shadow(0 1px 2px rgba(0,0,0,0.35));">
    </div>`;

  const html = `
    <div style="position:relative;width:64px;height:64px;">
      ${pulse}
      ${arrow}
      <div style="
          position:absolute;top:0;left:0;
          width:64px;height:64px;
          display:flex;align-items:center;justify-content:center;
          font-size:34px;
          line-height:1;
          transform:rotate(${effectiveRotation}deg);
          transform-origin:32px 32px;
          filter:drop-shadow(0 3px 8px rgba(0,0,0,0.32));">
        ${emoji}
      </div>
    </div>`;

  return L.divIcon({
    html,
    className: '',
    iconSize: [64, 64],
    iconAnchor: [32, 32],
    popupAnchor: [0, -36],
  });
}

function makeAmbulanceIcon(heading = 0, speed = 0) {
  // 🚑 faces right → offset -90° to point north at heading=0
  return makeEmojiVehicleIcon('🚑', '#059669', -90, heading, speed);
}

function makePoliceIcon(heading = 0, speed = 0) {
  // 🚓 faces right → offset -90°
  return makeEmojiVehicleIcon('🚓', '#2563eb', -90, heading, speed);
}

function makeFireTruckIcon(heading = 0, speed = 0) {
  // 🚒 faces left → offset +90°
  return makeEmojiVehicleIcon('🚒', '#ea580c', 90, heading, speed);
}

function makeDefaultVehicleIcon(color = '#64748b', heading = 0, speed = 0) {
  // 🚐 faces right → offset -90°
  return makeEmojiVehicleIcon('🚐', color, -90, heading, speed);
}

function getVehicleIcon(vehicleType, heading = 0, speed = 0, incidentType) {
  switch (vehicleType) {
    case 'ambulance':  return makeAmbulanceIcon(heading, speed);
    case 'police_car': return makePoliceIcon(heading, speed);
    case 'fire_truck': return makeFireTruckIcon(heading, speed);
    default:           return makeDefaultVehicleIcon(TYPE_COLORS[incidentType] ?? '#64748b', heading, speed);
  }
}

const VEHICLE_LABEL = {
  ambulance:  'Ambulance',
  police_car: 'Police Vehicle',
  fire_truck: 'Fire Truck',
};

export default function LiveTrackingMap({ vehicles, incidents }) {
  return (
    <MapContainer
      center={ACCRA}
      zoom={12}
      style={{ width: '100%', height: '100%' }}
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Incident location pins */}
      {incidents.map((inc) => {
        // Guard: need valid numeric coordinates
        const coords = inc.location?.coordinates;
        const hasGeo = Array.isArray(coords) && coords.length >= 2
          && typeof coords[0] === 'number' && typeof coords[1] === 'number';
        const hasLatLng = typeof inc.latitude === 'number' && typeof inc.longitude === 'number';
        if (!hasGeo && !hasLatLng) return null;

        const lat = hasLatLng ? inc.latitude  : coords[1];
        const lng = hasLatLng ? inc.longitude : coords[0];
        if (!isFinite(lat) || !isFinite(lng)) return null;

        const color = TYPE_COLORS[inc.incidentType] ?? '#64748b';
        return (
          <Marker key={inc._id} position={[lat, lng]} icon={makeIncidentIcon(color)}>
            <Popup>
              <div className="text-sm space-y-1 min-w-[160px]">
                <p className="font-semibold capitalize">{inc.incidentType} incident</p>
                <p className="text-slate-600">{inc.citizenName}</p>
                <p className="text-slate-500 text-xs">{inc.address}</p>
                <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium
                  ${inc.status === 'dispatched'  ? 'bg-blue-100 text-blue-700'
                  : inc.status === 'in_progress' ? 'bg-amber-100 text-amber-700'
                  : 'bg-slate-100 text-slate-600'}`}>
                  {inc.status?.replace(/_/g, ' ')}
                </span>
              </div>
            </Popup>
          </Marker>
        );
      })}

      {/* Live vehicle markers — Uber/Bolt-style icons with heading rotation */}
      {vehicles.map((v, i) => {
        const coords = v.location?.coordinates;
        if (!Array.isArray(coords) || coords.length < 2) return null;
        const [lng, lat] = coords;
        if (!isFinite(lat) || !isFinite(lng)) return null;

        const inc   = incidents.find((x) => String(x._id) === String(v.incidentId));
        const icon  = getVehicleIcon(v.vehicleType, v.heading ?? 0, v.speed ?? 0, inc?.incidentType);
        const label = VEHICLE_LABEL[v.vehicleType] ?? 'Vehicle';

        return (
          <Marker key={String(v.vehicleId ?? v._id ?? i)} position={[lat, lng]} icon={icon}>
            <Popup>
              <div className="text-sm space-y-1 min-w-[150px]">
                <p className="font-semibold">{label}</p>
                {v.speed != null && (
                  <p className="text-slate-500 flex items-center gap-1">
                    <span className="text-xs">▶</span> {v.speed} km/h
                  </p>
                )}
                {inc && (
                  <p className="text-slate-500 capitalize text-xs">{inc.incidentType} response</p>
                )}
                <p className="text-xs text-slate-400">
                  {new Date(v.lastUpdated ?? v.timestamp ?? Date.now()).toLocaleTimeString()}
                </p>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
