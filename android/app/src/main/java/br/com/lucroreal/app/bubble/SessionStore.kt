package br.com.lucroreal.app.bubble

import android.content.Context
import android.content.SharedPreferences

/**
 * Guarda os tokens que a bolha nativa usa pra chamar a API sozinha, fora da
 * WebView. SharedPreferences simples por enquanto — se isso for pra produção
 * de verdade, trocar por EncryptedSharedPreferences (androidx.security.crypto).
 */
class SessionStore(context: Context) {
    private val prefs: SharedPreferences =
        context.getSharedPreferences("lucro_real_bubble_session", Context.MODE_PRIVATE)

    data class Session(
        val sessionId: String,
        val accessToken: String,
        val refreshToken: String,
        val supabaseUrl: String,
        val supabaseAnonKey: String,
        val apiBaseUrl: String
    )

    fun save(session: Session) {
        prefs.edit()
            .putString(KEY_SESSION_ID, session.sessionId)
            .putString(KEY_ACCESS_TOKEN, session.accessToken)
            .putString(KEY_REFRESH_TOKEN, session.refreshToken)
            .putString(KEY_SUPABASE_URL, session.supabaseUrl)
            .putString(KEY_SUPABASE_ANON_KEY, session.supabaseAnonKey)
            .putString(KEY_API_BASE_URL, session.apiBaseUrl)
            .apply()
    }

    fun updateAccessToken(accessToken: String, refreshToken: String) {
        prefs.edit()
            .putString(KEY_ACCESS_TOKEN, accessToken)
            .putString(KEY_REFRESH_TOKEN, refreshToken)
            .apply()
    }

    fun load(): Session? {
        val sessionId = prefs.getString(KEY_SESSION_ID, null) ?: return null
        val accessToken = prefs.getString(KEY_ACCESS_TOKEN, null) ?: return null
        val refreshToken = prefs.getString(KEY_REFRESH_TOKEN, null) ?: return null
        val supabaseUrl = prefs.getString(KEY_SUPABASE_URL, null) ?: return null
        val supabaseAnonKey = prefs.getString(KEY_SUPABASE_ANON_KEY, null) ?: return null
        val apiBaseUrl = prefs.getString(KEY_API_BASE_URL, null) ?: return null
        return Session(sessionId, accessToken, refreshToken, supabaseUrl, supabaseAnonKey, apiBaseUrl)
    }

    fun clear() {
        prefs.edit().clear().apply()
    }

    companion object {
        private const val KEY_SESSION_ID = "session_id"
        private const val KEY_ACCESS_TOKEN = "access_token"
        private const val KEY_REFRESH_TOKEN = "refresh_token"
        private const val KEY_SUPABASE_URL = "supabase_url"
        private const val KEY_SUPABASE_ANON_KEY = "supabase_anon_key"
        private const val KEY_API_BASE_URL = "api_base_url"
    }
}
