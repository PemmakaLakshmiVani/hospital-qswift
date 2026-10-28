package com.example.hospitalqswiftapp.ui

import android.app.AlertDialog
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.example.hospitalqswiftapp.data.Review
import com.example.hospitalqswiftapp.data.SupabaseRepository
import com.example.hospitalqswiftapp.databinding.FragmentReviewsBinding
import com.example.hospitalqswiftapp.ui.adapters.ReviewAdapter
import kotlinx.coroutines.launch

class ReviewsFragment : Fragment() {

    private var _binding: FragmentReviewsBinding? = null
    private val binding get() = _binding!!

    private lateinit var adapter: ReviewAdapter

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentReviewsBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        adapter = ReviewAdapter()
        binding.rvReviews.layoutManager = LinearLayoutManager(requireContext())
        binding.rvReviews.adapter = adapter

        binding.btnAddReview.setOnClickListener {
            showAddReviewDialog()
        }

        loadReviews()
    }

    private fun loadReviews() {
        lifecycleScope.launch {
            val list = SupabaseRepository.getReviews()
            adapter.submitList(list)
        }
    }

    private fun showAddReviewDialog() {
        val context = requireContext()
        val layout = LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(40, 20, 40, 20)
        }

        val etComment = EditText(context).apply { hint = "Write your review & experience..." }
        layout.addView(etComment)

        AlertDialog.Builder(context)
            .setTitle("Submit OPD Experience Review")
            .setView(layout)
            .setPositiveButton("Submit") { _, _ ->
                val comment = etComment.text.toString().trim()
                if (comment.isNotEmpty()) {
                    lifecycleScope.launch {
                        val newReview = Review(
                            id = "rev-${System.currentTimeMillis()}",
                            hospital_id = "hsp-1",
                            doctor_id = "doc-101",
                            patient_name = "Lakshya Sharma",
                            rating = 5,
                            comment = comment,
                            created_at = "Just now"
                        )
                        SupabaseRepository.addReview(newReview)
                        Toast.makeText(context, "⭐ Review submitted successfully!", Toast.LENGTH_SHORT).show()
                        loadReviews()
                    }
                }
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}

