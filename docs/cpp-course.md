# C++ Worker Implementation Course

> Reference guide for implementing the celk worker binary.
> Follows the implementation order from `worker-architecture.md` and `address-generation.md`.

---

## The Big Picture

The worker is a standalone C++ executable. The Node.js app spawns one per address list,
communicates via newline-delimited JSON over stdin/stdout, and kills it when done.
Your job is to build that executable in 5 steps, starting from the empty `main.cpp`.

---

## Chapter 0 — C++ Mental Model for TypeScript Devs

### 0.1 — Compilation: There is no runtime

```
TypeScript:    .ts → tsc → .js → Node.js → runs
C++:           .cpp/.hpp → compiler → .exe → runs directly on CPU
```

No GC, no event loop, no runtime. You manage everything explicitly.

### 0.2 — Headers vs Source Files

| File  | TypeScript analogy       | What goes in it                              |
|-------|--------------------------|----------------------------------------------|
| `.hpp` | Type/interface declarations | Struct definitions, function signatures   |
| `.cpp` | Implementation           | Actual function bodies                       |

Every header starts with `#pragma once` — equivalent to "don't import this twice".
You `#include "something.hpp"` like you `import { Foo } from "./something"`.

### 0.3 — Types are explicit and sized

| C++ type              | TypeScript rough equiv |
|-----------------------|------------------------|
| `int`                 | `number` (integers)    |
| `uint8_t`             | `number` (0–255 byte)  |
| `uint64_t`            | `bigint`               |
| `bool`                | `boolean`              |
| `std::string`         | `string`               |
| `std::vector<T>`      | `T[]`                  |
| `std::optional<T>`    | `T \| undefined`        |

### 0.4 — Structs are interfaces that actually hold data

```typescript
// TypeScript — erased at runtime
interface StartMessage { type: string; reportIntervalMs: number; }
```
```cpp
// C++ — real memory layout
struct StartMessage { std::string type; int reportIntervalMs; };
```

### 0.5 — No async/await, but you have real threads

C++ threads run in parallel on different CPU cores. When two threads touch the
same variable you must synchronize:

- `std::atomic<T>` — for simple values (counters, flags). Zero overhead.
- `std::mutex` + `std::lock_guard` — for complex data. Acts like acquire/release.

`std::lock_guard` releases the lock when it goes out of scope, even on exceptions.
This pattern is called **RAII** — resources are tied to object lifetimes.

---

## Chapter 1 — `protocol.hpp`: Message Structs

**Goal:** Define C++ types for every JSON message the worker sends/receives.

### Status: DONE ✓

**Key things you did well:**
- `enum class WorkerMessageType` + `NLOHMANN_JSON_SERIALIZE_ENUM` — cleaner than raw
  strings per struct.
- Inheritance from `WorkerMessage` base — DRY, avoids repeating `type`/`addressListId`.
- `std::variant<...>` for `AnyIncomingWorkerMessage` — excellent TypeScript-union thinking.
- Separated `address.hpp` and `utils/json.hpp` — clean concern separation.

**One issue to fix before Chapter 4:**

`uint64_t attempts` in `WorkerProgressMessage` and `WorkerMatchMessage` will serialize
as a plain JSON number. But the TypeScript side expects a bigint string with an `n` suffix:

```
12345  →  "12345n"
```

The fix: when you *send* these messages, build the JSON object manually instead of
relying on the macro serialization:

```cpp
// Don't do this (wrong format):
WorkerProgressMessage msg{..., count};
io_write(serializeJson(json(msg)));

// Do this instead:
json msg = {
    {"type", "progress"},
    {"addressListId", addressListId},
    {"attempts", std::to_string(count) + "n"}   // "12345n"
};
io_write(serializeJson(msg));
```

Keep `uint64_t` internally — it's the right type for arithmetic. Just format it as
a string when building the outgoing JSON. Same applies to `attempts` in `WorkerMatchMessage`.

---

## Chapter 2 — `dump.hpp` / `dump.cpp`: Reading the Dump File

