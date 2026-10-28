package com.example.hospitalqswiftapp.ui.adapters

import android.graphics.Color
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.example.hospitalqswiftapp.data.Doctor
import com.example.hospitalqswiftapp.data.Hospital
import com.example.hospitalqswiftapp.data.QueueToken
import com.example.hospitalqswiftapp.databinding.ItemVisitHistoryBinding

class HistoryAdapter(
    private val doctors: List<Doctor>,
    private val hospitals: List<Hospital>,
    private val onReviewClick: (QueueToken) -> Unit
) : RecyclerView.Adapter<HistoryAdapter.HistoryViewHolder>() {

    private val items = mutableListOf<QueueToken>()

    fun submitList(list: List<QueueToken>) {
        items.clear()
        items.addAll(list)
        notifyDataSetChanged()
    }

    inner class HistoryViewHolder(val binding: ItemVisitHistoryBinding) : RecyclerView.ViewHolder(binding.root)

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): HistoryViewHolder {
        val binding = ItemVisitHistoryBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return HistoryViewHolder(binding)
    }

    override fun onBindViewHolder(holder: HistoryViewHolder, position: Int) {
        val token = items[position]
        val doctor = doctors.find { it.id == token.doctor_id }
        val hospital = hospitals.find { it.id == token.hospital_id }

        with(holder.binding) {
            tvHistoryTokenNum.text = "#${String.format("%02d", token.token_number)}"
            tvHistoryDate.text = token.queue_date.ifEmpty { "Recently" }
            tvHistoryDoctorName.text = "🩺 ${doctor?.name ?: "Doctor"} (${doctor?.specialty ?: "General"})"
            tvHistoryHospitalName.text = "🏥 ${hospital?.name ?: "OPD Clinic"}"
            tvHistoryPatientName.text = "Patient: ${token.patient_name}"

            if (token.status.equals("done", ignoreCase = true)) {
                tvHistoryStatusBadge.text = "Completed"
                tvHistoryStatusBadge.setTextColor(Color.parseColor("#03543F"))
                tvHistoryStatusBadge.setBackgroundColor(Color.parseColor("#DEF7EC"))
                btnWriteHistoryReview.visibility = View.VISIBLE
            } else if (token.status.equals("cancelled", ignoreCase = true)) {
                tvHistoryStatusBadge.text = "Cancelled"
                tvHistoryStatusBadge.setTextColor(Color.parseColor("#9B1C1C"))
                tvHistoryStatusBadge.setBackgroundColor(Color.parseColor("#FDE8E8"))
                btnWriteHistoryReview.visibility = View.GONE
            } else {
                tvHistoryStatusBadge.text = "No-Show"
                tvHistoryStatusBadge.setTextColor(Color.parseColor("#92400E"))
                tvHistoryStatusBadge.setBackgroundColor(Color.parseColor("#FEF3C7"))
                btnWriteHistoryReview.visibility = View.GONE
            }

            btnWriteHistoryReview.setOnClickListener { onReviewClick(token) }
        }
    }

    override fun getItemCount(): Int = items.size
}
