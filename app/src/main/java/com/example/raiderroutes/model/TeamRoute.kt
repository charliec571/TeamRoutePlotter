package com.example.raiderroutes.model

import java.io.Serializable

data class TeamRoute(
    val teamName: String,
    val points: List<PointOfInterest>
) : Serializable
