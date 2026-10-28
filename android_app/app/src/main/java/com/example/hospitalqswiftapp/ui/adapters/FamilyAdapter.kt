package com.example.hospitalqswiftapp.ui.adapters

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.example.hospitalqswiftapp.data.FamilyMember
import com.example.hospitalqswiftapp.databinding.ItemFamilyMemberBinding

class FamilyAdapter(
    private val onDeleteClick: (FamilyMember) -> Unit
) : RecyclerView.Adapter<FamilyAdapter.FamilyViewHolder>() {

    private val items = mutableListOf<FamilyMember>()

    fun submitList(list: List<FamilyMember>) {
        items.clear()
        items.addAll(list)
        notifyDataSetChanged()
    }

    inner class FamilyViewHolder(val binding: ItemFamilyMemberBinding) : RecyclerView.ViewHolder(binding.root)

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): FamilyViewHolder {
        val binding = ItemFamilyMemberBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return FamilyViewHolder(binding)
    }

    override fun onBindViewHolder(holder: FamilyViewHolder, position: Int) {
        val member = items[position]
        with(holder.binding) {
            tvFamilyName.text = member.full_name
            val ageStr = if (member.age != null) "${member.age} yrs" else ""
            tvFamilyDetails.text = "${member.relationship.replaceFirstChar { it.uppercase() }} · $ageStr · ${member.gender}"

            if (member.id == "fam-self" || member.relationship.equals("self", ignoreCase = true)) {
                btnDeleteFamily.visibility = View.GONE
                tvFamilyIcon.text = "👤"
            } else {
                btnDeleteFamily.visibility = View.VISIBLE
                tvFamilyIcon.text = if (member.relationship.equals("child", ignoreCase = true)) "👶" else "👥"
            }

            btnDeleteFamily.setOnClickListener { onDeleteClick(member) }
        }
    }

    override fun getItemCount(): Int = items.size
}
