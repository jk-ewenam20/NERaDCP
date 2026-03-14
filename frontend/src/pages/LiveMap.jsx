import { useEffect, useRef, useState } from "react";
import {
  RiWifiLine,
  RiWifiOffLine,
  RiCarLine,
  RiAlertLine,
  RiRefreshLine,
} from "react-icons/ri";
import LiveTrackingMap from "../components/Map/LiveTrackingMap";
import SimulatorPanel from "../components/SimulatorPanel";
import Badge from "../components/UI/Badge";
import { useSocket } from "../contexts/SocketContext";
import { useAuth } from "../contexts/AuthContext";
import { listVehicles } from "../api/tracking.api";
import { listOpenIncidents } from "../api/incident.api";
import toast from "react-hot-toast";

// Roles that can only see certain vehicle types via the WebSocket broadcast.
// The initial list is already filtered server-side; this filters live socket events.
const ROLE_VEHICLE_TYPES = {
  hospital_admin: ["ambulance"],
  ambulance_driver: ["ambulance"],
  police_admin: ["police_car"],
  fire_admin: ["fire_truck"],
  // system_admin: null → sees all
};

// Compute compass bearing (degrees 0–360) from one GPS point to another.
// Used to rotate vehicle icons in the direction of travel.
function calcBearing(lat1, lng1, lat2, lng2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLng = toRad(lng2 - lng1);
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const y = Math.sin(dLng) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) -
    Math.sin(φ1) * Math.cos(φ2) * Math.cos(dLng);
  return (Math.atan2(y, x) * (180 / Math.PI) + 360) % 360;
}

