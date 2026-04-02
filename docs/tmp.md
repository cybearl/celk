# Plan: Address Generation System Architecture

## Context

The worker has three working private key generators and a full IPC protocol.
The stub worker thread in `main.cpp` (lines 61-66) currently just increments a counter.

The goal is to implement the pipeline:
- Group `AddressDump` entries by generator → each group gets its own generator instance
- Each loop iteration: every generator produces one key → derive addresses → compare against its group
- Optionally (mix mode): compare each key against ALL addresses regardless of generator group
- Track the highest byte-level prefix match reached (closestMatch) and signal full matches

Key insight: **Bitcoin addresses are already decoded to raw bytes at insertion time**
(`preEncoding` field). We never need to Base58/Bech32 encode in C++ — just derive raw bytes
and compare directly with `memcmp`.

---

## New Directory Structure

```
src/core/
├── generators/         (already exists — no changes needed)
├── derivers/           (NEW)
│   ├── interface.hpp
│   ├── ethereum.hpp + ethereum.cpp
│   ├── btcP2pkh.hpp + btcP2pkh.cpp
│   ├── btcP2wpkh.hpp + btcP2wpkh.cpp
│   ├── btcP2sh.hpp + btcP2sh.cpp
│   └── btcP2tr.hpp + btcP2tr.cpp
└── encoding/           (NEW — hashing only, no address encoding)
    └── hash.hpp + hash.cpp

src/core/engine.hpp + engine.cpp  (NEW — replaces stub thread)
```

**Modified:** `src/main.cpp`, `src/protocol.hpp`, `src/userOptions.hpp`
**TypeScript mirrors:** `protocol.ts`, `userOptions.ts`, DB schema, Settings UI

---

## Step 1: Hashing Utilities (`src/core/encoding/hash.hpp + hash.cpp`)

Pure functions, no state. Wraps already-linked libraries:

- `sha256(in, len, out[32])` — OpenSSL `SHA256()`
- `ripemd160(in, len, out[20])` — OpenSSL `RIPEMD160()`
- `hash160(in, len, out[20])` — SHA-256 then RIPEMD-160 (all BTC types use this)
- `doubleSha256(in, len, out[32])` — two SHA-256 calls (needed for P2TR tagged hash)
- `keccak256(in, len, out[32])` — keccak-tiny `keccak_256()`

Headers: `<openssl/sha.h>`, `<openssl/ripemd.h>`.

---

## Step 2: Deriver Interface (`src/core/derivers/interface.hpp`)

Derivers write raw bytes into a caller-provided buffer (no heap allocation per iteration):

```cpp
struct IAddressDeriver {
    virtual size_t outputSize() const = 0;
    virtual void derive(const uint8_t privateKey[32], uint8_t* out) = 0;
    virtual ~IAddressDeriver() = default;
};
```

`outputSize()` returns 20 for all types except P2TR (32). The caller allocates once and reuses.
Matching: `memcmp(derivedBuf, target.rawBytes.data(), n)`.

---

## Step 3: Concrete Derivers

All use `unofficial::secp256k1`. Create the secp256k1 context **once in the constructor**
(`secp256k1_context_create(SECP256K1_CONTEXT_SIGN)`) — it is expensive to recreate per call.

### `ethereum.cpp` — Ethereum / Polygon
Output: 20 bytes

1. `secp256k1_ec_pubkey_create()` → serialize **uncompressed** (65 bytes, `SECP256K1_EC_UNCOMPRESSED`)
2. Skip first byte (`0x04`), keccak256 the remaining 64 bytes → 32-byte hash
3. Copy **last 20 bytes** → `out`

Matching target: hex-decode `dump.value` (strip `"0x"`) at init — no `preEncoding` for Ethereum.

### `btcP2pkh.cpp` — P2PKH ("1...")
Output: 20 bytes

1. `secp256k1_ec_pubkey_create()` → serialize **compressed** (33 bytes, `SECP256K1_EC_COMPRESSED`)
2. `hash160(compressed_pubkey, 33, out)`

Matching target: hex-decode `preEncoding`.

### `btcP2wpkh.cpp` — P2WPKH ("bc1q...")
Output: 20 bytes

Derivation is **identical to P2PKH** — compressed pubkey → hash160. The Bech32 encoding
difference is irrelevant since we compare raw bytes.

Matching target: hex-decode `preEncoding` (stored from Bech32 decode by the app).

### `btcP2sh.cpp` — P2SH ("3...")
Output: 20 bytes

1. Compressed pubkey → `hash160()` → 20-byte pubkey hash
2. Build 22-byte redeem script: `[0x00, 0x14] + pubkeyHash20`
   - `0x00` = OP_0, `0x14` = PUSH 20 bytes
3. `hash160(redeemScript, 22, out)`

Matching target: hex-decode `preEncoding`.

### `btcP2tr.cpp` — P2TR ("bc1p...")
Output: 32 bytes

