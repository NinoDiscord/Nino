package sh.nino.modules.timeouts.types

import kotlinx.serialization.SerialName

interface Response

@kotlinx.serialization.Serializable
data class StatsResponse(
    @SerialName("go_version")
    val goVersion: String,

    @SerialName("commit_sha")
    val commitSha: String,

    @SerialName("build_date")
    val buildDate: String,
    val version: String
): Response

@kotlinx.serialization.Serializable
data class TimeoutsResponse(val timeouts: List<Timeout>): Response
