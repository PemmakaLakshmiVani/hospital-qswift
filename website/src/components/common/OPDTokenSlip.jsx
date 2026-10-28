import React from 'react';
import { Activity, Clock, ShieldAlert, CheckCircle2, User, Stethoscope, Building2, Calendar } from 'lucide-react';

export default function OPDTokenSlip({
  token,
  doctor,
  hospital,
  servingTokenNumber,
  queuePosition,
  estimatedWaitMins,
  onCancelToken,
  showActions = true,
}) {
  if (!token || !doctor || !hospital) return null;

  const todayStr = new Date().toISOString().split('T')[0];
  const isToday = token.queue_date === todayStr || !token.queue_date;

  const isServing = token.status === 'serving';
  const isDone = token.status === 'done';
  const isCancelled = token.status === 'cancelled';
  const isNoShow = token.status === 'no_show';
  const isWaiting = token.status === 'waiting';

  return (
    <div className={`opd-slip p-6 transition-all border ${
      isServing
        ? 'border-amberState/60 ring-4 ring-amberState/10 bg-amber-50/20'
        : isDone
        ? 'border-emerald-200 bg-emerald-50/10'
        : 'border-slate-200'
    }`}>
      {/* Visual Cutouts for Ticket Slip Effect */}
      <div className="opd-slip-cutout-left"></div>
      <div className="opd-slip-cutout-right"></div>

      {/* Slip Header: Hospital Name & Department */}
      <div className="flex items-start justify-between pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-clinical-600 font-semibold mb-0.5">
            <Building2 className="w-3.5 h-3.5" />
            <span>{hospital.name}</span>
          </div>
          <p className="text-[11px] text-ink-muted truncate max-w-xs">{hospital.address}</p>
        </div>
        <div className="text-right">
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block">OPD SLIP</span>
          <span className={`inline-flex items-center gap-1 text-xs font-extrabold px-2 py-0.5 rounded-full ${
            isToday
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
          }`}>
            <Calendar className="w-3 h-3" />
            <span>{isToday ? 'Today (On the spot)' : token.queue_date}</span>
          </span>
        </div>
      </div>

      {/* Priority Flag Banner if Active */}
      {token.is_priority && (
        <div className="mt-3 py-1.5 px-3 bg-amberState/15 text-amberState-dark border border-amberState/30 rounded-lg text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-amberState" />
            <span>Priority Queue Access</span>
          </div>
          <span className="text-[10px] bg-amberState text-ink font-bold px-1.5 py-0.5 rounded">
            {token.priority_reason || 'Priority Patient'}
          </span>
        </div>
      )}

      {/* Main Token Number Display */}
      <div className="py-6 text-center my-2 bg-slate-50/80 rounded-xl border border-slate-100">
        <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1">
          {isToday ? 'YOUR TOKEN NUMBER' : `SCHEDULED TOKEN (#${token.token_number})`}
        </p>
        <div className="font-mono text-5xl font-bold text-clinical-700 tracking-tight flex items-center justify-center gap-1">
          <span className="text-2xl text-clinical-500 font-sans">#</span>
          <span>{token.token_number}</span>
        </div>

        {/* Live Status Pill */}
        <div className="mt-3 flex items-center justify-center">
          {isServing && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amberState text-ink animate-pulse shadow-sm">
              <Activity className="w-3.5 h-3.5" />
              NOW SERVING — PROCEED TO CLINIC ROOM
            </span>
          )}
          {isWaiting && isToday && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-clinical-50 text-clinical-700 border border-clinical-200">
              <Clock className="w-3.5 h-3.5" />
              Waiting in Today's Live Queue
            </span>
          )}
          {isWaiting && !isToday && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
              <Calendar className="w-3.5 h-3.5" />
              Advance Booking for {token.queue_date}
            </span>
          )}
          {isDone && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Consultation Completed
            </span>
          )}
          {(isCancelled || isNoShow) && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-200 text-slate-700">
              {isCancelled ? 'Token Cancelled' : 'Marked No-Show'}
            </span>
          )}
        </div>
      </div>


      {/* Dashed Tear Line */}
      <div className="opd-dashed-line my-4"></div>

      {/* Doctor & Patient Details Grid */}
      <div className="grid grid-cols-2 gap-4 text-xs py-1">
        <div>
          <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 block mb-0.5">Doctor</span>
          <div className="flex items-center gap-1.5 font-bold text-ink">
            <Stethoscope className="w-3.5 h-3.5 text-clinical-600" />
            <span className="truncate">{doctor.name}</span>
          </div>
          <span className="text-[11px] text-clinical-600 font-medium">{doctor.specialty}</span>
        </div>

        <div>
          <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 block mb-0.5">Patient</span>
          <div className="flex items-center gap-1.5 font-bold text-ink">
            <User className="w-3.5 h-3.5 text-clinical-600" />
            <span className="truncate">{token.patient_name}</span>
          </div>
          <span className="text-[11px] text-ink-muted">Consult Fee: ₹{doctor.consultation_fee}</span>
        </div>
      </div>

      {/* Queue Progress Bar & Live Counter (When Waiting) */}
      {isWaiting && (
        <div className="mt-4 p-3 bg-clinical-50/70 border border-clinical-100 rounded-xl">
          <div className="flex items-center justify-between text-xs font-medium text-ink mb-1.5">
            <span>Now Serving: <strong className="font-mono text-clinical-700">#{servingTokenNumber || '--'}</strong></span>
            <span>
              {queuePosition === 0 ? (
                <strong className="text-amberState-dark font-bold">You are NEXT!</strong>
              ) : (
                <span><strong>{queuePosition}</strong> patient(s) ahead</span>
              )}
            </span>
          </div>
          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <div
              className="bg-clinical-500 h-full transition-all duration-500"
              style={{
                width: `${Math.max(10, Math.min(100, 100 - (queuePosition * 20)))}%`
              }}
            ></div>
          </div>
          <p className="text-[11px] text-clinical-700 mt-2 text-center font-medium">
            ⏱️ Estimated Wait Time: ~<strong className="text-ink font-bold">{estimatedWaitMins || 15} mins</strong>
          </p>
        </div>
      )}

      {/* Barcode Simulation for Medical OPD Ticket */}
      <div className="mt-5 pt-3 border-t border-slate-100 flex flex-col items-center">
        <div className="h-7 w-48 bg-[repeating-linear-gradient(90deg,#14181F,#14181F_2px,transparent_2px,transparent_4px,#14181F_4px,#14181F_7px)] opacity-70 rounded-xs"></div>
        <p className="font-mono text-[9px] text-slate-400 tracking-widest mt-1 uppercase">OPD-REF-{token.id.slice(-8)}</p>
      </div>

      {/* Action Buttons */}
      {showActions && isWaiting && onCancelToken && (
        <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
          <button
            onClick={() => onCancelToken(token.id)}
            className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
          >
            Cancel Token
          </button>
        </div>
      )}
    </div>
  );
}
