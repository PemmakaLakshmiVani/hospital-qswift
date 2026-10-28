package com.example.hospitalqswiftapp.ui

import android.graphics.Color
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.AdapterView
import android.widget.ArrayAdapter
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.example.hospitalqswiftapp.R
import com.example.hospitalqswiftapp.data.Doctor
import com.example.hospitalqswiftapp.data.QueueToken
import com.example.hospitalqswiftapp.data.SupabaseRepository
import com.example.hospitalqswiftapp.databinding.FragmentStaffDashboardBinding
import com.example.hospitalqswiftapp.ui.adapters.QueueTokenAdapter
import kotlinx.coroutines.launch

class StaffDashboardFragment : Fragment() {

    private var _binding: FragmentStaffDashboardBinding? = null
    private val binding get() = _binding!!

    private lateinit var adapter: QueueTokenAdapter
    private var doctorList = listOf<Doctor>()
    private var tokenList = listOf<QueueToken>()
    private var currentServingToken: QueueToken? = null
    private var selectedDoctorId: String = "doc-101"

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentStaffDashboardBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        adapter = QueueTokenAdapter(
            onCall = { token -> callSpecificToken(token) },
            onDone = { token -> markTokenStatus(token.id, "done") },
            onNoShow = { token -> markTokenStatus(token.id, "no_show") }
        )
        binding.rvQueueTokens.layoutManager = LinearLayoutManager(requireContext())
        binding.rvQueueTokens.adapter = adapter

        val mainActivity = activity as? com.example.hospitalqswiftapp.MainActivity
        val userRole = mainActivity?.currentUserRole ?: "patient"
        val userName = mainActivity?.currentUserName ?: "Doctor / Staff"

        when (userRole) {
            "doctor" -> {
                binding.cardStaffHeader.setCardBackgroundColor(Color.parseColor("#064E3B"))
                binding.tvStaffBadge.text = "DOCTOR OPD CONSOLE"
                binding.tvStaffBadge.setBackgroundColor(Color.parseColor("#022C22"))
                binding.tvStaffBadge.setTextColor(Color.parseColor("#F59E0B"))
                binding.tvStaffHeaderTitle.text = "$userName · Personal Desk Queue"
                binding.tvStaffHeaderSubtitle.text = "MD (Internal Med) · Room 3 · OPD Queue Active"
                binding.containerDoctorDeskSelect.visibility = View.GONE
                binding.btnFacilitySchedule.visibility = View.GONE
                binding.btnDoctorRoster.text = "📋 Profile & Duty"
                binding.btnLeaveApprovals.text = "📅 My Leaves"
                binding.btnStaffAccounts.visibility = View.GONE
            }
            "staff_operator" -> {
                binding.cardStaffHeader.setCardBackgroundColor(Color.parseColor("#3B3F8C"))
                binding.tvStaffBadge.text = "FRONT-DESK OPERATOR CONSOLE"
                binding.tvStaffHeaderTitle.text = "Front-Desk OPD Token Console"
                binding.tvStaffHeaderSubtitle.text = "Walk-in registration & patient calling · Operator: $userName"
                binding.containerDoctorDeskSelect.visibility = View.VISIBLE
                binding.btnFacilitySchedule.visibility = View.GONE
                binding.btnDoctorRoster.visibility = View.GONE
                binding.btnLeaveApprovals.visibility = View.GONE
            }
            else -> { // "business_owner"
                binding.cardStaffHeader.setCardBackgroundColor(Color.parseColor("#2A2D6E"))
                binding.tvStaffBadge.text = "HOSPITAL OWNER ADMIN CONSOLE"
                binding.tvStaffHeaderTitle.text = "Apollo City OPD & Care Clinic"
                binding.tvStaffHeaderSubtitle.text = "42 100ft Road, Indiranagar · Owner: $userName"
                binding.containerDoctorDeskSelect.visibility = View.VISIBLE
                binding.btnFacilitySchedule.visibility = View.VISIBLE
            }
        }

        binding.btnCallNextToken.setOnClickListener {
            callNextToken()
        }

        binding.btnMarkDoneServing.setOnClickListener {
            currentServingToken?.let { tok ->
                markTokenStatus(tok.id, "done")
            }
        }

        binding.btnMarkNoShowServing.setOnClickListener {
            currentServingToken?.let { tok ->
                markTokenStatus(tok.id, "no_show")
            }
        }

        binding.btnWalkInPatient.setOnClickListener {
            showWalkInDialog()
        }

        binding.btnFacilitySchedule.setOnClickListener {
            showFacilityScheduleDialog()
        }

        binding.btnDoctorRoster.setOnClickListener {
            if (userRole == "doctor") {
                parentFragmentManager.beginTransaction()
                    .replace(R.id.fragmentContainer, DoctorProfileFragment())
                    .addToBackStack(null)
                    .commit()
            } else {
                parentFragmentManager.beginTransaction()
                    .replace(R.id.fragmentContainer, DoctorManagementFragment())
                    .addToBackStack(null)
                    .commit()
            }
        }

