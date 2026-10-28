package com.example.hospitalqswiftapp.ui

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.example.hospitalqswiftapp.data.Doctor
import com.example.hospitalqswiftapp.data.LeaveRequest
import com.example.hospitalqswiftapp.data.SupabaseRepository
import com.example.hospitalqswiftapp.databinding.FragmentDoctorProfileBinding
import com.example.hospitalqswiftapp.ui.adapters.LeaveAdapter
import kotlinx.coroutines.launch

class DoctorProfileFragment : Fragment() {

    private var _binding: FragmentDoctorProfileBinding? = null
    private val binding get() = _binding!!

    private lateinit var leaveAdapter: LeaveAdapter
    private var currentDoctor: Doctor? = null

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentDoctorProfileBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        leaveAdapter = LeaveAdapter(onApprove = {}, onReject = {})
        binding.rvPersonalLeaves.layoutManager = LinearLayoutManager(requireContext())
        binding.rvPersonalLeaves.adapter = leaveAdapter

        val mainActivity = activity as? com.example.hospitalqswiftapp.MainActivity
        val doctorName = mainActivity?.currentUserName ?: "Dr. Meera Rao"

        lifecycleScope.launch {
            val docs = SupabaseRepository.getDoctors()
            currentDoctor = docs.firstOrNull { it.name.contains(doctorName, ignoreCase = true) } ?: docs.firstOrNull()

            currentDoctor?.let { doc ->
                binding.tvDocProfileName.text = doc.name
                binding.tvDocProfileSub.text = "${doc.qualification} · ${doc.specialty}"
                binding.tvDocDetailFee.text = "Consultation Fee: ₹${doc.consultation_fee.toInt()}"
                binding.tvDocDetailDuration.text = "Avg Consult Duration: ${doc.avg_consult_minutes} mins"
                binding.tvDocDetailHours.text = "OPD Hours: ${doc.available_from} - ${doc.available_to}"
                binding.tvDocDetailCreds.text = "Username: ${doc.username} | Password: ${doc.password}"

                updateDutyButtonsUI(doc.is_available)
            }

            loadLeaves()
        }

        binding.btnDutyAvailable.setOnClickListener {
            currentDoctor?.let { doc ->
                lifecycleScope.launch {
                    SupabaseRepository.updateDoctorAvailability(doc.id, true)
                    updateDutyButtonsUI(true)
                    Toast.makeText(requireContext(), "🟢 Marked ${doc.name} as ON DUTY / AVAILABLE!", Toast.LENGTH_SHORT).show()
                }
            }
        }

        binding.btnDutyOff.setOnClickListener {
            currentDoctor?.let { doc ->
                lifecycleScope.launch {
                    SupabaseRepository.updateDoctorAvailability(doc.id, false)
                    updateDutyButtonsUI(false)
                    Toast.makeText(requireContext(), "🔴 Marked ${doc.name} as OFF DUTY / AWAY!", Toast.LENGTH_SHORT).show()
                }
            }
        }

        binding.btnSubmitDoctorLeave.setOnClickListener {
            val reason = binding.etLeaveReason.text.toString().trim()
            val from = binding.etLeaveFromDate.text.toString().trim()
            val to = binding.etLeaveToDate.text.toString().trim()

            if (reason.isEmpty() || from.isEmpty()) {
                Toast.makeText(requireContext(), "Please enter leave reason and date", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            lifecycleScope.launch {
                val doc = currentDoctor
                val newLeave = LeaveRequest(
                    id = "leave-${System.currentTimeMillis()}",
                    doctor_id = doc?.id ?: "doc-101",
                    hospital_id = doc?.hospital_id ?: "hsp-1",
                    doctor_name = doc?.name ?: doctorName,
                    specialty = doc?.specialty ?: "General Physician",
                    from_date = from,
                    to_date = if (to.isNotEmpty()) to else from,
                    reason = reason,
                    status = "pending"
                )
                SupabaseRepository.requestLeave(newLeave)
                Toast.makeText(requireContext(), "✅ Leave request submitted for Owner approval!", Toast.LENGTH_LONG).show()
                binding.etLeaveReason.text.clear()
                binding.etLeaveFromDate.text.clear()
                binding.etLeaveToDate.text.clear()
                loadLeaves()
            }
        }
    }

    private fun updateDutyButtonsUI(isAvailable: Boolean) {
        if (isAvailable) {
            binding.btnDutyAvailable.alpha = 1.0f
            binding.btnDutyOff.alpha = 0.5f
        } else {
            binding.btnDutyAvailable.alpha = 0.5f
            binding.btnDutyOff.alpha = 1.0f
        }
    }

    private fun loadLeaves() {
        lifecycleScope.launch {
            val leaves = SupabaseRepository.getLeaveRequests()
            val docId = currentDoctor?.id ?: "doc-101"
            val myLeaves = leaves.filter { it.doctor_id == docId || it.doctor_name == (currentDoctor?.name ?: "") }
            leaveAdapter.submitList(myLeaves)
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
