import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import {
  RiUserLine,
  RiAddLine,
  RiRefreshLine,
  RiCheckboxCircleLine,
  RiCloseCircleLine,
  RiDeleteBinLine,
  RiEditLine,
} from "react-icons/ri";
import Badge from "../components/UI/Badge";
import LoadingSpinner from "../components/UI/LoadingSpinner";
import EmptyState from "../components/UI/EmptyState";
import Modal from "../components/UI/Modal";
import {
  listUsers,
  updateUserStatus,
  updateUser,
  deleteUser,
  register,
} from "../api/auth.api";
import {
  listHospitals,
  listPoliceStations,
  listFireStations,
  listAmbulances,
  assignAmbulanceDriver,
} from "../api/resources.api";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";

const ROLES = [
  "system_admin",
  "hospital_admin",
  "ambulance_driver",
  "police_admin",
  "fire_admin",
  "dispatcher",
];

export default function Users() {
  // All hooks must come before any conditional return
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addModal, setAddModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const { data } = await listUsers();
      // Backend returns: { success, data: { users: [], total, page, totalPages } }
      setUsers(data.data.users ?? []);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Only fetch when the role is confirmed — avoids a wasted request before redirect
    if (user?.role === "system_admin") load();
  }, [user?.role]);

  // Guard AFTER all hooks
  if (user?.role !== "system_admin") return <Navigate to="/" replace />;

  async function toggleStatus(id, current) {
    try {
      await updateUserStatus(id, !current);
      toast.success("User status updated");
      load();
    } catch {
      toast.error("Failed to update user");
    }
  }

  async function handleDelete(id, name) {
    if (!window.confirm(`Delete user "${name}"? This cannot be undone.`))
      return;
    try {
      await deleteUser(id);
      toast.success("User deleted");
      load();
    } catch {
      toast.error("Failed to delete user");
    }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-slate-500">
          {users.length} user{users.length !== 1 ? "s" : ""}
        </p>
        <div className="flex gap-2">
          <button
            onClick={load}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-white transition"
          >
            <RiRefreshLine />
          </button>
          <button
            onClick={() => setAddModal(true)}
            className="flex items-center gap-1.5 bg-blue-600 text-white text-sm font-medium px-3 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            <RiAddLine /> Add User
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <LoadingSpinner center />
        ) : users.length === 0 ? (
          <EmptyState message="No users found" icon={RiUserLine} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase">
                  <th className="text-left px-5 py-3 font-medium">Name</th>
                  <th className="text-left px-5 py-3 font-medium hidden md:table-cell">
                    Email
                  </th>
                  <th className="text-left px-5 py-3 font-medium">Role</th>
                  <th className="text-left px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users.map((u) => (
                  <tr
                    key={u._id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-5 py-3 font-medium text-slate-800">
                      {u.name}
                    </td>
                    <td className="px-5 py-3 text-slate-500 hidden md:table-cell">
                      {u.email}
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full capitalize">
                        {u.role?.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <Badge value={u.isActive ? "active" : "inactive"} />
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setEditTarget(u)}
                          title="Edit"
                          className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition"
                        >
                          <RiEditLine className="text-base" />
                        </button>
                        <button
                          onClick={() => toggleStatus(u._id, u.isActive)}
                          title={u.isActive ? "Deactivate" : "Activate"}
                          className={`p-1.5 rounded-lg transition ${
                            u.isActive
                              ? "text-amber-500 hover:bg-amber-50"
                              : "text-emerald-600 hover:bg-emerald-50"
                          }`}
                        >
                          {u.isActive ? (
                            <RiCloseCircleLine className="text-base" />
                          ) : (
                            <RiCheckboxCircleLine className="text-base" />
                          )}
                        </button>
                        {u._id !== user._id && (
                          <button
                            onClick={() => handleDelete(u._id, u.name)}
                            title="Delete"
                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          >
                            <RiDeleteBinLine className="text-base" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add user modal */}
      <Modal
        open={addModal}
        onClose={() => setAddModal(false)}
        title="Create New User"
      >
        <AddUserForm
          onSuccess={() => {
            setAddModal(false);
            load();
          }}
        />
      </Modal>

      {/* Edit user modal */}
      <Modal
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        title={`Edit User — ${editTarget?.name ?? ''}`}
      >
        <EditUserForm
          target={editTarget}
          onSuccess={() => { setEditTarget(null); load(); }}
          onClose={() => setEditTarget(null)}
        />
      </Modal>
    </div>
  );
}

function EditUserForm({ target, onSuccess, onClose }) {
  const [form, setForm] = useState({ name: target?.name ?? '', email: target?.email ?? '' });
  const [saving, setSaving] = useState(false);

  // Keep form in sync if target changes
  useEffect(() => {
    if (target) setForm({ name: target.name ?? '', email: target.email ?? '' });
  }, [target?._id]);

  const inputCls =
    "w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white";

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateUser(target._id, { name: form.name, email: form.email });
      toast.success("User updated");
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.error?.message ?? "Failed to update user");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1 uppercase tracking-wide">Full Name</label>
        <input
          required
          value={form.name}
          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          className={inputCls}
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1 uppercase tracking-wide">Email</label>
        <input
          required
          type="email"
          value={form.email}
          onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
          className={inputCls}
        />
      </div>
      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onClose}
          className="flex-1 border border-slate-200 text-slate-600 text-sm font-medium py-2.5 rounded-lg hover:bg-slate-50 transition">
          Cancel
        </button>
        <button type="submit" disabled={saving}
          className="flex-1 bg-blue-600 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-60 transition">
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}