        binding.btnLeaveApprovals.setOnClickListener {
            if (userRole == "doctor") {
                parentFragmentManager.beginTransaction()
                    .replace(R.id.fragmentContainer, DoctorProfileFragment())
                    .addToBackStack(null)
                    .commit()
            } else {
                parentFragmentManager.beginTransaction()
                    .replace(R.id.fragmentContainer, LeaveApprovalsFragment())
                    .addToBackStack(null)
                    .commit()
            }
        }

        binding.btnStaffAccounts.setOnClickListener {
            parentFragmentManager.beginTransaction()
                .replace(R.id.fragmentContainer, StaffAccountsFragment())
                .addToBackStack(null)
                .commit()
        }

        binding.btnAnalyticsReport.setOnClickListener {
            parentFragmentManager.beginTransaction()
                .replace(R.id.fragmentContainer, QueueAnalyticsFragment())
                .addToBackStack(null)
                .commit()
        }

        loadStaffData()
    }

    private fun loadStaffData() {
        lifecycleScope.launch {
            doctorList = SupabaseRepository.getDoctors()
            val mainActivity = activity as? com.example.hospitalqswiftapp.MainActivity
            val isDoctor = mainActivity?.currentUserRole == "doctor"

            if (doctorList.isNotEmpty()) {
                val docNames = doctorList.map { "${it.name} (${it.specialty})" }
                val spinnerAdapter = ArrayAdapter(requireContext(), android.R.layout.simple_spinner_item, docNames)
                spinnerAdapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
                binding.spDoctorDesk.adapter = spinnerAdapter

                binding.spDoctorDesk.onItemSelectedListener = object : AdapterView.OnItemSelectedListener {
                    override fun onItemSelected(parent: AdapterView<*>?, view: View?, position: Int, id: Long) {
                        selectedDoctorId = doctorList.getOrNull(position)?.id ?: "doc-101"
                        refreshQueueDisplay()
                    }
                    override fun onNothingSelected(parent: AdapterView<*>?) {}
                }
            }

            tokenList = SupabaseRepository.getQueueTokens()
            refreshQueueDisplay()
        }
    }

    private fun refreshQueueDisplay() {
        val mainActivity = activity as? com.example.hospitalqswiftapp.MainActivity
        val isDoctor = mainActivity?.currentUserRole == "doctor"
        val activeDocId = if (isDoctor) "doc-101" else selectedDoctorId
        val activeDoc = doctorList.find { it.id == activeDocId } ?: doctorList.firstOrNull()

        val filteredTokens = tokenList.filter { it.doctor_id == activeDocId }

        currentServingToken = filteredTokens.firstOrNull { it.status == "serving" }

        val waitingTokens = filteredTokens
            .filter { it.status == "waiting" }
            .sortedWith(compareByDescending<QueueToken> { it.is_priority }.thenBy { it.token_number })

        val completedTokens = filteredTokens.filter { it.status == "done" }

        // Update 4 KPI Cards
        binding.tvKpiTotalTokens.text = "${filteredTokens.size}"
        binding.tvKpiWaitingCount.text = "${waitingTokens.size}"
        binding.tvKpiCompletedCount.text = "${completedTokens.size}"
        binding.tvKpiAvgTime.text = "${activeDoc?.avg_consult_minutes ?: 12}m"
        binding.tvQueueCountBadge.text = "${waitingTokens.size} Waiting"

        // Update Hero Cards
        if (currentServingToken != null) {
            val serving = currentServingToken!!
            binding.cardNowServing.visibility = View.VISIBLE
            binding.cardDeskReady.visibility = View.GONE
            binding.tvServingTokenNum.text = "TOKEN #${String.format("%02d", serving.token_number)}"
            binding.tvServingPatientName.text = "${serving.patient_name} ${if (serving.is_priority) "🚨 [PRIORITY]" else ""}"
            binding.tvServingPatientDetails.text = "Status: IN ROOM CONSULTATION · Reference: ${serving.id}"
        } else {
            binding.cardNowServing.visibility = View.GONE
            binding.cardDeskReady.visibility = View.VISIBLE
            binding.tvReadySubtitle.text = if (waitingTokens.isNotEmpty()) {
                "${waitingTokens.size} patients waiting outside. Click below to call next token!"
            } else {
                "Waiting room is currently clear. Ready for incoming walk-ins."
            }
        }

        adapter.submitList(waitingTokens)
    }

    private fun callNextToken() {
        lifecycleScope.launch {
            val tokens = SupabaseRepository.getQueueTokens()
            val mainActivity = activity as? com.example.hospitalqswiftapp.MainActivity
            val activeDocId = if (mainActivity?.currentUserRole == "doctor") "doc-101" else selectedDoctorId

            val currentlyServing = tokens.firstOrNull { it.doctor_id == activeDocId && it.status == "serving" }
            val nextWaiting = tokens
                .filter { it.doctor_id == activeDocId && it.status == "waiting" }
                .sortedWith(compareByDescending<QueueToken> { it.is_priority }.thenBy { it.token_number })
                .firstOrNull()

            if (nextWaiting == null) {
                Toast.makeText(requireContext(), "ℹ️ No waiting patients in this doctor's queue!", Toast.LENGTH_SHORT).show()
                return@launch
            }

            val success = SupabaseRepository.callNextToken(
                doctorId = nextWaiting.doctor_id,
                nextTokenId = nextWaiting.id,
                currentServingTokenId = currentlyServing?.id
            )

            if (success) {
                Toast.makeText(requireContext(), "📢 CALLED TOKEN #${nextWaiting.token_number} (${nextWaiting.patient_name})", Toast.LENGTH_LONG).show()
                tokenList = SupabaseRepository.getQueueTokens()
                refreshQueueDisplay()
            } else {
                Toast.makeText(requireContext(), "⚠️ Failed to update token status", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun callSpecificToken(token: QueueToken) {
        lifecycleScope.launch {
            val success = SupabaseRepository.callNextToken(
                doctorId = token.doctor_id,
                nextTokenId = token.id,
                currentServingTokenId = currentServingToken?.id
            )
            if (success) {
                Toast.makeText(requireContext(), "📢 Called Token #${token.token_number} (${token.patient_name})", Toast.LENGTH_SHORT).show()
                tokenList = SupabaseRepository.getQueueTokens()
                refreshQueueDisplay()
            }
        }
    }

    private fun markTokenStatus(tokenId: String, status: String) {
        lifecycleScope.launch {
            val now = java.time.Instant.now().toString()
            SupabaseRepository.updateTokenStatus(tokenId, status, if (status == "done") now else null)
            Toast.makeText(requireContext(), "✅ Token marked as ${status.uppercase()}", Toast.LENGTH_SHORT).show()
            tokenList = SupabaseRepository.getQueueTokens()
            refreshQueueDisplay()
        }
    }

    private fun showWalkInDialog() {
        val context = requireContext()
        val layout = android.widget.LinearLayout(context).apply {
            orientation = android.widget.LinearLayout.VERTICAL
            setPadding(40, 20, 40, 20)
        }

        val etName = android.widget.EditText(context).apply { hint = "Walk-In Patient Name (e.g. Ramesh Patel)" }
        val etPhone = android.widget.EditText(context).apply { hint = "Patient Phone (+91 98765 00000)" }
        val cbPriority = com.google.android.material.checkbox.MaterialCheckBox(context).apply {
            text = "🚨 Emergency / Senior Citizen (70+) Priority"
            setTextColor(Color.parseColor("#DC2626"))
        }

        layout.addView(etName)
        layout.addView(etPhone)
        layout.addView(cbPriority)

        AlertDialog.Builder(context)
            .setTitle("+ Add Front-Desk Walk-In Patient")
            .setView(layout)
            .setPositiveButton("Issue Token") { _, _ ->
                val name = etName.text.toString().trim()
                if (name.isNotEmpty()) {
                    lifecycleScope.launch {
                        val activeDocId = if ((activity as? com.example.hospitalqswiftapp.MainActivity)?.currentUserRole == "doctor") "doc-101" else selectedDoctorId
                        val tokens = SupabaseRepository.getQueueTokens()
                        val maxNum = tokens.filter { it.doctor_id == activeDocId }.maxOfOrNull { it.token_number } ?: 0

                        val walkInToken = QueueToken(
                            id = "tok-${System.currentTimeMillis()}",
                            hospital_id = "hsp-1",
                            doctor_id = activeDocId,
                            patient_name = name,
                            token_number = maxNum + 1,
                            status = "waiting",
                            is_priority = cbPriority.isChecked,
                            priority_reason = if (cbPriority.isChecked) "Front-desk Emergency Walk-In" else null,
                            queue_date = java.time.LocalDate.now().toString(),
                            booking_type = "on_the_spot"
                        )
                        SupabaseRepository.issueQueueToken(walkInToken)
                        Toast.makeText(context, "✅ Walk-In Token #${maxNum + 1} issued for $name!", Toast.LENGTH_LONG).show()
                        tokenList = SupabaseRepository.getQueueTokens()
                        refreshQueueDisplay()
                    }
                }
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun showFacilityScheduleDialog() {
        val context = requireContext()
        val layout = android.widget.LinearLayout(context).apply {
            orientation = android.widget.LinearLayout.VERTICAL
            setPadding(40, 20, 40, 20)
        }

        val etHours = android.widget.EditText(context).apply {
            hint = "Operating Hours"
            setText("08:00 AM - 08:00 PM")
        }
        val etClosed = android.widget.EditText(context).apply {
            hint = "Weekly Closed Days"
            setText("Sunday")
        }
        val cb247 = com.google.android.material.checkbox.MaterialCheckBox(context).apply {
            text = "Enable 24x7 OPD Emergency Service"
            isChecked = true
        }

        layout.addView(etHours)
        layout.addView(etClosed)
        layout.addView(cb247)

        AlertDialog.Builder(context)
            .setTitle("⚙️ Clinic Profile & OPD Timings")
            .setView(layout)
            .setPositiveButton("Save Settings") { _, _ ->
                Toast.makeText(context, "✅ Clinic OPD Schedule Settings Saved!", Toast.LENGTH_SHORT).show()
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
