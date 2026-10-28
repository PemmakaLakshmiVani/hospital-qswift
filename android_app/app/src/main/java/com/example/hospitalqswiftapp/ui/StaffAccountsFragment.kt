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
import com.example.hospitalqswiftapp.data.StaffAccount
import com.example.hospitalqswiftapp.data.SupabaseRepository
import com.example.hospitalqswiftapp.databinding.FragmentStaffAccountsBinding
import com.example.hospitalqswiftapp.ui.adapters.StaffAccountAdapter
import kotlinx.coroutines.launch

class StaffAccountsFragment : Fragment() {

    private var _binding: FragmentStaffAccountsBinding? = null
    private val binding get() = _binding!!

    private lateinit var adapter: StaffAccountAdapter

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentStaffAccountsBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        adapter = StaffAccountAdapter(
            onRemove = { staff -> removeStaffAccount(staff) }
        )

        binding.rvStaffAccounts.layoutManager = LinearLayoutManager(requireContext())
        binding.rvStaffAccounts.adapter = adapter

        binding.btnCreateStaffAccount.setOnClickListener {
            showCreateStaffDialog()
        }

        loadStaffAccounts()
    }

    private fun loadStaffAccounts() {
        lifecycleScope.launch {
            val list = SupabaseRepository.getStaffAccounts()
            binding.tvStaffHeaderTitle.text = "Staff Operators (${list.size})"
            adapter.submitList(list)
        }
    }

    private fun removeStaffAccount(staff: StaffAccount) {
        AlertDialog.Builder(requireContext())
            .setTitle("Remove Staff Account")
            .setMessage("Are you sure you want to remove access for ${staff.staff_name}?")
            .setPositiveButton("Remove") { _, _ ->
                lifecycleScope.launch {
                    SupabaseRepository.deleteStaffAccount(staff.id)
                    Toast.makeText(requireContext(), "Removed ${staff.staff_name}", Toast.LENGTH_SHORT).show()
                    loadStaffAccounts()
                }
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun showCreateStaffDialog() {
        val context = requireContext()
        val layout = LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(40, 20, 40, 20)
        }

        val etName = EditText(context).apply { hint = "Staff Member Name (e.g. Sunita Sharma)" }
        val etUser = EditText(context).apply { hint = "Staff Username (e.g. APOLLO_STAFF_1)" }
        val etPass = EditText(context).apply { hint = "Password" }

        layout.addView(etName)
        layout.addView(etUser)
        layout.addView(etPass)

        AlertDialog.Builder(context)
            .setTitle("Create Clinic Staff Operator Account")
            .setView(layout)
            .setPositiveButton("Create Account") { _, _ ->
                val name = etName.text.toString().trim()
                val user = etUser.text.toString().trim()
                val pass = etPass.text.toString().trim()

                if (name.isNotEmpty() && user.isNotEmpty()) {
                    lifecycleScope.launch {
                        val newAccount = StaffAccount(
                            id = "staff-${System.currentTimeMillis()}",
                            hospital_id = "hsp-1",
                            doctor_id = null,
                            staff_name = name,
                            username = user,
                            password = if (pass.isNotEmpty()) pass else "staff123"
                        )
                        SupabaseRepository.createStaffAccount(newAccount)
                        Toast.makeText(context, "✅ Staff operator $name created!", Toast.LENGTH_LONG).show()
                        loadStaffAccounts()
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
