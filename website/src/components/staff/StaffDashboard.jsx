import React, { useState } from 'react';
import {
  Activity,
  UserCheck,
  Clock,
  Phone,
  Plus,
  Play,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  Users,
  Stethoscope,
  Building2,
  TrendingUp,
  AlertTriangle,
  FileText,
  KeyRound,
  Lock,
  Star
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useQueue } from '../../context/QueueContext';
import OPDTokenSlip from '../common/OPDTokenSlip';
import WalkInModal from './WalkInModal';
import HospitalProfileModal from './HospitalProfileModal';

export default function StaffDashboard() {
  const { user, userRole, staffHospitalId, setStaffHospitalId } = useAuth();
  const {
    hospitals,
    doctors,
    tokens,
    reviews,
    callNextToken,
    updateTokenStatus,
    toggleTokenPriority,
    toggleDoctorAvailability,
    getDoctorQueueStats,
    isHospitalCurrentlyOpen,
    isHospitalClosedOnDate,
    formatTimeAMPM,
    restoreHospital
  } = useQueue();

  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [showHospitalProfileModal, setShowHospitalProfileModal] = useState(false);

  const isSuperAdmin = userRole === 'business_owner' && (user?.is_super_admin || user?.email === 'owner@apolloclinic.com' || user?.email === 'admin@hqswift.com');

  // Filter active vs archived hospitals
  const activeHospitals = hospitals.filter(h => !h.is_deleted);
  const currentHospital = (isSuperAdmin ? hospitals : activeHospitals).find(h => h.id === staffHospitalId) || (isSuperAdmin ? hospitals[0] : activeHospitals[0]);
  const hospitalDoctors = currentHospital ? doctors.filter(d => d.hospital_id === currentHospital.id) : [];

  // If user is a Doctor or Staff Operator assigned to a specific doctor desk
  const matchedDoctorByAccount = userRole === 'doctor'
    ? doctors.find(d => d.id === user?.doctor_id || d.username?.toLowerCase() === user?.username?.toLowerCase() || d.name?.toLowerCase().includes(user?.name?.toLowerCase()))
    : null;

  const assignedDoctorId = userRole === 'doctor'
    ? (matchedDoctorByAccount?.id || user?.doctor_id || hospitalDoctors[0]?.id || doctors[0]?.id || '')
    : user?.doctor_id || selectedDoctorId || (hospitalDoctors[0]?.id || '');

  const activeDoctorId = assignedDoctorId;
  const activeDoctor = doctors.find(d => d.id === activeDoctorId) || hospitalDoctors[0] || doctors[0];

  const todayStr = new Date().toISOString().split('T')[0];

  // Filter tokens for selected doctor
  const doctorTokens = activeDoctorId ? tokens.filter(t => t.doctor_id === activeDoctorId) : [];
  
  // Today's live tokens for desk call
  const todayDoctorTokens = doctorTokens.filter(t => t.queue_date === todayStr || !t.queue_date);
  const scheduledDoctorTokens = doctorTokens.filter(t => t.queue_date && t.queue_date > todayStr);

  const nowServingToken = todayDoctorTokens.find(t => t.status === 'serving');

  // Waiting tokens for today sorted: Priority tokens first, then sequential token number
  const waitingTokens = todayDoctorTokens
    .filter(t => t.status === 'waiting')
    .sort((a, b) => {
      if (a.is_priority && !b.is_priority) return -1;
      if (!a.is_priority && b.is_priority) return 1;
      return a.token_number - b.token_number;
    });

  const completedToday = todayDoctorTokens.filter(t => t.status === 'done').length;
  const stats = activeDoctorId ? getDoctorQueueStats(activeDoctorId) : null;

  const handleCallNext = () => {
    if (!activeDoctorId) return;
    callNextToken(activeDoctorId);
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] text-ink py-4 sm:py-6 overflow-x-hidden w-full max-w-full">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 space-y-4 sm:space-y-6 overflow-x-hidden">

        {/* Console Header Banner Customized by Role */}
        <div className={`text-white rounded-3xl p-4 sm:p-6 shadow-console flex flex-col md:flex-row md:items-center justify-between gap-4 border overflow-hidden ${
          userRole === 'doctor'
            ? 'bg-gradient-to-r from-emerald-800 via-teal-800 to-indigo-900 border-teal-700'
            : userRole === 'staff_operator'
              ? 'bg-[#3B3F8C] border-indigo-900'
              : 'bg-[#2A2D6E] border-indigo-950'
        }`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 w-full min-w-0">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-amberState text-ink flex items-center justify-center font-bold shadow-md shrink-0">
              {userRole === 'doctor' ? (
                <Stethoscope className="w-6 h-6 sm:w-7 sm:h-7 text-ink" />
              ) : (
                <Building2 className="w-6 h-6 sm:w-7 sm:h-7 text-ink" />
              )}
            </div>
            <div className="min-w-0 flex-1 w-full">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-amberState bg-indigo-950/80 px-2 sm:px-2.5 py-0.5 rounded-full border border-amberState/30 shrink-0">
                  {userRole === 'doctor'
                    ? 'DOCTOR OPD CONSOLE'
                    : userRole === 'staff_operator'
                      ? 'CLINIC FRONT-DESK OPERATOR CONSOLE'
                      : 'HOSPITAL BUSINESS OWNER ADMIN CONSOLE'}
                </span>
                <span className="text-[11px] sm:text-xs text-indigo-200 font-medium">
                  · OPD Hours: {formatTimeAMPM(currentHospital?.open_time || '08:00')} – {formatTimeAMPM(currentHospital?.close_time || '20:00')}
                </span>
                {isHospitalCurrentlyOpen(currentHospital) ? (
                  <span className="text-[10px] sm:text-[11px] font-bold text-emerald-300 bg-emerald-950/80 px-2 sm:px-2.5 py-0.5 rounded-full border border-emerald-400/40">
                    🟢 Facility Operational
                  </span>
                ) : isHospitalClosedOnDate(currentHospital, new Date().toISOString().split('T')[0]) ? (
                  <span className="text-[10px] sm:text-[11px] font-bold text-rose-300 bg-rose-950/80 px-2 sm:px-2.5 py-0.5 rounded-full border border-rose-400/40">
                    🔴 Facility Closed Today ({currentHospital?.closed_days?.length > 0 ? `Closed ${currentHospital.closed_days.join(', ')}` : 'Closed'})
                  </span>
                ) : (
                  <span className="text-[10px] sm:text-[11px] font-bold text-amber-300 bg-amber-950/80 px-2 sm:px-2.5 py-0.5 rounded-full border border-amber-400/40">
                    🌙 Closed for the Day (OPD: {formatTimeAMPM(currentHospital?.open_time || '08:00')} – {formatTimeAMPM(currentHospital?.close_time || '20:00')})
                  </span>
                )}
              </div>
              <h1 className="font-display text-xl sm:text-2xl md:text-3xl font-bold mt-1 break-words">
                <span>
                  {userRole === 'doctor'
                    ? `${activeDoctor?.name || user?.name || 'Doctor'} · Personal Desk Queue`
                    : currentHospital?.name}
                </span>
              </h1>
              <p className="text-xs text-indigo-200 break-words mt-0.5">
                {userRole === 'doctor'
                  ? `${activeDoctor?.qualification || activeDoctor?.specialty || 'General Practitioner'} · ${currentHospital?.name} (${currentHospital?.address})`
                  : `${currentHospital?.address} ${userRole === 'staff_operator' ? `· Logged in as: ${user?.name || 'Front Desk Staff'}` : `· Registered Owner: ${user?.email}`}`}
              </p>

              {/* Master Facility Switcher (Only visible for Master Website Owner) */}
              {isSuperAdmin && (
                <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2 pt-2.5 w-full min-w-0">
                  <span className="text-xs text-indigo-200 font-semibold shrink-0">
                    Master Facility Switcher:
                  </span>
                  <select
                    value={staffHospitalId}
                    onChange={(e) => setStaffHospitalId(e.target.value)}
                    className="w-full sm:w-auto max-w-full px-3 py-1.5 text-xs font-bold bg-white text-slate-900 border border-indigo-200 rounded-lg focus:outline-none cursor-pointer truncate"
                  >
                    <optgroup label="🟢 Active Public Facilities">
                      {hospitals.filter(h => !h.is_deleted).map(h => (
                        <option key={h.id} value={h.id}>
                          {h.name} — {h.address}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="🗃️ Master Vault: Archived / Deleted Facilities">
                      {hospitals.filter(h => h.is_deleted).map(h => (
                        <option key={h.id} value={h.id}>
                          [DELETED ARCHIVE] {h.name} ({h.deleted_at || 'Archived'})
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto pt-2 sm:pt-0">
            {userRole === 'business_owner' && (
              <button
                type="button"
                onClick={() => setShowHospitalProfileModal(true)}
                className="flex-1 sm:flex-none px-3.5 sm:px-4 py-2 sm:py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/20 shadow-xs flex items-center justify-center gap-1.5 transition-all shrink-0 cursor-pointer"
              >
                <Clock className="w-4 h-4 text-amberState shrink-0" />
                <span className="truncate">Facility Profile & Hours</span>
              </button>
            )}

            {userRole !== 'doctor' && (
              <button
                onClick={() => setShowWalkInModal(true)}
                className="flex-1 sm:flex-none px-3.5 sm:px-4 py-2 sm:py-2.5 bg-amberState hover:bg-amber-400 text-ink font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all transform active:scale-95 shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4 shrink-0" />
                <span className="truncate">Add Walk-In Patient</span>
              </button>
            )}
          </div>
        </div>

        {/* Master Website Owner Audit Archive Banner for Deleted Facilities */}
        {currentHospital?.is_deleted && isSuperAdmin && (
          <div className="p-4 bg-amber-50 border border-amber-300 text-amber-900 rounded-2xl flex items-center justify-between gap-4 text-xs shadow-sm animate-in fade-in">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <strong className="font-bold text-sm block">🗃️ MASTER WEBSITE OWNER AUDIT ARCHIVE</strong>
                <span>
                  This facility was deleted by the owner on <strong>{currentHospital.deleted_at || 'Recent Date'}</strong>. All profile details, license documents, and owner records are preserved exclusively for Master Website Owner audit.
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => restoreHospital(currentHospital.id)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs shrink-0 cursor-pointer transition-all flex items-center gap-1.5"
            >
              <span>↩️ Restore Facility</span>
            </button>
          </div>
        )}

        {/* Doctor Summary Metrics Bar (Shown for Doctor Role) */}
        {userRole === 'doctor' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Today's Tokens Received</span>
              <span className="font-mono text-3xl font-bold text-clinical-700">{doctorTokens.length}</span>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Patients Waiting</span>
              <span className="font-mono text-3xl font-bold text-amberState-dark">{waitingTokens.length}</span>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Completed Consultations</span>
              <span className="font-mono text-3xl font-bold text-emerald-600">{completedToday}</span>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Est. Consult Time</span>
              <span className="font-mono text-3xl font-bold text-indigoConsole">{activeDoctor?.avg_consult_minutes || 15}m</span>
            </div>
          </div>
        )}

        {/* Doctor Selector Tabs (Shown only for Business Owner & Staff Operator, hidden for Doctor) */}
        {userRole !== 'doctor' && (
          <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
            {hospitalDoctors.map((doc) => {
              const docStats = getDoctorQueueStats(doc.id);
              const isSelected = doc.id === activeDoctorId;

              return (
                <button
                  key={doc.id}
                  onClick={() => setSelectedDoctorId(doc.id)}
                  className={`px-4 py-3 rounded-2xl border text-left shrink-0 transition-all ${
                    isSelected
                      ? 'bg-white border-[#3B3F8C] shadow-md ring-2 ring-[#3B3F8C]/20'
                      : 'bg-white/80 border-slate-200 hover:bg-white text-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-display font-bold text-sm text-ink">{doc.name}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-clinical-50 text-clinical-700">
                      {doc.specialty}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs mt-1 text-slate-500">
                    <span>Serving: <strong className="font-mono text-clinical-700">#{docStats.servingTokenNumber || '--'}</strong></span>
                    <span>·</span>
                    <span className="text-amberState-dark font-bold">{docStats.waitingCount} waiting</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {activeDoctor && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Column 1 & 2: Main Call Console & Serving Display */}
            <div className="lg:col-span-2 space-y-6">

              {/* Realtime OPD Serving Station Card */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-bold text-clinical-600 tracking-wider">LIVE CLINIC OPD DESK</span>
                    <div className="flex flex-wrap items-center gap-2 mt-0.5">
                      <h2 className="font-display text-lg sm:text-xl font-bold text-ink truncate">{activeDoctor.name}</h2>
                      {activeDoctor.is_resigned || activeDoctor.status === 'resigned' ? (
                        <span className="px-2.5 py-0.5 text-[10px] sm:text-[11px] font-bold rounded-full border bg-rose-50 text-rose-800 border-rose-300">
                          🔴 Resigned (Inactive Account)
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => toggleDoctorAvailability(activeDoctor.id, activeDoctor.is_available === false ? true : false)}
                          className={`px-2 sm:px-2.5 py-0.5 text-[10px] sm:text-[11px] font-bold rounded-full border transition-all cursor-pointer ${
                            activeDoctor.is_available !== false
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                              : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                          }`}
                        >
                          {activeDoctor.is_available !== false ? '🟢 Available on Duty' : '🟡 Away / Off Duty'}
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-ink-muted">{activeDoctor.specialty} · Room 102</p>
                  </div>

                  <div className="w-full sm:w-auto">
                    <button
                      onClick={handleCallNext}
                      disabled={waitingTokens.length === 0 || activeDoctor.is_resigned || activeDoctor.status === 'resigned'}
                      className="w-full sm:w-auto justify-center px-5 sm:px-6 py-2.5 sm:py-3 bg-clinical-500 hover:bg-clinical-600 disabled:bg-slate-300 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-md flex items-center gap-2 transition-all transform active:scale-95 cursor-pointer disabled:cursor-not-allowed"
                    >
                      <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-white shrink-0" />
                      <span className="truncate">{activeDoctor.is_resigned || activeDoctor.status === 'resigned' ? 'ACCOUNT RESIGNED' : 'CALL NEXT PATIENT'}</span>
                    </button>
                  </div>
                </div>

                {/* Now Serving Big Display Card */}
                {nowServingToken ? (
                  <div className="bg-gradient-to-r from-amber-500/10 via-amber-50 to-clinical-50 border-2 border-amberState/60 rounded-3xl p-4 sm:p-6 text-center shadow-token space-y-3 relative overflow-hidden">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amberState text-ink font-bold text-xs rounded-full shadow-sm animate-pulse">
                      <Activity className="w-4 h-4" />
                      <span>NOW SERVING INSIDE CLINIC ROOM</span>
                    </div>

                    <div className="font-mono text-5xl sm:text-7xl font-bold text-clinical-700">
                      #{nowServingToken.token_number}
                    </div>

                    <div className="space-y-0.5">
                      <h3 className="font-display text-lg sm:text-xl font-bold text-ink break-words">{nowServingToken.patient_name}</h3>
                      <p className="text-xs text-ink-muted">
                        Joined OPD Queue: {new Date(nowServingToken.joined_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>

                    {nowServingToken.is_priority && (
                      <div className="inline-flex items-center gap-1 px-3 py-1 bg-rose-100 text-rose-800 text-xs font-bold rounded-lg border border-rose-300">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>Priority Access ({nowServingToken.priority_reason})</span>
                      </div>
                    )}

                    {/* Action buttons for current patient */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2 sm:gap-3 pt-3">
                      <button
                        onClick={() => updateTokenStatus(nowServingToken.id, 'done')}
                        className="px-4 sm:px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Mark Consultation Completed</span>
                      </button>

                      <button
                        onClick={() => updateTokenStatus(nowServingToken.id, 'no_show')}
                        className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
                      >
                        <span>Mark No-Show</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 sm:py-12 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 text-center space-y-2 p-4">
                    <Clock className="w-8 h-8 sm:w-10 sm:h-10 text-slate-300 mx-auto" />
                    <p className="font-display text-sm sm:text-base font-bold text-ink">No Patient Currently Inside Doctor Room</p>
                    <p className="text-xs text-ink-muted">Click <strong>"CALL NEXT PATIENT"</strong> to invite token from queue.</p>
                  </div>
                )}

                {/* Queue Stats Row */}
                <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-2">
                  <div className="p-3 sm:p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                    <span className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400 block truncate">WAITING</span>
                    <span className="font-mono text-xl sm:text-2xl font-bold text-amberState-dark">{waitingTokens.length}</span>
                  </div>
                  <div className="p-3 sm:p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                    <span className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400 block truncate">SEEN TODAY</span>
                    <span className="font-mono text-xl sm:text-2xl font-bold text-emerald-700">{completedToday}</span>
                  </div>
                  <div className="p-3 sm:p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                    <span className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400 block truncate">AVG WAIT</span>
                    <span className="font-mono text-xl sm:text-2xl font-bold text-clinical-700">{activeDoctor.avg_consult_minutes}m</span>
                  </div>
                </div>
              </div>

              {/* Waiting Tokens List */}
              <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-base sm:text-lg font-bold text-ink flex items-center gap-2">
                    <Users className="w-5 h-5 text-clinical-600" />
                    <span>Waiting Queue Line ({waitingTokens.length})</span>
                  </h3>
                  <span className="text-[11px] sm:text-xs text-ink-muted">Priority items first</span>
                </div>

                {waitingTokens.length > 0 ? (
                  <div className="space-y-3">
                    {waitingTokens.map((token, idx) => (
                      <div
                        key={token.id}
                        className={`p-3.5 sm:p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                          token.is_priority
                            ? 'bg-amber-50/50 border-amberState/40'
                            : 'bg-slate-50/70 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="font-mono text-xl sm:text-2xl font-bold text-clinical-700 w-10 sm:w-12 text-center shrink-0">
                            #{token.token_number}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-display font-bold text-sm text-ink truncate">{token.patient_name}</p>
                              {token.is_priority && (
                                <span className="px-2 py-0.5 text-[10px] font-bold bg-amberState text-ink rounded shrink-0">
                                  {token.priority_reason || 'Priority'}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-ink-muted">
                              Position #{idx + 1} in line · Joined {new Date(token.joined_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>

                        {/* Priority Toggle & Controls */}
                        <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60">
                          <button
                            onClick={() => toggleTokenPriority(token.id)}
                            className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors ${
                              token.is_priority
                                ? 'bg-amberState text-ink border-amber-500'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            <ShieldAlert className="w-3.5 h-3.5 inline mr-1" />
                            {token.is_priority ? 'Priority ON' : 'Make Priority'}
                          </button>

                          <button
                            onClick={() => updateTokenStatus(token.id, 'no_show')}
                            className="px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            Skip
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-xs text-ink-muted">
                    No patients currently waiting in line for {activeDoctor.name}.
                  </div>
                )}
              </div>

              {/* Advance Scheduled Tokens for Next Days */}
              {scheduledDoctorTokens.length > 0 && (
                <div className="bg-indigo-50/50 rounded-3xl border border-indigo-200 p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-base font-bold text-indigo-950 flex items-center gap-2">
                      <span className="text-sm px-2 py-0.5 rounded-full bg-indigo-600 text-white">📅</span>
                      <span>Advance Scheduled Tokens ({scheduledDoctorTokens.length})</span>
                    </h3>
                    <span className="text-xs text-indigo-700 font-semibold">Booked for Next Day / Future</span>
                  </div>

                  <div className="space-y-2">
                    {scheduledDoctorTokens.map((tok) => (
                      <div key={tok.id} className="p-3 bg-white rounded-xl border border-indigo-100 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono font-bold text-indigo-800 text-sm">#{tok.token_number}</span>
                          <div>
                            <span className="font-bold text-ink block">{tok.patient_name}</span>
                            <span className="text-[11px] text-slate-500">Scheduled Date: <strong>{tok.queue_date}</strong></span>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-md text-[10px] font-bold">
                          Next Day Token
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>


              {/* Column 3: Live OPD Token Slip Preview & Realtime Patient Feedback */}
            <div className="space-y-6">
              <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4">
                <h3 className="font-display text-sm font-bold text-ink uppercase tracking-wider text-slate-500 border-b pb-2">
                  OPD TICKET PREVIEW
                </h3>
                <p className="text-xs text-ink-muted">
                  Identical OPD ticket slip view seen by patient on mobile app.
                </p>

                {nowServingToken ? (
                  <OPDTokenSlip
                    token={nowServingToken}
                    doctor={activeDoctor}
                    hospital={currentHospital}
                    servingTokenNumber={nowServingToken.token_number}
                    queuePosition={0}
                    estimatedWaitMins={0}
                    showActions={false}
                  />
                ) : waitingTokens[0] ? (
                  <OPDTokenSlip
                    token={waitingTokens[0]}
                    doctor={activeDoctor}
                    hospital={currentHospital}
                    servingTokenNumber={stats?.servingTokenNumber}
                    queuePosition={1}
                    estimatedWaitMins={activeDoctor.avg_consult_minutes}
                    showActions={false}
                  />
                ) : (
                  <div className="py-12 text-center text-xs text-slate-400">
                    No active token slip to display right now.
                  </div>
                )}
              </div>

              {/* Realtime Patient Reviews & Satisfaction Widget */}
              <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-display text-sm font-bold text-ink uppercase tracking-wider text-slate-500">
                    REALTIME PATIENT REVIEWS
                  </h3>
                  <div className="flex items-center gap-1 font-bold text-amber-500 text-xs bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{currentHospital?.rating || 5.0} / 5.0</span>
                  </div>
                </div>

                {reviews.filter(r => r.hospital_id === currentHospital.id).length > 0 ? (
                  <div className="space-y-3">
                    {reviews.filter(r => r.hospital_id === currentHospital.id).slice(0, 3).map((rev) => (
                      <div key={rev.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-ink">{rev.patient_name}</span>
                          <span className="flex items-center text-amber-500 font-bold text-[11px]">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 inline mr-0.5" />
                            {rev.rating}.0
                          </span>
                        </div>
                        <p className="text-slate-600 line-clamp-2 italic">"{rev.comment}"</p>
                        {rev.response ? (
                          <p className="text-[10px] text-emerald-700 font-semibold pt-1">
                            ✓ Replied by Clinic Staff
                          </p>
                        ) : (
                          <p className="text-[10px] text-amber-600 font-semibold pt-1">
                            ⏳ Response pending
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-xs text-slate-400 py-6">No patient reviews recorded yet for this facility.</p>
                )}
              </div>
            </div>

          </div>
        )}
      </div>

      {/* Walk-In Patient Registration Modal */}
      {showWalkInModal && (
        <WalkInModal
          hospitalId={currentHospital.id}
          doctors={hospitalDoctors}
          onClose={() => setShowWalkInModal(false)}
        />
      )}

      {/* Hospital Profile & OPD Operating Schedule Settings Modal */}
      {showHospitalProfileModal && (
        <HospitalProfileModal
          hospital={currentHospital}
          onClose={() => setShowHospitalProfileModal(false)}
        />
      )}
    </div>
  );
}
