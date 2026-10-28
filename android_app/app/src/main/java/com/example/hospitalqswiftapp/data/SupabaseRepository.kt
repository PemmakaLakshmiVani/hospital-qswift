package com.example.hospitalqswiftapp.data

import io.ktor.client.*
import io.ktor.client.engine.android.*
import io.ktor.client.plugins.contentnegotiation.*
import io.ktor.client.request.*
import io.ktor.client.statement.*
import io.ktor.http.*
import io.ktor.serialization.kotlinx.json.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.*

object SupabaseRepository {
    private const val SUPABASE_URL = "http://127.0.0.1:4000"
    private const val SUPABASE_ANON_KEY = "sb_publishable_GPU-eMQjVEf8fQ7FJ9Xclw_L_A3i0MZ"

    private val json = Json {
        ignoreUnknownKeys = true
        encodeDefaults = true
        isLenient = true
    }

    private val client = HttpClient(Android) {
        install(ContentNegotiation) {
            json(json)
        }
        engine {
            connectTimeout = 5000
            socketTimeout = 5000
        }
    }

    private fun HttpRequestBuilder.applySupabaseHeaders() {
        header("apikey", SUPABASE_ANON_KEY)
        header("Authorization", "Bearer ${authToken ?: SUPABASE_ANON_KEY}")
    }

    // Active Authenticated User Profile & Auth Token
    var currentUserProfile: Profile? = null
    var authToken: String? = null
    var currentUserId: String? = null

    /**
     * Authenticate user via Supabase Auth (email & password)
     */
    suspend fun signInWithSupabase(email: String, password: String): Pair<Boolean, String> = withContext(Dispatchers.IO) {
        val cleanEmail = email.trim()
        if (cleanEmail.isEmpty() || password.isEmpty()) {
            return@withContext Pair(false, "Email and password cannot be empty.")
        }

        try {
            val payload = buildJsonObject {
                put("email", cleanEmail)
                put("password", password)
            }
            val response: HttpResponse = client.post("$SUPABASE_URL/auth/v1/token?grant_type=password") {
                header("apikey", SUPABASE_ANON_KEY)
                contentType(ContentType.Application.Json)
                setBody(payload.toString())
            }

            val responseText = response.bodyAsText()
            if (response.status.isSuccess()) {
                val jsonObject = json.parseToJsonElement(responseText).jsonObject
                val token = jsonObject["access_token"]?.jsonPrimitive?.content
                val userObj = jsonObject["user"]?.jsonObject
                val userId = userObj?.get("id")?.jsonPrimitive?.content

                if (token != null) authToken = token
                if (userId != null) {
                    currentUserId = userId
                    val dbProf = fetchUserProfile(userId)
                    if (dbProf != null) {
                        currentUserProfile = dbProf
                    } else {
                        val metaRole = userObj["user_metadata"]?.jsonObject?.get("role")?.jsonPrimitive?.content ?: "patient"
                        val metaName = userObj["user_metadata"]?.jsonObject?.get("full_name")?.jsonPrimitive?.content ?: cleanEmail.substringBefore("@")
                        val metaPhone = userObj["user_metadata"]?.jsonObject?.get("phone")?.jsonPrimitive?.content
                        val metaHsp = userObj["user_metadata"]?.jsonObject?.get("hospital_id")?.jsonPrimitive?.content

                        val newProf = Profile(
                            id = userId,
                            full_name = metaName,
                            email = cleanEmail,
                            phone = metaPhone ?: "+91 98765 12345",
                            role = metaRole,
                            hospital_id = metaHsp ?: "hsp-1",
                            blood_group = "O+",
                            emergency_contact = "+91 98765 00000",
                            medical_notes = "No known drug allergies"
                        )
                        upsertUserProfile(newProf)
                    }
                    return@withContext Pair(true, "Authentication successful!")
                }
                return@withContext Pair(false, "User identity missing in auth response.")
            } else {
                if (responseText.contains("invalid_grant", ignoreCase = true) || responseText.contains("Invalid login credentials", ignoreCase = true)) {
                    return@withContext Pair(false, "Invalid email address or password.")
                }
                if (responseText.contains("email_not_confirmed", ignoreCase = true)) {
                    return@withContext Pair(false, "Email address is not verified yet. Please check your email inbox to verify.")
                }
                val msg = try {
                    val errJson = json.parseToJsonElement(responseText).jsonObject
                    errJson["error_description"]?.jsonPrimitive?.content ?: errJson["msg"]?.jsonPrimitive?.content ?: "Authentication failed."
                } catch (e: Exception) {
                    "Authentication failed."
                }
                return@withContext Pair(false, msg)
            }
        } catch (e: Exception) {
            e.printStackTrace()
            return@withContext Pair(false, "Network error: ${e.message ?: "Could not connect to Supabase server"}")
        }
    }

