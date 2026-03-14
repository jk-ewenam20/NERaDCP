import { useState } from 'react';
import {
  RiUserLine, RiMailLine, RiShieldLine, RiHospitalLine,
  RiFireLine, RiCarLine, RiEditLine, RiLockPasswordLine,
  RiCheckLine, RiCloseLine,
} from 'react-icons/ri';
import { useAuth } from '../contexts/AuthContext';
import { updateProfile, changePassword } from '../api/auth.api';
import toast from 'react-hot-toast';

const ROLE_META = {
  system_admin:    { label: 'System Administrator', icon: RiShieldLine,   color: 'text-slate-600',   bg: 'bg-slate-100' },
  hospital_admin:  { label: 'Hospital Administrator', icon: RiHospitalLine, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  police_admin:    { label: 'Police Administrator',  icon: RiShieldLine,   color: 'text-blue-600',    bg: 'bg-blue-50' },
  fire_admin:      { label: 'Fire Service Administrator', icon: RiFireLine, color: 'text-orange-600', bg: 'bg-orange-50' },
  ambulance_driver:{ label: 'Ambulance Driver',      icon: RiCarLine,      color: 'text-amber-600',   bg: 'bg-amber-50' },
};

const ORG_TYPE_LABEL = {
  hospital:       'Hospital',
  police_station: 'Police Station',
  fire_station:   'Fire Station',
};

export default function Profile() {
  const { user, login } = useAuth();
  const meta = ROLE_META[user?.role] ?? ROLE_META.system_admin;
  const RoleIcon = meta.icon;

  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(user?.name ?? '');
  const [savingName, setSavingName] = useState(false);

  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [savingPw, setSavingPw] = useState(false);
  const [showPwForm, setShowPwForm] = useState(false);

  async function handleSaveName(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setSavingName(true);
    try {
      await updateProfile({ name: name.trim() });
      // Refresh stored user
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      stored.name = name.trim();
      localStorage.setItem('user', JSON.stringify(stored));
      window.location.reload(); // simplest way to refresh AuthContext user
    } catch (err) {
      toast.error(err.response?.data?.error?.message ?? 'Failed to update name');
    } finally {
      setSavingName(false);
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    if (pwForm.next !== pwForm.confirm) {
      toast.error('New passwords do not match');
      return;
    }
    if (pwForm.next.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }
    setSavingPw(true);
    try {
      await changePassword(pwForm.current, pwForm.next);
      toast.success('Password changed successfully');
      setShowPwForm(false);
      setPwForm({ current: '', next: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.error?.message ?? 'Failed to change password');
    } finally {
      setSavingPw(false);
    }
  }

  const inputCls = 'w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white';

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header card */}
      <div className={`rounded-2xl border p-6 flex items-center gap-5 ${meta.bg} border-slate-200`}>
        <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center flex-shrink-0">
          <RoleIcon className={`text-3xl ${meta.color}`} />
        </div>
        <div className="min-w-0">
          <p className={`text-xs font-semibold uppercase tracking-wider mb-0.5 ${meta.color}`}>
            {meta.label}
          </p>
          <h1 className="text-2xl font-bold text-slate-800 truncate">{user?.name}</h1>
          <p className="text-sm text-slate-500 truncate">{user?.email}</p>
        </div>
      </div>

      {/* Info grid */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm divide-y divide-slate-50">

        {/* Name row */}
        <div className="px-6 py-4 flex items-center gap-4">
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
            <RiUserLine className="text-slate-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-0.5">Full Name</p>
            {editingName ? (
              <form onSubmit={handleSaveName} className="flex items-center gap-2 mt-1">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                <button type="submit" disabled={savingName}
                  className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition">
                  <RiCheckLine />
                </button>
                <button type="button" onClick={() => { setEditingName(false); setName(user?.name ?? ''); }}
                  className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition">
                  <RiCloseLine />
                </button>
              </form>
            ) : (
              <p className="text-sm font-semibold text-slate-800">{user?.name}</p>
            )}
          </div>
          {!editingName && (
            <button onClick={() => setEditingName(true)}
              className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium px-2.5 py-1.5 rounded-lg hover:bg-blue-50 transition">
              <RiEditLine /> Edit
            </button>
          )}
        </div>

        {/* Email row */}
        <div className="px-6 py-4 flex items-center gap-4">
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
            <RiMailLine className="text-slate-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-0.5">Email</p>
            <p className="text-sm font-semibold text-slate-800">{user?.email}</p>
          </div>
          <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">read-only</span>
        </div>

        {/* Role row */}
        <div className="px-6 py-4 flex items-center gap-4">
          <div className={`w-8 h-8 rounded-lg ${meta.bg} flex items-center justify-center flex-shrink-0`}>
            <RoleIcon className={`text-sm ${meta.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-0.5">Role</p>
            <p className="text-sm font-semibold text-slate-800">{meta.label}</p>
          </div>
        </div>

        {/* Organization row — only for org-linked admins */}
        {user?.organizationType && (
          <div className="px-6 py-4 flex items-center gap-4">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
              <RiHospitalLine className="text-slate-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-0.5">
                Organization Type
              </p>
              <p className="text-sm font-semibold text-slate-800">
                {ORG_TYPE_LABEL[user.organizationType] ?? user.organizationType}
              </p>
            </div>
          </div>
        )}

        {/* Account status */}
        <div className="px-6 py-4 flex items-center gap-4">
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
            <RiCheckLine className="text-slate-500" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-0.5">Account Status</p>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
            </span>
          </div>
        </div>
      </div>

      {/* Change password section */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
              <RiLockPasswordLine className="text-slate-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">Password</p>
              <p className="text-xs text-slate-400">Update your account password</p>
            </div>
          </div>
          <button
            onClick={() => setShowPwForm(!showPwForm)}
            className="text-xs font-medium text-blue-600 hover:text-blue-700 px-2.5 py-1.5 rounded-lg hover:bg-blue-50 transition"
          >
            {showPwForm ? 'Cancel' : 'Change'}
          </button>
        </div>

        {showPwForm && (
          <form onSubmit={handleChangePassword} className="px-6 pb-6 space-y-3 border-t border-slate-50 pt-4">
            <input
              type="password"
              placeholder="Current password"
              required
              value={pwForm.current}
              onChange={(e) => setPwForm((p) => ({ ...p, current: e.target.value }))}
              className={inputCls}
            />
            <input
              type="password"
              placeholder="New password (min 8 characters)"
              required
              value={pwForm.next}
              onChange={(e) => setPwForm((p) => ({ ...p, next: e.target.value }))}
              className={inputCls}
            />
            <input
              type="password"
              placeholder="Confirm new password"
              required
              value={pwForm.confirm}
              onChange={(e) => setPwForm((p) => ({ ...p, confirm: e.target.value }))}
              className={inputCls}
            />
            <button
              type="submit"
              disabled={savingPw}
              className="w-full bg-blue-600 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-60 transition"
            >
              {savingPw ? 'Saving…' : 'Update Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
