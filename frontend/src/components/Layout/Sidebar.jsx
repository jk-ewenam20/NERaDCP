import { NavLink } from 'react-router-dom';
import {
  RiDashboardLine, RiAlertLine, RiMapPinLine, RiBarChartLine,
  RiHospitalLine, RiShieldLine, RiLogoutBoxLine, RiMenu3Line, RiCloseLine,
  RiUserLine, RiArrowLeftSLine, RiArrowRightSLine,
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
  { to: '/profile',    icon: RiUserLine,      label: 'My Profile' },
];

export default function Sidebar({ collapsed = false, onToggle }) {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = NAV.filter((n) => !n.adminOnly || user?.role === 'system_admin');
  const initial = user?.name?.[0]?.toUpperCase() ?? '?';

  // ── Desktop sidebar inner ─────────────────────────────────────────────────
  const desktopInner = (
    <div className="flex flex-col h-full">

      {/* Brand */}
      <div className={`border-b border-slate-700 flex-shrink-0 transition-all duration-200 ${collapsed ? 'px-0 py-5' : 'px-6 py-5'}`}>
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-2.5'}`}>
          <div className="w-8 h-8 rounded-lg bg-red-500 flex items-center justify-center flex-shrink-0 shadow-sm">
            <RiAlertLine className="text-white text-lg" />
          </div>
          {!collapsed && (
            <span className="text-white font-semibold text-sm leading-tight whitespace-nowrap overflow-hidden">
              Emergency<br />Command Centre
            </span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className={`flex-1 py-4 space-y-0.5 overflow-hidden ${collapsed ? 'px-2' : 'px-3'}`}>
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              `flex items-center py-2.5 rounded-lg text-sm font-medium transition-colors
               ${collapsed ? 'justify-center px-0' : 'gap-3 px-3'}
               ${isActive
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'}`
            }
          >
            <Icon className="text-lg flex-shrink-0" />
            {!collapsed && <span className="whitespace-nowrap">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Bottom section: user info + logout + toggle */}
      <div className={`border-t border-slate-700 pt-3 pb-3 space-y-0.5 ${collapsed ? 'px-2' : 'px-3'}`}>
        {collapsed ? (
          <>
            {/* Collapsed: initials avatar */}
            <div className="flex justify-center py-1.5">
              <div
                title={user?.name}
                className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-200 text-sm font-bold select-none"
              >
                {initial}
              </div>
            </div>
            {/* Logout icon */}
            <button
              onClick={logout}
              title="Sign out"
              className="flex w-full justify-center p-2.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-colors"
            >
              <RiLogoutBoxLine className="text-lg" />
            </button>
          </>
        ) : (
          <>
            {/* Expanded: full user info */}
            <div className="px-3 py-2 mb-0.5">
              <p className="text-xs text-slate-500 font-medium">Signed in as</p>
              <p className="text-sm text-slate-200 font-semibold truncate">{user?.name}</p>
              <p className="text-xs text-slate-500 capitalize">{user?.role?.replace(/_/g, ' ')}</p>
            </div>
            <button
              onClick={logout}
              className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-colors"
            >
              <RiLogoutBoxLine className="text-lg" />
              <span className="whitespace-nowrap">Sign out</span>
            </button>
          </>
        )}

        {/* Collapse toggle */}
        <button
          onClick={onToggle}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={`flex w-full items-center p-2 rounded-lg text-slate-600 hover:text-slate-300 hover:bg-slate-800 transition-colors mt-1 ${collapsed ? 'justify-center' : 'justify-end px-3'}`}
        >
          {collapsed
            ? <RiArrowRightSLine className="text-xl" />
            : <RiArrowLeftSLine className="text-xl" />
          }
        </button>
      </div>
    </div>
  );

  // ── Mobile drawer inner ───────────────────────────────────────────────────
  const mobileInner = (
    <div className="flex flex-col h-full">
      <div className="px-6 py-5 border-b border-slate-700">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-red-500 flex items-center justify-center">
            <RiAlertLine className="text-white text-lg" />
          </div>
          <span className="text-white font-semibold text-sm leading-tight">
            Emergency<br />Command Centre
          </span>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={() => setMobileOpen(false)}
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
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <RiCloseLine className="text-xl" /> : <RiMenu3Line className="text-xl" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`lg:hidden fixed top-0 left-0 h-full w-64 bg-sidebar z-40 transform transition-transform duration-200
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {mobileInner}
      </aside>

      {/* Desktop sidebar — width transitions between collapsed/expanded */}
      <aside
        className={`hidden lg:flex flex-col bg-sidebar h-full flex-shrink-0 overflow-hidden
          transition-[width] duration-200 ease-in-out
          ${collapsed ? 'w-16' : 'w-64'}`}
      >
        {desktopInner}
      </aside>
    </>
  );
}
