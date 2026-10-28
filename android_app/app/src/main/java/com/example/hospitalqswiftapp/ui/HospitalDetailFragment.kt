package com.example.hospitalqswiftapp.ui

import android.app.AlertDialog
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ArrayAdapter
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.bumptech.glide.Glide
import com.example.hospitalqswiftapp.data.Doctor
import com.example.hospitalqswiftapp.data.Hospital
import com.example.hospitalqswiftapp.data.QueueToken
import com.example.hospitalqswiftapp.data.SupabaseRepository
import com.example.hospitalqswiftapp.databinding.DialogIssueTokenBinding
import com.example.hospitalqswiftapp.databinding.FragmentHospitalDetailBinding
import com.example.hospitalqswiftapp.ui.adapters.DoctorAdapter
import kotlinx.coroutines.launch

class HospitalDetailFragment : Fragment() {

    private var _binding: FragmentHospitalDetailBinding? = null
    private val binding get() = _binding!!

    private lateinit var doctorAdapter: DoctorAdapter
    private var selectedHospital: Hospital? = null

    companion object {
        fun newInstance(hospital: Hospital): HospitalDetailFragment {
            val fragment = HospitalDetailFragment()
            fragment.selectedHospital = hospital
            return fragment
        }
    }

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentHospitalDetailBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        binding.btnBack.setOnClickListener {
            requireActivity().supportFragmentManager.popBackStack()
        }

        selectedHospital?.let { hsp ->
            binding.tvDetailHospitalName.text = hsp.name
            binding.tvDetailAddress.text = hsp.address
            binding.tvDetailLicense.text = "License: ${hsp.clinical_license ?: "CEA/KA/2026/8841"} · Council: ${hsp.council_reg ?: "KMC-74921-2018"}"

            if (!hsp.photo_url.isNullOrEmpty()) {
                Glide.with(requireContext()).load(hsp.photo_url).into(binding.ivDetailPhoto)
            }
        }

        doctorAdapter = DoctorAdapter { doctor ->
            showIssueTokenDialog(doctor)
        }

        binding.rvDetailDoctors.layoutManager = LinearLayoutManager(requireContext())
        binding.rvDetailDoctors.adapter = doctorAdapter

