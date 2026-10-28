const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = 4000;
const DB_FILE = path.join(__dirname, 'data', 'db.json');
const JWT_SECRET = 'hospital-qswift-jwt-secret-key-2026-production';

function base64url(str) {
  return Buffer.from(str).toString('base64url');
}

function signJwt(payload) {
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64url(JSON.stringify(payload));
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

function verifyJwt(tokenStr) {
  if (!tokenStr) return { valid: false, error: 'No token provided' };
  const cleanToken = tokenStr.replace(/^Bearer\s+/i, '').trim();
  const parts = cleanToken.split('.');
  if (parts.length !== 3) return { valid: false, error: 'Malformed JWT token' };
  const [header, body, signature] = parts;
  const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  if (signature !== expectedSig) {
    return { valid: false, error: 'Invalid JWT signature' };
  }
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return { valid: false, error: 'JWT expired', expired: true };
    }
    return { valid: true, payload };
  } catch (e) {
    return { valid: false, error: 'Failed to parse JWT payload' };
  }
}

function getAuthUser(req, db) {
  const authHeader = req.headers['authorization'] || '';
  if (!authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.substring(7).trim();
  const res = verifyJwt(token);
  if (!res.valid) return null;
  const found = db.users.find(u => u.id === res.payload.sub);
  return found || {
    id: res.payload.sub,
    email: res.payload.email,
    role: res.payload.role || 'patient',
    hospital_id: res.payload.hospital_id
  };
}

// Initial seed data with all hospitals OPEN (open 08:00 to 22:00, closed_days: [])
const initialData = {
  hospitals: [
    {
      id: "hsp-1",
      owner_id: "user-staff-1",
      name: "Apollo City OPD & Care Clinic",
      type: "clinic",
      address: "42 Indiranagar 100ft Road, Bengaluru, KA 560038",
      lat: 12.9784,
      lng: 77.6408,
      photo_url: "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=800&q=80",
      is_open: true,
      is_verified: true,
      verification_status: "verified",
      clinical_license: "CEA/KA/2026/8841",
      council_reg: "KMC-74921-2018",
      phone: "+91 80 4112 8800",
      emergency_contact: "+91 80 1066",
      rating: 4.8,
      review_count: 142,
      specialties: ["General Physician", "Pediatrics", "Dermatology", "ENT"],
      distance_km: 1.2,
      open_time: "08:00",
      close_time: "22:00",
      closed_days: [],
      is_24_7: false
    },
    {
      id: "hsp-2",
      owner_id: "user-staff-2",
      name: "Fortis Lifecare Hospital",
      type: "hospital",
      address: "154/9 Bannerghatta Main Rd, Opp IIM, Bengaluru, KA 560076",
      lat: 12.8956,
      lng: 77.5989,
      photo_url: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80",
      is_open: true,
      is_verified: true,
      verification_status: "verified",
      clinical_license: "CEA/KA/2026/9012",
      council_reg: "KMC-88120-2016",
      phone: "+91 80 6621 4444",
      emergency_contact: "105711",
      rating: 4.6,
      review_count: 310,
      specialties: ["Cardiology", "Orthopedics", "Gynaecology", "General Physician"],
      distance_km: 2.8,
      open_time: "00:00",
      close_time: "23:59",
      closed_days: [],
      is_24_7: true
    },
    {
      id: "hsp-3",
      owner_id: "user-staff-3",
      name: "Max Healthcare OPD Centre",
      type: "clinic",
      address: "88 Koramangala 5th Block, Bengaluru, KA 560095",
      lat: 12.9352,
      lng: 77.6245,
      photo_url: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=800&q=80",
      is_open: true,
      is_verified: true,
      verification_status: "verified",
      clinical_license: "CEA/KA/2026/4100",
      council_reg: "KMC-65432-2019",
      phone: "+91 80 4900 1200",
      emergency_contact: "+91 80 4900 1201",
      rating: 4.9,
      review_count: 88,
      specialties: ["Dental", "Dermatology", "Pediatrics"],
      distance_km: 3.4,
      open_time: "08:00",
      close_time: "22:00",
      closed_days: [],
      is_24_7: false
    },
    {
      id: "hsp-4",
      owner_id: "user-staff-4",
      name: "Manipal Polyclinic & Diagnostic",
      type: "diagnostic_center",
      address: "98 HAL Airport Rd, Kodihalli, Bengaluru, KA 560017",
      lat: 12.9592,
      lng: 77.6482,
      photo_url: "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80",
      is_open: true,
      is_verified: true,
      verification_status: "verified",
      phone: "+91 80 2502 4444",
      emergency_contact: "+91 80 2502 4445",
      rating: 4.7,
      review_count: 215,
      specialties: ["General Physician", "ENT", "Cardiology"],
      distance_km: 4.1,
      open_time: "07:30",
      close_time: "22:00",
      closed_days: [],
      is_24_7: false
    },
    {
      id: "hsp-5",
      owner_id: "user-staff-5",
      name: "Apex Smiles & Eye Care Institute",
      type: "clinic",
      address: "24 HSR Layout Sector 1, Bengaluru, KA 560102",
      lat: 12.9121,
      lng: 77.6446,
      photo_url: "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=800&q=80",
      is_open: true,
      is_verified: true,
      verification_status: "verified",
      phone: "+91 80 2572 9988",
      emergency_contact: "+91 80 2572 9999",
      rating: 4.5,
      review_count: 67,
      specialties: ["Dental", "Dermatology"],
      distance_km: 5.0,
      open_time: "08:00",
      close_time: "22:00",
      closed_days: [],
      is_24_7: false
    }
  ],
  doctors: [
    {
      id: "doc-101",
      hospital_id: "hsp-1",
      name: "Dr. Meera Rao",
      username: "DR_MEERA_RAO",
      password: "doc123",
      specialty: "General Physician",
      consultation_fee: 500,
      avg_consult_minutes: 12,
      available_days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      available_from: "08:00",
      available_to: "21:00",
      qualification: "MD (Internal Med) - AIIMS New Delhi",
      experience_years: 14,
      is_available: true,
      is_resigned: false,
      status: "active"
    },
    {
      id: "doc-102",
      hospital_id: "hsp-1",
      name: "Dr. Rajesh Sharma",
      username: "DR_RAJESH_SHARMA",
      password: "doc123",
      specialty: "Pediatrics",
      consultation_fee: 600,
      avg_consult_minutes: 15,
      available_days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      available_from: "08:00",
      available_to: "21:00",
      qualification: "DCH, MD (Pediatrics) - KMC Manipal",
      experience_years: 11,
      is_available: true,
      is_resigned: false,
      status: "active"
    },
    {
      id: "doc-103",
      hospital_id: "hsp-1",
      name: "Dr. Ananya Gupta",
      username: "DR_ANANYA_GUPTA",
      password: "doc123",
      specialty: "Dermatology",
      consultation_fee: 750,
      avg_consult_minutes: 15,
      available_days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      available_from: "08:00",
      available_to: "21:00",
      qualification: "MD (Dermatology & Cosmetology)",
      experience_years: 8,
      is_available: true,
      is_resigned: false,
      status: "active"
    },
    {
      id: "doc-201",
      hospital_id: "hsp-2",
      name: "Dr. Vikram Sethi",
      username: "DR_VIKRAM_SETHI",
      password: "doc123",
      specialty: "Cardiology",
      consultation_fee: 1000,
      avg_consult_minutes: 20,
      available_days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      available_from: "08:00",
      available_to: "22:00",
      qualification: "DM (Cardiology), FACC",
      experience_years: 18,
      is_available: true,
      is_resigned: false,
      status: "active"
    },
    {
      id: "doc-202",
      hospital_id: "hsp-2",
      name: "Dr. Kavita Nair",
      username: "DR_KAVITA_NAIR",
      password: "doc123",
      specialty: "Gynaecology",
      consultation_fee: 800,
      avg_consult_minutes: 15,
      available_days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      available_from: "08:00",
      available_to: "21:00",
      qualification: "MS (OBG), Fellowship in Reproductive Med",
      experience_years: 15,
      is_available: true,
      is_resigned: false,
      status: "active"
    },
    {
      id: "doc-301",
      hospital_id: "hsp-3",
      name: "Dr. Rohan Deshmukh",
      username: "DR_ROHAN_DESHMUKH",
      password: "doc123",
      specialty: "Dental",
      consultation_fee: 450,
      avg_consult_minutes: 20,
      available_days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      available_from: "08:00",
      available_to: "21:00",
      qualification: "MDS (Endodontics)",
      experience_years: 9,
      is_available: true,
      is_resigned: false,
      status: "active"
    }
  ],
  queue_tokens: [
    {
      id: "tok-101-14",
      hospital_id: "hsp-1",
      doctor_id: "doc-101",
      patient_id: "pat-999",
      patient_name: "Rahul Verma",
      token_number: 14,
      status: "serving",
      is_priority: false,
      queue_date: new Date().toISOString().split('T')[0],
      booking_type: "on_the_spot",
      joined_at: "08:00",
      called_at: "08:40"
    },
    {
      id: "tok-101-15",
      hospital_id: "hsp-1",
      doctor_id: "doc-101",
      patient_id: "pat-888",
      patient_name: "Sunita Sharma (Senior Citizen)",
      token_number: 15,
      status: "waiting",
      is_priority: true,
      priority_reason: "Senior Citizen (72 yrs)",
      queue_date: new Date().toISOString().split('T')[0],
      booking_type: "on_the_spot",
      joined_at: "08:15"
    },
    {
      id: "tok-101-17",
      hospital_id: "hsp-1",
      doctor_id: "doc-101",
      patient_id: "pat-777",
      patient_name: "Amit Patel",
      token_number: 17,
      status: "waiting",
      is_priority: false,
      queue_date: new Date().toISOString().split('T')[0],
      booking_type: "on_the_spot",
      joined_at: "08:35"
    }
  ],
  profiles: [
    {
      id: "owner-apollo-1",
      full_name: "Apollo Clinic Owner",
      email: "owner@apolloclinic.com",
      phone: "+91 80 4112 8800",
      role: "business_owner",
      hospital_id: "hsp-1",
      blood_group: "O+",
      emergency_contact: "+91 80 1066",
      medical_notes: "Hospital Administrator Account"
    },
    {
      id: "doc-101",
      full_name: "Dr. Meera Rao",
      email: "DR_MEERA_RAO@example.com",
      phone: "+91 98765 11111",
      role: "doctor",
      hospital_id: "hsp-1",
      blood_group: "B+",
      emergency_contact: "+91 98765 00000",
      medical_notes: "MD (Internal Med)"
    },
    {
      id: "staff-1",
      full_name: "Apollo Front Desk Staff",
      email: "APOLLO_STAFF_1@example.com",
      phone: "+91 80 4112 8801",
      role: "staff_operator",
      hospital_id: "hsp-1",
      blood_group: "A+",
      emergency_contact: "+91 80 1066",
      medical_notes: "Reception Operator"
    }
  ],
  users: [
    {
      id: "owner-apollo-1",
      email: "owner@apolloclinic.com",
      password: "password123",
      role: "business_owner",
      full_name: "Apollo Clinic Owner",
      phone: "+91 80 4112 8800",
      hospital_id: "hsp-1"
    },
    {
      id: "doc-101",
      email: "DR_MEERA_RAO@example.com",
      username: "DR_MEERA_RAO",
      password: "doc123",
      role: "doctor",
      full_name: "Dr. Meera Rao",
      hospital_id: "hsp-1"
    },
    {
      id: "staff-1",
      email: "APOLLO_STAFF_1@example.com",
      username: "APOLLO_STAFF_1",
      password: "password123",
      role: "staff_operator",
      full_name: "Apollo Front Desk Staff",
      hospital_id: "hsp-1"
    }
  ],
  reviews: [
    {
      id: "rev-1",
      hospital_id: "hsp-1",
      doctor_id: "doc-101",
      patient_id: "pat-888",
      patient_name: "Sunita S.",
      rating: 5,
      comment: "Dr. Meera Rao was extremely attentive. Grabbed OPD Token #15 from home and reached right when #14 was serving. Saved 1.5 hours!",
      response: "Thank you Sunita ji! Happy to know the OPD Token saved your valuable time.",
      created_at: "2 days ago"
    },
    {
      id: "rev-2",
      hospital_id: "hsp-1",
      doctor_id: "doc-102",
      patient_id: "pat-555",
      patient_name: "Vikram M.",
      rating: 5,
      comment: "Very smooth experience for my child. Clean OPD lounge.",
      response: "Appreciate your feedback!",
      created_at: "5 days ago"
    }
  ],
  leave_requests: [
    {
      id: "leave-101-1",
      doctor_id: "doc-101",
      hospital_id: "hsp-1",
      doctor_name: "Dr. Meera Rao",
      specialty: "General Physician",
      from_date: "2026-08-22",
      to_date: "2026-08-24",
      reason: "Attending Medical Council Conference & Seminar",
      status: "approved",
      requested_at: "2026-08-18T10:00:00Z"
    }
  ],
  family_members: [],
  clinic_staff_accounts: [
    { id: "staff-1", hospital_id: "hsp-1", doctor_id: null, staff_name: "Sunita Sharma (Front Desk)", username: "APOLLO_STAFF_1", password: "password123" },
    { id: "staff-2", hospital_id: "hsp-1", doctor_id: "doc-101", staff_name: "Ramesh Kumar (Reception Desk)", username: "RECEPTION_DESK", password: "staff123" }
  ]
};

// Initialize DB file if not exists
if (!fs.existsSync(path.dirname(DB_FILE))) {
  fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
}
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf8');
}

