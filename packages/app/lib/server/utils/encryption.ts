import crypto from "node:crypto"
import { PRIVATE_ENV } from "@app/config/env"

const ALGORITHM = "aes-256-gcm"
const IV_LENGTH = 12 // 96-bit IV (recommended for GCM)
const AUTH_TAG_LENGTH = 16 // 128-bit authentication tag

/**
 * Derives a 32-byte AES key from the private keys encryption secret, the secret is
 * already high-entropy (random string), so SHA-256 is sufficient.
 */
function getEncryptionKey(): Buffer {
    return crypto.createHash("sha256").update(PRIVATE_ENV.privateKeysEncryptionSecret).digest()
}

/**
 * Encrypts a private key using AES-256-GCM, the output is a base64-encoded string
 * containing the IV, authentication tag, and ciphertext.
 * @param privateKey The private key to encrypt.
 * @returns The encrypted private key as a base64 string.
 */
export function encryptPrivateKey(privateKey: string): string {
    const key = getEncryptionKey()
    const iv = crypto.randomBytes(IV_LENGTH)
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH })

    const encrypted = Buffer.concat([cipher.update(privateKey, "utf8"), cipher.final()])
    const authTag = cipher.getAuthTag()

    // Layout: iv (12 bytes) / authTag (16 bytes) / ciphertext
    return Buffer.concat([iv, authTag, encrypted]).toString("base64")
}

/**
 * Decrypts a private key that was encrypted with `encryptPrivateKey`.
 *
 * Note: Throws if the ciphertext has been tampered with (GCM authentication failure).
 * @param encryptedPrivateKey The encrypted private key as a base64 string.
 * @returns The decrypted private key.
 */
export function decryptPrivateKey(encryptedPrivateKey: string): string {
    const key = getEncryptionKey()
    const data = Buffer.from(encryptedPrivateKey, "base64")

    const iv = data.subarray(0, IV_LENGTH)
    const authTag = data.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH)
    const ciphertext = data.subarray(IV_LENGTH + AUTH_TAG_LENGTH)

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH })
    decipher.setAuthTag(authTag)

    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8")
}
