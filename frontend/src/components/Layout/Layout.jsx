import { useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import NewIncidentModal from '../NewIncidentModal';
import { useAuth } from '../../contexts/AuthContext';

const PAGE_TITLES = {
  '/':           'Dashboard',
  '/incidents':  'Incidents',
  '/live-map':   'Live Map',
  '/analytics':  'Analytics',
  '/resources':  'Resources',
  '/users':      'Users',
};

export default function Layout() {
  const { user } = useAuth();
  const location = useLocation();
  const [incidentModalOpen, setIncidentModalOpen] = useState(false);

  if (!user) return <Navigate to="/login" replace />;

  const title = PAGE_TITLES[location.pathname] ?? 'Emergency Command Centre';

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Navbar title={title} onNewIncident={() => setIncidentModalOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>

      <NewIncidentModal
        open={incidentModalOpen}
        onClose={() => setIncidentModalOpen(false)}
        onSuccess={() => setIncidentModalOpen(false)}
      />
    </div>
  );
}
