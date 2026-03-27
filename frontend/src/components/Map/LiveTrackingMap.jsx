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

// ── Realistic top-down vehicle icons ──────────────────────────────────────────
// Aerial-perspective SVG drawings: proper silhouettes, radial roof gradients for
// the dome/depth effect, blue-tinted windshield glass, and vehicle-specific livery.
// Front of each vehicle points UP (heading 0 = north).
//
// Gradient IDs are scoped with a per-call counter to avoid DOM ID collisions
// when multiple vehicles of the same type appear on the map simultaneously.

let _vid = 0;

function makeVehicleIcon(svgContent, accentColor, heading = 0, speed = 0) {
  const moving = speed > 0;

  const pulse = moving ? `
    <div style="
        position:absolute;top:50%;left:50%;
        width:52px;height:52px;
        margin:-26px 0 0 -26px;
        border-radius:50%;
        background:${accentColor};
        opacity:0.18;
        animation:ping 1.4s cubic-bezier(0,0,0.2,1) infinite;">
    </div>` : '';

  const html = `
    <div style="position:relative;width:64px;height:64px;">
      ${pulse}
      <div style="
          position:absolute;top:0;left:0;width:64px;height:64px;
          transform:rotate(${heading}deg);
          transform-origin:32px 32px;
          display:flex;align-items:center;justify-content:center;
          filter:drop-shadow(0 4px 12px rgba(0,0,0,0.38));">
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

// ── AMBULANCE ─────────────────────────────────────────────────────────────────
// Type-III box ambulance on van chassis. White module, green cross, red/blue
// light bar, green side stripes. Front (cab) at TOP.
function makeAmbulanceIcon(heading = 0, speed = 0) {
  const id = ++_vid;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 34 62" width="34" height="62">
      <defs>
        <!-- Roof radial gradient: bright center fades to edge for dome depth -->
        <radialGradient id="ra${id}" cx="50%" cy="36%" r="56%">
          <stop offset="0%"   stop-color="#ffffff"/>
          <stop offset="62%"  stop-color="#edf2ed"/>
          <stop offset="100%" stop-color="#c2d4c2"/>
        </radialGradient>
        <!-- Blue-tinted windshield glass -->
        <linearGradient id="ga${id}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stop-color="#90caf9" stop-opacity="0.92"/>
          <stop offset="100%" stop-color="#5b9fbf" stop-opacity="0.85"/>
        </linearGradient>
      </defs>

      <!-- Ground shadow ellipse -->
      <ellipse cx="17" cy="61" rx="13" ry="2" fill="black" opacity="0.12"/>

      <!-- WHEELS (black rectangles, front pair + rear pair) -->
      <rect x="0.5" y="10"   width="5.5" height="11" rx="1.8" fill="#1a1a2e"/>
      <rect x="28"  y="10"   width="5.5" height="11" rx="1.8" fill="#1a1a2e"/>
      <rect x="0.5" y="40"   width="5.5" height="11" rx="1.8" fill="#1a1a2e"/>
      <rect x="28"  y="40"   width="5.5" height="11" rx="1.8" fill="#1a1a2e"/>
      <!-- Rim glints -->
      <rect x="1.5"  y="11.5" width="2" height="5" rx="0.7" fill="#3c3c5c" opacity="0.65"/>
      <rect x="29"   y="11.5" width="2" height="5" rx="0.7" fill="#3c3c5c" opacity="0.65"/>
      <rect x="1.5"  y="41.5" width="2" height="5" rx="0.7" fill="#3c3c5c" opacity="0.65"/>
      <rect x="29"   y="41.5" width="2" height="5" rx="0.7" fill="#3c3c5c" opacity="0.65"/>

      <!-- MAIN BODY (boxy van module) -->
      <rect x="4" y="4" width="26" height="54" rx="3.5"
            fill="url(#ra${id})" stroke="#b8cbb8" stroke-width="0.8"/>

      <!-- FRONT BUMPER -->
      <rect x="7"  y="3"   width="20" height="3.5" rx="1.5" fill="#90a4ae"/>
      <!-- Headlights -->
      <rect x="4.5" y="3.2" width="5"  height="3"   rx="1"   fill="#fff9c4" opacity="0.95"/>
      <rect x="24.5" y="3.2" width="5" height="3"   rx="1"   fill="#fff9c4" opacity="0.95"/>

      <!-- LIGHT BAR (red | white | blue, on cab roof) -->
      <rect x="9"   y="3.8" width="16" height="4.5" rx="2"   fill="#111827"/>
      <rect x="9.5" y="4.3" width="6"  height="3.2" rx="1.2" fill="#ef4444"/>
      <rect x="16"  y="4.3" width="3"  height="3.2" rx="1"   fill="#f8fafc"/>
      <rect x="20"  y="4.3" width="5"  height="3.2" rx="1.2" fill="#3b82f6"/>

      <!-- WINDSHIELD (blue tinted glass + glint) -->
      <path d="M7.5 8.5 Q17 7 26.5 8.5 L25.5 19.5 Q17 18 8.5 19.5 Z"
            fill="url(#ga${id})"/>
      <path d="M9 9.5 Q13 8.6 17 9.2 L16.5 12.5 Q12 11.8 9.5 12.2 Z"
            fill="white" opacity="0.38"/>

      <!-- Side mirrors -->
      <rect x="2"   y="16" width="3.5" height="4" rx="1" fill="#9bb0a0" opacity="0.85"/>
      <rect x="28.5" y="16" width="3.5" height="4" rx="1" fill="#9bb0a0" opacity="0.85"/>

      <!-- Cab-to-module seam -->
      <rect x="5" y="21" width="24" height="1.2" fill="#9ab89a" opacity="0.6"/>

      <!-- GREEN SIDE STRIPES (ambulance livery) -->
      <rect x="4.5" y="22" width="2.5" height="26" fill="#15803d" opacity="0.82"/>
      <rect x="27"  y="22" width="2.5" height="26" fill="#15803d" opacity="0.82"/>

      <!-- LARGE GREEN CROSS on patient module roof -->
      <g transform="translate(17,37)">
        <rect x="-3"  y="-10" width="6"  height="20" rx="2.2" fill="#166534"/>
        <rect x="-10" y="-3"  width="20" height="6"  rx="2.2" fill="#166534"/>
        <!-- Centre circle (Star of Life) -->
        <circle r="4.2" fill="#16a34a"/>
        <circle r="2"   fill="white" opacity="0.5"/>
      </g>

      <!-- Rear double-door seam -->
      <line x1="17" y1="47" x2="17" y2="57" stroke="#9ab89a" stroke-width="0.8" opacity="0.6"/>

      <!-- REAR TAIL LIGHTS -->
      <rect x="4.5" y="55" width="7"  height="2.8" rx="1" fill="#ef4444" opacity="0.9"/>
      <rect x="22.5" y="55" width="7" height="2.8" rx="1" fill="#ef4444" opacity="0.9"/>

      <!-- REAR BUMPER -->
      <rect x="7" y="57" width="20" height="3" rx="1.5" fill="#90a4ae"/>
    </svg>`;
  return makeVehicleIcon(svg, '#15803d', heading, speed);
}

