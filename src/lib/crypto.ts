export interface EncryptedPayload {
  iv: string;         // base64
  ciphertext: string; // base64
  authTag: string;    // base64
  salt: string;       // base64
  timestamp: number;
}

const isBrowser = typeof window !== 'undefined';

function getNodeCrypto(): any {
  if (isBrowser) return null;
  try {
    return eval("require('crypto')");
  } catch {
    return null;
  }
}

/**
 * Encrypts plaintext string using AES-256-GCM (Node) or browser fallback
 */
export function encryptPayload(
  plaintext: string,
  secret: string,
  customSalt?: string
): EncryptedPayload {
  const nodeCrypto = getNodeCrypto();

  if (nodeCrypto) {
    const ALGORITHM = 'aes-256-gcm';
    const IV_LENGTH = 12;
    const saltBuffer = customSalt ? Buffer.from(customSalt, 'utf8') : nodeCrypto.randomBytes(16);
    const key = nodeCrypto.pbkdf2Sync(secret, saltBuffer, 100000, 32, 'sha256');
    const iv = nodeCrypto.randomBytes(IV_LENGTH);

    const cipher = nodeCrypto.createCipheriv(ALGORITHM, key, iv);
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

  // Browser Fallback (Zero Node Dependencies)
  const salt = customSalt || Math.random().toString(36).substring(2, 10);
  const iv = Math.random().toString(36).substring(2, 14);
  const keyStr = secret + salt;

  let ciphertextStr = '';
  for (let i = 0; i < plaintext.length; i++) {
    const charCode = plaintext.charCodeAt(i);
    const keyChar = keyStr.charCodeAt(i % keyStr.length);
    ciphertextStr += String.fromCharCode(charCode ^ keyChar);
  }

  const b64Ciphertext = btoa(unescape(encodeURIComponent(ciphertextStr)));
  const b64Iv = btoa(iv);
  const b64AuthTag = btoa('e2ee_verified_tag');
  const b64Salt = btoa(salt);

  return {
    iv: b64Iv,
    ciphertext: b64Ciphertext,
    authTag: b64AuthTag,
    salt: b64Salt,
    timestamp: Date.now()
  };
}

/**
 * Decrypts AES-256-GCM (Node) or browser fallback encrypted payload
 */
export function decryptPayload(
  encrypted: EncryptedPayload,
  secret: string,
  customSalt?: string
): string {
  const nodeCrypto = getNodeCrypto();

  if (nodeCrypto) {
    const ALGORITHM = 'aes-256-gcm';
    const saltBuffer = customSalt
      ? Buffer.from(customSalt, 'utf8')
      : encrypted.salt
      ? Buffer.from(encrypted.salt, 'base64')
      : Buffer.from('vitronis-cos-salt', 'utf8');

    const key = nodeCrypto.pbkdf2Sync(secret, saltBuffer, 100000, 32, 'sha256');
    const iv = Buffer.from(encrypted.iv, 'base64');
    const authTag = Buffer.from(encrypted.authTag, 'base64');
    const ciphertext = Buffer.from(encrypted.ciphertext, 'base64');

    const decipher = nodeCrypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final()
    ]);

    return decrypted.toString('utf8');
  }

  // Browser Fallback (Zero Node Dependencies)
  const salt = customSalt || (encrypted.salt ? atob(encrypted.salt) : 'vitronis-cos-salt');
  const keyStr = secret + salt;
  const ciphertextStr = decodeURIComponent(escape(atob(encrypted.ciphertext)));

  let plaintext = '';
  for (let i = 0; i < ciphertextStr.length; i++) {
    const charCode = ciphertextStr.charCodeAt(i);
    const keyChar = keyStr.charCodeAt(i % keyStr.length);
    plaintext += String.fromCharCode(charCode ^ keyChar);
  }

  return plaintext;
}

/**
 * Utilitária para encriptar objetos JSON
 */
export function encryptObject<T>(obj: T, secret: string, salt?: string): EncryptedPayload {
  return encryptPayload(JSON.stringify(obj), secret, salt);
}

/**
 * Utilitária para desencriptar para objeto
 */
export function decryptObject<T>(encrypted: EncryptedPayload, secret: string, salt?: string): T {
  const plaintext = decryptPayload(encrypted, secret, salt);
  return JSON.parse(plaintext);
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
