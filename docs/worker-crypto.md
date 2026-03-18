# Chapter 5 — `worker.hpp` / `worker.cpp`: The Crypto Work

**Goal:** Real key generation, address derivation, target matching.

---

## The Core Bottleneck

Every address type shares a single root operation: scalar multiplication of the private key
by the secp256k1 generator point (`privkey × G`). This EC point multiplication dominates
CPU time at roughly 80–150 ns per call. All hashing and encoding steps are cheap by
comparison and can be derived from the same resulting public key.

The rule is: **compute the EC point once per private key, derive all required address formats from it**.

---

## Step 5.1 — Add Dependencies to `vcpkg.json` and `CMakeLists.txt`

Before writing any crypto code, set up the build. Add one dependency at a time and verify
the project still compiles before moving on.

Five libraries cover the entire derivation and generation stack:

| Library               | Role                                                          |
|-----------------------|---------------------------------------------------------------|
| `libsecp256k1`        | secp256k1 point multiplication (the dominant cost)           |
| OpenSSL (`libcrypto`) | SHA256, RIPEMD160, and `RAND_bytes`                          |
| `keccak-tiny`         | keccak256 for Ethereum / Polygon addresses                   |
| `pcg-cpp`             | Fast range-bounded generation and per-thread streams         |
| `abseil`              | `absl::uint128` — portable 128-bit integer (see note below)  |

### A note on `uint128_t`

A 128-bit integer type is needed to represent the secp256k1 key space as a contiguous
range. GCC and Clang expose `__uint128_t` as a compiler extension, but **MSVC does not
support it** — and this project targets Windows.

