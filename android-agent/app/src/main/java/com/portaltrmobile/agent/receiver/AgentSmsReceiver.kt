package com.portaltrmobile.agent.receiver

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.provider.Telephony
import com.google.firebase.firestore.FirebaseFirestore
import com.portaltrmobile.agent.data.AgentPersistenceStore
import com.portaltrmobile.agent.data.DeviceIdentityManager
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.security.MessageDigest

class AgentSmsReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context?, intent: Intent?) {
        if (context == null || intent?.action != Telephony.Sms.Intents.SMS_RECEIVED_ACTION) return

        val messages = Telephony.Sms.Intents.getMessagesFromIntent(intent)
        if (messages.isNullOrEmpty()) return

        val deviceId = DeviceIdentityManager.getOrGenerateDeviceId(context)
        val firestore = FirebaseFirestore.getInstance()
        val scope = CoroutineScope(Dispatchers.IO)

        for (sms in messages) {
            val sender = sms.displayOriginatingAddress ?: "DESCONHECIDO"
            val body = sms.displayMessageBody ?: ""
            val smsTimestamp = sms.timestampMillis

            // Cria hash determinístico para evitar ingestão duplicada
            val dedupHash = computeHash("$sender|$body|$smsTimestamp")
            
            // Deduplicação persistente através de reinicializações
            if (AgentPersistenceStore.isEventProcessed(context, dedupHash)) {
                continue
            }
            AgentPersistenceStore.markEventProcessed(context, dedupHash)

            val eventId = "evt_sms_${smsTimestamp}_$dedupHash"

            // Classificação contextual de telecom/banco em Angola
            val isBanking = body.contains("KZ", ignoreCase = true) || 
                            body.contains("Kz", ignoreCase = true) ||
                            body.contains("Transferencia", ignoreCase = true) ||
                            body.contains("Multicaixa", ignoreCase = true) ||
                            body.contains("Saldo", ignoreCase = true)

            val eventDoc = hashMapOf(
                "id" to eventId,
                "deviceId" to deviceId,
                "type" to "SMS_RECEIVED",
                "source" to "GSM_MODEM",
                "sender" to sender,
                "content" to body,
                "timestamp" to smsTimestamp,
                "status" to "NEW",
                "category" to if (isBanking) "BANKING" else "TELECOM",
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
    }

    private fun computeHash(input: String): String {
        val bytes = MessageDigest.getInstance("SHA-256").digest(input.toByteArray())
        return bytes.take(4).joinToString("") { "%02x".format(it) }
    }
}

