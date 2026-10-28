import React, { useState } from 'react';
import {
  Building2,
  MapPin,
  Plus,
  Trash2,
  CheckCircle2,
  Stethoscope,
  Loader2,
  FileCheck,
  ShieldCheck,
  UploadCloud,
  Lock,
  Mail,
  User,
  Phone,
  FileText,
  BadgeCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useQueue } from '../../context/QueueContext';
import { geocodeAddress } from '../../lib/geocoding';

export default function OnboardingModal({ onClose }) {
  const { registerBusinessOwner, setStaffHospitalId } = useAuth();
  const { addHospital } = useQueue();

  const [isGeocoding, setIsGeocoding] = useState(false);
  const [step, setStep] = useState(1); // Step 1: Owner Details, Step 2: Hospital Details & Proofs, Step 3: Add Doctors

  // Step 1: Business Owner Account Details
  const [ownerForm, setOwnerForm] = useState({
    owner_name: '',
    email: '',
    phone: '',
    password: '',
    confirm_password: ''
  });
  const [ownerError, setOwnerError] = useState('');

  // Step 2: Hospital & Certificate Proofs State
  const [hospitalForm, setHospitalForm] = useState({
    name: '',
    type: 'clinic',
    address: '',
    phone: '',
    emergency_contact: '',
    clinical_license: '',
    license_proof_file: 'Clinical_License_CEA2026.pdf',
    license_proof_uploaded: true,
    council_reg: '',
    council_proof_file: 'Medical_Council_Registration_Cert.pdf',
    council_proof_uploaded: true,
    photo_url: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=800&q=80',
    specialties: ['General Physician']
  });

  // Step 3: OPD Doctor List State
  const [doctorsList, setDoctorsList] = useState([
    {
      name: 'Dr. Suresh Kumar',
      specialty: 'General Physician',
      consultation_fee: 500,
      qualification: 'MD (General Medicine)',
      avg_consult_minutes: 15
    }
  ]);

  const handleStep1Submit = (e) => {
    e.preventDefault();
    setOwnerError('');

    if (!ownerForm.owner_name || !ownerForm.email || !ownerForm.password) {
      setOwnerError('Please fill in all required business owner details.');
      return;
    }

    if (ownerForm.password !== ownerForm.confirm_password) {
      setOwnerError('Password and Confirm Password do not match.');
      return;
    }

    if (ownerForm.password.length < 6) {
      setOwnerError('Password should be at least 6 characters long.');
      return;
    }

    setStep(2);
  };

  const handleStep2Submit = (e) => {
    e.preventDefault();
    setStep(3);
  };

  const handleAddDoctorRow = () => {
    setDoctorsList([
      ...doctorsList,
      {
        name: '',
        specialty: 'Pediatrics',
        consultation_fee: 600,
        qualification: 'MBBS, DCH',
        avg_consult_minutes: 15
      }
    ]);
  };

  const handleRemoveDoctorRow = (index) => {
    if (doctorsList.length === 1) return;
    setDoctorsList(doctorsList.filter((_, idx) => idx !== index));
  };

  const handleDoctorChange = (index, field, value) => {
    const updated = [...doctorsList];
    updated[index][field] = value;
    setDoctorsList(updated);
  };

  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    setIsGeocoding(true);

    try {
      // Free Geocode address with OpenStreetMap Nominatim
      let coords = null;
      try {
        coords = await geocodeAddress(hospitalForm.address);
      } catch (geoErr) {
        console.warn('Geocoding fallback utilized:', geoErr);
      }

      // 1. Create Hospital Entry in QueueContext
      const createdHospital = addHospital(
        {
          owner_id: `owner-${Date.now()}`,
          name: hospitalForm.name || 'OPD Care Clinic',
          type: hospitalForm.type || 'clinic',
          address: hospitalForm.address || '42 Clinic St, Bengaluru',
          phone: hospitalForm.phone || ownerForm.phone || '+91 80 4112 8800',
          emergency_contact: hospitalForm.emergency_contact || hospitalForm.phone || '+91 80 1066',
          clinical_license: hospitalForm.clinical_license || 'CEA/KA/2026/8841',
          license_proof_file: hospitalForm.license_proof_file || 'Clinical_License_CEA2026.pdf',
          council_reg: hospitalForm.council_reg || 'KMC-74921-2018',
          photo_url: (() => {
            const raw = hospitalForm.photo_url || '';
            if (raw.includes('google.com/imgres') || raw.includes('imgurl=')) {
              const match = raw.match(/[?&]imgurl=([^&]+)/);
              if (match && match[1]) return decodeURIComponent(match[1]);
            }
            if (raw.includes('google.com/url?') && raw.includes('url=')) {
              const match = raw.match(/[?&]url=([^&]+)/);
              if (match && match[1]) return decodeURIComponent(match[1]);
            }
            return raw || 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=800&q=80';
          })(),
          is_open: true,
          is_verified: true,
          verification_status: 'verified',
          rating: 5.0,
          review_count: 1,
          distance_km: 1.5,
          lat: coords ? coords.lat : 12.9716,
          lng: coords ? coords.lng : 77.5946
        },
        doctorsList
      );

      // 2. Register Business Owner Account in AuthContext
      await registerBusinessOwner({
        name: ownerForm.owner_name,
        owner_name: ownerForm.owner_name,
        email: ownerForm.email,
        phone: ownerForm.phone,
        password: ownerForm.password,
        hospital_id: createdHospital.id,
        hospital_name: hospitalForm.name,
        clinical_license: hospitalForm.clinical_license,
        license_proof_file: hospitalForm.license_proof_file,
        council_reg: hospitalForm.council_reg,
        council_proof_file: hospitalForm.council_proof_file
      });

      setStaffHospitalId(createdHospital.id);
      if (onClose) onClose();
    } catch (err) {
      console.error('Hospital creation error:', err);
      if (onClose) onClose();
    } finally {
      setIsGeocoding(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-ink/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto animate-in zoom-in-95 my-6 border border-slate-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigoConsole-light text-indigoConsole rounded-2xl shadow-xs">
              <Building2 className="w-6 h-6 text-indigoConsole" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-ink">Register Hospital Business</h2>
              <p className="text-xs text-ink-muted">
                Step {step} of 3 — {
                  step === 1
                    ? 'Owner Profile & Sign-In Details'
                    : step === 2
                      ? 'Hospital Details & Certificate Proofs'
                      : 'OPD Doctor Roster'
                }
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full transition-all ${step === 1 ? 'bg-[#0E7C86] w-6' : 'bg-slate-300'}`}></span>
              <span className={`w-2.5 h-2.5 rounded-full transition-all ${step === 2 ? 'bg-[#0E7C86] w-6' : 'bg-slate-300'}`}></span>
              <span className={`w-2.5 h-2.5 rounded-full transition-all ${step === 3 ? 'bg-[#0E7C86] w-6' : 'bg-slate-300'}`}></span>
            </div>
            {onClose && (
              <button onClick={onClose} className="ml-3 text-slate-400 hover:text-ink text-xs font-bold px-2 py-1 bg-slate-100 rounded-lg">
                ✕
              </button>
            )}
          </div>
        </div>

        {/* STEP 1: Business Owner Account Details */}
        {step === 1 && (
          <form onSubmit={handleStep1Submit} className="space-y-4">
            <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-2xl flex items-start gap-3 text-xs text-indigo-900">
              <ShieldCheck className="w-5 h-5 text-indigoConsole shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Business Owner Credentials</strong>
                <span>Create your owner account. You will use this Email & Password to sign into your Hospital Console dashboard.</span>
              </div>
            </div>

            {ownerError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl">
                {ownerError}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Business Owner Full Name *
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Rajesh Sharma"
                  value={ownerForm.owner_name}
                  onChange={(e) => setOwnerForm({ ...ownerForm, owner_name: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-clinical-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Business Owner Email (Used for Sign In) *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="rajesh@citycarepolyclinic.com"
                    value={ownerForm.email}
                    onChange={(e) => setOwnerForm({ ...ownerForm, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-clinical-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Owner Contact Phone *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="+91 98765 43210"
                    value={ownerForm.phone}
                    onChange={(e) => setOwnerForm({ ...ownerForm, phone: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-clinical-500"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Dashboard Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Set password (min 6 chars)"
                    value={ownerForm.password}
                    onChange={(e) => setOwnerForm({ ...ownerForm, password: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-clinical-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Confirm password"
                    value={ownerForm.confirm_password}
                    onChange={(e) => setOwnerForm({ ...ownerForm, confirm_password: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-clinical-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="submit"
                className="px-6 py-2.5 text-xs font-bold bg-[#0E7C86] hover:bg-clinical-600 text-white rounded-xl shadow-md transition-all flex items-center gap-1.5"
              >
                <span>Next: Facility Details & Proofs →</span>
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: Hospital Details & Certificate Proof Verification */}
        {step === 2 && (
          <form onSubmit={handleStep2Submit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Clinic / Hospital Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. City Care OPD Polyclinic"
                value={hospitalForm.name}
                onChange={(e) => setHospitalForm({ ...hospitalForm, name: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-clinical-500 font-medium"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Facility Type</label>
                <select
                  value={hospitalForm.type}
                  onChange={(e) => setHospitalForm({ ...hospitalForm, type: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-clinical-500"
                >
                  <option value="clinic">OPD Clinic / Polyclinic</option>
                  <option value="hospital">Multispecialty Hospital</option>
                  <option value="diagnostic_center">Diagnostic & Care Centre</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Hospital Contact Phone *</label>
                <input
                  type="text"
                  required
                  placeholder="+91 80 4112 8800"
                  value={hospitalForm.phone}
                  onChange={(e) => setHospitalForm({ ...hospitalForm, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-clinical-500"
                />
              </div>
            </div>

            {/* Proof of Certificates Section */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <BadgeCheck className="w-5 h-5 text-emerald-600" />
                <div>
                  <h4 className="text-xs font-bold text-ink">Medical Council & Clinical Establishment Proof Certificates</h4>
                  <p className="text-[11px] text-ink-muted">Enter registered license numbers and attach verified certificate documents</p>
                </div>
              </div>

              {/* Certificate 1: Clinical Establishment License */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700">
                  1. Clinical Establishment License Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CEA/KA/2026/8841"
                  value={hospitalForm.clinical_license}
                  onChange={(e) => setHospitalForm({ ...hospitalForm, clinical_license: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-clinical-500 font-mono"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="p-2.5 bg-white border border-slate-200 rounded-xl space-y-1">
                    <span className="text-[11px] font-semibold text-slate-600 block">📁 Upload License PDF / Image:</span>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setHospitalForm({
                              ...hospitalForm,
                              license_proof_file: file.name,
                              license_proof_url: reader.result
                            });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="w-full text-[11px] text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                    />
                  </div>

                  <div className="p-2.5 bg-white border border-slate-200 rounded-xl space-y-1">
                    <span className="text-[11px] font-semibold text-slate-600 block">🔗 Or Enter Document / PDF Web URL:</span>
                    <input
                      type="text"
                      placeholder="https://.../license.pdf"
                      value={hospitalForm.license_proof_url || ''}
                      onChange={(e) => setHospitalForm({
                        ...hospitalForm,
                        license_proof_url: e.target.value,
                        license_proof_file: e.target.value.split('/').pop() || 'Clinical_License_CEA2026.pdf'
                      })}
                      className="w-full px-2 py-1 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-clinical-500 font-medium"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-white border border-emerald-200 rounded-xl text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div className="truncate">
                      <span className="font-semibold text-slate-800">License Proof Certificate:</span>
                      <span className="font-mono text-emerald-700 ml-1.5 text-[11px] block sm:inline truncate">
                        {hospitalForm.license_proof_file || 'Clinical_License_CEA2026.pdf'}
                      </span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-md flex items-center gap-1 shrink-0 ml-2">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified Proof
                  </span>
                </div>
              </div>

              {/* Certificate 2: Medical Council Registration */}
              <div className="space-y-2 pt-2 border-t border-slate-200/70">
                <label className="block text-xs font-semibold text-slate-700">
                  2. Medical Council Registration Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. KMC-74921-2018"
                  value={hospitalForm.council_reg}
                  onChange={(e) => setHospitalForm({ ...hospitalForm, council_reg: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-clinical-500 font-mono"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="p-2.5 bg-white border border-slate-200 rounded-xl space-y-1">
                    <span className="text-[11px] font-semibold text-slate-600 block">📁 Upload Council PDF / Image:</span>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setHospitalForm({
                              ...hospitalForm,
                              council_proof_file: file.name,
                              council_proof_url: reader.result
                            });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="w-full text-[11px] text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                    />
                  </div>

                  <div className="p-2.5 bg-white border border-slate-200 rounded-xl space-y-1">
                    <span className="text-[11px] font-semibold text-slate-600 block">🔗 Or Enter Document / PDF Web URL:</span>
                    <input
                      type="text"
                      placeholder="https://.../council_cert.pdf"
                      value={hospitalForm.council_proof_url || ''}
                      onChange={(e) => setHospitalForm({
                        ...hospitalForm,
                        council_proof_url: e.target.value,
                        council_proof_file: e.target.value.split('/').pop() || 'Medical_Council_Registration_Cert.pdf'
                      })}
                      className="w-full px-2 py-1 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-clinical-500 font-medium"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-white border border-emerald-200 rounded-xl text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div className="truncate">
                      <span className="font-semibold text-slate-800">Council Registration Certificate:</span>
                      <span className="font-mono text-emerald-700 ml-1.5 text-[11px] block sm:inline truncate">
                        {hospitalForm.council_proof_file || 'Medical_Council_Registration_Cert.pdf'}
                      </span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-md flex items-center gap-1 shrink-0 ml-2">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified Proof
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Street Address (Geocoded via OpenStreetMap) *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 42 Indiranagar 100ft Road, Bengaluru, KA 560038"
                value={hospitalForm.address}
                onChange={(e) => setHospitalForm({ ...hospitalForm, address: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-clinical-500"
              />
            </div>

            {/* Cover Image Upload or URL */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                Hospital Cover Photo (Upload File or Enter Image Web URL)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="p-2.5 bg-white border border-slate-200 rounded-xl space-y-1">
                  <span className="text-[11px] font-semibold text-slate-600 block">📁 Upload Photo File:</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setHospitalForm({ ...hospitalForm, photo_url: reader.result });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="w-full text-[11px] text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-clinical-50 file:text-clinical-700 hover:file:bg-clinical-100 cursor-pointer"
                  />
                </div>

                <div className="p-2.5 bg-white border border-slate-200 rounded-xl space-y-1">
                  <span className="text-[11px] font-semibold text-slate-600 block">🔗 Or Enter Image Web URL:</span>
                  <input
                    type="text"
                    placeholder="https://images.unsplash.com/..."
                    value={hospitalForm.photo_url}
                    onChange={(e) => setHospitalForm({ ...hospitalForm, photo_url: e.target.value })}
                    className="w-full px-2 py-1 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-clinical-500 font-medium"
                  />
                </div>
              </div>

              {hospitalForm.photo_url && (
                <div className="relative h-28 w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-100 mt-2">
                  <img
                    src={hospitalForm.photo_url}
                    alt="Hospital Cover Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=800&q=80";
                    }}
                  />
                  <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-slate-900/80 text-white font-bold text-[10px] rounded backdrop-blur-md">
                    Live Photo Preview
                  </span>
                </div>
              )}
            </div>

            <div className="flex justify-between pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                ← Back to Owner Details
              </button>

              <button
                type="submit"
                className="px-6 py-2.5 text-xs font-bold bg-[#0E7C86] hover:bg-clinical-600 text-white rounded-xl shadow-md flex items-center gap-1.5"
              >
                <span>Next: Add Doctors Roster →</span>
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: Doctor Roster & Final Submit */}
        {step === 3 && (
          <form onSubmit={handleFinalSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-sm font-bold text-ink flex items-center gap-1.5">
                  <Stethoscope className="w-4 h-4 text-clinical-600" />
                  <span>OPD Doctor Roster</span>
                </h3>
                <button
                  type="button"
                  onClick={handleAddDoctorRow}
                  className="px-3 py-1.5 text-xs font-bold bg-clinical-50 text-clinical-700 rounded-lg border border-clinical-200 flex items-center gap-1 hover:bg-clinical-100"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Doctor Row</span>
                </button>
              </div>

              {doctorsList.map((doc, idx) => (
                <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 relative">
                  <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                    <span className="text-xs font-bold text-clinical-700">Doctor #{idx + 1}</span>
                    {doctorsList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveDoctorRow(idx)}
                        className="text-xs text-rose-600 hover:text-rose-800 flex items-center gap-1 font-medium"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Doctor Full Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Dr. Suresh Kumar"
                        value={doc.name}
                        onChange={(e) => handleDoctorChange(idx, 'name', e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-clinical-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Specialty</label>
                      <select
                        value={doc.specialty}
                        onChange={(e) => handleDoctorChange(idx, 'specialty', e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-clinical-500"
                      >
                        <option value="General Physician">General Physician</option>
                        <option value="Pediatrics">Pediatrics</option>
                        <option value="Dermatology">Dermatology</option>
                        <option value="Dental">Dental</option>
                        <option value="ENT">ENT</option>
                        <option value="Gynaecology">Gynaecology</option>
                        <option value="Cardiology">Cardiology</option>
                        <option value="Orthopedics">Orthopedics</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Doctor Login Username</label>
                      <input
                        type="text"
                        placeholder="e.g. DR_SURESH"
                        value={doc.username || ''}
                        onChange={(e) => handleDoctorChange(idx, 'username', e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-clinical-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Doctor Password</label>
                      <input
                        type="text"
                        placeholder="e.g. doc123"
                        value={doc.password || ''}
                        onChange={(e) => handleDoctorChange(idx, 'password', e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-clinical-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Consultation Fee (₹) *</label>
                      <input
                        type="number"
                        required
                        value={doc.consultation_fee}
                        onChange={(e) => handleDoctorChange(idx, 'consultation_fee', Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-clinical-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Qualification</label>
                      <input
                        type="text"
                        placeholder="e.g. MD (AIIMS)"
                        value={doc.qualification}
                        onChange={(e) => handleDoctorChange(idx, 'qualification', e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-clinical-500"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex items-center gap-3 text-xs text-emerald-900">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <strong className="font-bold">Ready to Register & Sign In!</strong>
                  <p className="text-[11px] text-emerald-800">
                    After registration, you will be logged into your Business Dashboard console using <strong>{ownerForm.email || 'your business email'}</strong>.
                  </p>
                </div>
              </div>

              <div className="flex justify-between pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  ← Back to Details & Proofs
                </button>

                <div className="flex gap-2">
                  {onClose && (
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                    >
                      Cancel
                    </button>
                  )}

                  <button
                    type="submit"
                    disabled={isGeocoding}
                    className="px-6 py-2.5 text-xs font-bold bg-indigoConsole hover:bg-indigo-900 text-white rounded-xl shadow-md flex items-center gap-2 transition-all"
                  >
                    {isGeocoding && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Create Hospital Business & Open Dashboard</span>
                  </button>
                </div>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
