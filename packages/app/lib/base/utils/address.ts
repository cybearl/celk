import { ADDRESS_TYPE } from "@app/db/schema/address"
import { sha256 } from "@noble/hashes/sha2.js"
import { base58, bech32 } from "@scure/base"

/**
 * Validates that a crypto address is structurally correct and passes its checksum.
 * @param type The type of the address (e.g. Ethereum, Bitcoin P2PKH, Bitcoin P2WPKH).
 * @param value The address string to validate.
 * @return True if the address is valid, false otherwise.
 */
export function isValidCryptoAddress(type: ADDRESS_TYPE, value: string): boolean {
    switch (type) {
        case ADDRESS_TYPE.ETHEREUM:
            return /^0x[0-9a-fA-F]{40}$/.test(value)

        case ADDRESS_TYPE.BTC_P2PKH: {
            try {
                const buf = base58.decode(value)

                // Base58Check: last 4 bytes are SHA256d checksum
                const payload = buf.slice(0, -4)
                const checksum = buf.slice(-4)
                const expected = sha256(sha256(payload)).slice(0, 4)

                for (let i = 0; i < 4; i++) {
                    if (checksum[i] !== expected[i]) return false
                }

                // Version byte 0x00 = mainnet P2PKH, followed by 20-byte pubkey hash
                return payload[0] === 0x00 && payload.length === 21
            } catch {
                return false
            }
        }

        case ADDRESS_TYPE.BTC_P2WPKH: {
            try {
                const { prefix, words } = bech32.decode(value as `${string}1${string}`)
                const witnessProgram = bech32.fromWords(words.slice(1))
                // Witness version 0 (words[0] === 0), mainnet prefix "bc", 20-byte program
                return prefix === "bc" && words[0] === 0 && witnessProgram.length === 20
            } catch {
                return false
            }
        }
    }
}
