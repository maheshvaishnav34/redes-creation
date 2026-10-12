import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits for GCM
const AUTH_TAG_LENGTH = 16;

/**
 * Returns a 32-byte key buffer from process.env.TOKEN_ENCRYPTION_KEY or a secure fallback derived from SESSION_SECRET
 */
function getEncryptionKey() {
  const secret = process.env.TOKEN_ENCRYPTION_KEY || process.env.SESSION_SECRET || 'default_secret_key_needs_32_bytes_min!';
  return crypto.createHash('sha256').update(secret).digest();
}

/**
 * Encrypts a plaintext string (e.g. Google OAuth refresh token) using AES-256-GCM
 * @param {string} text Plaintext to encrypt
 * @returns {string} Colon-separated string: iv:authTag:encryptedData in hex
 */
export function encryptToken(text) {
  if (!text) return null;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getEncryptionKey(), iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypts an AES-256-GCM encrypted token string
 * @param {string} encryptedToken Colon-separated iv:authTag:encryptedData in hex
 * @returns {string} Plaintext string
 */
export function decryptToken(encryptedToken) {
  if (!encryptedToken) return null;
  try {
    const parts = encryptedToken.split(':');
    if (parts.length !== 3) {
      // If not encrypted in this format, return as-is for backwards compatibility if needed
      return encryptedToken;
    }
    const [ivHex, authTagHex, encryptedHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, getEncryptionKey(), iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('[Crypto] Failed to decrypt token:', err.message);
    return null;
  }
}
