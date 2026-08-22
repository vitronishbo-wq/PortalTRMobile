package com.portaltrmobile.agent.data

import android.content.Context
import android.content.SharedPreferences

/**
 * Persistência local de Idempotência e Deduplicação.
 * Garante que comandos e eventos já processados não sejam reexecutados
 * mesmo após reinicialização do AgentDaemonService, reinício do sistema operacional (Boot)
 * ou interrupção pelo gerenciador de memória do Android Go.
 */
object AgentPersistenceStore {

    private const val PREFS_COMMANDS = "portaltr_processed_commands"
    private const val PREFS_EVENTS = "portaltr_processed_events"

    // Limite máximo de retenção para evitar crescimento indefinido do SharedPreferences
    private const val MAX_STORED_ENTRIES = 500
    private const val ENTRY_TTL_MS = 7 * 24 * 60 * 60 * 1000L // 7 dias

    fun isCommandProcessed(context: Context, commandId: String): Boolean {
        if (commandId.isBlank()) return false
        val prefs = context.getSharedPreferences(PREFS_COMMANDS, Context.MODE_PRIVATE)
        val timestamp = prefs.getLong(commandId, 0L)
        if (timestamp == 0L) return false

        // Se expirou o TTL de retenção de 7 dias, permite expurgo
        if (System.currentTimeMillis() - timestamp > ENTRY_TTL_MS) {
            prefs.edit().remove(commandId).apply()
            return false
        }
        return true
    }

    fun markCommandProcessed(context: Context, commandId: String) {
        if (commandId.isBlank()) return
        val prefs = context.getSharedPreferences(PREFS_COMMANDS, Context.MODE_PRIVATE)
        pruneIfNecessary(prefs)
        prefs.edit().putLong(commandId, System.currentTimeMillis()).apply()
    }

    fun isEventProcessed(context: Context, dedupHash: String): Boolean {
        if (dedupHash.isBlank()) return false
        val prefs = context.getSharedPreferences(PREFS_EVENTS, Context.MODE_PRIVATE)
        val timestamp = prefs.getLong(dedupHash, 0L)
        if (timestamp == 0L) return false

        if (System.currentTimeMillis() - timestamp > ENTRY_TTL_MS) {
            prefs.edit().remove(dedupHash).apply()
            return false
        }
        return true
    }

    fun markEventProcessed(context: Context, dedupHash: String) {
        if (dedupHash.isBlank()) return
        val prefs = context.getSharedPreferences(PREFS_EVENTS, Context.MODE_PRIVATE)
        pruneIfNecessary(prefs)
        prefs.edit().putLong(dedupHash, System.currentTimeMillis()).apply()
    }

    private fun pruneIfNecessary(prefs: SharedPreferences) {
        val allEntries = prefs.all
        if (allEntries.size >= MAX_STORED_ENTRIES) {
            val editor = prefs.edit()
            // Remove as 100 entradas mais antigas
            val sorted = allEntries.entries
                .mapNotNull { entry ->
                    val ts = (entry.value as? Long) ?: (entry.value as? Number)?.toLong()
                    if (ts != null) Pair(entry.key, ts) else null
                }
                .sortedBy { it.second }

            sorted.take(100).forEach { editor.remove(it.first) }
            editor.apply()
        }
    }
}
