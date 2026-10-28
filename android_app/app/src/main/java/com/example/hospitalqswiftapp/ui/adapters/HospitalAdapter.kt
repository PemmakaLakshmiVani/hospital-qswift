package com.example.hospitalqswiftapp.ui.adapters

import android.graphics.Color
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import com.example.hospitalqswiftapp.data.Doctor
import com.example.hospitalqswiftapp.data.Hospital
import com.example.hospitalqswiftapp.data.QueueToken
import com.example.hospitalqswiftapp.databinding.ItemHospitalBinding

class HospitalAdapter(
    private val onBookClick: (Hospital) -> Unit
) : RecyclerView.Adapter<HospitalAdapter.HospitalViewHolder>() {

    private val hospitals = mutableListOf<Hospital>()
    private val doctors = mutableListOf<Doctor>()
    private val tokens = mutableListOf<QueueToken>()

    fun setData(hList: List<Hospital>, dList: List<Doctor>, tList: List<QueueToken>) {
        hospitals.clear()
        hospitals.addAll(hList)
        doctors.clear()
        doctors.addAll(dList)
        tokens.clear()
        tokens.addAll(tList)
        notifyDataSetChanged()
    }

    inner class HospitalViewHolder(val binding: ItemHospitalBinding) : RecyclerView.ViewHolder(binding.root)

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): HospitalViewHolder {
        val binding = ItemHospitalBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return HospitalViewHolder(binding)
    }

    override fun onBindViewHolder(holder: HospitalViewHolder, position: Int) {
        val hospital = hospitals[position]
        with(holder.binding) {
            tvHospitalName.text = hospital.name
            tvAddress.text = hospital.address
            tvPhone.text = "📞 ${hospital.phone ?: "+91 80 4112 8800"}"
            tvTypeBadge.text = (hospital.type ?: "clinic").uppercase()
            tvRating.text = "⭐ ${hospital.rating} (${hospital.review_count})"
            tvDistance.text = "📍 ${hospital.distance_km} km away"

            // Open / Closed Badge (Synchronized with Website logic)
            val isOpen = hospital.isCurrentlyOpen()
            val isClosedAllDay = hospital.isClosedToday()

            if (isOpen) {
                tvOpenBadge.text = "● OPEN NOW"
                tvOpenBadge.setTextColor(Color.parseColor("#15803D"))
                tvOpenBadge.setBackgroundColor(Color.parseColor("#DCFCE7"))
            } else if (isClosedAllDay) {
                tvOpenBadge.text = "🔴 CLOSED TODAY"
                tvOpenBadge.setTextColor(Color.parseColor("#B91C1C"))
                tvOpenBadge.setBackgroundColor(Color.parseColor("#FEE2E2"))
            } else {
                tvOpenBadge.text = "🔴 CLOSED NOW"
                tvOpenBadge.setTextColor(Color.parseColor("#B91C1C"))
                tvOpenBadge.setBackgroundColor(Color.parseColor("#FEE2E2"))
            }

            // Specialties list
            val hospitalDoctors = doctors.filter { it.hospital_id == hospital.id && !it.is_resigned }
            val specs = hospitalDoctors.map { it.specialty }.distinct()
            if (specs.isNotEmpty()) {
                tvSpecialties.text = specs.joinToString(" · ")
                tvSpecialties.visibility = View.VISIBLE
            } else {
                tvSpecialties.text = "General Physician · Pediatrics"
                tvSpecialties.visibility = View.VISIBLE
            }

            // Live OPD Doctor Snippet Box (Section 3 Requirement)
            val primaryDoctor = hospitalDoctors.firstOrNull()
            if (primaryDoctor != null) {
                layoutDoctorSnippet.visibility = View.VISIBLE
                tvDoctorSnippetName.text = "⚡ ${primaryDoctor.name} (${primaryDoctor.specialty})"

                val docTokens = tokens.filter { it.doctor_id == primaryDoctor.id }
                val servingTok = docTokens.find { it.status == "serving" }
                val servingNum = servingTok?.token_number ?: 14
                val waitingCount = docTokens.count { it.status == "waiting" }
                val estWaitMins = if (waitingCount > 0) waitingCount * primaryDoctor.avg_consult_minutes else 15

                tvServingTokenSnippet.text = "Token #$servingNum serving"
                tvWaitTimeSnippet.text = "~$estWaitMins min wait"
            } else {
                layoutDoctorSnippet.visibility = View.GONE
            }

            // Load Hospital Image via Glide
            val photoUrl = hospital.photo_url ?: "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=800&q=80"
            Glide.with(ivHospitalPhoto.context)
                .load(photoUrl)
                .centerCrop()
                .into(ivHospitalPhoto)

            root.setOnClickListener { onBookClick(hospital) }
            btnBookToken.setOnClickListener { onBookClick(hospital) }
        }
    }

    override fun getItemCount(): Int = hospitals.size
}
