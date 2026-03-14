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

// ── Uber/Bolt-style top-down vehicle icons ────────────────────────────────────
// All icons live in a 64×64 container so rotation never clips the silhouette.
// The SVG sits centered inside; the outer div applies the heading rotation.

function makeVehicleIcon(svgContent, accentColor, heading = 0, speed = 0) {
  const moving = speed > 0;

  // Pulsing ring rendered BEHIND the rotating vehicle so it stays circular
  const pulse = moving
    ? `<div style="
          position:absolute;top:50%;left:50%;
          width:42px;height:42px;
          margin:-21px 0 0 -21px;
          border-radius:50%;
          background-color:${accentColor};
          opacity:0.18;
          animation:ping 1.4s cubic-bezier(0,0,0.2,1) infinite;">
       </div>`
    : '';

  const html = `
    <div style="position:relative;width:64px;height:64px;">
      ${pulse}
      <div style="
          position:absolute;top:0;left:0;
          width:64px;height:64px;
          transform:rotate(${heading}deg);
          transform-origin:32px 32px;
          display:flex;align-items:center;justify-content:center;
          filter:drop-shadow(0 3px 8px rgba(0,0,0,0.28));">
        ${svgContent}
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

// Ambulance — boxy white van, green cross, top-down view, gradient body, ellipse wheels
function makeAmbulanceIcon(heading = 0, speed = 0) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 52" width="32" height="52">
      <defs>
        <linearGradient id="g-amb" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stop-color="#d1fae5"/>
          <stop offset="40%"  stop-color="#ffffff"/>
          <stop offset="100%" stop-color="#d1fae5"/>
        </linearGradient>
        <linearGradient id="g-amb-glass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stop-color="#ffffff" stop-opacity="0.7"/>
          <stop offset="100%" stop-color="#6ee7b7" stop-opacity="0.9"/>
        </linearGradient>
      </defs>
      <!-- Body -->
      <rect x="4" y="5" width="24" height="42" rx="5" fill="url(#g-amb)" stroke="#059669" stroke-width="1.6"/>
      <!-- Windshield (front / top) -->
      <rect x="7" y="7" width="18" height="10" rx="2.5" fill="url(#g-amb-glass)"/>
      <!-- Windshield specular -->
      <rect x="8" y="7.5" width="8" height="2.5" rx="1.2" fill="white" opacity="0.65"/>
      <!-- Green roof light bar -->
      <rect x="11" y="4.5" width="10" height="3.5" rx="1.5" fill="#059669"/>
      <!-- Light centre glow -->
      <rect x="14" y="5.2" width="4" height="2" rx="1" fill="#34d399" opacity="0.9"/>
      <!-- Cross vertical -->
      <rect x="13.5" y="23" width="5" height="14" rx="1.5" fill="#059669"/>
      <!-- Cross horizontal -->
      <rect x="10"   y="27" width="12" height="5.5" rx="1.5" fill="#059669"/>
      <!-- Cross highlight -->
      <rect x="14.5" y="23.5" width="2" height="5" rx="0.8" fill="#34d399" opacity="0.5"/>
      <!-- Rear bumper -->
      <rect x="8" y="43" width="16" height="3" rx="1.5" fill="#6ee7b7"/>
      <!-- Wheels — ellipses for realistic top-down look -->
      <ellipse cx="3"  cy="15.5" rx="2.5" ry="4.5" fill="#1f2937"/>
      <ellipse cx="29" cy="15.5" rx="2.5" ry="4.5" fill="#1f2937"/>
      <ellipse cx="3"  cy="36.5" rx="2.5" ry="4.5" fill="#1f2937"/>
      <ellipse cx="29" cy="36.5" rx="2.5" ry="4.5" fill="#1f2937"/>
      <!-- Wheel shine -->
      <ellipse cx="2.5"  cy="14" rx="1" ry="1.8" fill="#374151" opacity="0.6"/>
      <ellipse cx="29.5" cy="14" rx="1" ry="1.8" fill="#374151" opacity="0.6"/>
    </svg>`;
  return makeVehicleIcon(svg, '#059669', heading, speed);
}

