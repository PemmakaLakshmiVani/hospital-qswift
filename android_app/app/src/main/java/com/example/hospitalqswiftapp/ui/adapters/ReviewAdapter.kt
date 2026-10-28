package com.example.hospitalqswiftapp.ui.adapters

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.example.hospitalqswiftapp.data.Review
import com.example.hospitalqswiftapp.databinding.ItemReviewBinding

class ReviewAdapter : RecyclerView.Adapter<ReviewAdapter.ReviewViewHolder>() {

    private val items = mutableListOf<Review>()

    fun submitList(list: List<Review>) {
        items.clear()
        items.addAll(list)
        notifyDataSetChanged()
    }

    inner class ReviewViewHolder(val binding: ItemReviewBinding) : RecyclerView.ViewHolder(binding.root)

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ReviewViewHolder {
        val binding = ItemReviewBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return ReviewViewHolder(binding)
    }

    override fun onBindViewHolder(holder: ReviewViewHolder, position: Int) {
        val review = items[position]
        with(holder.binding) {
            tvReviewerName.text = review.patient_name
            tvReviewRating.text = "★ ${review.rating}.0"
            tvReviewComment.text = review.comment ?: "Great OPD experience!"

            if (!review.response.isNullOrEmpty()) {
                tvClinicResponse.visibility = View.VISIBLE
                tvClinicResponse.text = "Clinic Response: ${review.response}"
            } else {
                tvClinicResponse.visibility = View.GONE
            }
        }
    }

    override fun getItemCount(): Int = items.size
}
