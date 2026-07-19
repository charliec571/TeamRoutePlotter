package com.example.teamrouteplotter.ui

import android.content.Intent
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.recyclerview.widget.ItemTouchHelper
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.example.teamrouteplotter.databinding.FragmentRouteListBinding
import com.example.teamrouteplotter.model.PointOfInterest
import java.io.Serializable

class RouteListFragment : Fragment() {

    private var _binding: FragmentRouteListBinding? = null
    private val binding get() = _binding!!
    private lateinit var adapter: PointsAdapter
    private var points: MutableList<PointOfInterest> = mutableListOf()

    companion object {
        private const val ARG_POINTS = "points"

        fun newInstance(points: List<PointOfInterest>): RouteListFragment {
            val fragment = RouteListFragment()
            val args = Bundle()
            args.putSerializable(ARG_POINTS, points as Serializable)
            fragment.arguments = args
            return fragment
        }
    }

    @Suppress("UNCHECKED_CAST")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        arguments?.let {
            points = (it.getSerializable(ARG_POINTS) as? List<PointOfInterest>)?.toMutableList() ?: mutableListOf()
        }
    }

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentRouteListBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        adapter = PointsAdapter(points)
        binding.rvPoints.layoutManager = LinearLayoutManager(context)
        binding.rvPoints.adapter = adapter

        // Setup Drag and Drop
        val itemTouchHelper = ItemTouchHelper(object : ItemTouchHelper.SimpleCallback(
            ItemTouchHelper.UP or ItemTouchHelper.DOWN, 0
        ) {
            override fun onMove(
                recyclerView: RecyclerView,
                viewHolder: RecyclerView.ViewHolder,
                target: RecyclerView.ViewHolder
            ): Boolean {
                adapter.onItemMove(viewHolder.adapterPosition, target.adapterPosition)
                return true
            }

            override fun onSwiped(viewHolder: RecyclerView.ViewHolder, direction: Int) {
                // No swipe to delete implemented
            }
        })
        itemTouchHelper.attachToRecyclerView(binding.rvPoints)

        binding.btnShareRoute.setOnClickListener {
            shareRoute()
        }
    }

    private fun shareRoute() {
        val teamName = binding.etTeamName.text.toString()
        if (teamName.isBlank()) {
            Toast.makeText(context, "Please enter a team name", Toast.LENGTH_SHORT).show()
            return
        }

        val currentPoints = adapter.getPoints()
        val sb = StringBuilder()
        sb.append("Route for Team: $teamName\n\n")

        currentPoints.forEachIndexed { index, point ->
            // Create a Google Maps link
            // Format: https://www.google.com/maps/search/?api=1&query=lat,lng
            val mapLink = "https://www.google.com/maps/search/?api=1&query=${point.latitude},${point.longitude}"
            sb.append("${index + 1}. ${point.name}\n$mapLink\n\n")
        }

        val shareIntent = Intent().apply {
            action = Intent.ACTION_SEND
            putExtra(Intent.EXTRA_TEXT, sb.toString())
            type = "text/plain"
        }
        startActivity(Intent.createChooser(shareIntent, "Share Route via"))
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
