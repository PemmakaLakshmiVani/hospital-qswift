package com.example.hospitalqswiftapp.ui.adapters

import android.graphics.Color
import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.core.content.ContextCompat
import androidx.recyclerview.widget.RecyclerView
import com.example.hospitalqswiftapp.R
import com.example.hospitalqswiftapp.data.Doctor
import com.example.hospitalqswiftapp.databinding.ItemDoctorRosterBinding

class DoctorRosterAdapter(
    private val onToggleStatus: (Doctor) -> Unit,
    private val onEditCreds: (Doctor) -> Unit
) : RecyclerView.Adapter<DoctorRosterAdapter.DoctorViewHolder>() {

    private var list = listOf<Doctor>()

    fun submitList(newList: List<Doctor>) {
        list = newList
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): DoctorViewHolder {
        val binding = ItemDoctorRosterBinding.inflate(
            LayoutInflater.from(parent.context), parent, false
        )
        return DoctorViewHolder(binding)
    }

    override fun onBindViewHolder(holder: DoctorViewHolder, position: Int) {
        holder.bind(list[position])
    }

    override fun getItemCount(): Int = list.size

    inner class DoctorViewHolder(private val binding: ItemDoctorRosterBinding) :
        RecyclerView.ViewHolder(binding.root) {

        fun bind(doctor: Doctor) {
            binding.tvDoctorName.text = doctor.name
            binding.tvDoctorSpecialty.text = "${doctor.qualification} · ${doctor.specialty}"
            binding.tvConsultFee.text = "₹${doctor.consultation_fee.toInt()}"
            binding.tvAvgConsultMinutes.text = "${doctor.avg_consult_minutes} mins"
            binding.tvDoctorHours.text = "${doctor.available_from} - ${doctor.available_to}"
            binding.tvDoctorUsername.text = "Login ID: ${doctor.username?.ifEmpty { "DR_DEFAULT" } ?: "DR_DEFAULT"}"
            binding.tvDoctorPassword.text = "Password: ${doctor.password?.ifEmpty { "doc123" } ?: "doc123"}"

            when {
                doctor.is_resigned -> {
                    binding.tvDoctorStatusBadge.text = "🔴 Resigned"
                    binding.tvDoctorStatusBadge.setBackgroundResource(R.drawable.bg_badge_red)
                    binding.tvDoctorStatusBadge.setTextColor(Color.parseColor("#991B1B"))
                }
                !doctor.is_available -> {
                    binding.tvDoctorStatusBadge.text = "🟡 Away / Off Duty"
                    binding.tvDoctorStatusBadge.setBackgroundResource(R.drawable.bg_badge_amber)
                    binding.tvDoctorStatusBadge.setTextColor(Color.parseColor("#92400E"))
                }
                else -> {
                    binding.tvDoctorStatusBadge.text = "🟢 Available"
                    binding.tvDoctorStatusBadge.setBackgroundResource(R.drawable.bg_badge_green)
                    binding.tvDoctorStatusBadge.setTextColor(Color.parseColor("#065F46"))
                }
            }

            binding.btnToggleDoctorStatus.setOnClickListener {
                onToggleStatus(doctor)
            }

            binding.btnEditDoctorCreds.setOnClickListener {
                onEditCreds(doctor)
            }
        }
    }
}
