import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useQueue } from '../../context/QueueContext';
import { isSupabaseConfigured } from '../../lib/supabase';
import {
  Activity,
  MapPin,
  UserCheck,
  Building2,
  Ticket,
  ChevronDown,
  Plus,
  Users,
  Shield,
  Stethoscope,
  Clock,
  Database,
  KeyRound,
  Eye,
  EyeOff,
  Volume2,
  Copy,
  Check,
  Lock,
  Edit3,
  Radio,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  TrendingUp
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, onOpenOnboarding, onOpenLogin }) {
  const {
    userMode,
    setUserMode,
    userRole,
    user,
    isAuthenticated,
    logout,
    activeFamilyMember,
    activeFamilyMemberId,
    familyMembers,
    setActiveFamilyMemberId,
    addFamilyMember,
    staffHospitalId,
    staffAccounts = [],
    updateUserPassword,
    updateUserProfile
  } = useAuth();
  const { tokens, hospitals, doctors = [], leaveRequests = [] } = useQueue();

  const [showFamilyMenu, setShowFamilyMenu] = useState(false);
  const [showAddFamilyModal, setShowAddFamilyModal] = useState(false);
  const [showStaffProfileModal, setShowStaffProfileModal] = useState(false);

  // Profile Modal State
  const [activeProfileTab, setActiveProfileTab] = useState('overview'); // 'overview' | 'profile' | 'password'
  const [profileForm, setProfileForm] = useState({
    name: user?.name || user?.username || '',
    phone: user?.phone || '',
    email: user?.email || '',
    counter_label: localStorage.getItem('hqswift_counter_label') || 'Reception Counter 1',
    shift_note: localStorage.getItem('hqswift_shift_note') || 'General OPD Shift'
  });
  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState({ text: '', type: '' });
  const [passwordFeedback, setPasswordFeedback] = useState({ text: '', type: '' });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [copiedCreds, setCopiedCreds] = useState(false);
  const [dutyStatus, setDutyStatus] = useState(() => localStorage.getItem('hqswift_duty_status') || 'on_duty');
  const [chimeEnabled, setChimeEnabled] = useState(() => localStorage.getItem('hqswift_chime_enabled') !== 'false');
  const [testingChime, setTestingChime] = useState(false);

  // Keep profile form in sync when user changes
  React.useEffect(() => {
    if (user) {
      setProfileForm(prev => ({
        ...prev,
        name: user.name || user.username || '',
        phone: user.phone || prev.phone,
        email: user.email || prev.email,
        counter_label: localStorage.getItem('hqswift_counter_label') || 'Reception Counter 1',
        shift_note: localStorage.getItem('hqswift_shift_note') || 'General OPD Shift'
      }));
    }
  }, [user, showStaffProfileModal]);

  // Audio calling chime using Web Audio API
  const playCallingChime = () => {
    try {
      setTestingChime(true);
      setTimeout(() => setTestingChime(false), 900);
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.45);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880.0, now + 0.16);
      gain2.gain.setValueAtTime(0.3, now + 0.16);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.16);
      osc2.stop(now + 0.7);
    } catch (e) {
      console.warn('Audio chime notice:', e);
    }
  };

  // 1. First match staff account if logged in
  const matchedStaffAccount = staffAccounts.find(s => 
    (user?.id && (s.id === user.id || s.user_id === user.id)) ||
    (user?.username && s.username?.toLowerCase() === user.username.toLowerCase()) ||
    (user?.name && s.staff_name?.toLowerCase() === user.name.toLowerCase()) ||
    (user?.email && s.username && user.email.toLowerCase().includes(s.username.toLowerCase())) ||
    (user?.email && s.email && s.email.toLowerCase() === user.email.toLowerCase())
  );

  // 2. Facility resolution
  const targetHospitalId = user?.hospital_id || matchedStaffAccount?.hospital_id || staffHospitalId;
  const activeHospital = hospitals.find(h => h.id === targetHospitalId) || hospitals.find(h => h.id === staffHospitalId) || hospitals[0];

  const facilityDoctors = doctors.filter(d => d.hospital_id === activeHospital?.id);

  // 3. If there's only 1 doctor at this facility, that doctor is the assigned desk for everyone
  const effectiveDoctorId = user?.doctor_id || matchedStaffAccount?.doctor_id || (facilityDoctors.length === 1 ? facilityDoctors[0]?.id : null);

  const assignedDoctor = doctors.find(d => 
    (effectiveDoctorId && (
      d.id === effectiveDoctorId || 
      d.username?.toLowerCase() === effectiveDoctorId?.toLowerCase() || 
      d.name?.toLowerCase() === effectiveDoctorId?.toLowerCase() || 
      d.name?.toLowerCase().includes(effectiveDoctorId?.toLowerCase())
    )) ||
    (userRole === 'doctor' && (d.id === user?.id || d.id === user?.doctor_id || (user?.username && d.username?.toLowerCase() === user.username.toLowerCase())))
  ) || (facilityDoctors.length === 1 ? facilityDoctors[0] : null);

  const formatDoctorDisplay = (name, specialty) => {
    if (!name) {
      if (facilityDoctors.length === 1) {
        const d = facilityDoctors[0];
        const cap = (d.name || '').trim().charAt(0).toUpperCase() + (d.name || '').trim().slice(1);
        const withDr = (cap.toLowerCase().startsWith('dr.') || cap.toLowerCase().startsWith('dr ')) ? cap : `Dr. ${cap}`;
        return d.specialty ? `${withDr} (${d.specialty})` : withDr;
      }
      return userRole === 'business_owner'
        ? `All Facility Desks (${facilityDoctors.length} Doctors)`
        : 'All Doctor Desks (Floater Desk)';
    }
    const clean = name.trim();
    const withDr = (clean.toLowerCase().startsWith('dr.') || clean.toLowerCase().startsWith('dr '))
      ? clean
      : `Dr. ${clean.charAt(0).toUpperCase() + clean.slice(1)}`;
    return specialty ? `${withDr} (${specialty})` : withDr;
  };

  const deskTokens = tokens.filter(t => {
    if (assignedDoctor) {
      return t.doctor_id === assignedDoctor.id;
    }
    return t.hospital_id === activeHospital?.id;
  });

  const waitingTokensCount = deskTokens.filter(t => t.status === 'waiting').length;
  const currentServingToken = deskTokens.find(t => t.status === 'serving');
  const completedTodayCount = deskTokens.filter(t => t.status === 'done').length;

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    if (!profileForm.name.trim()) {
      setProfileFeedback({ text: 'Name cannot be empty.', type: 'error' });
      return;
    }

    setIsSavingProfile(true);
    setProfileFeedback({ text: '', type: '' });
    try {
      localStorage.setItem('hqswift_counter_label', profileForm.counter_label.trim());
      localStorage.setItem('hqswift_shift_note', profileForm.shift_note.trim());

      await updateUserProfile({
        name: profileForm.name.trim(),
        phone: profileForm.phone.trim(),
        email: profileForm.email.trim(),
        hospital_id: activeHospital?.id
      });

      setProfileFeedback({ text: 'Profile updated successfully!', type: 'success' });
      setTimeout(() => setProfileFeedback({ text: '', type: '' }), 4000);
    } catch (err) {
      setProfileFeedback({ text: err.message || 'Failed to update profile.', type: 'error' });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordFeedback({ text: '', type: '' });

    const { newPassword, confirmPassword } = passwordForm;

    if (!newPassword || newPassword.length < 4) {
      setPasswordFeedback({ text: 'Password must be at least 4 characters long.', type: 'error' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordFeedback({ text: 'New password and confirmation password do not match.', type: 'error' });
      return;
    }

    setIsSavingPassword(true);
    try {
      const res = await updateUserPassword(newPassword);
      if (res?.success) {
        setPasswordFeedback({ text: 'Password successfully changed and synced with your account!', type: 'success' });
        setPasswordForm({ newPassword: '', confirmPassword: '' });
        setTimeout(() => setPasswordFeedback({ text: '', type: '' }), 4500);
      } else {
        setPasswordFeedback({ text: res?.message || 'Failed to update password.', type: 'error' });
      }
    } catch (err) {
      setPasswordFeedback({ text: err.message || 'Failed to update password.', type: 'error' });
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleCopyCredentials = () => {
    const credText = `Hospital Qswift Staff Operator Credentials\nFacility: ${activeHospital?.name || 'Clinic'}\nName: ${user?.name || user?.username || 'Staff'}\nUsername: ${user?.username || user?.email || 'N/A'}\nAssigned Desk: ${formatDoctorDisplay(assignedDoctor?.name || user?.doctor_id, assignedDoctor?.specialty)}\nAccess Role: ${userRole}\nDuty Status: ${dutyStatus === 'on_duty' ? 'On Duty' : 'On Break'}\nPortal: ${window.location.origin}`;
    navigator.clipboard.writeText(credText);
    setCopiedCreds(true);
    setTimeout(() => setCopiedCreds(false), 3000);
  };
  const [newFamilyForm, setNewFamilyForm] = useState({
    full_name: '',
    relationship: 'parent',
    age: '',
    gender: 'Female'
  });

  // Filter active tokens strictly for current user and selected family member
  const userId = user?.id || 'user-patient-demo';
  const activeUserTokens = tokens.filter(t => {
    if (t.patient_id !== userId) return false;
    if (activeFamilyMemberId && activeFamilyMemberId !== 'fam-self') {
      return t.family_member_id === activeFamilyMemberId;
    }
    return !t.family_member_id || t.family_member_id === 'fam-self';
  }).filter(t => t.status === 'waiting' || t.status === 'serving');

  const handleAddFamilySubmit = (e) => {
    e.preventDefault();
    if (!newFamilyForm.full_name) return;
    const created = addFamilyMember(newFamilyForm);
    setActiveFamilyMemberId(created.id);
    setShowAddFamilyModal(false);
    setNewFamilyForm({ full_name: '', relationship: 'parent', age: '', gender: 'Female' });
  };

  return (
    <header
      className={`sticky top-0 z-40 transition-colors duration-300 border-b shadow-sm w-full max-w-full overflow-hidden ${
        userMode === 'staff'
          ? 'bg-[#3B3F8C] text-white border-indigo-900'
          : 'bg-white text-[#14181F] border-slate-200'
      }`}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2 sm:gap-3 cursor-pointer shrink-0 min-w-0" onClick={() => setActiveTab(userMode === 'staff' ? 'staff-dashboard' : 'discover')}>
            <div
              className={`p-2 sm:p-2.5 rounded-xl flex items-center justify-center font-bold text-white transition-all shadow-md shrink-0 ${
                userMode === 'staff'
                  ? 'bg-amberState text-ink font-mono'
                  : 'bg-[#0E7C86]'
              }`}
            >
              <Activity className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-display text-base sm:text-xl font-bold tracking-tight truncate">
                  Hospital <span className={userMode === 'staff' ? 'text-amberState' : 'text-[#0E7C86]'}>Qswift</span>
                </span>
                <span className={`hidden xl:inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-semibold rounded-full border ${
                  isSupabaseConfigured
                    ? userMode === 'staff'
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border-amber-300'
                }`}>
                  <Database className="w-3 h-3" />
                  {isSupabaseConfigured ? 'Supabase DB Connected' : 'Local Storage Mode'}
                </span>
                {userMode === 'staff' && (
                  <span className="hidden sm:inline-flex px-2 py-0.5 text-xs font-semibold bg-indigo-950/80 text-amberState border border-amberState/30 rounded-full">
                    {userRole === 'doctor'
                      ? `Doctor Console · ${user?.name || 'OPD'}`
                      : userRole === 'staff_operator'
                        ? 'Front-Desk Operator Console'
                        : 'Hospital Owner Admin Console'}
                  </span>
                )}
              </div>
              <p className="text-[11px] opacity-75 font-medium -mt-0.5 hidden sm:block">
                {userMode === 'staff'
                  ? userRole === 'doctor'
                    ? `Personal OPD Desk Queue Management`
                    : userRole === 'staff_operator'
                      ? `Clinic Front-Desk Walk-In Token Console`
                      : `Hospital Business Owner Full Console`
                  : 'Live Walk-in OPD Doctor Tokens'}
              </p>
            </div>
          </div>

          {/* Navigation Links & Mode Switcher */}
          <div className="flex items-center gap-3">
            {userMode === 'patient' ? (
              <>
                {/* Discovery Tabs - Desktop only */}
                <button
                  onClick={() => setActiveTab('discover')}
                  className={`hidden md:inline-flex px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === 'discover'
                      ? 'bg-clinical-50 text-clinical-700 font-semibold'
                      : 'text-ink-muted hover:text-ink hover:bg-slate-100'
                  }`}
                >
                  Discover Clinics
                </button>

                {/* Personal Patient Tabs - Desktop only */}
                <button
                  onClick={() => {
                    setActiveTab('tokens');
                    if (!isAuthenticated) onOpenLogin();
                  }}
                  className={`hidden md:inline-flex relative px-3.5 py-2 text-sm font-medium rounded-lg items-center gap-2 transition-all cursor-pointer ${
                    activeTab === 'tokens'
                      ? 'bg-clinical-500 text-white shadow-sm'
                      : 'bg-slate-100 text-ink hover:bg-slate-200'
                  }`}
                >
                  <Ticket className="w-4 h-4" />
                  <span>My Tokens</span>
                  {isAuthenticated && activeUserTokens.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 text-xs font-bold bg-amberState text-ink rounded-full animate-bounce">
                      {activeUserTokens.length}
                    </span>
                  )}
                </button>

                {/* Patient Visit History - Desktop only */}
                <button
                  onClick={() => {
                    setActiveTab('history');
                    if (!isAuthenticated) onOpenLogin();
                  }}
                  className={`hidden md:inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                    activeTab === 'history'
                      ? 'bg-clinical-50 text-clinical-700 font-semibold'
                      : 'text-ink-muted hover:text-ink hover:bg-slate-100'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  <span>Visits</span>
                </button>

                {/* Patient Profile & Settings - Desktop only */}
                <button
                  onClick={() => {
                    setActiveTab('profile');
                    if (!isAuthenticated) onOpenLogin();
                  }}
                  className={`hidden md:inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                    activeTab === 'profile'
                      ? 'bg-clinical-50 text-clinical-700 font-semibold'
                      : 'text-ink-muted hover:text-ink hover:bg-slate-100'
                  }`}
                >
                  <UserCheck className="w-4 h-4 text-clinical-600" />
                  <span>Profile</span>
                </button>

                {/* Family Profile Selector Dropdown — Only shown when Logged In on larger screens */}
                {isAuthenticated && (
                  <div className="relative hidden sm:block">
                    <button
                      onClick={() => setShowFamilyMenu(!showFamilyMenu)}
                      className="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-2 border border-slate-200 transition-colors"
                    >
                      <UserCheck className="w-3.5 h-3.5 text-clinical-600" />
                      <div className="text-left hidden sm:block">
                        <span className="text-[10px] text-ink-muted block uppercase tracking-wider font-semibold">Booking For</span>
                        <span className="font-semibold text-ink text-xs">{activeFamilyMember.full_name}</span>
                      </div>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    </button>

                    {showFamilyMenu && (
                        <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95">
                          <div className="px-3 py-1.5 border-b border-slate-100">
                            <p className="text-xs font-semibold text-ink-muted">Select Family Member</p>
                          </div>
                          {familyMembers.map((member) => (
                            <button
                              key={member.id}
                              onClick={() => {
                                setActiveFamilyMemberId(member.id);
                                setShowFamilyMenu(false);
                              }}
                              className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                                activeFamilyMemberId === member.id ? 'bg-clinical-50 font-semibold text-clinical-700' : 'text-ink'
                              }`}
                            >
                              <div>
                                <p className="font-medium">{member.full_name}</p>
                                <p className="text-[10px] text-slate-400 capitalize">{member.relationship} · {member.age ? `${member.age} yrs` : 'Age N/A'}</p>
                              </div>
                              {activeFamilyMemberId === member.id && (
                                <span className="w-2 h-2 rounded-full bg-clinical-500"></span>
                              )}
                            </button>
                          ))}
                          <div className="p-2 border-t border-slate-100">
                            <button
                              onClick={() => {
                                setShowFamilyMenu(false);
                                setShowAddFamilyModal(true);
                              }}
                              className="w-full py-1.5 px-2 bg-clinical-50 text-clinical-700 hover:bg-clinical-100 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Add Family Member</span>
                            </button>
                          </div>
                        </div>
                      )}
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Staff Navigation Tabs Scoped by User Role — Desktop only */}
                <button
                  onClick={() => setActiveTab('staff-dashboard')}
                  className={`hidden md:inline-flex px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${
                    activeTab === 'staff-dashboard'
                      ? 'bg-amberState text-ink font-bold shadow-sm'
                      : 'text-indigo-100 hover:bg-white/10'
                  }`}
                >
                  {userRole === 'doctor'
                    ? 'My OPD Desk Queue'
                    : userRole === 'staff_operator'
                      ? 'Front-Desk Queue'
                      : 'Live OPD Queue'}
                </button>

                {/* Doctor Profile & Availability Tab — Doctor Only — Desktop only */}
                {userRole === 'doctor' && (
                  <button
                    onClick={() => setActiveTab('doctor-profile')}
                    className={`hidden md:inline-flex items-center gap-1 px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${
                      activeTab === 'doctor-profile'
                        ? 'bg-amberState text-ink font-bold shadow-sm'
                        : 'text-indigo-100 hover:bg-white/10'
                    }`}
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Profile & Duty Status</span>
                  </button>
                )}

                {/* Doctors Tab — Business Owner Only — Desktop only */}
                {userRole === 'business_owner' && (
                  <button
                    onClick={() => setActiveTab('staff-doctors')}
                    className={`hidden md:inline-flex items-center gap-1 px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${
                      activeTab === 'staff-doctors'
                        ? 'bg-amberState text-ink font-bold shadow-sm'
                        : 'text-indigo-100 hover:bg-white/10'
                    }`}
                  >
                    <Stethoscope className="w-4 h-4" />
                    <span>Doctors</span>
                  </button>
                )}

                {/* Leave Approvals Tab — Business Owner Only — Desktop only */}
                {userRole === 'business_owner' && (
                  <button
                    onClick={() => setActiveTab('leave-approvals')}
                    className={`hidden md:inline-flex items-center gap-1 px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${
                      activeTab === 'leave-approvals'
                        ? 'bg-amberState text-ink font-bold shadow-sm'
                        : 'text-indigo-100 hover:bg-white/10'
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    <span>Leave Approvals</span>
                    {leaveRequests.filter(l => l.status === 'pending').length > 0 && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amberState text-ink rounded-full animate-bounce">
                        {leaveRequests.filter(l => l.status === 'pending').length}
                      </span>
                    )}
                  </button>
                )}

                {/* Staff Accounts Tab — Business Owner Only — Desktop only */}
                {userRole === 'business_owner' && (
                  <button
                    onClick={() => setActiveTab('staff-accounts')}
                    className={`hidden md:inline-flex items-center gap-1 px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${
                      activeTab === 'staff-accounts'
                        ? 'bg-amberState text-ink font-bold shadow-sm'
                        : 'text-indigo-100 hover:bg-white/10'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    <span>Staff Accounts</span>
                  </button>
                )}

                {/* Reports Tab — Business Owner & Doctors */}
                {(userRole === 'business_owner' || userRole === 'doctor') && (
                  <button
                    onClick={() => setActiveTab('staff-analytics')}
                    className={`hidden md:flex items-center gap-1 px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${
                      activeTab === 'staff-analytics'
                        ? 'bg-amberState text-ink font-bold shadow-sm'
                        : 'text-indigo-100 hover:bg-white/10'
                    }`}
                  >
                    <span>Reports</span>
                  </button>
                )}

                {/* Patient Reviews Tab — All Staff Roles */}
                <button
                  onClick={() => setActiveTab('staff-reviews')}
                  className={`hidden md:flex items-center gap-1 px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${
                    activeTab === 'staff-reviews'
                      ? 'bg-amberState text-ink font-bold shadow-sm'
                      : 'text-indigo-100 hover:bg-white/10'
                  }`}
                >
                  <span>Patient Reviews</span>
                </button>
              </>
            )}



            {/* Staff Profile Button (in Staff Mode) */}
            {isAuthenticated && userMode === 'staff' && (
              <button
                onClick={() => setShowStaffProfileModal(true)}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/20 transition-all cursor-pointer shadow-xs"
                title="View Staff Profile & Credentials"
              >
                <div className="w-5 h-5 rounded-lg bg-amberState text-ink flex items-center justify-center font-bold text-[10px]">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'S'}
                </div>
                <div className="text-left hidden sm:block">
                  <p className="font-bold leading-tight truncate max-w-[120px]">{user?.name || user?.username || 'Staff'}</p>
                </div>
                <span className="text-amberState text-[10px] font-bold bg-indigo-950/80 px-1.5 py-0.5 rounded-md border border-amberState/30">
                  Profile
                </span>
              </button>
            )}

            {/* Auth Sign In / Sign Out Button */}
            {isAuthenticated ? (
              <button
                onClick={logout}
                className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-ink rounded-lg transition-colors border border-slate-200"
                title="Click to Logout"
              >
                Sign Out
              </button>
            ) : (
              <button
                onClick={onOpenLogin}
                className="px-3.5 py-1.5 text-xs font-bold bg-[#0E7C86] hover:bg-clinical-600 text-white rounded-lg transition-all shadow-sm"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Staff Navigation Tab Strip (Horizontal Scrollable Pills for Mobile Screen) */}
      {userMode === 'staff' && (
        <div className="md:hidden border-t border-indigo-900/60 bg-[#2E3172] px-2 sm:px-3 py-2 overflow-x-auto no-scrollbar shadow-inner w-full max-w-full">
          <div className="flex items-center gap-1.5 min-w-max">
            {/* 1. Live OPD Queue */}
            <button
              onClick={() => setActiveTab('staff-dashboard')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'staff-dashboard'
                  ? 'bg-amberState text-ink font-bold shadow-sm'
                  : 'text-indigo-200 hover:bg-white/10'
              }`}
            >
              <Activity className="w-3.5 h-3.5 shrink-0" />
              <span>{userRole === 'doctor' ? 'My OPD Queue' : 'Live OPD Queue'}</span>
            </button>

            {/* 2. Doctor Profile (Doctor) OR Doctors (Business Owner / Staff) */}
            {userRole === 'doctor' ? (
              <button
                onClick={() => setActiveTab('doctor-profile')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'doctor-profile'
                    ? 'bg-amberState text-ink font-bold shadow-sm'
                    : 'text-indigo-200 hover:bg-white/10'
                }`}
              >
                <Stethoscope className="w-3.5 h-3.5 shrink-0" />
                <span>Duty Status</span>
              </button>
            ) : (
              <button
                onClick={() => setActiveTab('staff-doctors')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'staff-doctors'
                    ? 'bg-amberState text-ink font-bold shadow-sm'
                    : 'text-indigo-200 hover:bg-white/10'
                }`}
              >
                <Stethoscope className="w-3.5 h-3.5 shrink-0" />
                <span>Doctors</span>
              </button>
            )}

            {/* 3. Staff Accounts (Business Owner & Staff Operators) */}
            {userRole !== 'doctor' && (
              <button
                onClick={() => setActiveTab('staff-accounts')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'staff-accounts'
                    ? 'bg-amberState text-ink font-bold shadow-sm'
                    : 'text-indigo-200 hover:bg-white/10'
                }`}
              >
                <Users className="w-3.5 h-3.5 shrink-0" />
                <span>Staff Accounts</span>
              </button>
            )}

            {/* 4. Leave Approvals (Business Owner) */}
            {userRole === 'business_owner' && (
              <button
                onClick={() => setActiveTab('leave-approvals')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer relative ${
                  activeTab === 'leave-approvals'
                    ? 'bg-amberState text-ink font-bold shadow-sm'
                    : 'text-indigo-200 hover:bg-white/10'
                }`}
              >
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span>Leave Approvals</span>
                {leaveRequests.filter(l => l.status === 'pending').length > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 text-[10px] font-bold bg-amberState text-ink rounded-full">
                    {leaveRequests.filter(l => l.status === 'pending').length}
                  </span>
                )}
              </button>
            )}

            {/* 5. Reports / Analytics (Business Owner & Doctor) */}
            {(userRole === 'business_owner' || userRole === 'doctor') && (
              <button
                onClick={() => setActiveTab('staff-analytics')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'staff-analytics'
                    ? 'bg-amberState text-ink font-bold shadow-sm'
                    : 'text-indigo-200 hover:bg-white/10'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                <span>Reports</span>
              </button>
            )}

            {/* 6. Patient Reviews (All Staff Roles) */}
            <button
              onClick={() => setActiveTab('staff-reviews')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'staff-reviews'
                  ? 'bg-amberState text-ink font-bold shadow-sm'
                  : 'text-indigo-200 hover:bg-white/10'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span>Reviews</span>
            </button>
          </div>
        </div>
      )}

      {/* Add Family Member Modal */}
      {showAddFamilyModal && (
        <div className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95">
            <h3 className="font-display text-lg font-bold text-ink mb-1">Add Family Member</h3>
            <p className="text-xs text-ink-muted mb-4">You can grab OPD tokens for parents, spouse or children using your account.</p>
            
            <form onSubmit={handleAddFamilySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink-muted mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sarojini Rao"
                  value={newFamilyForm.full_name}
                  onChange={(e) => setNewFamilyForm({ ...newFamilyForm, full_name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-clinical-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-ink-muted mb-1">Relationship</label>
                  <select
                    value={newFamilyForm.relationship}
                    onChange={(e) => setNewFamilyForm({ ...newFamilyForm, relationship: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-clinical-500"
                  >
                    <option value="parent">Parent</option>
                    <option value="child">Child</option>
                    <option value="spouse">Spouse</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink-muted mb-1">Age</label>
                  <input
                    type="number"
                    placeholder="e.g. 64"
                    value={newFamilyForm.age}
                    onChange={(e) => setNewFamilyForm({ ...newFamilyForm, age: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-clinical-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-muted mb-1">Gender</label>
                <div className="flex gap-4">
                  {['Female', 'Male', 'Other'].map(g => (
                    <label key={g} className="flex items-center gap-1.5 text-xs font-medium cursor-pointer">
                      <input
                        type="radio"
                        name="gender"
                        checked={newFamilyForm.gender === g}
                        onChange={() => setNewFamilyForm({ ...newFamilyForm, gender: g })}
                        className="text-clinical-600 focus:ring-clinical-500"
                      />
                      {g}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddFamilyModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-clinical-500 hover:bg-clinical-600 text-white rounded-lg shadow-sm"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Staff Profile Details Modal with Overview, Update Profile, Change Password & Live Desk Stats */}
      {showStaffProfileModal && (
        <div className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white text-ink rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 my-8">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-13 h-13 rounded-2xl bg-indigo-50 text-indigoConsole flex items-center justify-center font-bold text-xl shadow-xs border border-indigo-100/80">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'S'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-lg font-bold text-ink">{user?.name || user?.username || 'Staff Operator'}</h3>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                      dutyStatus === 'on_duty'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {dutyStatus === 'on_duty' ? '🟢 On Duty' : '🟡 On Break'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] font-bold text-indigoConsole bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                      {userRole === 'staff_operator'
                        ? 'Front-Desk OPD Operator'
                        : userRole === 'doctor'
                          ? 'Consulting Doctor'
                          : 'Hospital Business Owner'}
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {activeHospital?.name || 'Clinic'}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowStaffProfileModal(false);
                  setActiveProfileTab('overview');
                  setProfileFeedback({ text: '', type: '' });
                  setPasswordFeedback({ text: '', type: '' });
                }}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer text-base font-bold transition-colors"
                title="Close Modal"
              >
                ✕
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-2xl border border-slate-200/80">
              <button
                type="button"
                onClick={() => setActiveProfileTab('overview')}
                className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeProfileTab === 'overview'
                    ? 'bg-white text-indigoConsole shadow-xs border border-slate-200/60'
                    : 'text-slate-600 hover:text-ink hover:bg-white/50'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Account Overview</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveProfileTab('profile')}
                className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeProfileTab === 'profile'
                    ? 'bg-white text-indigoConsole shadow-xs border border-slate-200/60'
                    : 'text-slate-600 hover:text-ink hover:bg-white/50'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Update Profile</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveProfileTab('password')}
                className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeProfileTab === 'password'
                    ? 'bg-white text-indigoConsole shadow-xs border border-slate-200/60'
                    : 'text-slate-600 hover:text-ink hover:bg-white/50'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Change Password</span>
              </button>
            </div>

            {/* TAB 1: OVERVIEW */}
            {activeProfileTab === 'overview' && (
              <div className="space-y-4 text-xs animate-in fade-in">
                {/* Account Details Box */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2.5">
                  <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-500 font-medium">Username / Login ID:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-ink bg-white px-2 py-0.5 rounded border border-slate-200 text-xs">
                        {user?.username || user?.email || 'N/A'}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyCredentials}
                        className="text-slate-500 hover:text-indigoConsole p-1 cursor-pointer transition-colors"
                        title="Copy credentials"
                      >
                        {copiedCreds ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-500 font-medium">Hospital Facility:</span>
                    <strong className="text-ink font-bold flex items-center gap-1 text-right">
                      <Building2 className="w-3.5 h-3.5 text-indigoConsole shrink-0" />
                      {activeHospital?.name || 'Main OPD Facility'}
                    </strong>
                  </div>

                  {/* Assigned Doctor Desk Details */}
                  <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-500 font-medium">Assigned Doctor Desk:</span>
                    <strong className="text-clinical-700 font-bold flex items-center gap-1.5 text-right">
                      <Stethoscope className="w-3.5 h-3.5 text-clinical-600 shrink-0" />
                      <span>{formatDoctorDisplay(assignedDoctor?.name || user?.doctor_id, assignedDoctor?.specialty)}</span>
                    </strong>
                  </div>

                  {user?.phone && (
                    <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                      <span className="text-slate-500 font-medium">Registered Phone:</span>
                      <span className="font-semibold text-slate-700">{user.phone}</span>
                    </div>
                  )}

                  {user?.email && (
                    <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                      <span className="text-slate-500 font-medium">Account Email:</span>
                      <span className="font-semibold text-slate-700">{user.email}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between py-1">
                    <span className="text-slate-500 font-medium">Counter / Station:</span>
                    <span className="font-medium text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {profileForm.counter_label || 'Reception Counter 1'}
                    </span>
                  </div>
                </div>

                {/* Live Desk Queue Quick Stats ("Something More") */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-clinical-600 animate-pulse" />
                      <span>Live OPD Desk Status & Stats</span>
                    </p>
                    <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                      <Radio className="w-3 h-3 text-emerald-500 animate-pulse" /> Live Realtime Sync
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5">
                    <div className="bg-indigo-50/70 p-3 rounded-2xl border border-indigo-100 text-center">
                      <span className="text-[10px] text-slate-500 block font-semibold">Patients in Queue</span>
                      <span className="text-lg font-bold font-mono text-indigoConsole">{waitingTokensCount}</span>
                      <span className="text-[9px] text-slate-400 block mt-0.5">Waiting outside</span>
                    </div>

                    <div className="bg-emerald-50/70 p-3 rounded-2xl border border-emerald-100 text-center">
                      <span className="text-[10px] text-slate-500 block font-semibold">Currently Serving</span>
                      <span className="text-lg font-bold font-mono text-emerald-700">
                        {currentServingToken ? `#${currentServingToken.token_number}` : 'None'}
                      </span>
                      <span className="text-[9px] text-slate-400 block mt-0.5">In Consultation</span>
                    </div>

                    <div className="bg-amber-50/70 p-3 rounded-2xl border border-amber-200 text-center">
                      <span className="text-[10px] text-slate-500 block font-semibold">Completed Today</span>
                      <span className="text-lg font-bold font-mono text-amber-800">{completedTodayCount}</span>
                      <span className="text-[9px] text-slate-400 block mt-0.5">Checked out</span>
                    </div>
                  </div>
                </div>

                {/* Desk Preferences & Audio Chime ("Something More") */}
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-3">
                  <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Desk Audio & Shift Controls</p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-indigo-100 text-indigoConsole">
                        <Volume2 className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-ink">Calling Bell / Sound Chime</p>
                        <p className="text-[10px] text-slate-400">Play pleasant hospital chime when calling next patient</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={playCallingChime}
                        className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-colors cursor-pointer flex items-center gap-1 ${
                          testingChime
                            ? 'bg-amberState text-ink border-amber-400'
                            : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'
                        }`}
                        title="Click to play sample calling chime"
                      >
                        <span>🔔 Test Chime</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const next = !chimeEnabled;
                          setChimeEnabled(next);
                          localStorage.setItem('hqswift_chime_enabled', String(next));
                          if (next) playCallingChime();
                        }}
                        className={`w-10 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                          chimeEnabled ? 'bg-clinical-500 justify-end' : 'bg-slate-300 justify-start'
                        }`}
                      >
                        <span className="w-4 h-4 rounded-full bg-white shadow-xs"></span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                    <div>
                      <p className="font-bold text-ink">Shift Duty Mode</p>
                      <p className="text-[10px] text-slate-400">Mark yourself On Duty or temporarily On Break</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const next = dutyStatus === 'on_duty' ? 'on_break' : 'on_duty';
                        setDutyStatus(next);
                        localStorage.setItem('hqswift_duty_status', next);
                      }}
                      className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                        dutyStatus === 'on_duty'
                          ? 'bg-emerald-500 text-white border-emerald-600 shadow-xs'
                          : 'bg-amber-100 text-amber-900 border-amber-300'
                      }`}
                    >
                      {dutyStatus === 'on_duty' ? '🟢 On Duty (Serving)' : '🟡 On Break (Paused)'}
                    </button>
                  </div>
                </div>

                {/* Session Security Indicator */}
                <div className="p-3 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-200 text-[11px] flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Authorized Session Active · Realtime Supabase PostgreSQL Stream</span>
                </div>
              </div>
            )}

            {/* TAB 2: UPDATE PROFILE */}
            {activeProfileTab === 'profile' && (
              <form onSubmit={handleProfileUpdate} className="space-y-4 text-xs animate-in fade-in">
                {profileFeedback.text && (
                  <div className={`p-3 rounded-2xl border text-xs font-semibold flex items-center gap-2 ${
                    profileFeedback.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border-rose-200'
                  }`}>
                    {profileFeedback.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span>{profileFeedback.text}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Full Display Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Nani (Reception Operator)"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigoConsole"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Mobile Phone</label>
                    <input
                      type="text"
                      placeholder="e.g. +91 98765 43210"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigoConsole"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Email Address</label>
                    <input
                      type="email"
                      placeholder="e.g. staff@clinic.com"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigoConsole"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Counter / Desk Station Label</label>
                  <input
                    type="text"
                    placeholder="e.g. Counter 1 - OPD Tokens"
                    value={profileForm.counter_label}
                    onChange={(e) => setProfileForm({ ...profileForm, counter_label: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigoConsole"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Displayed on patient token call board for orientation.</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Shift / Duty Notes</label>
                  <input
                    type="text"
                    placeholder="e.g. Morning Walk-in OPD Shift (9:00 AM - 1:30 PM)"
                    value={profileForm.shift_note}
                    onChange={(e) => setProfileForm({ ...profileForm, shift_note: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigoConsole"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="px-5 py-2.5 text-xs font-bold bg-indigoConsole text-white hover:bg-indigo-900 rounded-xl shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5 text-amberState" />
                    <span>{isSavingProfile ? 'Saving Changes...' : 'Save Profile Changes'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* TAB 3: CHANGE PASSWORD */}
            {activeProfileTab === 'password' && (
              <form onSubmit={handlePasswordChange} className="space-y-4 text-xs animate-in fade-in">
                {passwordFeedback.text && (
                  <div className={`p-3 rounded-2xl border text-xs font-semibold flex items-center gap-2 ${
                    passwordFeedback.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border-rose-200'
                  }`}>
                    {passwordFeedback.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span>{passwordFeedback.text}</span>
                  </div>
                )}

                <div className="p-3 bg-indigo-50/60 rounded-2xl border border-indigo-100 text-[11px] text-slate-600 space-y-1">
                  <p className="font-bold text-indigoConsole flex items-center gap-1">
                    <KeyRound className="w-3.5 h-3.5" /> Change Account Password
                  </p>
                  <p>Choose a secure password with at least 4 characters. Your new password takes effect immediately.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">New Password</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      placeholder="Enter new password (min. 4 characters)..."
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      className="w-full px-3.5 py-2.5 pr-10 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigoConsole font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Confirm New Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      placeholder="Re-enter new password to confirm..."
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      className="w-full px-3.5 py-2.5 pr-10 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigoConsole font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {passwordForm.newPassword && passwordForm.confirmPassword && (
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold">
                    {passwordForm.newPassword === passwordForm.confirmPassword ? (
                      <span className="text-emerald-600 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Passwords match
                      </span>
                    ) : (
                      <span className="text-rose-500 flex items-center gap-1">
                        ✕ Passwords do not match yet
                      </span>
                    )}
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={isSavingPassword || !passwordForm.newPassword || passwordForm.newPassword !== passwordForm.confirmPassword}
                    className="px-5 py-2.5 text-xs font-bold bg-indigoConsole text-white hover:bg-indigo-900 rounded-xl shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Lock className="w-3.5 h-3.5 text-amberState" />
                    <span>{isSavingPassword ? 'Updating Password...' : 'Update Password'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* Modal Footer */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-3">
                {userRole === 'business_owner' ? (
                  <button
                    type="button"
                    onClick={() => {
                      setShowStaffProfileModal(false);
                      setActiveTab('staff-accounts');
                    }}
                    className="text-xs text-indigoConsole hover:text-indigo-900 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Manage Staff Accounts →</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setShowStaffProfileModal(false);
                      setActiveTab('staff-dashboard');
                    }}
                    className="text-xs text-clinical-700 hover:text-clinical-900 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                    <span>Go to Desk Queue →</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyCredentials}
                  className="px-3.5 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                >
                  {copiedCreds ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-bold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Details</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setShowStaffProfileModal(false)}
                  className="px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-ink rounded-xl cursor-pointer transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