**Goal:** Read the JSON dump file the manager writes, parse it into `std::vector<AddressDump>`.

> Note: `AddressDump` is already defined in `protocol.hpp`. No need to duplicate it.

### File I/O in C++

```cpp
#include <fstream>    // file stream
#include <sstream>    // string stream

std::string read_file(const std::string& path) {
    std::ifstream file(path);
    if (!file.is_open()) {
        throw std::runtime_error("Cannot open: " + path);
    }
    std::ostringstream ss;
    ss << file.rdbuf();   // pour entire file into string stream
    return ss.str();
}
```

- `std::ifstream` — input file stream (read-only)
- `std::ostringstream` — output string stream (write to a string buffer)
- `file.rdbuf()` — raw buffer of the file

### std::vector — your TypeScript array

```typescript
const items: AddressDump[] = [];
items.push(x);   items.length;   for (const x of items) { ... }
```
```cpp
std::vector<AddressDump> items;
items.push_back(x);   items.size();   for (const auto& x : items) { ... }
```

`const auto&` = "don't copy, just read". The `&` means "by reference".

### Your task

Create `src/dump.hpp`:
```cpp
#pragma once
#include "protocol.hpp"
#include <string>
#include <vector>

std::vector<AddressDump> load_dump(const std::string& path);
```

Create `src/dump.cpp`:
```cpp
#include "dump.hpp"
#include <fstream>
#include <sstream>
#include <stdexcept>

std::vector<AddressDump> load_dump(const std::string& path) {
    // 1. open file, throw if not found
    // 2. read to string
    // 3. json::parse(content)
    // 4. return parsed.get<std::vector<AddressDump>>()
    //    nlohmann/json handles the array automatically because
    //    AddressDump has NLOHMANN_DEFINE_TYPE_NON_INTRUSIVE
}
```

Add `src/dump.cpp` to `CMakeLists.txt`:
```cmake
add_executable(worker src/main.cpp src/dump.cpp)
```

**Checkpoint:** Parse a hardcoded test dump file and print the address values to stdout.

---

## Chapter 3 — `io.hpp` / `io.cpp`: Thread-Safe I/O

**Goal:** Background thread reads stdin line-by-line, pushes to a queue.
Main thread drains the queue each tick without blocking.

### Why you can't call `std::getline` in the main loop

`std::getline` **blocks** until a line arrives. Calling it in the main loop would
freeze everything — no heartbeats sent, no progress reported. Same as calling a
synchronous network read inside a `setInterval` callback.

Solution: dedicated reader thread that does nothing but block on `std::getline`
and push lines into a shared queue. Main thread checks the queue without blocking.

### Threads in C++

```cpp
#include <thread>

std::thread t([]() {
    // this runs on its own thread — lambda syntax same as TypeScript
});
t.detach();   // fire-and-forget, like not awaiting a Promise
// OR
t.join();     // wait for it to finish
```

### Protecting shared data with a mutex

```cpp
#include <mutex>
#include <queue>

std::queue<std::string> message_queue;
std::mutex queue_mutex;

// Reader thread pushes:
{
    std::lock_guard<std::mutex> lock(queue_mutex);  // acquires lock
    message_queue.push(line);
}  // lock released automatically here (RAII)

// Main thread pops:
{
    std::lock_guard<std::mutex> lock(queue_mutex);
    if (!message_queue.empty()) {
        std::string line = message_queue.front();
        message_queue.pop();
        // process line...
    }
}
```

### Thread-safe stdout

Two problems to avoid:
1. **Buffering** — `std::cout` doesn't flush automatically. Fix: `std::cout << std::unitbuf` at startup.
2. **Interleaving** — two threads writing at once mix their output. Fix: a write mutex.

### Detecting stdin close

The reader thread needs to stop when the manager kills the process (stdin closes):

```cpp
std::string line;
while (std::getline(std::cin, line)) {  // returns false on EOF
    // push to queue
}
// stdin closed — thread ends naturally
```

### Your task

