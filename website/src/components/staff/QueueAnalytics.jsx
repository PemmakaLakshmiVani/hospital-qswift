import React, { useState } from 'react';
import { TrendingUp, Users, Clock, ShieldAlert, CheckCircle2, UserX, Calendar, Filter, Stethoscope, Ticket, Search, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useQueue } from '../../context/QueueContext';

export default function QueueAnalytics() {
  const { staffHospitalId } = useAuth();
  const { hospitals, doctors, tokens } = useQueue();

  const todayStr = new Date().toISOString().split('T')[0];
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  // Filter States
  const [dateMode, setDateMode] = useState('all'); // 'all' | 'today' | 'yesterday' | 'custom'
  const [customDate, setCustomDate] = useState(todayStr);
  const [selectedDoctorId, setSelectedDoctorId] = useState('all');
  const [activeMetric, setActiveMetric] = useState('total'); // 'total' | 'completed' | 'priority' | 'noshow'
  const [searchTerm, setSearchTerm] = useState('');

  const currentHospital = hospitals.find(h => h.id === staffHospitalId) || hospitals[0];
  const hospitalDoctors = doctors.filter(d => d.hospital_id === currentHospital.id);
  const hospitalTokens = tokens.filter(t => t.hospital_id === currentHospital.id);

  // 1. Date & Doctor Scope Filtering
  const scopedTokens = hospitalTokens.filter(t => {
    // Filter by Doctor
    if (selectedDoctorId !== 'all' && t.doctor_id !== selectedDoctorId) {
      return false;
    }

    // Filter by Date
    if (dateMode === 'today') {
      return t.queue_date === todayStr || !t.queue_date;
    }
    if (dateMode === 'yesterday') {
      return t.queue_date === yesterdayStr;
    }
    if (dateMode === 'custom') {
      return t.queue_date === customDate;
    }
    return true; // 'all'
  });

  // 2. Dynamic KPI Calculations based on scopedTokens
  const totalPatients = scopedTokens.length;
  const completed = scopedTokens.filter(t => t.status === 'done').length;
  const waiting = scopedTokens.filter(t => t.status === 'waiting').length;
  const noShows = scopedTokens.filter(t => t.status === 'no_show' || t.status === 'cancelled').length;
  const priorityCount = scopedTokens.filter(t => t.is_priority).length;

  // 3. Metric & Search Filtering for Detailed Table
  const detailedTokens = scopedTokens.filter(t => {
    // Metric filter
    if (activeMetric === 'completed' && t.status !== 'done') return false;
    if (activeMetric === 'priority' && !t.is_priority) return false;
    if (activeMetric === 'noshow' && t.status !== 'no_show' && t.status !== 'cancelled') return false;

    // Search query filter
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const doc = doctors.find(d => d.id === t.doctor_id);
      const isMatch =
        t.patient_name?.toLowerCase().includes(q) ||
        t.token_number?.toString().includes(q) ||
        doc?.name?.toLowerCase().includes(q) ||
        doc?.specialty?.toLowerCase().includes(q) ||
        t.queue_date?.includes(q) ||
        t.priority_reason?.toLowerCase().includes(q);
      if (!isMatch) return false;
    }
    return true;
  });

  const getMetricTitle = () => {
    switch (activeMetric) {
      case 'completed': return 'Completed Visits';
      case 'priority': return 'Priority Cases (Senior Citizens & Emergency)';
      case 'noshow': return 'No-Shows & Cancelled Tokens';
      default: return 'Total Tokens Issued';
    }
  };

  const getDateLabel = () => {
    if (dateMode === 'today') return `Today (${todayStr})`;
    if (dateMode === 'yesterday') return `Yesterday (${yesterdayStr})`;
    if (dateMode === 'custom') return `Selected Date (${customDate})`;
    return 'All Time History';
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6 overflow-x-hidden w-full max-w-full">
      {/* Page Title & Context Header */}
      <div className="border-b border-slate-200 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">OPD Performance & Queue Reports</h1>
          <p className="text-xs text-ink-muted">{currentHospital?.name} · Filter statistics by date, doctor, or search query</p>
        </div>
      </div>

      {/* Date & Search Filter Control Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Calendar & Date Pills Selector */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1 mr-1">
              <Calendar className="w-4 h-4 text-clinical-600" />
              <span>Date Scope:</span>
            </span>

            <button
              onClick={() => setDateMode('all')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                dateMode === 'all'
                  ? 'bg-clinical-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All Dates
            </button>

            <button
              onClick={() => setDateMode('today')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1 ${
                dateMode === 'today'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>⚡ Today</span>
            </button>

            <button
              onClick={() => setDateMode('yesterday')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1 ${
                dateMode === 'yesterday'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>📅 Yesterday</span>
            </button>

            {/* Custom Date Input */}
            <div className="flex items-center gap-1.5 pl-1 border-l border-slate-200">
              <label className="text-xs font-semibold text-slate-500">Pick Date:</label>
              <input
                type="date"
                value={customDate}
                onChange={(e) => {
                  setCustomDate(e.target.value);
                  setDateMode('custom');
                }}
                className={`px-2.5 py-1 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                  dateMode === 'custom'
                    ? 'bg-clinical-50 text-clinical-800 border-clinical-500 ring-2 ring-clinical-500/20'
                    : 'bg-white text-ink border-slate-200 hover:border-slate-300'
                }`}
              />
            </div>
          </div>

          {/* Doctor Filter & Patient/Doctor Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {/* Doctor Filter Dropdown */}
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1">
              <Stethoscope className="w-3.5 h-3.5 text-clinical-600 shrink-0" />
              <select
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                className="bg-transparent text-xs font-semibold text-ink focus:outline-none cursor-pointer"
              >
                <option value="all">All Doctors ({hospitalDoctors.length})</option>
                {hospitalDoctors.map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.specialty})</option>
                ))}
              </select>
            </div>

            {/* Search Input for Patient or Doctor */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search patient, doctor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-8 py-1.5 text-xs font-medium border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-clinical-500 bg-white"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Active Filter Scope Summary Badge */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
          <div>
            <span>Viewing stats for: <strong className="text-ink">{getDateLabel()}</strong></span>
            {selectedDoctorId !== 'all' && (
              <span> · Doctor: <strong className="text-clinical-700">{doctors.find(d => d.id === selectedDoctorId)?.name}</strong></span>
            )}
          </div>
          <span className="text-[11px] font-semibold text-clinical-600 bg-clinical-50 px-2.5 py-0.5 rounded-full border border-clinical-100">
            Click any metric card below to filter token table ↓
          </span>
        </div>
      </div>

      {/* Interactive KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Total Tokens */}
        <div
          onClick={() => setActiveMetric('total')}
          className={`cursor-pointer rounded-2xl p-5 border transition-all duration-200 shadow-sm relative overflow-hidden group ${
            activeMetric === 'total'
              ? 'bg-clinical-50/80 border-clinical-500 ring-2 ring-clinical-500/20 shadow-md'
              : 'bg-white border-slate-200 hover:border-clinical-300 hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between text-clinical-600">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Tokens Issued</span>
            <Users className="w-5 h-5 text-clinical-600" />
          </div>
          <p className="font-mono text-3xl font-bold text-ink mt-2">{totalPatients}</p>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
            <span className="text-[11px] text-emerald-600 font-semibold">Scope: {dateMode.toUpperCase()}</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${activeMetric === 'total' ? 'bg-clinical-600 text-white' : 'bg-slate-100 text-slate-600 group-hover:bg-clinical-50'}`}>
              {activeMetric === 'total' ? 'Active Filter ✓' : 'View Details →'}
            </span>
          </div>
        </div>

        {/* Card 2: Completed Visits */}
        <div
          onClick={() => setActiveMetric('completed')}
          className={`cursor-pointer rounded-2xl p-5 border transition-all duration-200 shadow-sm relative overflow-hidden group ${
            activeMetric === 'completed'
              ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20 shadow-md'
              : 'bg-white border-slate-200 hover:border-emerald-300 hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between text-emerald-600">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Completed Visits</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="font-mono text-3xl font-bold text-emerald-700 mt-2">{completed}</p>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
            <span className="text-[11px] text-slate-500 font-medium">Avg duration ~14m</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${activeMetric === 'completed' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 group-hover:bg-emerald-50'}`}>
              {activeMetric === 'completed' ? 'Active Filter ✓' : 'View Details →'}
            </span>
          </div>
        </div>

        {/* Card 3: Priority Cases */}
        <div
          onClick={() => setActiveMetric('priority')}
          className={`cursor-pointer rounded-2xl p-5 border transition-all duration-200 shadow-sm relative overflow-hidden group ${
            activeMetric === 'priority'
              ? 'bg-amber-50/80 border-amberState ring-2 ring-amberState/20 shadow-md'
              : 'bg-white border-slate-200 hover:border-amberState/60 hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between text-amberState-dark">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Priority Cases</span>
            <ShieldAlert className="w-5 h-5 text-amberState" />
          </div>
          <p className="font-mono text-3xl font-bold text-amberState-dark mt-2">{priorityCount}</p>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
            <span className="text-[11px] text-slate-500 font-medium">Senior & Emergency</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${activeMetric === 'priority' ? 'bg-amberState text-ink font-bold' : 'bg-slate-100 text-slate-600 group-hover:bg-amber-50'}`}>
              {activeMetric === 'priority' ? 'Active Filter ✓' : 'View Details →'}
            </span>
          </div>
        </div>

        {/* Card 4: No-Show & Cancelled */}
        <div
          onClick={() => setActiveMetric('noshow')}
          className={`cursor-pointer rounded-2xl p-5 border transition-all duration-200 shadow-sm relative overflow-hidden group ${
            activeMetric === 'noshow'
              ? 'bg-rose-50/80 border-rose-500 ring-2 ring-rose-500/20 shadow-md'
              : 'bg-white border-slate-200 hover:border-rose-300 hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between text-rose-600">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">No-Show & Cancelled</span>
            <UserX className="w-5 h-5 text-rose-600" />
          </div>
          <p className="font-mono text-3xl font-bold text-rose-700 mt-2">{noShows}</p>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
            <span className="text-[11px] text-slate-500 font-medium">{totalPatients ? Math.round((noShows / totalPatients) * 100) : 0}% rate</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${activeMetric === 'noshow' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600 group-hover:bg-rose-50'}`}>
              {activeMetric === 'noshow' ? 'Active Filter ✓' : 'View Details →'}
            </span>
          </div>
        </div>
      </div>

      {/* Detailed Token Breakdown Table Section */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <Ticket className="w-5 h-5 text-clinical-600" />
            <div>
              <h3 className="font-display text-lg font-bold text-ink">
                {getMetricTitle()} ({detailedTokens.length})
              </h3>
              <p className="text-xs text-ink-muted">
                Displaying token records for <strong>{getDateLabel()}</strong>
                {searchTerm && ` matching "${searchTerm}"`}
              </p>
            </div>
          </div>
        </div>

        {/* Tokens Data Table */}
        {detailedTokens.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <th className="p-3">Token #</th>
                  <th className="p-3">Patient Name</th>
                  <th className="p-3">Doctor / Specialty</th>
                  <th className="p-3">Visit Date</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Priority Tag</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-ink">
                {detailedTokens.map((tok) => {
                  const doc = doctors.find(d => d.id === tok.doctor_id);
                  const isToday = tok.queue_date === todayStr || !tok.queue_date;

                  return (
                    <tr key={tok.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-mono font-bold text-clinical-700 text-sm">
                        #{tok.token_number}
                      </td>
                      <td className="p-3 font-bold text-ink">
                        {tok.patient_name}
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-ink flex items-center gap-1">
                          <Stethoscope className="w-3.5 h-3.5 text-clinical-600" />
                          <span>{doc?.name || 'Doctor'}</span>
                        </div>
                        <span className="text-[10px] text-ink-muted">{doc?.specialty}</span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                          isToday ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        }`}>
                          {isToday ? '⚡ Today' : tok.queue_date}
                        </span>
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
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded text-[10px] font-bold flex items-center gap-1 w-fit">
                            <ShieldAlert className="w-3 h-3 text-amberState-dark" />
                            <span>{tok.priority_reason || 'Priority'}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Regular</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-2">
            <p className="text-xs text-ink-muted font-semibold">No tokens match the selected date or search filter.</p>
            <p className="text-[11px] text-slate-400">
              Try switching the Date Scope to "All Dates" or clearing the search query.
            </p>
          </div>
        )}
      </div>

      {/* Visual OPD Efficiency Indicator */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h3 className="font-display text-base font-bold text-ink flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-clinical-600" />
          <span>Patient Waiting Room Reduction Metric</span>
        </h3>
        
        <p className="text-xs text-ink-muted">
          Hospital Qswift OPD remote token scheduling has saved patients an estimated <strong>{completed * 45} minutes</strong> of physical waiting room crowding today.
        </p>

        <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden flex">
          <div className="bg-emerald-500 h-full" style={{ width: `${totalPatients ? (completed / totalPatients) * 100 : 50}%` }} title="Completed"></div>
          <div className="bg-amberState h-full" style={{ width: `${totalPatients ? (waiting / totalPatients) * 100 : 30}%` }} title="Waiting"></div>
          <div className="bg-rose-400 h-full" style={{ width: `${totalPatients ? (noShows / totalPatients) * 100 : 20}%` }} title="No Shows"></div>
        </div>

        <div className="flex justify-between text-xs text-slate-600 font-semibold pt-1">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Completed ({completed})</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amberState"></span> Currently Waiting ({waiting})</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span> No Shows ({noShows})</span>
        </div>
      </div>
    </div>
  );
}
