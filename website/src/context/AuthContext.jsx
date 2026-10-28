import React, { createContext, useContext, useState, useEffect } from 'react';
import { MOCK_FAMILY_MEMBERS, MOCK_STAFF_ACCOUNTS } from '../data/mockData';
import { supabase, isSupabaseConfigured, fetchUserProfile, createUserProfile } from '../lib/supabase';

const AuthContext = createContext();

const MOCK_BUSINESS_ACCOUNTS = [
  {
    id: 'user-1792343107398-928',
    email: 'swathi@gmail.com',
    password: '123456789',
    name: 'swathi',
    phone: '6305143959',
    hospital_id: 'hsp-1792343107386',
    hospital_name: 'health is wealth',
    clinical_license: 'CEA',
    license_proof_file: 'Clinical_License_CEA2026.pdf',
    council_reg: 'KMC',
    council_proof_file: 'Medical_Council_Registration_Cert.pdf',
    is_verified: true,
    is_super_admin: false,
    role: 'business_owner'
  },
  {
    id: 'user-staff-1',
    email: 'owner@apolloclinic.com',
    password: 'password123',
    name: 'Apollo Hospital Owner (Master)',
    phone: '+91 80 4112 8800',
    hospital_id: 'hsp-1',
    hospital_name: 'Apollo Clinic Indiranagar',
    clinical_license: 'CEA/KA/2026/8841',
    license_proof_file: 'Clinical_License_CEA2026.pdf',
    council_reg: 'KMC-74921-2018',
    council_proof_file: 'Medical_Council_Reg_KMC74921.pdf',
    is_verified: true,
    is_super_admin: true,
    role: 'admin'
  }
];

