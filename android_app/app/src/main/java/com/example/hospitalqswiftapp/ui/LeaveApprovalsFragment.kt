package com.example.hospitalqswiftapp.ui

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.example.hospitalqswiftapp.data.SupabaseRepository
import com.example.hospitalqswiftapp.databinding.FragmentLeaveBinding
import com.example.hospitalqswiftapp.ui.adapters.LeaveAdapter
import kotlinx.coroutines.launch

class LeaveApprovalsFragment : Fragment() {

    private var _binding: FragmentLeaveBinding? = null
    private val binding get() = _binding!!

    private lateinit var adapter: LeaveAdapter

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentLeaveBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        adapter = LeaveAdapter(
            onApprove = { req -> updateStatus(req.id, "approved") },
            onReject = { req -> updateStatus(req.id, "rejected") }
        )

        binding.rvLeaveRequests.layoutManager = LinearLayoutManager(requireContext())
        binding.rvLeaveRequests.adapter = adapter

        loadLeaveRequests()
    }

    private fun loadLeaveRequests() {
        lifecycleScope.launch {
            val list = SupabaseRepository.getLeaveRequests()
            adapter.submitList(list)
        }
    }

    private fun updateStatus(id: String, status: String) {
        lifecycleScope.launch {
            val success = SupabaseRepository.updateLeaveStatus(id, status)
            if (success) {
                Toast.makeText(requireContext(), "Updated leave status to ${status.uppercase()}!", Toast.LENGTH_SHORT).show()
                loadLeaveRequests()
            }
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