1. `secp256k1_keypair_create(ctx, &keypair, privateKey)`
2. `secp256k1_keypair_xonly_pub(ctx, &xonlyPubkey, NULL, &keypair)` → internal x-only key
3. `secp256k1_xonly_pubkey_serialize(ctx, xonlyBytes, &xonlyPubkey)` → 32 bytes
4. Compute TapTweak (BIP341): `t = SHA256(SHA256("TapTweak") || SHA256("TapTweak") || xonlyBytes)`
   — precompute `SHA256("TapTweak")` once in the constructor and cache it
5. `secp256k1_xonly_pubkey_tweak_add(ctx, &tweakedKey, &xonlyPubkey, t)`
6. Serialize tweaked key → `out`

Matching target: hex-decode `preEncoding`.

---

## Step 4: New User Option — "Mix generators"

### Names and copy

**Field name (camelCase, consistent with `autoDisableZeroBalance`):**
`mixGenerators`

**UI label:**
"Mix generators"

**UI description:**
"When enabled, each generator also checks its keys against addresses assigned to other generators, increasing coverage at the cost of performance."

**Performance warning (shown in the UI below the option when multiple generators are active
on the same address list, and/or always shown as a note):**
"Using multiple generators divides throughput — with N active generators, each one operates
at roughly 1/N of the normal scan rate."

### What it changes in the engine

- **Off (default):** each generator's key is only checked against the `TargetAddress` entries
  that share its `privateKeyGenerator` value.
- **On:** each generator's key is checked against **all** `TargetAddress` entries regardless of
  their assigned generator.

### Propagation (same path as `autoDisableZeroBalance`)

1. Add `mixGenerators: boolean` to DB schema (`userOptions` table)
2. Add to TypeScript `WorkerUserOptions` type in `protocol.ts`
3. Add to C++ `UserOptions` struct in `userOptions.hpp` + update `NLOHMANN_DEFINE_TYPE_NON_INTRUSIVE`
4. Add checkbox to Settings UI (same pattern as `autoDisableZeroBalance`)

---

## Step 5: Multi-Generator Engine (`src/core/engine.hpp + engine.cpp`)

### Key internal structures

```cpp
struct TargetAddress {
    std::string id;                          // AddressDump.id — key in closestMatches map
    AddressType type;                        // determines which deriver to use
    std::vector<uint8_t> rawBytes;           // pre-decoded comparison bytes (preEncoding, or hex value for ETH)
    std::string value;                       // original address string, copied for match reporting
    PrivateKeyGeneratorType generator;       // which generator this address belongs to
};

struct GeneratorGroup {
    PrivateKeyGeneratorType selectedGenerator;        // filters which AddressDumps belong to this group
    std::unique_ptr<IPrivateKeyGenerator> generator;
    std::vector<TargetAddress*> targets;              // pointers into the engine's flat TargetAddress list
                                                      // only targets where target.generator == selectedGenerator
};
```

`TargetAddress` copies the fields it needs from `AddressDump` at construction time — no
back-pointer. This avoids dangling-pointer risk if the `addressDumps` vector is ever reallocated.

`selectedGenerator` in `GeneratorGroup` is the identity of the group: the constructor uses it
to filter the flat `TargetAddress` list so each group's `targets` vector only contains entries
whose `dump.privateKeyGenerator` matches.

### Constructor

1. Pre-process each `AddressDump` → `TargetAddress` by hex-decoding the comparison bytes
   (also copy `dump.privateKeyGenerator` into `TargetAddress::generator`):

   | Address type | Source field       | Transform                        | `rawBytes` size |
   |--------------|--------------------|----------------------------------|-----------------|
   | Ethereum     | `dump.value`       | strip `"0x"`, hex-decode         | 20 bytes        |
   | BTC P2PKH    | `dump.preEncoding` | hex-decode                       | 20 bytes        |
   | BTC P2WPKH   | `dump.preEncoding` | hex-decode                       | 20 bytes        |
   | BTC P2SH     | `dump.preEncoding` | hex-decode                       | 20 bytes        |
   | BTC P2TR     | `dump.preEncoding` | hex-decode                       | 32 bytes        |

   All BTC types use `preEncoding` (the app stores pre-decoded bytes there at insertion time).
   Ethereum has no `preEncoding` — the checksummed hex address in `value` is the source.

2. Collect the distinct `privateKeyGenerator` values across all `AddressDump` entries.
   For each distinct value, create one `GeneratorGroup` with `selectedGenerator` set to that value,
   instantiate the matching `IPrivateKeyGenerator` using `(rangeStart, rangeEnd)` from the first
   dump in that group, then populate `targets` by filtering the flat `TargetAddress` list to entries
   where `target.generator == selectedGenerator`.
3. Instantiate one deriver per unique `AddressType` across all groups (shared)
4. Allocate one `uint8_t derivedBuf[32]` (reused every iteration, never heap-allocated in loop)

### `run()` method