// Police car — blue sedan, split red/blue light bar, white reflective stripe
function makePoliceIcon(heading = 0, speed = 0) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 50" width="30" height="50">
      <defs>
        <linearGradient id="g-pol" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stop-color="#1e3a8a"/>
          <stop offset="40%"  stop-color="#2563eb"/>
          <stop offset="100%" stop-color="#1e3a8a"/>
        </linearGradient>
        <linearGradient id="g-pol-glass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stop-color="#ffffff" stop-opacity="0.55"/>
          <stop offset="100%" stop-color="#93c5fd" stop-opacity="0.85"/>
        </linearGradient>
      </defs>
      <!-- Body (slimmer sedan) -->
      <rect x="4" y="5" width="22" height="40" rx="5" fill="url(#g-pol)" stroke="#1e40af" stroke-width="1.4"/>
      <!-- Reflective side stripe -->
      <polygon points="4,20 26,14 26,18 4,24" fill="white" opacity="0.22"/>
      <!-- Windshield -->
      <rect x="7" y="7" width="16" height="9" rx="2.5" fill="url(#g-pol-glass)"/>
      <!-- Windshield specular -->
      <rect x="8" y="7.5" width="6" height="2" rx="1" fill="white" opacity="0.6"/>
      <!-- Light bar housing -->
      <rect x="8" y="4.5" width="14" height="3.5" rx="1.8" fill="#111827"/>
      <!-- Red half -->
      <rect x="8.5" y="5"   width="6"   height="2.5" rx="1.2" fill="#ef4444"/>
      <!-- Blue half -->
      <rect x="15.5" y="5" width="6"   height="2.5" rx="1.2" fill="#60a5fa"/>
      <!-- Centre divider -->
      <rect x="14.5" y="5" width="1"   height="2.5" fill="#111827"/>
      <!-- Police shield badge -->
      <path d="M11 27 L15 25 L19 27 L19 32 Q15 34 11 32 Z" fill="white" opacity="0.88"/>
      <path d="M13 28.5 L15 27.5 L17 28.5 L17 31 Q15 32 13 31 Z" fill="#1d4ed8"/>
      <!-- Rear bumper -->
      <rect x="7" y="42" width="16" height="3" rx="1.5" fill="#93c5fd"/>
      <!-- Wheels -->
      <ellipse cx="3"  cy="14" rx="2.2" ry="4"   fill="#1f2937"/>
      <ellipse cx="27" cy="14" rx="2.2" ry="4"   fill="#1f2937"/>
      <ellipse cx="3"  cy="34" rx="2.2" ry="4"   fill="#1f2937"/>
      <ellipse cx="27" cy="34" rx="2.2" ry="4"   fill="#1f2937"/>
      <!-- Wheel shine -->
      <ellipse cx="2.5"  cy="12.5" rx="0.9" ry="1.6" fill="#374151" opacity="0.55"/>
      <ellipse cx="27.5" cy="12.5" rx="0.9" ry="1.6" fill="#374151" opacity="0.55"/>
    </svg>`;
  return makeVehicleIcon(svg, '#2563eb', heading, speed);
}

// Fire truck — large red cab-forward, yellow corner lights, ladder detail, 6 wheels
function makeFireTruckIcon(heading = 0, speed = 0) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 38 58" width="38" height="58">
      <defs>
        <linearGradient id="g-fire" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stop-color="#991b1b"/>
          <stop offset="40%"  stop-color="#ef4444"/>
          <stop offset="100%" stop-color="#991b1b"/>
        </linearGradient>
        <linearGradient id="g-fire-glass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stop-color="#ffffff" stop-opacity="0.5"/>
          <stop offset="100%" stop-color="#fca5a5" stop-opacity="0.85"/>
        </linearGradient>
        <linearGradient id="g-fire-tank" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stop-color="#b91c1c"/>
          <stop offset="45%"  stop-color="#dc2626"/>
          <stop offset="100%" stop-color="#b91c1c"/>
        </linearGradient>
      </defs>
      <!-- Cab (front — wider, boxy) -->
      <rect x="3" y="4" width="32" height="17" rx="5" fill="url(#g-fire)" stroke="#b91c1c" stroke-width="1.5"/>
      <!-- Windshield -->
      <rect x="7" y="6" width="24" height="9" rx="2.5" fill="url(#g-fire-glass)"/>
      <!-- Windshield specular -->
      <rect x="8.5" y="6.5" width="9" height="2" rx="1" fill="white" opacity="0.65"/>
      <!-- Corner warning lights (yellow) -->
      <ellipse cx="6"  cy="6"  rx="3.5" ry="2.5" fill="#fbbf24"/>
      <ellipse cx="32" cy="6"  rx="3.5" ry="2.5" fill="#fbbf24"/>
      <!-- Warning light glow -->
      <ellipse cx="6"  cy="6"  rx="1.8" ry="1.2" fill="#fde68a" opacity="0.8"/>
      <ellipse cx="32" cy="6"  rx="1.8" ry="1.2" fill="#fde68a" opacity="0.8"/>
      <!-- Siren/roof bar -->
      <rect x="13" y="4" width="12" height="3" rx="1.5" fill="#dc2626"/>
      <rect x="15" y="4.5" width="4"  height="2" rx="1" fill="#ef4444"/>
      <rect x="21" y="4.5" width="4"  height="2" rx="1" fill="#3b82f6"/>
      <!-- Rear body / water tank -->
      <rect x="4" y="21" width="30" height="29" rx="3" fill="url(#g-fire-tank)" stroke="#b91c1c" stroke-width="1.2"/>
      <!-- Ladder rails -->
      <rect x="9"  y="23" width="1.5" height="24" rx="0.8" fill="#fca5a5" opacity="0.7"/>
      <rect x="27.5" y="23" width="1.5" height="24" rx="0.8" fill="#fca5a5" opacity="0.7"/>
      <!-- Ladder rungs -->
      <rect x="9"  y="28" width="20" height="1.2" rx="0.6" fill="#fca5a5" opacity="0.6"/>
      <rect x="9"  y="33" width="20" height="1.2" rx="0.6" fill="#fca5a5" opacity="0.6"/>
      <rect x="9"  y="38" width="20" height="1.2" rx="0.6" fill="#fca5a5" opacity="0.6"/>
      <rect x="9"  y="43" width="20" height="1.2" rx="0.6" fill="#fca5a5" opacity="0.6"/>
      <!-- Rear bumper -->
      <rect x="8" y="47" width="22" height="3" rx="1.5" fill="#fca5a5"/>
      <!-- 6 wheels (front, mid, rear) -->
      <ellipse cx="2"  cy="12.5" rx="2.5" ry="5" fill="#1f2937"/>
      <ellipse cx="36" cy="12.5" rx="2.5" ry="5" fill="#1f2937"/>
      <ellipse cx="2"  cy="28"   rx="2.5" ry="5" fill="#1f2937"/>
      <ellipse cx="36" cy="28"   rx="2.5" ry="5" fill="#1f2937"/>
      <ellipse cx="2"  cy="42"   rx="2.5" ry="5" fill="#1f2937"/>
      <ellipse cx="36" cy="42"   rx="2.5" ry="5" fill="#1f2937"/>
      <!-- Wheel shine -->
      <ellipse cx="1.5" cy="11" rx="1" ry="2" fill="#374151" opacity="0.55"/>
      <ellipse cx="36.5" cy="11" rx="1" ry="2" fill="#374151" opacity="0.55"/>
    </svg>`;
  return makeVehicleIcon(svg, '#ea580c', heading, speed);
}

function makeDefaultVehicleIcon(color = '#64748b', heading = 0, speed = 0) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 46" width="30" height="46">
      <defs>
        <linearGradient id="g-def" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stop-color="${color}" stop-opacity="0.75"/>
          <stop offset="45%"  stop-color="${color}"/>
          <stop offset="100%" stop-color="${color}" stop-opacity="0.75"/>
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="22" height="38" rx="5" fill="url(#g-def)" stroke="white" stroke-width="1.4" opacity="0.95"/>
      <rect x="7" y="6" width="16" height="9"  rx="2" fill="white" opacity="0.28"/>
      <rect x="8" y="6.5" width="6" height="2.5" rx="1" fill="white" opacity="0.45"/>
      <ellipse cx="2.5"  cy="13" rx="2.2" ry="4"  fill="#1f2937"/>
      <ellipse cx="27.5" cy="13" rx="2.2" ry="4"  fill="#1f2937"/>
      <ellipse cx="2.5"  cy="33" rx="2.2" ry="4"  fill="#1f2937"/>
      <ellipse cx="27.5" cy="33" rx="2.2" ry="4"  fill="#1f2937"/>
    </svg>`;
  return makeVehicleIcon(svg, color, heading, speed);
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
