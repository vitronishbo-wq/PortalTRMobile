import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // Standard 96-bit IV for GCM
const AUTH_TAG_LENGTH = 16;

export interface EncryptedPayload {
  iv: string;         // base64
  ciphertext: string; // base64
  authTag: string;    // base64
  salt: string;       // base64
  timestamp: number;
}

/**
 * Derives a 256-bit AES key from a shared secret and salt using PBKDF2
 */
function deriveKey(secret: string, saltBuffer: Buffer): Buffer {
  return crypto.pbkdf2Sync(secret, saltBuffer, 100000, 32, 'sha256');
}

/**
 * Encrypts plaintext string using AES-256-GCM with PBKDF2 key derivation
 */
export function encryptPayload(
  plaintext: string,
  secret: string,
  customSalt?: string
): EncryptedPayload {
  const saltBuffer = customSalt ? Buffer.from(customSalt, 'utf8') : crypto.randomBytes(16);
  const key = deriveKey(secret, saltBuffer);
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final()
  ]);

  const authTag = cipher.getAuthTag();

  return {
    iv: iv.toString('base64'),
    ciphertext: encrypted.toString('base64'),
    authTag: authTag.toString('base64'),
    salt: saltBuffer.toString('base64'),
    timestamp: Date.now()
  };
}

/**
 * Decrypts AES-256-GCM encrypted payload with authentication tag verification
 */
export function decryptPayload(
  encrypted: EncryptedPayload,
  secret: string
): string {
  const saltBuffer = Buffer.from(encrypted.salt, 'base64');
  const key = deriveKey(secret, saltBuffer);
  const iv = Buffer.from(encrypted.iv, 'base64');
  const authTag = Buffer.from(encrypted.authTag, 'base64');
  const ciphertext = Buffer.from(encrypted.ciphertext, 'base64');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final()
  ]);

  return decrypted.toString('utf8');
}

/**
 * Browser-safe client & server E2EE utility for Vitronis COS Nodes
 */
export class NodeSecurityEngine {
  private static defaultSecret = 'vitronis_cos_e2ee_root_key_2026';

  static encryptForNode(nodeId: string, payload: any, sharedSecret?: string): EncryptedPayload {
    const secret = sharedSecret || `${NodeSecurityEngine.defaultSecret}_${nodeId}`;
    const jsonStr = typeof payload === 'string' ? payload : JSON.stringify(payload);
    return encryptPayload(jsonStr, secret);
  }

  static decryptFromNode(nodeId: string, encrypted: EncryptedPayload, sharedSecret?: string): any {
    const secret = sharedSecret || `${NodeSecurityEngine.defaultSecret}_${nodeId}`;
    const jsonStr = decryptPayload(encrypted, secret);
    try {
      return JSON.parse(jsonStr);
    } catch {
      return jsonStr;
    }
  }
}
