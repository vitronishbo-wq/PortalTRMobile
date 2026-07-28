import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

// Helper helper for safe env retrieval
const getEnvVar = (key: string, fallback: string): string => {
  if (typeof import.meta !== 'undefined' && (import.meta as Record<string, any>).env) {
    const env = (import.meta as Record<string, any>).env;
    if (env[`VITE_${key}`]) return env[`VITE_${key}`];
    if (env[key]) return env[key];
  }
  if (typeof process !== 'undefined' && process.env) {
    if (process.env[`VITE_${key}`]) return process.env[`VITE_${key}`]!;
    if (process.env[key]) return process.env[key]!;
  }
  return fallback;
};

// Configuração do Firebase utilizando variáveis de ambiente
export const firebaseConfig = {
  apiKey: getEnvVar('FIREBASE_API_KEY', 'AIzaSyDV7vPMAIDLp5ooUvnYYBbbhnLpJ_s40jw'),
  authDomain: getEnvVar('FIREBASE_AUTH_DOMAIN', 'portaltrmobile.firebaseapp.com'),
  projectId: getEnvVar('FIREBASE_PROJECT_ID', 'portaltrmobile'),
  storageBucket: getEnvVar('FIREBASE_STORAGE_BUCKET', 'portaltrmobile.firebasestorage.app'),
  messagingSenderId: getEnvVar('FIREBASE_MESSAGING_SENDER_ID', '703051403619'),
  appId: getEnvVar('FIREBASE_APP_ID', '1:703051403619:web:26f152ba7d9468e60bc356'),
  measurementId: getEnvVar('FIREBASE_MEASUREMENT_ID', 'G-E0XC9ZC157')
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

try {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }

  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);

  console.log('[Firebase] SDK inicializado com sucesso para o projeto:', firebaseConfig.projectId);
} catch (error) {
  console.error('[Firebase] Erro ao inicializar os serviços do Firebase:', error);
}

export { app, auth, db, storage };
export default app!;