Create `src/io.hpp`:
```cpp
#pragma once
#include <queue>
#include <string>

// Call once at startup — enables auto-flush, starts the reader thread
void io_init();

// Thread-safe stdout write — adds '\n' and flushes
void io_write(const std::string& line);

// Moves all pending lines into `out`. Returns count drained.
int io_drain(std::queue<std::string>& out);
```

Create `src/io.cpp` implementing those three functions.

**Checkpoint:** `io_init()` starts the reader thread. Type lines into stdin, see them
echoed back via `io_write` in the main loop.

---

## Chapter 4 — `main.cpp`: Wiring it All Together

**Goal:** Read the `start` message, load the dump, run the main loop with timers.

### Timing in C++

No `setTimeout` or `setInterval`. Track "last time I did X" and check elapsed time
each loop iteration:

```cpp
#include <chrono>

auto last_heartbeat = std::chrono::steady_clock::now();

while (true) {
    auto now     = std::chrono::steady_clock::now();
    auto elapsed = std::chrono::duration_cast<std::chrono::milliseconds>(
        now - last_heartbeat
    ).count();  // int, milliseconds

    if (elapsed >= heartbeatIntervalMs) {
        // send heartbeat
        last_heartbeat = now;  // reset
    }

    std::this_thread::sleep_for(std::chrono::milliseconds(10));  // 10ms tick
}
```

Use `std::chrono::steady_clock` — it never goes backwards (unlike wall-clock time).

### Atomic flags and counters

```cpp
#include <atomic>

std::atomic<bool>     stop_flag{false};
std::atomic<uint64_t> attempts{0};

// Set from any thread:
stop_flag.store(true);
attempts.fetch_add(1, std::memory_order_relaxed);

// Read from any thread:
if (stop_flag.load()) break;

// Swap counter to zero and get old value atomically (for progress reporting):
uint64_t count = attempts.exchange(0);
```

`std::memory_order_relaxed` is a performance hint — no strict ordering needed for
a simple counter.

### Match state

Shared between threads. The flag is atomic; the payload is mutex-protected and only
ever written once:

```cpp
struct MatchState {
    std::atomic<bool> found{false};
    std::mutex        mu;
    std::string       address;
    std::string       privateKey;
    uint64_t          totalAttempts{0};
};
```

### Your task

Rewrite `main.cpp` following this structure:

```
1. io_init()  (enables auto-flush, starts stdin reader thread)
2. Read one line → parse as StartWorkerMessage
3. load_dump(msg.addressesDumpFilePath) → vector<AddressDump>
4. Declare shared state: stop_flag, attempts, match_state
5. Launch stub worker thread (just loops: attempts++, sleep 1ms)
6. Main loop:
   - io_drain() → handle "stop" (set stop_flag) and "heartbeat-ack" (update last_ack)
   - heartbeat timer  → send heartbeat JSON
   - heartbeat timeout → exit(1)
   - progress timer   → send progress JSON (use attempts.exchange(0), format as "Xn")
   - match_found flag → send match JSON, maybe set stop_flag
   - sleep_for(10ms)
7. worker_thread.join()
```

**BigInt serialization reminder:**
```cpp
json progress = {
    {"type", "progress"},
    {"addressListId", addressListId},
    {"attempts", std::to_string(count) + "n"}
};
io_write(serializeJson(progress));
```

**Checkpoint:** Run the worker, send a `start` JSON line via stdin, see heartbeats and
progress messages appearing on stdout at the configured intervals.

---

## Chapter 5 — `worker.hpp` / `worker.cpp`: The Crypto Work

**Goal:** Real key generation, address derivation, target matching.

> The full derivation pipeline is documented in `address-generation.md`.
> This chapter follows its implementation order exactly.

### Step 5.1 — Add dependencies to CMakeLists.txt

Before any code, set up the build. Add `libsecp256k1`, OpenSSL, `tiny_sha3`, and
`pcg-cpp`. Verify the project compiles with the new deps before writing crypto code.
See `address-generation.md` for the exact CMake blocks.

### Step 5.2 — `IKeyGenerator` interface

```cpp
struct IKeyGenerator {
    virtual bool next(uint8_t privkey[32]) = 0;  // false = space exhausted
    virtual ~IKeyGenerator() = default;
};
```

