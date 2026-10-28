import React, { useState } from 'react';
import { Building2, Clock, Calendar, Phone, MapPin, CheckCircle2, ShieldCheck, X, AlertTriangle, FileText, Camera } from 'lucide-react';
import { useQueue, formatTimeAMPM } from '../../context/QueueContext';

// Helper to parse 24hr format string ('20:00') into 12hr parts
const parseTime24To12 = (time24Str) => {
  if (!time24Str) return { hour12: '08', minute: '00', ampm: 'AM' };
  const [hStr, mStr] = time24Str.split(':');
  let h = parseInt(hStr, 10);
  if (isNaN(h)) return { hour12: '08', minute: '00', ampm: 'AM' };
  const minute = mStr || '00';
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  const hour12 = String(h).padStart(2, '0');
  return { hour12, minute, ampm };
};

// Helper to convert 12hr parts into 24hr format string ('20:00')
const formatTime12To24 = (hour12, minute, ampm) => {
  let h = parseInt(hour12, 10);
  if (isNaN(h)) h = 8;
  if (ampm === 'PM' && h < 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  const h24 = String(h).padStart(2, '0');
  const m = String(minute).padStart(2, '0');
  return `${h24}:${m}`;
};

// Interactive 12-Hour AM/PM Time Selector Component
function TimePicker12Hour({ value, onChange, label }) {
  const { hour12, minute, ampm } = parseTime24To12(value);

  const hoursList = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
  const minutesList = ['00', '15', '30', '45'];

  const handleHour = (newH) => onChange(formatTime12To24(newH, minute, ampm));
  const handleMin = (newM) => onChange(formatTime12To24(hour12, newM, ampm));
  const handleAmPm = (newAmPm) => onChange(formatTime12To24(hour12, minute, newAmPm));

  return (
    <div className="space-y-1">
      {label && <label className="block font-semibold text-slate-700 text-xs mb-1">{label}</label>}
      <div className="flex items-center gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded-2xl">
        {/* Hour Dropdown */}
        <select
          value={hour12}
          onChange={(e) => handleHour(e.target.value)}
          className="px-2.5 py-1.5 text-xs font-bold bg-white text-ink border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-clinical-500 cursor-pointer"
        >
          {hoursList.map(h => (
            <option key={h} value={h}>{h}</option>
          ))}
        </select>

        <span className="font-bold text-slate-400 text-sm">:</span>

        {/* Minute Dropdown */}
        <select
          value={minute}
          onChange={(e) => handleMin(e.target.value)}
          className="px-2.5 py-1.5 text-xs font-bold bg-white text-ink border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-clinical-500 cursor-pointer"
        >
          {minutesList.map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>

        {/* AM / PM Toggle Buttons */}
        <div className="flex items-center p-1 bg-slate-200/80 rounded-xl ml-1">
          <button
            type="button"
            onClick={() => handleAmPm('AM')}
            className={`px-3 py-1 text-xs font-black rounded-lg transition-all cursor-pointer ${
              ampm === 'AM'
                ? 'bg-[#0E7C86] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            AM
          </button>
          <button
            type="button"
            onClick={() => handleAmPm('PM')}
            className={`px-3 py-1 text-xs font-black rounded-lg transition-all cursor-pointer ${
              ampm === 'PM'
                ? 'bg-[#0E7C86] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            PM
          </button>
        </div>

        {/* Live Formatted Output Badge */}
        <span className="text-xs font-bold text-clinical-700 bg-clinical-50 px-2.5 py-1 rounded-xl border border-clinical-200 ml-auto shrink-0">
          {formatTimeAMPM(value)}
        </span>
      </div>
    </div>
  );
}

export default function HospitalProfileModal({ hospital, onClose }) {
  const { updateHospitalProfile, deleteHospital } = useQueue();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [form, setForm] = useState({
    name: hospital?.name || '',
    type: hospital?.type || 'clinic',
    address: hospital?.address || '',
    phone: hospital?.phone || '',
    emergency_contact: hospital?.emergency_contact || '',
    clinical_license: hospital?.clinical_license || '',
    license_proof_file: hospital?.license_proof_file || 'Clinical_License_CEA2026.pdf',
    license_proof_url: hospital?.license_proof_url || '',
    council_reg: hospital?.council_reg || '',
    council_proof_file: hospital?.council_proof_file || 'Medical_Council_Registration_Cert.pdf',
    council_proof_url: hospital?.council_proof_url || '',
    photo_url: hospital?.photo_url || 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=800&q=80',
    open_time: hospital?.open_time || '08:00',
    close_time: hospital?.close_time || '20:00',
    closed_days: hospital?.closed_days || ['Sun'],
    closed_from: hospital?.closed_from || '',
    closed_to: hospital?.closed_to || '',
    closure_reason: hospital?.closure_reason || '',
    is_24_7: hospital?.is_24_7 || false,
    is_open: hospital?.is_open !== false
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  const daysOfWeek = [
    { key: 'Mon', label: 'Monday' },
    { key: 'Tue', label: 'Tuesday' },
    { key: 'Wed', label: 'Wednesday' },
    { key: 'Thu', label: 'Thursday' },
    { key: 'Fri', label: 'Friday' },
    { key: 'Sat', label: 'Saturday' },
    { key: 'Sun', label: 'Sunday' }
  ];

  const handleDayToggle = (dayKey) => {
    setForm(prev => {
      const exists = prev.closed_days.includes(dayKey);
      const updated = exists
        ? prev.closed_days.filter(d => d !== dayKey)
        : [...prev.closed_days, dayKey];
      return { ...prev, closed_days: updated };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!hospital || !form.name) return;

    updateHospitalProfile(hospital.id, {
      name: form.name.trim(),
      type: form.type,
      address: form.address.trim(),
      phone: form.phone.trim(),
      emergency_contact: form.emergency_contact.trim(),
      clinical_license: form.clinical_license.trim(),
      license_proof_file: form.license_proof_file,
      license_proof_url: form.license_proof_url,
      council_reg: form.council_reg.trim(),
      council_proof_file: form.council_proof_file,
      photo_url: (() => {
        const raw = form.photo_url || '';
        if (raw.includes('google.com/imgres') || raw.includes('imgurl=')) {
          const match = raw.match(/[?&]imgurl=([^&]+)/);
          if (match && match[1]) return decodeURIComponent(match[1]);
        }
        if (raw.includes('google.com/url?') && raw.includes('url=')) {
          const match = raw.match(/[?&]url=([^&]+)/);
          if (match && match[1]) return decodeURIComponent(match[1]);
        }
        return raw;
      })(),
      open_time: form.open_time,
      close_time: form.close_time,
      closed_days: form.closed_days,
      closed_from: form.closed_from,
      closed_to: form.closed_to,
      closure_reason: form.closure_reason.trim(),
      is_24_7: form.is_24_7,
      is_open: form.is_open
    });

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      if (onClose) onClose();
    }, 1200);
  };

  if (!hospital) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 border border-slate-200 relative my-8 max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="p-3 bg-clinical-50 text-clinical-700 rounded-2xl border border-clinical-100">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-ink">Hospital Facility Profile & OPD Schedule</h2>
            <p className="text-xs text-ink-muted mt-0.5">Manage opening/closing hours, closed days, cover photo & licenses</p>
          </div>
        </div>

        {savedSuccess && (
          <div className="p-4 bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold rounded-2xl flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>Hospital Facility Profile & Operating Schedule Updated Successfully!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 text-xs">

          {/* Section 1: Facility Information & Cover Image */}
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-clinical-600" />
              <span>Facility Information & Cover Photo</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Facility Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-clinical-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Facility Category *</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-clinical-500 font-medium bg-white"
                >
                  <option value="clinic">Outpatient Clinic / Polyclinic</option>
                  <option value="hospital">Multispecialty Hospital</option>
                  <option value="diagnostic_center">Diagnostic & Care Centre</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Full Clinic Address & Pin Code *</label>
              <input
                type="text"
                required
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-clinical-500 font-medium"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Contact Phone Number</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-clinical-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Emergency 24/7 Helpline</label>
                <input
                  type="text"
                  value={form.emergency_contact}
                  onChange={(e) => setForm({ ...form, emergency_contact: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-clinical-500 font-medium"
                />
              </div>
            </div>

            {/* Cover Image Upload File OR Enter Web URL */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="block font-semibold text-slate-700 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-clinical-600" />
                <span>Hospital Cover Photo (Upload File or Enter Web URL)</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="text-[11px] font-semibold text-slate-600 block">📁 Upload Image File:</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setForm({ ...form, photo_url: reader.result });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="w-full text-[11px] text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-clinical-50 file:text-clinical-700 hover:file:bg-clinical-100 cursor-pointer"
                  />
                </div>

                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="text-[11px] font-semibold text-slate-600 block">🔗 Or Enter Image Web URL:</span>
                  <input
                    type="text"
                    placeholder="https://images.unsplash.com/..."
                    value={form.photo_url}
                    onChange={(e) => setForm({ ...form, photo_url: e.target.value })}
                    className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-clinical-500 font-medium"
                  />
                </div>
              </div>

              {form.photo_url && (
                <div className="relative h-28 w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-100 mt-2">
                  <img
                    src={form.photo_url}
                    alt="Hospital Cover Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=800&q=80";
                    }}
                  />
                  <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-slate-900/80 text-white font-bold text-[10px] rounded backdrop-blur-md">
                    Live Photo Preview
                  </span>
                </div>
              )}
            </div>
          </div>


          {/* Section 2: OPD Operating Hours & Weekly Closed Days */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="font-bold text-sm text-slate-800 border-b border-slate-100 pb-2 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-clinical-600" />
                <span>OPD Operating Hours & Weekly Closed Days</span>
              </span>
              <span className="text-xs text-clinical-700 font-bold bg-clinical-50 px-2.5 py-0.5 rounded-full border border-clinical-200">
                Hours: {formatTimeAMPM(form.open_time)} – {formatTimeAMPM(form.close_time)}
              </span>
            </h3>

            {/* Interactive 12-Hour AM/PM Time Pickers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TimePicker12Hour
                label="Daily Opening Time (AM / PM)"
                value={form.open_time}
                onChange={(newTime24) => setForm({ ...form, open_time: newTime24 })}
              />

              <TimePicker12Hour
                label="Daily Closing Time (AM / PM)"
                value={form.close_time}
                onChange={(newTime24) => setForm({ ...form, close_time: newTime24 })}
              />
            </div>

            {/* Weekly Closed Days Checkboxes */}
            <div>
              <label className="block font-semibold text-slate-700 mb-2">Select Days When Hospital / Clinic is CLOSED:</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {daysOfWeek.map(d => {
                  const isClosed = form.closed_days.includes(d.key);
                  return (
                    <button
                      type="button"
                      key={d.key}
                      onClick={() => handleDayToggle(d.key)}
                      className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                        isClosed
                          ? 'bg-rose-50 border-rose-300 text-rose-800 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span>{d.label}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        isClosed ? 'bg-rose-200 text-rose-900' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {isClosed ? 'CLOSED' : 'Open'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>


          {/* Section 3: Temporary Date-to-Date Calendar Closure */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="font-bold text-sm text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-rose-600" />
              <span>Temporary Date Range Closure (Calendar Date-to-Date)</span>
            </h3>

            <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-2xl text-[11px] text-rose-900 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>
                Set a specific date range (e.g., from 13-08-2026 to 16-08-2026 for renovations or holidays). During these dates, the hospital will show <strong>CLOSED TODAY</strong> and block OPD token bookings.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Closed From Date</label>
                <input
                  type="date"
                  value={form.closed_from}
                  onChange={(e) => setForm({ ...form, closed_from: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Closed Until Date</label>
                <input
                  type="date"
                  value={form.closed_to}
                  onChange={(e) => setForm({ ...form, closed_to: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Temporary Closure Reason</label>
              <input
                type="text"
                placeholder="e.g. Facility Renovations, Doctor Annual Leave, Public Holiday..."
                value={form.closure_reason}
                onChange={(e) => setForm({ ...form, closure_reason: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium"
              />
            </div>

            {/* Emergency & Open Status Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_24_7}
                  onChange={(e) => setForm({ ...form, is_24_7: e.target.checked })}
                  className="w-4 h-4 text-clinical-600 rounded focus:ring-clinical-500"
                />
                <div>
                  <span className="font-bold text-slate-800 block text-xs">Emergency 24/7 Facility</span>
                  <span className="text-[10px] text-slate-500">Operates round-the-clock for emergency trauma</span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_open}
                  onChange={(e) => setForm({ ...form, is_open: e.target.checked })}
                  className="w-4 h-4 text-clinical-600 rounded focus:ring-clinical-500"
                />
                <div>
                  <span className="font-bold text-slate-800 block text-xs">Facility Currently Operational</span>
                  <span className="text-[10px] text-slate-500">Uncheck to mark hospital temporarily closed</span>
                </div>
              </label>
            </div>
          </div>

          {/* Section 4: Danger Zone - Permanent Hospital Deletion */}
          <div className="p-4 bg-rose-50/80 border border-rose-200 rounded-2xl space-y-3 mt-6">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h4 className="font-bold text-rose-900 text-xs flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>Permanently Close & Delete Hospital Facility</span>
                </h4>
                <p className="text-[11px] text-rose-700 mt-0.5">
                  If this hospital is permanently closing, the owner can remove it completely from patient discovery and staff dashboard.
                </p>
              </div>
              {!showDeleteConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs shrink-0 cursor-pointer transition-colors"
                >
                  🗑️ Delete Hospital
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      deleteHospital(hospital.id);
                      if (onClose) onClose();
                    }}
                    className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white font-black text-xs rounded-xl shadow-md shrink-0 cursor-pointer animate-pulse"
                  >
                    Confirm Delete Facility
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {showDeleteConfirm && (
              <div className="p-3 bg-rose-100 border border-rose-300 rounded-xl text-xs text-rose-900 font-semibold animate-in fade-in">
                ⚠️ Warning: Deleting "{hospital.name}" will remove it from all patient feeds and active staff consoles. Owner records will be preserved for audit logs.
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 text-xs font-bold bg-[#0E7C86] hover:bg-clinical-600 text-white rounded-xl shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Save Operating Schedule & Profile</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