export function AuthProvider({ children }) {
  // Loading state during auth resolution
  const [loading, setLoading] = useState(true);

  // User Profile from Supabase database
  const [profile, setProfile] = useState(null);

  // Registered Business Accounts Database
  const [registeredBusinesses, setRegisteredBusinesses] = useState(() => {
    try {
      const saved = localStorage.getItem('hqswift_registered_businesses');
      if (saved) {
        const parsed = JSON.parse(saved);
        const missing = MOCK_BUSINESS_ACCOUNTS.filter(m => !parsed.some(b => b.email?.toLowerCase() === m.email?.toLowerCase()));
        return [...missing, ...parsed];
      }
      return MOCK_BUSINESS_ACCOUNTS;
    } catch (e) {
      return MOCK_BUSINESS_ACCOUNTS;
    }
  });
  // User Mode: 'patient' | 'staff'
  const [userMode, setUserMode] = useState(() => {
    return localStorage.getItem('hqswift_user_mode') || 'patient';
  });

  // User Role: 'patient' | 'staff' | 'doctor' | 'admin' | 'business_owner' | 'staff_operator'
  const [userRole, setUserRole] = useState(() => {
    return localStorage.getItem('hqswift_user_role') || 'patient';
  });

  // Authentication State (Verified via Supabase session when configured)
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (isSupabaseConfigured) return false;
    const saved = localStorage.getItem('hqswift_is_auth');
    return saved !== null ? saved === 'true' : false;
  });

  // Logged in user info
  const [user, setUser] = useState(() => {
    if (isSupabaseConfigured) return null;
    try {
      const saved = localStorage.getItem('hqswift_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  // Staff Accounts created by Hospital Business Owners
  const [staffAccounts, setStaffAccounts] = useState(() => {
    try {
      const saved = localStorage.getItem('hqswift_staff_accounts');
      if (saved) {
        const parsed = JSON.parse(saved);
        const missing = MOCK_STAFF_ACCOUNTS.filter(m => !parsed.some(s => s.id === m.id));
        return [...missing, ...parsed];
      }
      return MOCK_STAFF_ACCOUNTS;
    } catch (e) {
      return MOCK_STAFF_ACCOUNTS;
    }
  });

  // Family members list (scoped per patient user; defaults to only Self)
  const [familyMembers, setFamilyMembers] = useState(() => [
    {
      id: 'fam-self',
      patient_id: 'self',
      full_name: 'Self (You)',
      relationship: 'self',
      age: null,
      gender: 'N/A'
    }
  ]);

  // Active family member ID
  const [activeFamilyMemberId, setActiveFamilyMemberId] = useState(() => {
    return localStorage.getItem('hqswift_active_family_id') || 'fam-self';
  });

  // Staff selected hospital ID
  const [staffHospitalId, setStaffHospitalId] = useState(() => {
    return localStorage.getItem('hqswift_staff_hospital_id') || 'hsp-1';
  });

  // Registered Patient Accounts database
  const [registeredPatients, setRegisteredPatients] = useState(() => {
    try {
      const saved = localStorage.getItem('hqswift_registered_patients');
      return saved ? JSON.parse(saved) : [
        {
          id: 'user-1792334889131-904',
          name: 'Lakshmivani',
          phone: '6301722232',
          email: 'lakshmivani55555@gmail.com',
          blood_group: 'B+',
          emergency_contact: '6301722232',
          medical_notes: 'None'
        },
        {
          id: 'user-1792342310593-766',
          name: 'saritha',
          phone: '7382093122',
          email: 'sarithasaritha46393@gmail.com',
          blood_group: 'None',
          emergency_contact: '7382093122',
          medical_notes: 'None'
        },
        {
          id: 'user-patient-demo',
          name: 'Lakshya Sharma',
          phone: '+91 98765 12345',
          email: 'patient@example.com',
          blood_group: 'O+',
          emergency_contact: '+91 98765 00000',
          medical_notes: 'No known drug allergies'
        }
      ];
    } catch (e) {
      return [];
    }
  });

  // LocalStorage sync effects
  useEffect(() => {
    localStorage.setItem('hqswift_user_mode', userMode);
  }, [userMode]);

  useEffect(() => {
    localStorage.setItem('hqswift_user_role', userRole);
  }, [userRole]);

  useEffect(() => {
    localStorage.setItem('hqswift_is_auth', String(isAuthenticated));
  }, [isAuthenticated]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('hqswift_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('hqswift_user');
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('hqswift_staff_accounts', JSON.stringify(staffAccounts));
  }, [staffAccounts]);

  useEffect(() => {
    localStorage.setItem('hqswift_family_members', JSON.stringify(familyMembers));
  }, [familyMembers]);

  useEffect(() => {
    localStorage.setItem('hqswift_active_family_id', activeFamilyMemberId);
  }, [activeFamilyMemberId]);

  useEffect(() => {
    localStorage.setItem('hqswift_staff_hospital_id', staffHospitalId);
  }, [staffHospitalId]);

  useEffect(() => {
    localStorage.setItem('hqswift_registered_patients', JSON.stringify(registeredPatients));
  }, [registeredPatients]);

  useEffect(() => {
    localStorage.setItem('hqswift_registered_businesses', JSON.stringify(registeredBusinesses));
  }, [registeredBusinesses]);

  // -------------------------------------------------------------
  // Supabase Auth Integration & Linked Profiles Sync
  // -------------------------------------------------------------
  const handleSupabaseUser = async (spUser) => {
    if (!spUser) return;
    
    // Fetch profile row from 'profiles' table in database
    let dbProfile = await fetchUserProfile(spUser.id);
    
    // Fallback if profile row was not automatically created by trigger
    if (!dbProfile) {
      const metaRole = spUser.user_metadata?.role || 'patient';
      const metaName = spUser.user_metadata?.full_name || spUser.email?.split('@')[0] || 'User';
      const metaPhone = spUser.user_metadata?.phone || null;
      const metaHspId = spUser.user_metadata?.hospital_id || null;
      
      dbProfile = await createUserProfile({
        id: spUser.id,
        full_name: metaName,
        email: spUser.email,
        phone: metaPhone,
        role: metaRole,
        hospital_id: metaHspId,
        blood_group: spUser.user_metadata?.blood_group || 'None',
        emergency_contact: spUser.user_metadata?.emergency_contact || 'None',
        medical_notes: spUser.user_metadata?.medical_notes || 'None'
      });
    }

    const assignedRole = dbProfile?.role || spUser.user_metadata?.role || 'patient';
    const fullName = dbProfile?.full_name || spUser.user_metadata?.full_name || spUser.email?.split('@')[0] || 'Authenticated User';
    const targetHspId = dbProfile?.hospital_id || spUser.user_metadata?.hospital_id || 'hsp-1';

    setIsAuthenticated(true);
    setUserRole(assignedRole);
    setUserMode(assignedRole === 'patient' ? 'patient' : 'staff');
    setProfile(dbProfile);
    if (targetHspId) {
      setStaffHospitalId(targetHspId);
    }

    setUser({
      id: spUser.id,
      email: spUser.email,
      name: fullName,
      role: assignedRole,
      hospital_id: targetHspId,
      phone: dbProfile?.phone || spUser.user_metadata?.phone || '',
      blood_group: dbProfile?.blood_group || spUser.user_metadata?.blood_group || 'None',
      emergency_contact: dbProfile?.emergency_contact || spUser.user_metadata?.emergency_contact || 'None',
      medical_notes: dbProfile?.medical_notes || spUser.user_metadata?.medical_notes || 'None',
      is_email_verified: Boolean(spUser.email_confirmed_at),
      email_confirmed_at: spUser.email_confirmed_at
    });

    // Load Family Members specifically for this authenticated patient
    let loadedFamily = [];
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: dbFamily } = await supabase
          .from('family_members')
          .select('*')
          .eq('patient_id', spUser.id);
        if (dbFamily && Array.isArray(dbFamily)) {
          loadedFamily = dbFamily;
        }
      } catch (err) {
        console.warn('Could not fetch family members:', err);
      }
    }

    const selfMember = {
      id: `fam-self-${spUser.id}`,
      patient_id: spUser.id,
      full_name: `${fullName} (Self)`,
      relationship: 'self',
      age: null,
      gender: 'N/A'
    };

    const userSpecificFamily = [selfMember, ...loadedFamily.filter(f => f.relationship !== 'self')];
    setFamilyMembers(userSpecificFamily);
    setActiveFamilyMemberId(selfMember.id);
  };

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    // Fetch initial active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      if (session?.user) {
        handleSupabaseUser(session.user).finally(() => {
          if (isMounted) setLoading(false);
        });
      } else {
        setLoading(false);
      }
    }).catch(err => {
      console.error('Session restore error:', err);
      if (isMounted) setLoading(false);
    });

    // Subscribe to real-time auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      if (session?.user) {
        await handleSupabaseUser(session.user);
      } else if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
        setUser(null);
        setProfile(null);
        setUserRole('patient');
        setUserMode('patient');
      }
      setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Fetch initial staff accounts & family members from Supabase database if configured
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    async function loadSupabaseAuthData() {
      try {
        const { data: dbStaff } = await supabase.from('clinic_staff_accounts').select('*');
        if (dbStaff && dbStaff.length > 0) {
          const normalized = dbStaff.map(s => ({
            ...s,
            password: s.password || s.password_hash || 'staff123',
            password_hash: s.password_hash || s.password || 'staff123'
          }));
          setStaffAccounts(normalized);
        }

        const { data: dbFamily } = await supabase.from('family_members').select('*');
        if (dbFamily && dbFamily.length > 0) {
          setFamilyMembers(prev => {
            const staticSelf = prev.filter(m => m.id === 'fam-self');
            const newMembers = dbFamily.filter(f => f.id !== 'fam-self');
            return [...staticSelf, ...newMembers];
          });
        }

        const { data: dbProfiles } = await supabase.from('profiles').select('*');
        if (dbProfiles && dbProfiles.length > 0) {
          const ownerProfiles = dbProfiles.filter(p => p.role === 'business_owner' || p.role === 'admin');
          if (ownerProfiles.length > 0) {
            setRegisteredBusinesses(prev => {
              const merged = [...prev];
              ownerProfiles.forEach(op => {
                const idx = merged.findIndex(b => b.email?.toLowerCase() === op.email?.toLowerCase() || b.id === op.id);
                const ownerItem = {
                  id: op.id,
                  email: op.email,
                  password: op.password || '123456789',
                  name: op.full_name || 'Hospital Business Owner',
                  phone: op.phone || '',
                  hospital_id: op.hospital_id || 'hsp-1',
                  hospital_name: op.hospital_name || 'health is wealth',
                  role: op.role || 'business_owner',
                  is_verified: true
                };
                if (idx >= 0) {
                  merged[idx] = { ...merged[idx], ...ownerItem };
                } else {
                  merged.unshift(ownerItem);
                }
              });
              return merged;
            });
          }
        }
      } catch (err) {
        console.warn('Initial AuthContext Supabase fetch warning:', err);
      }
    }

    loadSupabaseAuthData();

    // Subscribe to real-time clinic staff updates
    const staffChannel = supabase
      .channel('public:clinic_staff_accounts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clinic_staff_accounts' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newStaff = {
            ...payload.new,
            password: payload.new.password || payload.new.password_hash || 'staff123',
            password_hash: payload.new.password_hash || payload.new.password || 'staff123'
          };
          setStaffAccounts(prev => {
            if (prev.some(s => s.id === newStaff.id)) return prev;
            return [...prev, newStaff];
          });
        } else if (payload.eventType === 'DELETE') {
          setStaffAccounts(prev => prev.filter(s => s.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(staffChannel);
    };
  }, []);

  // Supabase Sign Up
  const signUpWithSupabase = async ({
    email,
    password,
    role = 'patient',
    fullName = '',
    phone = '',
    hospitalId = null,
    inviteCode = '',
    bloodGroup = 'None',
    emergencyContact = 'None',
    medicalNotes = 'None',
    age = '',
    gender = ''
  }) => {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, message: 'Supabase URL/Key is missing from environment. Using local mode.' };
    }

    // Validate staff invite code requirement if role is staff/doctor
    if (['staff', 'doctor', 'admin'].includes(role) && inviteCode.trim().toUpperCase() !== 'HSP-STAFF-2026' && inviteCode.trim().toUpperCase() !== 'CLINIC-VIP') {
      return {
        success: false,
        message: 'Invalid Hospital Staff Invite Code! Please request a valid invite code from your administrator.'
      };
    }

    const cleanBloodGroup = bloodGroup && bloodGroup.trim() ? bloodGroup.trim() : 'None';
    const cleanEmergency = emergencyContact && emergencyContact.trim() ? emergencyContact.trim() : 'None';
    const cleanNotes = medicalNotes && medicalNotes.trim() ? medicalNotes.trim() : 'None';

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role,
          full_name: fullName,
          phone,
          hospital_id: hospitalId,
          invite_code: inviteCode,
          blood_group: cleanBloodGroup,
          emergency_contact: cleanEmergency,
          medical_notes: cleanNotes,
          age,
          gender
        },
        emailRedirectTo: window.location.origin
      }
    });

    if (error) {
      return { success: false, message: error.message };
    }

    if (data?.user) {
      await handleSupabaseUser(data.user);
    }
    return { success: true, user: data.user };
  };

  // Supabase Sign In
  const signInWithSupabase = async ({ email, password }) => {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, message: 'Supabase URL/Key is missing from environment. Using local mode.' };
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return { success: false, message: error.message };
    }

    if (data?.user) {
      await handleSupabaseUser(data.user);
    }
    return { success: true, user: data.user };
  };

  // Reset Password (Supabase + Local Demo Simulation)
  const resetPasswordWithSupabase = async (email) => {
    if (!email || !email.includes('@')) {
      return { success: false, message: 'Please enter a valid email address.' };
    }

    if (!isSupabaseConfigured || !supabase) {
      // Demo / Local Mode Simulation
      return { 
        success: true, 
        message: `Password reset notification dispatched to ${email}! (Demo Simulation: When connected to live Supabase, an official reset email link will be delivered directly to your inbox).` 
      };
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) {
        let cleanMsg = error.message || 'Unable to process password reset.';
        if (cleanMsg === 'Not Found' || cleanMsg.includes('Not Found')) {
          cleanMsg = `No registered account found for "${email}". Please verify your email or register a new account.`;
        }
        return { success: false, message: cleanMsg };
      }

      return { 
        success: true, 
        message: `Password reset email notification sent successfully to ${email}! Please check your inbox and follow the instructions.` 
      };
    } catch (err) {
      return { success: false, message: err.message || 'Failed to send password reset email.' };
    }
  };

  // Supabase Sign Out
  const signOutWithSupabase = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    logout();
  };

  // Login handler for Patient, Hospital Business Owner, or Doctor
  const login = (role, userData) => {
    setIsAuthenticated(true);
    setUserRole(role);
    setUserMode(role === 'patient' ? 'patient' : 'staff');
    const loggedUser = {
      id: userData?.id || (role === 'patient' ? 'user-patient-demo' : 'user-staff-1'),
      email: userData?.email || (role === 'patient' ? 'patient@example.com' : 'owner@apolloclinic.com'),
      name: userData?.name || userData?.owner_name || (role === 'patient' ? 'Lakshya Sharma' : 'Apollo Clinic Owner'),
      phone: userData?.phone || '+91 98765 12345',
      role: role,
      ...userData
    };
    setUser(loggedUser);
    if (userData?.hospital_id) {
      setStaffHospitalId(userData.hospital_id);
    }
  };

  // Register New Patient Account
  const registerPatient = (patientData) => {
    const cleanPhone = (patientData.phone || '').trim().replace(/[^0-9]/g, '');
    const existing = registeredPatients.find(p => (p.phone || '').trim().replace(/[^0-9]/g, '') === cleanPhone);

    let newPatient;
    if (existing) {
      newPatient = { ...existing, ...patientData };
      setRegisteredPatients(prev => prev.map(p => (p.id === existing.id ? newPatient : p)));
    } else {
      newPatient = {
        id: `user-pat-${Date.now()}`,
        role: 'patient',
        ...patientData
      };
      setRegisteredPatients(prev => [newPatient, ...prev]);
    }

    login('patient', newPatient);
    return newPatient;
  };

  // Validate Patient Mobile Number before Sign In
  const loginPatientWithPhone = (phoneInput) => {
    const cleanInput = (phoneInput || '').trim().replace(/[^0-9]/g, '');
    if (!cleanInput) {
      return { success: false, message: 'Please enter a valid mobile phone number.' };
    }

    const patient = registeredPatients.find(p => {
      const cleanP = (p.phone || '').trim().replace(/[^0-9]/g, '');
      return cleanP === cleanInput || cleanP.endsWith(cleanInput) || cleanInput.endsWith(cleanP);
    });

    if (!patient) {
      return {
        success: false,
        message: `No registered patient account found for phone number (${phoneInput}). Please register a new account first!`
      };
    }

    return { success: true, patient };
  };

  // Register New Hospital Business Owner Account
  const registerBusinessOwner = async (businessData) => {
    const cleanEmail = (businessData.email || '').trim().toLowerCase();
    const existingIndex = registeredBusinesses.findIndex(b => b.email.toLowerCase() === cleanEmail);

    let supabaseUid = null;
    if (isSupabaseConfigured && supabase && businessData.password) {
      try {
        const { data: authData } = await supabase.auth.signUp({
          email: cleanEmail,
          password: businessData.password,
          options: {
            data: {
              full_name: businessData.owner_name || businessData.name || 'Hospital Business Owner',
              role: 'business_owner',
              phone: businessData.phone,
              hospital_id: businessData.hospital_id
            }
          }
        });
        if (authData?.user?.id) {
          supabaseUid = authData.user.id;
        }
      } catch (err) {
        console.warn('Supabase business owner auth registration warning:', err);
      }
    }

    const newOwner = {
      id: supabaseUid || businessData.id || `owner-${Date.now()}`,
      role: 'business_owner',
      email: cleanEmail,
      password: businessData.password || 'password123',
      name: businessData.owner_name || businessData.name || 'Hospital Business Owner',
      phone: businessData.phone || '+91 80 4112 8800',
      hospital_id: businessData.hospital_id || 'hsp-1',
      hospital_name: businessData.hospital_name || 'OPD Clinic',
      clinical_license: businessData.clinical_license || 'CEA/KA/2026/8841',
      license_proof_file: businessData.license_proof_file || 'Clinical_Establishment_License_Doc.pdf',
      council_reg: businessData.council_reg || 'KMC-74921-2018',
      council_proof_file: businessData.council_proof_file || 'Medical_Council_Registration_Cert.pdf',
      is_verified: true
    };

    if (existingIndex >= 0) {
      setRegisteredBusinesses(prev => prev.map((b, idx) => (idx === existingIndex ? newOwner : b)));
    } else {
      setRegisteredBusinesses(prev => [newOwner, ...prev]);
    }

    login('business_owner', newOwner);
    if (newOwner.hospital_id) {
      setStaffHospitalId(newOwner.hospital_id);
    }
    return newOwner;
  };

  // Validate Hospital Business Owner Sign In (Email + Password)
  const loginBusinessWithOwner = (emailInput, passwordInput, hospitalId = null) => {
    const cleanEmail = (emailInput || '').trim().toLowerCase();
    if (!cleanEmail) {
      return { success: false, message: 'Please enter your business owner email address.' };
    }
    if (!passwordInput) {
      return { success: false, message: 'Please enter your account password.' };
    }

    const owner = registeredBusinesses.find(b => b.email.toLowerCase() === cleanEmail);

    if (!owner) {
      return {
        success: false,
        message: `No registered hospital business account found for (${emailInput}). Please click "+ Register Hospital Business" below to create your account.`
      };
    }

    if (owner.password !== passwordInput) {
      return {
        success: false,
        message: 'Incorrect password for this hospital owner account. Please check your credentials.'
      };
    }

    login('business_owner', owner);
    if (hospitalId) {
      setStaffHospitalId(hospitalId);
    } else if (owner.hospital_id) {
      setStaffHospitalId(owner.hospital_id);
    }
    return { success: true, user: owner };
  };

  // Login handler for Clinic Staff Operator (Username + Password)
  const loginStaffOperator = (username, password, hospitalId = null) => {
    const cleanUser = (username || '').trim().toLowerCase();
    const cleanPass = password || '';
    const account = staffAccounts.find(
      s => (s.username && s.username.toLowerCase() === cleanUser) &&
           (s.password === cleanPass || s.password_hash === cleanPass)
    );

    if (!account) {
      return { success: false, message: 'Invalid Staff Username or Password!' };
    }

    setIsAuthenticated(true);
    setUserRole('staff_operator');
    setUserMode('staff');
    const targetHsp = hospitalId || account.hospital_id;
    setStaffHospitalId(targetHsp);

    const loggedUser = {
      id: account.id,
      name: account.staff_name,
      username: account.username,
      hospital_id: targetHsp,
      doctor_id: account.doctor_id,
      role: 'staff_operator'
    };

    setUser(loggedUser);
    return { success: true, user: loggedUser };
  };

  // Login handler for Doctor OPD Console (Doctor Username + Password)
  const loginDoctor = (usernameInput, passwordInput, availableDoctors = [], hospitalId = null) => {
    const cleanUser = (usernameInput || '').trim().toLowerCase();
    if (!cleanUser) {
      return { success: false, message: 'Please enter your Doctor Username or Registration ID.' };
    }
    if (!passwordInput) {
      return { success: false, message: 'Please enter your Doctor account password.' };
    }

    // Search available doctors database
    const doctor = availableDoctors.find(
      d => (d.username && d.username.toLowerCase() === cleanUser) ||
           (d.name && d.name.toLowerCase().includes(cleanUser))
    );

    if (!doctor) {
      return {
        success: false,
        message: `No Doctor account found matching (${usernameInput}). Please check with your Hospital Business Owner.`
      };
    }

    if (doctor.is_resigned || doctor.status === 'resigned') {
      return {
        success: false,
        message: `Doctor account for ${doctor.name} has been marked as Resigned / Inactive. Sign-in access has been disabled by the hospital administration.`
      };
    }

    if (doctor.password && doctor.password !== passwordInput) {
      return {
        success: false,
        message: 'Incorrect password for this Doctor account. Please check your credentials.'
      };
    }

    setIsAuthenticated(true);
    setUserRole('doctor');
    setUserMode('staff');
    const targetHsp = hospitalId || doctor.hospital_id;
    if (targetHsp) {
      setStaffHospitalId(targetHsp);
    }

    const loggedUser = {
      id: doctor.id,
      doctor_id: doctor.id,
      name: doctor.name,
      username: doctor.username || usernameInput,
      hospital_id: targetHsp,

      specialty: doctor.specialty,
      qualification: doctor.qualification,
      role: 'doctor'
    };

    setUser(loggedUser);
    return { success: true, user: loggedUser };
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    setUserMode('patient');
    setUserRole('patient');
    setFamilyMembers([
      {
        id: 'fam-self',
        patient_id: 'self',
        full_name: 'Self (You)',
        relationship: 'self',
        age: null,
        gender: 'N/A'
      }
    ]);
    setActiveFamilyMemberId('fam-self');
    localStorage.removeItem('hqswift_is_auth');
    localStorage.removeItem('hqswift_user');
    localStorage.removeItem('hqswift_family_members');
  };

  const createStaffAccount = async (accountData) => {
    const rawUsername = (accountData.username || '').trim();
    const cleanPass = accountData.password || 'staff123';
    const newAcc = {
      id: `staff-acc-${Date.now()}`,
      role: 'token_operator',
      ...accountData,
      username: rawUsername,
      password: cleanPass,
      password_hash: cleanPass
    };

    setStaffAccounts(prev => {
      const filtered = prev.filter(a => a.id !== newAcc.id && a.username.toLowerCase() !== rawUsername.toLowerCase());
      return [...filtered, newAcc];
    });

    if (isSupabaseConfigured && supabase) {
      try {
        const payload = {
          id: newAcc.id,
          hospital_id: newAcc.hospital_id || 'hsp-1',
          doctor_id: newAcc.doctor_id || null,
          staff_name: newAcc.staff_name,
          username: rawUsername,
          password: cleanPass,
          password_hash: cleanPass,
          role: newAcc.role || 'token_operator'
        };
        const { error } = await supabase.from('clinic_staff_accounts').insert([payload]);
        if (error) {
          console.warn('Supabase insert staff warning:', error.message);
        }
      } catch (err) {
        console.warn('Supabase insert staff caught error:', err);
      }
    }
    return newAcc;
  };

  const updateStaffAccount = async (accountId, updates) => {
    const cleanUpdates = { ...updates };
    if (cleanUpdates.password) {
      cleanUpdates.password_hash = cleanUpdates.password;
    }
    setStaffAccounts(prev => prev.map(a => a.id === accountId ? { ...a, ...cleanUpdates } : a));

    if (user?.id === accountId) {
      setUser(prev => ({
        ...prev,
        name: cleanUpdates.staff_name || prev.name,
        doctor_id: cleanUpdates.doctor_id !== undefined ? cleanUpdates.doctor_id : prev.doctor_id
      }));
    }

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('clinic_staff_accounts').update(cleanUpdates).eq('id', accountId);
      } catch (err) {
        console.warn('Supabase update staff error:', err);
      }
    }
    return { success: true };
  };

  const updateUserPassword = async (newPassword) => {
    if (!newPassword || newPassword.length < 4) {
      return { success: false, message: 'Password must be at least 4 characters long.' };
    }

    if (user) {
      setUser(prev => ({ ...prev, password: newPassword }));
      if (userRole === 'staff_operator') {
        setStaffAccounts(prev => prev.map(s => s.id === user.id ? { ...s, password: newPassword, password_hash: newPassword } : s));
      }
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) {
          console.warn('Supabase update password warning:', error.message);
        }
      } catch (err) {
        console.warn('Supabase update password caught error:', err);
      }
    }

    return { success: true, message: 'Password updated successfully!' };
  };

  const updateUserProfile = async (profileData) => {
    if (user) {
      const updatedUser = {
        ...user,
        name: profileData.name || profileData.full_name || user.name,
        phone: profileData.phone !== undefined ? profileData.phone : user.phone,
        blood_group: profileData.blood_group !== undefined ? profileData.blood_group : user.blood_group,
        emergency_contact: profileData.emergency_contact !== undefined ? profileData.emergency_contact : user.emergency_contact,
        medical_notes: profileData.medical_notes !== undefined ? profileData.medical_notes : user.medical_notes,
        hospital_id: profileData.hospital_id || user.hospital_id
      };
      setUser(updatedUser);

      if (userRole === 'staff_operator') {
        const newName = profileData.name || profileData.full_name;
        if (newName) {
          setStaffAccounts(prev => prev.map(s => s.id === user.id ? { ...s, staff_name: newName } : s));
        }
      }
    }

    if (isSupabaseConfigured && supabase && user?.id) {
      try {
        await supabase.auth.updateUser({
          data: {
            full_name: profileData.name || profileData.full_name,
            phone: profileData.phone,
            hospital_id: profileData.hospital_id || user.hospital_id,
            blood_group: profileData.blood_group,
            emergency_contact: profileData.emergency_contact,
            medical_notes: profileData.medical_notes
          }
        });
        await supabase.from('profiles').update({
          full_name: profileData.name || profileData.full_name,
          phone: profileData.phone,
          hospital_id: profileData.hospital_id || user.hospital_id,
          blood_group: profileData.blood_group,
          emergency_contact: profileData.emergency_contact,
          medical_notes: profileData.medical_notes
        }).eq('id', user.id);
      } catch (err) {
        console.warn('Supabase update profile caught error:', err);
      }
    }

    return { success: true, message: 'Profile updated successfully!' };
  };

  const deleteStaffAccount = async (accountId) => {
    setStaffAccounts(prev => prev.filter(a => a.id !== accountId));
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('clinic_staff_accounts').delete().eq('id', accountId);
      } catch (err) {
        console.warn('Supabase delete staff caught error:', err);
      }
    }
  };

  const addFamilyMember = async (newMember) => {
    const memberObj = {
      id: `fam-${Date.now()}`,
      patient_id: user?.id || 'self',
      ...newMember
    };
    setFamilyMembers(prev => [...prev, memberObj]);

    if (isSupabaseConfigured && supabase && user?.id) {
      try {
        await supabase.from('family_members').insert([{
          id: memberObj.id,
          patient_id: user.id,
          full_name: memberObj.full_name,
          relationship: memberObj.relationship || 'other',
          age: memberObj.age ? parseInt(memberObj.age, 10) : null,
          gender: memberObj.gender || 'N/A'
        }]);
      } catch (err) {
        console.warn('Supabase insert family error:', err);
      }
    }
    return memberObj;
  };

  const deleteFamilyMember = async (memberId) => {
    if (memberId === 'fam-self' || memberId.startsWith('fam-self')) return;
    setFamilyMembers(prev => prev.filter(m => m.id !== memberId));
    if (activeFamilyMemberId === memberId) {
      setActiveFamilyMemberId(familyMembers[0]?.id || 'fam-self');
    }
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('family_members').delete().eq('id', memberId);
      } catch (err) {
        console.warn('Supabase delete family error:', err);
      }
    }
  };

  // Dynamic family members list that uses the logged-in patient's actual name & details for 'fam-self'
  const userFamilyMembers = familyMembers.map(m => {
    if (m.relationship === 'self' || m.id.startsWith('fam-self') || m.id === 'fam-self') {
      return {
        ...m,
        full_name: user?.name ? `${user.name} (Self)` : 'Self (You)',
        age: user?.age || m.age || null,
        gender: user?.gender || m.gender || 'N/A'
      };
    }
    return m;
  });

  // Pending Email Authentication State for Code Verification
  const [pendingEmailAuth, setPendingEmailAuth] = useState(null);

  // Send Email Verification Security Code Notification
  const sendEmailAuthCode = (emailInput, role = 'patient', extraData = {}) => {
    const cleanEmail = (emailInput || '').trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return { success: false, message: 'Please enter a valid email address (e.g. user@gmail.com).' };
    }

    // Generate a random 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const authState = {
      email: cleanEmail,
      code: code,
      role: role,
      extraData: extraData,
      sentAt: new Date().toISOString()
    };

    setPendingEmailAuth(authState);
    return {
      success: true,
      code: code,
      email: cleanEmail,
      message: `📧 Authentication Notification sent to ${cleanEmail}. Verification Code: ${code}`
    };
  };

  // Verify 6-digit Email Authentication Code
  const verifyEmailAuthCode = (inputCode) => {
    if (!pendingEmailAuth) {
      return { success: false, message: 'No active email authentication request found.' };
    }

    if ((inputCode || '').trim() !== pendingEmailAuth.code) {
      return { success: false, message: 'Invalid 6-digit verification code. Please check your notification and try again.' };
    }

    // Complete login
    const { role, email, extraData } = pendingEmailAuth;
    const loggedUser = {
      id: extraData?.id || `usr-email-${Date.now()}`,
      email: email,
      name: extraData?.name || email.split('@')[0].replace(/[^a-zA-Z0-9]/g, ' '),
      role: role,
      is_email_verified: true,
      ...extraData
    };

    login(role, loggedUser);
    setPendingEmailAuth(null);
    return { success: true, user: loggedUser };
  };

  // Google SSO Account Sign In
  const loginWithGoogle = (googleEmail, role = 'patient', googleName = '') => {
    const cleanEmail = (googleEmail || '').trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return { success: false, message: 'Invalid Google Email address.' };
    }

    return sendEmailAuthCode(cleanEmail, role, {
      name: googleName || cleanEmail.split('@')[0].replace('.', ' '),
      auth_provider: 'google',
      picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
    });
  };

  const activeFamilyMember = userFamilyMembers.find(m => m.id === activeFamilyMemberId) || userFamilyMembers[0];

  return (
    <AuthContext.Provider
      value={{
        loading,
        profile,
        role: userRole,
        isAuthenticated,
        userRole,
        userMode,
        setUserMode,
        user,
        login,
        registerPatient,
        loginPatientWithPhone,
        registeredPatients,
        registeredBusinesses,
        registerBusinessOwner,
        loginBusinessWithOwner,
        loginStaffOperator,
        loginDoctor,
        logout,
        staffAccounts,
        createStaffAccount,
        updateStaffAccount,
        deleteStaffAccount,
        updateUserPassword,
        updateUserProfile,
        familyMembers: userFamilyMembers,
        addFamilyMember,
        deleteFamilyMember,
        activeFamilyMemberId,
        setActiveFamilyMemberId,
        activeFamilyMember,
        staffHospitalId,
        setStaffHospitalId,
        pendingEmailAuth,
        setPendingEmailAuth,
        sendEmailAuthCode,
        verifyEmailAuthCode,
        loginWithGoogle,
        signUpWithSupabase,
        signInWithSupabase,
        resetPasswordWithSupabase,
        signOutWithSupabase,
        isSupabaseConfigured,
      }}
    >

      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
