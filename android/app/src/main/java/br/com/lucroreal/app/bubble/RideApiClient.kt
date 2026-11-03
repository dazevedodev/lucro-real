package br.com.lucroreal.app.bubble

import android.os.Handler
import android.os.Looper
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.Executors
import org.json.JSONObject

/**
 * Cliente HTTP minimalista (sem OkHttp) pra falar com /api/rides e com o
 * endpoint de refresh de token do Supabase. Sem dependências novas de build.
 */
object RideApiClient {
    private val executor = Executors.newSingleThreadExecutor()
    private val mainHandler = Handler(Looper.getMainLooper())

    sealed class RideResult {
        data class Success(val netProfit: Double) : RideResult()
        data class SessionReplaced(val message: String) : RideResult()
        data class Error(val message: String) : RideResult()
    }

    fun postRide(
        session: SessionStore.Session,
        valueReceived: Double,
        kmDriven: Double,
        callback: (RideResult) -> Unit
    ) {
        executor.execute {
            val result = try {
                val url = URL("${session.apiBaseUrl}/api/rides")
                val conn = (url.openConnection() as HttpURLConnection).apply {
                    requestMethod = "POST"
                    doOutput = true
                    connectTimeout = 10_000
                    readTimeout = 10_000
                    setRequestProperty("Content-Type", "application/json")
                    setRequestProperty("Authorization", "Bearer ${session.accessToken}")
                    setRequestProperty("X-Session-Id", session.sessionId)
                }

                val body = JSONObject().apply {
                    put("valueReceived", valueReceived)
                    put("kmDriven", kmDriven)
                }

                OutputStreamWriter(conn.outputStream).use { it.write(body.toString()) }

                val code = conn.responseCode
                val stream = if (code in 200..299) conn.inputStream else conn.errorStream
                val responseText = stream?.bufferedReader()?.use { it.readText() } ?: ""
                val json = try { JSONObject(responseText) } catch (e: Exception) { JSONObject() }

                when {
                    code in 200..299 -> {
                        val netProfit = json.optJSONObject("ride")?.optDouble("net_profit") ?: 0.0
                        RideResult.Success(netProfit)
                    }
                    code == 401 && json.optString("error") == "session_replaced" ->
                        RideResult.SessionReplaced("Sessão encerrada — abra o app e faça login de novo.")
                    code == 401 ->
                        RideResult.SessionReplaced("Sessão expirada — abra o app pra renovar.")
                    else ->
                        RideResult.Error(json.optString("error", "Não foi possível registrar a corrida."))
                }
            } catch (e: Exception) {
                RideResult.Error("Sem conexão com o servidor.")
            }

            mainHandler.post { callback(result) }
        }
    }

    /** Renova o access_token usando o refresh_token direto na API do Supabase Auth. */
    fun refreshAccessToken(
        session: SessionStore.Session,
        callback: (accessToken: String, refreshToken: String) -> Unit,
        onFailure: () -> Unit
    ) {
        executor.execute {
            try {
                val url = URL("${session.supabaseUrl}/auth/v1/token?grant_type=refresh_token")
                val conn = (url.openConnection() as HttpURLConnection).apply {
                    requestMethod = "POST"
                    doOutput = true
                    connectTimeout = 10_000
                    readTimeout = 10_000
                    setRequestProperty("Content-Type", "application/json")
                    setRequestProperty("apikey", session.supabaseAnonKey)
                }

                val body = JSONObject().apply { put("refresh_token", session.refreshToken) }
                OutputStreamWriter(conn.outputStream).use { it.write(body.toString()) }

                if (conn.responseCode !in 200..299) {
                    mainHandler.post { onFailure() }
                    return@execute
                }

                val json = JSONObject(conn.inputStream.bufferedReader().use { it.readText() })
                val newAccessToken = json.getString("access_token")
                val newRefreshToken = json.getString("refresh_token")
                mainHandler.post { callback(newAccessToken, newRefreshToken) }
            } catch (e: Exception) {
                mainHandler.post { onFailure() }
            }
        }
    }
}
