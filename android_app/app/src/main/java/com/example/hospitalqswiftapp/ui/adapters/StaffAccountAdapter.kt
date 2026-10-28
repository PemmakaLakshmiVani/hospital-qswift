package com.example.hospitalqswiftapp.ui.adapters

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.example.hospitalqswiftapp.data.StaffAccount
import com.example.hospitalqswiftapp.databinding.ItemStaffAccountBinding

class StaffAccountAdapter(
    private val onRemove: (StaffAccount) -> Unit
) : RecyclerView.Adapter<StaffAccountAdapter.StaffViewHolder>() {

    private var list = listOf<StaffAccount>()

    fun submitList(newList: List<StaffAccount>) {
        list = newList
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): StaffViewHolder {
        val binding = ItemStaffAccountBinding.inflate(
            LayoutInflater.from(parent.context), parent, false
        )
        return StaffViewHolder(binding)
    }

    override fun onBindViewHolder(holder: StaffViewHolder, position: Int) {
        holder.bind(list[position])
    }

    override fun getItemCount(): Int = list.size

    inner class StaffViewHolder(private val binding: ItemStaffAccountBinding) :
        RecyclerView.ViewHolder(binding.root) {

        fun bind(staff: StaffAccount) {
            binding.tvStaffName.text = staff.staff_name
            binding.tvStaffUsername.text = "Operator Username: ${staff.username}"
            binding.tvStaffPassword.text = "Password: •••••••• (${staff.password})"
            binding.tvAssignedDoctor.text = if (staff.doctor_id != null) "Assigned Desk: ${staff.doctor_id}" else "Assigned Desk: All Doctor Desks"

            binding.btnRemoveStaffAccount.setOnClickListener {
                onRemove(staff)
            }
        }
    }
}
