import { useEffect, useState, useCallback } from 'react';
import {
  RiHospitalLine, RiCarLine, RiShieldLine, RiFireLine,
  RiAddLine, RiRefreshLine, RiUserLine,
} from 'react-icons/ri';
import Badge from '../components/UI/Badge';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import EmptyState from '../components/UI/EmptyState';
import Modal from '../components/UI/Modal';
import AddressSearch from '../components/Map/AddressSearch';
import IncidentMapPicker from '../components/Map/IncidentMapPicker';
import {
  listHospitals, listAmbulances, listPoliceStations, listFireStations,
  createHospital, createAmbulance, createPoliceStation, createFireStation,
  assignAmbulanceDriver,
} from '../api/resources.api';
import { listUsers } from '../api/auth.api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const TABS = [
  { id: 'hospitals',       label: 'Hospitals',       icon: RiHospitalLine, color: 'text-emerald-600' },
  { id: 'ambulances',      label: 'Ambulances',       icon: RiCarLine,      color: 'text-emerald-600' },
  { id: 'police-stations', label: 'Police Stations',  icon: RiShieldLine,   color: 'text-blue-600' },
  { id: 'fire-stations',   label: 'Fire Stations',    icon: RiFireLine,     color: 'text-orange-600' },
];

// Map: tab id → incident type colour for the map pin
const TAB_PIN_TYPE = {
  hospitals:        'medical',
  ambulances:       'medical',
  'police-stations': 'crime',
  'fire-stations':  'fire',
};

export default function Resources() {
  const { user } = useAuth();
  const [tab, setTab] = useState('hospitals');
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);
  const [addModal, setAddModal] = useState(false);

  const isAdmin = user?.role === 'system_admin';

  async function load(t = tab) {
    setLoading(true);
    try {
      let items = [];
      if (t === 'hospitals') {
        const res = await listHospitals();
        items = res.data.data.hospitals ?? [];
      } else if (t === 'ambulances') {
        const res = await listAmbulances();
        items = res.data.data.ambulances ?? [];
      } else if (t === 'police-stations') {
        const res = await listPoliceStations();
        items = res.data.data.stations ?? [];
      } else {
        const res = await listFireStations();
        items = res.data.data.stations ?? [];
      }
      setData((prev) => ({ ...prev, [t]: items }));
    } catch {
      toast.error('Failed to load resources');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [tab]);

  const items = data[tab] ?? [];

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-xl p-1.5 shadow-sm border border-slate-100 overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon, color }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex-1 justify-center
              ${tab === id
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
          >
            <Icon className={tab === id ? 'text-white' : color} />
            {label}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-slate-500">{items.length} record{items.length !== 1 ? 's' : ''}</p>
        <div className="flex gap-2">
          <button onClick={() => load()} className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-white transition">
            <RiRefreshLine />
          </button>
          {isAdmin && (
            <button
              onClick={() => setAddModal(true)}
              className="flex items-center gap-1.5 bg-blue-600 text-white text-sm font-medium px-3 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              <RiAddLine /> Add
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <LoadingSpinner center />
        ) : items.length === 0 ? (
          <EmptyState message={`No ${tab.replace('-', ' ')} found`} />
        ) : (
          <div className="overflow-x-auto">
            {tab === 'hospitals'       && <HospitalsTable items={items} />}
            {tab === 'ambulances'      && <AmbulancesTable items={items} onRefresh={() => load()} />}
            {tab === 'police-stations' && <StationsTable items={items} label="Police Station" />}
            {tab === 'fire-stations'   && <StationsTable items={items} label="Fire Station" />}
          </div>
        )}
      </div>

      {/* Add modal — size lg to fit the map */}
      <Modal
        open={addModal}
        onClose={() => setAddModal(false)}
        title={`Add ${tab.replace(/-/g, ' ')}`}
        size="lg"
      >
        <AddForm
          tab={tab}
          pinType={TAB_PIN_TYPE[tab]}
          onSuccess={() => { setAddModal(false); load(); }}
          onClose={() => setAddModal(false)}
        />
      </Modal>
    </div>
  );
}

// ── Tables ────────────────────────────────────────────────────────────────────

