import React, { createContext, useContext, useState, useEffect } from 'react';
import { MOCK_HOSPITALS, MOCK_DOCTORS, MOCK_QUEUE_TOKENS, MOCK_REVIEWS, MOCK_LEAVE_REQUESTS } from '../data/mockData';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const QueueContext = createContext();

// Safe async database executor for Supabase PostgrestBuilder (avoids .catch is not a function TypeError)
const safeDbOp = async (queryPromise) => {
  try {
    const res = await queryPromise;
    if (res?.error) {
      console.warn('Supabase DB Op warning:', res.error.message);
    }
    return res?.data;
  } catch (err) {
    console.warn('Supabase DB Op caught error:', err);
  }
};

/**
 * Format 24hr time (e.g. '08:00', '20:00') to 12hr AM/PM (e.g. '08:00 AM', '08:00 PM')
 */
export const formatTimeAMPM = (time24) => {
  if (!time24) return '08:00 AM';
  const [hStr, mStr] = time24.split(':');
  let h = parseInt(hStr, 10);
  if (isNaN(h)) return time24;
  const m = mStr || '00';
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  const formattedH = String(h).padStart(2, '0');
  return `${formattedH}:${m} ${ampm}`;
};

export function QueueProvider({ children }) {
  // Load initial state from LocalStorage if present, else fallback to seed mock data
  const [hospitals, setHospitals] = useState(() => {
    try {
      const saved = localStorage.getItem('hqswift_hospitals');
      if (saved) {
        const parsed = JSON.parse(saved);
        const mapped = parsed.map(h => {
          const defaultMatch = MOCK_HOSPITALS.find(m => m.id === h.id) || {};
          return {
            ...defaultMatch,
            ...h,
            is_open: true,
            closed_days: Array.isArray(h.closed_days) && h.closed_days.length > 0 ? h.closed_days : (defaultMatch.closed_days || [])
          };
        });
        // Always include newly registered hospitals from MOCK_HOSPITALS (like health is wealth)
        const missing = MOCK_HOSPITALS.filter(m => !mapped.some(h => h.id === m.id));
        return [...missing, ...mapped];
      }
      return MOCK_HOSPITALS;
    } catch (e) {
      return MOCK_HOSPITALS;
    }
  });

  const [doctors, setDoctors] = useState(() => {
    try {
      const saved = localStorage.getItem('hqswift_doctors');
      if (saved) {
        const parsed = JSON.parse(saved);
        const missing = MOCK_DOCTORS.filter(m => !parsed.some(d => d.id === m.id));
        return [...missing, ...parsed];
      }
      return MOCK_DOCTORS;
    } catch (e) {
      return MOCK_DOCTORS;
    }
  });

  const [tokens, setTokens] = useState(() => {
    try {
      const saved = localStorage.getItem('hqswift_tokens');
      if (saved) {
        const parsed = JSON.parse(saved);
        const missing = MOCK_QUEUE_TOKENS.filter(m => !parsed.some(t => t.id === m.id));
        return [...missing, ...parsed].filter(t => t.patient_id !== 'user-patient-demo');
      }
      return MOCK_QUEUE_TOKENS.filter(t => t.patient_id !== 'user-patient-demo');
    } catch (e) {
      return MOCK_QUEUE_TOKENS.filter(t => t.patient_id !== 'user-patient-demo');
    }
  });

  const [reviews, setReviews] = useState(() => {
    try {
      const saved = localStorage.getItem('hqswift_reviews');
      if (saved) {
        const parsed = JSON.parse(saved);
        const missing = MOCK_REVIEWS.filter(m => !parsed.some(r => r.id === m.id));
        return [...missing, ...parsed];
      }
      return MOCK_REVIEWS;
    } catch (e) {
      return MOCK_REVIEWS;
    }
  });

  const [leaveRequests, setLeaveRequests] = useState(() => {
    try {
      const saved = localStorage.getItem('hqswift_leave_requests');
      return saved ? JSON.parse(saved) : MOCK_LEAVE_REQUESTS;
    } catch (e) {
      return MOCK_LEAVE_REQUESTS;
    }
  });

  // Sync to LocalStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('hqswift_hospitals', JSON.stringify(hospitals));
  }, [hospitals]);

  useEffect(() => {
    localStorage.setItem('hqswift_doctors', JSON.stringify(doctors));
  }, [doctors]);

  useEffect(() => {
    localStorage.setItem('hqswift_leave_requests', JSON.stringify(leaveRequests));
  }, [leaveRequests]);


  useEffect(() => {
    localStorage.setItem('hqswift_doctors', JSON.stringify(doctors));
  }, [doctors]);

  useEffect(() => {
    localStorage.setItem('hqswift_tokens', JSON.stringify(tokens));
  }, [tokens]);

  useEffect(() => {
    localStorage.setItem('hqswift_reviews', JSON.stringify(reviews));
  }, [reviews]);

  // Audio effect for notification sound when token is called
  const playAlertSound = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5 note
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.3); // A5 chime
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
      console.warn('Audio alert playback error:', e);
    }
  };

  // Realtime subscription setup if Supabase is configured
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    const tokenChannel = supabase
      .channel('public:queue_tokens')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'queue_tokens' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setTokens(prev => [payload.new, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setTokens(prev =>
              prev.map(tok => (tok.id === payload.new.id ? payload.new : tok))
            );
            if (payload.new.status === 'serving') {
              playAlertSound();
            }
          } else if (payload.eventType === 'DELETE') {
            setTokens(prev => prev.filter(tok => tok.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    const doctorChannel = supabase
      .channel('public:doctors')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'doctors' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setDoctors(prev => [...prev, payload.new]);
          } else if (payload.eventType === 'UPDATE') {
            setDoctors(prev =>
              prev.map(doc => (doc.id === payload.new.id ? payload.new : doc))
            );
          } else if (payload.eventType === 'DELETE') {
            setDoctors(prev => prev.filter(doc => doc.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    const hospitalChannel = supabase
      .channel('public:hospitals')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'hospitals' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setHospitals(prev => [payload.new, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setHospitals(prev =>
              prev.map(h => (h.id === payload.new.id ? payload.new : h))
            );
          } else if (payload.eventType === 'DELETE') {
            setHospitals(prev => prev.filter(h => h.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    const reviewChannel = supabase
      .channel('public:reviews')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reviews' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setReviews(prev => [payload.new, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setReviews(prev =>
              prev.map(r => (r.id === payload.new.id ? payload.new : r))
            );
          } else if (payload.eventType === 'DELETE') {
            setReviews(prev => prev.filter(r => r.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      if (tokenChannel) supabase.removeChannel(tokenChannel);
      if (doctorChannel) supabase.removeChannel(doctorChannel);
      if (hospitalChannel) supabase.removeChannel(hospitalChannel);
      if (reviewChannel) supabase.removeChannel(reviewChannel);
    };
  }, []);

  // Initial fetch from Supabase database tables if configured
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    async function loadSupabaseData() {
      try {
        const { data: dbHospitals } = await supabase.from('hospitals').select('*');
        if (dbHospitals && dbHospitals.length > 0) setHospitals(dbHospitals);

        const { data: dbDoctors } = await supabase.from('doctors').select('*');
        if (dbDoctors && dbDoctors.length > 0) setDoctors(dbDoctors);

        const { data: dbTokens } = await supabase.from('queue_tokens').select('*').order('joined_at', { ascending: false });
        if (dbTokens && dbTokens.length > 0) setTokens(dbTokens);

        const { data: dbReviews } = await supabase.from('reviews').select('*').order('created_at', { ascending: false });
        if (dbReviews && dbReviews.length > 0) setReviews(dbReviews);

        const { data: dbLeaves } = await supabase.from('leave_requests').select('*').order('requested_at', { ascending: false });
        if (dbLeaves && dbLeaves.length > 0) setLeaveRequests(dbLeaves);
      } catch (err) {
        console.warn('Initial Supabase fetch warning:', err);
      }
    }

    loadSupabaseData();
    const pollInterval = setInterval(loadSupabaseData, 2500);
    return () => clearInterval(pollInterval);
  }, []);

  /**
   * Helper: Get current serving token number for a doctor
   */
  const getDoctorServingToken = (doctorId) => {
    const servingToken = tokens.find(
      t => t.doctor_id === doctorId && t.status === 'serving'
    );
    return servingToken ? servingToken.token_number : null;
  };

  /**
   * Helper: Get queue length & estimated wait time for a doctor
   */
  const getDoctorQueueStats = (doctorId) => {
    const doctor = doctors.find(d => d.id === doctorId);
    const avgMins = doctor ? doctor.avg_consult_minutes || 15 : 15;

    const waitingTokens = tokens.filter(
      t => t.doctor_id === doctorId && (t.status === 'waiting' || t.status === 'serving')
    );
    
    const servingToken = tokens.find(
      t => t.doctor_id === doctorId && t.status === 'serving'
    );

    const nowServingNum = servingToken ? servingToken.token_number : (waitingTokens[0]?.token_number || 0);

    return {
      waitingCount: tokens.filter(t => t.doctor_id === doctorId && t.status === 'waiting').length,
      servingTokenNumber: nowServingNum,
      estimatedWaitMins: tokens.filter(t => t.doctor_id === doctorId && t.status === 'waiting').length * avgMins,
      avgConsultMins: avgMins
    };
  };

  /**
   * Issue a new OPD Token for a patient / family member
   */
  const issueToken = ({
    hospitalId,
    doctorId,
    patientId,
    patientName,
    familyMemberId,
    isPriority = false,
    priorityReason = '',
    bookingDate = null,
    bookingType = 'on_the_spot'
  }) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const targetDate = bookingDate || todayStr;
    const doctorTokens = tokens.filter(t => t.doctor_id === doctorId && (t.queue_date === targetDate || (!t.queue_date && targetDate === todayStr)));
    const maxNum = doctorTokens.reduce((max, t) => (t.token_number > max ? t.token_number : max), 0);
    const nextTokenNum = maxNum > 0 ? maxNum + 1 : 1;

    const newToken = {
      id: `tok-${Date.now()}`,
      hospital_id: hospitalId,
      doctor_id: doctorId,
      patient_id: patientId,
      family_member_id: familyMemberId || null,
      patient_name: patientName || 'Patient',
      token_number: nextTokenNum,
      status: 'waiting',
      is_priority: isPriority,
      priority_reason: priorityReason,
      queue_date: targetDate,
      booking_type: targetDate === todayStr ? 'on_the_spot' : 'scheduled',
      joined_at: new Date().toISOString(),
    };

    setTokens(prev => [newToken, ...prev]);

    if (isSupabaseConfigured && supabase) {
      safeDbOp(supabase.from('queue_tokens').insert([newToken]));
    }

    return newToken;
  };


  /**
   * Call Next Token for a Doctor in Staff Dashboard
   */
  const callNextToken = (doctorId, queueDate = null) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const targetDate = queueDate || todayStr;
    const waitingTokens = tokens
      .filter(t => t.doctor_id === doctorId && t.status === 'waiting' && (t.queue_date === targetDate || (!t.queue_date && targetDate === todayStr)))
      .sort((a, b) => {
        if (a.is_priority && !b.is_priority) return -1;
        if (!a.is_priority && b.is_priority) return 1;
        return a.token_number - b.token_number;
      });

    if (waitingTokens.length === 0) return null;

    const currentlyServingToken = tokens.find(t => t.doctor_id === doctorId && t.status === 'serving');

    const updatedTokens = tokens.map(t => {
      if (t.doctor_id === doctorId && t.status === 'serving') {
        return { ...t, status: 'done', completed_at: new Date().toISOString() };
      }
      return t;
    });

    const nextToken = waitingTokens[0];
    const finalTokens = updatedTokens.map(t => {
      if (t.id === nextToken.id) {
        return { ...t, status: 'serving', called_at: new Date().toISOString() };
      }
      return t;
    });

    setTokens(finalTokens);
    playAlertSound();

    if (isSupabaseConfigured && supabase) {
      if (currentlyServingToken) {
        safeDbOp(supabase.from('queue_tokens').update({ status: 'done', completed_at: new Date().toISOString() }).eq('id', currentlyServingToken.id));
      }
      safeDbOp(supabase.from('queue_tokens').update({ status: 'serving', called_at: new Date().toISOString() }).eq('id', nextToken.id));
    }

    return nextToken;
  };

  /**
   * Update token status (done, cancelled, no_show)
   */
  const updateTokenStatus = (tokenId, newStatus) => {
    setTokens(prev =>
      prev.map(t => {
        if (t.id === tokenId) {
          const updated = { ...t, status: newStatus };
          if (newStatus === 'done') updated.completed_at = new Date().toISOString();
          return updated;
        }
        return t;
      })
    );

    if (isSupabaseConfigured && supabase) {
      safeDbOp(supabase.from('queue_tokens').update({ status: newStatus }).eq('id', tokenId));
    }
  };

  /**
   * Toggle Priority flag (Senior Citizen / Emergency) for a token
   */
  const toggleTokenPriority = (tokenId, reason = 'Senior Citizen / Priority') => {
    setTokens(prev =>
      prev.map(t => {
        if (t.id === tokenId) {
          return {
            ...t,
            is_priority: !t.is_priority,
            priority_reason: !t.is_priority ? reason : ''
          };
        }
        return t;
      })
    );

    if (isSupabaseConfigured && supabase) {
      const currentToken = tokens.find(t => t.id === tokenId);
      if (currentToken) {
        safeDbOp(supabase.from('queue_tokens').update({
          is_priority: !currentToken.is_priority,
          priority_reason: !currentToken.is_priority ? reason : ''
        }).eq('id', tokenId));
      }
    }
  };

  /**
   * Register a new hospital (Staff Onboarding)
   */
  const addHospital = (hospitalData, doctorsData = []) => {
    const newHospitalId = `hsp-${Date.now()}`;
    const newHospital = {
      id: newHospitalId,
      rating: 5.0,
      review_count: 0,
      is_open: true,
      ...hospitalData
    };

    setHospitals(prev => [newHospital, ...prev]);

    const createdDoctors = doctorsData.map((doc, idx) => ({
      id: `doc-${Date.now()}-${idx}`,
      hospital_id: newHospitalId,
      is_available: true,
      avg_consult_minutes: doc.avg_consult_minutes || 15,
      available_days: doc.available_days || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      ...doc
    }));

    if (isSupabaseConfigured && supabase) {
      safeDbOp(supabase.from('hospitals').insert([newHospital]));
      if (createdDoctors.length > 0) {
        safeDbOp(supabase.from('doctors').insert(createdDoctors));
      }
    }

    return newHospital;
  };

  /**
   * Update Hospital Facility Profile & OPD Schedule Settings
   */
  const updateHospitalProfile = (hospitalId, profileData) => {
    setHospitals(prev =>
      prev.map(h => (h.id === hospitalId ? { ...h, ...profileData } : h))
    );

    if (isSupabaseConfigured && supabase) {
      safeDbOp(supabase.from('hospitals').update(profileData).eq('id', hospitalId));
    }
  };

  /**
   * Soft-delete hospital facility (hidden from public discovery & regular owners, archived for master website owner)
   */
  const deleteHospital = (hospitalId) => {
    const deletedDate = new Date().toISOString().split('T')[0];
    setHospitals(prev =>
      prev.map(h => (h.id === hospitalId ? { ...h, is_deleted: true, deleted_at: deletedDate } : h))
    );

    if (isSupabaseConfigured && supabase) {
      safeDbOp(supabase.from('hospitals').update({ is_deleted: true, deleted_at: deletedDate }).eq('id', hospitalId));
    }
  };

  /**
   * Restore a soft-deleted hospital facility (Master Website Owner only)
   */
  const restoreHospital = (hospitalId) => {
    setHospitals(prev =>
      prev.map(h => (h.id === hospitalId ? { ...h, is_deleted: false, deleted_at: null } : h))
    );

    if (isSupabaseConfigured && supabase) {
      safeDbOp(supabase.from('hospitals').update({ is_deleted: false, deleted_at: null }).eq('id', hospitalId));
    }
  };

  /**
   * Check if hospital is closed on a given date (e.g. YYYY-MM-DD)
   */
  const isHospitalClosedOnDate = (hospital, dateStr) => {
    if (!hospital) return false;
    if (hospital.is_open === false) return true;
    if (!dateStr) return false;

    // 1. Date Range Closure check (e.g. closed_from to closed_to)
    if (hospital.closed_from && hospital.closed_to) {
      if (dateStr >= hospital.closed_from && dateStr <= hospital.closed_to) {
        return true;
      }
    }

    // 2. Weekly Closed Days check (e.g. Sun, Thu)
    const dateObj = new Date(dateStr + 'T00:00:00');
    const dayMap = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayAbbr = dayMap[dateObj.getDay()];

    const closedDays = Array.isArray(hospital.closed_days) ? hospital.closed_days : [];
    return closedDays.includes(dayAbbr);
  };

  /**
   * Real-time check if hospital facility is OPEN right now (or on a target date)
   */
  const isHospitalCurrentlyOpen = (hospital, targetDateStr = null) => {
    if (!hospital) return false;
    if (hospital.is_open === false) return false;

    const now = new Date();
    const dateObj = targetDateStr ? new Date(targetDateStr + 'T00:00:00') : now;
    const dayMap = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayAbbr = dayMap[dateObj.getDay()];

    // 1. Weekly Closed Days check
    const closedDays = Array.isArray(hospital.closed_days) ? hospital.closed_days : [];
    if (closedDays.includes(dayAbbr)) {
      return false;
    }

    // 2. Date Range Closure check
    const dateFormatted = targetDateStr || dateObj.toISOString().split('T')[0];
    if (hospital.closed_from && hospital.closed_to) {
      if (dateFormatted >= hospital.closed_from && dateFormatted <= hospital.closed_to) {
        return false;
      }
    }

    // 3. Daily Operating Hours check
    if (!targetDateStr) {
      const openTime = hospital.open_time || '08:00';
      const closeTime = hospital.close_time || '22:00';
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMinutes = String(now.getMinutes()).padStart(2, '0');
      const currentTimeStr = `${currentHours}:${currentMinutes}`;

      if (hospital.is_24_7) return true;

      if (currentTimeStr < openTime || currentTimeStr > closeTime) {
        return false;
      }
    }

    return true;
  };

  /**
   * Add new Doctor to roster with credentials
   */
  const addDoctor = (docData) => {
    const cleanName = (docData.name || 'Doctor').replace(/^(Dr\.\s*)/i, '').trim();
    const formattedUsername = docData.username || `DR_${cleanName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`;

    const newDoc = {
      id: `doc-${Date.now()}`,
      is_available: true,
      username: formattedUsername,
      password: docData.password || 'doc123',
      ...docData
    };
    setDoctors(prev => [...prev, newDoc]);

    if (isSupabaseConfigured && supabase) {
      safeDbOp(supabase.from('doctors').insert([newDoc]));
    }
    return newDoc;
  };

  /**
   * Update credentials (username & password) for a doctor
   */
  const updateDoctorCredentials = async (doctorId, username, password) => {
    const cleanUser = (username || '').trim();
    const cleanPass = (password || '').trim();

    setDoctors(prev =>
      prev.map(d => (d.id === doctorId ? { ...d, username: cleanUser, password: cleanPass } : d))
    );

    if (isSupabaseConfigured && supabase) {
      await safeDbOp(supabase.from('doctors').update({ username: cleanUser, password: cleanPass }).eq('id', doctorId));
      try {
        await supabase.auth.updateUser({ password: cleanPass });
      } catch (e) {
        // Ignorable if user is authenticated via custom header or doctor token
      }
    }
    return true;
  };

  /**
   * Submit patient review
   */
  const addReview = (reviewData) => {
    const newRev = {
      id: `rev-${Date.now()}`,
      created_at: 'Just now',
      ...reviewData
    };

    setReviews(prevReviews => {
      const updatedReviews = [newRev, ...prevReviews];

      // Dynamically calculate and update hospital aggregate rating & total review count
      if (reviewData.hospital_id) {
        setHospitals(prevHospitals =>
          prevHospitals.map(h => {
            if (h.id === reviewData.hospital_id) {
              const hReviews = updatedReviews.filter(r => r.hospital_id === h.id);
              const totalRating = hReviews.reduce((sum, r) => sum + Number(r.rating || 5), 0);
              const avgRating = hReviews.length > 0 ? parseFloat((totalRating / hReviews.length).toFixed(1)) : h.rating;
              return {
                ...h,
                rating: avgRating,
                review_count: hReviews.length
              };
            }
            return h;
          })
        );
      }

      return updatedReviews;
    });

    if (isSupabaseConfigured && supabase) {
      safeDbOp(supabase.from('reviews').insert([newRev]));
    }
  };

  /**
   * Respond to patient review (staff console)
   */
  const respondToReview = (reviewId, responseText) => {
    setReviews(prev =>
      prev.map(r => (r.id === reviewId ? { ...r, response: responseText } : r))
    );

    if (isSupabaseConfigured && supabase) {
      safeDbOp(supabase.from('reviews').update({ response: responseText }).eq('id', reviewId));
    }
  };

  /**
   * Doctor Availability, Resignation & Leave Request Management
   */
  const toggleDoctorAvailability = (doctorId, isAvailable) => {
    setDoctors(prev => prev.map(d => d.id === doctorId ? { ...d, is_available: isAvailable } : d));
    if (isSupabaseConfigured && supabase) {
      safeDbOp(supabase.from('doctors').update({ is_available: isAvailable }).eq('id', doctorId));
    }
  };

  const toggleDoctorResignation = (doctorId, isResigned) => {
    setDoctors(prev =>
      prev.map(d =>
        d.id === doctorId
          ? {
              ...d,
              is_resigned: isResigned,
              status: isResigned ? 'resigned' : 'active',
              is_available: isResigned ? false : d.is_available
            }
          : d
      )
    );
    if (isSupabaseConfigured && supabase) {
      safeDbOp(supabase.from('doctors').update({
        is_resigned: isResigned,
        status: isResigned ? 'resigned' : 'active',
        is_available: isResigned ? false : true
      }).eq('id', doctorId));
    }
  };


  const requestDoctorLeave = ({ doctorId, hospitalId, doctorName, specialty, fromDate, toDate, reason }) => {
    const newRequest = {
      id: `leave-${Date.now()}`,
      doctor_id: doctorId,
      hospital_id: hospitalId,
      doctor_name: doctorName,
      specialty: specialty,
      from_date: fromDate,
      to_date: toDate,
      reason: reason || 'Personal Leave',
      status: 'pending',
      requested_at: new Date().toISOString()
    };
    setLeaveRequests(prev => [newRequest, ...prev]);

    if (isSupabaseConfigured && supabase) {
      safeDbOp(supabase.from('leave_requests').insert([newRequest]));
    }
    return newRequest;
  };

  const updateLeaveStatus = (requestId, status) => {
    setLeaveRequests(prev => prev.map(l => l.id === requestId ? { ...l, status } : l));
    if (isSupabaseConfigured && supabase) {
      safeDbOp(supabase.from('leave_requests').update({ status }).eq('id', requestId));
    }
  };

  const isDoctorOnLeave = (doctorId, dateStr) => {
    if (!doctorId || !dateStr) return false;
    return leaveRequests.some(l => 
      l.doctor_id === doctorId && 
      l.status === 'approved' && 
      dateStr >= l.from_date && 
      dateStr <= l.to_date
    );
  };

  const getDoctorLeaveDetails = (doctorId, dateStr) => {
    if (!doctorId || !dateStr) return null;
    return leaveRequests.find(l => 
      l.doctor_id === doctorId && 
      l.status === 'approved' && 
      dateStr >= l.from_date && 
      dateStr <= l.to_date
    );
  };

  /**
   * Reset data back to initial seed data
   */
  const resetSampleData = () => {
    localStorage.removeItem('hqswift_hospitals');
    localStorage.removeItem('hqswift_doctors');
    localStorage.removeItem('hqswift_tokens');
    localStorage.removeItem('hqswift_reviews');
    localStorage.removeItem('hqswift_leave_requests');
    setHospitals(MOCK_HOSPITALS);
    setDoctors(MOCK_DOCTORS);
    setTokens(MOCK_QUEUE_TOKENS);
    setReviews(MOCK_REVIEWS);
    setLeaveRequests(MOCK_LEAVE_REQUESTS);
  };

  return (
    <QueueContext.Provider
      value={{
        hospitals,
        doctors,
        tokens,
        reviews,
        leaveRequests,
        getDoctorServingToken,
        getDoctorQueueStats,
        issueToken,
        callNextToken,
        updateTokenStatus,
        toggleTokenPriority,
        addHospital,
        updateHospitalProfile,
        deleteHospital,
        restoreHospital,
        isHospitalClosedOnDate,
        isHospitalCurrentlyOpen,
        formatTimeAMPM,
        addDoctor,
        updateDoctorCredentials,
        addReview,
        respondToReview,
        toggleDoctorAvailability,
        toggleDoctorResignation,
        requestDoctorLeave,
        updateLeaveStatus,

        isDoctorOnLeave,
        getDoctorLeaveDetails,
        resetSampleData,
      }}
    >
      {children}
    </QueueContext.Provider>
  );
}


export function useQueue() {
  const context = useContext(QueueContext);
  if (!context) throw new Error('useQueue must be used within a QueueProvider');
  return context;
}
