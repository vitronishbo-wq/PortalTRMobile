package com.portaltrmobile.agent

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.os.Build
import com.google.firebase.FirebaseApp

class PortalTRAgentApp : Application() {

    companion object {
        const val CHANNEL_ID = "portaltr_daemon_channel"
        const val CHANNEL_NAME = "PortalTR Daemon KeepAlive"
        lateinit var instance: PortalTRAgentApp
            private set
    }

    override fun onCreate() {
        super.onCreate()
        instance = this
        
        // Inicializar Firebase
        FirebaseApp.initializeApp(this)

        // Criar canal de notificação para Foreground Service
        createNotificationChannel()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                CHANNEL_NAME,
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Mantém o nó físico conectado ao PortalTR Control Plane"
                setShowBadge(false)
            }
            val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            manager.createNotificationChannel(channel)
        }
    }
}
