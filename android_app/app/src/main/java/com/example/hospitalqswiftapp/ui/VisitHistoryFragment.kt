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
import com.example.hospitalqswiftapp.data.Doctor
import com.example.hospitalqswiftapp.data.Hospital
import com.example.hospitalqswiftapp.data.QueueToken
import com.example.hospitalqswiftapp.data.Review
import com.example.hospitalqswiftapp.data.SupabaseRepository
import com.example.hospitalqswiftapp.databinding.FragmentVisitHistoryBinding
import com.example.hospitalqswiftapp.ui.adapters.HistoryAdapter
import kotlinx.coroutines.launch

class VisitHistoryFragment : Fragment() {

    private var _binding: FragmentVisitHistoryBinding? = null
    private val binding get() = _binding!!

    private var doctors = listOf<Doctor>()
    private var hospitals = listOf<Hospital>()
    private lateinit var adapter: HistoryAdapter

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentVisitHistoryBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        val mainActivity = activity as? com.example.hospitalqswiftapp.MainActivity
        val user = mainActivity?.currentUserName

        binding.btnRequireSignIn.setOnClickListener {
            mainActivity?.showSignInDialog()
        }

        if (user == null) {
            binding.rvVisitHistory.visibility = View.GONE
            binding.containerLoginRequired.visibility = View.VISIBLE
        } else {
            binding.rvVisitHistory.visibility = View.VISIBLE
            binding.containerLoginRequired.visibility = View.GONE
            loadHistory(user)
        }
    }

    private fun loadHistory(userName: String) {
        lifecycleScope.launch {
            doctors = SupabaseRepository.getDoctors()
            hospitals = SupabaseRepository.getHospitals()
            val tokens = SupabaseRepository.getQueueTokens()
            val currProf = SupabaseRepository.currentUserProfile
            val userId = currProf?.id
            val history = tokens.filter { tok ->
                (tok.status == "done" || tok.status == "cancelled" || tok.status == "no_show") &&
                ((userId != null && tok.patient_id == userId) ||
                 tok.patient_name.equals(userName, ignoreCase = true) ||
                 (currProf?.full_name != null && tok.patient_name.equals(currProf.full_name, ignoreCase = true)))
            }

            adapter = HistoryAdapter(doctors, hospitals) { token ->
                showReviewDialog(token)
            }

            binding.rvVisitHistory.layoutManager = LinearLayoutManager(requireContext())
            binding.rvVisitHistory.adapter = adapter
            adapter.submitList(history)
        }
    }

    private fun showReviewDialog(token: QueueToken) {
        val context = requireContext()
        val layout = LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(40, 20, 40, 20)
        }

        val etComment = EditText(context).apply {
            hint = "Write your review for doctor consultation..."
        }
        layout.addView(etComment)

        AlertDialog.Builder(context)
            .setTitle("Rate Consultation (${token.patient_name})")
            .setView(layout)
            .setPositiveButton("Submit Review") { _, _ ->
                val comment = etComment.text.toString().trim()
                if (comment.isNotEmpty()) {
                    lifecycleScope.launch {
                        val newReview = Review(
                            id = "rev-${System.currentTimeMillis()}",
                            hospital_id = token.hospital_id,
                            doctor_id = token.doctor_id,
                            patient_name = token.patient_name,
                            rating = 5,
                            comment = comment,
                            created_at = "Just now"
                        )
                        SupabaseRepository.addReview(newReview)
                        Toast.makeText(context, "⭐ Review submitted successfully!", Toast.LENGTH_SHORT).show()
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
