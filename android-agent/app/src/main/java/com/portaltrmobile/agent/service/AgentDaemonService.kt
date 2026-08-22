package com.portaltrmobile.agent.service

import android.app.Notification
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.BatteryManager
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.ListenerRegistration
import com.google.firebase.firestore.SetOptions
import com.portaltrmobile.agent.PortalTRAgentApp
import com.portaltrmobile.agent.data.AgentPersistenceStore
import com.portaltrmobile.agent.data.DeviceIdentityManager
import com.portaltrmobile.agent.telecom.TelecomExecutor
import com.portaltrmobile.agent.ui.ProvisioningActivity
import kotlinx.coroutines.*

class AgentDaemonService : Service() {

    private val serviceScope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private lateinit var firestore: FirebaseFirestore
    private lateinit var auth: FirebaseAuth
    
    private var commandListenerRegistration: ListenerRegistration? = null
    private var heartbeatJob: Job? = null
    private var isRunning = false

    companion object {
        // Heartbeat ultraleve: 5 minutos (300 segundos) para preservar bateria e quota do Firestore
        private const val HEARTBEAT_INTERVAL_MS = 300_000L
        private const val PRESENCE_TTL_MS = 900_000L // 15 minutos de tolerância estrita
    }

    override fun onCreate() {
        super.onCreate()
        firestore = FirebaseFirestore.getInstance()
        auth = FirebaseAuth.getInstance()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (!isRunning) {
            isRunning = true
            startForeground(1001, createKeepAliveNotification())
            authenticateAndStartLifecycle()
        }
        return START_STICKY
    }

    private fun authenticateAndStartLifecycle() {
        serviceScope.launch {
            try {
                if (auth.currentUser == null) {
                    auth.signInAnonymously().await()
                }
                registerDeviceMetadata()
                publishPresencePulse()
                startLowFrequencyHeartbeat()
                startCommandQueueListener()
            } catch (e: Exception) {
                delay(10000)
                if (isRunning) authenticateAndStartLifecycle()
            }
        }
    }

    private fun registerDeviceMetadata() {
        val deviceId = DeviceIdentityManager.getOrGenerateDeviceId(this)
        val uid = DeviceIdentityManager.getPairedUid(this)
        val isReady = DeviceIdentityManager.isReady(this)
        val stage = DeviceIdentityManager.getProvisioningStage(this)

        val deviceDoc = hashMapOf(
            "deviceId" to deviceId,
            "model" to Build.MODEL,
            "manufacturer" to Build.MANUFACTURER,
            "androidVersion" to Build.VERSION.RELEASE,
            "appVersion" to "1.0.0-agent",
            "status" to stage, // UNPROVISIONED, PROVISIONED, READY
            "isReady" to isReady,
            "capabilities" to listOf("SMS", "CALLS", "NOTIFICATIONS", "USSD"),
            "pairedUid" to uid,
            "lastSeen" to System.currentTimeMillis()
        )

        firestore.collection("devices").document(deviceId).set(deviceDoc, SetOptions.merge())
    }

    private fun startLowFrequencyHeartbeat() {
        heartbeatJob?.cancel()
        heartbeatJob = serviceScope.launch {
            while (isActive) {
                delay(HEARTBEAT_INTERVAL_MS)
                publishPresencePulse()
            }
        }
    }

    private fun publishPresencePulse() {
        val deviceId = DeviceIdentityManager.getOrGenerateDeviceId(this)
        val uid = DeviceIdentityManager.getPairedUid(this)
        val docKey = "${uid}_${deviceId}"
        val now = System.currentTimeMillis()

        val pulse = hashMapOf(
            "uid" to uid,
            "deviceId" to deviceId,
            "status" to "online",
            "lastHeartbeat" to now,
            "lastSeen" to now,
            "ttlMs" to PRESENCE_TTL_MS,
            "deviceType" to "android",
            "batteryLevel" to getBatteryPercentage()
        )

        // Única escrita periódica estrita no Firestore
        firestore.collection("presence").document(docKey).set(pulse, SetOptions.merge())
    }

