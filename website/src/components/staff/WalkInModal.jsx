import React, { useState } from 'react';
import { UserPlus, Ticket, ShieldAlert, Calendar } from 'lucide-react';
import { useQueue } from '../../context/QueueContext';

export default function WalkInModal({ hospitalId, doctors, onClose }) {
  const { issueToken } = useQueue();

  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowObj = new Date();
  tomorrowObj.setDate(tomorrowObj.getDate() + 1);
  const tomorrowStr = tomorrowObj.toISOString().split('T')[0];

  const [selectedDoctorId, setSelectedDoctorId] = useState(doctors[0]?.id || '');
  const [patientName, setPatientName] = useState('');
  const [isPriority, setIsPriority] = useState(false);
  const [priorityReason, setPriorityReason] = useState('Walk-in Senior Citizen');
  const [bookingDate, setBookingDate] = useState(todayStr);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!patientName || !selectedDoctorId) return;

    issueToken({
      hospitalId,
      doctorId: selectedDoctorId,
      patientId: `walkin-${Date.now()}`,
      patientName: `${patientName} (Walk-In)`,
      isPriority,
      priorityReason: isPriority ? priorityReason : '',
      bookingDate: bookingDate,
      bookingType: bookingDate === todayStr ? 'on_the_spot' : 'scheduled'
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <div className="p-2 bg-clinical-50 text-clinical-700 rounded-xl">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-ink">Register Walk-In Patient</h3>
            <p className="text-xs text-ink-muted">Issue instant or advance OPD token for reception</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Patient Full Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Ramesh Chandra"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-clinical-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Assign Doctor</label>
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-clinical-500"
            >
              {doctors.map(d => (
                <option key={d.id} value={d.id}>
                  {d.name} — {d.specialty} (₹{d.consultation_fee})
                </option>
              ))}
            </select>
          </div>

          {/* Visit Date Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-clinical-600" />
              <span>Token Visit Date</span>
            </label>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <button
                type="button"
                onClick={() => setBookingDate(todayStr)}
                className={`py-1.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                  bookingDate === todayStr
                    ? 'bg-clinical-600 text-white border-clinical-600'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                ⚡ Today
              </button>
              <button
                type="button"
                onClick={() => setBookingDate(tomorrowStr)}
                className={`py-1.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                  bookingDate === tomorrowStr
                    ? 'bg-clinical-600 text-white border-clinical-600'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                📅 Tomorrow (Next Day)
              </button>
            </div>
            <input
              type="date"
              min={todayStr}
              value={bookingDate}
              onChange={(e) => setBookingDate(e.target.value)}
              className="w-full px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-clinical-500"
            />
          </div>


          <div className="p-3 bg-amberState/10 border border-amberState/30 rounded-xl space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isPriority}
                onChange={(e) => setIsPriority(e.target.checked)}
                className="w-4 h-4 text-amberState rounded focus:ring-amberState"
              />
              <span className="text-xs font-bold text-ink flex items-center gap-1">
                <ShieldAlert className="w-4 h-4 text-amberState" />
                Senior Citizen / Priority Emergency
              </span>
            </label>

            {isPriority && (
              <input
                type="text"
                value={priorityReason}
                onChange={(e) => setPriorityReason(e.target.value)}
                placeholder="Reason for priority access..."
                className="w-full px-3 py-1.5 text-xs border border-amberState/40 rounded-lg bg-white font-medium focus:outline-none"
              />
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold bg-[#0E7C86] hover:bg-clinical-600 text-white rounded-xl shadow-sm flex items-center gap-1.5"
            >
              <Ticket className="w-4 h-4" />
              <span>Issue Walk-In Token</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
