import React, { useState } from 'react';
import {
  ArrowLeft,
  Star,
  MapPin,
  Phone,
  Clock,
  Stethoscope,
  Ticket,
  UserCheck,
  ShieldAlert,
  CheckCircle2,
  Calendar,
  DollarSign,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useQueue } from '../../context/QueueContext';

export default function HospitalDetail({ hospital, onBack, onTokenCreated, onRequireLogin }) {
  const { isAuthenticated, user, activeFamilyMember, familyMembers, setActiveFamilyMemberId } = useAuth();
  const { doctors, getDoctorQueueStats, issueToken, reviews, isDoctorOnLeave, getDoctorLeaveDetails, isHospitalClosedOnDate, isHospitalCurrentlyOpen, formatTimeAMPM } = useQueue();

  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [isPriorityBooking, setIsPriorityBooking] = useState(false);
  const [priorityReason, setPriorityReason] = useState('Senior Citizen');
  const [activeTab, setActiveTab] = useState('doctors'); // 'doctors' | 'reviews'

  const todayStr = new Date().toISOString().split('T')[0];
  const isOpenNow = isHospitalCurrentlyOpen(hospital);
  const isClosedToday = isHospitalClosedOnDate(hospital, todayStr);
  const tomorrowObj = new Date();
  tomorrowObj.setDate(tomorrowObj.getDate() + 1);
  const tomorrowStr = tomorrowObj.toISOString().split('T')[0];

  const [bookingDate, setBookingDate] = useState(todayStr);

  const getUpcomingDays = (count = 7) => {
    const days = [];
    const baseDate = new Date();
    for (let i = 0; i < count; i++) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short' });
      const dayNum = d.getDate();
      const monthName = d.toLocaleDateString('en-US', { month: 'short' });
      days.push({ dateStr, dayName, dayNum, monthName });
    }
    return days;
  };
  const upcomingDays = getUpcomingDays(7);

  // Active doctors for this hospital (excluding resigned doctors from patient view)
  const hospitalDoctors = doctors.filter(d => d.hospital_id === hospital.id && !d.is_resigned && d.status !== 'resigned');


  // Reviews for this hospital
  const hospitalReviews = reviews.filter(r => r.hospital_id === hospital.id);

  const handleOpenTokenModal = (doc) => {
    if (!isAuthenticated) {
      if (onRequireLogin) onRequireLogin();
      return;
    }
    setSelectedDoctor(doc);
    setBookingDate(todayStr);
    setShowTokenModal(true);
  };

  const handleConfirmTokenBooking = () => {
    if (!selectedDoctor) return;

    const token = issueToken({
      hospitalId: hospital.id,
      doctorId: selectedDoctor.id,
      patientId: user?.id || 'user-patient-demo',
      patientName: activeFamilyMember.full_name,
      familyMemberId: activeFamilyMember.id,
      isPriority: isPriorityBooking,
      priorityReason: isPriorityBooking ? priorityReason : '',
      bookingDate: bookingDate,
      bookingType: bookingDate === todayStr ? 'on_the_spot' : 'scheduled'
    });

    setShowTokenModal(false);
    onTokenCreated(token);
  };


  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Back Button & Header Navigation */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-ink hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Hospitals</span>
      </button>

      {/* Hospital Banner & Cover Image */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="relative h-64 sm:h-72 w-full bg-slate-100">
          <img
            src={(() => {
              const raw = hospital.photo_url;
              if (!raw) return "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=1200&q=80";
              if (raw.includes('google.com/imgres') || raw.includes('imgurl=')) {
                const match = raw.match(/[?&]imgurl=([^&]+)/);
                if (match && match[1]) return decodeURIComponent(match[1]);
              }
              if (raw.includes('google.com/url?') && raw.includes('url=')) {
                const match = raw.match(/[?&]url=([^&]+)/);
                if (match && match[1]) return decodeURIComponent(match[1]);
              }
              return raw;
            })()}
            alt={hospital.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=1200&q=80";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-transparent"></div>

          <div className="absolute bottom-6 left-6 right-6 text-white flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider bg-white/20 backdrop-blur-md text-white rounded-full">
                  {hospital.type?.replace('_', ' ')}
                </span>
                {isOpenNow ? (
                  <span className="px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider bg-emerald-500 text-white rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                    Open Now
                  </span>
                ) : isClosedToday ? (
                  <span className="px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider bg-rose-600 text-white rounded-full shadow-sm flex items-center gap-1">
                    🔴 CLOSED TODAY
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider bg-amber-500 text-white rounded-full shadow-sm flex items-center gap-1">
                    🌙 CLOSED NOW (OPD: {formatTimeAMPM(hospital.open_time || '08:00')} – {formatTimeAMPM(hospital.close_time || '20:00')})
                  </span>
                )}
              </div>
              <h1 className="font-display text-2xl sm:text-4xl font-bold tracking-tight">{hospital.name}</h1>
              <p className="text-xs sm:text-sm text-slate-200 flex items-center gap-1 mt-1">
                <MapPin className="w-4 h-4 text-clinical-100 shrink-0" />
                <span>{hospital.address}</span>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-white/90 backdrop-blur-md text-ink px-4 py-2 rounded-2xl text-center shadow-lg">
                <div className="flex items-center gap-1 font-bold text-lg text-amber-600">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span>{hospital.rating || 4.8}</span>
                </div>
                <p className="text-[10px] text-ink-muted font-medium">{hospital.review_count || 120} Reviews</p>
              </div>
            </div>
          </div>
        </div>

        {/* Hospital Contact Info Bar */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs font-medium text-slate-600">
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-clinical-600" />
            <span>OPD Desk: <strong className="text-ink">{hospital.phone || '+91 80 4112 8800'}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amberState" />
            <span>Emergency Help: <strong className="text-rose-600">{hospital.emergency_contact || '+91 80 1066'}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-clinical-600" />
            <span>OPD Hours: <strong className="text-ink">{formatTimeAMPM(hospital.open_time || '08:00')} – {formatTimeAMPM(hospital.close_time || '20:00')} ({hospital.closed_days?.length > 0 ? `Closed ${hospital.closed_days.join(', ')}` : 'Open All Days'})</strong></span>
          </div>
        </div>
      </div>

      {/* Tabs: Doctors Roster ⇄ Patient Reviews */}
      <div className="flex items-center border-b border-slate-200">
        <button
          onClick={() => setActiveTab('doctors')}
          className={`px-6 py-3 font-display text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'doctors'
              ? 'border-clinical-500 text-clinical-700'
              : 'border-transparent text-slate-400 hover:text-ink'
          }`}
        >
          <Stethoscope className="w-4 h-4" />
          <span>Doctors & OPD Schedule ({hospitalDoctors.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('reviews')}
          className={`px-6 py-3 font-display text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'reviews'
              ? 'border-clinical-500 text-clinical-700'
              : 'border-transparent text-slate-400 hover:text-ink'
          }`}
        >
          <Star className="w-4 h-4" />
          <span>Patient Reviews ({hospitalReviews.length})</span>
        </button>
      </div>

      {activeTab === 'doctors' ? (
        <div className="space-y-4">
          {/* Active Family Member Booking Bar */}
          <div className="p-4 bg-clinical-50/80 border border-clinical-100 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-clinical-500 text-white flex items-center justify-center font-bold text-sm">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-clinical-700 uppercase font-semibold tracking-wider">Booking OPD Token For</p>
                <p className="text-sm font-bold text-ink">{activeFamilyMember.full_name} <span className="text-xs text-ink-muted font-normal">({activeFamilyMember.relationship})</span></p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-ink-muted">Switch Profile:</label>
              <select
                value={activeFamilyMember.id}
                onChange={(e) => setActiveFamilyMemberId(e.target.value)}
                className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-clinical-500"
              >
                {familyMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.full_name} ({m.relationship})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Doctor Rows */}
          <div className="space-y-4">
            {hospitalDoctors.map((doc) => {
              const stats = getDoctorQueueStats(doc.id);
              const isAvailable = doc.is_available !== false;
              const onLeaveToday = isDoctorOnLeave(doc.id, todayStr);
              const leaveInfo = getDoctorLeaveDetails(doc.id, todayStr);

              return (
                <div
                  key={doc.id}
                  className={`bg-white rounded-2xl border p-5 shadow-sm transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    onLeaveToday || !isAvailable ? 'border-amber-200 bg-amber-50/20' : 'border-slate-200 hover:shadow-md'
                  }`}
                >
                  <div className="space-y-1 max-w-lg">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-lg font-bold text-ink">{doc.name}</h3>
                      <span className="px-2.5 py-0.5 text-xs font-semibold bg-clinical-50 text-clinical-700 rounded-md border border-clinical-100">
                        {doc.specialty}
                      </span>
                      {onLeaveToday ? (
                        <span className="px-2.5 py-0.5 text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 rounded-full">
                          🚫 On Approved Leave ({leaveInfo?.from_date} to {leaveInfo?.to_date})
                        </span>
                      ) : !isAvailable ? (
                        <span className="px-2.5 py-0.5 text-xs font-bold bg-rose-100 text-rose-800 rounded-full">
                          🔴 Not Available / Off Duty
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 text-xs font-bold bg-emerald-100 text-emerald-800 rounded-full">
                          🟢 Available Today
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-ink-muted">{doc.qualification} · {doc.experience_years} yrs exp</p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-2">
                      <span className="flex items-center gap-1 font-semibold text-ink">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                        Fee: ₹{doc.consultation_fee}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        Avg Consult: {doc.avg_consult_minutes || 15} mins
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {doc.available_days?.join(', ')} ({doc.available_from} - {doc.available_to})
                      </span>
                    </div>
                  </div>

                  {/* Live OPD Queue Length & Token Action Button */}
                  <div className="sm:text-right flex sm:flex-col items-center sm:items-end justify-between gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">TODAY'S LIVE QUEUE</span>
                      <p className="text-xs font-semibold text-clinical-700">
                        Token <strong className="font-mono text-ink text-sm">#{stats.servingTokenNumber || 1}</strong> serving
                      </p>
                      <p className="text-[11px] text-amberState-dark font-medium">
                        {stats.waitingCount} in line (~{stats.estimatedWaitMins}m wait)
                      </p>
                    </div>

                    {onLeaveToday ? (
                      <div className="px-4 py-2 bg-amber-100 border border-amber-300 text-amber-900 font-bold text-xs rounded-xl flex items-center gap-1.5 shrink-0 opacity-90 cursor-not-allowed">
                        <span>🚫 Doctor On Leave Today</span>
                      </div>
                    ) : !isAvailable ? (
                      <div className="px-4 py-2 bg-rose-100 border border-rose-300 text-rose-800 font-bold text-xs rounded-xl flex items-center gap-1.5 shrink-0 opacity-90 cursor-not-allowed">
                        <span>🔴 Doctor Off Duty / Not Available</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleOpenTokenModal(doc)}
                        className="px-5 py-2.5 bg-clinical-500 hover:bg-clinical-600 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-2 transition-all transform active:scale-95 shrink-0"
                      >
                        <Ticket className="w-4 h-4" />
                        <span>Get My Token</span>
                      </button>
                    )}

                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Patient Reviews Section */
        <div className="space-y-4">
          {hospitalReviews.length > 0 ? (
            hospitalReviews.map((rev) => (
              <div key={rev.id} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-slate-200 text-ink font-bold text-xs flex items-center justify-center">
                      {rev.patient_name?.[0] || 'P'}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-ink">{rev.patient_name}</p>
                      <p className="text-[10px] text-slate-400">{rev.created_at}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-xs font-bold text-amber-500 bg-amber-50 px-2.5 py-1 rounded-full">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{rev.rating}.0</span>
                  </div>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed pl-10">{rev.comment}</p>

                {rev.response && (
                  <div className="ml-10 mt-3 p-3 bg-indigoConsole-light border border-indigo-100 rounded-xl text-xs">
                    <p className="font-bold text-indigoConsole text-[11px] mb-0.5">Hospital Staff Reply:</p>
                    <p className="text-indigo-950">{rev.response}</p>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
              <p className="text-xs text-ink-muted">No reviews yet for this hospital. Be the first patient to rate after your visit!</p>
            </div>
          )}
        </div>
      )}

      {/* Get OPD Token Modal */}
      {showTokenModal && selectedDoctor && (
        <div className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl animate-in zoom-in-95 space-y-5">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-clinical-600 tracking-wider">CONFIRM OPD TOKEN</span>
                <h3 className="font-display text-xl font-bold text-ink">{selectedDoctor.name}</h3>
                <p className="text-xs text-ink-muted">{hospital.name} · {selectedDoctor.specialty}</p>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                  ₹{selectedDoctor.consultation_fee}
                </span>
              </div>
            </div>

            {/* Patient Booking Profile Card */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-semibold block uppercase">Token Issued For</span>
                <span className="text-xs font-bold text-ink">{activeFamilyMember.full_name} ({activeFamilyMember.relationship})</span>
              </div>
              <span className="text-xs text-clinical-700 font-medium">Fee payable at clinic desk</span>
            </div>

            {/* Select OPD Visit Date / Session */}
            <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-ink flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-clinical-600" />
                  <span>Select OPD Visit Date</span>
                </label>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                  bookingDate === todayStr
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                }`}>
                  {bookingDate === todayStr ? '⚡ Today (On the Spot)' : bookingDate === tomorrowStr ? '📅 Next Day (Tomorrow)' : `🗓️ Scheduled Date (${bookingDate})`}
                </span>
              </div>

              {/* Quick Select Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setBookingDate(todayStr)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    bookingDate === todayStr
                      ? 'bg-clinical-600 text-white border-clinical-600 ring-2 ring-clinical-600/20 shadow-xs'
                      : 'bg-white text-ink border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="text-[10px] font-bold uppercase tracking-wider opacity-90">Today (On the spot)</div>
                  <div className="text-xs font-extrabold mt-0.5">
                    {new Date(todayStr + 'T00:00:00').toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                  </div>
                  <div className="text-[10px] opacity-80 mt-0.5">⚡ Live Queue Access</div>
                </button>

                <button
                  type="button"
                  onClick={() => setBookingDate(tomorrowStr)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    bookingDate === tomorrowStr
                      ? 'bg-clinical-600 text-white border-clinical-600 ring-2 ring-clinical-600/20 shadow-xs'
                      : 'bg-white text-ink border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="text-[10px] font-bold uppercase tracking-wider opacity-90">Next Day (Tomorrow)</div>
                  <div className="text-xs font-extrabold mt-0.5">
                    {new Date(tomorrowStr + 'T00:00:00').toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                  </div>
                  <div className="text-[10px] opacity-80 mt-0.5">📅 Tomorrow Slot</div>
                </button>

                <div className="col-span-2 sm:col-span-1 flex flex-col justify-between p-2.5 bg-white border border-slate-200 rounded-xl">
                  <label className="text-[10px] font-bold uppercase text-slate-400">Pick Calendar Date</label>
                  <input
                    type="date"
                    min={todayStr}
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full px-2 py-1 text-xs font-bold text-ink bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-clinical-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Interactive Horizontal Day Strip for upcoming 7 days */}
              <div className="pt-1">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Upcoming Available OPD Days</p>
                <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-none">
                  {upcomingDays.map((day) => {
                    const isSelected = bookingDate === day.dateStr;
                    return (
                      <button
                        key={day.dateStr}
                        type="button"
                        onClick={() => setBookingDate(day.dateStr)}
                        className={`shrink-0 px-3 py-1.5 rounded-xl text-center border transition-all ${
                          isSelected
                            ? 'bg-clinical-700 text-white border-clinical-700 font-bold shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <div className="text-[9px] uppercase font-bold tracking-wider">{day.dayName}</div>
                        <div className="text-xs font-extrabold">{day.dayNum} {day.monthName}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Hospital Closed Days Alert Banner */}
            {isHospitalClosedOnDate(hospital, bookingDate) && (
              <div className="p-4 bg-rose-50 border border-rose-200 text-rose-900 rounded-2xl text-xs space-y-1 animate-in fade-in">
                <div className="flex items-center gap-2 font-bold text-rose-900 text-sm">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                  <span>Facility Closed on Selected Date ({bookingDate})</span>
                </div>
                <p className="text-rose-900 font-medium">
                  {hospital.name} is closed on this day. Standard operating hours: <strong>{hospital.open_time || '08:00'} - {hospital.close_time || '20:00'}</strong> (Closed: {hospital.closed_days?.join(', ') || 'Sun'}). Please select an open day to book an OPD token!
                </p>
              </div>
            )}

            {/* Leave Warning Banner if Selected Date falls on Doctor Approved Leave or Off Duty */}
            {!isHospitalClosedOnDate(hospital, bookingDate) && (isDoctorOnLeave(selectedDoctor.id, bookingDate) || selectedDoctor.is_available === false) && (
              <div className="p-4 bg-amber-50 border border-amber-300 text-amber-950 rounded-2xl text-xs space-y-1 animate-in fade-in">
                <div className="flex items-center gap-2 font-bold text-amber-900 text-sm">
                  <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
                  <span>Doctor Unavailable for {bookingDate}</span>
                </div>
                {isDoctorOnLeave(selectedDoctor.id, bookingDate) ? (
                  <p className="text-amber-900 font-medium">
                    Dr. {selectedDoctor.name} is on approved leave from <strong>{getDoctorLeaveDetails(selectedDoctor.id, bookingDate)?.from_date}</strong> to <strong>{getDoctorLeaveDetails(selectedDoctor.id, bookingDate)?.to_date}</strong> ({getDoctorLeaveDetails(selectedDoctor.id, bookingDate)?.reason}). Token booking is unavailable for this date. Please select an alternate date!
                  </p>
                ) : (
                  <p className="text-amber-900 font-medium">
                    Dr. {selectedDoctor.name} is currently Off Duty / Not Available for token issue. Please check back later or pick an upcoming date!
                  </p>
                )}
              </div>
            )}

            {/* Priority Flag Option */}
            <div className="p-4 bg-amberState/10 border border-amberState/30 rounded-2xl space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPriorityBooking}
                  onChange={(e) => setIsPriorityBooking(e.target.checked)}
                  className="w-4 h-4 text-amberState rounded focus:ring-amberState"
                />
                <span className="text-xs font-bold text-ink flex items-center gap-1">
                  <ShieldAlert className="w-4 h-4 text-amberState" />
                  Request Priority Token Access
                </span>
              </label>
              <p className="text-[11px] text-ink-muted pl-6">
                Check this if patient is a senior citizen (60+ yrs) or requires urgent emergency attention.
              </p>

              {isPriorityBooking && (
                <div className="pl-6 pt-2">
                  <select
                    value={priorityReason}
                    onChange={(e) => setPriorityReason(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-amberState/40 rounded-lg bg-white font-medium focus:outline-none"
                  >
                    <option value="Senior Citizen (60+ yrs)">Senior Citizen (60+ yrs)</option>
                    <option value="Emergency Care Needed">Emergency Care Needed</option>
                    <option value="Pregnant Patient">Pregnant Patient</option>
                    <option value="Infant / Toddler Care">Infant / Toddler Care</option>
                  </select>
                </div>
              )}
            </div>

            {/* Confirm Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowTokenModal(false)}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isHospitalClosedOnDate(hospital, bookingDate) || isDoctorOnLeave(selectedDoctor.id, bookingDate) || selectedDoctor.is_available === false}
                onClick={handleConfirmTokenBooking}
                className="px-6 py-2.5 text-xs font-bold bg-[#0E7C86] hover:bg-clinical-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl shadow-md flex items-center gap-2 cursor-pointer"
              >
                <Ticket className="w-4 h-4" />
                <span>Confirm & Grab OPD Token</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


