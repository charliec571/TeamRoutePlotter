package com.example.teamrouteplotter.ui

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.EditText
import androidx.appcompat.app.AlertDialog
import androidx.fragment.app.Fragment
import com.example.teamrouteplotter.R
import com.example.teamrouteplotter.databinding.FragmentMapBinding
import com.example.teamrouteplotter.model.PointOfInterest
import com.google.android.gms.maps.CameraUpdateFactory
import com.google.android.gms.maps.GoogleMap
import com.google.android.gms.maps.OnMapReadyCallback
import com.google.android.gms.maps.SupportMapFragment
import com.google.android.gms.maps.model.LatLng
import com.google.android.gms.maps.model.MarkerOptions
import java.util.UUID

class MapFragment : Fragment(), OnMapReadyCallback {

    private var _binding: FragmentMapBinding? = null
    private val binding get() = _binding!!
    private lateinit var map: GoogleMap
    private val points = mutableListOf<PointOfInterest>()

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentMapBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        val mapFragment = childFragmentManager.findFragmentById(R.id.map) as SupportMapFragment
        mapFragment.getMapAsync(this)

        binding.btnCreateRoute.setOnClickListener {
            // Navigate to RouteListFragment, passing the points
            val fragment = RouteListFragment.newInstance(points)
            parentFragmentManager.beginTransaction()
                .replace(R.id.fragment_container, fragment)
                .addToBackStack(null)
                .commit()
        }
    }

    override fun onMapReady(googleMap: GoogleMap) {
        map = googleMap

        // Set a default location (e.g., Sydney) or user's location if permission granted
        val sydney = LatLng(-34.0, 151.0)
        map.moveCamera(CameraUpdateFactory.newLatLng(sydney))

        map.setOnMapLongClickListener { latLng ->
            showAddPointDialog(latLng)
        }
    }

    private fun showAddPointDialog(latLng: LatLng) {
        val input = EditText(requireContext())
        AlertDialog.Builder(requireContext())
            .setTitle(getString(R.string.dialog_point_name_title))
            .setView(input)
            .setPositiveButton(getString(R.string.dialog_add)) { _, _ ->
                val name = input.text.toString()
                if (name.isNotEmpty()) {
                    addPoint(name, latLng)
                }
            }
            .setNegativeButton(getString(R.string.dialog_cancel), null)
            .show()
    }

    private fun addPoint(name: String, latLng: LatLng) {
        val point = PointOfInterest(UUID.randomUUID().toString(), name, latLng.latitude, latLng.longitude)
        points.add(point)
        map.addMarker(MarkerOptions().position(latLng).title(name))
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
