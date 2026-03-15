# Address Generation
A guide to the fastest and most efficient approach for generating addresses from random private keys in the C++ worker. Covers library choices, per-type derivation pipelines, RNG and range-based generator strategy, and lookup structure.

## Core Bottleneck
Every address type shares a single root operation: scalar multiplication of the private key by the secp256k1 generator point (`privkey × G`). This EC point multiplication dominates CPU time at roughly 80–150 ns per call. All hashing and encoding steps are cheap by comparison and can be derived from the same resulting public key.

The rule is: **compute the EC point once per private key, derive all required address formats from it**.

## Library Choices
Four libraries cover the entire derivation and generation stack:
| Library               | Role                                                 |
|-----------------------|------------------------------------------------------|
| `libsecp256k1`        | secp256k1 point multiplication (the dominant cost)   |
| OpenSSL (`libcrypto`) | SHA256, RIPEMD160, and `RAND_bytes`                  |
| `tiny_sha3`           | keccak256 for Ethereum / Polygon addresses           |
| `pcg-cpp`             | Fast range-bounded generation and per-thread streams |

### `libsecp256k1`
Bitcoin Core's own C library. It ships with pre-computed tables for the generator point, eliminating most of the EC field arithmetic, and runs constant-time scalar multiplication. It is 5–10× faster than a naive EC implementation:
```cmake
FetchContent_Declare(
    secp256k1
    GIT_REPOSITORY https://github.com/bitcoin-core/secp256k1.git
    GIT_TAG        v0.5.1
)
set(SECP256K1_BUILD_BENCHMARK OFF CACHE BOOL "" FORCE)
set(SECP256K1_BUILD_TESTS     OFF CACHE BOOL "" FORCE)
set(SECP256K1_BUILD_EXAMPLES  OFF CACHE BOOL "" FORCE)
FetchContent_MakeAvailable(secp256k1)
target_link_libraries(worker PRIVATE secp256k1)
```

A single `secp256k1_context` created once at startup is sufficient. The context is safe to use across iterations on the same thread. Each worker sub-thread must own its own context (see Threading):
```cpp
secp256k1_context* ctx = secp256k1_context_create(SECP256K1_CONTEXT_SIGN);
// ... key generation loop ...
secp256k1_context_destroy(ctx);
```

### OpenSSL
Covers SHA256, RIPEMD160, and OS-seeded random bytes. Available on all target platforms and already present in most build environments:
```cmake
find_package(OpenSSL REQUIRED)
target_link_libraries(worker PRIVATE OpenSSL::Crypto)
```

### `tiny_sha3`
A single-header keccak256 implementation needed for Ethereum and Polygon address derivation. Drop it into `include/` and add no CMake dependency:
```cpp
#include "tiny_sha3.h"
// sha3(input, input_len, output, -256)  // negative size selects keccak (not SHA3)
```

## Derivation Pipeline
After one call to `secp256k1_ec_pubkey_create`, branch on which address types are present in the loaded dump. Bitcoin variants all share the same `hash160` intermediate, so compute it once regardless of how many Bitcoin types are in the list:
```
private key (32 bytes)
    │
    └─ secp256k1_ec_pubkey_create()          ← single EC mult, ~95% of CPU cost
         │
         ├─ Ethereum / Polygon
         │   └─ serialize uncompressed (65 bytes, 0x04 prefix)
         │       └─ keccak256(bytes[1..64])  → last 20 bytes = address
         │
         └─ Bitcoin (all variants)
             └─ serialize compressed (33 bytes)
                 └─ SHA256 → RIPEMD160 = hash160 (20 bytes)
                     ├─ P2PKH:  version(0x00) + hash160 → Base58Check
                     ├─ P2WPKH: SegWit v0 + hash160    → Bech32
                     ├─ P2SH:   redeemScript hash160    → Base58Check (0x05)
                     └─ P2TR:   tweaked x-only pubkey   → Bech32m
```

