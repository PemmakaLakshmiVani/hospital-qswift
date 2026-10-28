package com.example.hospitalqswiftapp.ui

import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.example.hospitalqswiftapp.R
import com.example.hospitalqswiftapp.data.Doctor
import com.example.hospitalqswiftapp.data.Hospital
import com.example.hospitalqswiftapp.data.QueueToken
import com.example.hospitalqswiftapp.data.SupabaseRepository
import com.example.hospitalqswiftapp.databinding.FragmentDiscoveryBinding
import com.example.hospitalqswiftapp.ui.adapters.HospitalAdapter
import kotlinx.coroutines.launch

class DiscoveryFragment : Fragment() {

    private var _binding: FragmentDiscoveryBinding? = null
    private val binding get() = _binding!!

    private lateinit var adapter: HospitalAdapter
    private var allHospitals = listOf<Hospital>()
    private var allDoctors = listOf<Doctor>()
    private var allTokens = listOf<QueueToken>()

    private var searchQuery = ""
    private var selectedFilter = "all" // all | open | shortest | top_rated
    private var selectedSpecialty = "All Specialties"

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentDiscoveryBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        adapter = HospitalAdapter { hospital ->
            val detailFragment = HospitalDetailFragment.newInstance(hospital)
            requireActivity().supportFragmentManager.beginTransaction()
                .replace(R.id.fragmentContainer, detailFragment)
                .addToBackStack(null)
                .commit()
        }

        binding.rvHospitals.layoutManager = LinearLayoutManager(requireContext())
        binding.rvHospitals.adapter = adapter

        binding.swipeRefresh.setOnRefreshListener {
            loadData()
        }

        // Location click listener
        binding.cardLocation.setOnClickListener {
            Toast.makeText(requireContext(), "📍 Updated location: Indiranagar, Bengaluru (GPS Active)", Toast.LENGTH_SHORT).show()
        }

        // Search text listener
        binding.etSearch.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {
                searchQuery = s.toString()
                applyFilters()
            }
            override fun afterTextChanged(s: Editable?) {}
        })

        // Filter chips group listener
        binding.chipGroupFilters.setOnCheckedStateChangeListener { _, checkedIds ->
            selectedFilter = if (checkedIds.contains(R.id.chipFilterOpen)) {
                "open"
            } else if (checkedIds.contains(R.id.chipFilterShortest)) {
                "shortest"
            } else if (checkedIds.contains(R.id.chipFilterTopRated)) {
                "top_rated"
            } else {
                "all"
            }
            applyFilters()
        }

        // Specialty chips group listener
        binding.chipGroupSpecialties.setOnCheckedStateChangeListener { _, checkedIds ->
            val firstId = checkedIds.firstOrNull()
            selectedSpecialty = when (firstId) {
                R.id.chipSpecGeneral -> "General Physician"
                R.id.chipSpecPedia -> "Pediatrics"
                R.id.chipSpecDerma -> "Dermatology"
                R.id.chipSpecDental -> "Dental"
                R.id.chipSpecENT -> "ENT"
                R.id.chipSpecGyna -> "Gynaecology"
                R.id.chipSpecCardio -> "Cardiology"
                R.id.chipSpecOrtho -> "Orthopedics"
                else -> "All Specialties"
            }
            applyFilters()
        }

        loadData()
    }

    private fun loadData() {
        binding.swipeRefresh.isRefreshing = true
        lifecycleScope.launch {
            allHospitals = SupabaseRepository.getHospitals()
            allDoctors = SupabaseRepository.getDoctors()
            allTokens = SupabaseRepository.getQueueTokens()

            applyFilters()
            binding.swipeRefresh.isRefreshing = false
        }
    }

    private fun applyFilters() {
        var filtered = allHospitals.filter { hospital ->
            if (hospital.is_deleted) return@filter false

            // Search matching name, address, or doctor specialty
            val matchesSearch = if (searchQuery.isEmpty()) true else {
                hospital.name.contains(searchQuery, ignoreCase = true) ||
                hospital.address.contains(searchQuery, ignoreCase = true) ||
                allDoctors.any { d -> d.hospital_id == hospital.id && d.specialty.contains(searchQuery, ignoreCase = true) }
            }
            if (!matchesSearch) return@filter false

            // Filter Chips: Open Now, Top Rated
            if (selectedFilter == "open" && !hospital.isCurrentlyOpen()) return@filter false
            if (selectedFilter == "top_rated" && hospital.rating < 4.7) return@filter false

            // Specialty filter
            if (selectedSpecialty != "All Specialties") {
                val hasDocWithSpec = allDoctors.any { d -> d.hospital_id == hospital.id && !d.is_resigned && d.specialty == selectedSpecialty }
                if (!hasDocWithSpec) return@filter false
            }

            true
        }

        // Shortest wait sort
        if (selectedFilter == "shortest") {
            filtered = filtered.sortedBy { hospital ->
                val primaryDoc = allDoctors.firstOrNull { d -> d.hospital_id == hospital.id && !d.is_resigned }
                if (primaryDoc != null) {
                    val waitingCount = allTokens.count { t -> t.doctor_id == primaryDoc.id && t.status == "waiting" }
                    waitingCount * primaryDoc.avg_consult_minutes
                } else {
                    999
                }
            }
        }

        adapter.setData(filtered, allDoctors, allTokens)
        binding.tvResultsCount.text = "(${filtered.size} places found)"
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
