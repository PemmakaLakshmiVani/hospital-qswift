import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useQueue } from '../../context/QueueContext';
import {
  Building2,
  Ticket,
  Clock,
  UserCheck,
  Activity,
  Stethoscope,
  Sparkles,
  User,
  ShieldAlert,
  Users,
  TrendingUp,
  MoreHorizontal,
  X,
  FileText
} from 'lucide-react';

export default function BottomNav({ activeTab, setActiveTab, onOpenLogin }) {
  const { userMode, setUserMode, userRole, isAuthenticated, user } = useAuth();
  const { tokens, leaveRequests = [] } = useQueue();
  const [showStaffMore, setShowStaffMore] = useState(false);

  // Active waiting/serving tokens for current user
  const userId = user?.id || 'user-patient-demo';
  const activeUserTokens = tokens.filter(t => {
    return t.patient_id === userId && (t.status === 'waiting' || t.status === 'serving');
  });

  const pendingLeaves = leaveRequests.filter(l => l.status === 'pending');

  return (
    <>
      {/* Staff More Popover Menu Drawer */}
      {showStaffMore && userMode === 'staff' && (
        <div
          onClick={() => setShowStaffMore(false)}
          className="md:hidden fixed inset-0 z-50 bg-ink/60 backdrop-blur-xs flex flex-col justify-end animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-t-3xl p-5 pb-28 shadow-2xl border-t border-slate-200 space-y-4 max-w-md mx-auto w-full max-h-[80vh] overflow-y-auto overscroll-contain animate-in slide-in-from-bottom"
          >
            <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto -mt-1 mb-1"></div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700">
                  <MoreHorizontal className="w-4 h-4" />
                </span>
                <h3 className="font-display font-bold text-base text-ink">More Console Tools</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowStaffMore(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {/* Reports / Analytics */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('staff-analytics');
                  setShowStaffMore(false);
                }}
                className={`p-3 rounded-2xl border text-left flex flex-col gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'staff-analytics'
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-bold'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <TrendingUp className="w-5 h-5 text-indigo-600" />
                <span className="text-xs font-bold block">Queue Reports</span>
                <span className="text-[10px] text-slate-400">Wait times & analytics</span>
              </button>

              {/* Patient Reviews */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('staff-reviews');
                  setShowStaffMore(false);
                }}
                className={`p-3 rounded-2xl border text-left flex flex-col gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'staff-reviews'
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-bold'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Sparkles className="w-5 h-5 text-amber-500" />
                <span className="text-xs font-bold block">Patient Reviews</span>
                <span className="text-[10px] text-slate-400">Ratings & feedback</span>
              </button>

              {/* Staff Accounts (also available here) */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('staff-accounts');
                  setShowStaffMore(false);
                }}
                className={`p-3 rounded-2xl border text-left flex flex-col gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'staff-accounts'
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-bold'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Users className="w-5 h-5 text-indigo-600" />
                <span className="text-xs font-bold block">Staff Accounts</span>
                <span className="text-[10px] text-slate-400">Operator logins</span>
              </button>

              {/* Leave Approvals */}
              {userRole === 'business_owner' ? (
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('leave-approvals');
                    setShowStaffMore(false);
                  }}
                  className={`p-3 rounded-2xl border text-left flex flex-col gap-1.5 transition-all cursor-pointer ${
                    activeTab === 'leave-approvals'
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-bold'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Clock className="w-5 h-5 text-indigo-600" />
                  <span className="text-xs font-bold block">Leave Approvals</span>
                  <span className="text-[10px] text-slate-400">Doctor absence</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('staff-doctors');
                    setShowStaffMore(false);
                  }}
                  className={`p-3 rounded-2xl border text-left flex flex-col gap-1.5 transition-all cursor-pointer ${
                    activeTab === 'staff-doctors'
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-bold'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Stethoscope className="w-5 h-5 text-indigo-600" />
                  <span className="text-xs font-bold block">Doctor Roster</span>
                  <span className="text-[10px] text-slate-400">Manage OPD doctors</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-slate-200/90 shadow-[0_-4px_25px_rgba(0,0,0,0.08)] px-1 sm:px-2 pt-1.5 pb-[max(0.6rem,env(safe-area-inset-bottom))] select-none transition-all">
        <div className="max-w-md mx-auto flex items-center justify-around">
          {userMode === 'patient' ? (
            <>
              {/* 1. Discover Clinics */}
              <button
                onClick={() => setActiveTab('discover')}
                className={`flex-1 py-1.5 px-1 flex flex-col items-center justify-center rounded-xl transition-all cursor-pointer ${
                  activeTab === 'discover'
                    ? 'text-[#0E7C86] font-bold bg-teal-50/90 scale-105'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Building2 className={`w-5 h-5 ${activeTab === 'discover' ? 'text-[#0E7C86]' : 'text-slate-400'}`} />
                <span className="text-[11px] mt-0.5 tracking-tight font-medium">Discover</span>
              </button>

              {/* 2. My Tokens */}
              <button
                onClick={() => {
                  setActiveTab('tokens');
                  if (!isAuthenticated) onOpenLogin();
                }}
                className={`flex-1 py-1.5 px-1 flex flex-col items-center justify-center rounded-xl transition-all cursor-pointer relative ${
                  activeTab === 'tokens'
                    ? 'text-[#0E7C86] font-bold bg-teal-50/80 scale-105'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <div className="relative">
                  <Ticket className={`w-5 h-5 ${activeTab === 'tokens' ? 'text-[#0E7C86]' : 'text-slate-400'}`} />
                  {isAuthenticated && activeUserTokens.length > 0 && (
                    <span className="absolute -top-1.5 -right-2 px-1.5 py-0.2 text-[10px] font-extrabold bg-amber-400 text-slate-900 rounded-full animate-bounce shadow-sm">
                      {activeUserTokens.length}
                    </span>
                  )}
                </div>
                <span className="text-[11px] mt-0.5 tracking-tight font-medium">My Tokens</span>
              </button>

              {/* 3. Visit History */}
              <button
                onClick={() => {
                  setActiveTab('history');
                  if (!isAuthenticated) onOpenLogin();
                }}
                className={`flex-1 py-1.5 px-1 flex flex-col items-center justify-center rounded-xl transition-all cursor-pointer ${
                  activeTab === 'history'
                    ? 'text-[#0E7C86] font-bold bg-teal-50/80 scale-105'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Clock className={`w-5 h-5 ${activeTab === 'history' ? 'text-[#0E7C86]' : 'text-slate-400'}`} />
                <span className="text-[11px] mt-0.5 tracking-tight font-medium">Visits</span>
              </button>

              {/* 4. Profile / Login */}
              <button
                onClick={() => {
                  setActiveTab('profile');
                  if (!isAuthenticated) onOpenLogin();
                }}
                className={`flex-1 py-1.5 px-1 flex flex-col items-center justify-center rounded-xl transition-all cursor-pointer ${
                  activeTab === 'profile'
                    ? 'text-[#0E7C86] font-bold bg-teal-50/80 scale-105'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <UserCheck className={`w-5 h-5 ${activeTab === 'profile' ? 'text-[#0E7C86]' : 'text-slate-400'}`} />
                <span className="text-[11px] mt-0.5 tracking-tight font-medium">
                  {isAuthenticated ? 'Profile' : 'Sign In'}
                </span>
              </button>
            </>
          ) : (
            <>
              {/* Staff Navigation Tabs */}
              {/* 1. OPD Queue Console */}
              <button
                onClick={() => setActiveTab('staff-dashboard')}
                className={`flex-1 py-1 px-0.5 flex flex-col items-center justify-center rounded-xl transition-all cursor-pointer ${
                  activeTab === 'staff-dashboard'
                    ? 'text-indigo-700 font-bold bg-indigo-50 scale-105'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Activity className={`w-5 h-5 ${activeTab === 'staff-dashboard' ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span className="text-[10px] mt-0.5 tracking-tight font-medium truncate">OPD Queue</span>
              </button>

              {/* 2. Doctor Profile / Doctors */}
              {userRole === 'doctor' ? (
                <button
                  onClick={() => setActiveTab('doctor-profile')}
                  className={`flex-1 py-1 px-0.5 flex flex-col items-center justify-center rounded-xl transition-all cursor-pointer ${
                    activeTab === 'doctor-profile'
                      ? 'text-indigo-700 font-bold bg-indigo-50 scale-105'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Stethoscope className={`w-5 h-5 ${activeTab === 'doctor-profile' ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <span className="text-[10px] mt-0.5 tracking-tight font-medium truncate">Duty Status</span>
                </button>
              ) : (
                <button
                  onClick={() => setActiveTab('staff-doctors')}
                  className={`flex-1 py-1 px-0.5 flex flex-col items-center justify-center rounded-xl transition-all cursor-pointer ${
                    activeTab === 'staff-doctors'
                      ? 'text-indigo-700 font-bold bg-indigo-50 scale-105'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Stethoscope className={`w-5 h-5 ${activeTab === 'staff-doctors' ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <span className="text-[10px] mt-0.5 tracking-tight font-medium truncate">Doctors</span>
                </button>
              )}

              {/* 3. Staff Accounts (Presented in Mobile App!) */}
              {userRole !== 'doctor' && (
                <button
                  onClick={() => setActiveTab('staff-accounts')}
                  className={`flex-1 py-1 px-0.5 flex flex-col items-center justify-center rounded-xl transition-all cursor-pointer ${
                    activeTab === 'staff-accounts'
                      ? 'text-indigo-700 font-bold bg-indigo-50 scale-105'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Users className={`w-5 h-5 ${activeTab === 'staff-accounts' ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <span className="text-[10px] mt-0.5 tracking-tight font-medium truncate">Staff</span>
                </button>
              )}

              {/* 4. Leave Approvals (for Business Owner) OR Reports (for Doctor) */}
              {userRole === 'business_owner' ? (
                <button
                  onClick={() => setActiveTab('leave-approvals')}
                  className={`flex-1 py-1 px-0.5 flex flex-col items-center justify-center rounded-xl transition-all cursor-pointer relative ${
                    activeTab === 'leave-approvals'
                      ? 'text-indigo-700 font-bold bg-indigo-50 scale-105'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <div className="relative">
                    <Clock className={`w-5 h-5 ${activeTab === 'leave-approvals' ? 'text-indigo-600' : 'text-slate-400'}`} />
                    {pendingLeaves.length > 0 && (
                      <span className="absolute -top-1.5 -right-2 px-1.5 py-0.2 text-[9px] font-extrabold bg-amber-400 text-slate-900 rounded-full animate-bounce">
                        {pendingLeaves.length}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] mt-0.5 tracking-tight font-medium truncate">Leaves</span>
                </button>
              ) : userRole === 'doctor' ? (
                <button
                  onClick={() => setActiveTab('staff-analytics')}
                  className={`flex-1 py-1 px-0.5 flex flex-col items-center justify-center rounded-xl transition-all cursor-pointer ${
                    activeTab === 'staff-analytics'
                      ? 'text-indigo-700 font-bold bg-indigo-50 scale-105'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <TrendingUp className={`w-5 h-5 ${activeTab === 'staff-analytics' ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <span className="text-[10px] mt-0.5 tracking-tight font-medium truncate">Reports</span>
                </button>
              ) : null}

              {/* 5. More Menu Drawer (Reports, Reviews & Extras) */}
              <button
                onClick={() => setShowStaffMore(!showStaffMore)}
                className={`flex-1 py-1 px-0.5 flex flex-col items-center justify-center rounded-xl transition-all cursor-pointer ${
                  activeTab === 'staff-analytics' || activeTab === 'staff-reviews'
                    ? 'text-indigo-700 font-bold bg-indigo-50 scale-105'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <MoreHorizontal className={`w-5 h-5 ${activeTab === 'staff-analytics' || activeTab === 'staff-reviews' ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span className="text-[10px] mt-0.5 tracking-tight font-medium truncate">More</span>
              </button>
            </>
          )}
        </div>
      </nav>
    </>
  );
}
