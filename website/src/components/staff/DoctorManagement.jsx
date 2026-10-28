import React, { useState } from 'react';
import { Stethoscope, Plus, DollarSign, Clock, Calendar, Power, KeyRound, Lock, UserCheck, ShieldCheck, Ticket, ArrowLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useQueue } from '../../context/QueueContext';

export default function DoctorManagement() {
  const { staffHospitalId } = useAuth();
  const { hospitals, doctors, tokens, addDoctor, updateDoctorCredentials, toggleDoctorAvailability, toggleDoctorResignation } = useQueue();

  const [selectedDoctorId, setSelectedDoctorId] = useState(null); // Doctor ID currently being viewed in detail
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCredsDoctor, setEditingCredsDoctor] = useState(null); // Doctor object currently editing password
  const [credsForm, setCredsForm] = useState({ username: '', password: '' });

  const selectedDoctor = doctors.find(d => d.id === selectedDoctorId) || null;

  const [form, setForm] = useState({
    name: '',
    username: '',
    password: '',
    specialty: 'General Physician',
    consultation_fee: 500,
    qualification: 'MD (Internal Med)',
    experience_years: 8,
    avg_consult_minutes: 15,
    available_days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    available_from: '09:00',
    available_to: '17:00'
  });

  const currentHospital = hospitals.find(h => h.id === staffHospitalId) || hospitals[0];
  const hospitalDoctors = doctors.filter(d => d.hospital_id === currentHospital.id);

  const getDoctorStatusKey = (doc) => {
    if (!doc) return 'available';
    if (doc.is_resigned || doc.status === 'resigned') return 'resigned';
    if (doc.is_available === false) return 'unavailable';
    return 'available';
  };

  const handleStatusChange = (doc, newStatusKey) => {
    if (!doc) return;
    if (newStatusKey === 'resigned') {
      toggleDoctorResignation(doc.id, true);
    } else if (newStatusKey === 'unavailable') {
      toggleDoctorResignation(doc.id, false);
      toggleDoctorAvailability(doc.id, false);
    } else {
      toggleDoctorResignation(doc.id, false);
      toggleDoctorAvailability(doc.id, true);
    }
  };

  const renderStatusBadge = (doc) => {
    const statusKey = getDoctorStatusKey(doc);
    if (statusKey === 'resigned') {
      return (
        <span className="px-2.5 py-1 text-xs font-bold bg-rose-100 text-rose-800 rounded-full border border-rose-200">
          🔴 Resigned
        </span>
      );
    }
    if (statusKey === 'unavailable') {
      return (
        <span className="px-2.5 py-1 text-xs font-bold bg-amber-100 text-amber-800 rounded-full border border-amber-200">
          🟡 Away / Off Duty
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 text-xs font-bold bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200">
        🟢 Available
      </span>
    );
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!form.name) return;

    const cleanName = form.name.replace(/^(Dr\.\s*)/i, '').trim();
    const autoUsername = form.username.trim() || `DR_${cleanName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`;
    const autoPassword = form.password.trim() || 'doc123';

    addDoctor({
      hospital_id: currentHospital.id,
      name: form.name.startsWith('Dr.') ? form.name : `Dr. ${form.name}`,
      username: autoUsername,
      password: autoPassword,
      specialty: form.specialty,
      consultation_fee: form.consultation_fee,
      qualification: form.qualification,
      experience_years: form.experience_years,
      avg_consult_minutes: form.avg_consult_minutes,
      available_days: form.available_days,
      available_from: form.available_from,
      available_to: form.available_to
    });

    setShowAddModal(false);
    setForm({
      name: '',
      username: '',
      password: '',
      specialty: 'General Physician',
      consultation_fee: 500,
      qualification: 'MD (Internal Med)',
      experience_years: 8,
      avg_consult_minutes: 15,
      available_days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      available_from: '09:00',
      available_to: '17:00'
    });
  };

  const handleOpenEditCreds = (doc, e) => {
    if (e) e.stopPropagation();
    const cleanName = doc.name.replace(/^(Dr\.\s*)/i, '').trim();
    setEditingCredsDoctor(doc);
    setCredsForm({
      username: doc.username || `DR_${cleanName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`,
      password: doc.password || 'doc123'
    });
  };

  const handleSaveCreds = (e) => {
    e.preventDefault();
    if (!editingCredsDoctor || !credsForm.username || !credsForm.password) return;

    updateDoctorCredentials(editingCredsDoctor.id, credsForm.username, credsForm.password);
    setEditingCredsDoctor(null);
  };

  // Doctor tokens for selected doctor details view
  const selectedDoctorTokens = selectedDoctor ? tokens.filter(t => t.doctor_id === selectedDoctor.id) : [];

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6 overflow-x-hidden w-full max-w-full">
      
      {/* 1. Doctor Details View (When a doctor card is clicked) */}
      {selectedDoctor ? (
        <div className="space-y-6 animate-in fade-in">
          {/* Header & Back Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedDoctorId(null)}
                className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center gap-1.5 transition-colors border border-slate-200 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Doctor Roster</span>
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-display text-2xl font-bold text-ink">{selectedDoctor.name}</h1>
                  <span className="px-2.5 py-0.5 text-xs font-bold bg-clinical-50 text-clinical-700 rounded-full border border-clinical-200">
                    {selectedDoctor.specialty}
                  </span>
                  {renderStatusBadge(selectedDoctor)}
                </div>
                <p className="text-xs text-ink-muted mt-0.5">
                  {selectedDoctor.qualification} · {selectedDoctor.experience_years || 8} years clinical experience
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                <label className="text-[11px] font-bold text-slate-500 uppercase px-1">Status:</label>
                <select
                  value={getDoctorStatusKey(selectedDoctor)}
                  onChange={(e) => handleStatusChange(selectedDoctor, e.target.value)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg border focus:outline-none cursor-pointer transition-colors ${
                    getDoctorStatusKey(selectedDoctor) === 'resigned'
                      ? 'bg-rose-50 text-rose-800 border-rose-300'
                      : getDoctorStatusKey(selectedDoctor) === 'unavailable'
                      ? 'bg-amber-50 text-amber-800 border-amber-300'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  }`}
                >
                  <option value="available">🟢 Available in OPD</option>
                  <option value="unavailable">🟡 Away / Off Duty</option>
                  <option value="resigned">🔴 Resigned / Left Hospital</option>
                </select>
              </div>

              <button
                onClick={(e) => handleOpenEditCreds(selectedDoctor, e)}
                className="px-4 py-2 text-xs font-bold bg-indigoConsole text-white rounded-xl hover:bg-indigo-900 shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <KeyRound className="w-4 h-4 text-amberState" />
                <span>Edit Login Credentials</span>
              </button>
            </div>

          </div>


          {/* Doctor KPI Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Consultation Fee</span>
              <span className="font-mono text-2xl font-bold text-ink block">₹{selectedDoctor.consultation_fee}</span>
              <span className="text-[11px] text-slate-500 font-medium">Payable at clinic desk</span>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Average Duration</span>
              <span className="font-mono text-2xl font-bold text-clinical-700 block">{selectedDoctor.avg_consult_minutes} mins</span>
              <span className="text-[11px] text-slate-500 font-medium">Per patient consultation</span>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">OPD Operating Hours</span>
              <span className="font-mono text-xl font-bold text-emerald-700 block">
                {selectedDoctor.available_from || '09:00'} - {selectedDoctor.available_to || '17:00'}
              </span>
              <span className="text-[11px] text-slate-500 font-medium">{selectedDoctor.available_days?.join(', ') || 'Mon-Fri'}</span>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Doctor Tokens</span>
              <span className="font-mono text-2xl font-bold text-amberState-dark block">{selectedDoctorTokens.length}</span>
              <span className="text-[11px] text-slate-500 font-medium">
                {selectedDoctorTokens.filter(t => t.status === 'done').length} Visits Completed
              </span>
            </div>
          </div>

          {/* Credentials Panel */}
          <div className="p-5 bg-indigo-50/80 border border-indigo-100 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-indigo-950 uppercase tracking-wider block mb-1 flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-indigoConsole" />
                <span>Doctor Desk Sign-In Credentials</span>
              </span>
              <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-indigo-900">
                <span>Username: <strong className="text-indigoConsole">{selectedDoctor.username || `DR_${selectedDoctor.name.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`}</strong></span>
                <span>Password: <strong>{selectedDoctor.password || 'doc123'}</strong></span>
              </div>
            </div>
            <button
              onClick={(e) => handleOpenEditCreds(selectedDoctor, e)}
              className="px-4 py-2 text-xs font-bold bg-white text-indigoConsole rounded-xl border border-indigo-200 hover:bg-indigo-50 shadow-xs shrink-0 cursor-pointer"
            >
              Update Password
            </button>
          </div>

          {/* Doctor Tokens List Table */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-display text-base font-bold text-ink flex items-center gap-2">
                <Ticket className="w-5 h-5 text-clinical-600" />
                <span>OPD Tokens Assigned to {selectedDoctor.name} ({selectedDoctorTokens.length})</span>
              </h3>
            </div>

            {selectedDoctorTokens.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                      <th className="p-3">Token #</th>
                      <th className="p-3">Patient Name</th>
                      <th className="p-3">Visit Date</th>
                      <th className="p-3">Queue Status</th>
                      <th className="p-3">Priority Tag</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-ink">
                    {selectedDoctorTokens.map((tok) => (
                      <tr key={tok.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-mono font-bold text-clinical-700 text-sm">
                          #{tok.token_number}
                        </td>
                        <td className="p-3 font-bold text-ink">
                          {tok.patient_name}
                        </td>
                        <td className="p-3 text-slate-600 font-semibold">
                          {tok.queue_date || 'Today'}
                        </td>
                        <td className="p-3">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold capitalize ${
                            tok.status === 'serving'
                              ? 'bg-amberState text-ink animate-pulse'
                              : tok.status === 'waiting'
                              ? 'bg-clinical-50 text-clinical-700 border border-clinical-200'
                              : tok.status === 'done'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {tok.status === 'serving' ? 'Now Serving' : tok.status === 'waiting' ? 'Waiting' : tok.status === 'done' ? 'Completed' : tok.status}
                          </span>
                        </td>
                        <td className="p-3">
                          {tok.is_priority ? (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded text-[10px] font-bold">
                              {tok.priority_reason || 'Priority'}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Regular</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-10 bg-slate-50/50 rounded-2xl border border-slate-100">
                <p className="text-xs text-ink-muted">No tokens found for {selectedDoctor.name}.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* 2. Doctor Roster Main Grid */
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 gap-3 sm:gap-4">
            <div>
              <h1 className="font-display text-xl sm:text-2xl font-bold text-ink">Doctor Roster & Login Credentials</h1>
              <p className="text-xs text-ink-muted">{currentHospital?.name} · Click any doctor card to view full details & queue</p>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="w-full sm:w-auto justify-center px-4 py-2.5 bg-[#0E7C86] hover:bg-clinical-600 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Doctor</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hospitalDoctors.map((doc) => {
              const cleanName = doc.name.replace(/^(Dr\.\s*)/i, '').trim();
              const username = doc.username || `DR_${cleanName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`;
              const password = doc.password || 'doc123';
              const docToks = tokens.filter(t => t.doctor_id === doc.id);

              return (
                <div
                  key={doc.id}
                  onClick={() => setSelectedDoctorId(doc.id)}
                  className="bg-white rounded-2xl border border-slate-200 hover:border-clinical-400 p-5 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer space-y-3 relative flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-display font-bold text-lg text-ink group-hover:text-clinical-600 transition-colors flex items-center gap-1.5">
                          <span>{doc.name}</span>
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-clinical-600 opacity-0 group-hover:opacity-100 transition-all" />
                        </h3>
                        <span className="px-2 py-0.5 text-[11px] font-semibold bg-clinical-50 text-clinical-700 rounded-md">
                          {doc.specialty}
                        </span>
                      </div>

                      {renderStatusBadge(doc)}
                    </div>

                    <p className="text-xs text-ink-muted">{doc.qualification} · {doc.experience_years || 8} yrs exp</p>

                    {/* Doctor Login Credentials Card Badge */}
                    <div className="p-3 bg-indigo-50/80 border border-indigo-100 rounded-xl space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-900 flex items-center gap-1">
                          <KeyRound className="w-3 h-3 text-indigoConsole" /> DOCTOR SIGN-IN ACCOUNT
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleOpenEditCreds(doc, e)}
                          className="text-[10px] font-bold text-indigoConsole hover:text-indigo-900 underline cursor-pointer"
                        >
                          Edit Password
                        </button>
                      </div>
                      <div className="text-xs font-mono text-slate-700 space-y-0.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-slate-500">Username:</span>
                          <strong className="text-indigoConsole font-bold">{username}</strong>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-slate-500">Password:</span>
                          <span className="text-slate-800 font-semibold">{password}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between">
                        <span>Consultation Fee:</span>
                        <strong className="text-ink font-bold">₹{doc.consultation_fee}</strong>
                      </div>

                      <div className="flex items-center justify-between">
                        <span>Average Consultation:</span>
                        <strong className="text-clinical-700">{doc.avg_consult_minutes} mins</strong>
                      </div>

                      <div className="flex items-center justify-between text-[11px]">
                        <span>OPD Hours:</span>
                        <span>{doc.available_from || '09:00'} - {doc.available_to || '17:00'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-clinical-600 group-hover:underline inline-flex items-center gap-1">
                      <span>Details & queue ({docToks.length})</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>

                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <label className="text-[10px] font-bold text-slate-400 uppercase hidden sm:inline">Status:</label>
                      <select
                        value={getDoctorStatusKey(doc)}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleStatusChange(doc, e.target.value);
                        }}
                        className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border focus:outline-none cursor-pointer transition-colors ${
                          getDoctorStatusKey(doc) === 'resigned'
                            ? 'bg-rose-50 text-rose-800 border-rose-300 font-bold'
                            : getDoctorStatusKey(doc) === 'unavailable'
                            ? 'bg-amber-50 text-amber-800 border-amber-300 font-bold'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold'
                        }`}
                      >
                        <option value="available">🟢 Available</option>
                        <option value="unavailable">🟡 Away</option>
                        <option value="resigned">🔴 Resigned</option>
                      </select>
                    </div>
                  </div>


                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Doctor Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="p-2 bg-clinical-50 text-clinical-700 rounded-xl">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-ink">Add Doctor & Set Password</h3>
                <p className="text-xs text-ink-muted">Set up doctor OPD details and sign-in credentials</p>
              </div>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Doctor Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Siddharth Varma"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-clinical-500"
                />
              </div>

              {/* Doctor Credentials Fields */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                  <KeyRound className="w-3.5 h-3.5 text-clinical-600" /> Doctor Login Credentials
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Doctor Username</label>
                    <input
                      type="text"
                      placeholder="e.g. DR_SIDDHARTH"
                      value={form.username}
                      onChange={(e) => setForm({ ...form, username: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-clinical-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Doctor Password</label>
                    <input
                      type="text"
                      placeholder="e.g. doc123"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-clinical-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Specialty</label>
                  <select
                    value={form.specialty}
                    onChange={(e) => setForm({ ...form, specialty: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-clinical-500"
                  >
                    <option value="General Physician">General Physician</option>
                    <option value="Pediatrics">Pediatrics</option>
                    <option value="Dermatology">Dermatology</option>
                    <option value="Dental">Dental</option>
                    <option value="ENT">ENT</option>
                    <option value="Gynaecology">Gynaecology</option>
                    <option value="Cardiology">Cardiology</option>
                    <option value="Orthopedics">Orthopedics</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Fee (₹)</label>
                  <input
                    type="number"
                    required
                    value={form.consultation_fee}
                    onChange={(e) => setForm({ ...form, consultation_fee: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-clinical-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Qualification</label>
                <input
                  type="text"
                  placeholder="e.g. MS (Ortho), Fellowship"
                  value={form.qualification}
                  onChange={(e) => setForm({ ...form, qualification: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-clinical-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-[#0E7C86] hover:bg-clinical-600 text-white rounded-xl shadow-sm"
                >
                  Save Doctor Roster
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Doctor Credentials Modal */}
      {editingCredsDoctor && (
        <div className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="p-2 bg-indigoConsole-light text-indigoConsole rounded-xl">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display text-base font-bold text-ink">Edit Doctor Sign-In Credentials</h3>
                <p className="text-xs text-slate-500">{editingCredsDoctor.name}</p>
              </div>
            </div>

            <form onSubmit={handleSaveCreds} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Doctor Login Username / ID</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. DR_MEERA_RAO"
                  value={credsForm.username}
                  onChange={(e) => setCredsForm({ ...credsForm, username: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigoConsole font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Doctor Password</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. doc123"
                  value={credsForm.password}
                  onChange={(e) => setCredsForm({ ...credsForm, password: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigoConsole font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingCredsDoctor(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-indigoConsole hover:bg-indigo-900 text-white rounded-xl shadow-sm"
                >
                  Save Credentials
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
