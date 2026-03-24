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

// Ambulance — boxy white van, Star of Life, red side stripe, prominent emergency lights
function makeAmbulanceIcon(heading = 0, speed = 0) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 34 56" width="34" height="56">
      <defs>
        <linearGradient id="g-amb-body" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stop-color="#d1fae5"/>
          <stop offset="35%"  stop-color="#ffffff"/>
          <stop offset="65%"  stop-color="#ffffff"/>
          <stop offset="100%" stop-color="#d1fae5"/>
        </linearGradient>
        <linearGradient id="g-amb-glass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stop-color="#ffffff" stop-opacity="0.75"/>
          <stop offset="100%" stop-color="#6ee7b7" stop-opacity="0.9"/>
        </linearGradient>
      </defs>

      <!-- Main body (boxy van) -->
      <rect x="4" y="5" width="26" height="46" rx="4.5" fill="url(#g-amb-body)" stroke="#059669" stroke-width="1.8"/>

      <!-- Red side stripe left -->
      <rect x="4"  y="20" width="3.5" height="18" fill="#ef4444" opacity="0.85"/>
      <!-- Red side stripe right -->
      <rect x="26.5" y="20" width="3.5" height="18" fill="#ef4444" opacity="0.85"/>

      <!-- Windshield -->
      <rect x="7.5" y="7.5" width="19" height="11" rx="2.5" fill="url(#g-amb-glass)"/>
      <!-- Windshield glint -->
      <rect x="9" y="8" width="7" height="2.5" rx="1.2" fill="white" opacity="0.65"/>

      <!-- Emergency light bar (top of cab) -->
      <rect x="9" y="5" width="16" height="3.5" rx="1.8" fill="#111827"/>
      <!-- Red left light -->
      <rect x="9.5" y="5.4" width="6" height="2.5" rx="1.2" fill="#ef4444"/>
      <!-- White middle light -->
      <rect x="16.5" y="5.4" width="2" height="2.5" rx="1" fill="#f8fafc"/>
      <!-- Blue right light -->
      <rect x="19.5" y="5.4" width="6" height="2.5" rx="1.2" fill="#60a5fa"/>

      <!-- Star of Life — 3 bars at 0°, 60°, 120° rotated around center (17, 34) -->
      <g transform="translate(17,34)">
        <rect x="-2.5" y="-9" width="5" height="18" rx="2" fill="#059669"/>
        <rect x="-2.5" y="-9" width="5" height="18" rx="2" fill="#059669" transform="rotate(60)"/>
        <rect x="-2.5" y="-9" width="5" height="18" rx="2" fill="#059669" transform="rotate(-60)"/>
        <!-- Centre highlight -->
        <circle r="3.5" fill="#34d399"/>
        <circle r="1.5" fill="white" opacity="0.7"/>
      </g>

      <!-- Rear bumper -->
      <rect x="8" y="48" width="18" height="3" rx="1.5" fill="#6ee7b7"/>

      <!-- Wheels (4) -->
      <ellipse cx="3"  cy="17"  rx="2.8" ry="4.8" fill="#1f2937"/>
      <ellipse cx="31" cy="17"  rx="2.8" ry="4.8" fill="#1f2937"/>
      <ellipse cx="3"  cy="39"  rx="2.8" ry="4.8" fill="#1f2937"/>
      <ellipse cx="31" cy="39"  rx="2.8" ry="4.8" fill="#1f2937"/>
      <!-- Wheel rims -->
      <ellipse cx="3"  cy="15.5" rx="1.2" ry="2"  fill="#4b5563" opacity="0.7"/>
      <ellipse cx="31" cy="15.5" rx="1.2" ry="2"  fill="#4b5563" opacity="0.7"/>
    </svg>`;
  return makeVehicleIcon(svg, '#059669', heading, speed);
}

// Police car — navy/white livery, true sedan silhouette, split light bar, shield
function makePoliceIcon(heading = 0, speed = 0) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 52" width="30" height="52">
      <defs>
        <linearGradient id="g-pol-body" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stop-color="#1e3a8a"/>
          <stop offset="35%"  stop-color="#2563eb"/>
          <stop offset="65%"  stop-color="#2563eb"/>
          <stop offset="100%" stop-color="#1e3a8a"/>
        </linearGradient>
        <linearGradient id="g-pol-glass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stop-color="#ffffff" stop-opacity="0.6"/>
          <stop offset="100%" stop-color="#93c5fd" stop-opacity="0.9"/>
        </linearGradient>
        <linearGradient id="g-pol-hood" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stop-color="#1e3a8a"/>
          <stop offset="100%" stop-color="#1e40af"/>
        </linearGradient>
      </defs>

      <!-- Hood (narrower, rounded nose) -->
      <path d="M7,5 Q15,3 23,5 L24,16 L6,16 Z" fill="url(#g-pol-hood)" stroke="#1e40af" stroke-width="1"/>

      <!-- Main body (mid-section — widest) -->
      <rect x="4" y="16" width="22" height="20" fill="url(#g-pol-body)" stroke="#1e40af" stroke-width="1.4"/>

      <!-- White door panel stripe -->
      <rect x="4" y="19" width="22" height="8" fill="white" opacity="0.18"/>
      <rect x="4" y="20" width="22" height="1" fill="white" opacity="0.4"/>
      <rect x="4" y="26" width="22" height="1" fill="white" opacity="0.4"/>

      <!-- Trunk (tapers toward rear) -->
      <path d="M6,36 L24,36 L23,46 Q15,48 7,46 Z" fill="url(#g-pol-body)" stroke="#1e40af" stroke-width="1.2"/>

      <!-- Windshield -->
      <rect x="7" y="8" width="16" height="8" rx="2" fill="url(#g-pol-glass)"/>
      <!-- Glint -->
      <rect x="8.5" y="8.5" width="6" height="1.8" rx="1" fill="white" opacity="0.65"/>

      <!-- Rear window -->
      <rect x="8" y="37" width="14" height="6" rx="2" fill="#93c5fd" opacity="0.4"/>

      <!-- Light bar housing -->
      <rect x="8" y="5" width="14" height="4" rx="2" fill="#111827"/>
      <!-- Red half -->
      <rect x="8.5" y="5.5" width="5.5" height="2.8" rx="1.2" fill="#ef4444"/>
      <!-- Blue half -->
      <rect x="16" y="5.5" width="5.5" height="2.8" rx="1.2" fill="#60a5fa"/>
      <!-- Centre pin -->
      <rect x="14.5" y="5.5" width="1" height="2.8" fill="#111827"/>

      <!-- Police shield on hood -->
      <g transform="translate(15,11)">
        <path d="M0,-4 L3.5,-2.5 L3.5,1.5 Q0,3.5 -3.5,1.5 L-3.5,-2.5 Z" fill="white" opacity="0.9"/>
        <path d="M0,-3 L2.5,-1.8 L2.5,1 Q0,2.5 -2.5,1 L-2.5,-1.8 Z" fill="#1d4ed8"/>
        <rect x="-0.8" y="-2" width="1.6" height="3.5" rx="0.5" fill="white" opacity="0.8"/>
        <rect x="-2" y="-0.8" width="4" height="1.5" rx="0.5" fill="white" opacity="0.8"/>
      </g>

      <!-- Rear bumper -->
      <rect x="8" y="44" width="14" height="2.5" rx="1.2" fill="#93c5fd"/>

      <!-- Wheels — sedan proportions -->
      <ellipse cx="3"  cy="14"  rx="2.2" ry="4.2" fill="#1f2937"/>
      <ellipse cx="27" cy="14"  rx="2.2" ry="4.2" fill="#1f2937"/>
      <ellipse cx="3"  cy="37"  rx="2.2" ry="4.2" fill="#1f2937"/>
      <ellipse cx="27" cy="37"  rx="2.2" ry="4.2" fill="#1f2937"/>
      <!-- Rim sheen -->
      <ellipse cx="3"  cy="12.5" rx="0.9" ry="1.7" fill="#4b5563" opacity="0.6"/>
      <ellipse cx="27" cy="12.5" rx="0.9" ry="1.7" fill="#4b5563" opacity="0.6"/>
    </svg>`;
  return makeVehicleIcon(svg, '#2563eb', heading, speed);
}

