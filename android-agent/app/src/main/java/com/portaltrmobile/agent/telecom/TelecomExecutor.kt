package com.portaltrmobile.agent.telecom

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.telephony.SmsManager
import android.telephony.TelephonyManager
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.security.MessageDigest

data class ExecutionResult(
    val success: Boolean,
    val payload: Map<String, Any>? = null,
    val error: String? = null
)

object TelecomExecutor {

    suspend fun executeCommand(
        context: Context,
        type: String,
        recipient: String,
        message: String,
        payload: Map<String, Any>?
    ): ExecutionResult = withContext(Dispatchers.IO) {
        return@withContext when (type) {
            "SEND_SMS" -> executeSendSms(context, recipient, message)
            "MAKE_CALL" -> executeMakeCall(context, recipient)
            "RUN_USSD" -> executeRunUssd(context, recipient)
            else -> ExecutionResult(false, null, "Comando não suportado: $type")
        }
    }

    private fun executeSendSms(context: Context, recipient: String, message: String): ExecutionResult {
        if (recipient.isBlank() || message.isBlank()) {
            return ExecutionResult(false, null, "Destinatário ou mensagem vazia para SEND_SMS.")
        }
        return try {
            val smsManager = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                context.getSystemService(SmsManager::class.java)
            } else {
                @Suppress("DEPRECATION")
                SmsManager.getDefault()
            }

            val parts = smsManager.divideMessage(message)
            if (parts.size > 1) {
                smsManager.sendMultipartTextMessage(recipient, null, parts, null, null)
            } else {
                smsManager.sendTextMessage(recipient, null, message, null, null)
            }

            val evidenceHash = computeEvidenceHash("SMS|$recipient|${System.currentTimeMillis()}")
            ExecutionResult(
                success = true,
                payload = mapOf(
                    "recipient" to recipient,
                    "partsCount" to parts.size,
                    "charCount" to message.length,
                    "evidenceHash" to evidenceHash,
                    "dispatchedAt" to System.currentTimeMillis()
                )
            )
        } catch (e: Exception) {
            ExecutionResult(false, null, "Falha no hardware GSM ao enviar SMS: ${e.localizedMessage}")
        }
    }

    private fun executeMakeCall(context: Context, number: String): ExecutionResult {
        if (number.isBlank()) {
            return ExecutionResult(false, null, "Número inválido para MAKE_CALL.")
        }
        return try {
            val callIntent = Intent(Intent.ACTION_CALL).apply {
                data = Uri.parse("tel:${Uri.encode(number)}")
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            context.startActivity(callIntent)
            
            val evidenceHash = computeEvidenceHash("CALL|$number|${System.currentTimeMillis()}")
            ExecutionResult(
                success = true, 
                payload = mapOf(
                    "dialedNumber" to number,
                    "evidenceHash" to evidenceHash,
                    "initiatedAt" to System.currentTimeMillis()
                )
            )
        } catch (e: Exception) {
            ExecutionResult(false, null, "Falha na camada de telefonia ao iniciar chamada: ${e.localizedMessage}")
        }
    }

    private fun executeRunUssd(context: Context, code: String): ExecutionResult {
        if (code.isBlank()) {
            return ExecutionResult(false, null, "Código USSD inválido.")
        }
        return try {
            // Nota de realidade: Em Android Go (ZTE Blade A36), USSD interativo via API requer Accessibility ou discagem direta.
            val encodedCode = if (code.endsWith("#")) code.dropLast(1) + Uri.encode("#") else code
            val ussdUri = Uri.parse("tel:$encodedCode")
            val callIntent = Intent(Intent.ACTION_CALL, ussdUri).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            context.startActivity(callIntent)
            
            val evidenceHash = computeEvidenceHash("USSD|$code|${System.currentTimeMillis()}")
            ExecutionResult(
                success = true,
                payload = mapOf(
                    "ussdCode" to code,
                    "dispatchedMode" to "TELEPHONY_INTENT",
                    "evidenceHash" to evidenceHash,
                    "dispatchedAt" to System.currentTimeMillis()
                )
            )
        } catch (e: Exception) {
            ExecutionResult(false, null, "Falha ao enviar código USSD: ${e.localizedMessage}")
        }
    }

    private fun computeEvidenceHash(seed: String): String {
        val bytes = MessageDigest.getInstance("SHA-256").digest(seed.toByteArray())
        return bytes.take(6).joinToString("") { "%02x".format(it) }
    }
}

