import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, User, Building2, LogIn } from 'lucide-react';

export default function RequireAuth({ role = 'patient', children, onRequireLogin }) {
  const { isAuthenticated, userRole, logout } = useAuth();

  // 1. Unauthenticated User Check
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="p-8 bg-white rounded-3xl border border-slate-200 shadow-xl space-y-4 animate-in fade-in zoom-in-95">
          <div className="w-14 h-14 bg-clinical-50 text-clinical-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            {role === 'staff' ? (
              <Building2 className="w-7 h-7 text-[#0E7C86]" />
            ) : (
              <User className="w-7 h-7 text-clinical-600" />
            )}
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-800">
              {role === 'staff' ? 'Hospital Staff Sign-In Required' : 'Patient Authentication Required'}
            </h2>
            <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
              {role === 'staff'
                ? 'Sign in to access your hospital dashboard, doctor OPD desk, and queue management.'
                : 'Sign in to book live OPD tokens, view estimated call times, and access past visits.'}
            </p>
          </div>

          <button
            type="button"
            onClick={onRequireLogin}
            className="w-full py-3.5 bg-[#0E7C86] hover:bg-clinical-600 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In / Register Account</span>
          </button>
        </div>
      </div>
    );
  }

  // 2. Wrong Role Check (e.g. Patient trying to access Staff Console)
  const isRoleMatching =
    role === 'patient'
      ? userRole === 'patient'
      : ['business_owner', 'doctor', 'staff_operator', 'staff'].includes(userRole);

  if (!isRoleMatching) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="p-8 bg-white rounded-3xl border border-rose-200 shadow-xl space-y-4 animate-in fade-in zoom-in-95">
          <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <ShieldAlert className="w-7 h-7" />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-800">
              Access Restricted
            </h2>
            <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
              Your account is signed in as a <strong className="capitalize text-slate-700">{userRole}</strong>. This page requires a <strong className="capitalize text-slate-700">{role}</strong> account.
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <button
              type="button"
              onClick={onRequireLogin}
              className="w-full py-3 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all"
            >
              Switch Account / Role
            </button>
            <button
              type="button"
              onClick={logout}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer transition-all"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
