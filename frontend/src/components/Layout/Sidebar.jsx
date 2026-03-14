import { NavLink } from 'react-router-dom';
import {
  RiDashboardLine, RiAlertLine, RiMapPinLine, RiBarChartLine,
  RiHospitalLine, RiShieldLine, RiLogoutBoxLine, RiMenu3Line, RiCloseLine,
} from 'react-icons/ri';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const NAV = [
  { to: '/',           icon: RiDashboardLine, label: 'Dashboard' },
  { to: '/incidents',  icon: RiAlertLine,     label: 'Incidents',  adminOnly: true },
  { to: '/live-map',   icon: RiMapPinLine,    label: 'Live Map' },
  { to: '/analytics',  icon: RiBarChartLine,  label: 'Analytics',  adminOnly: true },
  { to: '/resources',  icon: RiHospitalLine,  label: 'Resources' },
  { to: '/users',      icon: RiShieldLine,    label: 'Users',      adminOnly: true },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const links = NAV.filter((n) => !n.adminOnly || user?.role === 'system_admin');

  const inner = (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="px-6 py-5 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-red-500 flex items-center justify-center">
            <RiAlertLine className="text-white text-lg" />
          </div>
          <span className="text-white font-semibold text-sm leading-tight">
            Emergency<br />Command Centre
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
               ${isActive
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'}`
            }
          >
            <Icon className="text-lg flex-shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User + Logout */}
      <div className="px-3 pb-4 border-t border-slate-700 pt-3">
        <div className="px-3 py-2 mb-1">
          <p className="text-xs text-slate-500 font-medium">Signed in as</p>
          <p className="text-sm text-slate-200 font-semibold truncate">{user?.name}</p>
          <p className="text-xs text-slate-500 capitalize">{user?.role?.replace(/_/g, ' ')}</p>
        </div>
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-colors"
        >
          <RiLogoutBoxLine className="text-lg" />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 bg-sidebar p-2 rounded-lg text-white shadow-md"
        onClick={() => setOpen(!open)}
      >
        {open ? <RiCloseLine className="text-xl" /> : <RiMenu3Line className="text-xl" />}
      </button>

      {/* Mobile overlay */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`lg:hidden fixed top-0 left-0 h-full w-64 bg-sidebar z-40 transform transition-transform duration-200
          ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {inner}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-sidebar h-full flex-shrink-0">
        {inner}
      </aside>
    </>
  );
}
