import React, { useState } from 'react';
import { Star, MessageSquare, CornerDownRight, CheckCircle2, Filter, TrendingUp, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useQueue } from '../../context/QueueContext';

export default function ReviewsConsole() {
  const { staffHospitalId } = useAuth();
  const { hospitals, reviews, respondToReview } = useQueue();

  const [replyingId, setReplyingId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [filterRating, setFilterRating] = useState('all');

  const currentHospital = hospitals.find(h => h.id === staffHospitalId) || hospitals[0];
  const hospitalReviews = reviews.filter(r => r.hospital_id === currentHospital.id);

  // Analytics Metrics
  const totalReviews = hospitalReviews.length;
  const avgRating = totalReviews > 0
    ? (hospitalReviews.reduce((acc, r) => acc + Number(r.rating || 5), 0) / totalReviews).toFixed(1)
    : (currentHospital?.rating || 5.0);

  const pendingRepliesCount = hospitalReviews.filter(r => !r.response).length;
  const positiveCount = hospitalReviews.filter(r => r.rating >= 4).length;
  const positivePercentage = totalReviews > 0 ? Math.round((positiveCount / totalReviews) * 100) : 100;

  // Filtered reviews
  const filteredReviews = hospitalReviews.filter(r => {
    if (filterRating === 'pending') return !r.response;
    if (filterRating === '5') return r.rating === 5;
    if (filterRating === 'low') return r.rating <= 3;
    return true;
  });

  const handleSendReply = (reviewId) => {
    if (!replyText) return;
    respondToReview(reviewId, replyText);
    setReplyingId(null);
    setReplyText('');
  };

  const quickReplies = [
    'Thank you for your valuable feedback! We are glad you had a seamless OPD experience.',
    'Thank you! Our doctors and staff strive to provide minimum waiting time and top care.',
    'We appreciate your feedback and apologize for any delay. We are optimizing our queue schedule.'
  ];

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-4 sm:space-y-6 overflow-x-hidden w-full max-w-full">
      
      {/* Header Banner */}
      <div className="bg-[#3B3F8C] text-white rounded-3xl p-6 shadow-md border border-indigo-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-amberState bg-indigo-950 px-2.5 py-0.5 rounded-full border border-amberState/30">
            BUSINESS REPUTATION & PATIENT FEEDBACK
          </span>
          <h1 className="font-display text-2xl font-bold mt-1">Reviews Console</h1>
          <p className="text-xs text-indigo-200">{currentHospital?.name} · Managed Public Responses</p>
        </div>

        <div className="flex items-center gap-2 bg-indigo-950/60 p-3 rounded-2xl border border-indigo-700/50 shrink-0">
          <div className="text-right">
            <span className="text-[10px] text-indigo-300 block font-semibold uppercase">Overall Rating</span>
            <div className="flex items-center gap-1 font-mono text-2xl font-bold text-amberState">
              <Star className="w-5 h-5 fill-amberState text-amberState" />
              <span>{avgRating}</span>
              <span className="text-xs text-indigo-300 font-normal">/ 5.0</span>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">TOTAL REVIEWS</span>
          <p className="font-mono text-2xl font-bold text-ink">{totalReviews}</p>
          <p className="text-[11px] text-emerald-600 font-medium">100% Verified Patients</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">AVERAGE SCORE</span>
          <p className="font-mono text-2xl font-bold text-amber-500">⭐ {avgRating}</p>
          <p className="text-[11px] text-slate-500">Based on visit feedback</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">PENDING REPLIES</span>
          <p className={`font-mono text-2xl font-bold ${pendingRepliesCount > 0 ? 'text-amberState-dark' : 'text-emerald-600'}`}>
            {pendingRepliesCount}
          </p>
          <p className="text-[11px] text-slate-500">Requires staff response</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">POSITIVE SATISFACTION</span>
          <p className="font-mono text-2xl font-bold text-emerald-700">{positivePercentage}%</p>
          <p className="text-[11px] text-emerald-600 font-medium">4★ and 5★ ratings</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar border-b border-slate-200">
        {[
          { id: 'all', label: `All Reviews (${hospitalReviews.length})` },
          { id: 'pending', label: `Response Pending (${pendingRepliesCount})` },
          { id: '5', label: `5 Star Ratings (${hospitalReviews.filter(r => r.rating === 5).length})` },
          { id: 'low', label: `Critical / Low Ratings (${hospitalReviews.filter(r => r.rating <= 3).length})` },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilterRating(tab.id)}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
              filterRating === tab.id
                ? 'bg-[#0E7C86] text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {filteredReviews.length > 0 ? (
          filteredReviews.map((rev) => (
            <div key={rev.id} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 shadow-sm transition-all hover:border-slate-300">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display font-bold text-sm text-ink">{rev.patient_name}</h3>
                  <p className="text-[10px] text-slate-400">{rev.created_at || 'Recent Visit'}</p>
                </div>

                <div className="flex items-center gap-1 text-xs font-bold text-amber-500 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span>{rev.rating}.0 Stars</span>
                </div>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed italic">"{rev.comment}"</p>

              {rev.response ? (
                <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-indigoConsole font-bold text-[11px]">
                      <CornerDownRight className="w-3.5 h-3.5" />
                      <span>Official Hospital Response:</span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">Published</span>
                  </div>
                  <p className="text-indigo-950 font-medium pt-0.5">{rev.response}</p>
                </div>
              ) : (
                <div className="pt-2 border-t border-slate-100">
                  {replyingId === rev.id ? (
                    <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-ink">Write Clinic Response</label>
                        <span className="text-[10px] text-slate-400">Publicly visible to all patients</span>
                      </div>

                      {/* One-Click Quick Presets */}
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-500" /> Quick Reply Suggestions:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {quickReplies.map((preset, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setReplyText(preset)}
                              className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 text-[11px] font-medium rounded-lg border border-slate-200 text-left transition-colors"
                            >
                              "{preset.substring(0, 45)}..."
                            </button>
                          ))}
                        </div>
                      </div>

                      <textarea
                        rows="3"
                        placeholder="Write official clinic response..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        className="w-full p-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-clinical-500 bg-white"
                      ></textarea>

                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setReplyingId(null)}
                          className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSendReply(rev.id)}
                          className="px-5 py-1.5 text-xs font-bold bg-[#0E7C86] hover:bg-clinical-600 text-white rounded-xl shadow-sm transition-all"
                        >
                          Publish Response
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setReplyingId(rev.id);
                        setReplyText('');
                      }}
                      className="px-3.5 py-2 text-xs font-bold text-clinical-700 bg-clinical-50 hover:bg-clinical-100 rounded-xl border border-clinical-200 flex items-center gap-1.5 transition-colors shadow-xs"
                    >
                      <MessageSquare className="w-4 h-4 text-clinical-600" />
                      <span>Respond to Patient Feedback</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
            <p className="text-xs text-ink-muted">No reviews match the selected filter.</p>
          </div>
        )}
      </div>
    </div>
  );
}
