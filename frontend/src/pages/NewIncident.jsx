import { useState, useCallback } from 'react';
import {
  RiUserLine, RiPhoneLine, RiAlertLine, RiFileTextLine, RiSendPlane2Line,
  RiLockLine,
} from 'react-icons/ri';
import IncidentMapPicker from '../components/Map/IncidentMapPicker';
import AddressSearch from '../components/Map/AddressSearch';
import { createIncident } from '../api/incident.api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const TYPES = [
  { value: 'medical',  label: 'Medical',       color: 'border-emerald-400 bg-emerald-50 text-emerald-700' },
  { value: 'fire',     label: 'Fire',          color: 'border-orange-400 bg-orange-50 text-orange-700' },
  { value: 'crime',    label: 'Crime',         color: 'border-blue-400 bg-blue-50 text-blue-700' },
  { value: 'accident', label: 'Road Accident', color: 'border-amber-400 bg-amber-50 text-amber-700' },
];

// Forced incident type per non-admin role (mirrors the backend enforcement)
const ROLE_FORCED_TYPE = {
  hospital_admin:   'medical',
  ambulance_driver: 'medical',
  police_admin:     'crime',
  fire_admin:       'fire',
};

function makeEmpty(forcedType) {
  return {
    citizenName: '', citizenPhone: '',
    incidentType: forcedType ?? 'medical',
    address: '', notes: '', latitude: '', longitude: '',
  };
}

// Accepts optional onClose / onSuccess for modal usage.
export default function NewIncident({ onClose, onSuccess }) {
  const { user } = useAuth();
  const forcedType = ROLE_FORCED_TYPE[user?.role] ?? null;
  const [form, setForm] = useState(() => makeEmpty(forcedType));
  const [submitting, setSubmitting] = useState(false);
  // Passed down to IncidentMapPicker to control the pinned marker externally
  const [externalPin, setExternalPin] = useState(null);

  function set(field, value) {
    setForm((p) => ({ ...p, [field]: value }));
  }

  // Called when user clicks the map
  const handleMapSelect = useCallback(({ lat, lng }) => {
    setForm((p) => ({ ...p, latitude: lat, longitude: lng }));
  }, []);

  // Called when user picks an address from the autocomplete dropdown
  const handleAddressSelect = useCallback(({ lat, lng }) => {
    setForm((p) => ({ ...p, latitude: lat, longitude: lng }));
    setExternalPin({ lat, lng }); // move map marker to match
  }, []);

  function handleCancel() {
    if (onClose) onClose();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.latitude || !form.longitude) {
      toast.error('Select the incident location on the map or search an address');
      return;
    }
    setSubmitting(true);
    try {
      await createIncident({
        ...form,
        latitude: parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),
      });
      toast.success('Incident recorded — responder dispatched!');
      setForm(makeEmpty(forcedType));
      setExternalPin(null);
      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch (err) {
      toast.error(err.response?.data?.error?.message ?? 'Failed to create incident');
    } finally {
      setSubmitting(false);
    }
  }

  const inputCls = 'w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white';
  const labelCls = 'block text-sm font-medium text-slate-700 mb-1.5';

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Incident type */}
      <div>
        <label className={labelCls}>
          Incident Type
          {forcedType && (
            <span className="ml-2 inline-flex items-center gap-1 text-xs font-normal text-slate-400">
              <RiLockLine className="text-xs" /> fixed to your role
            </span>
          )}
        </label>
        {forcedType ? (
          // Non-admin: show the locked type as a single highlighted pill
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {TYPES.map(({ value, label, color }) => (
              <div
                key={value}
                className={`border-2 rounded-xl px-3 py-2.5 text-xs font-semibold text-center
                  ${value === forcedType
                    ? `${color} shadow-sm`
                    : 'border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed'}`}
              >
                {label}
              </div>
            ))}
          </div>
        ) : (
          // system_admin: all types selectable
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {TYPES.map(({ value, label, color }) => (
              <button
                key={value}
                type="button"
                onClick={() => set('incidentType', value)}
                className={`border-2 rounded-xl px-3 py-2.5 text-xs font-semibold text-center transition-all
                  ${form.incidentType === value
                    ? `${color} shadow-sm scale-[1.02]`
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Address search — updates map pin automatically */}
      <div>
        <label className={labelCls}>Street Address</label>
        <AddressSearch
          value={form.address}
          onChange={(v) => set('address', v)}
          onLocationSelect={handleAddressSelect}
          placeholder="Search a location — e.g. Korle Bu Hospital, Accra"
        />
      </div>

      {/* Map */}
      <div>
        <label className={labelCls + ' text-slate-500 text-xs font-normal'}>
          Or click the map to pin the exact location
        </label>
        <IncidentMapPicker
          onLocationSelect={handleMapSelect}
          incidentType={form.incidentType}
          externalPin={externalPin}
        />
        {form.latitude && (
          <p className="text-xs text-slate-400 mt-1">
            {parseFloat(form.latitude).toFixed(6)}, {parseFloat(form.longitude).toFixed(6)}
          </p>
        )}
      </div>

      {/* Caller info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Caller Name</label>
          <div className="relative">
            <RiUserLine className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
            <input
              type="text"
              required
              value={form.citizenName}
              onChange={(e) => set('citizenName', e.target.value)}
              placeholder="Ama Owusu"
              className={inputCls}
            />
          </div>
        </div>
        <div>
          <label className={labelCls}>Phone Number</label>
          <div className="relative">
            <RiPhoneLine className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
            <input
              type="tel"
              required
              value={form.citizenPhone}
              onChange={(e) => set('citizenPhone', e.target.value)}
              placeholder="+233244123456"
              className={inputCls}
            />
          </div>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className={labelCls}>Situation Notes</label>
        <div className="relative">
          <RiFileTextLine className="absolute left-3 top-3.5 text-slate-400 text-lg" />
          <textarea
            rows={3}
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            placeholder="Describe the situation, number of casualties, hazards…"
            className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white resize-none"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        {onClose && (
          <button
            type="button"
            onClick={handleCancel}
            className="flex-1 border border-slate-200 text-slate-600 font-medium py-3 rounded-xl text-sm hover:bg-slate-50 transition"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl text-sm transition-colors"
        >
          <RiSendPlane2Line />
          {submitting ? 'Dispatching…' : 'Record & Dispatch'}
        </button>
      </div>
    </form>
  );
}