The critical consequence: Base58Check and Bech32 encoding only ever runs on a confirmed match, not on every iteration. The hot loop compares **raw bytes**, never formatted strings.

## Generator Strategy
Three generator modes cover the different search scenarios. All share the same `next(uint8_t[32])` interface so the hot loop does not need to know which one is active:
```cpp
struct IKeyGenerator {
    virtual bool next(uint8_t privkey[32]) = 0;  // returns false when space is exhausted
    virtual ~IKeyGenerator() = default;
};
```

Always validate the output of any generator before passing it to libsecp256k1:
```cpp
if (!secp256k1_ec_seckey_verify(ctx, privkey)) continue;  // ~0.1% rejection rate
```

### `RAND_bytes` (unbounded, default)
Used when no range is declared. `RAND_bytes` from OpenSSL provides OS-seeded cryptographically secure random bytes with minimal overhead. Avoid `std::rand`, `rand_r`, or seeding from time-based values:
```cpp
bool next(uint8_t privkey[32]) override {
    RAND_bytes(privkey, 32);  // ~5 ns, non-blocking in OpenSSL 3.x
    return true;              // never exhausted
}
```

If throughput profiling reveals `RAND_bytes` as a bottleneck, seed a per-thread ChaCha20 PRNG once from `RAND_bytes(seed, 32)` and use it for subsequent iterations. For this use case (coverage speed, not unpredictability), that trade-off is acceptable.

### PCG64 (range-based, production)
Used when `rangeStart` and `rangeEnd` are provided in the `start` message and the range is large. **PCG64** is the right pick over `mt19937` for range-bounded production searches for three reasons:
- ~2–3× faster than `mt19937` per value
- Supports independent per-thread streams with no overlap, seeded from a single root seed
- Trivial range clamping via a modulo on a 128-bit value

Add via CMake `FetchContent`:
```cmake
FetchContent_Declare(
    pcg-cpp
    GIT_REPOSITORY https://github.com/imneme/pcg-cpp.git
    GIT_TAG        master
)
FetchContent_MakeAvailable(pcg-cpp)
target_include_directories(worker PRIVATE ${pcg-cpp_SOURCE_DIR}/include)
```

Usage with a declared space. The `stream_id` param makes multi-threading clean: each thread passes its index and the streams are mathematically guaranteed non-overlapping:
```cpp
#include "pcg_random.hpp"

struct PcgRangeGenerator : IKeyGenerator {
    pcg64       rng;
    __uint128_t start;
    __uint128_t range_size;

    // stream_id: pass the thread index for non-overlapping streams
    PcgRangeGenerator(__uint128_t start, __uint128_t end, uint64_t seed, uint64_t stream_id = 0)
        : rng(seed, stream_id), start(start), range_size(end - start + 1) {}

    bool next(uint8_t privkey[32]) override {
        __uint128_t hi  = rng();
        __uint128_t lo  = rng();
        __uint128_t val = start + (((hi << 64) | lo) % range_size);

        std::memset(privkey, 0, 32);
        uint64_t upper = (uint64_t)(val >> 64);
        uint64_t lower = (uint64_t)(val);
        std::memcpy(privkey + 16, &upper, 8);
        std::memcpy(privkey + 24, &lower, 8);
        return true;
    }
};
```

### Sequential counter (range-based, debug)
Used when `rangeStart` and `rangeEnd` are provided and the intent is to verify correctness rather than run a production search. A plain counter gives **guaranteed complete coverage** with no repeats and fully deterministic output. Plant a known private key at a specific index, run the worker, and verify the match fires at exactly the right iteration:
```cpp
struct SequentialGenerator : IKeyGenerator {
    __uint128_t current;
    __uint128_t end;

    SequentialGenerator(__uint128_t start, __uint128_t end) : current(start), end(end) {}

    bool next(uint8_t privkey[32]) override {
        if (current > end) return false;  // space exhausted, signal the loop to stop

        __uint128_t val = current++;
        std::memset(privkey, 0, 32);
        uint64_t upper = (uint64_t)(val >> 64);
        uint64_t lower = (uint64_t)(val);
        std::memcpy(privkey + 16, &upper, 8);
        std::memcpy(privkey + 24, &lower, 8);
        return true;
    }
};
```