function HospitalsTable({ items }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="bg-slate-50 text-slate-500 text-xs uppercase">
          <th className="text-left px-5 py-3 font-medium">Name</th>
          <th className="text-left px-5 py-3 font-medium hidden md:table-cell">Address</th>
          <th className="text-left px-5 py-3 font-medium">Beds</th>
          <th className="text-left px-5 py-3 font-medium">Status</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-50">
        {items.map((h) => (
          <tr key={h._id} className="hover:bg-slate-50">
            <td className="px-5 py-3 font-medium text-slate-800">{h.name}</td>
            <td className="px-5 py-3 text-slate-500 hidden md:table-cell">{h.address}</td>
            <td className="px-5 py-3">
              <span className="text-slate-700 font-medium">{h.availableBeds}</span>
              <span className="text-slate-400"> / {h.totalBeds}</span>
            </td>
            <td className="px-5 py-3"><Badge value={h.status ?? 'active'} /></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function AmbulancesTable({ items, onRefresh }) {
  const [drivers, setDrivers] = useState([]);
  const [target, setTarget] = useState(null);      // ambulance being (re)assigned
  const [selectedDriver, setSelectedDriver] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    listUsers()
      .then((res) => {
        const all = res.data?.data?.users ?? [];
        setDrivers(all.filter((u) => u.role === 'ambulance_driver'));
      })
      .catch(() => {}); // supplementary — silent failure
  }, []);

  function driverName(driverId) {
    if (!driverId) return null;
    const d = drivers.find((u) => u._id === String(driverId));
    return d?.name ?? null;
  }

  function openAssign(ambulance) {
    setTarget(ambulance);
    setSelectedDriver(String(ambulance.driverId ?? ''));
  }

  async function handleAssign() {
    setSaving(true);
    try {
      await assignAmbulanceDriver(target._id, selectedDriver || null);
      toast.success('Driver assignment updated');
      setTarget(null);
      onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.error?.message ?? 'Assignment failed');
    } finally {
      setSaving(false);
    }
  }

  const inputCls = 'w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white';

  return (
    <>
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 text-slate-500 text-xs uppercase">
            <th className="text-left px-5 py-3 font-medium">Vehicle #</th>
            <th className="text-left px-5 py-3 font-medium hidden md:table-cell">Hospital</th>
            <th className="text-left px-5 py-3 font-medium hidden lg:table-cell">Driver</th>
            <th className="text-left px-5 py-3 font-medium">Status</th>
            <th className="px-5 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {items.map((a) => {
            const name = driverName(a.driverId);
            return (
              <tr key={a._id} className="hover:bg-slate-50">
                <td className="px-5 py-3 font-medium text-slate-800">{a.vehicleNumber}</td>
                <td className="px-5 py-3 text-slate-500 hidden md:table-cell">{a.hospitalId?.name ?? '—'}</td>
                <td className="px-5 py-3 hidden lg:table-cell">
                  {name ? (
                    <span className="flex items-center gap-1.5 text-slate-700">
                      <RiUserLine className="text-slate-400 text-xs" />{name}
                    </span>
                  ) : (
                    <span className="text-slate-400 text-xs italic">Unassigned</span>
                  )}
                </td>
                <td className="px-5 py-3"><Badge value={a.status ?? 'available'} /></td>
                <td className="px-5 py-3 text-right">
                  <button
                    onClick={() => openAssign(a)}
                    className={`text-xs font-medium px-2.5 py-1 rounded-lg transition ${
                      name
                        ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    }`}
                  >
                    {name ? 'Reassign' : 'Assign'}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Driver assignment modal */}
      <Modal
        open={!!target}
        onClose={() => setTarget(null)}
        title={`${target?.driverId ? 'Reassign' : 'Assign'} Driver — ${target?.vehicleNumber ?? ''}`}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5 uppercase tracking-wide">
              Ambulance Driver
            </label>
            <select
              value={selectedDriver}
              onChange={(e) => setSelectedDriver(e.target.value)}
              className={inputCls}
            >
              <option value="">— Unassign / No Driver —</option>
              {drivers.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name}{d.isActive ? '' : ' (inactive)'}
                </option>
              ))}
            </select>
            {drivers.length === 0 && (
              <p className="text-xs text-slate-400 mt-1">
                No ambulance driver accounts found. Create one in Users first.
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setTarget(null)}
              className="flex-1 border border-slate-200 text-slate-600 text-sm font-medium py-2.5 rounded-lg hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleAssign}
              disabled={saving}
              className="flex-1 bg-blue-600 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-60 transition"
            >
              {saving ? 'Saving…' : 'Confirm'}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}

