package com.portaltrmobile.agent.receiver

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import com.portaltrmobile.agent.data.DeviceIdentityManager
import com.portaltrmobile.agent.service.AgentDaemonService

class BootCompletedReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context?, intent: Intent?) {
        if (context == null) return
        val action = intent?.action
        if (action == Intent.ACTION_BOOT_COMPLETED || action == Intent.ACTION_MY_PACKAGE_REPLACED) {
            // Só inicia o serviço de segundo plano se o dispositivo já passou pelo provisioning (READY)
            if (!DeviceIdentityManager.isReady(context)) {
                return
            }

            val serviceIntent = Intent(context, AgentDaemonService::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(serviceIntent)
            } else {
                context.startService(serviceIntent)
            }
        }
    }
}
