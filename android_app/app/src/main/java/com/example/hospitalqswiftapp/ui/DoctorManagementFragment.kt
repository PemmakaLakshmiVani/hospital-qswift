package com.example.hospitalqswiftapp.ui

import android.app.AlertDialog
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ArrayAdapter
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.Spinner
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.example.hospitalqswiftapp.data.Doctor
import com.example.hospitalqswiftapp.data.SupabaseRepository
import com.example.hospitalqswiftapp.databinding.FragmentDoctorManagementBinding
import com.example.hospitalqswiftapp.ui.adapters.DoctorRosterAdapter
import kotlinx.coroutines.launch

class DoctorManagementFragment : Fragment() {

    private var _binding: FragmentDoctorManagementBinding? = null
    private val binding get() = _binding!!

    private lateinit var adapter: DoctorRosterAdapter
    private var doctorList = listOf<Doctor>()

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentDoctorManagementBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        adapter = DoctorRosterAdapter(
            onToggleStatus = { doc -> showStatusDialog(doc) },
            onEditCreds = { doc -> showEditCredsDialog(doc) }
        )

        binding.rvDoctorsRoster.layoutManager = LinearLayoutManager(requireContext())
        binding.rvDoctorsRoster.adapter = adapter

        binding.btnAddDoctor.setOnClickListener {
            showAddDoctorDialog()
        }

        loadDoctors()
    }

    private fun loadDoctors() {
        lifecycleScope.launch {
            doctorList = SupabaseRepository.getDoctors()
            binding.tvDoctorCountHeader.text = "Clinic Doctors (${doctorList.size})"
            adapter.submitList(doctorList)
        }
    }

    private fun showStatusDialog(doctor: Doctor) {
        val context = requireContext()
        val options = arrayOf(
            if (doctor.is_available) "Mark Off Duty / Unavailable" else "Mark On Duty / Available",
            if (doctor.is_resigned) "Restore Doctor Account (Re-enable)" else "Mark Account Resigned (Disable Login)"
        )

        AlertDialog.Builder(context)
            .setTitle("Change Status for ${doctor.name}")
            .setItems(options) { _, which ->
                lifecycleScope.launch {
                    if (which == 0) {
                        SupabaseRepository.updateDoctorAvailability(doctor.id, !doctor.is_available)
                    } else {
                        SupabaseRepository.toggleDoctorResignation(doctor.id, !doctor.is_resigned)
                    }
                    Toast.makeText(context, "Updated status for ${doctor.name}", Toast.LENGTH_SHORT).show()
                    loadDoctors()
                }
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun showEditCredsDialog(doctor: Doctor) {
        val context = requireContext()
        val layout = LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(40, 20, 40, 20)
        }

        val etUser = EditText(context).apply {
            hint = "Login Username"
            setText(doctor.username)
        }
        val etPass = EditText(context).apply {
            hint = "Password"
            setText(doctor.password)
        }

        layout.addView(etUser)
        layout.addView(etPass)

        AlertDialog.Builder(context)
            .setTitle("Edit Credentials for ${doctor.name}")
            .setView(layout)
            .setPositiveButton("Save Credentials") { _, _ ->
                val username = etUser.text.toString().trim()
                val password = etPass.text.toString().trim()
                if (username.isNotEmpty() && password.isNotEmpty()) {
                    lifecycleScope.launch {
                        SupabaseRepository.updateDoctorCredentials(doctor.id, username, password)
                        Toast.makeText(context, "✅ Credentials updated for ${doctor.name}!", Toast.LENGTH_SHORT).show()
                        loadDoctors()
                    }
                }
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun showAddDoctorDialog() {
        val context = requireContext()
        val layout = LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(40, 20, 40, 20)
        }

        val etName = EditText(context).apply { hint = "Doctor Full Name (e.g. Dr. Kavita Roy)" }
        val spSpecialty = Spinner(context)
        val specialties = arrayOf("General Physician", "Pediatrics", "Dermatology", "Dental", "ENT", "Cardiology", "Orthopedics", "Gynaecology")
        spSpecialty.adapter = ArrayAdapter(context, android.R.layout.simple_spinner_dropdown_item, specialties)

        val etFee = EditText(context).apply { hint = "Consultation Fee (₹ e.g. 600)" }
        val etUser = EditText(context).apply { hint = "Doctor Login Username (e.g. DR_KAVITA)" }
        val etPass = EditText(context).apply { hint = "Doctor Initial Password (e.g. doc123)" }

        layout.addView(etName)
        layout.addView(spSpecialty)
        layout.addView(etFee)
        layout.addView(etUser)
        layout.addView(etPass)

        AlertDialog.Builder(context)
            .setTitle("Add New Doctor to Clinic Roster")
            .setView(layout)
            .setPositiveButton("Add Doctor") { _, _ ->
                val name = etName.text.toString().trim()
                val specialty = spSpecialty.selectedItem?.toString() ?: "General Physician"
                val fee = etFee.text.toString().toDoubleOrNull() ?: 500.0
                val username = etUser.text.toString().trim().ifEmpty { "DR_${name.replace(" ", "_").uppercase()}" }
                val password = etPass.text.toString().trim().ifEmpty { "doc123" }

                if (name.isNotEmpty()) {
                    lifecycleScope.launch {
                        val newDoc = Doctor(
                            id = "doc-${System.currentTimeMillis()}",
                            hospital_id = "hsp-1",
                            name = if (!name.startsWith("Dr.")) "Dr. $name" else name,
                            username = username,
                            password = password,
                            specialty = specialty,
                            consultation_fee = fee,
                            avg_consult_minutes = 15,
                            available_from = "09:00",
                            available_to = "17:00",
                            is_available = true
                        )
                        SupabaseRepository.addDoctor(newDoc)
                        Toast.makeText(context, "✅ Added ${newDoc.name} to roster!", Toast.LENGTH_LONG).show()
                        loadDoctors()
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