// Fire truck — heavy cab-forward, vivid red, amber corner beacons, ladder bed, 6 wheels
function makeFireTruckIcon(heading = 0, speed = 0) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 62" width="40" height="62">
      <defs>
        <linearGradient id="g-ft-cab" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stop-color="#991b1b"/>
          <stop offset="40%"  stop-color="#ef4444"/>
          <stop offset="100%" stop-color="#991b1b"/>
        </linearGradient>
        <linearGradient id="g-ft-glass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stop-color="#ffffff" stop-opacity="0.55"/>
          <stop offset="100%" stop-color="#fca5a5" stop-opacity="0.9"/>
        </linearGradient>
        <linearGradient id="g-ft-bed" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stop-color="#7f1d1d"/>
          <stop offset="40%"  stop-color="#b91c1c"/>
          <stop offset="100%" stop-color="#7f1d1d"/>
        </linearGradient>
      </defs>

      <!-- CAB (wide, boxy, flat-front) -->
      <rect x="3" y="4" width="34" height="19" rx="4.5" fill="url(#g-ft-cab)" stroke="#b91c1c" stroke-width="1.8"/>

      <!-- Windshield (spans full width of cab) -->
      <rect x="7" y="6.5" width="26" height="10" rx="2.5" fill="url(#g-ft-glass)"/>
      <!-- Windshield glint -->
      <rect x="9" y="7" width="10" height="2.2" rx="1.1" fill="white" opacity="0.65"/>

      <!-- Amber corner beacons — front-left -->
      <circle cx="5.5" cy="5.5" r="3.5" fill="#f59e0b"/>
      <circle cx="5.5" cy="5.5" r="2"   fill="#fde68a" opacity="0.85"/>
      <!-- front-right -->
      <circle cx="34.5" cy="5.5" r="3.5" fill="#f59e0b"/>
      <circle cx="34.5" cy="5.5" r="2"   fill="#fde68a" opacity="0.85"/>

      <!-- Siren bar on cab roof -->
      <rect x="13" y="4" width="14" height="3.5" rx="1.8" fill="#111827"/>
      <rect x="13.5" y="4.4" width="5"  height="2.5" rx="1.2" fill="#ef4444"/>
      <rect x="21.5" y="4.4" width="5"  height="2.5" rx="1.2" fill="#3b82f6"/>
      <rect x="19"   y="4.4" width="2"  height="2.5" fill="#111827"/>

      <!-- EQUIPMENT BED (long) -->
      <rect x="4" y="23" width="32" height="32" rx="3" fill="url(#g-ft-bed)" stroke="#991b1b" stroke-width="1.4"/>

      <!-- Yellow reflective tape bands -->
      <rect x="4"  y="26" width="32" height="2.5" fill="#fbbf24" opacity="0.75"/>
      <rect x="4"  y="49" width="32" height="2.5" fill="#fbbf24" opacity="0.75"/>

      <!-- Ladder — two rails -->
      <rect x="9.5"  y="29" width="2"  height="22" rx="1" fill="#fca5a5" opacity="0.8"/>
      <rect x="28.5" y="29" width="2"  height="22" rx="1" fill="#fca5a5" opacity="0.8"/>
      <!-- Ladder rungs (5) -->
      <rect x="9.5"  y="31" width="21" height="1.5" rx="0.7" fill="#fca5a5" opacity="0.65"/>
      <rect x="9.5"  y="35" width="21" height="1.5" rx="0.7" fill="#fca5a5" opacity="0.65"/>
      <rect x="9.5"  y="39" width="21" height="1.5" rx="0.7" fill="#fca5a5" opacity="0.65"/>
      <rect x="9.5"  y="43" width="21" height="1.5" rx="0.7" fill="#fca5a5" opacity="0.65"/>
      <rect x="9.5"  y="47" width="21" height="1.5" rx="0.7" fill="#fca5a5" opacity="0.65"/>

      <!-- Equipment compartment dividers -->
      <rect x="20" y="29" width="1.5" height="22" rx="0.7" fill="#991b1b" opacity="0.5"/>

      <!-- Rear bumper -->
      <rect x="9" y="52" width="22" height="3" rx="1.5" fill="#fca5a5"/>

      <!-- 6 wheels (front, mid, rear pairs) -->
      <ellipse cx="2"  cy="14"  rx="2.8" ry="5.5" fill="#1f2937"/>
      <ellipse cx="38" cy="14"  rx="2.8" ry="5.5" fill="#1f2937"/>
      <ellipse cx="2"  cy="30"  rx="2.8" ry="5.5" fill="#1f2937"/>
      <ellipse cx="38" cy="30"  rx="2.8" ry="5.5" fill="#1f2937"/>
      <ellipse cx="2"  cy="46"  rx="2.8" ry="5.5" fill="#1f2937"/>
      <ellipse cx="38" cy="46"  rx="2.8" ry="5.5" fill="#1f2937"/>
      <!-- Rim sheen -->
      <ellipse cx="1.5" cy="12.5" rx="1.1" ry="2.2" fill="#374151" opacity="0.55"/>
      <ellipse cx="38.5" cy="12.5" rx="1.1" ry="2.2" fill="#374151" opacity="0.55"/>
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
