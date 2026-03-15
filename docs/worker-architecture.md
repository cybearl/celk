# Worker Architecture
## Overview
The worker is a standalone C++ executable that handles key generation for a single address list. The Node.js manager spawns one worker process per enabled address list, communicates with it via newline-delimited JSON over stdin/stdout, and tears it down when the list is disabled or the app shuts down.

## Communication Protocol
All messages are JSON objects, one per line, sent over stdin (manager → worker) or stdout (worker → manager). Every message carries two base fields:
- `type`: identifies the message kind (see tables below)
- `addressListId`: the UUID of the address list being processed

### Manager → Worker
| Type            | Description                                          |
|-----------------|------------------------------------------------------|
| `start`         | Bootstrap message, always the first message received |
| `stop`          | Graceful shutdown request                            |
| `heartbeat-ack` | Acknowledgement of a heartbeat sent by the worker    |

The `start` message also carries:
| Field                   | Type      | Description                                       |
|-------------------------|-----------|---------------------------------------------------|
| `addressesDumpFilePath` | `string`  | Absolute path to the address list dump JSON file  |
| `reportIntervalMs`      | `number`  | How often to send a `progress` message            |
| `heartbeatIntervalMs`   | `number`  | How often to send a `heartbeat` message           |
| `heartbeatTimeoutMs`    | `number`  | Max ms without a `heartbeat-ack` before self-kill |
| `stopOnFirstMatch`      | `boolean` | Whether to stop after the first match             |

### Worker → Manager
| Type        | Description                                            |
|-------------|--------------------------------------------------------|
| `heartbeat` | Periodic liveness ping                                 |
| `progress`  | Attempt count since the last report                    |
| `match`     | A private key that unlocks one of the target addresses |
| `error`     | Non-fatal error message for logging                    |

The `progress` message also carries:
| Field      | Type     | Description                                 |
|------------|----------|---------------------------------------------|
| `attempts` | `bigint` | Attempts since last report (not cumulative) |

The `match` message also carries:
| Field        | Type     | Description                          |
|--------------|----------|--------------------------------------|
| `address`    | `string` | The matched address                  |
| `privateKey` | `string` | The raw (unencrypted) private key    |
| `attempts`   | `bigint` | Cumulative attempts at time of match |

## BigInt Serialization
The TypeScript side uses a custom BigInt encoding: the number is represented as a JSON string with an `n` suffix.

```text
12345  →  "12345n"
```

The worker must output `attempts` in this format. Serialize with:
```cpp
std::to_string(attempts) + "n"  // as the JSON string value
```

To parse an inbound bigint field: strip the trailing `n`, then use `std::stoull`.

## Dump File Format
Before spawning a worker the manager writes a dump file containing all active addresses for the list. The worker reads this file once at startup.

Format: a JSON array of address objects.

```json
[
  {
    "id": "uuid",
    "name": "My Address",
    "network": "ethereum",
    "type": "ethereum",
    "value": "0xabc...",
    "preEncoding": null,
    "privateKeyRangeStart": null,
    "privateKeyRangeEnd": null,
    "isDisabled": false,
    "addressListId": "uuid"
  }
]
```

Supported networks: `bitcoin`, `ethereum`, `polygon`
Supported types: `ethereum`, `btc_p2pkh`, `btc_p2wpkh`, `btc_p2sh`, `btc_p2tr`

## Program Flow
```text
main()
 │
 ├─ read one line from stdin → parse as StartMessage
 ├─ load dump file from addressesDumpFilePath → vector<AddressDump>
 │
 ├─ launch worker thread (key generation loop)
 │   └─ increments shared atomic<uint64_t> attempts_counter
 │      signals match via a shared struct + atomic<bool> match_found
 │
 └─ main loop (checks stdin + manages timers)
     ├─ non-blocking stdin check
     │   ├─ "stop"          → set stop_flag, break
     │   └─ "heartbeat-ack" → update last_ack timestamp
     │
     ├─ every heartbeatIntervalMs  → send Heartbeat to stdout
     ├─ every heartbeatTimeoutMs without ack → exit(1) (self-kill)
     ├─ every reportIntervalMs     → send Progress (swap counter to 0)
     └─ if match_found             → send Match, optionally stop
```

## Recommended File Structure
- File: `src/main.cpp`
  Scope: entry point, waits for `start`, then wires up and runs the main loop
- File: `src/protocol.hpp`
  Scope: message structs mirroring `packages/app/workers/lib/protocol.ts`
- File: `src/io.hpp` / `src/io.cpp`
  Scope: thread-safe stdout writer, stdin reader thread with a message queue
- File: `src/dump.hpp` / `src/dump.cpp`
  Scope: reads the dump JSON file into a typed `std::vector<AddressDump>`
- File: `src/worker.hpp` / `src/worker.cpp`
  Scope: key generation loop, runs on a background thread

## Implementation Order
1. `protocol.hpp`: message structs, serialize/deserialize with nlohmann/json
2. `dump.hpp/.cpp`: parse the dump file into `std::vector<AddressDump>`
3. `io.hpp/.cpp`: stdout writer and stdin reader thread with a queue
4. `main.cpp`: wire up start message, load dump, launch main loop
5. `worker.hpp/.cpp`: key generation and address comparison (crypto work)

Steps 1–4 are plumbing and cover C++ fundamentals (structs, file I/O, threads, queues). Step 5 is where the domain logic lives.

## Key Implementation Notes
### stdout must flush immediately
The manager reads line-by-line. Default `std::cout` buffering will cause the manager to hang silently. Either enable `unitbuf` at startup or flush after every write:
```cpp
// At startup (preferred)
std::cout << std::unitbuf;

// Or per write
std::cout << message << '\n' << std::flush;
```

### Non-blocking stdin
`std::getline` blocks, which would stall the heartbeat and progress timers. Run stdin reading on a dedicated thread that pushes lines into a `std::queue<std::string>` protected by a `std::mutex`. The main loop drains the queue each iteration with a short `std::this_thread::sleep_for` between ticks.

### Thread synchronization
The key generation thread and the main loop share two pieces of state:
- `std::atomic<uint64_t>`: attempts counter, use `fetch_add` in the worker thread and `exchange(0)` in the main loop when reporting progress
- `std::atomic<bool>`: stop flag and match-found flag, set from either thread

## Dependencies
### nlohmann/json
Single-header JSON library. Add via CMake `FetchContent`:
```cmake
include(FetchContent)
FetchContent_Declare(
    nlohmann_json
    GIT_REPOSITORY https://github.com/nlohmann/json.git
    GIT_TAG        v3.11.3
)
FetchContent_MakeAvailable(nlohmann_json)

target_link_libraries(worker PRIVATE nlohmann_json::nlohmann_json)
```

Usage:
```cpp
#include <nlohmann/json.hpp>
using json = nlohmann::json;

auto msg = json::parse(line);
std::string type = msg["type"];

json out = {{"type", "heartbeat"}, {"addressListId", id}};
std::cout << out.dump() << '\n' << std::flush;
```
