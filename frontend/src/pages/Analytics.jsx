import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts';
import {
  RiTimeLine, RiBarChartLine, RiPieChartLine, RiHospitalLine,
} from 'react-icons/ri';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import StatCard from '../components/UI/StatCard';
import {
  getOverview, getResponseTimes, getIncidentsByType,
  getResourceUtilization, getTopResponders,
} from '../api/analytics.api';
import toast from 'react-hot-toast';

const TYPE_COLORS = {
  medical:  '#059669',
  fire:     '#ea580c',
  crime:    '#2563eb',
  accident: '#d97706',
};
const PIE_COLORS = ['#059669', '#ea580c', '#2563eb', '#d97706', '#7c3aed'];

export default function Analytics() {
  const [overview, setOverview] = useState(null);
  const [responseTimes, setResponseTimes] = useState([]);
  const [byType, setByType] = useState([]);
  const [utilization, setUtilization] = useState(null);
  const [topResponders, setTopResponders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [ovRes, rtRes, typeRes, utilRes, topRes] = await Promise.allSettled([
          getOverview(),
          getResponseTimes({ periodType: 'month' }),
          getIncidentsByType(),
          getResourceUtilization(),
          getTopResponders(),
        ]);

        if (ovRes.status === 'fulfilled') setOverview(ovRes.value.data.data);
        if (rtRes.status === 'fulfilled') setResponseTimes(rtRes.value.data.data?.periods ?? []);
        if (typeRes.status === 'fulfilled') {
          const raw = typeRes.value.data.data;
          const arr = Array.isArray(raw)
            ? raw
            : Object.entries(raw ?? {}).map(([name, count]) => ({ name, count }));
          setByType(arr);
        }
        if (utilRes.status === 'fulfilled') setUtilization(utilRes.value.data.data);
        if (topRes.status === 'fulfilled') setTopResponders(topRes.value.data.data ?? []);
      } catch {
        toast.error('Failed to load analytics');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Build pie data from overview
  const pieData = overview?.incidentsByType
    ? Object.entries(overview.incidentsByType).map(([name, value]) => ({ name, value }))
    : byType.map((d) => ({ name: d.name ?? d.incidentType, value: d.count ?? d.total }));

  // Response times chart
  const rtData = responseTimes.map((p) => ({
    period: p.period,
    avgMin: parseFloat((p.avgResponseTimeMinutes ?? 0).toFixed(1)),
    total: p.totalIncidents,
  }));

  if (loading) return <LoadingSpinner center />;

  return (
    <div className="space-y-6">
      {/* Overview stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={RiBarChartLine} label="Total Incidents" value={overview?.totalIncidents} color="text-blue-600" bg="bg-blue-50" />
        <StatCard icon={RiTimeLine} label="Avg Response (min)" value={overview?.avgResponseTimeMinutes?.toFixed(1)} color="text-amber-600" bg="bg-amber-50" />
        <StatCard icon={RiPieChartLine} label="Open Incidents" value={overview?.openIncidents} color="text-red-600" bg="bg-red-50" />
        <StatCard icon={RiHospitalLine} label="Resolved Today" value={overview?.resolvedToday} color="text-emerald-600" bg="bg-emerald-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Response times line chart */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <RiTimeLine className="text-amber-500" />
            Avg Response Time by Month
          </h3>
          {rtData.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-10">No data available</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={rtData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
                  formatter={(v) => [`${v} min`, 'Avg Response']}
                />
                <Line
                  type="monotone"
                  dataKey="avgMin"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={{ fill: '#f59e0b', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Incident type pie */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <RiPieChartLine className="text-blue-500" />
            Incidents by Type
          </h3>
          {pieData.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-10">No data available</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, i) => (
                    <Cell
                      key={entry.name}
                      fill={TYPE_COLORS[entry.name] ?? PIE_COLORS[i % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
                />
                <Legend
                  formatter={(v) => <span style={{ fontSize: 12, textTransform: 'capitalize' }}>{v}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Hospital resource utilization */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 lg:col-span-2">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <RiHospitalLine className="text-emerald-500" />
            Hospital Bed Utilization
          </h3>
          {!utilization?.hospitals?.length ? (
            <p className="text-sm text-slate-400 text-center py-10">No utilization data available</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={utilization.hospitals} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={160}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
                  formatter={(v) => [`${v.toFixed(1)}%`, 'Occupancy']}
                />
                <Bar dataKey="occupancyPercent" fill="#059669" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top responders */}
        {topResponders.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 lg:col-span-2">
            <h3 className="font-semibold text-slate-800 mb-4">Top Responders</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs uppercase">
                    <th className="text-left px-4 py-2 font-medium">Unit</th>
                    <th className="text-left px-4 py-2 font-medium">Type</th>
                    <th className="text-right px-4 py-2 font-medium">Dispatches</th>
                    <th className="text-right px-4 py-2 font-medium">Avg Response</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {topResponders.slice(0, 8).map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-4 py-2.5 font-medium text-slate-800">{r.unitName ?? r.unitId}</td>
                      <td className="px-4 py-2.5 capitalize text-slate-500">{r.unitType}</td>
                      <td className="px-4 py-2.5 text-right text-slate-700">{r.totalDispatches}</td>
                      <td className="px-4 py-2.5 text-right text-slate-500">
                        {r.avgResponseMinutes ? `${r.avgResponseMinutes.toFixed(1)} min` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
