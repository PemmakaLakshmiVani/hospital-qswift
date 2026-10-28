import React, { useState } from 'react';
import { User, Phone, Mail, Heart, Plus, Trash2, CheckCircle2, UserCheck, ShieldAlert, Save, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { createUserProfile, isSupabaseConfigured, supabase } from '../../lib/supabase';

export default function UserProfile() {
  const { user, login, familyMembers, addFamilyMember, deleteFamilyMember, activeFamilyMemberId, setActiveFamilyMemberId } = useAuth();

  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    blood_group: user?.blood_group || 'None',
    emergency_contact: user?.emergency_contact || 'None',
    medical_notes: user?.medical_notes || 'None'
  });

  React.useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        phone: user.phone || '',
        email: user.email || '',
        blood_group: user.blood_group || 'None',
        emergency_contact: user.emergency_contact || 'None',
        medical_notes: user.medical_notes || 'None'
      });
    }
  }, [user]);

  const [showAddFamilyModal, setShowAddFamilyModal] = useState(false);
  const [newFamily, setNewFamily] = useState({
    full_name: '',
    relationship: 'parent',
    age: '',
    gender: 'Female'
  });

  const [saveSuccess, setSaveSuccess] = useState(false);

  // Password Change State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordChangeError, setPasswordChangeError] = useState('');
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordChangeError('');
    setPasswordChangeSuccess(false);

    if (!newPassword || newPassword.length < 6) {
      setPasswordChangeError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordChangeError('New password and confirm password do not match.');
      return;
    }

    setPasswordSaving(true);
    try {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw error;
      }
      // Update local storage user
      const savedUser = JSON.parse(localStorage.getItem('hqswift_user') || '{}');
      const updatedUser = { ...savedUser, password: newPassword };
      localStorage.setItem('hqswift_user', JSON.stringify(updatedUser));
      login(user?.role || 'patient', updatedUser);

      setPasswordChangeSuccess(true);
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordChangeSuccess(false), 4000);
    } catch (err) {
      setPasswordChangeError(err.message || 'Failed to update password.');
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    const updatedUser = {
      ...user,
      name: profileForm.name,
      phone: profileForm.phone,
      email: profileForm.email,
      blood_group: profileForm.blood_group,
      emergency_contact: profileForm.emergency_contact,
      medical_notes: profileForm.medical_notes
    };

    login(user?.role || 'patient', updatedUser);

    if (isSupabaseConfigured && user?.id) {
      try {
        await createUserProfile({
          id: user.id,
          full_name: profileForm.name,
          email: profileForm.email,
          phone: profileForm.phone,
          role: user.role || 'patient',
          blood_group: profileForm.blood_group,
          emergency_contact: profileForm.emergency_contact,
          medical_notes: profileForm.medical_notes
        });
      } catch (err) {
        console.warn('Could not sync updated profile to Supabase:', err);
      }
    }

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleAddFamilySubmit = (e) => {
    e.preventDefault();
    if (!newFamily.full_name) return;
    const created = addFamilyMember(newFamily);
    setActiveFamilyMemberId(created.id);
    setShowAddFamilyModal(false);
    setNewFamily({ full_name: '', relationship: 'parent', age: '', gender: 'Female' });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header */}
      <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <User className="w-6 h-6 text-clinical-600" />
            <h1 className="font-display text-2xl font-bold text-ink">My Patient Profile & Family Members</h1>
          </div>
          <p className="text-xs text-ink-muted mt-0.5">Manage personal details, medical emergency notes, and family OPD profiles</p>
        </div>

        {saveSuccess && (
          <div className="px-3.5 py-1.5 bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-1.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>Profile Details Saved Successfully!</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Column 1 & 2: Main Personal Profile Form */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5">
            <h2 className="font-display text-lg font-bold text-ink border-b border-slate-100 pb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-clinical-600" />
              <span>Personal Information</span>
            </h2>

            <form onSubmit={handleProfileSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Patient Name</label>
                <input
                  type="text"
                  required
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-clinical-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      className="w-full pl-9 pr-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-clinical-500 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      className="w-full pl-9 pr-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-clinical-500 font-medium"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Blood Group</label>
                  <select
                    value={profileForm.blood_group}
                    onChange={(e) => setProfileForm({ ...profileForm, blood_group: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-clinical-500 font-medium bg-white"
                  >
                    {['None', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Emergency Helpline Contact</label>
                  <input
                    type="text"
                    value={profileForm.emergency_contact}
                    onChange={(e) => setProfileForm({ ...profileForm, emergency_contact: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-clinical-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Medical Notes & Known Allergies</label>
                <textarea
                  rows="3"
                  placeholder="e.g. Diabetic, allergic to Penicillin..."
                  value={profileForm.medical_notes}
                  onChange={(e) => setProfileForm({ ...profileForm, medical_notes: e.target.value })}
                  className="w-full p-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-clinical-500"
                ></textarea>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#0E7C86] hover:bg-clinical-600 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>Update Profile Details</span>
                </button>
              </div>
            </form>
          </div>

          {/* Account Security & Password Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-clinical-600" />
                <div>
                  <h2 className="font-display text-base font-bold text-ink">Account Security & Password</h2>
                  <p className="text-xs text-ink-muted">Update sign-in password for your patient account</p>
                </div>
              </div>
            </div>

            {passwordChangeSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Password updated successfully! Use your new password for your next login.</span>
              </div>
            )}

            {passwordChangeError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-xl flex items-center gap-2 animate-in fade-in">
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{passwordChangeError}</span>
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">New Password *</label>
                  <div className="relative">
                    <input
                      type={showPass ? "text" : "password"}
                      required
                      minLength={6}
                      placeholder="At least 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-clinical-500 font-mono pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                    >
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Minimum 6 characters</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm New Password *</label>
                  <input
                    type={showPass ? "text" : "password"}
                    required
                    minLength={6}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-clinical-500 font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={passwordSaving || !newPassword}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{passwordSaving ? 'Updating...' : 'Change Password'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Column 3: Managed Family Member Profiles */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-display text-sm font-bold text-ink flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-clinical-600" />
                <span>Family Members ({familyMembers.length})</span>
              </h3>
              <button
                onClick={() => setShowAddFamilyModal(true)}
                className="px-2.5 py-1 text-[11px] font-bold bg-clinical-50 text-clinical-700 hover:bg-clinical-100 rounded-lg border border-clinical-200 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>Add</span>
              </button>
            </div>

            <p className="text-xs text-ink-muted">
              Select who you are issuing OPD doctor tokens for during checkout.
            </p>

            <div className="space-y-2.5">
              {familyMembers.map((member) => (
                <div
                  key={member.id}
                  onClick={() => setActiveFamilyMemberId(member.id)}
                  className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                    activeFamilyMemberId === member.id
                      ? 'bg-clinical-50/80 border-clinical-500 ring-2 ring-clinical-500/20'
                      : 'bg-slate-50/80 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div>
                    <p className="font-display font-bold text-xs text-ink">{member.full_name}</p>
                    <p className="text-[10px] text-slate-400 capitalize">{member.relationship} · {member.age ? `${member.age} yrs` : 'Age N/A'}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {activeFamilyMemberId === member.id && (
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-[#0E7C86] text-white rounded-full">
                        Active
                      </span>
                    )}
                    {member.id !== 'fam-self' && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteFamilyMember(member.id);
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                        title="Remove Family Profile"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Add Family Member Modal */}
      {showAddFamilyModal && (
        <div className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <h3 className="font-display text-lg font-bold text-ink">Add Family Member Profile</h3>
            <p className="text-xs text-ink-muted">Issue OPD tokens on behalf of parents, spouse or children.</p>
            
            <form onSubmit={handleAddFamilySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sarojini Rao"
                  value={newFamily.full_name}
                  onChange={(e) => setNewFamily({ ...newFamily, full_name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-clinical-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Relationship</label>
                  <select
                    value={newFamily.relationship}
                    onChange={(e) => setNewFamily({ ...newFamily, relationship: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-clinical-500"
                  >
                    <option value="parent">Parent</option>
                    <option value="child">Child</option>
                    <option value="spouse">Spouse</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Age</label>
                  <input
                    type="number"
                    placeholder="e.g. 64"
                    value={newFamily.age}
                    onChange={(e) => setNewFamily({ ...newFamily, age: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-clinical-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddFamilyModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-[#0E7C86] hover:bg-clinical-600 text-white rounded-xl shadow-sm"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
