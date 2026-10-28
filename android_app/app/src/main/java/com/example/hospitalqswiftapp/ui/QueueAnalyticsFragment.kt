package com.example.hospitalqswiftapp.ui

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.AdapterView
import android.widget.ArrayAdapter
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.example.hospitalqswiftapp.data.Doctor
import com.example.hospitalqswiftapp.data.QueueToken
import com.example.hospitalqswiftapp.data.SupabaseRepository
import com.example.hospitalqswiftapp.databinding.FragmentQueueAnalyticsBinding
import com.example.hospitalqswiftapp.ui.adapters.QueueTokenAdapter
import kotlinx.coroutines.launch

class QueueAnalyticsFragment : Fragment() {

    private var _binding: FragmentQueueAnalyticsBinding? = null
    private val binding get() = _binding!!

    private lateinit var adapter: QueueTokenAdapter
    private var doctorList = listOf<Doctor>()
    private var allTokens = listOf<QueueToken>()

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentQueueAnalyticsBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        adapter = QueueTokenAdapter()
        binding.rvAnalyticsTokens.layoutManager = LinearLayoutManager(requireContext())
        binding.rvAnalyticsTokens.adapter = adapter

        // Setup Date Spinner
        val dates = arrayOf("All Time", "Today", "Yesterday")
        val dateAdapter = ArrayAdapter(requireContext(), android.R.layout.simple_spinner_dropdown_item, dates)
        binding.spAnalyticsDate.adapter = dateAdapter

        binding.spAnalyticsDate.onItemSelectedListener = object : AdapterView.OnItemSelectedListener {
            override fun onItemSelected(parent: AdapterView<*>?, view: View?, position: Int, id: Long) {
                filterAndRender()
            }
            override fun onNothingSelected(parent: AdapterView<*>?) {}
        }

        binding.spAnalyticsDoctor.onItemSelectedListener = object : AdapterView.OnItemSelectedListener {
            override fun onItemSelected(parent: AdapterView<*>?, view: View?, position: Int, id: Long) {
                filterAndRender()
            }
            override fun onNothingSelected(parent: AdapterView<*>?) {}
        }

        loadData()
    }

    private fun loadData() {
        lifecycleScope.launch {
            doctorList = SupabaseRepository.getDoctors()
            val docOptions = arrayOf("All Doctors") + doctorList.map { it.name }.toTypedArray()
            val docAdapter = ArrayAdapter(requireContext(), android.R.layout.simple_spinner_dropdown_item, docOptions)
            binding.spAnalyticsDoctor.adapter = docAdapter

            allTokens = SupabaseRepository.getQueueTokens()
            filterAndRender()
        }
    }

    private fun filterAndRender() {
        val selectedDocIndex = binding.spAnalyticsDoctor.selectedItemPosition
        val selectedDoc = if (selectedDocIndex > 0) doctorList.getOrNull(selectedDocIndex - 1) else null
        val dateMode = binding.spAnalyticsDate.selectedItem?.toString() ?: "All Time"

        val todayStr = java.time.LocalDate.now().toString()
        val yesterdayStr = java.time.LocalDate.now().minusDays(1).toString()

        val filtered = allTokens.filter { t ->
            val matchDoc = selectedDoc == null || t.doctor_id == selectedDoc.id
            val matchDate = when (dateMode) {
                "Today" -> t.queue_date == todayStr || t.queue_date.isNullOrEmpty()
                "Yesterday" -> t.queue_date == yesterdayStr
                else -> true
            }
            matchDoc && matchDate
        }

        val total = filtered.size
        val completed = filtered.count { it.status == "done" }
        val priority = filtered.count { it.is_priority }
        val noShows = filtered.count { it.status == "no_show" || it.status == "cancelled" }

        binding.tvKpiTotal.text = total.toString()
        binding.tvKpiCompleted.text = completed.toString()
        binding.tvKpiPriority.text = priority.toString()
        binding.tvKpiNoShow.text = noShows.toString()

        adapter.submitList(filtered)
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
