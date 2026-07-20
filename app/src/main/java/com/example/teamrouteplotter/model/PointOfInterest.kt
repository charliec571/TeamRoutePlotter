package com.example.teamrouteplotter.model

import java.io.Serializable

data class PointOfInterest(
    val id: String,
    val name: String,
    val latitude: Double,
    val longitude: Double
) : Serializable