export default function LiveMap() {
  const [vehicles, setVehicles] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [liveUpdates, setLiveUpdates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  // Tracks the last known { lat, lng } per vehicleId to compute bearing
  const prevPositions = useRef({});
  const { connected, on, emit } = useSocket();
  const { user, loading: authLoading } = useAuth();

  const allowedTypes = ROLE_VEHICLE_TYPES[user?.role] ?? null; // null = all

  async function loadInitial() {
    setIsLoading(true);
    try {
      const [vRes, iRes] = await Promise.all([
        listVehicles(),
        listOpenIncidents(),
      ]);
      // vehicles response: { data: { vehicles: [...] } }
      setVehicles(vRes.data.data?.vehicles ?? []);
      const inc = iRes.data.data;
      setIncidents(Array.isArray(inc) ? inc : (inc?.incidents ?? []));
    } catch {
      toast.error("Failed to load tracking data");
    } finally {
      setIsLoading(false);
    }
  }

  // Subscribe to all updates once user is authenticated
  useEffect(() => {
    if (!user || !connected) return;
    emit("subscribe:all", {});
  }, [emit, user, connected]);

  useEffect(() => {
    if (!user) return; // Don't set up listeners until user is authenticated

    const offLocation = on("vehicle:location", (payload) => {
      // Filter by role if not system_admin
      if (allowedTypes && !allowedTypes.includes(payload.vehicleType)) return;

      const { vehicleId, incidentId, lat, lng, speed, vehicleType, timestamp } =
        payload;

      // Compute heading from previous position (for icon rotation)
      const key = String(vehicleId);
      const prev = prevPositions.current[key];
      const heading = prev ? calcBearing(prev.lat, prev.lng, lat, lng) : 0;
      prevPositions.current[key] = { lat, lng };

      setVehicles((prevVehicles) => {
        const exists = prevVehicles.find(
          (v) => String(v.vehicleId ?? v._id) === key,
        );
        if (exists) {
          return prevVehicles.map((v) =>
            String(v.vehicleId ?? v._id) === key
              ? {
                  ...v,
                  location: { type: "Point", coordinates: [lng, lat] },
                  speed,
                  vehicleType,
                  lastUpdated: timestamp,
                  heading,
                }
              : v,
          );
        }
        return [
          ...prevVehicles,
          {
            vehicleId,
            incidentId,
            vehicleType,
            location: { type: "Point", coordinates: [lng, lat] },
            speed,
            lastUpdated: timestamp,
            heading,
          },
        ];
      });

      setLiveUpdates((prev) => [
        {
          vehicleId,
          incidentId,
          lat,
          lng,
          speed,
          vehicleType,
          timestamp,
          type: "location",
        },
        ...prev.slice(0, 19),
      ]);
    });

    const offArrived = on("vehicle:arrived", (payload) => {
      const { vehicleId, incidentId, arrivedAt } = payload;
      toast.success(`Vehicle arrived at scene`);
      setLiveUpdates((prev) => [
        { vehicleId, incidentId, type: "arrived", timestamp: arrivedAt },
        ...prev.slice(0, 19),
      ]);
    });

    const offStatus = on(
      "dispatch:status_changed",
      ({ incidentId, status }) => {
        setIncidents((prev) =>
          prev.map((i) => (i._id === incidentId ? { ...i, status } : i)),
        );
      },
    );

    return () => {
      offLocation?.();
      offArrived?.();
      offStatus?.();
    };
  }, [on, allowedTypes, user]);

  useEffect(() => {
    if (!user) return; // Wait for user to be authenticated
    loadInitial();
  }, [user]);

  const TYPE_COLOR = {
    medical: "text-emerald-600",
    fire: "text-orange-600",
    crime: "text-blue-600",
    accident: "text-amber-600",
  };

  const isAdmin = user?.role === "system_admin";

  // Show loading state while initializing
  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-9rem)] bg-white rounded-xl shadow-sm">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-600">Initializing live tracking...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-9rem)]">
      {/* Map */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden min-h-[400px] flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-slate-800 text-sm">
              Live Vehicle Tracking
            </h2>
            <span
              className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium
              ${connected ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
            >
              {connected ? (
                <>
                  <RiWifiLine /> Live
                </>
              ) : (
                <>
                  <RiWifiOffLine /> Tracking offline
                </>
              )}
            </span>
          </div>
          <button
            onClick={loadInitial}
            className="text-slate-400 hover:text-slate-600 p-1 rounded"
          >
            <RiRefreshLine />
          </button>
        </div>

        {!connected && (
          <div className="mx-4 mt-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700 flex-shrink-0">
            Tracking service is unreachable. The map shows last known positions.
          </div>
        )}

        <div className="flex-1 min-h-0">
          <LiveTrackingMap vehicles={vehicles} incidents={incidents} />
        </div>
      </div>

      {/* Side panel */}
      <div className="lg:w-72 flex flex-col gap-4 overflow-y-auto">
        {/* Open incidents */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
            <RiAlertLine className="text-red-500" />
            <h3 className="font-semibold text-slate-800 text-sm">
              Open Incidents ({incidents.length})
            </h3>
          </div>
          <div className="divide-y divide-slate-50 max-h-56 overflow-y-auto">
            {incidents.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-6">
                No open incidents
              </p>
            )}
            {incidents.map((inc) => (
              <div key={inc._id} className="px-4 py-3">
                <div className="flex items-center justify-between mb-0.5">
                  <span
                    className={`text-xs font-semibold capitalize ${TYPE_COLOR[inc.incidentType]}`}
                  >
                    {inc.incidentType}
                  </span>
                  <Badge value={inc.status} />
                </div>
                <p className="text-xs text-slate-700 font-medium">
                  {inc.citizenName}
                </p>
                <p className="text-xs text-slate-400 truncate">{inc.address}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tracked vehicles */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
            <RiCarLine className="text-blue-500" />
            <h3 className="font-semibold text-slate-800 text-sm">
              Tracked Vehicles ({vehicles.length})
            </h3>
          </div>
          <div className="divide-y divide-slate-50 max-h-48 overflow-y-auto">
            {vehicles.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-6">
                No vehicles tracked
              </p>
            )}
            {vehicles.map((v, i) => (
              <div
                key={String(v.vehicleId ?? v._id ?? i)}
                className="px-4 py-2.5"
              >
                <p className="text-xs font-medium text-slate-700 capitalize">
                  {v.vehicleType?.replace("_", " ") ?? "Vehicle"} —{" "}
                  {String(v.vehicleId ?? v._id).slice(-6)}
                </p>
                {v.location?.coordinates && (
                  <p className="text-xs text-slate-400">
                    {v.location.coordinates[1].toFixed(4)},{" "}
                    {v.location.coordinates[0].toFixed(4)}
                  </p>
                )}
                {v.speed != null && (
                  <p className="text-xs text-slate-300">{v.speed} km/h</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* GPS Simulator — system_admin only */}
        {isAdmin && <SimulatorPanel incidents={incidents} />}

        {/* Live event feed */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 flex-1">
          <div className="px-4 py-3 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800 text-sm">Event Feed</h3>
          </div>
          <div className="divide-y divide-slate-50 max-h-64 overflow-y-auto">
            {liveUpdates.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-6">
                {connected
                  ? "Waiting for live events…"
                  : "Tracking service offline"}
              </p>
            )}
            {liveUpdates.map((ev, i) => (
              <div key={i} className="px-4 py-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-1.5 h-1.5 rounded-full flex-shrink-0
                    ${ev.type === "arrived" ? "bg-emerald-500" : "bg-blue-500"}`}
                  />
                  <p className="text-xs text-slate-700 font-medium capitalize">
                    {ev.vehicleType?.replace("_", " ") ??
                      String(ev.vehicleId).slice(-6)}
                  </p>
                </div>
                <p className="text-xs text-slate-400 ml-3.5">
                  {ev.type === "arrived"
                    ? "Arrived at scene"
                    : `${ev.lat?.toFixed(4)}, ${ev.lng?.toFixed(4)}`}
                </p>
                <p className="text-xs text-slate-300 ml-3.5">
                  {new Date(ev.timestamp).toLocaleTimeString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
