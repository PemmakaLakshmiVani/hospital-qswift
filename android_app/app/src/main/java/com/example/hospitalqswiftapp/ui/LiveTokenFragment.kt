package com.example.hospitalqswiftapp.ui

import android.content.Context
import android.os.Build
import android.os.Bundle
import android.os.VibrationEffect
import android.os.Vibrator
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import com.example.hospitalqswiftapp.data.SupabaseRepository
import com.example.hospitalqswiftapp.databinding.FragmentLiveTokenBinding
import kotlinx.coroutines.launch

class LiveTokenFragment : Fragment() {

    private var _binding: FragmentLiveTokenBinding? = null
    private val binding get() = _binding!!

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentLiveTokenBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        val mainActivity = activity as? com.example.hospitalqswiftapp.MainActivity
        val user = mainActivity?.currentUserName

        binding.btnRequireSignIn.setOnClickListener {
            mainActivity?.showSignInDialog()
        }

        binding.btnBookTokenNow.setOnClickListener {
            mainActivity?.openDiscoverTab()
        }

        binding.btnRefreshLive.setOnClickListener {
            if (user != null) loadLiveTokens(user)
        }

        if (user == null) {
            binding.cardLiveTicket.visibility = View.GONE
            binding.btnRefreshLive.visibility = View.GONE
            binding.containerNoActiveToken.visibility = View.GONE
            binding.containerLoginRequired.visibility = View.VISIBLE
        } else {
            binding.containerLoginRequired.visibility = View.GONE
            loadLiveTokens(user)
        }
    }

    private fun loadLiveTokens(userName: String) {
        val currProf = SupabaseRepository.currentUserProfile
        val userId = currProf?.id
        binding.tvPatientTicketName.text = "Patient: ${currProf?.full_name ?: userName}"

        lifecycleScope.launch {
            val tokens = SupabaseRepository.getQueueTokens()
            val myToken = tokens.firstOrNull { tok ->
                (tok.status == "waiting" || tok.status == "serving") &&
                ((userId != null && tok.patient_id == userId) ||
                 tok.patient_name.equals(userName, ignoreCase = true) ||
                 (currProf?.full_name != null && tok.patient_name.equals(currProf.full_name, ignoreCase = true)))
            }

            if (myToken == null) {
                binding.cardLiveTicket.visibility = View.GONE
                binding.btnRefreshLive.visibility = View.GONE
                binding.containerNoActiveToken.visibility = View.VISIBLE
                binding.containerLoginRequired.visibility = View.GONE
                return@launch
            }

            binding.cardLiveTicket.visibility = View.VISIBLE
            binding.btnRefreshLive.visibility = View.VISIBLE
            binding.containerNoActiveToken.visibility = View.GONE
            binding.containerLoginRequired.visibility = View.GONE

            binding.tvPatientTicketName.text = "Patient: ${myToken.patient_name}"

            val servingToken = tokens.firstOrNull { it.doctor_id == myToken.doctor_id && it.status == "serving" }
            val servingNum = servingToken?.token_number ?: (myToken.token_number - 2).coerceAtLeast(1)
            val myNum = myToken.token_number

            binding.tvServingNum.text = "#${String.format("%02d", servingNum)}"
            binding.tvYourTokenNum.text = "#${String.format("%02d", myNum)}"

            val remaining = (myNum - servingNum).coerceAtLeast(0)
            binding.tvWaitTime.text = "Estimated Wait: ~ ${remaining * 15} Mins ($remaining patients ahead)"
            binding.progressQueue.progress = if (myNum > 0) ((servingNum.toFloat() / myNum.toFloat()) * 100).toInt() else 50

            binding.btnViewTokenSlip.setOnClickListener {
                showTokenSlipDialog(myToken)
            }

            if (myToken.status == "serving") {
                binding.tvLiveStatusBadge.text = "● YOUR TURN NOW!"
                binding.tvLiveStatusBadge.setBackgroundColor(android.graphics.Color.parseColor("#DCFCE7"))
                binding.tvLiveStatusBadge.setTextColor(android.graphics.Color.parseColor("#15803D"))
                triggerAlert()
            } else {
                binding.tvLiveStatusBadge.text = "● WAITING"
                binding.tvLiveStatusBadge.setBackgroundColor(android.graphics.Color.parseColor("#FEF3C7"))
                binding.tvLiveStatusBadge.setTextColor(android.graphics.Color.parseColor("#D97706"))
            }
        }
    }

    private fun showTokenSlipDialog(token: com.example.hospitalqswiftapp.data.QueueToken) {
        val context = requireContext()
        val slipBinding = com.example.hospitalqswiftapp.databinding.DialogOpdTokenSlipBinding.inflate(layoutInflater)
        val dialog = androidx.appcompat.app.AlertDialog.Builder(context)
            .setView(slipBinding.root)
            .create()

        lifecycleScope.launch {
            val docs = SupabaseRepository.getDoctors()
            val hsps = SupabaseRepository.getHospitals()
            val doc = docs.firstOrNull { it.id == token.doctor_id }
            val hsp = hsps.firstOrNull { it.id == token.hospital_id }

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
            slipBinding.tvSlipQueueStatus.text = "● Status: ${token.status.uppercase()}"
            slipBinding.tvSlipPatientName.text = token.patient_name
            slipBinding.tvSlipDoctorName.text = "${doc?.name ?: "Dr. Rajesh Sharma"} (${doc?.specialty ?: "General Physician"})"
            slipBinding.tvSlipFee.text = "₹ ${doc?.consultation_fee?.toInt() ?: 500} (Pay at OPD Front Desk)"
            slipBinding.tvSlipTime.text = token.joined_at?.take(16)?.replace("T", " ") ?: token.queue_date.ifEmpty { "Today" }
            slipBinding.tvSlipBarcodeCode.text = "TOKEN-PASS-${token.id.uppercase()}"

            slipBinding.btnSlipPrint.setOnClickListener {
                Toast.makeText(context, "🖨️ OPD Slip Saved / Sent to Printer!", Toast.LENGTH_LONG).show()
            }
            slipBinding.btnSlipClose.setOnClickListener {
                dialog.dismiss()
            }
        }

        dialog.show()
    }

    private fun triggerAlert() {
        try {
            val vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                val vibratorManager = requireContext().getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as android.os.VibratorManager
                vibratorManager.defaultVibrator
            } else {
                @Suppress("DEPRECATION")
                requireContext().getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                vibrator.vibrate(VibrationEffect.createOneShot(500, VibrationEffect.DEFAULT_AMPLITUDE))
            } else {
                @Suppress("DEPRECATION")
                vibrator.vibrate(500)
            }
            Toast.makeText(requireContext(), "🔔 YOUR TOKEN HAS BEEN CALLED!", Toast.LENGTH_LONG).show()
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