    /**
     * Register a new user in Supabase Auth & create profile row
     */
    suspend fun signUpWithSupabase(
        email: String,
        password: String,
        fullName: String,
        phone: String = "",
        role: String = "patient",
        hospitalId: String? = null,
        bloodGroup: String = "O+",
        emergencyContact: String = "",
        medicalNotes: String = ""
    ): Pair<Boolean, String> = withContext(Dispatchers.IO) {
        val cleanEmail = email.trim()
        if (cleanEmail.isEmpty() || !cleanEmail.contains("@")) {
            return@withContext Pair(false, "Please enter a valid email address.")
        }
        if (password.length < 6) {
            return@withContext Pair(false, "Password must be at least 6 characters.")
        }

        try {
            val payload = buildJsonObject {
                put("email", cleanEmail)
                put("password", password)
                put("data", buildJsonObject {
                    put("full_name", fullName)
                    put("phone", phone)
                    put("role", role)
                    if (hospitalId != null) put("hospital_id", hospitalId)
                    put("blood_group", bloodGroup.ifEmpty { "None" })
                    put("emergency_contact", emergencyContact.ifEmpty { "None" })
                    put("medical_notes", medicalNotes.ifEmpty { "None" })
                })
            }
            val response: HttpResponse = client.post("$SUPABASE_URL/auth/v1/signup") {
                header("apikey", SUPABASE_ANON_KEY)
                contentType(ContentType.Application.Json)
                setBody(payload.toString())
            }

            val responseText = response.bodyAsText()
            if (response.status.isSuccess()) {
                val jsonObject = json.parseToJsonElement(responseText).jsonObject
                val userObj = jsonObject["user"]?.jsonObject
                val userId = userObj?.get("id")?.jsonPrimitive?.content ?: "user-${System.currentTimeMillis()}"
                val token = jsonObject["access_token"]?.jsonPrimitive?.content
                if (token != null) authToken = token
                currentUserId = userId

                val newProf = Profile(
                    id = userId,
                    full_name = fullName,
                    email = cleanEmail,
                    phone = phone.ifEmpty { "+91 98765 12345" },
                    role = role,
                    hospital_id = hospitalId ?: "hsp-1",
                    blood_group = bloodGroup.ifEmpty { "O+" },
                    emergency_contact = emergencyContact.ifEmpty { "+91 98765 00000" },
                    medical_notes = medicalNotes.ifEmpty { "No known drug allergies" }
                )
                upsertUserProfile(newProf)
                return@withContext Pair(true, "Account created successfully!")
            } else {
                if (responseText.contains("already registered", ignoreCase = true) || responseText.contains("user_already_exists", ignoreCase = true)) {
                    return@withContext Pair(false, "A user with this email is already registered. Please Sign In.")
                }
                val msg = try {
                    val errJson = json.parseToJsonElement(responseText).jsonObject
                    errJson["msg"]?.jsonPrimitive?.content ?: errJson["error_description"]?.jsonPrimitive?.content ?: "Registration failed."
                } catch (e: Exception) {
                    "Registration failed."
                }
                return@withContext Pair(false, msg)
            }
        } catch (e: Exception) {
            e.printStackTrace()
            return@withContext Pair(false, "Network error: ${e.message ?: "Could not connect to Supabase server"}")
        }
    }

