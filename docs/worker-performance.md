# Worker Performance & Scaling

## Current baseline

~12,000 addr/s on a Ryzen 7 9800x3D, single thread, single address.
The `attempts` counter increments once per outer loop tick regardless of how many `RangeSubGroup`s
are active — so each subgroup adds a full `deriver.derive()` (EC multiplication) to the per-tick cost.
With all addresses in one subgroup (same generator, no range), the pipeline is:

1. `secp256k1_ec_pubkey_create` — the dominant cost
2. Three serializations (uncompressed / compressed / x-only) — cheap
3. Hash per address type present (Keccak256, SHA256+RIPEMD160, etc.)
4. `memcmp` + score loop per target address — negligible

---

## Finding: precomputed tables are already active

`CMakeLists.txt` links `unofficial::secp256k1_precomputed`, which embeds the generator-point
multiplication tables at compile time. There is no runtime construction overhead and no gains
available by "adding" precomputed tables — they are already in use.

---

## Option 1 — Multi-thread within a GeneratorGroup

**Problem:** `engine.cpp` spawns exactly one thread per `GeneratorGroup`. If all addresses use
the same generator type (PCG64/RandBytes), they share one group → one thread → one CPU core.

**Fix:** Spawn N threads per `GeneratorGroup`. Each thread owns its own `PublicKeysDeriver`
(secp256k1 contexts are not thread-safe to share) and its own `AddressComparator` instance
(avoids lock contention on `closestMatches`). At report time, merge the best scores across threads.

Files to change:
- `packages/workers/src/core/engine.cpp` — spawn N threads per group
- `packages/workers/src/core/generatorGroup.hpp/.cpp` — accept thread count
- `packages/workers/src/main.cpp` — receive thread count via `StartWorkerMessage`
- `packages/app/db/schema/dynamicConfig.ts` — add `workerThreadCount` config field
- `packages/app/lib/server/instrumentations/workersManager/lib/controls.ts` — pass it down

**Expected gain:** Near-linear up to physical core count. 8 threads on a 9800x3D → ~96K addr/s.
On a VPS at 20–30% of 4 vCPUs → effectively 1 full vCPU → same as today, but cleaner ceiling.

---

## Option 2 — Tune `ECMULT_GEN_PREC_BITS`

`ECMULT_GEN_PREC_BITS` (vcpkg default: 4) controls the window size for generator-point
multiplication. Doubling it to 8 roughly halves the number of point additions per pubkey
creation, at the cost of ~4× larger precomputed table per context (~590 KB vs ~140 KB).

Apply via a vcpkg overlay port — no library fork needed:

```
packages/workers/vcpkg-overlays/secp256k1/portfile.cmake   (new)
packages/workers/vcpkg.json                                 (add overlay-ports path)
```

Pass `-DSECP256K1_ECMULT_GEN_PREC_BITS=8` inside the portfile. The precomputed binary grows
proportionally; memory is not a concern at this scale.

**Expected gain:** 20–40% speedup on `secp256k1_ec_pubkey_create`. Compounds with Option 1.

---

## Option 3 — Constant-time removal (skip)

The constant-time property in libsecp256k1 matters for signing (prevents timing-based private
key recovery). For `secp256k1_ec_pubkey_create` (generator multiplication with precomputed
tables), the "constant-time" implementation is a fixed-window wNAF, which is already near-optimal.
Measured overhead vs. a variable-time double-and-add is ~5–15%. Not worth the complexity of
patching the core algorithm. Skip unless profiling confirms it as a bottleneck.

---

## Option 4 — Distributed workers via RabbitMQ

```
Next.js app (unchanged)
    │
    └── tRPC API
          │
    Node.js Worker Manager (new service)
          │
          ├── Publishes jobs → RabbitMQ: { addressListId, dumpFilePath, config }
          └── Consumes results ← RabbitMQ: { attempts, closestMatches, matches }
                │
                ├── Worker Node A (VPS)      — existing C++ binary
                ├── Worker Node B (home CPU) — same binary
                └── Worker Node C (home GPU) — CUDA-enabled build (see Option 5)
```

**Lowest-risk implementation — stdio bridge:**
Keep the C++ binary's stdin/stdout protocol unchanged. Add a thin Node.js "worker agent"
per machine that bridges AMQP ↔ stdio. The C++ worker never touches network code.

