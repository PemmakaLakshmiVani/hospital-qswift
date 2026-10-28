package com.example.hospitalqswiftapp.ui.adapters

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.example.hospitalqswiftapp.data.Doctor
import com.example.hospitalqswiftapp.databinding.ItemDoctorBinding

class DoctorAdapter(
    private val onBookDoctorToken: (Doctor) -> Unit
) : RecyclerView.Adapter<DoctorAdapter.DoctorViewHolder>() {

    private val items = mutableListOf<Doctor>()

    fun submitList(list: List<Doctor>) {
        items.clear()
        items.addAll(list)
        notifyDataSetChanged()
    }

    inner class DoctorViewHolder(val binding: ItemDoctorBinding) : RecyclerView.ViewHolder(binding.root)

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): DoctorViewHolder {
        val binding = ItemDoctorBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return DoctorViewHolder(binding)
    }

    override fun onBindViewHolder(holder: DoctorViewHolder, position: Int) {
        val doctor = items[position]
        with(holder.binding) {
            tvDoctorName.text = doctor.name
            tvDoctorSpecialty.text = "${doctor.specialty} · ${doctor.qualification ?: "MBBS, MD"}"
            tvDoctorFee.text = "Consultation Fee: ₹${doctor.consultation_fee.toInt()}"
            tvDoctorHours.text = "⏰ ${doctor.available_from ?: "09:00 AM"} - ${doctor.available_to ?: "05:00 PM"}"
            
            if (doctor.is_resigned) {
                tvDoctorAvailBadge.text = "RESIGNED"
                tvDoctorAvailBadge.setBackgroundColor(android.graphics.Color.parseColor("#FEE2E2"))
                tvDoctorAvailBadge.setTextColor(android.graphics.Color.parseColor("#991B1B"))
                btnBookDoctorToken.isEnabled = false
                btnBookDoctorToken.text = "Doctor Resigned"
            } else if (doctor.is_available) {
                tvDoctorAvailBadge.text = "AVAILABLE"
                tvDoctorAvailBadge.setBackgroundColor(android.graphics.Color.parseColor("#DCFCE7"))
                tvDoctorAvailBadge.setTextColor(android.graphics.Color.parseColor("#15803D"))
                btnBookDoctorToken.isEnabled = true
                btnBookDoctorToken.text = "Book OPD Token for ${doctor.name}"
            } else {
                tvDoctorAvailBadge.text = "UNAVAILABLE"
                tvDoctorAvailBadge.setBackgroundColor(android.graphics.Color.parseColor("#FEF3C7"))
                tvDoctorAvailBadge.setTextColor(android.graphics.Color.parseColor("#D97706"))
                btnBookDoctorToken.isEnabled = false
                btnBookDoctorToken.text = "Doctor Unavailable"
            }

            btnBookDoctorToken.setOnClickListener { onBookDoctorToken(doctor) }
        }
    }

    override fun getItemCount(): Int = items.size
}