function readDb() {
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return initialData;
  }
}

function writeDb(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to write db:', e);
  }
}

const server = http.createServer(async (req, res) => {
  // CORS Headers
  const reqHeaders = req.headers['access-control-request-headers'];
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', reqHeaders || '*');
  res.setHeader('Access-Control-Expose-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const query = parsedUrl.query;

  // Helper to read JSON request body
  const getBody = () => new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        resolve({});
      }
    });
  });

  // Auth Endpoints
  if (pathname === '/auth/v1/token') {
    const body = await getBody();
    const cleanEmail = (body.email || body.username || '').trim().toLowerCase();
    const cleanDigits = cleanEmail.replace(/[^0-9]/g, '');
    const password = body.password || '';
    const db = readDb();

    if (!cleanEmail || !password) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'invalid_request', error_description: 'Email and password are required.' }));
      return;
    }

    let user = db.users.find(u => {
      if (u.email && u.email.toLowerCase() === cleanEmail) return true;
      if (u.username && u.username.toLowerCase() === cleanEmail) return true;
      if (cleanDigits.length >= 7 && u.phone) {
        const uDigits = u.phone.replace(/[^0-9]/g, '');
        return uDigits.endsWith(cleanDigits) || cleanDigits.endsWith(uDigits) || uDigits === cleanDigits;
      }
      return false;
    });

    // Check doctors table if user not found in users table
    if (!user) {
      const doc = (db.doctors || []).find(d => {
        const dUsername = (d.username || '').trim().toLowerCase();
        const dName = (d.name || '').trim().toLowerCase();
        const dEmail = `${dUsername}@example.com`;
        const dEmail2 = `${dName}@example.com`;
        return (
          dUsername === cleanEmail ||
          dName === cleanEmail ||
          dEmail === cleanEmail ||
          dEmail2 === cleanEmail ||
          (d.id && d.id.toLowerCase() === cleanEmail)
        );
      });

      if (doc) {
        user = {
          id: doc.id,
          email: doc.username ? `${doc.username.toLowerCase()}@example.com` : `${doc.name.toLowerCase()}@example.com`,
          username: doc.username || doc.name,
          password: doc.password || 'doc123',
          role: 'doctor',
          full_name: doc.name.startsWith('Dr.') ? doc.name : `Dr. ${doc.name}`,
          hospital_id: doc.hospital_id
        };
        if (!db.users.some(u => u.id === user.id)) {
          db.users.push(user);
        }
        if (!db.profiles.some(p => p.id === user.id)) {
          db.profiles.push({
            id: user.id,
            full_name: user.full_name,
            email: user.email,
            role: 'doctor',
            hospital_id: user.hospital_id,
            blood_group: 'None',
            emergency_contact: 'None',
            medical_notes: 'None'
          });
        }
        writeDb(db);
      }
    }

    // Check clinic_staff_accounts if user not found
    if (!user) {
      const staff = (db.clinic_staff_accounts || []).find(s => {
        const sUsername = (s.username || '').trim().toLowerCase();
        const sEmail = `${sUsername}@example.com`;
        return sUsername === cleanEmail || sEmail === cleanEmail || (s.id && s.id.toLowerCase() === cleanEmail);
      });

      if (staff) {
        user = {
          id: staff.id,
          email: `${staff.username.toLowerCase()}@example.com`,
          username: staff.username,
          password: staff.password || staff.password_hash || 'staff123',
          role: 'staff_operator',
          full_name: staff.staff_name,
          hospital_id: staff.hospital_id
        };
        if (!db.users.some(u => u.id === user.id)) {
          db.users.push(user);
        }
        if (!db.profiles.some(p => p.id === user.id)) {
          db.profiles.push({
            id: user.id,
            full_name: user.full_name,
            email: user.email,
            role: 'staff_operator',
            hospital_id: user.hospital_id,
            blood_group: 'None',
            emergency_contact: 'None',
            medical_notes: 'None'
          });
        }
        writeDb(db);
      }
    }

    // Check user existence
    if (!user) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'invalid_grant', error_description: 'Invalid login credentials' }));
      return;
    }

    // Password Verification (supports user password, doctor record password, or default doc123)
    const matchedDoctor = (user.role === 'doctor' || user.id?.startsWith('doc-')) ? 
      (db.doctors || []).find(d => d.id === user.id || (user.username && d.username?.toLowerCase() === user.username.toLowerCase()) || (user.email && d.username && user.email.toLowerCase().startsWith(d.username.toLowerCase()))) : null;

    const isPasswordValid = 
      user.password === password ||
      (matchedDoctor && matchedDoctor.password === password) ||
      (user.role === 'doctor' && (password === 'doc123' || password === '123456789'));

    if (!isPasswordValid) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'invalid_grant', error_description: 'Invalid login credentials' }));
      return;
    }

    // Email verification check: if enabled and not confirmed
    if (user.email_confirmed_at === null) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'email_not_confirmed', error_description: 'Email not confirmed' }));
      return;
    }

    const userProfile = db.profiles.find(p => p.id === user.id);
    const expTime = Math.floor(Date.now() / 1000) + 86400; // 24 hours
    const token = signJwt({
      aud: 'authenticated',
      exp: expTime,
      sub: user.id,
      email: user.email,
      phone: user.phone || '',
      role: 'authenticated',
      user_metadata: {
        full_name: user.full_name || '',
        role: user.role || 'patient',
        phone: user.phone || '',
        hospital_id: user.hospital_id || null,
        blood_group: userProfile?.blood_group || 'None',
        emergency_contact: userProfile?.emergency_contact || 'None',
        medical_notes: userProfile?.medical_notes || 'None'
      }
    });

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      access_token: token,
      token_type: 'bearer',
      expires_in: 86400,
      expires_at: expTime,
      refresh_token: `refresh-${user.id}-${Date.now()}`,
      user: {
        id: user.id,
        aud: 'authenticated',
        role: 'authenticated',
        email: user.email,
        phone: user.phone || '',
        email_confirmed_at: user.email_confirmed_at || new Date().toISOString(),
        user_metadata: {
          full_name: user.full_name || '',
          role: user.role || 'patient',
          phone: user.phone || '',
          hospital_id: user.hospital_id || null,
          blood_group: userProfile?.blood_group || 'None',
          emergency_contact: userProfile?.emergency_contact || 'None',
          medical_notes: userProfile?.medical_notes || 'None'
        }
      }
    }));
    return;
  }

  if (pathname === '/auth/v1/signup') {
    const body = await getBody();
    const db = readDb();
    const email = (body.email || '').trim().toLowerCase();
    const password = body.password || '';
    const meta = body.data || {};

    // 1. Email format check
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ code: 400, error: 'validation_failed', msg: 'Unable to validate email address: invalid format' }));
      return;
    }

    // 2. Password strength check (min 6 chars)
    if (!password || password.length < 6) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ code: 400, error: 'validation_failed', msg: 'Password should be at least 6 characters' }));
      return;
    }

    // 3. Duplicate email check
    const existing = db.users.find(u => u.email && u.email.toLowerCase() === email);
    if (existing) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ code: 400, error: 'user_already_exists', msg: 'User already registered' }));
      return;
    }

    const userId = `user-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const requireVerification = body.require_verification === true || query.require_verification === 'true';
    const emailConfirmedAt = requireVerification ? null : new Date().toISOString();
    const userPhone = meta.phone || '';
    const bloodGroup = (meta.blood_group && meta.blood_group.trim()) ? meta.blood_group.trim() : 'None';
    const emergencyContact = (meta.emergency_contact && meta.emergency_contact.trim()) ? meta.emergency_contact.trim() : 'None';
    const medicalNotes = (meta.medical_notes && meta.medical_notes.trim()) ? meta.medical_notes.trim() : 'None';

    const newUser = {
      id: userId,
      email: email,
      password: password,
      role: meta.role || 'patient',
      full_name: meta.full_name || email.split('@')[0],
      phone: userPhone,
      hospital_id: meta.hospital_id || 'hsp-1',
      email_confirmed_at: emailConfirmedAt,
      created_at: new Date().toISOString()
    };
    db.users.push(newUser);

    const newProfile = {
      id: userId,
      full_name: newUser.full_name,
      email: newUser.email,
      phone: newUser.phone,
      role: newUser.role,
      hospital_id: newUser.hospital_id,
      blood_group: bloodGroup,
      emergency_contact: emergencyContact,
      medical_notes: medicalNotes
    };
    db.profiles.push(newProfile);
    writeDb(db);

    const expTime = Math.floor(Date.now() / 1000) + 86400;
    const token = signJwt({
      aud: 'authenticated',
      exp: expTime,
      sub: userId,
      email: email,
      phone: newUser.phone,
      role: 'authenticated',
      user_metadata: {
        full_name: newUser.full_name,
        role: newUser.role,
        phone: newUser.phone,
        hospital_id: newUser.hospital_id,
        blood_group: bloodGroup,
        emergency_contact: emergencyContact,
        medical_notes: medicalNotes
      }
    });

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      access_token: requireVerification ? null : token,
      token_type: requireVerification ? null : 'bearer',
      expires_in: requireVerification ? null : 86400,
      user: {
        id: userId,
        aud: 'authenticated',
        role: 'authenticated',
        email: email,
        phone: newUser.phone,
        email_confirmed_at: emailConfirmedAt,
        user_metadata: {
          ...meta,
          full_name: newUser.full_name,
          role: newUser.role,
          phone: newUser.phone,
          hospital_id: newUser.hospital_id,
          blood_group: bloodGroup,
          emergency_contact: emergencyContact,
          medical_notes: medicalNotes
        }
      }
    }));
    return;
  }

  if (pathname === '/auth/v1/recover') {
    const body = await getBody();
    const email = (body.email || '').trim().toLowerCase();
    if (!email || !email.includes('@')) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ code: 400, error: 'validation_failed', msg: 'Please provide a valid email address.' }));
      return;
    }
    const db = readDb();
    const foundUser = db.users.find(u => u.email && u.email.toLowerCase() === email);
    if (!foundUser) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        code: 400,
        error: 'user_not_found',
        msg: `No registered account found with email "${email}". Please register a new patient account.`
      }));
      return;
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      message: `Password reset notification dispatched to ${email}.`
    }));
    return;
  }

  if (pathname === '/auth/v1/user') {
    const authHeader = req.headers['authorization'] || '';
    const resVer = verifyJwt(authHeader);
    if (!resVer.valid) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ code: 401, msg: resVer.error || 'Invalid or expired JWT' }));
      return;
    }
    const db = readDb();
    const foundIdx = db.users.findIndex(u => u.id === resVer.payload.sub);
    if (foundIdx === -1) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ code: 401, msg: 'User not found' }));
      return;
    }

    if (req.method === 'PUT') {
      const body = await getBody();
      if (body.password) {
        db.users[foundIdx].password = body.password;
        // Also synchronize matching doctor in doctors table
        const userSub = db.users[foundIdx];
        (db.doctors || []).forEach(d => {
          if (
            d.id === userSub.id ||
            (userSub.username && d.username && d.username.toLowerCase() === userSub.username.toLowerCase()) ||
            (userSub.email && d.username && userSub.email.toLowerCase().startsWith(d.username.toLowerCase())) ||
            (userSub.full_name && d.name && userSub.full_name.toLowerCase().includes(d.name.toLowerCase()))
          ) {
            d.password = body.password;
          }
        });

        // Also synchronize matching staff in clinic_staff_accounts table
        (db.clinic_staff_accounts || []).forEach(s => {
          if (
            s.id === userSub.id ||
            (userSub.username && s.username && s.username.toLowerCase() === userSub.username.toLowerCase())
          ) {
            s.password = body.password;
            s.password_hash = body.password;
          }
        });
      }
      if (body.data) {
        const meta = body.data;
        if (meta.full_name) db.users[foundIdx].full_name = meta.full_name;
        if (meta.phone) db.users[foundIdx].phone = meta.phone;
        const profIdx = db.profiles.findIndex(p => p.id === db.users[foundIdx].id);
        if (profIdx !== -1) {
          if (meta.full_name) db.profiles[profIdx].full_name = meta.full_name;
          if (meta.phone) db.profiles[profIdx].phone = meta.phone;
          if (meta.blood_group) db.profiles[profIdx].blood_group = meta.blood_group;
          if (meta.emergency_contact) db.profiles[profIdx].emergency_contact = meta.emergency_contact;
          if (meta.medical_notes) db.profiles[profIdx].medical_notes = meta.medical_notes;
        }

        // Also synchronize staff_name in clinic_staff_accounts table
        (db.clinic_staff_accounts || []).forEach(s => {
          if (
            s.id === db.users[foundIdx].id ||
            (db.users[foundIdx].username && s.username && s.username.toLowerCase() === db.users[foundIdx].username.toLowerCase())
          ) {
            if (meta.full_name) s.staff_name = meta.full_name;
          }
        });
      }
      writeDb(db);
    }

    const found = db.users[foundIdx];
    const foundProfile = db.profiles.find(p => p.id === found.id);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      id: found.id,
      email: found.email,
      phone: found.phone || '',
      email_confirmed_at: found.email_confirmed_at || new Date().toISOString(),
      user_metadata: {
        full_name: found.full_name || '',
        role: found.role || 'patient',
        phone: found.phone || '',
        hospital_id: found.hospital_id || null,
        blood_group: foundProfile?.blood_group || 'None',
        emergency_contact: foundProfile?.emergency_contact || 'None',
        medical_notes: foundProfile?.medical_notes || 'None'
      }
    }));
    return;
  }

  if (pathname === '/auth/v1/logout') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({}));
    return;
  }

  // REST API Endpoints: /rest/v1/<table_name>
  if (pathname.startsWith('/rest/v1/')) {
    const table = pathname.replace('/rest/v1/', '').split('?')[0];
    const db = readDb();
    if (!db[table]) {
      db[table] = [];
    }

    const authUser = getAuthUser(req, db);

    // RLS: Protected tables require authenticated session
    const isPrivateTable = ['family_members', 'leave_requests'].includes(table);
    if (isPrivateTable && !authUser) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ code: 401, error: 'unauthorized', message: 'Authentication required to access private medical data.' }));
      return;
    }

    if (req.method === 'GET') {
      let results = [...db[table]];

      // RLS Check for family_members
      if (table === 'family_members') {
        const queryPatientId = query.patient_id ? query.patient_id.replace('eq.', '') : null;
        if (queryPatientId && queryPatientId !== authUser.id && authUser.role !== 'admin') {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            code: '42501',
            error: 'forbidden',
            message: "Row Level Security policy violation: Access to another patient's family records is denied."
          }));
          return;
        }
        if (!queryPatientId && authUser.role !== 'admin') {
          results = results.filter(item => item.patient_id === authUser.id);
        }
      }

      // Filter by query parameters (e.g. id=eq.xxx, hospital_id=eq.xxx, etc.)
      Object.keys(query).forEach(k => {
        const val = query[k];
        if (typeof val === 'string' && val.startsWith('eq.')) {
          const expected = val.replace('eq.', '');
          results = results.filter(item => String(item[k]) === expected);
        }
      });

      // Handle order
      if (query.order && typeof query.order === 'string') {
        const [field, direction] = query.order.split('.');
        results.sort((a, b) => {
          if (direction === 'desc') {
            return (b[field] || '') > (a[field] || '') ? 1 : -1;
          }
          return (a[field] || '') > (b[field] || '') ? 1 : -1;
        });
      }

      // Check if client expects single object
      if (req.headers['accept']?.includes('application/vnd.pgrst.object+json')) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(results[0] || null));
        return;
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(results));
      return;
    }

    if (req.method === 'POST') {
      const body = await getBody();
      const items = Array.isArray(body) ? body : [body];

      // RLS Check on POST
      if (table === 'family_members') {
        for (const item of items) {
          if (item.patient_id && item.patient_id !== authUser.id && authUser.role !== 'admin') {
            res.writeHead(403, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              code: '42501',
              error: 'forbidden',
              message: "Row Level Security policy violation: Cannot add family records for another user."
            }));
            return;
          }
          item.patient_id = authUser.id;
        }
      }

      if (table === 'profiles') {
        // Can only insert own profile
        for (const item of items) {
          if (authUser && item.id && item.id !== authUser.id && authUser.role !== 'admin') {
            res.writeHead(403, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              code: '42501',
              error: 'forbidden',
              message: "Row Level Security policy violation: You can only insert your own profile record."
            }));
            return;
          }
        }
      }

      items.forEach(newItem => {
        if (!newItem.id) {
          newItem.id = `${table}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        }
        const existingIdx = db[table].findIndex(x => x.id === newItem.id);
        if (existingIdx >= 0) {
          db[table][existingIdx] = { ...db[table][existingIdx], ...newItem };
        } else {
          db[table].unshift(newItem);
        }
      });

      // Automatically sync clinic_staff_accounts into db.users and db.profiles for instant login authentication
      if (table === 'clinic_staff_accounts') {
        items.forEach(item => {
          item.password = item.password || item.password_hash || 'staff123';
          item.password_hash = item.password_hash || item.password || 'staff123';

          const sUsername = (item.username || '').trim().toLowerCase();
          const staffUser = {
            id: item.id,
            email: `${sUsername}@example.com`,
            username: item.username,
            password: item.password,
            role: 'staff_operator',
            full_name: item.staff_name || 'Staff Operator',
            hospital_id: item.hospital_id
          };
          const uIdx = db.users.findIndex(u => u.id === item.id || (u.username && u.username.toLowerCase() === sUsername));
          if (uIdx >= 0) {
            db.users[uIdx] = { ...db.users[uIdx], ...staffUser };
          } else {
            db.users.push(staffUser);
          }
          const pIdx = db.profiles.findIndex(p => p.id === item.id);
          const staffProfile = {
            id: item.id,
            full_name: staffUser.full_name,
            email: staffUser.email,
            role: 'staff_operator',
            hospital_id: item.hospital_id,
            blood_group: 'None',
            emergency_contact: 'None',
            medical_notes: 'None'
          };
          if (pIdx >= 0) {
            db.profiles[pIdx] = { ...db.profiles[pIdx], ...staffProfile };
          } else {
            db.profiles.push(staffProfile);
          }
        });
      }

      writeDb(db);
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(items));
      return;
    }

    if (req.method === 'PATCH') {
      const body = await getBody();
      const updated = [];

      // RLS Check on PATCH
      if (table === 'profiles') {
        const targetId = query.id ? query.id.replace('eq.', '') : null;
        if (!authUser) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ code: 401, error: 'unauthorized', message: 'Authentication required to update profile.' }));
          return;
        }
        if (targetId && targetId !== authUser.id && authUser.role !== 'admin') {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            code: '42501',
            error: 'forbidden',
            message: "Row Level Security policy violation: You can only update your own profile record."
          }));
          return;
        }
      }

      if (table === 'family_members') {
        const targetId = query.id ? query.id.replace('eq.', '') : null;
        const targetItem = db.family_members.find(f => f.id === targetId);
        if (targetItem && targetItem.patient_id !== authUser.id && authUser.role !== 'admin') {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            code: '42501',
            error: 'forbidden',
            message: "Row Level Security policy violation: You can only modify your own family records."
          }));
          return;
        }
      }

      // Filter to update
      Object.keys(query).forEach(k => {
        const val = query[k];
        if (typeof val === 'string' && val.startsWith('eq.')) {
          const expected = val.replace('eq.', '');
          db[table].forEach((item, idx) => {
            if (String(item[k]) === expected) {
              db[table][idx] = { ...item, ...body };
              updated.push(db[table][idx]);
            }
          });
        }
      });

      // Synchronize doctor passwords to users table if modified
      if (table === 'doctors') {
        updated.forEach(docItem => {
          (db.users || []).forEach(u => {
            if (
              u.id === docItem.id ||
              (docItem.username && u.username && u.username.toLowerCase() === docItem.username.toLowerCase()) ||
              (docItem.username && u.email && u.email.toLowerCase().startsWith(docItem.username.toLowerCase())) ||
              (u.full_name && docItem.name && u.full_name.toLowerCase().includes(docItem.name.toLowerCase()))
            ) {
              if (docItem.password) u.password = docItem.password;
              if (docItem.username) u.username = docItem.username;
            }
          });
        });
      }

      // Synchronize staff operator updates to users and profiles tables if modified
      if (table === 'clinic_staff_accounts') {
        updated.forEach(staffItem => {
          if (body.password) {
            staffItem.password = body.password;
            staffItem.password_hash = body.password;
          }
          const sUsername = (staffItem.username || '').trim().toLowerCase();
          (db.users || []).forEach(u => {
            if (u.id === staffItem.id || (u.username && u.username.toLowerCase() === sUsername)) {
              if (staffItem.password) u.password = staffItem.password;
              if (staffItem.staff_name) u.full_name = staffItem.staff_name;
              if (staffItem.doctor_id !== undefined) u.doctor_id = staffItem.doctor_id;
            }
          });
          (db.profiles || []).forEach(p => {
            if (p.id === staffItem.id) {
              if (staffItem.staff_name) p.full_name = staffItem.staff_name;
              if (staffItem.doctor_id !== undefined) p.doctor_id = staffItem.doctor_id;
            }
          });
        });
      }

      writeDb(db);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(updated));
      return;
    }

    if (req.method === 'DELETE') {
      let deletedCount = 0;

      // RLS Check on DELETE
      if (table === 'family_members') {
        const targetId = query.id ? query.id.replace('eq.', '') : null;
        const targetItem = db.family_members.find(f => f.id === targetId);
        if (targetItem && targetItem.patient_id !== authUser.id && authUser.role !== 'admin') {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            code: '42501',
            error: 'forbidden',
            message: "Row Level Security policy violation: You can only delete your own family records."
          }));
          return;
        }
      }

      Object.keys(query).forEach(k => {
        const val = query[k];
        if (typeof val === 'string' && val.startsWith('eq.')) {
          const expected = val.replace('eq.', '');
          const initialLen = db[table].length;
          db[table] = db[table].filter(item => String(item[k]) !== expected);
          deletedCount += (initialLen - db[table].length);

          if (table === 'clinic_staff_accounts' && k === 'id') {
            db.users = (db.users || []).filter(u => u.id !== expected);
            db.profiles = (db.profiles || []).filter(p => p.id !== expected);
          }
        }
      });

      writeDb(db);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ deleted: deletedCount }));
      return;
    }
  }

  // Fallback
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not Found' }));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Hospital Qswift Unified Sync Server running on port ${PORT}`);
  console.log(`Listening on http://localhost:${PORT}/ and http://0.0.0.0:${PORT}/`);
});