`abseil` (Google's C++ utility library) provides `absl::uint128`, which is a proper
portable type that works identically on all compilers:

```cpp
#include <absl/numeric/int128.h>

absl::uint128 start = absl::MakeUint128(high_64_bits, low_64_bits);
absl::uint128 size  = end - start + 1;

// Extract the two halves back out:
uint64_t hi = absl::Uint128High64(value);
uint64_t lo = absl::Uint128Low64(value);
```

The API is more explicit than `__uint128_t` (no implicit conversions, named helpers
for splitting/joining), but that explicitness also makes the intent clearer.

### `vcpkg.json`

Add all five packages to the `dependencies` array:

```json
{
    "name": "celk-workers",
    "dependencies": [
        "fmt",
        "nlohmann-json",
        "secp256k1",
        "openssl",
        "keccak-tiny",
        "pcg",
        "abseil"
    ]
}
```

### `CMakeLists.txt`

For each library, add a `find_package` call and link the target. `pcg` is header-only
so it uses `find_path` instead:

```cmake
find_path(PCG_INCLUDE_DIRS "pcg_extras.hpp")
find_package(fmt CONFIG REQUIRED)
find_package(nlohmann_json CONFIG REQUIRED)
find_package(unofficial-secp256k1 CONFIG REQUIRED)
find_package(OpenSSL CONFIG REQUIRED)
find_package(unofficial-keccak-tiny CONFIG REQUIRED)
find_package(absl CONFIG REQUIRED)
```

Link them in `target_link_libraries`:

```cmake
target_link_libraries(worker PRIVATE
    fmt::fmt
    nlohmann_json::nlohmann_json
    unofficial::secp256k1
    OpenSSL::Crypto
    unofficial::keccak-tiny::keccak-tiny
    absl::int128
)
```

> The exact CMake target names come from the library's own config file. vcpkg
> installs them and you can verify the available targets in
> `build/vcpkg_installed/x64-windows/share/<package>/`.

### `libsecp256k1` context lifecycle

A single `secp256k1_context` is required to call any secp256k1 function. The context
holds the pre-computed tables that make EC multiplication fast. Create it once at
thread startup and destroy it on exit — **each thread must own its own context**:

```cpp
secp256k1_context* ctx = secp256k1_context_create(SECP256K1_CONTEXT_SIGN);
// ... key generation loop ...
secp256k1_context_destroy(ctx);
```

**Checkpoint:** Project compiles cleanly with all five libraries linked.

---

## Step 5.2 — `IKeyGenerator` Interface and Generators

### Abstract classes and the `virtual` / `= 0` / `override` trio

Before implementing the generators, it is worth understanding what is actually
happening when you write `virtual` and `= 0` in C++.

In TypeScript, interfaces are purely a compile-time construct — the runtime never
knows they existed. In C++, `virtual` is a runtime mechanism. When a class declares
a `virtual` method, the compiler adds a hidden pointer (the **vtable pointer**) to
every instance of that class. That pointer points to a **vtable** — a table of
function pointers, one per virtual method. Calling a virtual method dereferences
that table at runtime to dispatch to the correct override. This is how `IKeyGenerator*`
can call the right `next()` whether the concrete object behind it is a `RandGenerator`,
a `PcgRangeGenerator`, or a `SequentialGenerator`.

`= 0` marks the method as **pure virtual**, which means:
- The class becomes **abstract** — you cannot instantiate it directly (same as an
  abstract class in TypeScript or Java).
- Any concrete subclass **must** provide an implementation, or it also becomes abstract.

Without `= 0`, the method would be virtual but have a default body — subclasses could
optionally override it, but would not be required to.

`override` on the subclass side is optional but strongly recommended. It tells the
compiler: "I intend to override a virtual method from the base class." If the signature
doesn't match any base virtual (typo, wrong argument type), the compiler errors out.
Without `override`, the mismatch silently defines a new, unrelated method instead
of overriding anything.

Finally, the **virtual destructor** on the base class is not optional:

```cpp
struct IKeyGenerator {
    virtual bool next(uint8_t privkey[32]) = 0;
    virtual ~IKeyGenerator() = default;   // ← required
};
```

Without it, deleting an `IKeyGenerator*` that actually points to a `PcgRangeGenerator`
would call only `IKeyGenerator`'s destructor, skipping the subclass destructor entirely.
That is undefined behaviour and a memory leak. `= default` tells the compiler to generate
the normal destructor body; `virtual` ensures the right one is called through a pointer.

> In TypeScript terms: `virtual bool next(...) = 0` is roughly `abstract next(...): boolean`.
> `virtual ~IKeyGenerator() = default` has no TS equivalent because JS/TS garbage-collects
> — in C++, object lifetimes are explicit and destructors must be wired correctly.

### The interface

```cpp
struct IKeyGenerator {
    virtual bool next(uint8_t privkey[32]) = 0;  // false = space exhausted
    virtual ~IKeyGenerator() = default;
};
```

`uint8_t privkey[32]` = fixed 32-byte array passed by pointer (C-style arrays decay
to a pointer when passed to a function). Equivalent to `Uint8Array` of length 32, but
stack-allocated and with no bounds information carried alongside it.

Always validate the output of any generator before passing it to libsecp256k1.
A private key must be in `[1, curve_order - 1]`:

```cpp
if (!secp256k1_ec_seckey_verify(ctx, privkey)) continue;  // ~0.1% rejection rate
```

All three generators share the same `next(uint8_t[32])` interface so the hot loop
does not need to know which one is active. This is the whole point of the virtual dispatch.

### Generator 1 — `RAND_bytes` (unbounded, default)

Used when no range is declared. `RAND_bytes` from OpenSSL provides OS-seeded
cryptographically secure random bytes with minimal overhead. Avoid `std::rand`,
`rand_r`, or seeding from time-based values:

```cpp
bool next(uint8_t privkey[32]) override {
    RAND_bytes(privkey, 32);  // ~5 ns, non-blocking in OpenSSL 3.x
    return true;              // never exhausted
}
```

If throughput profiling reveals `RAND_bytes` as a bottleneck, seed a per-thread
ChaCha20 PRNG once from `RAND_bytes(seed, 32)` and use it for subsequent iterations.
For this use case (coverage speed, not unpredictability), that trade-off is acceptable.

### Generator 2 — PCG64 (range-based, production)

Used when `rangeStart` and `rangeEnd` are provided in the `start` message and the
range is large. **PCG64** is the right pick over `mt19937` for three reasons:

- ~2–3× faster than `mt19937` per value
- Supports independent per-thread streams with no overlap, seeded from a single root seed
- Trivial range clamping via a modulo on a 128-bit value

The `stream_id` param makes multi-threading clean: each thread passes its index and
the streams are mathematically guaranteed non-overlapping.

```cpp
#include "pcg_random.hpp"
#include <absl/numeric/int128.h>

struct PcgRangeGenerator : IKeyGenerator {
    pcg64          rng;
    absl::uint128  start;
    absl::uint128  range_size;

    // stream_id: pass the thread index for non-overlapping streams
    PcgRangeGenerator(absl::uint128 start, absl::uint128 end, uint64_t seed, uint64_t stream_id = 0)
        : rng(seed, stream_id), start(start), range_size(end - start + 1) {}

    bool next(uint8_t privkey[32]) override {
        // Two PCG calls give 128 bits of randomness
        absl::uint128 hi  = absl::MakeUint128(rng(), 0);
        absl::uint128 lo  = absl::MakeUint128(0, rng());
        absl::uint128 val = start + ((hi | lo) % range_size);

        // Write the 128-bit value into the last 16 bytes of the 32-byte key
        // (the first 16 bytes stay zero — the range fits in 128 bits)
        uint64_t upper = absl::Uint128High64(val);
        uint64_t lower = absl::Uint128Low64(val);
        std::memset(privkey, 0, 32);
        std::memcpy(privkey + 16, &upper, 8);
        std::memcpy(privkey + 24, &lower, 8);
        return true;
    }
};
```

### Generator 3 — Sequential counter (range-based, debug)

Used when `rangeStart` and `rangeEnd` are provided and the intent is to verify
correctness rather than run a production search. A plain counter gives **guaranteed
complete coverage** with no repeats and fully deterministic output. Plant a known
private key at a specific index, run the worker, and verify the match fires at
exactly the right iteration:

```cpp
struct SequentialGenerator : IKeyGenerator {
    absl::uint128 current;
    absl::uint128 end;

    SequentialGenerator(absl::uint128 start, absl::uint128 end) : current(start), end(end) {}

    bool next(uint8_t privkey[32]) override {
        if (current > end) return false;  // space exhausted, signal the loop to stop

        absl::uint128 val = current++;
        uint64_t upper = absl::Uint128High64(val);
        uint64_t lower = absl::Uint128Low64(val);
        std::memset(privkey, 0, 32);
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

| `rangeStart` / `rangeEnd` present | Generator used                                    |
|-----------------------------------|---------------------------------------------------|
| No                                | `RAND_bytes` (unbounded)                          |
| Yes, large range (production)     | `PcgRangeGenerator` (statistical coverage)        |
| Yes, small range (debug/test)     | `SequentialGenerator` (complete ordered coverage) |

"Small" vs "large" can be a compile-time threshold (e.g. range size ≤ 2^24 uses sequential).

**Checkpoint:** Random generator working, `secp256k1_ec_seckey_verify` passes without crashes.

---

## Step 5.3 — Address Lookup Set

Store target addresses as raw 20-byte arrays in an `unordered_set`. This avoids all
string encoding in the hot path and reduces comparison to a `memcmp`.

`std::array<uint8_t, 20>` = fixed 20-byte array with value semantics. Unlike a raw
C array, it is copyable, comparable, and carries its size. Think of it as a typed
`Buffer` of exactly 20 bytes.

`std::unordered_set` = like `Set<T>` in TypeScript, but requires you to supply a
hash function for any type that isn't a primitive. Strings get one by default; custom
structs do not.

### The hash functor

```cpp
struct ByteArray20Hash {
    size_t operator()(const std::array<uint8_t, 20>& a) const {
        uint64_t h;
        std::memcpy(&h, a.data(), sizeof(h));
        return std::hash<uint64_t>{}(h);
    }
};
```

`operator()` is C++'s way of making a struct *callable* — an object you can invoke
like a function. `ByteArray20Hash{}(some_array)` calls this method. The standard
library uses this calling convention for comparators, hash functions, and predicates.
In TypeScript you would just pass a lambda; in C++ the idiomatic equivalent for
types that need to be stored (e.g. as a template parameter) is a struct with `operator()`.

The hash reads the first 8 bytes as a `uint64_t` and delegates to the standard
`uint64_t` hasher — fast and sufficient because address bytes are uniformly random.

```cpp
using AddressSet = std::unordered_set<std::array<uint8_t, 20>, ByteArray20Hash>;

AddressSet eth_targets;
AddressSet btc_targets;
```

Populate both sets once when loading the dump file. This is where Base58/Bech32
**decoding** happens — decode each address string to raw bytes once, store raw bytes.
On a match, run Base58Check or Bech32 encoding *then* to recover the full formatted
address for the `match` message.

---

## Step 5.4 — Derivation Pipeline

After one call to `secp256k1_ec_pubkey_create`, branch on which address types are
present in the loaded dump. Bitcoin variants all share the same `hash160` intermediate,
so compute it once regardless of how many Bitcoin types are in the list:

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

The critical consequence: Base58Check and Bech32 encoding only ever runs on a confirmed
match, not on every iteration. The hot loop compares **raw bytes**, never formatted strings.

### `check_ethereum` and `check_bitcoin`

Each function:
1. Serializes the public key (uncompressed 65 bytes for ETH, compressed 33 bytes for BTC)
2. Hashes it (keccak256 for ETH, SHA256+RIPEMD160 for BTC)
3. Looks up the raw 20 bytes in the set — raw byte comparison, no string encoding
4. On match: format the full address string, signal `match_state`

**Checkpoint:** Ethereum derivation matches a known test vector.
**Checkpoint:** Bitcoin derivation matches a known test vector.

---

## Step 5.5 — Closest Match Tracking

In addition to exact matching, the worker tracks the **closest** address seen so far
and reports it with every `progress` message. "Closest" is defined as the highest
number of leading bytes that match any target address.

The `progress` message gains two additional fields:

| Field               | Type     | Description                                   |
|---------------------|----------|-----------------------------------------------|
| `closestMatch`      | `string` | Formatted address with the highest score seen |
| `closestMatchScore` | `number` | Number of matching leading bytes (0–20)       |

### Scoring algorithm

For each generated address, iterate over every raw target and count matching **leading**
bytes (stop at the first mismatch). Only the score relative to the single best-matching
target matters:

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

Leading bytes are used rather than total matching bytes because a prefix match is
semantically meaningful (it means the address is "close" in sorted order), is trivially
explainable, and matches the `closestMatch` display intent.

### State management

The worker holds a single shared closest-match record updated by any thread that beats
the current best score. This is a classic shared-state concurrency problem. Two mechanisms
work together here:

- `std::atomic<uint8_t>` for the score — allows lock-free reads from any thread without
  a mutex. Reading an atomic value is always safe; no partial reads can occur.
- `std::mutex` + `std::lock_guard` for the full payload (address string, privkey bytes) —
  strings cannot be atomically written, so a mutex protects the slow path when a new best
  score is confirmed.

`std::lock_guard` is a RAII wrapper: it locks the mutex on construction and unlocks it
when it goes out of scope (end of the `if` block). You never call `unlock()` manually.
This is the C++ equivalent of a `using` block or a `try/finally` release pattern.

```cpp
struct ClosestMatchState {
    std::atomic<uint8_t>  score{0};
    std::mutex            mu;
    std::string           address;
    uint8_t               privkey[32]{};
};
```

Update path inside `check_ethereum` / `check_bitcoin`, after scoring:

```cpp
uint8_t new_score = score_address(derived, targets);
uint8_t old_score = closest.score.load(std::memory_order_relaxed);

if (new_score > old_score) {
    // compare_exchange_strong: atomically check that score is still old_score,
    // then swap in new_score — only one thread wins the race, others retry or discard
    if (closest.score.compare_exchange_strong(old_score, new_score)) {
        std::lock_guard<std::mutex> lock(closest.mu);
        closest.address = encode_address(derived, type);
        std::memcpy(closest.privkey, privkey, 32);
    }
}
```

`compare_exchange_strong` (CAS — compare-and-swap) is the fundamental primitive for
lock-free concurrent updates. It reads the current value, checks it against `old_score`,
and only writes `new_score` if the check passes — all in one atomic step. If two threads
race, one wins and one sees the check fail; the loser simply discards its (now outdated)
result.

The score is read without the lock in the main thread when building the `progress` message.
Because `score` and `address` are updated non-atomically relative to each other, the reported
address may lag the score by one report interval — acceptable since this is display-only data.

**Performance note:** Scoring runs on every iteration for every target. For small target
lists (typical use case) this is negligible. For very large lists, consider tracking a
`uint8_t min_threshold` and skipping targets once a score at least as good has already
been found this iteration. An exact match short-circuits naturally since `score == 20`
cannot be beaten.

---

## Step 5.6 — The Hot Loop

With the `IKeyGenerator` abstraction, the loop is identical regardless of which generator
is active:

```cpp
while (!stop_flag.load(std::memory_order_relaxed)) {
    uint8_t privkey[32];
    if (!generator->next(privkey)) break;
    if (!secp256k1_ec_seckey_verify(ctx, privkey)) continue;

    secp256k1_pubkey pubkey;
    secp256k1_ec_pubkey_create(ctx, &pubkey, privkey);

    if (!eth_targets.empty()) check_ethereum(ctx, pubkey, privkey, closest);
    if (!btc_targets.empty()) check_bitcoin(ctx, pubkey, privkey, closest);

    attempts.fetch_add(1, std::memory_order_relaxed);
}
```

`std::memory_order_relaxed` appears on every atomic access here. Memory ordering is
about what guarantees you get regarding *other* memory operations around the atomic.
`relaxed` gives no ordering guarantees at all — only the atomicity of the single
operation. This is correct here because:

- `stop_flag` only needs to be eventually visible; a one-iteration delay is fine.
- `attempts` is an independent counter with no causal relationship to other state.

Using `relaxed` avoids generating unnecessary memory fence instructions, which matters
at millions of iterations per second.

`eth_targets.empty()` and `btc_targets.empty()` branch-predict perfectly after the first
few cycles since the sets never change at runtime.

---

## Step 5.7 — Multi-Threading

Each thread owns its own `secp256k1_context`. All threads share the read-only
`AddressSet` instances (safe without locking — no writes after initialization) and the
shared atomic `attempts` counter.

```cpp
unsigned int n = std::thread::hardware_concurrency();
std::vector<std::thread> threads;

for (unsigned int i = 0; i < n; ++i) {
    threads.emplace_back([&, i]() {
        secp256k1_context* ctx = secp256k1_context_create(SECP256K1_CONTEXT_SIGN);
        auto gen = make_generator(range_start, range_end, seed, /*stream_id=*/i);
        run_loop(ctx, gen.get(), eth_targets, btc_targets, attempts, stop_flag, match_state);
        secp256k1_context_destroy(ctx);
    });
}

for (auto& t : threads) t.join();
```

The `[&, i]` lambda capture deserves attention. In TypeScript, closures capture everything
in scope by reference automatically. In C++ you must be explicit:

- `&` — capture everything else by reference (shared state: sets, counters, flags)
- `i` — capture the loop index by **value**

If `i` were captured by reference with `&` instead of listed explicitly, all threads would
share the same `i` variable — which the for-loop keeps modifying. By the time most threads
start, `i` would be `n`. Capturing it by value takes a snapshot at the point the lambda
is created.

Pass the thread index as `stream_id` for PCG64 — each thread gets a mathematically
guaranteed non-overlapping random stream.

The `match_state` struct uses an `std::atomic<bool>` flag and a `std::mutex`-protected
payload, written only once on the first match. All other threads see the flag via relaxed
load and exit cleanly.

---

## Implementation Checklist

| Step | Files                        | Checkpoint                                              |
|------|------------------------------|---------------------------------------------------------|
| 5.1  | `vcpkg.json`, `CMakeLists.txt` | Build with all crypto deps linked                     |
| 5.2  | `generator.hpp`              | Random generator; `secp256k1_ec_seckey_verify` passes   |
| 5.3  | `worker.cpp`                 | Dump decoded to raw-byte sets without crashes           |
| 5.4  | `worker.cpp`                 | ETH and BTC derivation each match a known test vector   |
| 5.5  | `worker.cpp`                 | `closestMatch` / `closestMatchScore` appear in progress |
| 5.6  | `worker.cpp`                 | Full hot loop running, `attempts` counter climbing      |
| 5.7  | `worker.cpp`                 | Multi-threaded; throughput scales with core count       |

**Rule:** At each checkpoint you should be able to *run* what you have before moving on.
Don't write everything then debug all at once.
