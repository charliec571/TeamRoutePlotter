package com.example.teamrouteplotter.ui

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.example.teamrouteplotter.databinding.ItemPointBinding
import com.example.teamrouteplotter.model.PointOfInterest
import java.util.Collections

class PointsAdapter(private val points: MutableList<PointOfInterest>) :
    RecyclerView.Adapter<PointsAdapter.PointViewHolder>() {

    inner class PointViewHolder(val binding: ItemPointBinding) :
        RecyclerView.ViewHolder(binding.root)

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): PointViewHolder {
        val binding = ItemPointBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return PointViewHolder(binding)
    }

    override fun onBindViewHolder(holder: PointViewHolder, position: Int) {
        holder.binding.tvPointName.text = points[position].name
    }

    override fun getItemCount(): Int = points.size

    fun onItemMove(fromPosition: Int, toPosition: Int) {
        if (fromPosition < toPosition) {
            for (i in fromPosition until toPosition) {
                Collections.swap(points, i, i + 1)
            }
        } else {
            for (i in fromPosition downTo toPosition + 1) {
                Collections.swap(points, i, i - 1)
            }
        }
        notifyItemMoved(fromPosition, toPosition)
    }
    
    fun getPoints(): List<PointOfInterest> = points
}