        loadHospitalDoctors()
    }

    private fun loadHospitalDoctors() {
        lifecycleScope.launch {
            val allDoctors = SupabaseRepository.getDoctors()
            val hspId = selectedHospital?.id
            val filtered = if (hspId != null) {
                allDoctors.filter { it.hospital_id == hspId || it.hospital_id.startsWith("a111") }
            } else {
                allDoctors
            }
            doctorAdapter.submitList(if (filtered.isNotEmpty()) filtered else allDoctors)
        }
    }

    private fun showIssueTokenDialog(doctor: Doctor) {
        val mainActivity = activity as? com.example.hospitalqswiftapp.MainActivity
        if (mainActivity?.currentUserName == null) {
            Toast.makeText(requireContext(), "🔒 Please sign in to book an OPD token", Toast.LENGTH_SHORT).show()
            mainActivity?.showSignInDialog()
            return
        }

        val currentUser = mainActivity.currentUserName ?: "Patient User"
        val dialogBinding = DialogIssueTokenBinding.inflate(layoutInflater)
        val dialog = AlertDialog.Builder(requireContext())
            .setView(dialogBinding.root)
            .create()

        dialogBinding.tvDialogSub.text = "Booking OPD Token for ${doctor.name} (${doctor.specialty})"
        dialogBinding.etPatientName.setText(currentUser)

        lifecycleScope.launch {
            val savedMembers = SupabaseRepository.getFamilyMembers()
            val familyOptions = mutableListOf("$currentUser (Self)")
            savedMembers.forEach { m ->
                if (m.relationship != "self" && m.full_name.isNotEmpty()) {
                    familyOptions.add("${m.full_name} (${m.relationship})")
                }
            }
            val spinnerAdapter = ArrayAdapter(requireContext(), android.R.layout.simple_spinner_item, familyOptions)
            spinnerAdapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
            dialogBinding.spFamilyMember.adapter = spinnerAdapter
        }

        dialogBinding.btnConfirmBooking.setOnClickListener {
            val patientName = dialogBinding.etPatientName.text.toString().ifEmpty { currentUser }
            val isPriority = dialogBinding.cbPriority.isChecked
            val priorityReason = if (isPriority) dialogBinding.etPriorityReason.text.toString() else null

            lifecycleScope.launch {
                val existingTokens = SupabaseRepository.getQueueTokens()
                val nextTokenNum = (existingTokens.filter { it.doctor_id == doctor.id }.maxOfOrNull { it.token_number } ?: 0) + 1
                val patientId = SupabaseRepository.currentUserProfile?.id ?: "user-${System.currentTimeMillis()}"

                val newToken = QueueToken(
                    id = "tok-${System.currentTimeMillis()}",
                    hospital_id = doctor.hospital_id.ifEmpty { selectedHospital?.id ?: "hsp-1" },
                    doctor_id = doctor.id,
                    patient_id = patientId,
                    patient_name = patientName,
                    token_number = nextTokenNum,
                    status = "waiting",
                    is_priority = isPriority,
                    priority_reason = priorityReason,
                    queue_date = java.time.LocalDate.now().toString(),
                    booking_type = "on_the_spot"
                )

                val success = SupabaseRepository.issueQueueToken(newToken)
                if (success) {
                    Toast.makeText(requireContext(), "✅ OPD Token #$nextTokenNum Issued for ${doctor.name}!", Toast.LENGTH_LONG).show()
                    dialog.dismiss()
                    showTokenSlipDialog(newToken, doctor)
                } else {
                    Toast.makeText(requireContext(), "⚠️ Failed to issue token to database", Toast.LENGTH_SHORT).show()
                }
            }
        }

        dialog.show()
    }

    private fun showTokenSlipDialog(token: QueueToken, doctor: Doctor) {
        val context = requireContext()
        val slipBinding = com.example.hospitalqswiftapp.databinding.DialogOpdTokenSlipBinding.inflate(layoutInflater)
        val dialog = AlertDialog.Builder(context)
            .setView(slipBinding.root)
            .create()

        val hsp = selectedHospital
        slipBinding.tvSlipHospitalName.text = hsp?.name ?: "Apollo City OPD & Care Clinic"
        slipBinding.tvSlipHospitalLicense.text = "License: ${hsp?.clinical_license ?: "CEA/KA/2026/8841"} · Council: ${hsp?.council_reg ?: "KMC-74921"}"

        if (token.is_priority) {
            slipBinding.tvSlipPriorityBadge.visibility = View.VISIBLE
            if (!token.priority_reason.isNullOrEmpty()) {
                slipBinding.tvSlipPriorityBadge.text = "🚨 ${token.priority_reason}"
            }
        } else {
            slipBinding.tvSlipPriorityBadge.visibility = View.GONE
        }

        slipBinding.tvSlipTokenNumber.text = "#${token.token_number}"
        slipBinding.tvSlipQueueStatus.text = "● Status: WAITING"
        slipBinding.tvSlipPatientName.text = token.patient_name
        slipBinding.tvSlipDoctorName.text = "${doctor.name} (${doctor.specialty})"
        slipBinding.tvSlipFee.text = "₹ ${doctor.consultation_fee.toInt()} (Pay at OPD Front Desk)"
        slipBinding.tvSlipTime.text = "Today at ${java.time.LocalTime.now().toString().take(5)}"
        slipBinding.tvSlipBarcodeCode.text = "TOKEN-PASS-${token.id.uppercase()}"

        slipBinding.btnSlipPrint.setOnClickListener {
            Toast.makeText(context, "🖨️ OPD Ticket Pass Saved / Printing...", Toast.LENGTH_LONG).show()
        }
        slipBinding.btnSlipClose.setOnClickListener {
            dialog.dismiss()
            (activity as? com.example.hospitalqswiftapp.MainActivity)?.openTokensTab()
        }

        dialog.show()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
