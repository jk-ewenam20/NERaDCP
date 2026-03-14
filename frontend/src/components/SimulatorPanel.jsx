import { useState, useRef, useCallback } from 'react';
import { RiPlayLine, RiStopLine, RiCarLine, RiLoader4Line } from 'react-icons/ri';
import { pushVehicleLocation } from '../api/tracking.api';
import toast from 'react-hot-toast';

const STEPS = 25;
const INTERVAL_MS = 2000;

// Maps the incident's assignedUnit.unitType to the vehicleType stored in LivePosition
const UNIT_VEHICLE_TYPE = {
  ambulance:      'ambulance',
  police_station: 'police_car',
  fire_station:   'fire_truck',
};

const TYPE_LABEL = {
  ambulance:   'Ambulance',
  police_car:  'Police Vehicle',
  fire_truck:  'Fire Truck',
};

// Generate a start point ~kmRadius km away from the target
function randomNearby(lat, lng, kmRadius = 3) {
  const dlat = (Math.random() - 0.5) * 2 * (kmRadius / 111);
  const dlng = (Math.random() - 0.5) * 2 * (kmRadius / (111 * Math.cos((lat * Math.PI) / 180)));
  return { lat: lat + dlat, lng: lng + dlng };
}

export default function SimulatorPanel({ incidents }) {
  const [running, setRunning] = useState({});   // { incidentId: boolean }
  const [progress, setProgress] = useState({}); // { incidentId: 0-100 }
  const intervals = useRef({});

  const dispatchedIncidents = incidents.filter(
    (i) =>
      ['dispatched', 'in_progress'].includes(i.status) &&
      i.assignedUnit?.unitId &&
      i.location?.coordinates
  );

  const startSimulation = useCallback((inc) => {
    const id = inc._id;
    if (intervals.current[id]) return;

    const incLat = inc.location.coordinates[1];
    const incLng = inc.location.coordinates[0];
    const vehicleId  = inc.assignedUnit.unitId;
    const vehicleType = UNIT_VEHICLE_TYPE[inc.assignedUnit.unitType] ?? 'ambulance';
    const start = randomNearby(incLat, incLng, 3);

    let step = 0;
    setRunning((p) => ({ ...p, [id]: true }));
    setProgress((p) => ({ ...p, [id]: 0 }));

    const tick = async () => {
      const t = step / STEPS;
      const lat = start.lat + (incLat - start.lat) * t;
      const lng = start.lng + (incLng - start.lng) * t;
      const speed = Math.round(40 + Math.random() * 40);

      try {
        await pushVehicleLocation(vehicleId, {
          latitude: lat,
          longitude: lng,
          speed,
          incidentId: id,
          vehicleType,
        });
      } catch { /* silent */ }

      step++;
      setProgress((p) => ({ ...p, [id]: Math.min(100, Math.round((step / STEPS) * 100)) }));

      if (step > STEPS) {
        clearInterval(intervals.current[id]);
        delete intervals.current[id];
        setRunning((p) => ({ ...p, [id]: false }));
        toast.success(`${TYPE_LABEL[vehicleType] ?? 'Vehicle'} arrived at scene`);
      }
    };

    tick();
    intervals.current[id] = setInterval(tick, INTERVAL_MS);
  }, []);

  const stopSimulation = useCallback((id) => {
    clearInterval(intervals.current[id]);
    delete intervals.current[id];
    setRunning((p) => ({ ...p, [id]: false }));
    setProgress((p) => ({ ...p, [id]: 0 }));
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100">
      <div className="px-4 py-3 border-b border-slate-100">
        <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide">GPS Simulator</p>
        <p className="text-xs text-slate-400 mt-0.5">Simulate vehicle movement to incident sites</p>
      </div>

      {dispatchedIncidents.length === 0 ? (
        <p className="text-xs text-slate-400 text-center py-6">
          No dispatched incidents to simulate.
        </p>
      ) : (
        <div className="divide-y divide-slate-50 max-h-52 overflow-y-auto">
          {dispatchedIncidents.map((inc) => {
            const isRunning = !!running[inc._id];
            const pct = progress[inc._id] ?? 0;
            const vehicleType = UNIT_VEHICLE_TYPE[inc.assignedUnit?.unitType] ?? 'ambulance';
            return (
              <div key={inc._id} className="px-4 py-3">
                <div className="flex items-center justify-between gap-3 mb-1.5">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <RiCarLine className="text-slate-400 text-xs flex-shrink-0" />
                      <p className="text-xs font-semibold text-slate-700 truncate capitalize">
                        {TYPE_LABEL[vehicleType]} — {inc.incidentType}
                      </p>
                    </div>
                    <p className="text-xs text-slate-400 truncate mt-0.5 ml-4">
                      {inc.assignedUnit?.unitName ?? inc._id}
                    </p>
                  </div>
                  <button
                    onClick={() => isRunning ? stopSimulation(inc._id) : startSimulation(inc)}
                    className={`flex-shrink-0 flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition
                      ${isRunning
                        ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'}`}
                  >
                    {isRunning
                      ? <><RiStopLine /> Stop</>
                      : <><RiPlayLine /> Start</>}
                  </button>
                </div>
                {isRunning && (
                  <div className="ml-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-400 w-8 text-right">{pct}%</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