### Generator selection
The `start` message carries two optional fields used to select the active generator:
| Field        | Type                  | Description                                |
|--------------|-----------------------|--------------------------------------------|
| `rangeStart` | `string` (bigint `n`) | Lower bound of the search space, inclusive |
| `rangeEnd`   | `string` (bigint `n`) | Upper bound of the search space, inclusive |

Selection logic:
| `rangeStart` / `rangeEnd` present | Generator used                                    |
|-----------------------------------|---------------------------------------------------|
| No                                | `RAND_bytes` (unbounded)                          |
| Yes, large range (production)     | `PcgRangeGenerator` (statistical coverage)        |
| Yes, small range (debug/test)     | `SequentialGenerator` (complete ordered coverage) |

"Small" vs "large" can be a compile-time threshold (e.g. range size ≤ 2^24 uses sequential).

## Lookup Structure
Store target addresses as raw 20-byte arrays in an `unordered_set`. This avoids all string encoding in the hot path and reduces comparison to a `memcmp`:
```cpp
struct ByteArray20Hash {
    size_t operator()(const std::array<uint8_t, 20>& a) const {
        // Read first 8 bytes as uint64 — fast and sufficient for uniformly random data
        uint64_t h;
        std::memcpy(&h, a.data(), sizeof(h));
        return std::hash<uint64_t>{}(h);
    }
};

using AddressSet = std::unordered_set<std::array<uint8_t, 20>, ByteArray20Hash>;

AddressSet eth_targets;   // Ethereum + Polygon: last 20 bytes of keccak256
AddressSet btc_targets;   // all Bitcoin types: hash160
```

Populate both sets once when loading the dump file. On a match, run Base58Check or Bech32 encoding then to recover the full formatted address for the `match` message.

## Closest Match Tracking
In addition to exact matching, the worker tracks the **closest** address seen so far and reports it with every `progress` message. "Closest" is defined as the highest number of leading bytes that match any target address. This is purely informational: it gives a sense of how close the search has gotten and surfaces in the `closestMatch` / `closestMatchRegisteredAt` fields on the DB address row.

The `progress` message gains two additional fields for this:
| Field                | Type     | Description                                        |
|----------------------|----------|----------------------------------------------------|
| `closestMatch`       | `string` | Formatted address with the highest score seen      |
| `closestMatchScore`  | `number` | Number of matching leading bytes (0–20)            |

### Scoring algorithm
For each generated address, iterate over every raw target and count matching **leading** bytes (stop at the first mismatch). Only the score relative to the single best-matching target matters:
```cpp
uint8_t score_address(const uint8_t generated[20], const AddressSet& targets) {
    uint8_t best = 0;
    for (const auto& target : targets) {
        uint8_t score = 0;
        for (int i = 0; i < 20; i++) {
            if (generated[i] != target[i]) break;
            score++;
        }
        if (score > best) best = score;
    }
    return best;
}
```

Leading bytes are used rather than total matching bytes because a prefix match is semantically meaningful (it means the address is "close" in sorted order), is trivially explainable, and matches the `closestMatch` display intent.

### State management
The worker holds a single shared closest-match record, updated atomically when a thread beats the current best score. A `uint8_t` score fits in a single byte so it can be stored in a `std::atomic<uint8_t>` with a compare-exchange to avoid a mutex on the hot path:
```cpp
struct ClosestMatchState {
    std::atomic<uint8_t>  score{0};
    std::mutex            mu;
    std::string           address;   // formatted, set only when score improves
    uint8_t               privkey[32]{};
};
```

