import { useEffect, useState } from 'react';
import {
  RiRefreshLine, RiFilterLine,
  RiAlertLine, RiCheckboxCircleLine, RiCloseCircleLine,
} from 'react-icons/ri';
import Badge from '../components/UI/Badge';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import EmptyState from '../components/UI/EmptyState';
import Modal from '../components/UI/Modal';
import { listIncidents, updateIncidentStatus } from '../api/incident.api';
import toast from 'react-hot-toast';

const STATUSES = ['', 'created', 'dispatched', 'in_progress', 'resolved', 'cancelled'];
const TYPES = ['', 'medical', 'fire', 'crime', 'accident'];

export default function Incidents() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selected, setSelected] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const params = {};
      if (filterType) params.incidentType = filterType;
      if (filterStatus) params.status = filterStatus;
      const { data } = await listIncidents(params);
      const inc = data.data;
      setIncidents(Array.isArray(inc) ? inc : inc?.incidents ?? []);
    } catch {
      toast.error('Failed to load incidents');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [filterType, filterStatus]);

  async function handleStatusUpdate(id, status) {
    setUpdatingStatus(true);
    try {
      await updateIncidentStatus(id, status);
      toast.success('Status updated');
      setSelected(null);
      load();
    } catch {
      toast.error('Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  }

  const TYPE_DOT = {
    medical:  'bg-emerald-500',
    fire:     'bg-orange-500',
    crime:    'bg-blue-500',
    accident: 'bg-amber-500',
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <RiFilterLine className="text-slate-400" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All types</option>
            {TYPES.slice(1).map((t) => <option key={t} value={t} className="capitalize">{t}</option>)}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All statuses</option>
            {STATUSES.slice(1).map((s) => (
              <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
            ))}
          </select>
          <button onClick={load} className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-white transition">
            <RiRefreshLine />
          </button>
        </div>
        {/* New Incident is now available via the Navbar button on any page */}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <LoadingSpinner center />
        ) : incidents.length === 0 ? (
          <EmptyState message="No incidents found" icon={RiAlertLine} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase">
                  <th className="text-left px-5 py-3 font-medium">Type</th>
                  <th className="text-left px-5 py-3 font-medium">Caller</th>
                  <th className="text-left px-5 py-3 font-medium">Status</th>
                  <th className="text-left px-5 py-3 font-medium hidden md:table-cell">Assigned Unit</th>
                  <th className="text-left px-5 py-3 font-medium hidden lg:table-cell">Address</th>
                  <th className="text-left px-5 py-3 font-medium hidden lg:table-cell">Created</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {incidents.map((inc) => (
                  <tr key={inc._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${TYPE_DOT[inc.incidentType] ?? 'bg-slate-400'}`} />
                        <Badge value={inc.incidentType} kind="type" />
                      </div>
                    </td>
                    <td className="px-5 py-3 font-medium text-slate-800">{inc.citizenName}</td>
                    <td className="px-5 py-3"><Badge value={inc.status} /></td>
                    <td className="px-5 py-3 text-slate-500 hidden md:table-cell">
                      {inc.assignedUnit?.unitName ?? '—'}
                    </td>
                    <td className="px-5 py-3 text-slate-500 hidden lg:table-cell max-w-[180px] truncate">
                      {inc.address}
                    </td>
                    <td className="px-5 py-3 text-slate-400 hidden lg:table-cell whitespace-nowrap">
                      {new Date(inc.createdAt).toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => setSelected(inc)}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium px-2 py-1 rounded hover:bg-blue-50 transition"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail / status modal */}
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title="Incident Details"
        size="md"
      >
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-slate-500">Caller</p>
                <p className="font-medium text-slate-800">{selected.citizenName}</p>
              </div>
              <div>
                <p className="text-slate-500">Phone</p>
                <p className="font-medium text-slate-800">{selected.citizenPhone}</p>
              </div>
              <div>
                <p className="text-slate-500">Type</p>
                <Badge value={selected.incidentType} kind="type" />
              </div>
              <div>
                <p className="text-slate-500">Status</p>
                <Badge value={selected.status} />
              </div>
              <div className="col-span-2">
                <p className="text-slate-500">Address</p>
                <p className="font-medium text-slate-800">{selected.address}</p>
              </div>
              {selected.assignedUnit && (
                <div className="col-span-2">
                  <p className="text-slate-500">Assigned Unit</p>
                  <p className="font-medium text-slate-800">{selected.assignedUnit.unitName}</p>
                </div>
              )}
              {selected.notes && (
                <div className="col-span-2">
                  <p className="text-slate-500">Notes</p>
                  <p className="text-slate-700 text-sm">{selected.notes}</p>
                </div>
              )}
            </div>

            {/* Status actions */}
            {!['resolved', 'cancelled'].includes(selected.status) && (
              <div className="border-t border-slate-100 pt-4">
                <p className="text-xs text-slate-500 font-medium uppercase mb-2">Update Status</p>
                <div className="flex flex-wrap gap-2">
                  {selected.status !== 'in_progress' && (
                    <button
                      onClick={() => handleStatusUpdate(selected._id, 'in_progress')}
                      disabled={updatingStatus}
                      className="flex items-center gap-1.5 text-sm bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-lg hover:bg-amber-100 transition disabled:opacity-60"
                    >
                      <RiAlertLine /> Mark In Progress
                    </button>
                  )}
                  <button
                    onClick={() => handleStatusUpdate(selected._id, 'resolved')}
                    disabled={updatingStatus}
                    className="flex items-center gap-1.5 text-sm bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition disabled:opacity-60"
                  >
                    <RiCheckboxCircleLine /> Resolve
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(selected._id, 'cancelled')}
                    disabled={updatingStatus}
                    className="flex items-center gap-1.5 text-sm bg-red-50 text-red-700 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-100 transition disabled:opacity-60"
                  >
                    <RiCloseCircleLine /> Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
