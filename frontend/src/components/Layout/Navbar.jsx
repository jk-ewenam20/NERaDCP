import { RiAddLine, RiWifiLine, RiWifiOffLine } from 'react-icons/ri';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';

export default function Navbar({ title, onNewIncident }) {
  const { connected } = useSocket();
  const { user } = useAuth();

  return (
    <header className="bg-white border-b border-slate-100 px-6 py-3 flex items-center justify-between flex-shrink-0">
      <h1 className="text-lg font-semibold text-slate-800 pl-10 lg:pl-0">{title}</h1>

      <div className="flex items-center gap-3">
        {/* WebSocket status */}
        <div className={`hidden sm:flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full
          ${connected ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
          {connected
            ? <><RiWifiLine className="text-sm" /> Live</>
            : <><RiWifiOffLine className="text-sm" /> Offline</>}
        </div>

        <button
          onClick={onNewIncident}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors"
        >
          <RiAddLine className="text-base" />
          <span className="hidden sm:inline">New Incident</span>
        </button>
      </div>
    </header>
  );
}
