package expo.modules.betappshield

import android.app.Activity
import android.content.Intent
import android.net.VpnService
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.exception.Exceptions

private const val VPN_REQUEST_CODE = 7711

class BetappShieldModule : Module() {
  private val context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  private var pendingPrepare: Promise? = null

  override fun definition() = ModuleDefinition {
    Name("BetappShield")

    OnActivityResult { _, payload ->
      if (payload.requestCode != VPN_REQUEST_CODE) return@OnActivityResult
      val promise = pendingPrepare ?: return@OnActivityResult
      pendingPrepare = null
      promise.resolve(mapOf("granted" to (payload.resultCode == Activity.RESULT_OK)))
    }

    Function("isSupported") {
      true
    }

    AsyncFunction("prepare") { promise: Promise ->
      val intent = VpnService.prepare(context)
      if (intent == null) {
        promise.resolve(mapOf("granted" to true))
        return@AsyncFunction
      }

      val activity = appContext.currentActivity
      if (activity == null) {
        promise.resolve(mapOf("granted" to false))
        return@AsyncFunction
      }

      pendingPrepare = promise
      activity.startActivityForResult(intent, VPN_REQUEST_CODE)
    }

    AsyncFunction("start") { domains: List<String>, promise: Promise ->
      val consent = VpnService.prepare(context)
      if (consent != null) {
        promise.reject("E_VPN_PERMISSION", "VPN permission is required", null)
        return@AsyncFunction
      }

      val intent = Intent(context, BetappShieldVpnService::class.java).apply {
        action = BetappShieldVpnService.ACTION_START
        putStringArrayListExtra(
          BetappShieldVpnService.EXTRA_DOMAINS,
          ArrayList(domains.map { it.lowercase().trim() }.filter { it.isNotEmpty() })
        )
      }
      context.startForegroundService(intent)
      promise.resolve(mapOf("active" to true))
    }

    AsyncFunction("stop") { promise: Promise ->
      val intent = Intent(context, BetappShieldVpnService::class.java).apply {
        action = BetappShieldVpnService.ACTION_STOP
      }
      context.startService(intent)
      promise.resolve(mapOf("active" to false))
    }

    AsyncFunction("getStatus") { promise: Promise ->
      promise.resolve(mapOf("active" to BetappShieldVpnService.isRunning))
    }
  }
}