`virtual` + `= 0` = abstract method (like `abstract` in TypeScript).
`uint8_t privkey[32]` = fixed 32-byte array on the stack (like `Uint8Array(32)`).

Start with just the random generator using `RAND_bytes` from OpenSSL.
Add PCG range and sequential generators after the random one works.

### Step 5.3 — Address lookup set

```cpp
#include <array>
#include <unordered_set>

struct ByteArray20Hash {
    size_t operator()(const std::array<uint8_t, 20>& a) const {
        uint64_t h;
        std::memcpy(&h, a.data(), sizeof(h));
        return std::hash<uint64_t>{}(h);
    }
};

using AddressSet = std::unordered_set<std::array<uint8_t, 20>, ByteArray20Hash>;

AddressSet eth_targets;
AddressSet btc_targets;
```

`std::array<uint8_t, 20>` = fixed 20-byte array. Copyable and comparable.
`std::unordered_set` = like `Set<string>` but with a custom hash for bytes.

Populate once at startup from `vector<AddressDump>`. This is where Base58/Bech32
**decoding** happens — decode each address string to raw bytes once, store raw bytes.

### Step 5.4 — `check_ethereum` and `check_bitcoin`

Each function:
1. Serializes the public key (uncompressed 65 bytes for ETH, compressed 33 bytes for BTC)
2. Hashes it (keccak256 for ETH, SHA256+RIPEMD160 for BTC)
3. Looks up the raw 20 bytes in the set — raw byte comparison, no string encoding
4. On match: format the full address string, signal `match_state`

Base58Check and Bech32 encoding only runs on a confirmed match, never in the hot loop.

### Step 5.5 — The hot loop

```cpp
while (!stop_flag.load(std::memory_order_relaxed)) {
    uint8_t privkey[32];
    if (!generator->next(privkey)) break;
    if (!secp256k1_ec_seckey_verify(ctx, privkey)) continue;  // ~0.1% rejection

    secp256k1_pubkey pubkey;
    secp256k1_ec_pubkey_create(ctx, &pubkey, privkey);  // dominant cost (~95% CPU)

    if (!eth_targets.empty()) check_ethereum(ctx, pubkey, privkey, closest);
    if (!btc_targets.empty()) check_bitcoin(ctx, pubkey, privkey, closest);

    attempts.fetch_add(1, std::memory_order_relaxed);
}
```

### Step 5.6 — Multi-threading

Each thread owns its own `secp256k1_context`. All threads share the read-only
`AddressSet` instances (safe without locking) and the atomic counter:

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

---

## Implementation Checklist

| Step | Files | Checkpoint |
|------|-------|------------|
| 1 | `protocol.hpp`, `address.hpp`, `utils/json.hpp` | Serialize a heartbeat struct to JSON string ✓ |
| 2 | `dump.hpp`, `dump.cpp` | Parse a test dump file, print address values |
| 3 | `io.hpp`, `io.cpp` | stdin reader thread; echo typed lines back via io_write |
| 4 | `main.cpp` | Full main loop with stub worker; test with the manager |
| 5a | `CMakeLists.txt` | Build with all crypto deps linked |
| 5b | `generator.hpp` | Random generator; secp256k1_ec_seckey_verify passes |
| 5c | `worker.cpp` | Ethereum derivation matches a known test vector |
| 5d | `worker.cpp` | Bitcoin derivation matches a known test vector |
| 5e | `worker.cpp` | Full hot loop, multi-threaded |

**Rule:** At each checkpoint you should be able to *run* what you have before moving on.
Don't write everything then debug all at once.

---

## RAII — The Pattern You'll See Everywhere

Resources in C++ are tied to object lifetimes. Destructors run automatically when
an object goes out of scope:

```cpp
{
    std::lock_guard<std::mutex> lock(mu);  // acquires lock in constructor
    // do stuff safely
}  // destructor runs here — lock released even if an exception was thrown
```

This is why you don't need `try/finally` for cleanup in C++. The destructor is
your `finally`.
