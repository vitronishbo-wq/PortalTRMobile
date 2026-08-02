/**
 * Utility to validate required VITE_ environment variables at runtime.
 * Ensures Firebase and core system connections are properly configured.
 */

export interface EnvValidationResult {
  isValid: boolean;
  missingVars: string[];
  configuredVars: string[];
}

export const REQUIRED_VITE_ENV_VARS = [
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_APP_ID',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_MEASUREMENT_ID',
  'VITE_API_URL',
] as const;

/**
 * Safely reads environment variables across Vite import.meta.env and Node process.env contexts.
 */
export function getEnvValue(key: string): string | undefined {
  if (typeof import.meta !== 'undefined' && (import.meta as Record<string, any>).env) {
    const val = (import.meta as Record<string, any>).env[key];
    if (val) return val;
  }
  if (typeof process !== 'undefined' && process.env) {
    const val = process.env[key];
    if (val) return val;
  }
  return undefined;
}

/**
 * Validates the presence of required VITE_ environment variables.
 * Emits console warnings if any environment variable is missing or unconfigured.
 */
export function validateViteEnvVars(): EnvValidationResult {
  const missingVars: string[] = [];
  const configuredVars: string[] = [];

  for (const envKey of REQUIRED_VITE_ENV_VARS) {
    const val = getEnvValue(envKey);
    
    // Check if value is absent, empty, or placeholder
    if (!val || val.startsWith('YOUR_') || val.includes('MY_')) {
      missingVars.push(envKey);
    } else {
      configuredVars.push(envKey);
    }
  }

  const isValid = missingVars.length === 0;

  if (!isValid) {
    console.warn(
      `⚠️ [ENV Validator] ${missingVars.length} variável(eis) de ambiente VITE_ ausente(s) ou não configurada(s):\n` +
      missingVars.map(v => `  - ${v}`).join('\n') +
      `\n\nCertifique-se de configurar estas variáveis no ficheiro .env ou nos GitHub Secrets para que a build do Firebase e as chamadas de API funcionem corretamente.`
    );
  } else {
    console.log(`✅ [ENV Validator] Todas as ${REQUIRED_VITE_ENV_VARS.length} variáveis VITE_ obrigatórias estão configuradas.`);
  }

  return {
    isValid,
    missingVars,
    configuredVars,
  };
}

// Auto-run validation on module load in client environment
validateViteEnvVars();