- New `packages/worker-agent/` — Node.js service, bridges AMQP ↔ stdio child process
- `packages/app/lib/server/instrumentations/workersManager/` — talk to the agent via
  HTTP/WebSocket instead of spawning child processes directly

Why this matters:
- Home machines connect outbound to RabbitMQ — no firewall/VPN needed
- CPU throttling lives in the agent config, not the C++ core
- GPU workers are just a different binary behind the same queue interface

---

## Option 5 — CUDA batch library (same worker binary, optional link)

Rather than a separate GPU worker, create a single CUDA static library the existing worker
optionally links. One new file handles everything:

```cpp
// packages/workers/src/cuda/secp256k1_batch.cu
void cudaBatchDerivePublicKeys(
    const uint8_t  privKeys[][32],
    size_t         batchSize,
    DerivedPublicKeys* results   // same struct from publicKeysDeriver.hpp
);
```

The engine accumulates a batch of private keys (e.g., 4096), sends them to the GPU in one call,
receives all public keys back, then runs the existing hash + compare loop CPU-side. Only the EC
scalar multiplication moves to GPU. Keccak, SHA256, RIPEMD160, and memcmp are untouched.

**CMake — CUDA is optional, binary falls back to CPU without it:**

```cmake
find_package(CUDAToolkit QUIET)
if(CUDAToolkit_FOUND)
    enable_language(CUDA)
    add_library(workerCudaLib STATIC src/cuda/secp256k1_batch.cu)
    target_compile_definitions(workerLib PUBLIC WORKER_CUDA_ENABLED)
    target_link_libraries(workerLib PUBLIC workerCudaLib CUDA::cudart)
endif()
```

**What the CUDA kernel needs:**

| Component | Complexity | Notes |
|-----------|------------|-------|
| 256-bit modular arithmetic | Medium | `uint32_t[8]`, Montgomery or Barrett reduction |
| secp256k1 field ops (Fp) | Medium | p = 2²⁵⁶ − 2³² − 977, ~50 lines |
| Jacobian point add/double | Medium | ~80 lines, standard formulas |
| Fixed-window scalar mult | Medium | Precomputed generator in `__constant__` memory |
| Batch kernel dispatch | Low | One CUDA thread per private key, all independent |

Reference implementations (BitCrack, VanitySearch source) exist and can be used as a guide.

**Expected throughput:**

| Hardware | Throughput | vs. 1 CPU thread |
|----------|------------|-----------------|
| CPU, 1 thread (9800x3D) | ~12K addr/s | 1× |
| CPU, 8 threads (9800x3D) | ~96K addr/s | 8× |
| GTX 1080 Ti (2017) | ~50 MH/s | ~4,000× |
| RTX 3060 (2020) | ~100–200 MH/s | ~10,000× |

An old home GPU is absolutely worth using. The 2017–2019 GPU tier is enough to make the VPS
contribution negligible by comparison.

**Files to add/change:**

| File | Change |
|------|--------|
| `packages/workers/src/cuda/secp256k1_batch.cu` | New — CUDA kernel |
| `packages/workers/src/cuda/secp256k1_batch.hpp` | New — C++ interface |
| `packages/workers/CMakeLists.txt` | Optional CUDA target |
| `packages/workers/src/core/engine.cpp` | Batch accumulation loop |
| `packages/workers/src/core/publicKeysDeriver.hpp` | Ensure `DerivedPublicKeys` is includable from CUDA |

**No infrastructure changes required.** Option 5 can be built and used independently of Option 4.
A GPU-enabled binary is just the same worker compiled on a machine with the CUDA toolkit.

---

## Recommended sequence

| Priority | Option | Effort | Impact |
|----------|--------|--------|--------|
| 1 | Multi-thread within GeneratorGroup | Medium | High — N× on multi-core |
| 2 | `ECMULT_GEN_PREC_BITS=8` vcpkg overlay | Low | Medium — 20–40% |
| 3 | Distributed RabbitMQ architecture | High | Architectural unlock |
| 4 | CUDA batch library | High | 1,000–10,000× per GPU node |
| — | Constant-time removal | Medium | Low — skip |

CPU throttling (planned) fits as a `workerMaxThreads` field in `dynamicConfig` for the
current architecture, or as a per-agent config in the RabbitMQ job message (Option 4).