```
closestMatches: AddressClosestMatches   (mutex-protected map, shared with main thread for reporting)
closestMatchesMutex: std::mutex

loop until stopFlag:
    for each group in generatorGroups:
        if group.generator.next(privateKey) == false: mark group exhausted; continue

        attempts++ (atomic)

        for each (type, deriver) in derivers:
            deriver.derive(privateKey, derivedBuf)
            n = deriver.outputSize()

            // Determine which targets to compare against
            targets = mixGenerators ? allTargets : group.targets

            for each target in targets where target.type == type:
                matched = count leading equal bytes between derivedBuf and target.rawBytes

                // Per-address closest match tracking
                lock closestMatchesMutex
                current = closestMatches[target.id]   // default-constructs to empty vector
                if matched > current.size():
                    closestMatches[target.id] = derivedBuf[0..matched]
                unlock

                if matched == n:   // full match
                    lock matchState
                    matchState.address    = target.value
                    matchState.privateKey = hexEncode(privateKey)
                    matchState.isFound    = true
                    if stopOnFirstMatch: stopFlag = true

    if all groups exhausted: break
```

**Why per-address, not a single global max:** `closestMatches` is an `AddressClosestMatches`
(`unordered_map<string, vector<uint8_t>>`), mapping each address ID to the best matching prefix
bytes seen so far. This lets the manager update the `closestMatch` DB column independently per
address rather than applying a single aggregate value to all of them.

**What the vector stores:** the actual leading bytes from `derivedBuf` that matched (not just a
count). The count is `v.size()`. Storing bytes gives the manager more information if needed, and
deriving the count is trivial.

**Locking strategy:** the mutex is held only for the brief compare-and-update of one map entry.
The main thread holds the same mutex when snapshotting the map for a report message. Contention
is low because reports are infrequent compared to the inner loop frequency.

**Why shared derivers:** all groups reuse the same deriver instances — a single secp256k1
context per deriver type, not per generator. This avoids multiplying context allocations.

**Attempts counting:** each successful `generator.next()` call counts as one attempt,
regardless of how many targets are checked for that key.

---

## Step 6: Protocol Extension (`src/protocol.hpp`)

Add `closestMatches` to `WorkerReportMessage`:

```cpp
using AddressClosestMatches = std::unordered_map<std::string, std::vector<uint8_t>>;

struct WorkerReportMessage : WorkerMessage {
    std::string attempts;
    AddressClosestMatches closestMatches;   // per-address: ID -> best matching prefix bytes
};

NLOHMANN_DEFINE_TYPE_NON_INTRUSIVE(WorkerReportMessage, type, addressListId, attempts, closestMatches)
```

Note: the `NLOHMANN_DEFINE_TYPE_NON_INTRUSIVE` macro currently in `protocol.hpp` is **missing
`closestMatches`** — add it.

Mirror in TypeScript `protocol.ts` as `Record<string, number[]>`. The manager uses this to
update the `closestMatch` DB column for each address: `closestMatches[id].length` gives the
byte-count to store.

---

## Step 7: Wire Into `main.cpp`

Replace lines 61-66 (stub lambda) with:

```cpp
std::thread workerThread([&]() {
    try {
        BruteForceEngine engine(addressDumps, startMessage, stopFlag, attempts, matchState);
        engine.run();
    } catch (const std::exception& e) {
        sendError(e.what());
    }
});
```

When building the report, the main thread snapshots the engine's `closestMatches` map under
`closestMatchesMutex`:

```cpp
WorkerReportMessage message;
message.type = WorkerMessageType::Report;
message.addressListId = startMessage.addressListId;
message.attempts = std::to_string(drainedAttempts);

{
    std::lock_guard<std::mutex> lock(engine.closestMatchesMutex);
    message.closestMatches = engine.closestMatches;   // snapshot
}
```

The engine continues accumulating matches between reports — the map is never reset, so each
report always reflects the all-time best per address.

---

## Cryptographic Libraries Reference

| Need | Library | Already linked? |
|---|---|---|
| secp256k1 public key derivation | `unofficial::secp256k1` | Yes |
| SHA-256, RIPEMD-160 | `OpenSSL::Crypto` | Yes |
| Keccak-256 | `unofficial::keccak-tiny` | Yes |
| Base58Check encoding | ~~Not needed~~ | — |
| Bech32/Bech32m encoding | ~~Not needed~~ | — |

---

## Implementation Order

1. `encoding/hash.hpp + hash.cpp`
2. `derivers/interface.hpp`
3. Each deriver (they are independent of each other)
4. `engine.hpp + engine.cpp`
5. `userOptions.hpp` + `protocol.hpp` extensions
6. `main.cpp` wiring
7. TypeScript mirrors (DB schema, `protocol.ts`, `userOptions.ts`, Settings UI)

---

## Verification

1. **Per-deriver check**: take a known private key with a known address, run your deriver, confirm
   the raw output bytes match the address decoded back to bytes (use any online BTC/ETH tool).
2. **End-to-end**: build a minimal dump JSON with one address whose private key you know, run
   the worker with a sequential generator starting at that key, confirm a `match` message arrives.
3. **Multi-generator**: use two different generators in one dump, confirm both produce `attempts`
   and that enabling `mixGenerators` results in both generators checking all addresses.
4. **closestMatch**: with a random dump and no expected match, verify the reported value
   increases over time as keys partially collide on leading bytes.
