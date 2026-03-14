import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  RiAlertLine, RiCheckLine, RiTimeLine, RiPulseLine,
  RiArrowRightLine, RiRefreshLine, RiMapPinLine,
  RiBarChartLine, RiGroupLine, RiHospitalLine,
  RiShieldLine, RiFireLine, RiCarLine, RiUserLine,
} from 'react-icons/ri';
import StatCard from '../components/UI/StatCard';
import Badge from '../components/UI/Badge';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import { getIncidentStats, listIncidents, listOpenIncidents } from '../api/incident.api';
import { getOverview } from '../api/analytics.api';
import {
  listHospitals, listAmbulances,
  listPoliceStations, listFireStations,
} from '../api/resources.api';
import { listVehicles } from '../api/tracking.api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

// ── Shared helpers ─────────────────────────────────────────────────────────────
function FleetBar({ available, dispatched, unavailable }) {
  const total = available + dispatched + unavailable;
  if (total === 0) return null;
  return (
    <div className="space-y-1.5">
      <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
        {available   > 0 && <div style={{ flex: available   }} className="bg-emerald-400 rounded-l-full" />}
        {dispatched  > 0 && <div style={{ flex: dispatched  }} className="bg-amber-400" />}
        {unavailable > 0 && <div style={{ flex: unavailable }} className="bg-slate-300 rounded-r-full" />}
      </div>
      <div className="flex flex-wrap gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> Available ({available})
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Deployed ({dispatched})
        </span>
        {unavailable > 0 && (
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-slate-300 inline-block" /> Unavailable ({unavailable})
          </span>
        )}
      </div>
    </div>
  );
}

function QuickLink({ to, icon: Icon, label, sub, color, bg }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-sm transition-all group"
    >
      <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}>
        <Icon className={`text-lg ${color}`} />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-800">{label}</p>
        <p className="text-xs text-slate-500 truncate">{sub}</p>
      </div>
      <RiArrowRightLine className="ml-auto text-slate-300 group-hover:text-blue-500 flex-shrink-0" />
    </Link>
  );
}

function RecentIncidentRow({ inc }) {
  return (
    <div className="px-5 py-3 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">{inc.citizenName}</p>
        <p className="text-xs text-slate-400 truncate">{inc.address}</p>
      </div>
      <Badge value={inc.status} />
    </div>
  );
}

// ── Hospital Admin Dashboard ───────────────────────────────────────────────────
function HospitalAdminDashboard({ user }) {
  const [ambulances, setAmbulances] = useState([]);
  const [hospitals,  setHospitals]  = useState([]);
  const [incidents,  setIncidents]  = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [ambRes, hospRes, incRes] = await Promise.allSettled([
        listAmbulances(),
        listHospitals(),
        listIncidents({ incidentType: 'medical', limit: 10, sort: '-createdAt' }),
      ]);
      if (ambRes.status  === 'fulfilled') setAmbulances(ambRes.value.data.data?.ambulances ?? []);
      if (hospRes.status === 'fulfilled') setHospitals(hospRes.value.data.data?.hospitals ?? []);
      if (incRes.status  === 'fulfilled') {
        const d = incRes.value.data.data;
        setIncidents(Array.isArray(d) ? d : d?.incidents ?? []);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const available    = ambulances.filter((a) => a.status === 'available').length;
  const dispatched   = ambulances.filter((a) => a.status === 'dispatched').length;
  const outOfService = ambulances.filter((a) => a.status === 'out_of_service').length;
  const openCalls    = incidents.filter((i) =>
    ['created', 'dispatched', 'in_progress'].includes(i.status)).length;
  const resolved     = incidents.filter((i) => i.status === 'resolved').length;

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center gap-4 bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-4">
        <div className="w-11 h-11 rounded-xl bg-white shadow-sm flex items-center justify-center flex-shrink-0">
          <RiHospitalLine className="text-2xl text-emerald-600" />
        </div>
        <div>
          <p className="text-xs font-medium text-emerald-700 uppercase tracking-wide">Hospital Administration</p>
          <h2 className="text-lg font-bold text-slate-800">{user?.name}</h2>
        </div>
        <button onClick={load} className="ml-auto text-emerald-500 hover:text-emerald-700 p-1 rounded">
          <RiRefreshLine />
        </button>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={RiCarLine}      label="Available Ambulances" value={available}        color="text-emerald-600" bg="bg-emerald-50" />
        <StatCard icon={RiPulseLine}    label="Deployed"             value={dispatched}       color="text-amber-600"   bg="bg-amber-50" />
        <StatCard icon={RiAlertLine}    label="Open Medical Calls"   value={openCalls}        color="text-red-600"     bg="bg-red-50" />
        <StatCard icon={RiHospitalLine} label="Hospitals"            value={hospitals.length} color="text-blue-600"    bg="bg-blue-50" />
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm px-5 py-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-slate-800 text-sm">Ambulance Fleet Status</h3>
          <span className="text-xs text-slate-400">{ambulances.length} total</span>
        </div>
        {loading
          ? <LoadingSpinner />
          : ambulances.length === 0
            ? <p className="text-xs text-slate-400">No ambulances registered</p>
            : <FleetBar available={available} dispatched={dispatched} unavailable={outOfService} />
        }
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-1 bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex flex-col items-center justify-center gap-1">
          <p className="text-3xl font-bold text-emerald-700">{resolved}</p>
          <p className="text-xs font-medium text-emerald-600 text-center">Medical calls resolved</p>
        </div>
        <div className="sm:col-span-2 grid grid-cols-1 gap-3">
          <QuickLink to="/resources" icon={RiHospitalLine} label="Hospitals & Fleet" sub="Manage ambulances and beds"   color="text-emerald-600" bg="bg-emerald-50" />
          <QuickLink to="/live-map"  icon={RiMapPinLine}   label="Live Tracking"     sub="Monitor ambulance dispatches" color="text-slate-600"   bg="bg-slate-50" />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800">Recent Medical Calls</h3>
        </div>
        {loading ? <LoadingSpinner center /> : (
          <div className="divide-y divide-slate-50">
            {incidents.length === 0
              ? <p className="text-center text-sm text-slate-400 py-8">No medical incidents yet</p>
              : incidents.slice(0, 6).map((inc) => <RecentIncidentRow key={inc._id} inc={inc} />)
            }
          </div>
        )}
      </div>
    </div>
  );
}

