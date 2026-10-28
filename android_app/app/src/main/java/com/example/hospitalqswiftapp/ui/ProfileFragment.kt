package com.example.hospitalqswiftapp.ui

import android.app.AlertDialog
import android.content.res.ColorStateList
import android.graphics.Color
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
import com.example.hospitalqswiftapp.MainActivity
import com.example.hospitalqswiftapp.data.FamilyMember
import com.example.hospitalqswiftapp.data.SupabaseRepository
import com.example.hospitalqswiftapp.databinding.FragmentProfileBinding
import com.example.hospitalqswiftapp.ui.adapters.FamilyAdapter
import kotlinx.coroutines.launch

class ProfileFragment : Fragment() {

    private var _binding: FragmentProfileBinding? = null
    private val binding get() = _binding!!
    private lateinit var familyAdapter: FamilyAdapter

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentProfileBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        val mainActivity = activity as? MainActivity
        val user = mainActivity?.currentUserName

        binding.btnRequireSignIn.setOnClickListener {
            mainActivity?.showSignInDialog()
        }

        if (user == null) {
            binding.cardProfileInfo.visibility = View.GONE
            binding.familyHeader.visibility = View.GONE
            binding.rvFamilyMembers.visibility = View.GONE
            binding.containerLoginRequired.visibility = View.VISIBLE
        } else {
            binding.cardProfileInfo.visibility = View.VISIBLE
            binding.familyHeader.visibility = View.VISIBLE
            binding.rvFamilyMembers.visibility = View.VISIBLE
            binding.containerLoginRequired.visibility = View.GONE

            updateProfileUI(user)

            binding.btnProfileSignIn.text = "Sign Out"
            binding.btnProfileSignIn.backgroundTintList = ColorStateList.valueOf(Color.parseColor("#E11D48"))
            binding.btnProfileSignIn.setOnClickListener {
                mainActivity?.showLogoutConfirmation()
            }

            binding.cardProfileInfo.setOnClickListener {
                showEditProfileDialog()
            }
            binding.btnEditProfile.setOnClickListener {
                showEditProfileDialog()
            }

            familyAdapter = FamilyAdapter { member ->
                lifecycleScope.launch {
                    SupabaseRepository.deleteFamilyMember(member.id)
                    Toast.makeText(requireContext(), "🗑️ Removed ${member.full_name}", Toast.LENGTH_SHORT).show()
                    loadFamilyMembers()
                }
            }

            binding.rvFamilyMembers.layoutManager = LinearLayoutManager(requireContext())
            binding.rvFamilyMembers.adapter = familyAdapter

            binding.btnAddFamilyMember.setOnClickListener {
                showAddFamilyDialog()
            }

            loadFamilyMembers()
        }
    }

    private fun updateProfileUI(defaultName: String) {
        val prof = SupabaseRepository.currentUserProfile
        binding.tvProfileName.text = prof?.full_name ?: defaultName
        binding.tvProfilePhone.text = "📱 ${prof?.phone ?: "+91 98765 12345"}"
        binding.tvProfileBlood.text = "🩸 Blood Group: ${prof?.blood_group ?: "O+"}"
        binding.tvMedicalNotes.text = "📝 Notes: ${prof?.medical_notes ?: "No known drug allergies"}"
    }

    private fun showEditProfileDialog() {
        val context = requireContext()
        val prof = SupabaseRepository.currentUserProfile

        val layout = LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(40, 20, 40, 20)
        }

        val etName = EditText(context).apply {
            hint = "Full Name"
            setText(prof?.full_name ?: binding.tvProfileName.text.toString())
        }
        val etPhone = EditText(context).apply {
            hint = "Mobile Phone"
            setText(prof?.phone ?: "+91 98765 12345")
        }
        val etBlood = EditText(context).apply {
            hint = "Blood Group (e.g. O+)"
            setText(prof?.blood_group ?: "O+")
        }
        val etNotes = EditText(context).apply {
            hint = "Medical Notes / Allergies"
            setText(prof?.medical_notes ?: "No known drug allergies")
        }

        layout.addView(etName)
        layout.addView(etPhone)
        layout.addView(etBlood)
        layout.addView(etNotes)

        AlertDialog.Builder(context)
            .setTitle("Edit Patient Profile")
            .setView(layout)
            .setPositiveButton("Save Profile") { _, _ ->
                val newName = etName.text.toString().trim()
                val newPhone = etPhone.text.toString().trim()
                val newBlood = etBlood.text.toString().trim()
                val newNotes = etNotes.text.toString().trim()

                if (newName.isNotEmpty()) {
                    lifecycleScope.launch {
                        val current = prof ?: com.example.hospitalqswiftapp.data.Profile(
                            id = "user-${System.currentTimeMillis()}",
                            full_name = newName,
                            email = "patient@example.com"
                        )
                        val updated = current.copy(
                            full_name = newName,
                            phone = newPhone,
                            blood_group = newBlood,
                            medical_notes = newNotes
                        )
                        SupabaseRepository.upsertUserProfile(updated)
                        updateProfileUI(newName)
                        Toast.makeText(context, "✅ Profile details updated!", Toast.LENGTH_SHORT).show()
                    }
                }
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun loadFamilyMembers() {
        lifecycleScope.launch {
            val members = SupabaseRepository.getFamilyMembers()
            familyAdapter.submitList(members)
        }
    }

    private fun showAddFamilyDialog() {
        val context = requireContext()
        val layout = LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(40, 20, 40, 20)
        }

        val etName = EditText(context).apply { hint = "Full Name (e.g. Family Member)" }
        val etRelation = EditText(context).apply { hint = "Relationship (Mother / Spouse / Child)" }
        val etAge = EditText(context).apply { hint = "Age (e.g. 56)" }

        layout.addView(etName)
        layout.addView(etRelation)
        layout.addView(etAge)

        AlertDialog.Builder(context)
            .setTitle("Add Family Member")
            .setView(layout)
            .setPositiveButton("Add") { _, _ ->
                val name = etName.text.toString().trim()
                val relation = etRelation.text.toString().trim().ifEmpty { "Family Member" }
                val age = etAge.text.toString().toIntOrNull()

                if (name.isNotEmpty()) {
                    lifecycleScope.launch {
                        val currentProfId = SupabaseRepository.currentUserProfile?.id ?: "user-${System.currentTimeMillis()}"
                        val newMember = FamilyMember(
                            id = "fam-${System.currentTimeMillis()}",
                            patient_id = currentProfId,
                            full_name = name,
                            relationship = relation,
                            age = age
                        )
                        SupabaseRepository.addFamilyMember(newMember)
                        Toast.makeText(context, "✅ Family member $name added!", Toast.LENGTH_SHORT).show()
                        loadFamilyMembers()
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
