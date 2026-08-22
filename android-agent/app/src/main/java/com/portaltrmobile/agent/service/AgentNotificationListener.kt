package com.portaltrmobile.agent.service

import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import com.google.firebase.firestore.FirebaseFirestore
import com.portaltrmobile.agent.data.AgentPersistenceStore
import com.portaltrmobile.agent.data.DeviceIdentityManager
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.security.MessageDigest

class AgentNotificationListener : NotificationListenerService() {

    private val firestore by lazy { FirebaseFirestore.getInstance() }
    private val scope = CoroutineScope(Dispatchers.IO)

    // Lista de pacotes estritamente monitorados (Telecom, Banking, SMS)
    private val allowedPackageKeywords = listOf(
        "telephony", "mms", "messaging", "sms",
        "emis", "multicaixa", "bai", "bfa", "atlantico", "bpc", "keve", "sol",
        "unitel", "movicel", "africell"
    )

    override fun onNotificationPosted(sbn: StatusBarNotification?) {
        if (sbn == null) return

        val packageName = sbn.packageName?.lowercase() ?: return
        
        // 1. Filtragem rigorosa: ignora pacotes do sistema genérico, daemon e não autorizados
        if (packageName == applicationContext.packageName || packageName == "android") return

        val isAllowed = allowedPackageKeywords.any { packageName.contains(it) }
        if (!isAllowed) {
            // Elimina ingestão indiscriminada de redes sociais ou apps irrelevantes
            return
        }

        val extras = sbn.notification?.extras ?: return
        val rawTitle = extras.getString("android.title") ?: extras.getCharSequence("android.title")?.toString() ?: ""
        val rawText = extras.getString("android.text") ?: extras.getCharSequence("android.text")?.toString() ?: ""

        if (rawTitle.isEmpty() && rawText.isEmpty()) return

        // 2. Cria hash de deduplicação temporal (janela de 1 minuto)
        val dedupHash = computeHash("$packageName|$rawTitle|$rawText|${sbn.postTime / 60000}")
        
        // Deduplicação persistente no armazenamento local
        if (AgentPersistenceStore.isEventProcessed(applicationContext, dedupHash)) {
            return
        }
        AgentPersistenceStore.markEventProcessed(applicationContext, dedupHash)

        val deviceId = DeviceIdentityManager.getOrGenerateDeviceId(applicationContext)
        val eventId = "evt_notif_${System.currentTimeMillis()}_$dedupHash"

        // 3. Classificação estrita
        val category = when {
            packageName.contains("emis") || packageName.contains("multicaixa") || 
            packageName.contains("bai") || packageName.contains("bfa") || 
            packageName.contains("atlantico") || rawText.contains("Kz", ignoreCase = true) -> "BANKING"
            packageName.contains("unitel") || packageName.contains("movicel") || 
            packageName.contains("africell") || packageName.contains("sms") -> "TELECOM"
            else -> "SYSTEM"
        }

        val eventDoc = hashMapOf(
            "id" to eventId,
            "deviceId" to deviceId,
            "type" to "NOTIFICATION_RECEIVED",
            "source" to packageName,
            "sender" to rawTitle.take(64), // Limita tamanho por privacidade
            "content" to rawText.take(256),
            "timestamp" to sbn.postTime,
            "status" to "NEW",
            "category" to category,
            "dedupHash" to dedupHash
        )

        scope.launch {
            try {
                firestore.collection("events").document(eventId).set(eventDoc)
            } catch (e: Exception) {
                // Falha silenciosa
            }
        }
    }

    private fun computeHash(input: String): String {
        val bytes = MessageDigest.getInstance("SHA-256").digest(input.toByteArray())
        return bytes.take(4).joinToString("") { "%02x".format(it) }
    }
}


