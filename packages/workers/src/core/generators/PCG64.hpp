#pragma once

#include "address.hpp"
#include "core/constants.hpp"
#include "core/generators/interface.hpp"
#include <cstdint>
#include <pcg_random.hpp>
#include <uint256_t.h>

/**
 * @brief Uses two independent PCG64 instances to generate a private key (2 x 2 uint64 merged
 * into a uint256).
 *
 * `highRng` produces the upper 128 bits (stream `streamId * 2 + 1`) and `lowRng` produces the
 * lower 128 bits (stream `streamId * 2`), keeping the two halves statistically independent.
 *
 * PCG64 is a deterministic "PRNG": given the same seed and stream IDs, it always produces the
 * same sequence. This enables two key features:
 *   - Resumability: reconstruct both generators with the same seed/streams, then call
 *     `highRng.advance(attempts * 2)` and `lowRng.advance(attempts * 2)` (O(log n)) to
 *     fast-forward to the last saved position. The `* 2` accounts for the two rng() calls
 *     made per generator per `next()` invocation.
 *   - Partitioning: assign different stream IDs to different workers so they traverse
 *     non-overlapping subsequences of the same seed in parallel. Stream pairs are allocated
 *     as `[streamId * 2, streamId * 2 + 1]` per worker.
 *
 * The seed must be stored per address in the DB. The current attempt count (also persisted
 * in the DB) serves as the resume cursor.
 */
struct PCG64PrivateKeyGenerator : IPrivateKeyGenerator {
    /**
     * @brief The high RNG instance for generating the upper 128 bits of the private key.
     */
    pcg64 highRng;

    /**
     * @brief The low RNG instance for generating the lower 128 bits of the private key.
     */
    pcg64 lowRng;

    /**
     * @brief Constructs a `PCG64PrivateKeyGenerator`.
     * @param _seed The seed to initialize the PRNG.
     * @param _streamId The stream ID to use for this generator (optional, defaults to 0).
     * @param _advance The number of attempts to advance the generator (optional, defaults to 0).
     */
    PCG64PrivateKeyGenerator(uint64_t _seed, uint64_t _streamId = 0, uint256_t _advance = 0);

    AddressPrivateKeyGenerator getType() const override;
    bool next(uint8_t privateKey[32]) override;
};
