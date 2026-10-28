package com.example.hospitalqswiftapp.ui.adapters

import android.graphics.Color
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.example.hospitalqswiftapp.data.QueueToken
import com.example.hospitalqswiftapp.databinding.ItemQueueTokenBinding

class QueueTokenAdapter(
    private val onCall: (QueueToken) -> Unit = {},
    private val onDone: (QueueToken) -> Unit = {},
    private val onNoShow: (QueueToken) -> Unit = {}
) : RecyclerView.Adapter<QueueTokenAdapter.QueueTokenViewHolder>() {

    private val items = mutableListOf<QueueToken>()

    fun submitList(list: List<QueueToken>) {
        items.clear()
        items.addAll(list)
        notifyDataSetChanged()
    }

    inner class QueueTokenViewHolder(val binding: ItemQueueTokenBinding) : RecyclerView.ViewHolder(binding.root)

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): QueueTokenViewHolder {
        val binding = ItemQueueTokenBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return QueueTokenViewHolder(binding)
    }

    override fun onBindViewHolder(holder: QueueTokenViewHolder, position: Int) {
        val token = items[position]
        with(holder.binding) {
            tvItemTokenNum.text = "#${String.format("%02d", token.token_number)}"
            tvItemPatientName.text = token.patient_name
            
            if (token.is_priority) {
                tvItemPriority.visibility = View.VISIBLE
                tvItemPriority.text = "🚨 ${token.priority_reason ?: "Priority Senior Citizen"}"
            } else {
                tvItemPriority.visibility = View.GONE
            }

            tvItemStatus.text = token.status.uppercase()
            when (token.status.lowercase()) {
                "serving" -> {
                    tvItemStatus.setTextColor(Color.parseColor("#15803D"))
                    tvItemStatus.setBackgroundColor(Color.parseColor("#DCFCE7"))
                    btnItemCall.visibility = View.GONE
                    btnItemDone.visibility = View.VISIBLE
                    btnItemNoShow.visibility = View.VISIBLE
                }
                "done" -> {
                    tvItemStatus.setTextColor(Color.parseColor("#475569"))
                    tvItemStatus.setBackgroundColor(Color.parseColor("#F1F5F9"))
                    btnItemCall.visibility = View.GONE
                    btnItemDone.visibility = View.GONE
                    btnItemNoShow.visibility = View.GONE
                }
                "no_show", "cancelled" -> {
                    tvItemStatus.setTextColor(Color.parseColor("#DC2626"))
                    tvItemStatus.setBackgroundColor(Color.parseColor("#FEE2E2"))
                    btnItemCall.visibility = View.VISIBLE
                    btnItemDone.visibility = View.GONE
                    btnItemNoShow.visibility = View.GONE
                }
                else -> { // waiting
                    tvItemStatus.setTextColor(Color.parseColor("#D97706"))
                    tvItemStatus.setBackgroundColor(Color.parseColor("#FEF3C7"))
                    btnItemCall.visibility = View.VISIBLE
                    btnItemDone.visibility = View.VISIBLE
                    btnItemNoShow.visibility = View.VISIBLE
                }
            }

            btnItemCall.setOnClickListener { onCall(token) }
            btnItemDone.setOnClickListener { onDone(token) }
            btnItemNoShow.setOnClickListener { onNoShow(token) }
        }
    }

    override fun getItemCount(): Int = items.size
}