    private fun startCommandQueueListener() {
        val deviceId = DeviceIdentityManager.getOrGenerateDeviceId(this)

        commandListenerRegistration?.remove()
        // Escuta estritamente comandos destinados ao próprio deviceId
        commandListenerRegistration = firestore.collection("outbound_commands")
            .whereEqualTo("nodeId", deviceId)
            .whereEqualTo("status", "QUEUED")
            .addSnapshotListener { snapshot, error ->
                if (error != null || snapshot == null) return@addSnapshotListener

                for (doc in snapshot.documents) {
                    val commandId = doc.id
                    
                    // Verificação de idempotência persistente via SharedPreferences
                    if (AgentPersistenceStore.isCommandProcessed(this@AgentDaemonService, commandId)) {
                        continue
                    }

                    val type = doc.getString("type") ?: ""
                    val recipient = doc.getString("recipient") ?: ""
                    val message = doc.getString("message") ?: ""
                    val payload = doc.get("payload") as? Map<String, Any>

                    processCommand(commandId, type, recipient, message, payload)
                }
            }
    }

    private fun processCommand(
        commandId: String,
        type: String,
        recipient: String,
        message: String,
        payload: Map<String, Any>?
    ) {
        // Marca imediatamente na persistência local antes da execução (Evita corrida em reconexão)
        AgentPersistenceStore.markCommandProcessed(this@AgentDaemonService, commandId)

        serviceScope.launch {
            val docRef = firestore.collection("outbound_commands").document(commandId)
            
            try {
                // 1. Marca como EXECUTING no contrato único
                docRef.update(
                    mapOf(
                        "status" to "EXECUTING",
                        "executionStage" to "EXECUTING",
                        "receivedAt" to System.currentTimeMillis(),
                        "executingAt" to System.currentTimeMillis()
                    )
                )

                // 2. Executa comando isolado com evidência
                val result = TelecomExecutor.executeCommand(this@AgentDaemonService, type, recipient, message, payload)

                // 3. Publica status unificado: RESULT_CONFIRMED ou FAILED
                val finalStatus = if (result.success) "RESULT_CONFIRMED" else "FAILED"
                val stage = if (result.success) "RESULT_CONFIRMED" else "FAILED"

                val updates = mutableMapOf<String, Any>(
                    "status" to finalStatus,
                    "executionStage" to stage,
                    "executedAt" to System.currentTimeMillis(),
                    "resultPayload" to (result.payload ?: emptyMap<String, Any>())
                )
                if (!result.success && result.error != null) {
                    updates["error"] = result.error
                }

                docRef.update(updates)
            } catch (e: Exception) {
                docRef.update(
                    mapOf(
                        "status" to "FAILED",
                        "executionStage" to "FAILED",
                        "error" to "Falha de execução no Daemon: ${e.localizedMessage}",
                        "executedAt" to System.currentTimeMillis()
                    )
                )
            }
        }
    }

    private fun getBatteryPercentage(): Int {
        val bm = getSystemService(Context.BATTERY_SERVICE) as? BatteryManager
        return bm?.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY) ?: 100
    }

    private fun createKeepAliveNotification(): Notification {
        val pendingIntent = PendingIntent.getActivity(
            this, 0,
            Intent(this, ProvisioningActivity::class.java),
            PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, PortalTRAgentApp.CHANNEL_ID)
            .setContentTitle("PortalTR Agent — Conectado")
            .setContentText("Aguardando comandos e monitorando rede")
            .setSmallIcon(android.R.drawable.stat_notify_sync)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }

    override fun onDestroy() {
        isRunning = false
        heartbeatJob?.cancel()
        commandListenerRegistration?.remove()
        serviceScope.cancel()
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null
}


