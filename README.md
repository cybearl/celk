<p align="center">
  <br />
  <a href="https://www.cybearl.com" target="_blank"><img width="100px" src="https://cybearl.com/_next/image?url=%2Fimages%2Flogo.webp&w=640&q=75" /></a>
  <h2 align="center">@cybearl/celk</h2>
  <p align="center">A small application for trying to brute-force a set of Ethereum addresses.</p>
</p>


## Overview
Celk runs long-lived brute-force jobs against user-defined lists of cryptocurrency addresses.
Each job spawns a compiled C++ subprocess controlled by Node.js via stdin/stdout.
The app is designed to run for years; all counters use `bigint`.

## Database schemas
### `addresses`
Stores individual target addresses owned by a single user. An address can belong to many
of that user's lists. The `attempts` counter is the global lifetime total, independent of any list:
| Column             | Type               | Notes                                                     |
|--------------------|--------------------|-----------------------------------------------------------|
| `id`               | `text` PK          | UUID                                                      |
| `name`             | `text`             | Human-readable label                                      |
| `type`             | `address_type`     | `ethereum`, `btc_p2pkh`, `btc_p2wpkh`                     |
| `network`          | `address_network`  | `bitcoin`, `ethereum`, `polygon`                          |
| `balance`          | `bigint?`          | Last known balance in satoshis / wei, null until checked  |
| `value`            | `text`             | The address string (e.g., `1A1zP1eP…`)                    |
| `decrypted`        | `text`             | Raw pre-encoding form (e.g., pre-Base58 for BTC)          |
| `privateKey`       | `text?`            | Null until found by a worker                              |
| `attempts`         | `bigint`           | Lifetime total across all lists                           |
| `isDisabled`       | `boolean`          | When true, workers skip this address (see `user_options`) |
| `userId`           | `text` FK          | Owner, cascades on delete                                 |
| `createdAt`        | `timestamp`        | ---                                                       |
| `updatedAt`        | `timestamp`        | ---                                                       |
| `balanceCheckedAt` | `timestamp?`       | When balance was last fetched                             |

### `address_lists`
Groups addresses into a named list with its own worker options and last stats snapshot.
The user controls processing via the `isEnabled` boolean:
| Column                  | Type         | Notes                                                     |
|-------------------------|--------------|-----------------------------------------------------------|
| `id`                    | `text` PK    | UUID                                                      |
| `name`                  | `text`       | Human-readable label                                      |
| `description`           | `text?`      | Optional                                                  |
| `isEnabled`             | `boolean`    | Worker spawns while `true`, stops when flipped to `false` |
| `stopOnFirstMatch`      | `boolean`    | Stop the whole list when any address is cracked           |
| `attempts`              | `bigint`     | Lifetime total of all trials run against this list        |
| `lastStatsAttempts`     | `bigint?`    | Attempts reported in the last stats window                |
| `lastStatsClosestMatch` | `text?`      | Closest match in the last stats window (format TBD)       |
| `lastStatsAt`           | `timestamp?` | When last stats were received                             |
| `userId`                | `text` FK    | Owner, cascades on delete                                 |
| `createdAt`             | `timestamp`  | ---                                                       |
| `updatedAt`             | `timestamp`  | ---                                                       |

### `address_list_members` (pivot table)
Tracks per-address, per-list attempt count. An address can appear in multiple lists owned
by the same user; each membership tracks its own counter independently:
| Column          | Type        | Notes                     |
|-----------------|-------------|---------------------------|
| `id`            | `text` PK   | UUID                      |
| `attempts`      | `bigint`    | Attempts within this list |
| `addressListId` | `text` FK   | Cascades on delete        |
| `addressId`     | `text` FK   | Cascades on delete        |
| `createdAt`     | `timestamp` | ---                       |
| `updatedAt`     | `timestamp` | ---                       |

Unique constraint: `(addressListId, addressId)`

### `user_options`
Per-user settings that control worker behavior and automatic address management.
One row per user (1:1 with `users`):
| Column                  | Type      | Notes                                                       |
|-------------------------|-----------|-------------------------------------------------------------|
| `id`                    | `text` PK | UUID                                                        |
| `autoDisableZeroBalance`| `boolean` | Automatically set `isDisabled = true` when balance = 0      |
| `restartUntilAllFound`  | `boolean` | Keep re-spawning until every address in the list is cracked |
| `userId`                | `text` FK | Unique, FK -> `users.id`, cascades on delete                |

## Environment variables
| Variable                   | Default | Notes                                       |
|----------------------------|---------|---------------------------------------------|
| `WORKER_STATS_INTERVAL_MS` | `5000`  | How often the C++ process emits stats (ms)  |
| `WORKER_BINARY_PATH`       | ------  | Path to the compiled C++ binary             |

## Worker protocol (Node.js <-> C++)
Node.js spawns the C++ binary as a child process and communicates via stdin/stdout using
newline-delimited JSON.

### Spawn parameters (CLI args)
```sh
./worker --data=<base64-encoded-buffer|path> --type=<address_type>
```

Using a buffer instead of a file path avoids disk I/O and is preferred when the list fits
in memory.

### Stdout message types
The C++ process emits one JSON line to stdout every `WORKER_STATS_INTERVAL_MS` milliseconds.

**Stats (no match found):**
```json
{ "status": "stats", "attempts": 15000, "closestMatch": "..." }
```

**Match found:**
```json
{ "status": "found", "attempts": 15000, "addressId": "uuid...", "privateKey": "0x..." }
```

Node.js writes these stats back to the DB (`lastStats*` columns on the list,
`attempts` incremented on the membership row and the global address row).

### Lifecycle
```text
isEnabled = true
    │
    v
spawn C++ process with list params
    │
    v
read stdout lines in a loop (worker emits on its own timer)
    │
    ├── "stats" -> increment list.attempts, update lastStats*, continue
    │
    └── "found" -> set address.privateKey, increment attempts,
                   if stopOnFirstMatch -> set isEnabled = false, kill process
                   else -> remove found address from active list, continue

on process exit (unexpected crash):
    └── always re-spawn with same params, continue

on all addresses found:
    └── if restartUntilAllFound -> set isEnabled = false, stop
        else -> keep running (addresses already found are skipped)
```

Node.js watches `isEnabled` in the DB (polling or pg LISTEN/NOTIFY).
When flipped to `false`, it closes stdin to gracefully stop the process.

## Open questions / future work
- **Closest match metric**: plain bit-distance for now; Patricia Merkle Trie (PMT) as a
  future enhancement for smarter proximity tracking.
- **Balance check**: done once on address creation via an external RPC call (Infura,
  Blockstream, etc.). An "Update balance" button will trigger a re-check on demand.
- **Multiple workers**: a single list runs one worker at a time; parallel workers per list
  are out of scope for now.