    /**
     * Restore session from stored JWT access token
     */
    suspend fun restoreSession(token: String, userId: String): Boolean = withContext(Dispatchers.IO) {
        try {
            authToken = token
            currentUserId = userId

            // Verify token validity against /auth/v1/user
            val response: HttpResponse = client.get("$SUPABASE_URL/auth/v1/user") {
                applySupabaseHeaders()
            }
            if (response.status.isSuccess()) {
                val prof = fetchUserProfile(userId)
                if (prof != null) {
                    currentUserProfile = prof
                    return@withContext true
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
        // Invalidate invalid/expired session
        authToken = null
        currentUserId = null
        currentUserProfile = null
        false
    }

    /**
     * Sign out user and clear session
     */
    suspend fun signOut() = withContext(Dispatchers.IO) {
        try {
            if (authToken != null) {
                client.post("$SUPABASE_URL/auth/v1/logout") {
                    applySupabaseHeaders()
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        } finally {
            authToken = null
            currentUserId = null
            currentUserProfile = null
        }
    }

    /**
     * Fetch user profile from Supabase 'profiles' table
     */
    suspend fun fetchUserProfile(userId: String): Profile? = withContext(Dispatchers.IO) {
        try {
            val response: HttpResponse = client.get("$SUPABASE_URL/rest/v1/profiles?id=eq.$userId&select=*") {
                applySupabaseHeaders()
            }
            if (response.status.isSuccess()) {
                val text = response.bodyAsText()
                val list: List<Profile> = json.decodeFromString(text)
                if (list.isNotEmpty()) return@withContext list.first()
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
        null
    }

    /**
     * Upsert profile in Supabase 'profiles' table
     */
    suspend fun upsertUserProfile(profile: Profile): Boolean = withContext(Dispatchers.IO) {
        try {
            val response: HttpResponse = client.post("$SUPABASE_URL/rest/v1/profiles") {
                applySupabaseHeaders()
                header("Prefer", "resolution=merge-duplicates")
                contentType(ContentType.Application.Json)
                setBody(json.encodeToString(profile))
            }
            if (response.status.isSuccess()) {
                currentUserProfile = profile
                return@withContext true
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
        currentUserProfile = profile
        true
    }

    // In-memory cache & mock fallback data matching website mockData.js
    private val localHospitals = mutableListOf(
        Hospital(
            id = "hsp-1", owner_id = "user-staff-1", name = "Apollo City OPD & Care Clinic",
            type = "clinic", address = "42 Indiranagar 100ft Road, Bengaluru, KA 560038",
            lat = 12.9784, lng = 77.6408, photo_url = "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=800&q=80",
            is_open = true, is_verified = true, verification_status = "verified", clinical_license = "CEA/KA/2026/8841",
            council_reg = "KMC-74921-2018", phone = "+91 80 4112 8800", emergency_contact = "+91 80 1066",
            rating = 4.8, review_count = 142, distance_km = 1.2,
            open_time = "08:00", close_time = "22:00", closed_days = emptyList(), is_24_7 = false
        ),
        Hospital(
            id = "hsp-2", owner_id = "user-staff-2", name = "Fortis Lifecare Hospital",
            type = "hospital", address = "154/9 Bannerghatta Main Rd, Opp IIM, Bengaluru, KA 560076",
            lat = 12.8956, lng = 77.5989, photo_url = "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80",
            is_open = true, is_verified = true, verification_status = "verified", clinical_license = "CEA/KA/2026/9012",
            council_reg = "KMC-88120-2016", phone = "+91 80 6621 4444", emergency_contact = "105711",
            rating = 4.6, review_count = 310, distance_km = 2.8,
            open_time = "00:00", close_time = "23:59", closed_days = emptyList(), is_24_7 = true
        ),
        Hospital(
            id = "hsp-3", owner_id = "user-staff-3", name = "Max Healthcare OPD Centre",
            type = "clinic", address = "88 Koramangala 5th Block, Bengaluru, KA 560095",
            lat = 12.9352, lng = 77.6245, photo_url = "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=800&q=80",
            is_open = true, is_verified = true, verification_status = "verified", clinical_license = "CEA/KA/2026/4100",
            council_reg = "KMC-65432-2019", phone = "+91 80 4900 1200", emergency_contact = "+91 80 4900 1201",
            rating = 4.9, review_count = 88, distance_km = 3.4,
            open_time = "08:00", close_time = "22:00", closed_days = emptyList(), is_24_7 = false
        ),
        Hospital(
            id = "hsp-4", owner_id = "user-staff-4", name = "Manipal Polyclinic & Diagnostic",
            type = "diagnostic_center", address = "98 HAL Airport Rd, Kodihalli, Bengaluru, KA 560017",
            lat = 12.9592, lng = 77.6482, photo_url = "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80",
            is_open = true, is_verified = true, verification_status = "verified", phone = "+91 80 2502 4444",
            emergency_contact = "+91 80 2502 4445", rating = 4.7, review_count = 215, distance_km = 4.1,
            open_time = "07:30", close_time = "22:00", closed_days = emptyList(), is_24_7 = false
        ),
        Hospital(
            id = "hsp-5", owner_id = "user-staff-5", name = "Apex Smiles & Eye Care Institute",
            type = "clinic", address = "24 HSR Layout Sector 1, Bengaluru, KA 560102",
            lat = 12.9121, lng = 77.6446, photo_url = "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=800&q=80",
            is_open = true, is_verified = true, verification_status = "verified",
            phone = "+91 80 2572 9988", emergency_contact = "+91 80 2572 9999", rating = 4.5, review_count = 67, distance_km = 5.0,
            open_time = "08:00", close_time = "22:00", closed_days = emptyList(), is_24_7 = false
        )
    )

    private val localDoctors = mutableListOf(
        Doctor(
            id = "doc-101", hospital_id = "hsp-1", name = "Dr. Meera Rao", username = "DR_MEERA_RAO",
            password = "doc123", specialty = "General Physician", consultation_fee = 500.0, avg_consult_minutes = 12,
            available_days = listOf("Mon", "Tue", "Wed", "Thu", "Fri", "Sat"), available_from = "09:00", available_to = "13:00",
            qualification = "MD (Internal Med) - AIIMS New Delhi", experience_years = 14, is_available = true
        ),
        Doctor(
            id = "doc-102", hospital_id = "hsp-1", name = "Dr. Rajesh Sharma", username = "DR_RAJESH_SHARMA",
            password = "doc123", specialty = "Pediatrics", consultation_fee = 600.0, avg_consult_minutes = 15,
            available_days = listOf("Mon", "Wed", "Fri", "Sat"), available_from = "10:00", available_to = "16:00",
            qualification = "DCH, MD (Pediatrics) - KMC Manipal", experience_years = 11, is_available = true
        ),
        Doctor(
            id = "doc-103", hospital_id = "hsp-1", name = "Dr. Ananya Gupta", username = "DR_ANANYA_GUPTA",
            password = "doc123", specialty = "Dermatology", consultation_fee = 750.0, avg_consult_minutes = 15,
            available_days = listOf("Tue", "Thu", "Sat"), available_from = "14:00", available_to = "19:00",
            qualification = "MD (Dermatology & Cosmetology)", experience_years = 8, is_available = true
        ),
        Doctor(
            id = "doc-201", hospital_id = "hsp-2", name = "Dr. Vikram Sethi", username = "DR_VIKRAM_SETHI",
            password = "doc123", specialty = "Cardiology", consultation_fee = 1000.0, avg_consult_minutes = 20,
            available_days = listOf("Mon", "Tue", "Wed", "Thu", "Fri"), available_from = "09:30", available_to = "14:30",
            qualification = "DM (Cardiology), FACC", experience_years = 18, is_available = true
        ),
        Doctor(
            id = "doc-202", hospital_id = "hsp-2", name = "Dr. Kavita Nair", username = "DR_KAVITA_NAIR",
            password = "doc123", specialty = "Gynaecology", consultation_fee = 800.0, avg_consult_minutes = 15,
            available_days = listOf("Mon", "Tue", "Thu", "Fri", "Sat"), available_from = "10:00", available_to = "17:00",
            qualification = "MS (OBG), Fellowship in Reproductive Med", experience_years = 15, is_available = true
        ),
        Doctor(
            id = "doc-203", hospital_id = "hsp-2", name = "Dr. Siddharth Varma", username = "DR_SIDDHARTH_VARMA",
            password = "doc123", specialty = "Orthopedics", consultation_fee = 850.0, avg_consult_minutes = 15,
            available_days = listOf("Mon", "Wed", "Fri"), available_from = "11:00", available_to = "16:00",
            qualification = "MS (Ortho), Joint Replacement Surgeon", experience_years = 12, is_available = true
        ),
        Doctor(
            id = "doc-301", hospital_id = "hsp-3", name = "Dr. Rohan Deshmukh", username = "DR_ROHAN_DESHMUKH",
            password = "doc123", specialty = "Dental", consultation_fee = 450.0, avg_consult_minutes = 20,
            available_days = listOf("Mon", "Tue", "Wed", "Thu", "Fri", "Sat"), available_from = "09:00", available_to = "19:00",
            qualification = "MDS (Endodontics)", experience_years = 9, is_available = true
        ),
        Doctor(
            id = "doc-302", hospital_id = "hsp-3", name = "Dr. Priyanka Kulkarni", username = "DR_PRIYANKA_KULKARNI",
            password = "doc123", specialty = "Pediatrics", consultation_fee = 550.0, avg_consult_minutes = 15,
            available_days = listOf("Mon", "Tue", "Thu", "Fri"), available_from = "09:30", available_to = "13:30",
            qualification = "MD (Pediatrics), Neonatology Specialist", experience_years = 10, is_available = true
        ),
        Doctor(
            id = "doc-401", hospital_id = "hsp-4", name = "Dr. Arun Kumar", username = "DR_ARUN_KUMAR",
            password = "doc123", specialty = "ENT", consultation_fee = 650.0, avg_consult_minutes = 12,
            available_days = listOf("Mon", "Wed", "Fri", "Sat"), available_from = "10:00", available_to = "15:00",
            qualification = "MS (ENT)", experience_years = 13, is_available = true
        ),
        Doctor(
            id = "doc-501", hospital_id = "hsp-5", name = "Dr. Niharika Sen", username = "DR_NIHARIKA_SEN",
            password = "doc123", specialty = "Dental", consultation_fee = 400.0, avg_consult_minutes = 20,
            available_days = listOf("Mon", "Tue", "Wed", "Thu", "Fri", "Sat"), available_from = "10:00", available_to = "18:00",
            qualification = "BDS, MDS (Cosmetic Dentistry)", experience_years = 7, is_available = true
        )
    )

    private val localTokens = mutableListOf(
        QueueToken(
            id = "tok-101-14", hospital_id = "hsp-1", doctor_id = "doc-101", patient_id = "pat-999",
            patient_name = "Rahul Verma", token_number = 14, status = "serving", is_priority = false,
            queue_date = java.time.LocalDate.now().toString(), joined_at = "08:00", called_at = "08:40"
        ),
        QueueToken(
            id = "tok-101-15", hospital_id = "hsp-1", doctor_id = "doc-101", patient_id = "pat-888",
            patient_name = "Sunita Sharma (Senior Citizen)", token_number = 15, status = "waiting",
            is_priority = true, priority_reason = "Senior Citizen (72 yrs)", queue_date = java.time.LocalDate.now().toString(),
            joined_at = "08:15"
        ),
        QueueToken(
            id = "tok-101-16", hospital_id = "hsp-1", doctor_id = "doc-101", patient_id = "pat-demo",
            patient_name = "Lakshya Sharma", token_number = 16, status = "waiting", is_priority = false,
            queue_date = java.time.LocalDate.now().toString(), joined_at = "08:25"
        ),
        QueueToken(
            id = "tok-101-17", hospital_id = "hsp-1", doctor_id = "doc-101", patient_id = "pat-777",
            patient_name = "Amit Patel", token_number = 17, status = "waiting", is_priority = false,
            queue_date = java.time.LocalDate.now().toString(), joined_at = "08:35"
        ),
        QueueToken(
            id = "tok-101-18", hospital_id = "hsp-1", doctor_id = "doc-101", patient_id = "pat-666",
            patient_name = "Divya Krishnan", token_number = 18, status = "waiting", is_priority = false,
            queue_date = java.time.LocalDate.now().toString(), joined_at = "08:45"
        ),
        QueueToken(
            id = "tok-102-8", hospital_id = "hsp-1", doctor_id = "doc-102", patient_id = "pat-555",
            patient_name = "Aarav Mehta (Child)", token_number = 8, status = "serving", is_priority = false,
            queue_date = java.time.LocalDate.now().toString(), joined_at = "08:10", called_at = "08:30"
        ),
        QueueToken(
            id = "tok-102-9", hospital_id = "hsp-1", doctor_id = "doc-102", patient_id = "pat-444",
            patient_name = "Vihaan Joshi (Child)", token_number = 9, status = "waiting", is_priority = false,
            queue_date = java.time.LocalDate.now().toString(), joined_at = "08:20"
        ),
        QueueToken(
            id = "tok-201-22", hospital_id = "hsp-2", doctor_id = "doc-201", patient_id = "pat-333",
            patient_name = "Girish Rao", token_number = 22, status = "serving", is_priority = true,
            priority_reason = "Chest discomfort assessment", queue_date = java.time.LocalDate.now().toString(),
            joined_at = "08:00", called_at = "08:35"
        ),
        QueueToken(
            id = "tok-201-23", hospital_id = "hsp-2", doctor_id = "doc-201", patient_id = "pat-222",
            patient_name = "Meenakshi Sundaram", token_number = 23, status = "waiting", is_priority = false,
            queue_date = java.time.LocalDate.now().toString(), joined_at = "08:25"
        ),
        QueueToken(
            id = "tok-301-5", hospital_id = "hsp-3", doctor_id = "doc-301", patient_id = "pat-111",
            patient_name = "Pooja Hegde", token_number = 5, status = "serving", is_priority = false,
            queue_date = java.time.LocalDate.now().toString(), joined_at = "08:10", called_at = "08:40"
        ),
        QueueToken(
            id = "tok-301-6", hospital_id = "hsp-3", doctor_id = "doc-301", patient_id = "pat-112",
            patient_name = "Anand Roy", token_number = 6, status = "waiting", is_priority = false,
            queue_date = java.time.LocalDate.now().toString(), joined_at = "08:30"
        ),
        QueueToken(
            id = "tok-401-11", hospital_id = "hsp-4", doctor_id = "doc-401", patient_id = "pat-113",
            patient_name = "Manjunath K", token_number = 11, status = "serving", is_priority = false,
            queue_date = java.time.LocalDate.now().toString(), joined_at = "08:15", called_at = "08:35"
        ),
        QueueToken(
            id = "tok-501-3", hospital_id = "hsp-5", doctor_id = "doc-501", patient_id = "pat-114",
            patient_name = "Tanvi Shah", token_number = 3, status = "serving", is_priority = false,
            queue_date = java.time.LocalDate.now().toString(), joined_at = "08:20", called_at = "08:45"
        )
    )

    private val localReviews = mutableListOf(
        Review(
            id = "rev-1", hospital_id = "hsp-1", doctor_id = "doc-101", patient_id = "pat-888",
            patient_name = "Sunita S.", rating = 5, comment = "Dr. Meera Rao was extremely attentive. Grabbed OPD Token #15 from home and reached right when #14 was serving. Saved 1.5 hours!",
            response = "Thank you Sunita ji! Happy to know the OPD Token saved your valuable time.", created_at = "2 days ago"
        ),
        Review(
            id = "rev-2", hospital_id = "hsp-1", doctor_id = "doc-102", patient_id = "pat-555",
            patient_name = "Vikram M.", rating = 5, comment = "Very smooth experience for my 5yo child. Staff called our token promptly. Clean OPD lounge.",
            response = "Appreciate your feedback! Wishing your child good health.", created_at = "5 days ago"
        ),
        Review(
            id = "rev-3", hospital_id = "hsp-2", doctor_id = "doc-201", patient_id = "pat-333",
            patient_name = "Girish R.", rating = 4, comment = "Dr. Vikram is a top cardiologist. Live queue position tracker was accurate to within 5 mins.",
            response = null, created_at = "1 week ago"
        )
    )

    private val localLeaveRequests = mutableListOf(
        LeaveRequest(
            id = "leave-101-1", doctor_id = "doc-101", hospital_id = "hsp-1", doctor_name = "Dr. Meera Rao",
            specialty = "General Physician", from_date = "2026-08-22", to_date = "2026-08-24",
            reason = "Attending Medical Council Conference & Seminar", status = "approved", requested_at = "2026-08-18T10:00:00Z"
        ),
        LeaveRequest(
            id = "leave-102-1", doctor_id = "doc-102", hospital_id = "hsp-1", doctor_name = "Dr. Rajesh Sharma",
            specialty = "Pediatrics", from_date = "2026-08-25", to_date = "2026-08-27",
            reason = "Personal Family Emergency Leave", status = "pending", requested_at = "2026-08-19T09:00:00Z"
        )
    )

    private val localFamilyMembers = mutableListOf(
        FamilyMember(id = "fam-self", patient_id = "pat-demo", full_name = "Self (You)", relationship = "self", age = 28, gender = "Male"),
        FamilyMember(id = "fam-1", patient_id = "pat-demo", full_name = "Saritha Sharma", relationship = "Mother", age = 56, gender = "Female"),
        FamilyMember(id = "fam-2", patient_id = "pat-demo", full_name = "Aarav Sharma", relationship = "Child", age = 6, gender = "Male")
    )

    private val localStaffAccounts = mutableListOf(
        StaffAccount(id = "staff-1", hospital_id = "hsp-1", doctor_id = null, staff_name = "Sunita Sharma (Front Desk)", username = "APOLLO_STAFF_1", password = "staff123"),
        StaffAccount(id = "staff-2", hospital_id = "hsp-1", doctor_id = "doc-101", staff_name = "Ramesh Kumar (Reception Desk)", username = "RECEPTION_DESK", password = "staff123")
    )


    suspend fun getHospitals(): List<Hospital> = withContext(Dispatchers.IO) {
        try {
            val response: HttpResponse = client.get("$SUPABASE_URL/rest/v1/hospitals?select=*") {
                applySupabaseHeaders()
            }
            if (response.status.isSuccess()) {
                val text = response.bodyAsText()
                val remote: List<Hospital> = json.decodeFromString(text)
                if (remote.isNotEmpty()) {
                    val combined = (localHospitals + remote).distinctBy { it.id }
                    return@withContext combined
                }
            }
            localHospitals.toList()
        } catch (e: Exception) {
            localHospitals.toList()
        }
    }

    suspend fun getDoctors(): List<Doctor> = withContext(Dispatchers.IO) {
        try {
            val response: HttpResponse = client.get("$SUPABASE_URL/rest/v1/doctors?select=*") {
                applySupabaseHeaders()
            }
            if (response.status.isSuccess()) {
                val text = response.bodyAsText()
                val remote: List<Doctor> = json.decodeFromString(text)
                if (remote.isNotEmpty()) {
                    val combined = (localDoctors + remote).distinctBy { it.id }
                    return@withContext combined
                }
            }
            localDoctors.toList()
        } catch (e: Exception) {
            localDoctors.toList()
        }
    }

    suspend fun getQueueTokens(): List<QueueToken> = withContext(Dispatchers.IO) {
        try {
            val response: HttpResponse = client.get("$SUPABASE_URL/rest/v1/queue_tokens?select=*&order=joined_at.desc") {
                applySupabaseHeaders()
            }
            if (response.status.isSuccess()) {
                val text = response.bodyAsText()
                val remote: List<QueueToken> = json.decodeFromString(text)
                if (remote.isNotEmpty()) {
                    // Update local cache without losing local pending updates
                    remote.forEach { rTok ->
                        val idx = localTokens.indexOfFirst { it.id == rTok.id }
                        if (idx < 0) localTokens.add(rTok)
                    }
                    val combined = (localTokens + remote).distinctBy { it.id }
                    return@withContext combined
                }
            }
            localTokens.toList()
        } catch (e: Exception) {
            localTokens.toList()
        }
    }

    suspend fun getReviews(): List<Review> = withContext(Dispatchers.IO) {
        try {
            val response: HttpResponse = client.get("$SUPABASE_URL/rest/v1/reviews?select=*&order=created_at.desc") {
                applySupabaseHeaders()
            }
            if (response.status.isSuccess()) {
                val text = response.bodyAsText()
                val remote: List<Review> = json.decodeFromString(text)
                if (remote.isNotEmpty()) {
                    val combined = (localReviews + remote).distinctBy { it.id }
                    return@withContext combined
                }
            }
            localReviews.toList()
        } catch (e: Exception) {
            localReviews.toList()
        }
    }

    suspend fun getLeaveRequests(): List<LeaveRequest> = withContext(Dispatchers.IO) {
        try {
            val response: HttpResponse = client.get("$SUPABASE_URL/rest/v1/leave_requests?select=*&order=requested_at.desc") {
                applySupabaseHeaders()
            }
            if (response.status.isSuccess()) {
                val text = response.bodyAsText()
                val remote: List<LeaveRequest> = json.decodeFromString(text)
                if (remote.isNotEmpty()) {
                    val combined = (localLeaveRequests + remote).distinctBy { it.id }
                    return@withContext combined
                }
            }
            localLeaveRequests.toList()
        } catch (e: Exception) {
            localLeaveRequests.toList()
        }
    }

    suspend fun getFamilyMembers(): List<FamilyMember> = withContext(Dispatchers.IO) {
        val currProf = currentUserProfile
        val userId = currProf?.id
        try {
            val filterParam = if (userId != null) "?patient_id=eq.$userId&select=*" else "?select=*"
            val response: HttpResponse = client.get("$SUPABASE_URL/rest/v1/family_members$filterParam") {
                applySupabaseHeaders()
            }
            if (response.status.isSuccess()) {
                val text = response.bodyAsText()
                val remote: List<FamilyMember> = json.decodeFromString(text)
                if (remote.isNotEmpty()) {
                    val filteredLocal = if (userId != null) {
                        localFamilyMembers.filter { it.patient_id == userId }
                    } else emptyList()
                    val combined = (filteredLocal + remote).distinctBy { it.id }
                    return@withContext combined
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
        if (userId != null) {
            localFamilyMembers.filter { it.patient_id == userId }
        } else {
            emptyList()
        }
    }


    suspend fun issueQueueToken(token: QueueToken): Boolean = withContext(Dispatchers.IO) {
        val tokenWithPatient = if (token.patient_id.isNullOrEmpty() || token.patient_id.startsWith("pat-")) {
            token.copy(patient_id = currentUserProfile?.id ?: token.patient_id)
        } else token

        localTokens.add(0, tokenWithPatient)
        try {
            val response: HttpResponse = client.post("$SUPABASE_URL/rest/v1/queue_tokens") {
                applySupabaseHeaders()
                contentType(ContentType.Application.Json)
                setBody(json.encodeToString(tokenWithPatient))
            }
            if (!response.status.isSuccess()) {
                println("Supabase issueQueueToken Warning: ${response.status} - ${response.bodyAsText()}")
            }
            true
        } catch (e: Exception) {
            e.printStackTrace()
            true
        }
    }

    suspend fun updateTokenStatus(tokenId: String, status: String, completedAt: String? = null): Boolean = withContext(Dispatchers.IO) {
        val idx = localTokens.indexOfFirst { it.id == tokenId }
        if (idx >= 0) {
            val curr = localTokens[idx]
            localTokens[idx] = curr.copy(status = status, completed_at = completedAt ?: curr.completed_at)
        }
        try {
            val jsonPayload = buildJsonObject {
                put("status", status)
                if (completedAt != null) put("completed_at", completedAt)
            }
            val response: HttpResponse = client.patch("$SUPABASE_URL/rest/v1/queue_tokens?id=eq.$tokenId") {
                applySupabaseHeaders()
                contentType(ContentType.Application.Json)
                setBody(jsonPayload.toString())
            }
            response.status.isSuccess()
        } catch (e: Exception) {
            true
        }
    }

    suspend fun toggleTokenPriority(tokenId: String, reason: String = "Senior Citizen / Priority"): Boolean = withContext(Dispatchers.IO) {
        val idx = localTokens.indexOfFirst { it.id == tokenId }
        val newP = if (idx >= 0) !localTokens[idx].is_priority else true
        val pReason = if (newP) reason else ""
        if (idx >= 0) {
            val curr = localTokens[idx]
            localTokens[idx] = curr.copy(is_priority = newP, priority_reason = pReason)
        }
        try {
            val jsonPayload = buildJsonObject {
                put("is_priority", newP)
                put("priority_reason", pReason)
            }
            val response: HttpResponse = client.patch("$SUPABASE_URL/rest/v1/queue_tokens?id=eq.$tokenId") {
                applySupabaseHeaders()
                contentType(ContentType.Application.Json)
                setBody(jsonPayload.toString())
            }
            response.status.isSuccess()
        } catch (e: Exception) {
            true
        }
    }

    suspend fun callNextToken(doctorId: String, nextTokenId: String, currentServingTokenId: String?): Boolean = withContext(Dispatchers.IO) {
        val now = java.time.Instant.now().toString()
        if (currentServingTokenId != null) {
            updateTokenStatus(currentServingTokenId, "done", now)
        }
        updateTokenStatus(nextTokenId, "serving", now)
        true
    }

    suspend fun addHospital(hospital: Hospital): Boolean = withContext(Dispatchers.IO) {
        localHospitals.add(0, hospital)
        try {
            val response: HttpResponse = client.post("$SUPABASE_URL/rest/v1/hospitals") {
                applySupabaseHeaders()
                contentType(ContentType.Application.Json)
                setBody(json.encodeToString(hospital))
            }
            response.status.isSuccess()
        } catch (e: Exception) {
            true
        }
    }

    suspend fun addDoctor(doctor: Doctor): Boolean = withContext(Dispatchers.IO) {
        localDoctors.add(doctor)
        try {
            val response: HttpResponse = client.post("$SUPABASE_URL/rest/v1/doctors") {
                applySupabaseHeaders()
                contentType(ContentType.Application.Json)
                setBody(json.encodeToString(doctor))
            }
            response.status.isSuccess()
        } catch (e: Exception) {
            true
        }
    }

    suspend fun updateDoctorAvailability(doctorId: String, isAvailable: Boolean): Boolean = withContext(Dispatchers.IO) {
        val idx = localDoctors.indexOfFirst { it.id == doctorId }
        if (idx >= 0) {
            localDoctors[idx] = localDoctors[idx].copy(is_available = isAvailable)
        }
        try {
            val jsonPayload = buildJsonObject {
                put("is_available", isAvailable)
            }
            val response: HttpResponse = client.patch("$SUPABASE_URL/rest/v1/doctors?id=eq.$doctorId") {
                applySupabaseHeaders()
                contentType(ContentType.Application.Json)
                setBody(jsonPayload.toString())
            }
            response.status.isSuccess()
        } catch (e: Exception) {
            true
        }
    }

    suspend fun toggleDoctorResignation(doctorId: String, isResigned: Boolean): Boolean = withContext(Dispatchers.IO) {
        val statusStr = if (isResigned) "resigned" else "active"
        val idx = localDoctors.indexOfFirst { it.id == doctorId }
        if (idx >= 0) {
            localDoctors[idx] = localDoctors[idx].copy(
                is_resigned = isResigned,
                status = statusStr,
                is_available = !isResigned
            )
        }
        try {
            val jsonPayload = buildJsonObject {
                put("is_resigned", isResigned)
                put("status", statusStr)
                put("is_available", !isResigned)
            }
            val response: HttpResponse = client.patch("$SUPABASE_URL/rest/v1/doctors?id=eq.$doctorId") {
                applySupabaseHeaders()
                contentType(ContentType.Application.Json)
                setBody(jsonPayload.toString())
            }
            response.status.isSuccess()
        } catch (e: Exception) {
            true
        }
    }

    suspend fun updateLeaveStatus(requestId: String, status: String): Boolean = withContext(Dispatchers.IO) {
        val idx = localLeaveRequests.indexOfFirst { it.id == requestId }
        if (idx >= 0) {
            localLeaveRequests[idx] = localLeaveRequests[idx].copy(status = status)
        }
        try {
            val jsonPayload = buildJsonObject {
                put("status", status)
            }
            val response: HttpResponse = client.patch("$SUPABASE_URL/rest/v1/leave_requests?id=eq.$requestId") {
                applySupabaseHeaders()
                contentType(ContentType.Application.Json)
                setBody(jsonPayload.toString())
            }
            response.status.isSuccess()
        } catch (e: Exception) {
            true
        }
    }

    suspend fun requestLeave(leaveRequest: LeaveRequest): Boolean = withContext(Dispatchers.IO) {
        localLeaveRequests.add(0, leaveRequest)
        try {
            val response: HttpResponse = client.post("$SUPABASE_URL/rest/v1/leave_requests") {
                applySupabaseHeaders()
                contentType(ContentType.Application.Json)
                setBody(json.encodeToString(leaveRequest))
            }
            response.status.isSuccess()
        } catch (e: Exception) {
            true
        }
    }

    suspend fun addReview(review: Review): Boolean = withContext(Dispatchers.IO) {
        localReviews.add(0, review)
        try {
            val response: HttpResponse = client.post("$SUPABASE_URL/rest/v1/reviews") {
                applySupabaseHeaders()
                contentType(ContentType.Application.Json)
                setBody(json.encodeToString(review))
            }
            response.status.isSuccess()
        } catch (e: Exception) {
            true
        }
    }

    suspend fun addFamilyMember(member: FamilyMember): Boolean = withContext(Dispatchers.IO) {
        val memberWithPatient = if (member.patient_id.isNullOrEmpty() || member.patient_id == "user-patient-demo") {
            member.copy(patient_id = currentUserProfile?.id ?: "pat-demo")
        } else member
        localFamilyMembers.add(memberWithPatient)
        try {
            val response: HttpResponse = client.post("$SUPABASE_URL/rest/v1/family_members") {
                applySupabaseHeaders()
                contentType(ContentType.Application.Json)
                setBody(json.encodeToString(memberWithPatient))
            }
            response.status.isSuccess()
        } catch (e: Exception) {
            true
        }
    }

    suspend fun deleteFamilyMember(memberId: String): Boolean = withContext(Dispatchers.IO) {
        localFamilyMembers.removeAll { it.id == memberId }
        try {
            val response: HttpResponse = client.delete("$SUPABASE_URL/rest/v1/family_members?id=eq.$memberId") {
                applySupabaseHeaders()
            }
            response.status.isSuccess()
        } catch (e: Exception) {
            true
        }
    }

    suspend fun registerHospitalBusiness(
        ownerName: String,
        ownerEmail: String,
        ownerPhone: String,
        ownerPassword: String,
        hospitalName: String,
        hospitalType: String,
        hospitalPhone: String,
        address: String,
        clinicalLicense: String,
        councilReg: String,
        doctorName: String,
        doctorSpecialty: String,
        doctorUsername: String,
        doctorPassword: String,
        consultationFee: Double
    ): Pair<Boolean, String> = withContext(Dispatchers.IO) {
        val hspId = "hsp-${System.currentTimeMillis()}"
        val ownerId = "user-owner-${System.currentTimeMillis()}"

        val newHsp = Hospital(
            id = hspId,
            owner_id = ownerId,
            name = hospitalName.ifEmpty { "OPD Care Clinic" },
            type = hospitalType.ifEmpty { "clinic" },
            address = address.ifEmpty { "42 Clinic St, Bengaluru" },
            phone = hospitalPhone.ifEmpty { ownerPhone },
            emergency_contact = hospitalPhone.ifEmpty { ownerPhone },
            clinical_license = clinicalLicense.ifEmpty { "CEA/KA/2026/8841" },
            council_reg = councilReg.ifEmpty { "KMC-74921-2018" },
            photo_url = "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=800&q=80",
            is_open = true,
            is_verified = true,
            verification_status = "verified",
            rating = 5.0,
            review_count = 1,
            distance_km = 1.5,
            lat = 12.9716,
            lng = 77.5946
        )

        localHospitals.add(0, newHsp)

        if (doctorName.isNotEmpty()) {
            val docId = "doc-${System.currentTimeMillis()}"
            val newDoc = Doctor(
                id = docId,
                hospital_id = hspId,
                name = doctorName,
                username = doctorUsername.ifEmpty { "DR_${doctorName.replace(" ", "_").uppercase()}" },
                password = doctorPassword.ifEmpty { "doc123" },
                specialty = doctorSpecialty.ifEmpty { "General Physician" },
                consultation_fee = consultationFee,
                avg_consult_minutes = 15,
                available_days = listOf("Mon", "Tue", "Wed", "Thu", "Fri", "Sat"),
                available_from = "09:00",
                available_to = "17:00",
                qualification = "MBBS, MD",
                experience_years = 10,
                is_available = true
            )
            localDoctors.add(0, newDoc)
        }

        val authRes = signUpWithSupabase(
            email = ownerEmail,
            password = ownerPassword,
            fullName = ownerName.ifEmpty { "Hospital Owner" },
            phone = ownerPhone,
            role = "business_owner",
            hospitalId = hspId
        )

        return@withContext authRes
    }

    suspend fun updateDoctorCredentials(doctorId: String, username: String, password: String): Boolean = withContext(Dispatchers.IO) {
        val idx = localDoctors.indexOfFirst { it.id == doctorId }
        if (idx >= 0) {
            localDoctors[idx] = localDoctors[idx].copy(username = username, password = password)
        }
        try {
            val jsonPayload = buildJsonObject {
                put("username", username)
                put("password", password)
            }
            val response: HttpResponse = client.patch("$SUPABASE_URL/rest/v1/doctors?id=eq.$doctorId") {
                applySupabaseHeaders()
                contentType(ContentType.Application.Json)
                setBody(jsonPayload.toString())
            }
            response.status.isSuccess()
        } catch (e: Exception) {
            true
        }
    }

    suspend fun getStaffAccounts(): List<StaffAccount> = withContext(Dispatchers.IO) {
        try {
            val response: HttpResponse = client.get("$SUPABASE_URL/rest/v1/staff_accounts?select=*") {
                applySupabaseHeaders()
            }
            if (response.status.isSuccess()) {
                val text = response.bodyAsText()
                val remote: List<StaffAccount> = json.decodeFromString(text)
                if (remote.isNotEmpty()) {
                    val combined = (localStaffAccounts + remote).distinctBy { it.id }
                    return@withContext combined
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
        localStaffAccounts.toList()
    }

    suspend fun createStaffAccount(account: StaffAccount): Boolean = withContext(Dispatchers.IO) {
        localStaffAccounts.add(0, account)
        try {
            val response: HttpResponse = client.post("$SUPABASE_URL/rest/v1/staff_accounts") {
                applySupabaseHeaders()
                contentType(ContentType.Application.Json)
                setBody(json.encodeToString(account))
            }
            response.status.isSuccess()
        } catch (e: Exception) {
            true
        }
    }

    suspend fun deleteStaffAccount(accountId: String): Boolean = withContext(Dispatchers.IO) {
        localStaffAccounts.removeAll { it.id == accountId }
        try {
            val response: HttpResponse = client.delete("$SUPABASE_URL/rest/v1/staff_accounts?id=eq.$accountId") {
                applySupabaseHeaders()
            }
            response.status.isSuccess()
        } catch (e: Exception) {
            true
        }
    }
}



