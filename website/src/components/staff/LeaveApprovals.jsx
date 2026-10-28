import React from 'react';
import { Calendar, CheckCircle2, XCircle, Clock, Stethoscope, ShieldCheck, UserX, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useQueue } from '../../context/QueueContext';

export default function LeaveApprovals() {
  const { staffHospitalId } = useAuth();
  const { hospitals, leaveRequests, updateLeaveStatus } = useQueue();

  const currentHospital = hospitals.find(h => h.id === staffHospitalId) || hospitals[0];
  const hospitalLeaves = leaveRequests.filter(l => l.hospital_id === currentHospital.id);

  const pendingLeaves = hospitalLeaves.filter(l => l.status === 'pending');
  const approvedLeaves = hospitalLeaves.filter(l => l.status === 'approved');
  const pastRejectedLeaves = hospitalLeaves.filter(l => l.status === 'rejected');

  const handleApprove = (id) => {
    updateLeaveStatus(id, 'approved');
  };

  const handleReject = (id) => {
    updateLeaveStatus(id, 'rejected');
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6 overflow-x-hidden w-full max-w-full">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-bold text-ink">Doctor Leave & Absence Approvals</h1>
            {pendingLeaves.length > 0 && (
              <span className="px-2.5 py-0.5 text-xs font-bold bg-amberState text-ink rounded-full animate-bounce">
                {pendingLeaves.length} Pending
              </span>
            )}
          </div>
          <p className="text-xs text-ink-muted">{currentHospital?.name} · Review & grant leave permissions submitted by consulting doctors</p>
        </div>
      </div>

      {/* 1. Pending Leave Requests Section */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Clock className="w-5 h-5 text-amberState-dark" />
          <h3 className="font-display text-base font-bold text-ink">
            Pending Leave Permissions ({pendingLeaves.length})
          </h3>
        </div>

        {pendingLeaves.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingLeaves.map((leave) => (
              <div key={leave.id} className="p-5 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-3 relative">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center font-bold">
                      <Stethoscope className="w-5 h-5 text-amber-900" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-ink">{leave.doctor_name}</h4>
                      <span className="text-[11px] font-semibold text-amber-900 bg-amber-100 px-2 py-0.5 rounded">
                        {leave.specialty}
                      </span>
                    </div>
                  </div>

                  <span className="px-2.5 py-0.5 text-[10px] font-bold bg-amberState text-ink rounded-full uppercase">
                    Pending Approval
                  </span>
                </div>

                <div className="space-y-1 text-xs text-slate-700 bg-white p-3 rounded-xl border border-amber-200">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold">Requested Leave Period:</span>
                    <strong className="text-indigoConsole font-mono">{leave.from_date} to {leave.to_date}</strong>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-100">
                    <span className="text-slate-500 font-semibold">Reason:</span>
                    <span className="font-medium text-slate-800">{leave.reason}</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    onClick={() => handleReject(leave.id)}
                    className="px-4 py-2 bg-white hover:bg-rose-50 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 flex items-center gap-1 transition-all"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>

                  <button
                    onClick={() => handleApprove(leave.id)}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1 transition-all"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve Leave Permission</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-slate-50/50 rounded-2xl border border-slate-100">
            <p className="text-xs text-ink-muted">No pending leave requests at this time.</p>
          </div>
        )}
      </div>

      {/* 2. Approved Active Doctor Leaves */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <h3 className="font-display text-base font-bold text-ink">
              Approved Doctor Leave Schedule ({approvedLeaves.length})
            </h3>
          </div>
        </div>

        {approvedLeaves.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <th className="p-3">Doctor Name</th>
                  <th className="p-3">Specialty</th>
                  <th className="p-3">Approved Leave Range</th>
                  <th className="p-3">Reason</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-ink">
                {approvedLeaves.map((leave) => (
                  <tr key={leave.id} className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-ink">{leave.doctor_name}</td>
                    <td className="p-3 text-slate-600">{leave.specialty}</td>
                    <td className="p-3 font-mono font-bold text-indigoConsole">
                      {leave.from_date} — {leave.to_date}
                    </td>
                    <td className="p-3 text-slate-600 max-w-xs truncate">{leave.reason}</td>
                    <td className="p-3">
                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold">
                        ✓ Approved Leave Active
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleReject(leave.id)}
                        className="text-[11px] font-bold text-rose-600 hover:underline"
                      >
                        Revoke Leave
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 bg-slate-50/50 rounded-2xl border border-slate-100">
            <p className="text-xs text-ink-muted">No approved active doctor leaves.</p>
          </div>
        )}
      </div>

    </div>
  );
}