// ── Police Admin Dashboard ─────────────────────────────────────────────────────
function PoliceAdminDashboard({ user }) {
  const [stations,  setStations]  = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [stRes, incRes] = await Promise.allSettled([
        listPoliceStations(),
        listIncidents({ incidentType: 'crime', limit: 10, sort: '-createdAt' }),
      ]);
      if (stRes.status  === 'fulfilled') setStations(stRes.value.data.data?.stations ?? []);
      if (incRes.status === 'fulfilled') {
        const d = incRes.value.data.data;
        setIncidents(Array.isArray(d) ? d : d?.incidents ?? []);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const activeStations = stations.filter((s) => s.status === 'active').length;
  const openCalls = incidents.filter((i) =>
    ['created', 'dispatched', 'in_progress'].includes(i.status)).length;
  const resolved = incidents.filter((i) => i.status === 'resolved').length;

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center gap-4 bg-blue-50 border border-blue-200 rounded-xl px-5 py-4">
        <div className="w-11 h-11 rounded-xl bg-white shadow-sm flex items-center justify-center flex-shrink-0">
          <RiShieldLine className="text-2xl text-blue-600" />
        </div>
        <div>
          <p className="text-xs font-medium text-blue-700 uppercase tracking-wide">Police Administration</p>
          <h2 className="text-lg font-bold text-slate-800">{user?.name}</h2>
        </div>
        <button onClick={load} className="ml-auto text-blue-500 hover:text-blue-700 p-1 rounded">
          <RiRefreshLine />
        </button>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
        <StatCard icon={RiShieldLine} label="Police Stations"  value={activeStations} color="text-blue-600"    bg="bg-blue-50" />
        <StatCard icon={RiAlertLine}  label="Open Crime Calls" value={openCalls}      color="text-amber-600"   bg="bg-amber-50" />
        <StatCard icon={RiCheckLine}  label="Resolved Crimes"  value={resolved}       color="text-emerald-600" bg="bg-emerald-50" />
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800">Police Stations</h3>
          <span className="text-xs text-slate-400">{stations.length} stations</span>
        </div>
        {loading ? <LoadingSpinner center /> : (
          <div className="divide-y divide-slate-50">
            {stations.length === 0
              ? <p className="text-center text-sm text-slate-400 py-8">No stations registered</p>
              : stations.slice(0, 5).map((st) => (
                <div key={st._id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{st.name}</p>
                    <p className="text-xs text-slate-400 truncate max-w-[240px]">{st.address}</p>
                  </div>
                  <Badge value={st.status} />
                </div>
              ))
            }
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <QuickLink to="/resources" icon={RiShieldLine} label="Police Stations" sub="Manage stations and officers"    color="text-blue-600" bg="bg-blue-50" />
        <QuickLink to="/live-map"  icon={RiMapPinLine} label="Live Tracking"   sub="Monitor active police responses" color="text-slate-600" bg="bg-slate-50" />
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800">Recent Crime Calls</h3>
        </div>
        {loading ? <LoadingSpinner center /> : (
          <div className="divide-y divide-slate-50">
            {incidents.length === 0
              ? <p className="text-center text-sm text-slate-400 py-8">No crime incidents yet</p>
              : incidents.slice(0, 6).map((inc) => <RecentIncidentRow key={inc._id} inc={inc} />)
            }
          </div>
        )}
      </div>
    </div>
  );
}

// ── Fire Admin Dashboard ───────────────────────────────────────────────────────
function FireAdminDashboard({ user }) {
  const [stations,  setStations]  = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [stRes, incRes] = await Promise.allSettled([
        listFireStations(),
        listIncidents({ incidentType: 'fire', limit: 10, sort: '-createdAt' }),
      ]);
      if (stRes.status  === 'fulfilled') setStations(stRes.value.data.data?.stations ?? []);
      if (incRes.status === 'fulfilled') {
        const d = incRes.value.data.data;
        setIncidents(Array.isArray(d) ? d : d?.incidents ?? []);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const activeStations = stations.filter((s) => s.status === 'active').length;
  const openCalls = incidents.filter((i) =>
    ['created', 'dispatched', 'in_progress'].includes(i.status)).length;
  const resolved = incidents.filter((i) => i.status === 'resolved').length;

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center gap-4 bg-orange-50 border border-orange-200 rounded-xl px-5 py-4">
        <div className="w-11 h-11 rounded-xl bg-white shadow-sm flex items-center justify-center flex-shrink-0">
          <RiFireLine className="text-2xl text-orange-600" />
        </div>
        <div>
          <p className="text-xs font-medium text-orange-700 uppercase tracking-wide">Fire Service Administration</p>
          <h2 className="text-lg font-bold text-slate-800">{user?.name}</h2>
        </div>
        <button onClick={load} className="ml-auto text-orange-500 hover:text-orange-700 p-1 rounded">
          <RiRefreshLine />
        </button>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
        <StatCard icon={RiFireLine}  label="Fire Stations"      value={activeStations} color="text-orange-600"  bg="bg-orange-50" />
        <StatCard icon={RiAlertLine} label="Active Fire Calls"  value={openCalls}      color="text-red-600"     bg="bg-red-50" />
        <StatCard icon={RiCheckLine} label="Incidents Resolved" value={resolved}       color="text-emerald-600" bg="bg-emerald-50" />
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800">Fire Stations</h3>
          <span className="text-xs text-slate-400">{stations.length} stations</span>
        </div>
        {loading ? <LoadingSpinner center /> : (
          <div className="divide-y divide-slate-50">
            {stations.length === 0
              ? <p className="text-center text-sm text-slate-400 py-8">No stations registered</p>
              : stations.slice(0, 5).map((st) => (
                <div key={st._id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{st.name}</p>
                    <p className="text-xs text-slate-400 truncate max-w-[240px]">{st.address}</p>
                  </div>
                  <Badge value={st.status} />
                </div>
              ))
            }
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <QuickLink to="/resources" icon={RiFireLine}   label="Fire Stations" sub="Manage stations and personnel" color="text-orange-600" bg="bg-orange-50" />
        <QuickLink to="/live-map"  icon={RiMapPinLine} label="Live Tracking" sub="Monitor active fire responses" color="text-slate-600"  bg="bg-slate-50" />
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800">Recent Fire Calls</h3>
        </div>
        {loading ? <LoadingSpinner center /> : (
          <div className="divide-y divide-slate-50">
            {incidents.length === 0
              ? <p className="text-center text-sm text-slate-400 py-8">No fire incidents yet</p>
              : incidents.slice(0, 6).map((inc) => <RecentIncidentRow key={inc._id} inc={inc} />)
            }
          </div>
        )}
      </div>
    </div>
  );
}

// ── Ambulance Driver Dashboard ─────────────────────────────────────────────────
function DriverDashboard({ user }) {
  const [incidents, setIncidents] = useState([]);
  const [vehicles,  setVehicles]  = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [incRes, vRes] = await Promise.allSettled([
        listOpenIncidents(),
        listVehicles(),
      ]);
      if (incRes.status === 'fulfilled') {
        const d = incRes.value.data.data;
        setIncidents(Array.isArray(d) ? d : d?.incidents ?? []);
      }
      if (vRes.status === 'fulfilled') {
        setVehicles(vRes.value.data.data?.vehicles ?? []);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const active = incidents.find((i) =>
    ['dispatched', 'in_progress'].includes(i.status));

  const STATUS_STYLE = {
    dispatched:  'bg-blue-50 border-blue-200',
    in_progress: 'bg-amber-50 border-amber-200',
  };

  return (
    <div className="space-y-5 max-w-xl">
      <div className="flex items-center gap-4 bg-amber-50 border border-amber-200 rounded-xl px-5 py-4">
        <div className="w-11 h-11 rounded-xl bg-white shadow-sm flex items-center justify-center flex-shrink-0">
          <RiCarLine className="text-2xl text-amber-600" />
        </div>
        <div>
          <p className="text-xs font-medium text-amber-700 uppercase tracking-wide">Ambulance Driver</p>
          <h2 className="text-lg font-bold text-slate-800">{user?.name}</h2>
        </div>
        <button onClick={load} className="ml-auto text-amber-500 hover:text-amber-700 p-1 rounded">
          <RiRefreshLine />
        </button>
      </div>

      {loading ? <LoadingSpinner center /> : (
        <>
          {active ? (
            <div className={`rounded-xl border-2 p-5 space-y-3 ${STATUS_STYLE[active.status] ?? 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Active Dispatch</p>
                <Badge value={active.status} />
              </div>
              <p className="font-bold text-slate-800 text-lg capitalize">{active.incidentType} Emergency</p>
              <p className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                <RiUserLine className="flex-shrink-0 text-slate-400" /> {active.citizenName}
              </p>
              <p className="text-sm text-slate-600 flex items-center gap-1.5">
                <RiMapPinLine className="flex-shrink-0 text-slate-400" /> {active.address}
              </p>
              {active.notes && (
                <p className="text-xs text-slate-500 bg-white bg-opacity-70 rounded-lg px-3 py-2">
                  {active.notes}
                </p>
              )}
              {active.assignedUnit?.unitName && (
                <p className="text-xs text-slate-500">
                  Unit: <span className="font-medium">{active.assignedUnit.unitName}</span>
                </p>
              )}
              <Link
                to="/live-map"
                className="flex items-center justify-center gap-2 w-full bg-white border border-slate-300 rounded-xl py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition mt-1"
              >
                <RiMapPinLine /> Open Live Map
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-8 text-center space-y-2">
              <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                <RiCarLine className="text-2xl text-slate-300" />
              </div>
              <p className="font-semibold text-slate-700">No active dispatch</p>
              <p className="text-sm text-slate-400">You will be notified when a call is assigned.</p>
            </div>
          )}

          {vehicles.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm px-5 py-4">
              <h3 className="font-semibold text-slate-800 mb-3 text-sm">Your Vehicle</h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <RiCarLine className="text-amber-600 text-lg" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800 capitalize">
                    {vehicles[0].vehicleType?.replace('_', ' ') ?? 'Ambulance'}
                  </p>
                  <p className="text-xs text-slate-400">
                    ID: {String(vehicles[0].vehicleId ?? vehicles[0]._id).slice(-8)}
                  </p>
                </div>
                {vehicles[0].speed != null && (
                  <p className="ml-auto text-sm font-semibold text-slate-600">
                    {vehicles[0].speed} km/h
                  </p>
                )}
              </div>
            </div>
          )}

          <QuickLink to="/live-map" icon={RiMapPinLine} label="Live Map" sub="Track your route and arrival" color="text-amber-600" bg="bg-amber-50" />
        </>
      )}
    </div>
  );
}

// ── System admin full dashboard ────────────────────────────────────────────────
function AdminDashboard() {
  const [stats,       setStats]       = useState(null);
  const [avgResponse, setAvgResponse] = useState(null);
  const [incidents,   setIncidents]   = useState([]);
  const [loading,     setLoading]     = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [statsRes, incRes, analyticsRes] = await Promise.allSettled([
        getIncidentStats(),
        listIncidents({ limit: 8, sort: '-createdAt' }),
        getOverview(),
      ]);

      if (statsRes.status === 'fulfilled') {
        const s     = statsRes.value.data.data.stats ?? {};
        const total = Object.values(s).reduce((a, b) => a + b, 0);
        const open  = (s.created || 0) + (s.dispatched || 0) + (s.in_progress || 0);
        setStats({ totalIncidents: total, openIncidents: open, resolvedCount: s.resolved || 0 });
      } else {
        toast.error('Failed to load incident stats');
      }

      if (incRes.status === 'fulfilled') {
        const d = incRes.value.data.data;
        setIncidents(Array.isArray(d) ? d : d?.incidents ?? []);
      }

      if (analyticsRes.status === 'fulfilled') {
        const ov = analyticsRes.value.data.data;
        setAvgResponse(ov?.avgResponseTimeMinutes ?? null);
        if (ov?.incidentsByType) {
          setStats((prev) => prev ? { ...prev, byType: ov.incidentsByType } : prev);
        }
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const TYPE_COLOR = {
    medical:  'text-emerald-600 bg-emerald-50',
    fire:     'text-orange-600 bg-orange-50',
    crime:    'text-blue-600 bg-blue-50',
    accident: 'text-amber-600 bg-amber-50',
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={RiAlertLine} label="Total Incidents"    value={stats?.totalIncidents}                                           color="text-blue-600"    bg="bg-blue-50" />
        <StatCard icon={RiPulseLine} label="Open Incidents"     value={stats?.openIncidents}                                            color="text-amber-600"   bg="bg-amber-50" />
        <StatCard icon={RiCheckLine} label="Resolved"           value={stats?.resolvedCount}                                            color="text-emerald-600" bg="bg-emerald-50" />
        <StatCard icon={RiTimeLine}  label="Avg Response (min)" value={avgResponse != null ? parseFloat(avgResponse).toFixed(1) : '—'} color="text-slate-600"   bg="bg-slate-50" />
      </div>

      {stats?.byType && Object.keys(stats.byType).length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(stats.byType).map(([type, count]) => (
            <div key={type} className={`rounded-xl p-4 ${TYPE_COLOR[type] ?? 'text-slate-600 bg-slate-50'}`}>
              <p className="text-2xl font-bold">{count}</p>
              <p className="text-sm font-medium capitalize mt-0.5">{type}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { to: '/incidents', icon: RiAlertLine,    label: 'Incidents', color: 'text-blue-600',    bg: 'bg-blue-50' },
          { to: '/live-map',  icon: RiMapPinLine,   label: 'Live Map',  color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { to: '/analytics', icon: RiBarChartLine, label: 'Analytics', color: 'text-purple-600',  bg: 'bg-purple-50' },
          { to: '/users',     icon: RiGroupLine,    label: 'Users',     color: 'text-slate-600',   bg: 'bg-slate-50' },
        ].map(({ to, icon: NavIcon, label, color, bg }) => (
          <Link
            key={to}
            to={to}
            className={`flex flex-col items-center gap-2 rounded-xl ${bg} p-4 hover:shadow-sm transition-shadow`}
          >
            <NavIcon className={`text-2xl ${color}`} />
            <span className={`text-xs font-semibold ${color}`}>{label}</span>
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Recent Incidents</h2>
          <div className="flex gap-2">
            <button onClick={load} className="text-slate-400 hover:text-slate-600 p-1 rounded">
              <RiRefreshLine />
            </button>
            <Link to="/incidents" className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium">
              View all <RiArrowRightLine />
            </Link>
          </div>
        </div>

        {loading ? <LoadingSpinner center /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase">
                  <th className="text-left px-5 py-3 font-medium">Citizen</th>
                  <th className="text-left px-5 py-3 font-medium">Type</th>
                  <th className="text-left px-5 py-3 font-medium">Status</th>
                  <th className="text-left px-5 py-3 font-medium hidden md:table-cell">Address</th>
                  <th className="text-left px-5 py-3 font-medium hidden lg:table-cell">Time</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {incidents.map((inc) => (
                  <tr key={inc._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 font-medium text-slate-800">{inc.citizenName}</td>
                    <td className="px-5 py-3"><Badge value={inc.incidentType} kind="type" /></td>
                    <td className="px-5 py-3"><Badge value={inc.status} /></td>
                    <td className="px-5 py-3 text-slate-500 hidden md:table-cell max-w-[200px] truncate">{inc.address}</td>
                    <td className="px-5 py-3 text-slate-400 hidden lg:table-cell whitespace-nowrap">
                      {new Date(inc.createdAt).toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link to={`/incidents?id=${inc._id}`} className="text-blue-600 hover:text-blue-700">
                        <RiArrowRightLine />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {incidents.length === 0 && (
              <p className="text-center text-sm text-slate-400 py-10">No incidents recorded yet.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Entry point ────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user } = useAuth();
  if (user?.role === 'system_admin')     return <AdminDashboard />;
  if (user?.role === 'hospital_admin')   return <HospitalAdminDashboard user={user} />;
  if (user?.role === 'police_admin')     return <PoliceAdminDashboard   user={user} />;
  if (user?.role === 'fire_admin')       return <FireAdminDashboard     user={user} />;
  if (user?.role === 'ambulance_driver') return <DriverDashboard        user={user} />;
  return null;
}
