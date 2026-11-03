package br.com.lucroreal.app.bubble

import android.Manifest
import android.content.Intent
import android.net.Uri
import android.provider.Settings
import androidx.activity.result.ActivityResult
import com.getcapacitor.JSObject
import com.getcapacitor.PermissionState
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.ActivityCallback
import com.getcapacitor.annotation.CapacitorPlugin
import com.getcapacitor.annotation.Permission
import com.getcapacitor.annotation.PermissionCallback

@CapacitorPlugin(
    name = "FloatingBubble",
    permissions = [
        Permission(strings = [Manifest.permission.RECORD_AUDIO], alias = "microphone")
    ]
)
class FloatingBubblePlugin : Plugin() {

    private lateinit var sessionStore: SessionStore

    override fun load() {
        sessionStore = SessionStore(context)
    }

    @PluginMethod
    fun hasOverlayPermission(call: PluginCall) {
        val ret = JSObject()
        ret.put("granted", Settings.canDrawOverlays(context))
        call.resolve(ret)
    }

    @PluginMethod
    fun requestOverlayPermission(call: PluginCall) {
        if (Settings.canDrawOverlays(context)) {
            val ret = JSObject()
            ret.put("granted", true)
            call.resolve(ret)
            return
        }
        val intent = Intent(
            Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
            Uri.parse("package:" + context.packageName)
        )
        startActivityForResult(call, intent, "overlayPermissionResult")
    }

    @ActivityCallback
    private fun overlayPermissionResult(call: PluginCall?, result: ActivityResult) {
        if (call == null) return
        val ret = JSObject()
        ret.put("granted", Settings.canDrawOverlays(context))
        call.resolve(ret)
    }

    @PluginMethod
    fun hasMicPermission(call: PluginCall) {
        val ret = JSObject()
        ret.put("granted", getPermissionState("microphone") == PermissionState.GRANTED)
        call.resolve(ret)
    }

    @PluginMethod
    fun requestMicPermission(call: PluginCall) {
        if (getPermissionState("microphone") == PermissionState.GRANTED) {
            val ret = JSObject()
            ret.put("granted", true)
            call.resolve(ret)
            return
        }
        requestPermissionForAlias("microphone", call, "micPermissionResult")
    }

    @PermissionCallback
    private fun micPermissionResult(call: PluginCall) {
        val ret = JSObject()
        ret.put("granted", getPermissionState("microphone") == PermissionState.GRANTED)
        call.resolve(ret)
    }

    @PluginMethod
    fun setSession(call: PluginCall) {
        val sessionId = call.getString("sessionId")
        val accessToken = call.getString("accessToken")
        val refreshToken = call.getString("refreshToken")
        val supabaseUrl = call.getString("supabaseUrl")
        val supabaseAnonKey = call.getString("supabaseAnonKey")
        val apiBaseUrl = call.getString("apiBaseUrl")

        if (sessionId == null || accessToken == null || refreshToken == null ||
            supabaseUrl == null || supabaseAnonKey == null || apiBaseUrl == null
        ) {
            call.reject("missing session fields")
            return
        }

        sessionStore.save(
            SessionStore.Session(
                sessionId, accessToken, refreshToken, supabaseUrl, supabaseAnonKey, apiBaseUrl
            )
        )
        call.resolve()
    }

    @PluginMethod
    fun clearSession(call: PluginCall) {
        sessionStore.clear()
        BubbleService.stop(context)
        call.resolve()
    }

    @PluginMethod
    fun show(call: PluginCall) {
        if (sessionStore.load() == null) {
            call.reject("no session — login first")
            return
        }
        if (!Settings.canDrawOverlays(context)) {
            call.reject("overlay permission not granted")
            return
        }
        BubbleService.start(context)
        call.resolve()
    }

    @PluginMethod
    fun hide(call: PluginCall) {
        BubbleService.stop(context)
        call.resolve()
    }

    @PluginMethod
    fun isShowing(call: PluginCall) {
        val ret = JSObject()
        ret.put("showing", BubbleService.isRunning)
        call.resolve(ret)
    }
}
