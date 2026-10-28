-- Seed Data for Hospital Qswift
-- Run this in your Supabase SQL Editor AFTER running supabase_schema.sql

-- 1. Insert Sample Hospitals (owner_id is NULL for initial seed facilities)
INSERT INTO public.hospitals (id, owner_id, name, type, address, lat, lng, photo_url, is_open, phone, emergency_contact, verification_status, clinical_license_no, council_reg_no)
VALUES 
  ('a1111111-1111-1111-1111-111111111111', NULL, 'Apollo City OPD & Care Clinic', 'clinic', '42 Indiranagar 100ft Road, Bengaluru, KA 560038', 12.9784, 77.6408, 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=800&q=80', true, '+91 80 4112 8800', '+91 80 1066', 'verified', 'CEA/KA/2026/8841', 'KMC-74921-2018'),
  ('a2222222-2222-2222-2222-222222222222', NULL, 'Fortis Lifecare Hospital', 'hospital', '154/9 Bannerghatta Main Rd, Opp IIM, Bengaluru, KA 560076', 12.8956, 77.5989, 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80', true, '+91 80 6621 4444', '105711', 'verified', 'CEA/KA/2026/9012', 'KMC-88120-2016'),
  ('a3333333-3333-3333-3333-333333333333', NULL, 'Max Healthcare OPD Centre', 'clinic', '88 Koramangala 5th Block, Bengaluru, KA 560095', 12.9352, 77.6245, 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=800&q=80', true, '+91 80 4900 1200', '+91 80 102', 'verified', 'CEA/KA/2026/4100', 'KMC-65432-2019')
ON CONFLICT (id) DO NOTHING;

-- 2. Insert Sample Doctors
INSERT INTO public.doctors (id, hospital_id, name, specialty, consultation_fee, avg_consult_minutes, available_days, available_from, available_to, qualification, experience_years, is_available)
VALUES
  ('b1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'Dr. Rajesh Sharma', 'General Physician', 500, 15, ARRAY['Mon','Tue','Wed','Thu','Fri','Sat'], '09:00:00', '17:00:00', 'MBBS, MD (Internal Medicine)', 12, true),
  ('b2222222-2222-2222-2222-222222222222', 'a1111111-1111-1111-1111-111111111111', 'Dr. Ananya Roy', 'Pediatrics', 600, 15, ARRAY['Mon','Tue','Wed','Thu','Fri'], '10:00:00', '16:00:00', 'MBBS, DCH, MD (Pediatrics)', 9, true),
  ('b3333333-3333-3333-3333-333333333333', 'a2222222-2222-2222-2222-222222222222', 'Dr. Vikramaditya Rao', 'Cardiology', 900, 20, ARRAY['Mon','Wed','Fri'], '11:00:00', '18:00:00', 'MBBS, MD, DM (Cardiology)', 18, true),
  ('b4444444-4444-4444-4444-444444444444', 'a3333333-3333-3333-3333-333333333333', 'Dr. Priya Nambiar', 'Dermatology', 700, 15, ARRAY['Tue','Thu','Sat'], '09:30:00', '15:30:00', 'MBBS, MD (Dermatology)', 10, true)
ON CONFLICT (id) DO NOTHING;

-- 3. Insert Sample Reviews
INSERT INTO public.reviews (hospital_id, doctor_id, patient_id, patient_name, rating, comment, response)
VALUES
  ('a1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', NULL, 'Suresh Kumar', 5, 'Minimal wait time thanks to live tokens! Dr. Rajesh listened carefully.', 'Thank you Suresh! Glad we could save your time.'),
  ('a1111111-1111-1111-1111-111111111111', 'b2222222-2222-2222-2222-222222222222', NULL, 'Meera Patel', 4, 'Very friendly staff and clean clinic. Token tracker was accurate within 5 mins.', NULL),
  ('a2222222-2222-2222-2222-222222222222', 'b3333333-3333-3333-3333-333333333333', NULL, 'Arun Verma', 5, 'Dr. Vikramaditya is extremely thorough and polite.', 'Thank you for your feedback!');

-- 4. Insert Sample Leave Requests
INSERT INTO public.leave_requests (id, doctor_id, hospital_id, doctor_name, specialty, from_date, to_date, reason, status)
VALUES
  ('l1111111-1111-1111-1111-111111111111', 'b2222222-2222-2222-2222-222222222222', 'a1111111-1111-1111-1111-111111111111', 'Dr. Ananya Roy', 'Pediatrics', '2026-09-01', '2026-09-03', 'Medical Conference Attendance', 'approved')
ON CONFLICT (id) DO NOTHING;

