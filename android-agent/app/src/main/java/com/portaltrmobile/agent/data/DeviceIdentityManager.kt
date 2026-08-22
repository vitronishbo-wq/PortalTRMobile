package com.portaltrmobile.agent.data

import android.content.Context
import android.os.Build
import android.provider.Settings
import java.security.MessageDigest
import java.util.UUID

object DeviceIdentityManager {

    private const val PREFS_NAME = "portaltr_node_identity"
    private const val KEY_DEVICE_ID = "node_device_id"
    private const val KEY_PAIRED_UID = "node_paired_uid"
    private const val KEY_PROVISIONING_STAGE = "node_provisioning_stage" // UNPROVISIONED, PROVISIONED, PAIRED, READY

    fun getOrGenerateDeviceId(context: Context): String {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val existing = prefs.getString(KEY_DEVICE_ID, null)
        if (!existing.isNullOrEmpty()) {
            return existing
        }

        // Gera UUID persistente de instalação se o ANDROID_ID for inválido ou nulo
        val androidId = try {
            Settings.Secure.getString(context.contentResolver, Settings.Secure.ANDROID_ID)
        } catch (e: Exception) {
            null
        } ?: UUID.randomUUID().toString()

        val rawSeed = "${Build.MANUFACTURER}_${Build.MODEL}_$androidId"
        
        val md = MessageDigest.getInstance("SHA-256")
        val digest = md.digest(rawSeed.toByteArray())
        val hashSnippet = digest.take(4).joinToString("") { "%02x".format(it) }

        val modelSlug = Build.MODEL.lowercase().replace("[^a-z0-9]".toRegex(), "")
        val generatedId = "node_android_${modelSlug}_$hashSnippet"

        prefs.edit().putString(KEY_DEVICE_ID, generatedId).apply()
        return generatedId
    }

    fun getPairedUid(context: Context): String {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        return prefs.getString(KEY_PAIRED_UID, "root_founder") ?: "root_founder"
    }

    fun setPairedUid(context: Context, uid: String) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit().putString(KEY_PAIRED_UID, uid).apply()
    }

    /**
     * Ciclo estrito de Provisionamento:
     * UNPROVISIONED -> PROVISIONED -> PAIRED -> READY
     */
    fun getProvisioningStage(context: Context): String {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        return prefs.getString(KEY_PROVISIONING_STAGE, "UNPROVISIONED") ?: "UNPROVISIONED"
    }

    fun setProvisioningStage(context: Context, stage: String) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit().putString(KEY_PROVISIONING_STAGE, stage).apply()
    }

    fun isReady(context: Context): Boolean {
        return getProvisioningStage(context) == "READY"
    }

    fun isPaired(context: Context): Boolean {
        val stage = getProvisioningStage(context)
        return stage == "PAIRED" || stage == "READY"
    }

    fun isProvisioned(context: Context): Boolean {
        val stage = getProvisioningStage(context)
        return stage == "PROVISIONED" || stage == "PAIRED" || stage == "READY"
    }

    fun resetProvisioning(context: Context) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit()
            .putString(KEY_PROVISIONING_STAGE, "UNPROVISIONED")
            .apply()
    }
}

