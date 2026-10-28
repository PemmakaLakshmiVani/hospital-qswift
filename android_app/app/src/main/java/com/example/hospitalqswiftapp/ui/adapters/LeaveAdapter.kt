package com.example.hospitalqswiftapp.ui.adapters

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.example.hospitalqswiftapp.data.LeaveRequest
import com.example.hospitalqswiftapp.databinding.ItemLeaveRequestBinding

class LeaveAdapter(
    private val onApprove: (LeaveRequest) -> Unit,
    private val onReject: (LeaveRequest) -> Unit
) : RecyclerView.Adapter<LeaveAdapter.LeaveViewHolder>() {

    private val items = mutableListOf<LeaveRequest>()

    fun submitList(list: List<LeaveRequest>) {
        items.clear()
        items.addAll(list)
        notifyDataSetChanged()
    }

    inner class LeaveViewHolder(val binding: ItemLeaveRequestBinding) : RecyclerView.ViewHolder(binding.root)

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): LeaveViewHolder {
        val binding = ItemLeaveRequestBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return LeaveViewHolder(binding)
    }

    override fun onBindViewHolder(holder: LeaveViewHolder, position: Int) {
        val req = items[position]
        with(holder.binding) {
            tvLeaveDocName.text = req.doctor_name
            tvLeaveDates.text = "Dates: ${req.from_date} to ${req.to_date}"
            tvLeaveReason.text = "Reason: ${req.reason ?: "Personal Leave"}"
            tvLeaveStatus.text = req.status.uppercase()

            btnApproveLeave.setOnClickListener { onApprove(req) }
            btnRejectLeave.setOnClickListener { onReject(req) }
        }
    }

    override fun getItemCount(): Int = items.size
}
