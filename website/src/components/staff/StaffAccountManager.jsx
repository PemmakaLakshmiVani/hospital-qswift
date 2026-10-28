import React, { useState } from 'react';
import { KeyRound, Plus, ShieldCheck, UserCheck, Trash2, Lock, Building2, Stethoscope, Edit, Eye, EyeOff, Copy, Check, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useQueue } from '../../context/QueueContext';

export default function StaffAccountManager() {
  const { staffHospitalId, staffAccounts, createStaffAccount, updateStaffAccount, deleteStaffAccount } = useAuth();
  const { hospitals, doctors } = useQueue();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [form, setForm] = useState({
    staff_name: '',
    username: '',
    password: '',
    doctor_id: ''
  });
  const [editForm, setEditForm] = useState({
    staff_name: '',
    doctor_id: '',
    password: ''
  });
  const [copiedId, setCopiedId] = useState(null);
  const [showPasswordMap, setShowPasswordMap] = useState({});
  const [updateSuccessMsg, setUpdateSuccessMsg] = useState('');

  const currentHospital = hospitals.find(h => h.id === staffHospitalId) || hospitals[0];
  const hospitalDoctors = doctors.filter(d => d.hospital_id === currentHospital.id);
  const hospitalStaff = staffAccounts.filter(s => s.hospital_id === currentHospital.id);

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!form.staff_name.trim() || !form.username.trim() || !form.password) return;

    const assignedDocId = form.doctor_id || (hospitalDoctors.length === 1 ? hospitalDoctors[0].id : null);

    createStaffAccount({
      hospital_id: currentHospital.id,
      doctor_id: assignedDocId,
      staff_name: form.staff_name.trim(),
      username: form.username.trim(),
      password: form.password
    });

    setShowCreateModal(false);
    setForm({ staff_name: '', username: '', password: '', doctor_id: '' });
  };

  const handleOpenEdit = (staff) => {
    setEditingStaff(staff);
    setEditForm({
      staff_name: staff.staff_name,
      doctor_id: staff.doctor_id || (hospitalDoctors.length === 1 ? hospitalDoctors[0].id : ''),
      password: staff.password || staff.password_hash || ''
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingStaff) return;

    const finalDocId = editForm.doctor_id || (hospitalDoctors.length === 1 ? hospitalDoctors[0].id : null);

    await updateStaffAccount(editingStaff.id, {
      staff_name: editForm.staff_name.trim(),
      doctor_id: finalDocId,
      password: editForm.password
    });

    setEditingStaff(null);
    setUpdateSuccessMsg(`Account for "${editForm.staff_name}" updated successfully!`);
    setTimeout(() => setUpdateSuccessMsg(''), 4000);
  };

  const copyCredentials = (staff) => {
    const credText = `Hospital Qswift OPD Login\nFacility: ${currentHospital?.name}\nOperator: ${staff.staff_name}\nUsername: ${staff.username}\nPassword: ${staff.password || staff.password_hash}`;
    navigator.clipboard.writeText(credText);
    setCopiedId(staff.id);
    setTimeout(() => setCopiedId(null), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6 overflow-x-hidden w-full max-w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 gap-3 sm:gap-4">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-bold text-ink">Clinic Staff Accounts & Access Control</h1>
          <p className="text-xs text-ink-muted">{currentHospital?.name} · Create & manage login credentials for receptionist / token operators</p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="w-full sm:w-auto justify-center px-4 py-2.5 bg-indigoConsole text-white hover:bg-indigo-900 text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4 text-amberState" />
          <span>Create Staff Operator Account</span>
        </button>
      </div>

      {updateSuccessMsg && (
        <div className="p-3 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-200 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{updateSuccessMsg}</span>
        </div>
      )}

      {/* Staff Accounts List / Empty State */}
      {hospitalStaff.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 space-y-4 shadow-xs">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 text-indigoConsole flex items-center justify-center">
            <KeyRound className="w-7 h-7" />
          </div>
          <div>
            <h3 className="font-display text-base font-bold text-ink">No Staff Operator Accounts Yet</h3>
            <p className="text-xs text-ink-muted max-w-sm mx-auto mt-1">
              Create operator credentials for your hospital receptionists or queue staff so they can log in directly and call patient OPD tokens.
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-5 py-2.5 bg-indigoConsole text-white hover:bg-indigo-900 text-xs font-bold rounded-xl shadow-sm inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 text-amberState" />
            <span>Create Staff Operator Account</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hospitalStaff.map((staff) => {
            const assignedDoc = doctors.find(d => 
              d.id === staff.doctor_id || 
              (staff.doctor_id && d.username?.toLowerCase() === staff.doctor_id?.toLowerCase()) ||
              (staff.doctor_id && d.name?.toLowerCase() === staff.doctor_id?.toLowerCase()) ||
              (staff.doctor_id && d.name?.toLowerCase().includes(staff.doctor_id?.toLowerCase()))
            ) || (hospitalDoctors.length === 1 ? hospitalDoctors[0] : null);

            const formatDoctorTitle = (doc, fallbackId) => {
              if (doc) {
                const raw = (doc.name || doc.doctor_name || '').trim();
                const cap = raw.charAt(0).toUpperCase() + raw.slice(1);
                const withPrefix = (cap.toLowerCase().startsWith('dr.') || cap.toLowerCase().startsWith('dr '))
                  ? cap
                  : `Dr. ${cap}`;
                return doc.specialty ? `${withPrefix} (${doc.specialty})` : withPrefix;
              }
              if (fallbackId) {
                const raw = String(fallbackId).trim();
                const cap = raw.charAt(0).toUpperCase() + raw.slice(1);
                return (cap.toLowerCase().startsWith('dr.') || cap.toLowerCase().startsWith('dr ')) ? cap : `Dr. ${cap}`;
              }
              if (hospitalDoctors.length === 1) {
                const d = hospitalDoctors[0];
                const cap = (d.name || '').trim().charAt(0).toUpperCase() + (d.name || '').trim().slice(1);
                const withPrefix = (cap.toLowerCase().startsWith('dr.') || cap.toLowerCase().startsWith('dr ')) ? cap : `Dr. ${cap}`;
                return d.specialty ? `${withPrefix} (${d.specialty})` : withPrefix;
              }
              return 'All Doctor Desks (Floater)';
            };

            return (
              <div key={staff.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 hover:border-slate-300 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-11 h-11 rounded-2xl bg-indigoConsole-light text-indigoConsole flex items-center justify-center font-bold text-sm shadow-xs">
                        <UserCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-base text-ink">{staff.staff_name}</h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] font-bold text-indigoConsole bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                            Username: <strong className="font-mono text-ink">{staff.username}</strong>
                          </span>
                          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs text-slate-600 pt-3 border-t border-slate-100 mt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Assigned Doctor Desk:</span>
                      <strong className="text-clinical-700 font-bold flex items-center gap-1 text-right">
                        <Stethoscope className="w-3.5 h-3.5 text-clinical-600 shrink-0" />
                        <span>{formatDoctorTitle(assignedDoc, staff.doctor_id)}</span>
                      </strong>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Password:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-slate-700 font-semibold bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                          {showPasswordMap[staff.id] ? (staff.password || staff.password_hash) : '••••••••'}
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowPasswordMap(prev => ({ ...prev, [staff.id]: !prev[staff.id] }))}
                          className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                          title="Toggle password view"
                        >
                          {showPasswordMap[staff.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                  <button
                    onClick={() => copyCredentials(staff)}
                    className="text-[11px] text-slate-600 hover:text-ink font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    {copiedId === staff.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Login</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(staff)}
                      className="px-2.5 py-1 text-xs font-bold text-indigoConsole hover:bg-indigo-50 rounded-lg border border-indigo-200 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Edit className="w-3 h-3" />
                      <span>Edit & Password</span>
                    </button>

                    <button
                      onClick={() => deleteStaffAccount(staff.id)}
                      className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Remove Account"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Staff Account Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="p-2 bg-indigoConsole-light text-indigoConsole rounded-xl">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-ink">Create Clinic Staff Credentials</h3>
                <p className="text-xs text-ink-muted">Reception staff will log in with these credentials</p>
              </div>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Staff Member Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sunita Sharma (Reception Operator)"
                  value={form.staff_name}
                  onChange={(e) => setForm({ ...form, staff_name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigoConsole"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Staff Username / Reg ID</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. APOLLO_STAFF_1"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigoConsole font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Password</label>
                <input
                  type="password"
                  required
                  placeholder="Password..."
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigoConsole"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Assign Doctor OPD Desk (Optional)</label>
                <select
                  value={form.doctor_id}
                  onChange={(e) => setForm({ ...form, doctor_id: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigoConsole"
                >
                  <option value="">All Doctor Desks (Floater / General Reception)</option>
                  {hospitalDoctors.map(d => {
                    const cap = (d.name || '').trim().charAt(0).toUpperCase() + (d.name || '').trim().slice(1);
                    const formatted = (cap.toLowerCase().startsWith('dr.') || cap.toLowerCase().startsWith('dr ')) ? cap : `Dr. ${cap}`;
                    return (
                      <option key={d.id} value={d.id}>
                        {formatted} ({d.specialty})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-indigoConsole text-white hover:bg-indigo-900 rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5 text-amberState" />
                  <span>Create Credentials</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Staff Account & Change Password Modal */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigoConsole-light text-indigoConsole rounded-xl">
                  <Edit className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-ink">Edit Staff Operator</h3>
                  <p className="text-xs text-ink-muted">Update details, assigned doctor desk, or change password</p>
                </div>
              </div>
              <button
                onClick={() => setEditingStaff(null)}
                className="text-slate-400 hover:text-slate-600 p-1 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Staff Member Name</label>
                <input
                  type="text"
                  required
                  placeholder="Staff operator name"
                  value={editForm.staff_name}
                  onChange={(e) => setEditForm({ ...editForm, staff_name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigoConsole"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Operator Username / ID</label>
                <input
                  type="text"
                  disabled
                  value={editingStaff.username}
                  className="w-full px-3 py-2 text-xs border border-slate-200 bg-slate-50 text-slate-500 rounded-xl font-mono cursor-not-allowed"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Username is fixed to prevent session disruption.</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Assign Doctor OPD Desk</label>
                <select
                  value={editForm.doctor_id}
                  onChange={(e) => setEditForm({ ...editForm, doctor_id: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigoConsole font-medium"
                >
                  <option value="">All Doctor Desks (Floater / Reception Desk)</option>
                  {hospitalDoctors.map(d => {
                    const cap = (d.name || '').trim().charAt(0).toUpperCase() + (d.name || '').trim().slice(1);
                    const formatted = (cap.toLowerCase().startsWith('dr.') || cap.toLowerCase().startsWith('dr ')) ? cap : `Dr. ${cap}`;
                    return (
                      <option key={d.id} value={d.id}>
                        {formatted} ({d.specialty})
                      </option>
                    );
                  })}
                </select>
                <span className="text-[10px] text-slate-400 mt-0.5 block">Assigning a doctor filters this operator's console to that doctor's queue.</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Change / Update Password</label>
                <input
                  type="text"
                  required
                  placeholder="Enter new password..."
                  value={editForm.password}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigoConsole font-mono"
                />
                <span className="text-[10px] text-indigoConsole font-medium mt-0.5 block">Password will be updated instantly for operator login.</span>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingStaff(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-indigoConsole text-white hover:bg-indigo-900 rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5 text-amberState" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
