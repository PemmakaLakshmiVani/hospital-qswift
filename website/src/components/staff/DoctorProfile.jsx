import React, { useState } from 'react';
import { Stethoscope, User, Calendar, Clock, KeyRound, AlertCircle, CheckCircle2, XCircle, Send, ShieldAlert, Building2, Eye, EyeOff, Lock, Edit2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useQueue } from '../../context/QueueContext';

export default function DoctorProfile() {
  const { user } = useAuth();
  const { doctors, hospitals, leaveRequests, toggleDoctorAvailability, requestDoctorLeave, updateDoctorCredentials } = useQueue();

  const todayStr = new Date().toISOString().split('T')[0];

  // Match doctor profile for logged in user
  const currentDoctor = doctors.find(
    d => d.id === user?.doctor_id || d.id === user?.id || (user?.username && d.username?.toLowerCase() === user?.username?.toLowerCase()) || (user?.name && d.name?.toLowerCase().includes(user?.name?.toLowerCase()))
  ) || doctors[0];

  const currentHospital = hospitals.find(h => h.id === currentDoctor?.hospital_id) || hospitals[0];
  const doctorLeaves = leaveRequests.filter(l => l.doctor_id === currentDoctor?.id);

  // Availability toggle state
  const isAvailable = currentDoctor?.is_available !== false;

  // Leave Form State
  const [fromDate, setFromDate] = useState(todayStr);
  const [toDate, setToDate] = useState(todayStr);
  const [reason, setReason] = useState('Attending Medical Conference & Seminar');
  const [successMsg, setSuccessMsg] = useState('');

  // Password Editing State
  const [showPassValue, setShowPassValue] = useState(false);
  const [showEditPasswordModal, setShowEditPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [showNewPassModal, setShowNewPassModal] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    const { newPassword, confirmPassword } = passwordForm;

    if (!newPassword || newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirm password do not match.');
      return;
    }

    setPasswordLoading(true);
    try {
      await updateDoctorCredentials(
        currentDoctor.id,
        currentDoctor.username || `DR_${currentDoctor.name.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`,
        newPassword
      );

      setPasswordSuccess('Password successfully updated! Your new credentials are now active.');
      setPasswordForm({ newPassword: '', confirmPassword: '' });
      setTimeout(() => {
        setShowEditPasswordModal(false);
        setPasswordSuccess('');
      }, 2000);
    } catch (err) {
      setPasswordError(err.message || 'Failed to update password. Please try again.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleToggleAvailability = (newStatus) => {
    if (!currentDoctor) return;
    toggleDoctorAvailability(currentDoctor.id, newStatus);
  };

  const handleLeaveSubmit = (e) => {
    e.preventDefault();
    if (!currentDoctor || !fromDate || !toDate) return;

    requestDoctorLeave({
      doctorId: currentDoctor.id,
      hospitalId: currentDoctor.hospital_id,
      doctorName: currentDoctor.name,
      specialty: currentDoctor.specialty,
      fromDate: fromDate,
      toDate: toDate,
      reason: reason
    });

    setSuccessMsg('Leave request submitted successfully! Pending hospital business owner approval.');
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  if (!currentDoctor) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Resigned Account Alert Banner */}
      {(currentDoctor.is_resigned || currentDoctor.status === 'resigned') && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-900 rounded-2xl flex items-center gap-3 text-xs font-semibold animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <div>
            <strong className="font-bold block text-sm">Account Status: Resigned / Inactive</strong>
            This doctor account has been marked as Resigned by hospital administration. Sign-in access and live queue operations are disabled.
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-indigo-900 text-white rounded-3xl p-6 shadow-md border border-teal-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-amberState text-ink flex items-center justify-center font-bold text-xl shadow-md shrink-0">
            <Stethoscope className="w-8 h-8 text-ink" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amberState bg-indigo-950/80 px-2.5 py-0.5 rounded-full border border-amberState/30">
                DOCTOR PROFILE & DESK MANAGEMENT
              </span>
              {(currentDoctor.is_resigned || currentDoctor.status === 'resigned') && (
                <span className="text-xs font-bold uppercase tracking-wider bg-rose-100 text-rose-800 px-2.5 py-0.5 rounded-full border border-rose-200">
                  🔴 Resigned
                </span>
              )}
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold mt-1">{currentDoctor.name}</h1>
            <p className="text-xs text-teal-100">
              {currentDoctor.qualification} · {currentDoctor.specialty} · {currentHospital?.name}
            </p>
          </div>
        </div>

        {/* Immediate Duty Status Switcher */}
        <div className="bg-indigo-950/80 p-3 rounded-2xl border border-white/10 space-y-1.5 shrink-0">
          <span className="text-[10px] uppercase font-bold text-slate-300 block tracking-wider">OPD Duty Status</span>
          {currentDoctor.is_resigned || currentDoctor.status === 'resigned' ? (
            <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-950/80 text-rose-200 border border-rose-700/50 block text-center">
              🔴 Account Resigned (Disabled)
            </span>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleToggleAvailability(true)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  isAvailable
                    ? 'bg-emerald-500 text-white shadow-md ring-2 ring-emerald-400/30'
                    : 'bg-white/10 text-slate-300 hover:bg-white/20'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                <span>🟢 Available / On Duty</span>
              </button>
              <button
                onClick={() => handleToggleAvailability(false)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  !isAvailable
                    ? 'bg-rose-600 text-white shadow-md ring-2 ring-rose-500/30'
                    : 'bg-white/10 text-slate-300 hover:bg-white/20'
                }`}
              >
                <span>🔴 Not Available / Off Duty</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Doctor Profile & Credentials Details */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="font-display text-base font-bold text-ink border-b border-slate-100 pb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-clinical-600" />
              <span>Doctor Practice Details</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-semibold">Specialty:</span>
                <span className="font-bold text-ink">{currentDoctor.specialty}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-semibold">Qualification:</span>
                <span className="font-bold text-ink">{currentDoctor.qualification}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-semibold">Experience:</span>
                <span className="font-bold text-ink">{currentDoctor.experience_years || 8} years</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-semibold">Consultation Fee:</span>
                <span className="font-bold text-emerald-700">₹{currentDoctor.consultation_fee}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-semibold">Avg Consult Duration:</span>
                <span className="font-bold text-clinical-700">{currentDoctor.avg_consult_minutes} mins</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-semibold">OPD Hours:</span>
                <span className="font-bold text-ink">{currentDoctor.available_from || '09:00'} - {currentDoctor.available_to || '17:00'}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500 font-semibold">Operating Hospital:</span>
                <span className="font-bold text-ink truncate max-w-[160px]">{currentHospital?.name}</span>
              </div>
            </div>
          </div>

          {/* Credentials Card */}
          <div className="bg-indigo-50/80 border border-indigo-100 rounded-3xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-indigoConsole" />
                <span>Doctor Console Credentials</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setPasswordError('');
                  setPasswordSuccess('');
                  setShowEditPasswordModal(true);
                }}
                className="px-2.5 py-1 text-[11px] font-bold text-indigo-700 bg-indigo-100 hover:bg-indigo-200 border border-indigo-200 rounded-lg flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                title="Edit / Change Doctor Password"
              >
                <Lock className="w-3 h-3 text-indigoConsole" />
                <span>Edit Password</span>
              </button>
            </div>

            <div className="text-xs font-mono text-indigo-950 space-y-2 pt-1">
              <div className="flex justify-between items-center py-1 border-b border-indigo-100/60">
                <span className="text-slate-500 font-sans font-medium">Username:</span>
                <strong className="text-indigoConsole">{currentDoctor.username || `DR_${currentDoctor.name.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`}</strong>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500 font-sans font-medium">Password:</span>
                <div className="flex items-center gap-2">
                  <strong className="tracking-wide">
                    {showPassValue ? (currentDoctor.password || 'doc123') : '••••••••'}
                  </strong>
                  <button
                    type="button"
                    onClick={() => setShowPassValue(!showPassValue)}
                    className="p-1 text-slate-400 hover:text-indigoConsole transition-colors cursor-pointer"
                    title={showPassValue ? "Hide Password" : "Show Password"}
                  >
                    {showPassValue ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPasswordError('');
                      setPasswordSuccess('');
                      setShowEditPasswordModal(true);
                    }}
                    className="p-1 text-slate-400 hover:text-indigoConsole transition-colors cursor-pointer"
                    title="Change Password"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Request Leave & Vacation Permission System */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Request Leave Form Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-clinical-600" />
                <div>
                  <h3 className="font-display text-lg font-bold text-ink">Request Leave / Absence Permission</h3>
                  <p className="text-xs text-ink-muted">Submit leave request for approval by hospital business owner</p>
                </div>
              </div>
            </div>

            {successMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl font-bold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleLeaveSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Leave Start Date (From) *</label>
                  <input
                    type="date"
                    required
                    min={todayStr}
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-bold text-ink bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-clinical-500 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Leave End Date (To) *</label>
                  <input
                    type="date"
                    required
                    min={fromDate || todayStr}
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-bold text-ink bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-clinical-500 cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reason for Leave / Vacation *</label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs font-medium border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-clinical-500 bg-white"
                >
                  <option value="Attending Medical Conference & Seminar">Attending Medical Conference & Seminar</option>
                  <option value="Personal Family Emergency Leave">Personal Family Emergency Leave</option>
                  <option value="Annual Vacation / Personal Leave">Annual Vacation / Personal Leave</option>
                  <option value="Medical Sick Leave">Medical Sick Leave</option>
                  <option value="Hospital Training & Workshop">Hospital Training & Workshop</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-2.5 bg-[#0E7C86] hover:bg-clinical-600 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all"
              >
                <Send className="w-4 h-4" />
                <span>Submit Leave Request for Owner Approval</span>
              </button>
            </form>
          </div>

          {/* Leave History List */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="font-display text-base font-bold text-ink border-b border-slate-100 pb-3 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-clinical-600" />
                <span>My Submitted Leave Requests ({doctorLeaves.length})</span>
              </span>
            </h3>

            {doctorLeaves.length > 0 ? (
              <div className="space-y-3">
                {doctorLeaves.map((leave) => (
                  <div
                    key={leave.id}
                    className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      leave.status === 'approved'
                        ? 'bg-emerald-50/50 border-emerald-200'
                        : leave.status === 'rejected'
                        ? 'bg-rose-50/50 border-rose-200'
                        : 'bg-amber-50/50 border-amber-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-ink">
                          {leave.from_date} to {leave.to_date}
                        </span>
                        <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                          leave.status === 'approved'
                            ? 'bg-emerald-600 text-white'
                            : leave.status === 'rejected'
                            ? 'bg-rose-600 text-white'
                            : 'bg-amberState text-ink font-bold animate-pulse'
                        }`}>
                          {leave.status === 'approved' ? '✓ Approved by Owner' : leave.status === 'rejected' ? '✕ Rejected' : '⏳ Pending Approval'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 font-medium">{leave.reason}</p>
                    </div>

                    <div className="text-right text-[11px] text-slate-400 shrink-0">
                      Requested: {new Date(leave.requested_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-slate-50/50 rounded-2xl border border-slate-100">
                <p className="text-xs text-ink-muted">No leave requests submitted yet.</p>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Edit Doctor Password Modal */}
      {showEditPasswordModal && (
        <div className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-100 text-indigoConsole rounded-xl">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-ink">Change Doctor Password</h3>
                  <p className="text-xs text-slate-500">{currentDoctor.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEditPasswordModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {passwordError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{passwordError}</span>
              </div>
            )}

            {passwordSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Doctor Login ID</label>
                <input
                  type="text"
                  disabled
                  value={currentDoctor.username || `DR_${currentDoctor.name.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`}
                  className="w-full px-3 py-2 text-xs font-mono font-bold text-slate-500 bg-slate-100 border border-slate-200 rounded-xl cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">New Password *</label>
                <div className="relative">
                  <input
                    type={showNewPassModal ? "text" : "password"}
                    required
                    minLength={6}
                    placeholder="Enter at least 6 characters"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigoConsole font-mono pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassModal(!showNewPassModal)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  >
                    {showNewPassModal ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Minimum 6 characters. Used for Doctor Console sign in.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm New Password *</label>
                <input
                  type={showNewPassModal ? "text" : "password"}
                  required
                  minLength={6}
                  placeholder="Re-type new password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigoConsole font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditPasswordModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passwordLoading || !passwordForm.newPassword}
                  className="px-5 py-2 text-xs font-bold bg-indigoConsole hover:bg-indigo-900 text-white rounded-xl shadow-sm flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{passwordLoading ? 'Saving...' : 'Save New Password'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
