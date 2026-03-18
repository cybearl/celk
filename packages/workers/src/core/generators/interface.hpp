#include <cstdint>

/**
 * The base interface for private key generators.
 */
struct IPrivateKeyGenerator {
    /**
     * @brief Produces the next private key and fills the passed 32-byte array with it.
     * @param privateKey The fixed 32-byte array to fill with the generated private key.
     * @return True unless the implemented generator has a fixed space that is exhausted.
     */
    virtual bool next(uint8_t privateKey[32]) = 0;

    // Polymorphic destructor
    virtual ~IPrivateKeyGenerator() = default;
};
