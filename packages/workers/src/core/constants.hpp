#include <uint256_t.h>

/**
 * @brief The order for the secp256k1 algorithm.
 *
 * Note: The range goes from 1 to `SECP256K1_ORDER - 1`.
 */
const uint256_t SECP256K1_ORDER = uint256_t("FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141", 16);
