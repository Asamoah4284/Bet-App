package expo.modules.betappshield

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Intent
import android.net.VpnService
import android.os.Build
import android.os.ParcelFileDescriptor
import android.util.Log
import java.io.FileInputStream
import java.io.FileOutputStream
import java.net.DatagramPacket
import java.net.DatagramSocket
import java.net.InetAddress
import java.util.concurrent.atomic.AtomicBoolean
import kotlin.concurrent.thread

/**
 * DNS-only local VPN: routes queries for a fake DNS IP through this service,
 * sinkholes blocked domains, and recursively resolves everything else via 8.8.8.8.
 */
class BetappShieldVpnService : VpnService() {
  private var tunInterface: ParcelFileDescriptor? = null
  private val running = AtomicBoolean(false)
  private var blockedDomains: Set<String> = emptySet()

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    when (intent?.action) {
      ACTION_STOP -> {
        stopFilter()
        stopSelf()
        return START_NOT_STICKY
      }
      ACTION_START, null -> {
        val domains = intent?.getStringArrayListExtra(EXTRA_DOMAINS) ?: arrayListOf()
        blockedDomains = domains.map { normalize(it) }.filter { it.isNotEmpty() }.toSet()
        startFilter()
      }
    }
    return START_STICKY
  }

  override fun onDestroy() {
    stopFilter()
    super.onDestroy()
  }

  private fun startFilter() {
    if (running.get()) {
      // Restart with the latest domain list.
      stopFilter()
    }

    startForeground(NOTIFICATION_ID, buildNotification())

    val builder = Builder()
      .setSession("Betapp Shield")
      .setMtu(1500)
      .addAddress(VPN_ADDRESS, 32)
      .addDnsServer(FAKE_DNS)
      .addRoute(FAKE_DNS, 32)
      .setBlocking(true)

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      builder.setMetered(false)
    }

    tunInterface = builder.establish()
    if (tunInterface == null) {
      Log.e(TAG, "Failed to establish VPN interface")
      stopForeground(STOP_FOREGROUND_REMOVE)
      stopSelf()
      return
    }

    running.set(true)
    isRunning = true

    thread(name = "BetappShieldDns", isDaemon = true) {
      val input = FileInputStream(tunInterface!!.fileDescriptor)
      val output = FileOutputStream(tunInterface!!.fileDescriptor)
      val packet = ByteArray(32767)

      while (running.get()) {
        try {
          val length = input.read(packet)
          if (length <= 0) continue
          handlePacket(packet, length, output)
        } catch (error: Exception) {
          if (running.get()) {
            Log.w(TAG, "DNS loop error: ${error.message}")
          }
          break
        }
      }
    }
  }

  private fun stopFilter() {
    running.set(false)
    isRunning = false
    try {
      tunInterface?.close()
    } catch (_: Exception) {
    }
    tunInterface = null
    stopForeground(STOP_FOREGROUND_REMOVE)
  }

  private fun handlePacket(packet: ByteArray, length: Int, output: FileOutputStream) {
    if (length < 28) return

    val version = (packet[0].toInt() ushr 4) and 0x0f
    if (version != 4) return

    val ihl = (packet[0].toInt() and 0x0f) * 4
    if (length < ihl + 8) return

    val protocol = packet[9].toInt() and 0xff
    if (protocol != 17) return // UDP only

    val destPort = ((packet[ihl + 2].toInt() and 0xff) shl 8) or (packet[ihl + 3].toInt() and 0xff)
    if (destPort != 53) return

    val dnsOffset = ihl + 8
    val dnsLength = length - dnsOffset
    if (dnsLength < 12) return

    val qname = readQName(packet, dnsOffset + 12, length) ?: return
    val host = normalize(qname)

    val responseDns: ByteArray = if (isBlocked(host)) {
      buildNxDomain(packet, dnsOffset, dnsLength)
    } else {
      resolveUpstream(packet.copyOfRange(dnsOffset, dnsOffset + dnsLength)) ?: return
    }

    val response = buildUdpIpv4Response(packet, ihl, responseDns)
    output.write(response)
  }

  private fun isBlocked(host: String): Boolean {
    if (blockedDomains.contains(host)) return true
    return blockedDomains.any { host == it || host.endsWith(".$it") }
  }

  private fun resolveUpstream(query: ByteArray): ByteArray? {
    return try {
      val socket = DatagramSocket()
      protect(socket)
      socket.soTimeout = 2500
      val server = InetAddress.getByName(UPSTREAM_DNS)
      socket.send(DatagramPacket(query, query.size, server, 53))
      val buffer = ByteArray(4096)
      val response = DatagramPacket(buffer, buffer.size)
      socket.receive(response)
      socket.close()
      buffer.copyOf(response.length)
    } catch (error: Exception) {
      Log.w(TAG, "Upstream DNS failed: ${error.message}")
      null
    }
  }

  private fun buildNxDomain(packet: ByteArray, dnsOffset: Int, dnsLength: Int): ByteArray {
    val response = packet.copyOfRange(dnsOffset, dnsOffset + dnsLength)
    // Flags: response + recursion available + name error (RCODE 3)
    response[2] = (response[2].toInt() or 0x80).toByte()
    response[3] = ((response[3].toInt() and 0xf0) or 0x83).toByte()
    return response
  }

  private fun buildUdpIpv4Response(request: ByteArray, ihl: Int, dnsPayload: ByteArray): ByteArray {
    val totalLength = ihl + 8 + dnsPayload.size
    val response = ByteArray(totalLength)

    // Copy IP header then swap addresses.
    System.arraycopy(request, 0, response, 0, ihl)
    response[2] = ((totalLength ushr 8) and 0xff).toByte()
    response[3] = (totalLength and 0xff).toByte()
    // TTL
    response[8] = 64
    // Swap src/dest IP
    System.arraycopy(request, 12, response, 16, 4)
    System.arraycopy(request, 16, response, 12, 4)
    // Clear checksum then recompute
    response[10] = 0
    response[11] = 0
    val ipChecksum = checksum(response, 0, ihl)
    response[10] = ((ipChecksum ushr 8) and 0xff).toByte()
    response[11] = (ipChecksum and 0xff).toByte()

    // UDP header
    val srcPort = ((request[ihl + 2].toInt() and 0xff) shl 8) or (request[ihl + 3].toInt() and 0xff)
    val dstPort = ((request[ihl].toInt() and 0xff) shl 8) or (request[ihl + 1].toInt() and 0xff)
    val udpLength = 8 + dnsPayload.size
    response[ihl] = ((srcPort ushr 8) and 0xff).toByte()
    response[ihl + 1] = (srcPort and 0xff).toByte()
    response[ihl + 2] = ((dstPort ushr 8) and 0xff).toByte()
    response[ihl + 3] = (dstPort and 0xff).toByte()
    response[ihl + 4] = ((udpLength ushr 8) and 0xff).toByte()
    response[ihl + 5] = (udpLength and 0xff).toByte()
    response[ihl + 6] = 0
    response[ihl + 7] = 0
    System.arraycopy(dnsPayload, 0, response, ihl + 8, dnsPayload.size)
    return response
  }

  private fun readQName(packet: ByteArray, offset: Int, length: Int): String? {
    var index = offset
    val labels = mutableListOf<String>()
    var jumps = 0

    while (index < length) {
      val size = packet[index].toInt() and 0xff
      if (size == 0) break
      if (size and 0xc0 == 0xc0) {
        if (index + 1 >= length) return null
        index = ((size and 0x3f) shl 8) or (packet[index + 1].toInt() and 0xff)
        jumps += 1
        if (jumps > 10) return null
        continue
      }
      if (index + 1 + size > length) return null
      labels.add(String(packet, index + 1, size, Charsets.US_ASCII))
      index += size + 1
    }

    return labels.joinToString(".")
  }

  private fun checksum(data: ByteArray, offset: Int, length: Int): Int {
    var sum = 0
    var i = offset
    val end = offset + length
    while (i + 1 < end) {
      sum += ((data[i].toInt() and 0xff) shl 8) or (data[i + 1].toInt() and 0xff)
      i += 2
    }
    if (i < end) {
      sum += (data[i].toInt() and 0xff) shl 8
    }
    while (sum ushr 16 != 0) {
      sum = (sum and 0xffff) + (sum ushr 16)
    }
    return sum.inv() and 0xffff
  }

  private fun buildNotification(): Notification {
    val channelId = "betapp_shield"
    val manager = getSystemService(NotificationManager::class.java)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val channel = NotificationChannel(
        channelId,
        "Betapp Shield",
        NotificationManager.IMPORTANCE_LOW
      )
      manager.createNotificationChannel(channel)
    }

    val launch = packageManager.getLaunchIntentForPackage(packageName)
    val pending = PendingIntent.getActivity(
      this,
      0,
      launch,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )

    val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      Notification.Builder(this, channelId)
    } else {
      @Suppress("DEPRECATION")
      Notification.Builder(this)
    }

    return builder
      .setContentTitle("Betapp Shield is on")
      .setContentText("Blocking betting websites on this phone")
      .setSmallIcon(android.R.drawable.ic_lock_lock)
      .setContentIntent(pending)
      .setOngoing(true)
      .build()
  }

  companion object {
    const val ACTION_START = "expo.modules.betappshield.START"
    const val ACTION_STOP = "expo.modules.betappshield.STOP"
    const val EXTRA_DOMAINS = "domains"
    private const val TAG = "BetappShieldVpn"
    private const val NOTIFICATION_ID = 7421
    private const val VPN_ADDRESS = "10.55.55.1"
    private const val FAKE_DNS = "10.55.55.2"
    private const val UPSTREAM_DNS = "8.8.8.8"

    @Volatile
    var isRunning: Boolean = false

    fun normalize(value: String): String {
      return value.trim().lowercase()
        .removePrefix("http://")
        .removePrefix("https://")
        .substringBefore("/")
        .removePrefix("www.")
    }
  }
}