// Role → { orgType, label, fetcher, dataKey }
const ROLE_ORG = {
  hospital_admin: { orgType: "hospital",      label: "Hospital",       fetcher: listHospitals,      dataKey: "hospitals" },
  police_admin:   { orgType: "police_station", label: "Police Station", fetcher: listPoliceStations, dataKey: "stations"  },
  fire_admin:     { orgType: "fire_station",   label: "Fire Station",   fetcher: listFireStations,   dataKey: "stations"  },
};

function AddUserForm({ onSuccess }) {
  const [form, setForm] = useState({
    name: "", email: "", password: "", role: "dispatcher",
    organizationId: "", ambulanceId: "",
  });
  const [saving, setSaving] = useState(false);
  const [orgs, setOrgs] = useState([]);
  const [ambulances, setAmbulances] = useState([]);
  const [loadingOrgs, setLoadingOrgs] = useState(false);
  const [loadingAmb, setLoadingAmb] = useState(false);

  const orgConfig = ROLE_ORG[form.role] ?? null;
  const isDriver  = form.role === "ambulance_driver";

  // Load org list when role switches to an org-linked admin role
  useEffect(() => {
    if (!orgConfig) { setOrgs([]); return; }
    setOrgs([]);
    setLoadingOrgs(true);
    orgConfig.fetcher()
      .then((res) => setOrgs(res.data?.data?.[orgConfig.dataKey] ?? []))
      .catch(() => toast.error(`Failed to load ${orgConfig.label.toLowerCase()}s`))
      .finally(() => setLoadingOrgs(false));
  }, [form.role]);

  // Load unassigned ambulances when role is ambulance_driver
  useEffect(() => {
    if (!isDriver) { setAmbulances([]); return; }
    setLoadingAmb(true);
    listAmbulances()
      .then((res) => {
        const all = res.data?.data?.ambulances ?? [];
        setAmbulances(all.filter((a) => !a.driverId));
      })
      .catch(() => toast.error("Failed to load ambulances"))
      .finally(() => setLoadingAmb(false));
  }, [form.role]);

  function f(k, v) {
    setForm((p) => {
      const next = { ...p, [k]: v };
      if (k === "role") { next.organizationId = ""; next.ambulanceId = ""; }
      return next;
    });
  }

  async function submit(e) {
    e.preventDefault();
    if (orgConfig && !form.organizationId) {
      toast.error(`Please select a ${orgConfig.label}`);
      return;
    }
    setSaving(true);
    try {
      const res = await register({
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        organizationId:   orgConfig ? form.organizationId : undefined,
        organizationType: orgConfig ? orgConfig.orgType    : undefined,
      });

      // Link ambulance to the newly created driver if one was selected
      const newUserId = res.data?.data?.user?._id;
      if (isDriver && form.ambulanceId && newUserId) {
        try {
          await assignAmbulanceDriver(form.ambulanceId, newUserId);
        } catch {
          toast.error("User created, but ambulance assignment failed — use the Reassign button in Resources.");
        }
      }

      toast.success("User created");
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.error?.message ?? "Failed to create user");
    } finally {
      setSaving(false);
    }
  }

  const inputCls =
    "w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white";

  return (
    <form onSubmit={submit} className="space-y-3">
      <input
        required placeholder="Full Name"
        value={form.name} onChange={(e) => f("name", e.target.value)}
        className={inputCls}
      />
      <input
        required type="email" placeholder="Email"
        value={form.email} onChange={(e) => f("email", e.target.value)}
        className={inputCls}
      />
      <input
        required type="password" placeholder="Password"
        value={form.password} onChange={(e) => f("password", e.target.value)}
        className={inputCls}
      />
      <select
        value={form.role} onChange={(e) => f("role", e.target.value)}
        className={inputCls}
      >
        {ROLES.map((r) => (
          <option key={r} value={r}>{r.replace(/_/g, " ")}</option>
        ))}
      </select>

      {/* Org picker — shown only for roles that map to a real place */}
      {orgConfig && (
        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-600 uppercase tracking-wide">
            {orgConfig.label}
          </label>
          <select
            required
            value={form.organizationId}
            onChange={(e) => f("organizationId", e.target.value)}
            className={inputCls}
            disabled={loadingOrgs}
          >
            <option value="">
              {loadingOrgs
                ? `Loading ${orgConfig.label.toLowerCase()}s…`
                : orgs.length === 0
                  ? `No ${orgConfig.label.toLowerCase()}s found — add one in Resources first`
                  : `Select a ${orgConfig.label}…`}
            </option>
            {orgs.map((o) => (
              <option key={o._id} value={o._id}>
                {o.name}{o.address ? ` — ${o.address}` : ""}
              </option>
            ))}
          </select>
        </div>
      )}

      <button
        type="submit" disabled={saving}
        className="w-full bg-blue-600 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-60 transition"
      >
        {saving ? "Creating…" : "Create User"}
      </button>
    </form>
  );
}
