import React, { useState } from 'react';
import { Clock, Star, CheckCircle2, XCircle, Stethoscope, Building2, MessageSquare } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useQueue } from '../../context/QueueContext';

export default function VisitHistory() {
  const { user, activeFamilyMemberId } = useAuth();
  const { tokens, doctors, hospitals, reviews, addReview } = useQueue();

  const [reviewingToken, setReviewingToken] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  // History tokens (done, cancelled, no_show) strictly filtered per user & profile
  const userId = user?.id || 'user-patient-demo';
  const historyTokens = tokens.filter(t => {
    if (t.patient_id !== userId) return false;
    if (activeFamilyMemberId && activeFamilyMemberId !== 'fam-self') {
      if (t.family_member_id !== activeFamilyMemberId) return false;
    } else {
      if (t.family_member_id && t.family_member_id !== 'fam-self') return false;
    }
    return t.status === 'done' || t.status === 'cancelled' || t.status === 'no_show';
  });

  const handleSubmitReview = (e) => {
    e.preventDefault();
    if (!reviewingToken) return;

    addReview({
      token_id: reviewingToken.id,
      hospital_id: reviewingToken.hospital_id,
      doctor_id: reviewingToken.doctor_id,
      patient_id: user?.id || 'user-patient-demo',
      patient_name: reviewingToken.patient_name,
      rating: rating,
      comment: comment
    });

    setReviewingToken(null);
    setRating(5);
    setComment('');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="font-display text-2xl font-bold text-ink">Past OPD Visit History</h1>
        <p className="text-xs text-ink-muted mt-0.5">Record of completed consultations and past tokens</p>
      </div>

      {historyTokens.length > 0 ? (
        <div className="space-y-4">
          {historyTokens.map((token) => {
            const doctor = doctors.find(d => d.id === token.doctor_id);
            const hospital = hospitals.find(h => h.id === token.hospital_id);
            // Strictly match review to this specific token/consultation, only for completed visits
            const tokenReview = token.status === 'done' ? reviews.find(r => r.token_id === token.id) : null;

            return (
              <div
                key={token.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-base font-bold text-clinical-700">#{token.token_number}</span>
                      <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${
                        token.status === 'done'
                          ? 'bg-emerald-100 text-emerald-800'
                          : token.status === 'cancelled'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {token.status === 'done' ? 'Completed' : token.status === 'cancelled' ? 'Cancelled' : 'No-Show'}
                      </span>
                      <span className="text-xs text-slate-400">· {token.queue_date}</span>
                    </div>

                    <h3 className="font-display text-base font-bold text-ink flex items-center gap-1.5">
                      <Stethoscope className="w-4 h-4 text-clinical-600" />
                      <span>{doctor?.name || 'Doctor'}</span>
                      <span className="text-xs font-normal text-ink-muted">({doctor?.specialty})</span>
                    </h3>

                    <p className="text-xs text-ink-muted flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>{hospital?.name}</span>
                    </p>

                    <p className="text-[11px] text-slate-500 pt-1">Patient: <strong>{token.patient_name}</strong></p>
                  </div>

                  {token.status === 'done' && (
                    <div>
                      {tokenReview ? (
                        <div className="px-3.5 py-1.5 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 text-xs font-bold flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Feedback Recorded</span>
                          <span className="flex items-center text-amber-500 font-extrabold ml-1">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 inline mr-0.5" />
                            {tokenReview.rating}.0
                          </span>
                        </div>
                      ) : (
                        <button
                          onClick={() => setReviewingToken(token)}
                          className="px-4 py-2 text-xs font-bold bg-clinical-50 text-clinical-700 hover:bg-clinical-100 rounded-xl border border-clinical-200 flex items-center gap-1.5 transition-colors"
                        >
                          <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                          <span>Write Review</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {token.status === 'done' && tokenReview && (
                  <div className="pt-2 border-t border-slate-100 text-xs text-slate-600 bg-slate-50/60 p-3 rounded-xl">
                    <p className="font-semibold text-slate-700 text-[11px]">Your Feedback:</p>
                    <p className="italic text-slate-800 mt-0.5">"{tokenReview.comment}"</p>
                    {tokenReview.response && (
                      <div className="mt-2 p-2 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-900 font-normal">
                        <strong className="font-bold text-indigoConsole text-[11px] block">Hospital Staff Reply:</strong>
                        {tokenReview.response}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
          <Clock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-xs text-ink-muted">No past visit history recorded yet.</p>
        </div>
      )}

      {/* Review Modal */}
      {reviewingToken && (
        <div className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <h3 className="font-display text-lg font-bold text-ink">Rate Your OPD Consultation</h3>
            <p className="text-xs text-ink-muted">Share your experience to help other patients.</p>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setRating(star)}
                      className="p-1 transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          star <= rating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Feedback / Comments</label>
                <textarea
                  required
                  rows="3"
                  placeholder="e.g. Minimal wait time, doctor was very thorough and attentive!"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full p-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-clinical-500"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewingToken(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-[#0E7C86] hover:bg-clinical-600 text-white rounded-xl shadow-sm"
                >
                  Submit Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