Update path inside `check_ethereum` / `check_bitcoin`, after scoring:
```cpp
uint8_t new_score = score_address(derived, targets);
uint8_t old_score = closest.score.load(std::memory_order_relaxed);

if (new_score > old_score) {
    // CAS loop — only one thread wins, others discard
    if (closest.score.compare_exchange_strong(old_score, new_score)) {
        std::lock_guard<std::mutex> lock(closest.mu);
        closest.address = encode_address(derived, type);  // Base58Check / Bech32 / hex
        std::memcpy(closest.privkey, privkey, 32);
    }
}
```

The score is read without the lock in the main thread when building the `progress` message. Because `score` and `address` are updated non-atomically relative to each other, the reported address may lag the score by one report interval — acceptable since this is display-only data.

### Performance note
Scoring runs on every iteration for every target, which adds a linear scan over the target set. For small lists (typical use case) this is negligible. For very large lists, consider capping the scan early by tracking a `uint8_t min_threshold` and skipping targets once a score at least as good has already been found this iteration. An exact match short-circuits naturally since `score == 20` cannot be beaten.

## Hot Loop Shape
The inner loop in `worker.cpp` follows this structure. With the `IKeyGenerator` abstraction, the loop is identical regardless of which generator is active:
```cpp
while (!stop_flag.load(std::memory_order_relaxed)) {
    uint8_t privkey[32];
    if (!generator->next(privkey)) break;  // sequential generator exhausted its space
    if (!secp256k1_ec_seckey_verify(ctx, privkey)) continue;

    secp256k1_pubkey pubkey;
    secp256k1_ec_pubkey_create(ctx, &pubkey, privkey);  // dominant cost

    if (!eth_targets.empty())  check_ethereum(ctx, pubkey, privkey, closest);
    if (!btc_targets.empty())  check_bitcoin(ctx, pubkey, privkey, closest);

    attempts.fetch_add(1, std::memory_order_relaxed);
}
```

`eth_targets.empty()` and `btc_targets.empty()` are evaluated once per iteration but branch-predict perfectly after the first few cycles since the sets never change at runtime.

## Threading
The architecture (`docs/worker-architecture.md`) assigns one background thread to the key generation loop and uses the main thread for I/O and timers. To use all available cores, spawn N generation threads internally, each owning its own `secp256k1_context`. All threads share the read-only `AddressSet` instances (safe without locking) and the shared `std::atomic<uint64_t>` counter:
```cpp
// In worker startup
unsigned int n_threads = std::thread::hardware_concurrency();
std::vector<std::thread> threads;

for (unsigned int i = 0; i < n_threads; ++i) {
    threads.emplace_back([&, i]() {
        secp256k1_context* ctx = secp256k1_context_create(SECP256K1_CONTEXT_SIGN);
        // Pass thread index as stream_id for PCG64 — each thread gets a non-overlapping stream
        auto gen = make_generator(range_start, range_end, seed, /*stream_id=*/i);
        run_generation_loop(ctx, gen.get(), eth_targets, btc_targets, attempts, stop_flag, match_state);
        secp256k1_context_destroy(ctx);
    });
}
```

The `match_state` struct uses an `std::atomic<bool>` flag and a `std::mutex`-protected payload, written only once on the first match. All other threads see the flag via relaxed load and exit cleanly.

## Implementation Order
1. Add `libsecp256k1`, OpenSSL, `tiny_sha3`, and `pcg-cpp` to `CMakeLists.txt`
2. Implement `IKeyGenerator` and the three concrete generators in `src/generator.hpp`
3. Implement `check_ethereum()`: serialize uncompressed, keccak256, raw-byte lookup + closest-match scoring
4. Implement `check_bitcoin()`: serialize compressed, SHA256+RIPEMD160, raw-byte lookup + closest-match scoring
5. Implement Base58Check and Bech32/Bech32m encoding (called only on match or closest-match update)
6. Wire the generator interface and check functions into the hot loop in `worker.cpp`
7. Add `ClosestMatchState` and include `closestMatch` / `closestMatchScore` in `progress` messages
8. Add multi-thread spawning and per-thread context management
