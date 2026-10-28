import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Ticket, ArrowLeft, Activity, MapPin, AlertCircle, CheckCircle2, RefreshCw, Calendar } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useQueue } from '../../context/QueueContext';
import OPDTokenSlip from '../common/OPDTokenSlip';

export default function LiveTokenView({ onSelectHospital }) {
  const { user, activeFamilyMemberId } = useAuth();
  const { tokens, doctors, hospitals, getDoctorQueueStats, updateTokenStatus } = useQueue();

  const [dateTab, setDateTab] = useState('all'); // 'all' | 'today' | 'upcoming'
  const [tokenToCancel, setTokenToCancel] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const todayStr = new Date().toISOString().split('T')[0];

  // Filter active tokens strictly for the current user and active family member profile
  const userId = user?.id || 'user-patient-demo';
  const userTokens = tokens.filter(t => {
    if (t.patient_id !== userId) return false;
    if (activeFamilyMemberId && activeFamilyMemberId !== 'fam-self') {
      return t.family_member_id === activeFamilyMemberId;
    }
    return !t.family_member_id || t.family_member_id === 'fam-self';
  });
  const allActiveTokens = userTokens.filter(t => t.status === 'waiting' || t.status === 'serving');

  const activeTokens = allActiveTokens.filter(t => {
    if (dateTab === 'today') return t.queue_date === todayStr || !t.queue_date;
    if (dateTab === 'upcoming') return t.queue_date && t.queue_date > todayStr;
    return true;
  });

  // Trigger confetti if any token transitions to 'serving'
  useEffect(() => {
    const servingToken = activeTokens.find(t => t.status === 'serving');
    if (servingToken) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {
        console.log('Confetti error:', e);
      }
    }
  }, [activeTokens]);

  const handleCancelToken = (tokenId) => {
    setTokenToCancel(tokenId);
  };

  const confirmCancelToken = () => {
    if (!tokenToCancel) return;
    const targetTok = tokens.find(t => t.id === tokenToCancel);
    updateTokenStatus(tokenToCancel, 'cancelled');
    setTokenToCancel(null);
    setToastMessage(`OPD Token ${targetTok ? `#${targetTok.token_number}` : ''} cancelled successfully.`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Ticket className="w-5 h-5 text-clinical-600" />
            <h1 className="font-display text-2xl font-bold text-ink">My OPD Tokens</h1>
          </div>
          <p className="text-xs text-ink-muted mt-0.5">Real-time status synced directly with clinical OPD desk</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200">
            <button
              onClick={() => setDateTab('all')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                dateTab === 'all' ? 'bg-white text-ink shadow-xs' : 'text-slate-500 hover:text-ink'
              }`}
            >
              All ({allActiveTokens.length})
            </button>
            <button
              onClick={() => setDateTab('today')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 ${
                dateTab === 'today' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-500 hover:text-ink'
              }`}
            >
              <span>⚡ Today</span>
            </button>
            <button
              onClick={() => setDateTab('upcoming')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 ${
                dateTab === 'upcoming' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-500 hover:text-ink'
              }`}
            >
              <Calendar className="w-3 h-3" />
              <span>Upcoming</span>
            </button>
          </div>
        </div>
      </div>


      {activeTokens.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {activeTokens.map((token) => {
            const doctor = doctors.find(d => d.id === token.doctor_id);
            const hospital = hospitals.find(h => h.id === token.hospital_id);
            const stats = doctor ? getDoctorQueueStats(doctor.id) : null;

            // Calculate position before this token
            const doctorWaitingTokens = tokens
              .filter(t => t.doctor_id === token.doctor_id && t.status === 'waiting')
              .sort((a, b) => {
                if (a.is_priority && !b.is_priority) return -1;
                if (!a.is_priority && b.is_priority) return 1;
                return a.token_number - b.token_number;
              });

            const myIndex = doctorWaitingTokens.findIndex(t => t.id === token.id);
            const queuePosition = myIndex >= 0 ? myIndex : 0;
            const estimatedWait = queuePosition * (doctor?.avg_consult_minutes || 15);

            return (
              <div key={token.id} className="space-y-3">
                <OPDTokenSlip
                  token={token}
                  doctor={doctor}
                  hospital={hospital}
                  servingTokenNumber={stats?.servingTokenNumber}
                  queuePosition={queuePosition}
                  estimatedWaitMins={estimatedWait}
                  onCancelToken={handleCancelToken}
                  showActions={true}
                />

                {hospital && (
                  <button
                    onClick={() => onSelectHospital(hospital)}
                    className="w-full py-2 px-3 bg-white hover:bg-slate-50 border border-slate-200 text-ink text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-xs"
                  >
                    <MapPin className="w-3.5 h-3.5 text-clinical-600" />
                    <span>View Hospital Details & Directions</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4 max-w-md mx-auto">
          <div className="w-16 h-16 rounded-full bg-clinical-50 text-clinical-600 flex items-center justify-center mx-auto">
            <Ticket className="w-8 h-8" />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-ink">No Active OPD Tokens</h3>
            <p className="text-xs text-ink-muted max-w-xs mx-auto mt-1">
              You don't have any active doctor OPD queue tokens right now. Browse nearby clinics to grab one!
            </p>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {tokenToCancel && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-center border border-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-display text-lg font-bold text-ink">Cancel OPD Token?</h3>
              <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                Are you sure you want to cancel this token? This will release your position in the doctor's queue.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setTokenToCancel(null)}
                className="flex-1 py-2.5 px-4 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                No, Keep Token
              </button>
              <button
                type="button"
                onClick={confirmCancelToken}
                className="flex-1 py-2.5 px-4 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm transition-colors cursor-pointer"
              >
                Yes, Cancel Token
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 border border-slate-800 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
