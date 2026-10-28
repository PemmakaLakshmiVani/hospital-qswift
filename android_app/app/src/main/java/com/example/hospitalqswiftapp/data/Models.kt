package com.example.hospitalqswiftapp.data

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class Hospital(
    val id: String = "",
    val owner_id: String? = null,
    val name: String = "",
    val type: String = "clinic",
    val address: String = "",
    val lat: Double = 0.0,
    val lng: Double = 0.0,
    val photo_url: String? = null,
    val is_open: Boolean = true,
    val is_verified: Boolean = true,
    val verification_status: String = "verified",
    val clinical_license: String? = null,
    val council_reg: String? = null,
    val phone: String? = null,
    val emergency_contact: String? = null,
    val rating: Double = 4.8,
    val review_count: Int = 100,
    val distance_km: Double = 1.2,
    val open_time: String? = "08:00",
    val close_time: String? = "20:00",
    val closed_days: List<String> = listOf("Sun"),
    val closed_from: String? = null,
    val closed_to: String? = null,
    val is_24_7: Boolean = false,
    val is_deleted: Boolean = false
) {
    fun isClosedToday(dateStr: String = java.time.LocalDate.now().toString()): Boolean {
        if (!is_open) return true

        if (!closed_from.isNullOrEmpty() && !closed_to.isNullOrEmpty()) {
            if (dateStr >= closed_from && dateStr <= closed_to) {
                return true
            }
        }

        val cal = java.util.Calendar.getInstance()
        val dayNames = arrayOf("Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat")
        val dayAbbr = dayNames[cal.get(java.util.Calendar.DAY_OF_WEEK) - 1]
        return closed_days.any { it.equals(dayAbbr, ignoreCase = true) }
    }

    fun isCurrentlyOpen(): Boolean {
        if (is_deleted) return false
        if (!is_open) return false
        if (isClosedToday()) return false
        if (is_24_7) return true

        val cal = java.util.Calendar.getInstance()
        val currentHours = String.format("%02d", cal.get(java.util.Calendar.HOUR_OF_DAY))
        val currentMinutes = String.format("%02d", cal.get(java.util.Calendar.MINUTE))
        val currentTimeStr = "$currentHours:$currentMinutes"

        val openTimeStr = open_time ?: "08:00"
        val closeTimeStr = close_time ?: "20:00"

        return currentTimeStr in openTimeStr..closeTimeStr
    }
}

@Serializable
data class Doctor(
    val id: String = "",
    val hospital_id: String = "",
    val name: String = "",
    val specialty: String = "",
    val consultation_fee: Double = 500.0,
    val avg_consult_minutes: Int = 15,
    val available_days: List<String> = listOf("Mon", "Tue", "Wed", "Thu", "Fri", "Sat"),
    val available_from: String? = "09:00",
    val available_to: String? = "17:00",
    val qualification: String? = null,
    val experience_years: Int = 5,
    val is_available: Boolean = true,
    val is_resigned: Boolean = false,
    val status: String = "active",
    val username: String? = null,
    val password: String? = null
)

@Serializable
data class QueueToken(
    val id: String = "",
    val hospital_id: String = "",
    val doctor_id: String = "",
    val patient_id: String? = null,
    val family_member_id: String? = null,
    val patient_name: String = "",
    val token_number: Int = 1,
    val status: String = "waiting", // waiting | serving | done | cancelled | no_show
    val is_priority: Boolean = false,
    val priority_reason: String? = null,
    val queue_date: String = "",
    val booking_type: String = "on_the_spot",
    val joined_at: String? = null,
    val called_at: String? = null,
    val completed_at: String? = null
)

@Serializable
data class Review(
    val id: String = "",
    val hospital_id: String = "",
    val doctor_id: String? = null,
    val patient_id: String? = null,
    val patient_name: String = "Anonymous Patient",
    val rating: Int = 5,
    val comment: String? = null,
    val response: String? = null,
    val created_at: String? = null
)

@Serializable
data class LeaveRequest(
    val id: String = "",
    val doctor_id: String = "",
    val hospital_id: String = "",
    val doctor_name: String = "",
    val specialty: String? = null,
    val from_date: String = "",
    val to_date: String = "",
    val reason: String? = null,
    val status: String = "pending", // pending | approved | rejected
    val requested_at: String? = null
)

@Serializable
data class FamilyMember(
    val id: String = "",
    val patient_id: String? = null,
    val full_name: String = "",
    val relationship: String = "other",
    val age: Int? = null,
    val gender: String = "N/A"
)

@Serializable
data class Profile(
    val id: String = "",
    val full_name: String? = null,
    val email: String? = null,
    val phone: String? = null,
    val role: String = "patient",
    val hospital_id: String? = null,
    val blood_group: String? = null,
    val emergency_contact: String? = null,
    val medical_notes: String? = null
)

@Serializable
data class StaffAccount(
    val id: String = "",
    val hospital_id: String = "",
    val doctor_id: String? = null,
    val staff_name: String = "",
    val username: String = "",
    val password: String = ""
)