// ── POLICE CAR ────────────────────────────────────────────────────────────────
// Modern police interceptor sedan. Dark navy/blue body, white door panels,
// red+blue light bar, police shield on hood. Front at TOP.
function makePoliceIcon(heading = 0, speed = 0) {
  const id = ++_vid;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 54" width="30" height="54">
      <defs>
        <radialGradient id="rp${id}" cx="50%" cy="30%" r="58%">
          <stop offset="0%"   stop-color="#3b5bdb"/>
          <stop offset="50%"  stop-color="#1e3a8a"/>
          <stop offset="100%" stop-color="#0d1f4a"/>
        </radialGradient>
        <linearGradient id="gp${id}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stop-color="#bfdbfe" stop-opacity="0.88"/>
          <stop offset="100%" stop-color="#7bb8d4" stop-opacity="0.82"/>
        </linearGradient>
      </defs>

      <!-- Shadow -->
      <ellipse cx="15" cy="52.5" rx="11" ry="2" fill="black" opacity="0.14"/>

      <!-- WHEELS (sedan — narrower, lower profile) -->
      <rect x="0.5" y="10"   width="4.5" height="9" rx="1.5" fill="#1a1a2e"/>
      <rect x="25"  y="10"   width="4.5" height="9" rx="1.5" fill="#1a1a2e"/>
      <rect x="0.5" y="35"   width="4.5" height="9" rx="1.5" fill="#1a1a2e"/>
      <rect x="25"  y="35"   width="4.5" height="9" rx="1.5" fill="#1a1a2e"/>
      <rect x="1.2" y="11.2" width="1.8" height="4" rx="0.6" fill="#3c3c5c" opacity="0.6"/>
      <rect x="25.8" y="11.2" width="1.8" height="4" rx="0.6" fill="#3c3c5c" opacity="0.6"/>
      <rect x="1.2" y="36.2" width="1.8" height="4" rx="0.6" fill="#3c3c5c" opacity="0.6"/>
      <rect x="25.8" y="36.2" width="1.8" height="4" rx="0.6" fill="#3c3c5c" opacity="0.6"/>

      <!-- BODY — aerodynamic sedan silhouette (wider at doors, tapers front/rear) -->
      <path d="M12 4 Q15 2 18 4 L23 13 L24 22 L24 37 L22 47 Q15 50 8 47 L6 37 L6 22 L7 13 Z"
            fill="url(#rp${id})" stroke="#1e3a8a" stroke-width="0.8"/>

      <!-- HOOD (slightly lighter navy) -->
      <path d="M12 4 Q15 2 18 4 L23 13 L7 13 Z" fill="#2d4a9e"/>

      <!-- HEADLIGHTS -->
      <rect x="8"   y="3.5" width="4"   height="2.8" rx="1"   fill="#fef9c3" opacity="0.92"/>
      <rect x="18"  y="3.5" width="4"   height="2.8" rx="1"   fill="#fef9c3" opacity="0.92"/>

      <!-- LIGHT BAR (red | white | blue) -->
      <rect x="9.5" y="4"   width="11"  height="4"   rx="2"   fill="#111827"/>
      <rect x="10"  y="4.5" width="4"   height="2.8" rx="1.2" fill="#ef4444"/>
      <rect x="14.5" y="4.5" width="2"  height="2.8" rx="0.8" fill="#f8fafc"/>
      <rect x="17"  y="4.5" width="4"   height="2.8" rx="1.2" fill="#3b82f6"/>

      <!-- WHITE DOOR STRIPE panels (left & right sides) -->
      <rect x="5.5" y="22" width="2.8" height="17" rx="1"   fill="white" opacity="0.88"/>
      <rect x="21.7" y="22" width="2.8" height="17" rx="1"  fill="white" opacity="0.88"/>

      <!-- WINDSHIELD (blue-tinted glass) -->
      <path d="M8.5 13 L21.5 13 L22.5 22 Q15 20.5 7.5 22 Z"
            fill="url(#gp${id})"/>
      <path d="M9.5 13.8 L15.5 13.8 L16 17 Q12 16.2 10 16.5 Z"
            fill="white" opacity="0.32"/>

      <!-- POLICE SHIELD on hood -->
      <g transform="translate(15,8.5)">
        <path d="M0,-4 L3.2,-2.3 L3.2,1.8 Q0,3.5 -3.2,1.8 L-3.2,-2.3 Z"
              fill="white" opacity="0.92"/>
        <path d="M0,-2.8 L2.2,-1.6 L2.2,1.1 Q0,2.5 -2.2,1.1 L-2.2,-1.6 Z"
              fill="#1d4ed8"/>
        <rect x="-0.7" y="-2"   width="1.4" height="3.4" rx="0.4" fill="white" opacity="0.85"/>
        <rect x="-2"   y="-0.65" width="4"  height="1.3" rx="0.4" fill="white" opacity="0.85"/>
      </g>

      <!-- REAR WINDOW -->
      <path d="M8.5 38 L21.5 38 L22.5 45 Q15 46.5 7.5 45 Z"
            fill="#93c5fd" opacity="0.38"/>

      <!-- REAR TAIL LIGHTS -->
      <rect x="7"   y="44"  width="4.5" height="2.5" rx="1" fill="#ef4444" opacity="0.9"/>
      <rect x="18.5" y="44" width="4.5" height="2.5" rx="1" fill="#ef4444" opacity="0.9"/>

      <!-- REAR BUMPER -->
      <rect x="9"   y="46"  width="12"  height="2.5" rx="1.2" fill="#5c7ab5"/>
    </svg>`;
  return makeVehicleIcon(svg, '#1d4ed8', heading, speed);
}

// ── FIRE TRUCK ────────────────────────────────────────────────────────────────
// Heavy cab-forward fire engine. Wide flat-front cab, long red body,
// amber corner beacons, visible ladder, yellow reflective bands, 6 wheels.
// Front (cab) at TOP.
function makeFireTruckIcon(heading = 0, speed = 0) {
  const id = ++_vid;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 66" width="40" height="66">
      <defs>
        <radialGradient id="rfc${id}" cx="50%" cy="28%" r="58%">
          <stop offset="0%"   stop-color="#f87171"/>
          <stop offset="50%"  stop-color="#dc2626"/>
          <stop offset="100%" stop-color="#7f1d1d"/>
        </radialGradient>
        <linearGradient id="gfc${id}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stop-color="#fecaca" stop-opacity="0.85"/>
          <stop offset="100%" stop-color="#f87171" stop-opacity="0.8"/>
        </linearGradient>
        <radialGradient id="rfb${id}" cx="50%" cy="50%" r="55%">
          <stop offset="0%"   stop-color="#ef4444"/>
          <stop offset="100%" stop-color="#7f1d1d"/>
        </radialGradient>
      </defs>

      <!-- Shadow -->
      <ellipse cx="20" cy="65" rx="16" ry="2.2" fill="black" opacity="0.14"/>

      <!-- FRONT WIDE WHEELS (truck) -->
      <rect x="0.5" y="8"   width="6"   height="13" rx="2"   fill="#1a1a2e"/>
      <rect x="33.5" y="8"  width="6"   height="13" rx="2"   fill="#1a1a2e"/>
      <rect x="1.5"  y="9.5" width="2.2" height="6" rx="0.7" fill="#3c3c5c" opacity="0.6"/>
      <rect x="34.5" y="9.5" width="2.2" height="6" rx="0.7" fill="#3c3c5c" opacity="0.6"/>

      <!-- REAR DUAL WHEELS (left pair) -->
      <rect x="0.5" y="38" width="5.5" height="11" rx="1.8" fill="#1a1a2e"/>
      <rect x="0.5" y="51" width="5.5" height="10" rx="1.8" fill="#1a1a2e"/>
      <!-- REAR DUAL WHEELS (right pair) -->
      <rect x="34"  y="38" width="5.5" height="11" rx="1.8" fill="#1a1a2e"/>
      <rect x="34"  y="51" width="5.5" height="10" rx="1.8" fill="#1a1a2e"/>

      <!-- CAB BODY (wide, flat-front) -->
      <rect x="4" y="3" width="32" height="22" rx="4.5"
            fill="url(#rfc${id})" stroke="#991b1b" stroke-width="1"/>

      <!-- AMBER CORNER BEACONS -->
      <circle cx="6.5"  cy="5.5" r="4"   fill="#d97706"/>
      <circle cx="6.5"  cy="5.5" r="2.2" fill="#fde68a" opacity="0.9"/>
      <circle cx="33.5" cy="5.5" r="4"   fill="#d97706"/>
      <circle cx="33.5" cy="5.5" r="2.2" fill="#fde68a" opacity="0.9"/>

      <!-- SIREN BAR (red | white | blue) -->
      <rect x="12"   y="3.5" width="16"  height="5"   rx="2.2" fill="#111827"/>
      <rect x="12.5" y="4"   width="5.5" height="3.8" rx="1.4" fill="#ef4444"/>
      <rect x="18.8" y="4"   width="2.4" height="3.8" rx="1"   fill="#f8fafc"/>
      <rect x="22"   y="4"   width="5.5" height="3.8" rx="1.4" fill="#3b82f6"/>

      <!-- WIDE WINDSHIELD (spans full cab) -->
      <rect x="7"  y="8.5" width="26" height="10.5" rx="2.5" fill="url(#gfc${id})"/>
      <!-- Glint -->
      <rect x="9"  y="9"   width="12" height="3"    rx="1.4" fill="white" opacity="0.28"/>

      <!-- CAB SIDE WINDOWS -->
      <rect x="4.5"  y="12" width="3.5" height="7"  rx="1.5" fill="#fecaca" opacity="0.55"/>
      <rect x="32"   y="12" width="3.5" height="7"  rx="1.5" fill="#fecaca" opacity="0.55"/>

      <!-- EQUIPMENT BODY (long) -->
      <rect x="4"  y="25" width="32" height="37" rx="3"
            fill="url(#rfb${id})" stroke="#991b1b" stroke-width="0.8"/>

      <!-- YELLOW REFLECTIVE BANDS -->
      <rect x="4"  y="28" width="32" height="3.2" fill="#fbbf24" opacity="0.82"/>
      <rect x="4"  y="55" width="32" height="3.2" fill="#fbbf24" opacity="0.82"/>

      <!-- LADDER (two rails + rungs, top view) -->
      <rect x="9"  y="33" width="2"  height="24" rx="1"   fill="#fca5a5" opacity="0.72"/>
      <rect x="29" y="33" width="2"  height="24" rx="1"   fill="#fca5a5" opacity="0.72"/>
      <rect x="9"  y="35.5" width="22" height="1.5" rx="0.7" fill="#fca5a5" opacity="0.58"/>
      <rect x="9"  y="40"   width="22" height="1.5" rx="0.7" fill="#fca5a5" opacity="0.58"/>
      <rect x="9"  y="44.5" width="22" height="1.5" rx="0.7" fill="#fca5a5" opacity="0.58"/>
      <rect x="9"  y="49"   width="22" height="1.5" rx="0.7" fill="#fca5a5" opacity="0.58"/>
      <rect x="9"  y="53.5" width="22" height="1.5" rx="0.7" fill="#fca5a5" opacity="0.58"/>

      <!-- Equipment compartment centre divide -->
      <rect x="19.5" y="31" width="1.5" height="26" rx="0.7" fill="#7f1d1d" opacity="0.45"/>

      <!-- REAR STEP BUMPER -->
      <rect x="8"  y="59.5" width="24" height="3.5" rx="1.5" fill="#fca5a5"/>
    </svg>`;
  return makeVehicleIcon(svg, '#dc2626', heading, speed);
}

