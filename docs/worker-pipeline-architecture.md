# Worker Pipeline Architecture

This document tracks active design decisions for the C++ worker's address-derivation pipeline. Sections covering already-implemented components are removed — those live in the code. What remains are reference tables and open design problems.

---

## Reference: public key forms and address type mapping

Three secp256k1 representations are used, each needed by different address types:

| Form | Size | Used by |
|------|------|---------|
| `compressed` | 33 bytes | P2PKH, P2WPKH, P2SH |
| `uncompressed` | 65 bytes | Ethereum (all EVM chains) |
| `xonly` | 32 bytes | P2TR |

```
AddressType     PublicKeyForm
-----------     -------------
BtcP2pkh        compressed
BtcP2wpkh       compressed
BtcP2sh         compressed
BtcP2tr         xonly
Ethereum        uncompressed
```

---

## Open: per-address key ranges

### The problem

`AddressDump` carries optional `privateKeyRangeStart` / `privateKeyRangeEnd` per address. This is used by the Bitcoin puzzle challenge addresses, where each address has its own distinct range (e.g. address #19 searches `[2^18, 2^19)`).

Under the current grouping key `(generatorType, rangeStart, rangeEnd)`, every puzzle address creates its own group — even though they all use the same generator type and would ideally share one generator instance.

### Why Sequential is different

A Sequential generator's range is not a clamp, it is the iteration space. Without it the generator has no defined stopping point and no sequential structure. Sequential always creates one group per unique range by design, and that is correct. The puzzle addresses do not benefit from Sequential in the first place — exhaustively covering `[2^18, 2^19)` on a single machine is plausible; doing it simultaneously for 160 ranges is not.

For **PCG64 and RandBytes**, the range is a clamp applied to a random or pseudo-random output. It is logically a property of the target, not of the generator. Moving it out of the generator is the right fix.

### Solution: range moves to TargetAddress, not the generator

**Generator config change:**
- Remove `startRange` / `endRange` from `PCG64Config`
- `RandBytesConfig` never had one, no change
- `SequentialConfig` keeps its range — no change

**New group key:** `(generatorType, seed, streamId)` — range excluded.

All PCG64 addresses using the same seed and stream now share one group, regardless of their individual ranges.

**TargetAddress change:** add optional fields:
```cpp
std::optional<uint256_t> rangeStart;
std::optional<uint256_t> rangeEnd;
```
Populated from `AddressDump.privateKeyRangeStart/End` during engine setup.

**Range clamping:** extract into a free utility function:
```cpp
void clampToRange(
    const uint8_t rawKey[32],
    const uint256_t& start,
    const uint256_t& end,
    uint8_t outputKey[32]);
```
Clamping logic: `start + (rawKey mod (end - start))`. Addresses with no range skip this step — rawKey is used directly.

### Updated hot loop

Addresses sharing the same effective range (including "no range") can still share their pubkey computation. Group them into **range sub-groups** inside the generator group.

```
Setup (once per group):
  Build rangeSubGroups: map from (rangeStart, rangeEnd) → list of TargetAddress*
  For each rangeSubGroup, compute its own requiredPublicKeyForms set
  Instantiate derivers and hashers; pre-allocate buffers

Hot loop:
  rawKey ← group.generator.next()
  if exhausted → stop

  for each rangeSubGroup:
    privkey ← clampToRange(rawKey, subGroup.start, subGroup.end)  // no-op if no range

    -- Stage 1: secp256k1 (at most 3 per sub-group, usually 1)
    for form in subGroup.requiredPublicKeyForms:
      derivers[form].derive(privkey, pubkeyBuffers[form])

    -- Stage 2+3: hash and compare
    for type in subGroup.requiredAddressTypes:
      hashers[type].hash(pubkeyBuffers[pubkeyFormFor(type)], hashBuffers[type])
      for target in subGroup.targets where target.type == type:
        if hashBuffers[type] == target.rawBytes → MATCH
```

**Common cases:**
- No ranges anywhere, or all same range → one sub-group → original single-key behavior, full pubkey sharing.
- N puzzle addresses each with a unique range → N sub-groups, each with one address → N secp256k1 ops per tick (unavoidable — each needs a different key).
- Mixed: some rangeless + some ranged → sub-groups sized accordingly.

### What changes in GeneratorGroup

- Constructor/`addTargetAddress`: also register each target into the correct range sub-group (create it if missing)
- Replace the single flat `requiredAddressTypes` / `requiredPublicKeyForms` with per-sub-group versions (or keep the group-level ones for setup, add sub-group-level ones for the hot loop)
- The range sub-group map can be a `std::vector` of small structs rather than a map, since N is small:

```cpp
struct RangeSubGroup {
    std::optional<uint256_t> rangeStart;
    std::optional<uint256_t> rangeEnd;
    std::vector<TargetAddress*> targets;
    std::set<AddressType> requiredAddressTypes;
    std::set<PublicKeyForm> requiredPublicKeyForms;
};

// in GeneratorGroup:
std::vector<RangeSubGroup> rangeSubGroups;
```

---

## Open: address list scoring

### Goal

Each address list gets a score 0–100 visible in the UI. The score reflects how efficiently the list can be searched — lower score = more per-iteration overhead. It is computed from the dump file data, not at runtime.

### Scoring breakdown (100 points total)

#### Pubkey forms required — 40 points

The number of distinct secp256k1 operations needed per effective key. This is the most expensive axis.

| Unique forms across all addresses | Points |
|-----------------------------------|--------|
| 1 (all same pubkey form) | 40 |
| 2 | 20 |
| 3 (compressed + uncompressed + xonly all present) | 0 |

Computed as: `40 - (uniqueForms - 1) * 20`

#### Key range fragmentation — 30 points

Measures how many secp256k1 operations are needed per generator tick. One shared range (or no range) = one key per tick. N unique ranges = N keys per tick.

| Unique per-address ranges (for PCG64/RandBytes) | Points |
|-------------------------------------------------|--------|
| 0 or 1 (all same or no range) | 30 |
| 2–4 | 15 |
| 5+ | 0 |

Sequential addresses are excluded from this axis — their range is intrinsic and not fragmentation.

#### Generator homogeneity — 20 points

Whether all addresses use the same generator type. Mixed generators mean multiple generator groups even within one address list.

| Generator types in the list | Points |
|-----------------------------|--------|
| 1 | 20 |
| 2+ | 0 |

#### Address type homogeneity — 10 points

Whether all addresses are the same type. Multiple types add comparison dispatch overhead, though it is minor.

| Unique address types | Points |
|----------------------|--------|
| 1 | 10 |
| 2+ | 0 |

### Score interpretation text

These strings are shown to the user in the address list tab:

| Score | Text |
|-------|------|
| 90–100 | "Fully optimized — single address type, uniform generator, and shared key range. Minimal overhead per iteration." |
| 70–89 | "Well optimized — small variance in types or ranges adds minor overhead." |
| 45–69 | "Moderately optimized — multiple pubkey forms or fragmented key ranges mean extra derivation steps per iteration." |
| 20–44 | "Poorly optimized — mixed types, generators, or many per-address ranges. Consider splitting this list by type or generator." |
| 0–19 | "Unoptimized — each key requires its own full derivation chain. Split this list by type and range for best performance." |

### Where to compute it

The score is cheap to compute server-side when an address list dump is generated or updated. It does not require running the worker. Store it in the DB on the address list record and recompute on any list mutation.
