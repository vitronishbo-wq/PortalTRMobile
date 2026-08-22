package com.portaltrmobile.agent.ui

import android.Manifest
import android.content.ComponentName
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.PowerManager
import android.provider.Settings
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import com.portaltrmobile.agent.PortalTRAgentApp
import com.portaltrmobile.agent.data.DeviceIdentityManager
import com.portaltrmobile.agent.service.AgentDaemonService

class ProvisioningActivity : AppCompatActivity() {

    private lateinit var tvDeviceId: TextView
    private lateinit var tvStatus: TextView
    private lateinit var btnGrantPermissions: Button
    private lateinit var btnStartDaemon: Button

    private val requiredPermissions = arrayOf(
        Manifest.permission.RECEIVE_SMS,
        Manifest.permission.READ_SMS,
        Manifest.permission.SEND_SMS,
        Manifest.permission.READ_PHONE_STATE,
        Manifest.permission.READ_CALL_LOG,
        Manifest.permission.CALL_PHONE
    )

    private val permissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { results ->
        val allGranted = results.values.all { it }
        if (allGranted) {
            checkAndPromptNotificationListener()
        } else {
            Toast.makeText(this, "Permissões de SMS e Telefone são essenciais.", Toast.LENGTH_LONG).show()
        }
        updateUI()
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Interface leve e direta
        val layout = android.widget.LinearLayout(this).apply {
            orientation = android.widget.LinearLayout.VERTICAL
            setPadding(48, 64, 48, 64)
            setBackgroundColor(0xFF0D1117.toInt())
        }

        val title = TextView(this).apply {
            text = "PortalTR — Physical Node Provisioning"
            textSize = 20f
            setTextColor(0xFFFFFFFF.toInt())
            setTypeface(null, android.graphics.Typeface.BOLD)
        }

        tvDeviceId = TextView(this).apply {
            textSize = 14f
            setTextColor(0xFF58A6FF.toInt())
            setPadding(0, 16, 0, 24)
        }

        tvStatus = TextView(this).apply {
            textSize = 14f
            setTextColor(0xFF8B949E.toInt())
            setPadding(0, 0, 0, 32)
        }

        btnGrantPermissions = Button(this).apply {
            text = "1. Conceder Permissões de Hardware"
            setBackgroundColor(0xFF21262D.toInt())
            setTextColor(0xFFFFFFFF.toInt())
            setOnClickListener { requestCorePermissions() }
        }

        btnStartDaemon = Button(this).apply {
            text = "2. Validar Provisioning & Conectar Node"
            setBackgroundColor(0xFF238636.toInt())
            setTextColor(0xFFFFFFFF.toInt())
            setOnClickListener { validateAndStartDaemon() }
        }

        layout.addView(title)
        layout.addView(tvDeviceId)
        layout.addView(tvStatus)
        layout.addView(btnGrantPermissions)
        layout.addView(btnStartDaemon)

        setContentView(layout)
        updateUI()
    }

    override fun onResume() {
        super.onResume()
        updateUI()
    }

    private fun updateUI() {
        val deviceId = DeviceIdentityManager.getOrGenerateDeviceId(this)
        val stage = DeviceIdentityManager.getProvisioningStage(this)
        val hasRuntime = requiredPermissions.all {
            ContextCompat.checkSelfPermission(this, it) == PackageManager.PERMISSION_GRANTED
        }
        val hasNotif = isNotificationServiceEnabled()

        tvDeviceId.text = "DeviceID: $deviceId\nEstado do Ciclo: $stage"

        tvStatus.text = buildString {
            append("Dispositivo: ${Build.MANUFACTURER} ${Build.MODEL}\n")
            append("Android OS: ${Build.VERSION.RELEASE} (SDK ${Build.VERSION.SDK_INT})\n\n")
            append("1. Permissões de Hardware: ${if (hasRuntime) "CONCEDIDAS ✅" else "PENDENTES ❌"}\n")
            append("2. Notificações: ${if (hasNotif) "ATIVO ✅" else "INATIVO (Opcional) ⚠️"}\n")
            val stageDesc = when(stage) {
                "READY" -> "READY (Operacional & Conectado) 🚀"
                "PAIRED" -> "PAIRED (Emparelhado com Founder) 🔗"
                "PROVISIONED" -> "PROVISIONED (Permissões Concedidas) ⚙️"
                else -> "UNPROVISIONED (Inicial) 🛑"
            }
            append("3. Ciclo do Node: $stageDesc\n")
        }

        btnStartDaemon.isEnabled = hasRuntime
    }

    private fun requestCorePermissions() {
        permissionLauncher.launch(requiredPermissions)
        requestBatteryOptimizationExemption()
        // Transição de UNPROVISIONED para PROVISIONED quando o operador inicia concessão
        if (DeviceIdentityManager.getProvisioningStage(this) == "UNPROVISIONED") {
            DeviceIdentityManager.setProvisioningStage(this, "PROVISIONED")
        }
    }

    private fun isNotificationServiceEnabled(): Boolean {
        val pkgName = packageName
        val flat = Settings.Secure.getString(contentResolver, "enabled_notification_listeners")
        return flat?.contains(pkgName) == true
    }

    private fun checkAndPromptNotificationListener() {
        if (!isNotificationServiceEnabled()) {
            Toast.makeText(this, "Ative o 'PortalTR Notification Reader' caso deseje capturar alertas.", Toast.LENGTH_LONG).show()
            try {
                val intent = Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS)
                startActivity(intent)
            } catch (e: Exception) {
                // Ignore
            }
        }
    }

    private fun requestBatteryOptimizationExemption() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val pm = getSystemService(PowerManager::class.java)
            if (!pm.isIgnoringBatteryOptimizations(packageName)) {
                try {
                    val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
                        data = Uri.parse("package:$packageName")
                    }
                    startActivity(intent)
                } catch (e: Exception) {
                    // Ignore
                }
            }
        }
    }

    private fun validateAndStartDaemon() {
        val hasRuntime = requiredPermissions.all {
            ContextCompat.checkSelfPermission(this, it) == PackageManager.PERMISSION_GRANTED
        }
        if (!hasRuntime) {
            Toast.makeText(this, "Todas as permissões principais de SMS e Telefone são obrigatórias.", Toast.LENGTH_LONG).show()
            return
        }

        // Transição definitiva para READY
        DeviceIdentityManager.setProvisioningStage(this, "READY")

        val intent = Intent(this, AgentDaemonService::class.java)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(intent)
        } else {
            startService(intent)
        }
        Toast.makeText(this, "Physical Node READY: Conectado e Operacional.", Toast.LENGTH_SHORT).show()
        finish()
    }
}