function StationsTable({ items }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="bg-slate-50 text-slate-500 text-xs uppercase">
          <th className="text-left px-5 py-3 font-medium">Name</th>
          <th className="text-left px-5 py-3 font-medium hidden md:table-cell">Address</th>
          <th className="text-left px-5 py-3 font-medium hidden md:table-cell">Region</th>
          <th className="text-left px-5 py-3 font-medium">Status</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-50">
        {items.map((s) => (
          <tr key={s._id} className="hover:bg-slate-50">
            <td className="px-5 py-3 font-medium text-slate-800">{s.name}</td>
            <td className="px-5 py-3 text-slate-500 hidden md:table-cell">{s.address}</td>
            <td className="px-5 py-3 text-slate-500 hidden md:table-cell">{s.region}</td>
            <td className="px-5 py-3"><Badge value={s.status ?? 'active'} /></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ── Add form ──────────────────────────────────────────────────────────────────

const EMPTY_FORM = { name: '', address: '', region: '', vehicleNumber: '', contactPhone: '',
  totalBeds: '', availableBeds: '', latitude: '', longitude: '' };

function AddForm({ tab, pinType, onSuccess, onClose }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [externalPin, setExternalPin] = useState(null);
  const [saving, setSaving] = useState(false);

  function f(k, v) { setForm((p) => ({ ...p, [k]: v })); }

  // Address search selected → fill address field + move map pin
  const handleAddressSelect = useCallback(({ lat, lng }) => {
    setForm((p) => ({ ...p, latitude: lat, longitude: lng }));
    setExternalPin({ lat, lng });
  }, []);

  // Map clicked → fill coordinates
  const handleMapSelect = useCallback(({ lat, lng }) => {
    setForm((p) => ({ ...p, latitude: lat, longitude: lng }));
  }, []);

  async function submit(e) {
    e.preventDefault();
    if (tab !== 'ambulances' && (!form.latitude || !form.longitude)) {
      toast.error('Pin a location on the map or search an address');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        longitude: parseFloat(form.longitude) || undefined,
        latitude:  parseFloat(form.latitude)  || undefined,
        ...(form.totalBeds     && { totalBeds:     parseInt(form.totalBeds) }),
        ...(form.availableBeds && { availableBeds: parseInt(form.availableBeds) }),
      };
      if (tab === 'hospitals')        await createHospital(payload);
      else if (tab === 'ambulances')  await createAmbulance(payload);
      else if (tab === 'police-stations') await createPoliceStation(payload);
      else                            await createFireStation(payload);
      toast.success('Created successfully');
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.error?.message ?? 'Failed to create');
    } finally {
      setSaving(false);
    }
  }

  const inputCls = 'w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white';
  const labelCls = 'block text-xs font-medium text-slate-600 mb-1';
  const showMap  = tab !== 'ambulances';

  return (
    <form onSubmit={submit} className="space-y-4">
      {/* Name */}
      {tab !== 'ambulances' && (
        <div>
          <label className={labelCls}>Name</label>
          <input
            required
            placeholder={tab === 'hospitals' ? 'e.g. Korle Bu Teaching Hospital' : 'Station name'}
            className={inputCls}
            value={form.name}
            onChange={(e) => f('name', e.target.value)}
          />
        </div>
      )}

      {/* Vehicle number (ambulances only) */}
      {tab === 'ambulances' && (
        <div>
          <label className={labelCls}>Vehicle Number</label>
          <input
            required
            placeholder="e.g. AMB-001"
            className={inputCls}
            value={form.vehicleNumber}
            onChange={(e) => f('vehicleNumber', e.target.value)}
          />
        </div>
      )}

      {/* Address search + map */}
      {showMap && (
        <>
          <div>
            <label className={labelCls}>Address — search or pin on map</label>
            <AddressSearch
              value={form.address}
              onChange={(v) => f('address', v)}
              onLocationSelect={handleAddressSelect}
              placeholder="Search location — e.g. Kaneshie Police Station, Accra"
            />
          </div>

          <IncidentMapPicker
            onLocationSelect={handleMapSelect}
            incidentType={pinType}
            externalPin={externalPin}
          />

          {form.latitude && (
            <p className="text-xs text-slate-400 -mt-2">
              Pinned: {parseFloat(form.latitude).toFixed(6)}, {parseFloat(form.longitude).toFixed(6)}
            </p>
          )}
        </>
      )}

      {/* Region (stations only) */}
      {(tab === 'police-stations' || tab === 'fire-stations') && (
        <div>
          <label className={labelCls}>Region</label>
          <input
            required
            placeholder="e.g. Greater Accra"
            className={inputCls}
            value={form.region}
            onChange={(e) => f('region', e.target.value)}
          />
        </div>
      )}

      {/* Hospital beds */}
      {tab === 'hospitals' && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Total Beds</label>
            <input required type="number" min="0" placeholder="200" className={inputCls}
              value={form.totalBeds} onChange={(e) => f('totalBeds', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Available Beds</label>
            <input required type="number" min="0" placeholder="45" className={inputCls}
              value={form.availableBeds} onChange={(e) => f('availableBeds', e.target.value)} />
          </div>
        </div>
      )}

      {/* Contact phone */}
      <div>
        <label className={labelCls}>Contact Phone</label>
        <input
          type="tel"
          placeholder="+233244000000"
          className={inputCls}
          value={form.contactPhone}
          onChange={(e) => f('contactPhone', e.target.value)}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onClose}
          className="flex-1 border border-slate-200 text-slate-600 text-sm font-medium py-2.5 rounded-lg hover:bg-slate-50 transition">
          Cancel
        </button>
        <button type="submit" disabled={saving}
          className="flex-1 bg-blue-600 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-60 transition">
          {saving ? 'Saving…' : 'Create'}
        </button>
      </div>
    </form>
  );
}
