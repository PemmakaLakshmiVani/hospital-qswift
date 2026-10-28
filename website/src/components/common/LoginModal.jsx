import React, { useState } from 'react';
import {
  Activity,
  User,
  Building2,
  Phone,
  Lock,
  ArrowRight,
  Stethoscope,
  Ticket,
  KeyRound,
  CheckCircle2,
  FileCheck,
  Mail
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useQueue } from '../../context/QueueContext';

function SearchableHospitalPicker({ hospitals, selectedHospitalId, onSelectHospital, label = "Select Hospital Facility" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedHospital = hospitals.find(h => h.id === selectedHospitalId) || hospitals[0];

  const filteredHospitals = hospitals.filter(h => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      h.name.toLowerCase().includes(query) ||
      h.address.toLowerCase().includes(query) ||
      (h.specialties && h.specialties.some(s => s.toLowerCase().includes(query)))
    );
  });

  return (
    <div className="relative space-y-1">
      <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
        <span className="flex items-center gap-1">
          <Building2 className="w-3.5 h-3.5 text-clinical-600" />
          <span>{label}</span>
        </span>
        {selectedHospital && (
          <span className="text-[10px] text-emerald-600 font-bold truncate max-w-[180px]">✓ {selectedHospital.name}</span>
        )}
      </label>

      {/* Input Combobox */}
      <div className="relative">
        <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" />
        <input
          type="text"
          placeholder="🔍 Search hospital by name or location (e.g. Apollo, Chennai)..."
          value={isOpen ? searchQuery : (selectedHospital ? `${selectedHospital.name} — ${selectedHospital.address}` : '')}
          onFocus={() => {
            setIsOpen(true);
            setSearchQuery('');
          }}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          className="w-full pl-10 pr-8 py-2.5 text-xs font-bold text-ink bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-clinical-500 font-medium cursor-pointer"
        />
        <button
          type="button"
          onClick={() => {
            setIsOpen(!isOpen);
            if (!isOpen) setSearchQuery('');
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
        >
          {isOpen ? '▲' : '▼'}
        </button>
      </div>

      {/* Dropdown Options Popup List */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 max-h-60 overflow-y-auto divide-y divide-slate-100 animate-in fade-in">
          <div className="p-2 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider sticky top-0 flex items-center justify-between border-b border-slate-100 z-10">
            <span>All Hospital Facilities ({filteredHospitals.length})</span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-600 text-xs font-bold px-1 cursor-pointer"
            >
              Close ✕
            </button>
          </div>

          {filteredHospitals.length > 0 ? (
            filteredHospitals.map((h) => {
              const isSelected = h.id === selectedHospitalId;
              return (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => {
                    onSelectHospital(h.id);
                    setIsOpen(false);
                    setSearchQuery('');
                  }}
                  className={`w-full p-3 text-left hover:bg-clinical-50/70 transition-colors flex items-center justify-between gap-2 cursor-pointer ${
                    isSelected ? 'bg-clinical-50/90 font-bold border-l-4 border-clinical-600' : ''
                  }`}
                >
                  <div>
                    <p className="text-xs font-bold text-ink">{h.name}</p>
                    <p className="text-[10px] text-slate-500 truncate">{h.address}</p>
                  </div>
                  {isSelected && (
                    <span className="text-[10px] font-bold text-clinical-700 bg-clinical-100 px-2 py-0.5 rounded-md shrink-0">
                      Selected ✓
                    </span>
                  )}
                </button>
              );
            })
          ) : (
            <div className="p-4 text-center text-xs text-slate-400 italic">
              No hospital facility found matching "{searchQuery}". Try searching another name or location!
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function LoginModal({ onClose, onOpenOnboarding }) {
  const {
    login,
    registerPatient,
    loginPatientWithPhone,
    loginStaffOperator,
    loginBusinessWithOwner,
    loginDoctor,
    pendingEmailAuth,
    setPendingEmailAuth,
    sendEmailAuthCode,
    verifyEmailAuthCode,
    loginWithGoogle,
    signInWithSupabase,
    signUpWithSupabase,
    resetPasswordWithSupabase,
    registeredPatients,
    isSupabaseConfigured
  } = useAuth();
  const { doctors, hospitals } = useQueue();

  // Active Login Role Tab: 'patient' | 'business_owner' | 'doctor' | 'staff_operator'
  const [activeRoleTab, setActiveRoleTab] = useState('patient');
  
  // Patient Auth Mode: 'signin' | 'register'
  const [patientAuthMode, setPatientAuthMode] = useState('signin');
  
  // Forgot Password View Toggle
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSuccessMessage, setResetSuccessMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Input States
  const [phoneOrEmail, setPhoneOrEmail] = useState('patient@example.com');
  const [passwordOrOtp, setPasswordOrOtp] = useState('password123');
  const [staffInviteCode, setStaffInviteCode] = useState('HSP-STAFF-2026');
  const [ownerEmail, setOwnerEmail] = useState('owner@apolloclinic.com');
  const [ownerPassword, setOwnerPassword] = useState('password123');
  const [doctorUsername, setDoctorUsername] = useState('DR_MEERA_RAO');
  const [doctorPassword, setDoctorPassword] = useState('doc123');
  const [staffUsername, setStaffUsername] = useState('APOLLO_STAFF_1');
  const [staffPassword, setStaffPassword] = useState('password123');
  const [selectedHospitalId, setSelectedHospitalId] = useState(hospitals[0]?.id || 'hsp-1');
  const [otpSent, setOtpSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Email & Google Authentication States
  const [emailVerificationCode, setEmailVerificationCode] = useState('');
  const [showGoogleChooser, setShowGoogleChooser] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');

  // Backend Server IP Configuration
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [serverUrlInput, setServerUrlInput] = useState(() => {
    return (typeof window !== 'undefined' && window.localStorage ? window.localStorage.getItem('hqswift_custom_backend_url') : '') || 'http://172.18.100.77:4000';
  });
  const [serverSaveMessage, setServerSaveMessage] = useState('');

  const handleSaveServerUrl = (urlToSave) => {
    let cleanUrl = (urlToSave || serverUrlInput || '').trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = `http://${cleanUrl}`;
    }
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('hqswift_custom_backend_url', cleanUrl);
    }
    setServerSaveMessage(`Saved: ${cleanUrl} (Reloading...)`);
    setTimeout(() => {
      window.location.reload();
    }, 700);
  };

  // New Patient Registration Form State
  const [registerForm, setRegisterForm] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    age: '',
    gender: 'Female',
    bloodGroup: 'B+',
    emergencyContact: '',
    medicalNotes: ''
  });


  // Handle Email Verification Code Submission
  const handleVerifyEmailCodeSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');
    const res = verifyEmailAuthCode(emailVerificationCode);
    if (res.success) {
      if (onClose) onClose();
    } else {
      setErrorMessage(res.message);
    }
  };

  // Handle Google SSO Selection
  const handleGoogleSelect = (emailToUse, nameToUse = '') => {
    if (!emailToUse || !emailToUse.includes('@')) {
      setErrorMessage('Please enter a valid Google email address.');
      return;
    }
    setErrorMessage('');
    setShowGoogleChooser(false);
    const res = loginWithGoogle(emailToUse, activeRoleTab, nameToUse);
    if (res.success) {
      setEmailVerificationCode(res.code); // Convenience auto-fill code
    } else {
      setErrorMessage(res.message);
    }
  };

  // Handle Forgot Password Form Submit
  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setResetSuccessMessage('');
    if (!resetEmail) {
      setErrorMessage('Please enter your account email address.');
      return;
    }

    setSubmitting(true);
    const res = await resetPasswordWithSupabase(resetEmail);
    setSubmitting(false);

    if (res.success) {
      setResetSuccessMessage(res.message);
    } else {
      setErrorMessage(res.message);
    }
  };

  // Handle Patient Sign In
  const handlePatientLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (isSupabaseConfigured) {
      setSubmitting(true);
      const res = await signInWithSupabase({ email: phoneOrEmail, password: passwordOrOtp });
      setSubmitting(false);

      if (res.success) {
        if (onClose) onClose();
        return;
      }

      // Secondary fallback to local registered patients if network fails (e.g. "Failed to fetch")
      const pEmail = (phoneOrEmail || '').trim().toLowerCase();
      const pPass = passwordOrOtp || '';
      const localPatient = (registeredPatients || []).find(p => 
        (p.email && p.email.toLowerCase() === pEmail) || (p.phone && p.phone === pEmail)
      );

      if (localPatient && (!localPatient.password || localPatient.password === pPass)) {
        login('patient', localPatient);
        if (onClose) onClose();
        return;
      }

      setErrorMessage(res.message);
      return;
    }

    // Local / Phone Mode Fallback
    const validation = loginPatientWithPhone(phoneOrEmail);
    if (!validation.success) {
      setErrorMessage(validation.message);
      setOtpSent(false);
      return;
    }

    if (!otpSent) {
      setOtpSent(true);
      setPasswordOrOtp('1234');
      return;
    }

    login('patient', validation.patient);
    if (onClose) onClose();
  };

  // Handle New Patient Registration
  const handlePatientRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!registerForm.name) return;
    setErrorMessage('');

    if (isSupabaseConfigured) {
      if (!registerForm.email || !registerForm.password) {
        setErrorMessage('Please enter an email and password for your patient account.');
        return;
      }

      setSubmitting(true);
      const res = await signUpWithSupabase({
        email: registerForm.email,
        password: registerForm.password,
        fullName: registerForm.name,
        phone: registerForm.phone,
        role: 'patient',
        bloodGroup: registerForm.bloodGroup || 'None',
        emergencyContact: registerForm.emergencyContact ? registerForm.emergencyContact.trim() : 'None',
        medicalNotes: registerForm.medicalNotes ? registerForm.medicalNotes.trim() : 'None',
        age: registerForm.age,
        gender: registerForm.gender
      });
      setSubmitting(false);

      if (res.success) {
        if (onClose) onClose();
      } else {
        setErrorMessage(res.message);
      }
      return;
    }

    // Local Fallback
    registerPatient({
      name: registerForm.name,
      phone: registerForm.phone || '+91 98765 12345',
      email: registerForm.email || `${(registerForm.phone || 'patient').replace(/[^0-9]/g, '')}@patient.qswift.com`,
      age: registerForm.age || '30',
      gender: registerForm.gender,
      blood_group: registerForm.bloodGroup,
      emergency_contact: registerForm.emergencyContact || registerForm.phone,
      medical_notes: registerForm.medicalNotes || 'No known drug allergies',
      role: 'patient'
    });

    if (onClose) onClose();
  };

  // Handle Hospital Staff / Owner Sign In & Sign Up
  const handleOwnerLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (isSupabaseConfigured) {
      setSubmitting(true);
      const res = await signInWithSupabase({ email: ownerEmail, password: ownerPassword });
      setSubmitting(false);

      if (res.success) {
        if (onClose) onClose();
        return;
      }
      
      // Secondary fallback to local business accounts
      const localRes = loginBusinessWithOwner(ownerEmail, ownerPassword, selectedHospitalId);
      if (localRes.success) {
        if (onClose) onClose();
        return;
      }

      setErrorMessage(res.message || localRes.message || 'Invalid login credentials');
      return;
    }

    const res = loginBusinessWithOwner(ownerEmail, ownerPassword, selectedHospitalId);
    if (res.success) {
      if (onClose) onClose();
    } else {
      setErrorMessage(res.message);
    }
  };


  // Handle Doctor OPD Desk Sign In (Doctor Username + Password)
  const handleDoctorSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (isSupabaseConfigured) {
      setSubmitting(true);
      const email = doctorUsername.includes('@') ? doctorUsername : `${doctorUsername}@example.com`;
      const res = await signInWithSupabase({ email, password: doctorPassword });
      setSubmitting(false);

      if (res.success) {
        if (onClose) onClose();
        return;
      }

      // Secondary fallback to local doctor authentication
      const localRes = loginDoctor(doctorUsername, doctorPassword, doctors, selectedHospitalId);
      if (localRes.success) {
        if (onClose) onClose();
        return;
      }

      setErrorMessage(res.message || localRes.message || 'Invalid Doctor Username or Password');
      return;
    }

    const res = loginDoctor(doctorUsername, doctorPassword, doctors, selectedHospitalId);
    if (res.success) {
      if (onClose) onClose();
    } else {
      setErrorMessage(res.message);
    }
  };

  // Handle Clinic Staff Operator Login (Username + Password created by Owner)
  const handleStaffOperatorSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanUsername = (staffUsername || '').trim();
    if (!cleanUsername || !staffPassword) {
      setErrorMessage('Please enter both staff username and password');
      return;
    }

    if (isSupabaseConfigured) {
      setSubmitting(true);
      const email = cleanUsername.includes('@') ? cleanUsername : `${cleanUsername.toLowerCase()}@example.com`;
      const res = await signInWithSupabase({ email, password: staffPassword });
      setSubmitting(false);

      if (res.success) {
        if (onClose) onClose();
        return;
      }

      // Secondary fallback to local staffAccounts if Supabase auth returned an error
      const localRes = loginStaffOperator(cleanUsername, staffPassword, selectedHospitalId);
      if (localRes.success) {
        if (onClose) onClose();
        return;
      }

      setErrorMessage(res.message || 'Invalid Staff Username or Password');
      return;
    }

    const res = loginStaffOperator(cleanUsername, staffPassword, selectedHospitalId);
    if (res.success) {
      if (onClose) onClose();
    } else {
      setErrorMessage(res.message || 'Invalid Username or Password');
    }
  };


  // Quick Seeded Account Sign In Shortcuts (Authenticate through Supabase)
  const handleDemoPatientLogin = async () => {
    setSubmitting(true);
    const res = await signInWithSupabase({ email: 'patient@example.com', password: 'password123' });
    setSubmitting(false);
    if (res.success && onClose) onClose();
    else if (!res.success) setErrorMessage(res.message);
  };

  const handleDemoOwnerLogin = async () => {
    setSubmitting(true);
    const res = await signInWithSupabase({ email: 'owner@apolloclinic.com', password: 'password123' });
    setSubmitting(false);
    if (res.success && onClose) onClose();
    else if (!res.success) setErrorMessage(res.message);
  };

  const handleDemoStaffOperatorLogin = async () => {
    setSubmitting(true);
    const res = await signInWithSupabase({ email: 'APOLLO_STAFF_1@example.com', password: 'password123' });
    setSubmitting(false);
    if (res.success && onClose) onClose();
    else if (!res.success) setErrorMessage(res.message);
  };

  return (
    <div className="fixed inset-0 z-50 bg-ink/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-200 animate-in zoom-in-95 my-8">

        {/* Top Header: About Hospital Qswift Concept */}
        <div className="bg-gradient-to-r from-clinical-700 via-clinical-500 to-indigoConsole text-white p-6 sm:p-8 relative">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amberState text-ink flex items-center justify-center font-bold shadow-md">
                <Activity className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-amberState bg-indigo-950/60 px-2.5 py-0.5 rounded-full border border-amberState/30">
                  HEALTHCARE OPD PLATFORM
                </span>
                <h2 className="font-display text-2xl font-bold tracking-tight">Welcome to Hospital Qswift</h2>
              </div>
            </div>
            {onClose && (
              <button onClick={onClose} className="text-white/80 hover:text-white text-xs font-bold bg-white/10 px-2.5 py-1 rounded-lg">
                ✕ Close
              </button>
            )}
          </div>

          <p className="text-xs sm:text-sm text-clinical-100 mt-2 leading-relaxed max-w-xl">
            Live walk-in doctor tokens for patients & verified queue management consoles for hospitals and clinic staff.
          </p>

          <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-white/15 text-[11px] font-medium text-white/90">
            <div className="flex items-center gap-1.5">
              <Ticket className="w-3.5 h-3.5 text-amberState shrink-0" />
              <span>Live OPD Tokens</span>
            </div>
            <div className="flex items-center gap-1.5">
              <FileCheck className="w-3.5 h-3.5 text-amberState shrink-0" />
              <span>Verified Proofs</span>
            </div>
            <div className="flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-amberState shrink-0" />
              <span>Staff Login Access</span>
            </div>
          </div>
        </div>

        {/* Login Role Tabs: Customer / Hospital Business Owner / Staff Operator */}
        <div className="p-6 sm:p-8 space-y-6">

          {/* Active Email Authentication Security Code Verification View */}
          {pendingEmailAuth ? (
            <div className="space-y-5 animate-in fade-in zoom-in-95">
              <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl text-amber-900 space-y-3 shadow-xs">
                <div className="flex items-center gap-2 font-bold text-xs text-amber-800">
                  <Activity className="w-4 h-4 text-amber-600 animate-spin" />
                  <span>AUTHENTICATION SECURITY CODE DISPATCHED</span>
                </div>
                <p className="text-xs leading-relaxed">
                  A 6-digit security authentication notification code was sent to your email: <strong className="font-mono text-ink font-bold bg-amber-100/80 px-1.5 py-0.5 rounded">{pendingEmailAuth.email}</strong>.
                </p>
                <div className="p-3 bg-white border border-amber-200 rounded-xl flex items-center justify-between text-xs shadow-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Verification Code</span>
                    <strong className="font-mono text-base font-bold text-clinical-700 tracking-widest">{pendingEmailAuth.code}</strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEmailVerificationCode(pendingEmailAuth.code)}
                    className="px-3 py-1.5 bg-amber-200 hover:bg-amber-300 text-amber-950 font-bold rounded-lg text-xs cursor-pointer transition-all flex items-center gap-1"
                  >
                    <span>⚡ Auto-Fill Code</span>
                  </button>
                </div>
              </div>

              <form onSubmit={handleVerifyEmailCodeSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Enter 6-Digit Email Verification Code *
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="e.g. 184920"
                    value={emailVerificationCode}
                    onChange={(e) => setEmailVerificationCode(e.target.value)}
                    className="w-full px-4 py-3 text-center font-mono text-2xl font-bold tracking-widest bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-clinical-500"
                    required
                  />
                </div>

                {errorMessage && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-semibold text-center">
                    ⚠️ {errorMessage}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Verify Email Code & Complete Sign In</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPendingEmailAuth(null)}
                  className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 text-center cursor-pointer"
                >
                  ← Cancel & Choose Other Sign In Method
                </button>
              </form>
            </div>
          ) : forgotPasswordMode ? (
            /* Forgot Password Email Notification View */
            <div className="space-y-5 animate-in fade-in zoom-in-95">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="p-3 bg-sky-100 text-sky-700 rounded-2xl">
                  <KeyRound className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Forgot Password?</h3>
                  <p className="text-xs text-slate-500">Send password reset instructions & link to your email notification.</p>
                </div>
              </div>

              {resetSuccessMessage ? (
                <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 font-bold text-xs text-emerald-800">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>EMAIL RESET NOTIFICATION DISPATCHED</span>
                  </div>
                  <p className="text-xs leading-relaxed">
                    {resetSuccessMessage}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotPasswordMode(false);
                      setResetSuccessMessage('');
                    }}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
                  >
                    ← Return to Sign In
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                  {errorMessage && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-semibold">
                      ⚠️ {errorMessage}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Account Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="email"
                        required
                        placeholder="e.g. user@example.com"
                        value={resetEmail}
                        onChange={(e) => { setResetEmail(e.target.value); setErrorMessage(''); }}
                        className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-clinical-500 font-medium"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">An automated password reset notification email will be sent here.</p>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 bg-[#0E7C86] hover:bg-clinical-600 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Mail className="w-4 h-4" />
                    <span>{submitting ? 'Dispatching Email Notification...' : 'Send Password Reset Email Notification'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setForgotPasswordMode(false);
                      setErrorMessage('');
                    }}
                    className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 text-center cursor-pointer"
                  >
                    ← Cancel & Back to Sign In
                  </button>
                </form>
              )}
            </div>
          ) : (
            <>
              <div className="flex p-1.5 bg-slate-100 rounded-2xl border border-slate-200 gap-1 overflow-x-auto">
                <button
                  onClick={() => { setActiveRoleTab('patient'); setOtpSent(false); setErrorMessage(''); }}
                  className={`flex-1 py-2.5 px-2 text-[11px] font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all shrink-0 ${
                    activeRoleTab === 'patient'
                      ? 'bg-white text-clinical-700 shadow-sm'
                      : 'text-slate-500 hover:text-ink'
                  }`}
                >
                  <User className="w-3.5 h-3.5 text-clinical-600" />
                  <span>Patient</span>
                </button>

                <button
                  onClick={() => { setActiveRoleTab('business_owner'); setErrorMessage(''); }}
                  className={`flex-1 py-2.5 px-2 text-[11px] font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all shrink-0 ${
                    activeRoleTab === 'business_owner'
                      ? 'bg-[#0E7C86] text-white shadow-sm'
                      : 'text-slate-500 hover:text-ink'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Hospital Owner</span>
                </button>

                <button
                  onClick={() => { setActiveRoleTab('doctor'); setErrorMessage(''); }}
                  className={`flex-1 py-2.5 px-2 text-[11px] font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all shrink-0 ${
                    activeRoleTab === 'doctor'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-500 hover:text-ink'
                  }`}
                >
                  <Stethoscope className="w-3.5 h-3.5" />
                  <span>Doctor</span>
                </button>

                <button
                  onClick={() => { setActiveRoleTab('staff_operator'); setErrorMessage(''); }}
                  className={`flex-1 py-2.5 px-2 text-[11px] font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all shrink-0 ${
                    activeRoleTab === 'staff_operator'
                      ? 'bg-indigoConsole text-white shadow-sm'
                      : 'text-slate-500 hover:text-ink'
                  }`}
                >
                  <KeyRound className="w-3.5 h-3.5 text-amberState" />
                  <span>Staff Operator</span>
                </button>
              </div>

              {/* Google SSO Button Bar */}
              <button
                type="button"
                onClick={() => setShowGoogleChooser(true)}
                className="w-full py-3 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 shadow-xs flex items-center justify-center gap-2.5 transition-all transform active:scale-98 cursor-pointer"
              >
                <svg className="w-4.5 h-4.5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Sign In with Google Account</span>
              </button>

          {/* Form 1: Customer / Patient Login & Registration */}
          {activeRoleTab === 'patient' && (
            <div className="space-y-4">
              {/* Patient Sub-toggle: Email Sign In vs Mobile OTP vs Register */}
              <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200 text-xs font-semibold gap-1">
                <button
                  type="button"
                  onClick={() => { setPatientAuthMode('signin'); setErrorMessage(''); }}
                  className={`flex-1 py-1.5 rounded-lg transition-all ${
                    patientAuthMode === 'signin'
                      ? 'bg-clinical-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-ink'
                  }`}
                >
                  Email & Password
                </button>
                <button
                  type="button"
                  onClick={() => { setPatientAuthMode('mobile_otp'); setErrorMessage(''); }}
                  className={`flex-1 py-1.5 rounded-lg transition-all ${
                    patientAuthMode === 'mobile_otp'
                      ? 'bg-clinical-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-ink'
                  }`}
                >
                  Mobile Phone OTP
                </button>
                <button
                  type="button"
                  onClick={() => { setPatientAuthMode('register'); setErrorMessage(''); }}
                  className={`flex-1 py-1.5 rounded-lg transition-all ${
                    patientAuthMode === 'register'
                      ? 'bg-clinical-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-ink'
                  }`}
                >
                  New Registration
                </button>
              </div>

              {/* Sub-form 1A: Patient Email & Password Sign In */}
              {patientAuthMode === 'signin' && (
                <form onSubmit={handlePatientLoginSubmit} className="space-y-4">
                  {errorMessage && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl space-y-2 animate-in fade-in font-medium">
                      <p>⚠️ {errorMessage}</p>
                      <button
                        type="button"
                        onClick={() => {
                          setPatientAuthMode('register');
                          setRegisterForm(prev => ({ ...prev, email: phoneOrEmail }));
                          setErrorMessage('');
                        }}
                        className="px-3 py-1.5 bg-[#0E7C86] hover:bg-clinical-600 text-white font-bold text-xs rounded-lg shadow-xs flex items-center gap-1 transition-colors"
                      >
                        <span>Go to New Patient Registration</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Patient Email Address *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="email"
                        required
                        placeholder="patient@example.com"
                        value={phoneOrEmail}
                        onChange={(e) => { setPhoneOrEmail(e.target.value); setErrorMessage(''); }}
                        className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-clinical-500"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-700">
                        Account Password *
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setForgotPasswordMode(true);
                          setResetEmail(phoneOrEmail.includes('@') ? phoneOrEmail : '');
                          setErrorMessage('');
                        }}
                        className="text-[11px] font-semibold text-[#0E7C86] hover:underline"
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={passwordOrOtp}
                        onChange={(e) => setPasswordOrOtp(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-clinical-500 font-medium"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 bg-[#0E7C86] hover:bg-clinical-600 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <span>{submitting ? 'Authenticating...' : 'Sign In & Open Patient Dashboard'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}

              {/* Sub-form 1B: Mobile Phone OTP Sign In */}
              {patientAuthMode === 'mobile_otp' && (
                <form onSubmit={handlePatientLoginSubmit} className="space-y-4">
                  <div className="p-3.5 bg-sky-50 border border-sky-200 text-sky-900 text-xs rounded-2xl space-y-1.5">
                    <div className="flex items-center gap-2 font-bold text-sky-800">
                      <Phone className="w-4 h-4 text-sky-600" />
                      <span>Mobile Phone OTP Authentication</span>
                    </div>
                    <p className="text-[11px] text-sky-700 leading-relaxed">
                      💡 <strong>Notice regarding physical SMS delivery:</strong> Real SMS to mobile handsets requires a paid Twilio / SMS Gateway API integration in Supabase. In this web sandbox demo, your 4-digit OTP is generated directly on-screen below.
                    </p>
                  </div>

                  {errorMessage && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-semibold">
                      ⚠️ {errorMessage}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Patient Mobile Phone Number *
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        placeholder="+91 98765 12345"
                        value={phoneOrEmail}
                        onChange={(e) => { setPhoneOrEmail(e.target.value); setErrorMessage(''); setOtpSent(false); }}
                        className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-clinical-500 font-medium"
                      />
                    </div>
                  </div>

                  {otpSent && (
                    <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl space-y-3 animate-in fade-in">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>MOBILE OTP DISPATCHED (SANDBOX DEMO)</span>
                        </span>
                        <span className="text-[10px] bg-emerald-200 text-emerald-900 font-mono px-2 py-0.5 rounded font-bold">
                          OTP: {passwordOrOtp || '1234'}
                        </span>
                      </div>
                      <p className="text-xs text-emerald-800">
                        Verification code sent to <strong>{phoneOrEmail}</strong>. Click below to auto-fill:
                      </p>
                      <button
                        type="button"
                        onClick={() => setPasswordOrOtp('1234')}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-colors"
                      >
                        ⚡ Auto-Fill Verification Code (1234)
                      </button>

                      <div className="pt-2">
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Enter 4-Digit OTP Code *</label>
                        <input
                          type="text"
                          required
                          maxLength="4"
                          placeholder="1 2 3 4"
                          value={passwordOrOtp}
                          onChange={(e) => setPasswordOrOtp(e.target.value)}
                          className="w-full px-4 py-2.5 text-center font-mono text-xl tracking-widest border border-emerald-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                        />
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3 bg-[#0E7C86] hover:bg-clinical-600 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <span>{otpSent ? 'Verify OTP & Enter Patient App' : 'Send Mobile OTP Code & Verify'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}

              {/* Sub-form 1C: New Patient Registration */}
              {patientAuthMode === 'register' && (
                <form onSubmit={handlePatientRegisterSubmit} className="space-y-3">

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Full Patient Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rajesh Kumar"
                      value={registerForm.name}
                      onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-clinical-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Phone *</label>
                      <input
                        type="text"
                        required
                        placeholder="+91 98765 12345"
                        value={registerForm.phone}
                        onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-clinical-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
                      <input
                        type="email"
                        required
                        placeholder="rajesh@example.com"
                        value={registerForm.email}
                        onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-clinical-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Account Password *</label>
                    <input
                      type="password"
                      required
                      placeholder="Minimum 6 characters..."
                      value={registerForm.password}
                      onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-clinical-500 font-medium"
                    />
                  </div>


                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Age</label>
                      <input
                        type="number"
                        placeholder="32"
                        value={registerForm.age}
                        onChange={(e) => setRegisterForm({ ...registerForm, age: e.target.value })}
                        className="w-full px-2.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-clinical-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
                      <select
                        value={registerForm.gender}
                        onChange={(e) => setRegisterForm({ ...registerForm, gender: e.target.value })}
                        className="w-full px-2 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-clinical-500"
                      >
                        <option value="Female">Female</option>
                        <option value="Male">Male</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Blood Group</label>
                      <select
                        value={registerForm.bloodGroup}
                        onChange={(e) => setRegisterForm({ ...registerForm, bloodGroup: e.target.value })}
                        className="w-full px-2 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-clinical-500 font-medium bg-white"
                      >
                        <option value="None">None</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Emergency Helpline</label>
                      <input
                        type="text"
                        placeholder="None (Optional)"
                        value={registerForm.emergencyContact}
                        onChange={(e) => setRegisterForm({ ...registerForm, emergencyContact: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-clinical-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Medical Allergies / Notes</label>
                      <input
                        type="text"
                        placeholder="None (Optional)"
                        value={registerForm.medicalNotes}
                        onChange={(e) => setRegisterForm({ ...registerForm, medicalNotes: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-clinical-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 mt-1 bg-[#0E7C86] hover:bg-clinical-600 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all"
                  >
                    <span>Create Account & Open Patient Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Form 2: Hospital Business Owner Login & Register Button */}
          {activeRoleTab === 'business_owner' && (
            <div className="space-y-4">
              <form onSubmit={handleOwnerLoginSubmit} className="space-y-4">
                {errorMessage && (
                  <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-xl space-y-2 animate-in fade-in">
                    <p className="font-semibold">{errorMessage}</p>
                    <button
                      type="button"
                      onClick={() => {
                        if (onClose) onClose();
                        if (onOpenOnboarding) onOpenOnboarding();
                      }}
                      className="px-3 py-1.5 bg-indigoConsole hover:bg-indigo-900 text-white font-bold text-xs rounded-lg shadow-xs flex items-center gap-1 transition-colors"
                    >
                      <span>+ Create & Register Hospital Business Now</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Searchable Hospital Selector */}
                <SearchableHospitalPicker
                  hospitals={hospitals}
                  selectedHospitalId={selectedHospitalId}
                  onSelectHospital={setSelectedHospitalId}
                  label="Select Registered Hospital Facility"
                />

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Hospital Business Owner Email
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="owner@apolloclinic.com"
                    value={ownerEmail}
                    onChange={(e) => { setOwnerEmail(e.target.value); setErrorMessage(''); }}
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-clinical-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Business Owner Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      required
                      placeholder="Enter password..."
                      value={ownerPassword}
                      onChange={(e) => { setOwnerPassword(e.target.value); setErrorMessage(''); }}
                      className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-clinical-500 font-medium"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Default Demo Login: owner@apolloclinic.com / password123</p>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-[#0E7C86] hover:bg-clinical-600 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all"
                >
                  <span>Sign In as Hospital Owner</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-ink">New Hospital Business?</p>
                  <p className="text-[11px] text-ink-muted">Register your facility with Clinical License & Council Reg proof</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (onClose) onClose();
                    if (onOpenOnboarding) onOpenOnboarding();
                  }}
                  className="px-4 py-2 bg-indigoConsole text-white text-xs font-bold rounded-xl hover:bg-indigo-900 shadow-sm shrink-0"
                >
                  + Register Hospital Business
                </button>
              </div>
            </div>
          )}

          {/* Form 3: Doctor OPD Console Login */}
          {activeRoleTab === 'doctor' && (
            <form onSubmit={handleDoctorSubmit} className="space-y-4">
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl">
                  {errorMessage}
                </div>
              )}

              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-900">
                <Stethoscope className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <strong className="font-bold">Doctor OPD Console Sign-In</strong>
                  <p className="text-[11px] text-emerald-800">Sign in to manage your doctor desk, call next tokens & view your queue.</p>
                </div>
              </div>

              {/* Searchable Hospital Selector */}
              <SearchableHospitalPicker
                hospitals={hospitals.filter(h => !h.is_deleted)}
                selectedHospitalId={selectedHospitalId}
                onSelectHospital={setSelectedHospitalId}
                label="Select Hospital / Clinic Facility"
              />

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Doctor Username / Registration ID
                </label>
                <div className="relative">
                  <Stethoscope className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. DR_MEERA_RAO"
                    value={doctorUsername}
                    onChange={(e) => { setDoctorUsername(e.target.value); setErrorMessage(''); }}
                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Credentials set by your hospital business owner in Doctor Roster</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Doctor Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    placeholder="doc123"
                    value={doctorPassword}
                    onChange={(e) => { setDoctorPassword(e.target.value); setErrorMessage(''); }}
                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Default Demo Doctor: DR_MEERA_RAO / doc123</p>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all"
              >
                <span>Sign In to Doctor OPD Console</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Form 3: Clinic Staff Operator Login (Username + Password created by Owner) */}
          {activeRoleTab === 'staff_operator' && (
            <form onSubmit={handleStaffOperatorSubmit} className="space-y-4">
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl">
                  {errorMessage}
                </div>
              )}

              {/* Searchable Hospital Selector */}
              <SearchableHospitalPicker
                hospitals={hospitals}
                selectedHospitalId={selectedHospitalId}
                onSelectHospital={setSelectedHospitalId}
                label="Select Hospital / Clinic Facility"
              />

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Staff Username / Operator Reg ID
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. APOLLO_STAFF_1"
                    value={staffUsername}
                    onChange={(e) => setStaffUsername(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigoConsole font-mono"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Credentials created by your hospital business owner</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Staff Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    placeholder="password123"
                    value={staffPassword}
                    onChange={(e) => setStaffPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigoConsole"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-indigoConsole hover:bg-indigo-900 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all"
              >
                <span>Login to OPD Queue Console</span>
                <ArrowRight className="w-4 h-4 text-amberState" />
              </button>
            </form>
          )}

          {/* Server / Backend IP Address Configuration Tool */}
          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowServerConfig(!showServerConfig)}
              className="w-full py-2 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold flex items-center justify-between cursor-pointer transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <span>⚙️</span>
                <span>Backend Server IP Settings</span>
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {showServerConfig ? '▲ Hide' : '▼ Configure IP'}
              </span>
            </button>

            {showServerConfig && (
              <div className="mt-2.5 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Backend Server URL</span>
                  <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">Port 4000</span>
                </div>
                
                <input
                  type="text"
                  placeholder="http://172.18.100.77:4000"
                  value={serverUrlInput}
                  onChange={(e) => {
                    setServerUrlInput(e.target.value);
                    setServerSaveMessage('');
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-clinical-500"
                />

                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setServerUrlInput('http://172.18.100.77:4000');
                      handleSaveServerUrl('http://172.18.100.77:4000');
                    }}
                    className="px-2.5 py-1 text-[11px] font-semibold bg-white border border-slate-200 hover:border-clinical-400 text-slate-700 rounded-lg cursor-pointer transition-all shadow-2xs"
                  >
                    📡 Host Wi-Fi IP (172.18.100.77)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setServerUrlInput('http://localhost:4000');
                      handleSaveServerUrl('http://localhost:4000');
                    }}
                    className="px-2.5 py-1 text-[11px] font-semibold bg-white border border-slate-200 hover:border-clinical-400 text-slate-700 rounded-lg cursor-pointer transition-all shadow-2xs"
                  >
                    🔌 USB Reverse (localhost)
                  </button>
                </div>

                {serverSaveMessage && (
                  <p className="text-xs text-emerald-700 font-semibold bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                    ✓ {serverSaveMessage}
                  </p>
                )}

                <button
                  type="button"
                  onClick={() => handleSaveServerUrl(serverUrlInput)}
                  className="w-full py-2 bg-clinical-600 hover:bg-clinical-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-all"
                >
                  Save & Apply Server IP
                </button>
              </div>
            )}
          </div>

          </>
        )}

        </div>
      </div>

      {/* Google SSO Account Chooser Dialog Modal */}
      {showGoogleChooser && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span className="font-bold text-sm text-slate-800">Sign in with Google</span>
              </div>
              <button
                type="button"
                onClick={() => setShowGoogleChooser(false)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold px-2 py-1 bg-slate-100 rounded-lg cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              Enter your Google email to authenticate with <strong>Hospital Qswift</strong>:
            </p>

            {/* Genuine Google Email Authentication Input */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-700">Google Account Email</label>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="yourname@gmail.com"
                  value={customGoogleEmail}
                  onChange={(e) => setCustomGoogleEmail(e.target.value)}
                  className="flex-1 px-3 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-clinical-500 font-medium"
                />
                <button
                  type="button"
                  onClick={() => handleGoogleSelect(customGoogleEmail)}
                  className="px-4 py-2.5 bg-[#0E7C86] hover:bg-clinical-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-all"
                >
                  Continue
                </button>
              </div>
              <p className="text-[11px] text-slate-400">A secure 6-digit verification code will be sent to confirm your email.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