// ── DEFAULT VEHICLE ───────────────────────────────────────────────────────────
// Generic response vehicle — aerodynamic sedan silhouette, color-coded by type.
function makeDefaultVehicleIcon(color = '#64748b', heading = 0, speed = 0) {
  const id = ++_vid;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 50" width="28" height="50">
      <defs>
        <radialGradient id="rd${id}" cx="50%" cy="34%" r="56%">
          <stop offset="0%"   stop-color="${color}dd"/>
          <stop offset="65%"  stop-color="${color}bb"/>
          <stop offset="100%" stop-color="${color}88"/>
        </radialGradient>
        <linearGradient id="gd${id}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stop-color="#bfdbfe" stop-opacity="0.85"/>
          <stop offset="100%" stop-color="#7bb8d4" stop-opacity="0.8"/>
        </linearGradient>
      </defs>

      <!-- Shadow -->
      <ellipse cx="14" cy="49" rx="10" ry="1.8" fill="black" opacity="0.12"/>

      <!-- WHEELS -->
      <rect x="0.5" y="9"   width="4.5" height="8.5" rx="1.4" fill="#1a1a2e"/>
      <rect x="23"  y="9"   width="4.5" height="8.5" rx="1.4" fill="#1a1a2e"/>
      <rect x="0.5" y="32"  width="4.5" height="8.5" rx="1.4" fill="#1a1a2e"/>
      <rect x="23"  y="32"  width="4.5" height="8.5" rx="1.4" fill="#1a1a2e"/>
      <rect x="1.2" y="10.2" width="1.6" height="4"  rx="0.5" fill="#3c3c5c" opacity="0.58"/>
      <rect x="23.8" y="10.2" width="1.6" height="4" rx="0.5" fill="#3c3c5c" opacity="0.58"/>

      <!-- BODY (sedan silhouette) -->
      <path d="M10 4 Q14 2 18 4 L21 12 L22 32 L20 44 Q14 47 8 44 L6 32 L7 12 Z"
            fill="url(#rd${id})" stroke="${color}" stroke-width="0.8" opacity="0.9"/>

      <!-- HOOD -->
      <path d="M10 4 Q14 2 18 4 L21 12 L7 12 Z" fill="${color}cc"/>

      <!-- HEADLIGHTS -->
      <rect x="8.5"  y="3.5" width="3.5" height="2.5" rx="0.9" fill="#fef9c3" opacity="0.9"/>
      <rect x="16"   y="3.5" width="3.5" height="2.5" rx="0.9" fill="#fef9c3" opacity="0.9"/>

      <!-- WINDSHIELD -->
      <path d="M8 12 L20 12 L21 21 Q14 19.5 7 21 Z" fill="url(#gd${id})"/>
      <path d="M9 12.8 L14.5 12.8 L15 16 Q11 15.3 9.5 15.6 Z" fill="white" opacity="0.3"/>

      <!-- REAR WINDOW -->
      <path d="M8 33 L20 33 L21 41 Q14 42.5 7 41 Z" fill="#93c5fd" opacity="0.35"/>

      <!-- REAR LIGHTS -->
      <rect x="7"   y="40.5" width="4" height="2.2" rx="0.8" fill="#ef4444" opacity="0.85"/>
      <rect x="17"  y="40.5" width="4" height="2.2" rx="0.8" fill="#ef4444" opacity="0.85"/>
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
