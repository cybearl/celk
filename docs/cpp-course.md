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

**Note on BigInt serialization:**

The TypeScript side expects attempt counts as a bigint string with an `n` suffix:

```
12345  →  "12345n"
```

`attempts` is already `std::string` in `WorkerProgressMessage` and `WorkerMatchMessage`,
so the macro serialization is correct as-is. Keep the counter as `uint64_t` internally
(it's the right type for arithmetic), and only format it when assigning to the struct field:

```cpp
msg.attempts = std::to_string(count) + "n";   // "12345n"
```

Then serialize normally with `json(msg)` — no need to build JSON by hand.

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

---

### Why you can't call `std::getline` in the main loop

`std::getline` **blocks** — it halts the entire thread until a full line arrives on stdin.
Calling it directly in the main loop would freeze everything: no heartbeats sent, no
progress reported, nothing — just a frozen process waiting for input that may not come for seconds.

In TypeScript you never think about this because everything I/O-related is asynchronous by
default. In C++, I/O is synchronous unless you explicitly put it on another thread.

The solution: a dedicated **reader thread** whose only job is to sit blocked on `std::getline`
and push lines into a shared queue as they arrive. The main thread just checks the queue each
loop iteration — instant, non-blocking.

---

### `std::queue` — FIFO, not a random-access array

`std::queue` is a first-in, first-out container. Unlike `std::vector`, you can't index into it
(`queue[0]` doesn't exist). You only interact with the front and back:

```cpp
#include <queue>

std::queue<std::string> q;

q.push("first");    // add to back
q.push("second");

q.empty();          // false
q.front();          // "first" — peek without removing
q.pop();            // remove front (returns void)
q.front();          // "second" now
```

In TypeScript terms: a `string[]` where you only ever `.push()` to the back and `.shift()` from
the front — but more efficient because it doesn't shift every element on removal.

---

### Threads in C++

```cpp
#include <thread>

std::thread t([]() {
    // this runs in parallel on its own OS thread
    // lambda syntax is identical to TypeScript — () => { ... }
});

t.detach();   // fire-and-forget: main thread continues, doesn't care when t ends
// OR
t.join();     // block until t finishes — you MUST call one or the other
```

**Important:** if you destroy a `std::thread` object without calling `detach()` or `join()`,
the program crashes immediately with `std::terminate`. C++ forces you to make a deliberate
choice about thread lifetime.

For the stdin reader, use `t.detach()` — it runs forever until stdin closes, and you don't
need to wait for it.

#### Lambda captures in threads — a common gotcha

When a thread lambda captures local variables, those variables must outlive the thread:

```cpp
// DANGEROUS — `line` is a local variable, the thread might outlive it
std::string line = "hello";
std::thread t([&line]() { std::cout << line; });
t.detach();
// line is destroyed here — thread reads garbage

// SAFE — capture by value (copy)
std::thread t([line]() { std::cout << line; });
t.detach();
```

`[&]` = capture everything by reference (dangerous for detached threads).
`[=]` = capture everything by value (copies — safe but uses more memory).

For the reader thread, you'll capture the shared queue and mutex by reference — that's fine
because they're declared at global or `io.cpp` file scope, so they always outlive the thread.

---

### Protecting shared data with a mutex

Two threads touching the same `std::queue` simultaneously is undefined behavior — one thread
might be in the middle of reallocating memory when the other tries to read. This is a **data race**.

Fix: a `std::mutex` (mutual exclusion lock). Only one thread can hold it at a time.

```cpp
#include <mutex>

std::queue<std::string> message_queue;
std::mutex queue_mutex;
```

To lock, you could call `queue_mutex.lock()` and `queue_mutex.unlock()` manually — but that's
error-prone (what if an exception is thrown between them?). Instead, use `std::lock_guard`:

```cpp
// Reader thread — pushes a line:
{
    std::lock_guard<std::mutex> lock(queue_mutex);  // acquires the lock in its constructor
    message_queue.push(line);
}   // `lock` goes out of scope here — destructor releases the mutex automatically (RAII)

// Main thread — pops a line:
{
    std::lock_guard<std::mutex> lock(queue_mutex);
    if (!message_queue.empty()) {
        std::string line = message_queue.front();
        message_queue.pop();
        // process line...
    }
}   // mutex released here
```

The `{ }` blocks are plain C++ scopes — they don't do anything special on their own, but
they control where `lock` is destroyed, which controls when the mutex is released. Putting
them as tight as possible means you hold the lock for the shortest possible time.

In TypeScript terms: imagine `std::lock_guard` as a token you must hold to touch shared
state, and it automatically gives up the token when it falls out of the current block.

---

### Thread-safe stdout

`std::cout` has two problems when used from multiple threads:

**1. Buffering** — `std::cout` accumulates output in a buffer and only flushes it periodically.
The Node.js manager reads lines via stdout, so unflushed lines would never arrive. Fix:

```cpp
std::cout << std::unitbuf;   // enables automatic flush after every << write
```

Call this once at startup in `io_init()`.

**2. Interleaving** — two threads writing to stdout simultaneously produce garbled output.
The lines mix character-by-character. Fix: a dedicated write mutex, same pattern as the queue:

```cpp
std::mutex write_mutex;

void io_write(const std::string& line) {
    std::lock_guard<std::mutex> lock(write_mutex);
    std::cout << line << '\n';
}
```

---

### Detecting stdin close

When Node.js kills the worker process, stdin is closed. `std::getline` returns `false` at
that point, so the reader thread exits naturally:

```cpp
std::string line;
while (std::getline(std::cin, line)) {   // returns false on EOF (stdin closed)
    std::lock_guard<std::mutex> lock(queue_mutex);
    message_queue.push(line);
}
// EOF reached — loop exits, thread function returns, thread ends cleanly
```

No cleanup needed — when the thread function returns, the thread is done.

---

### Your task

Create `src/io.hpp`:
```cpp
#pragma once
#include <queue>
#include <string>

// Call once at startup — enables auto-flush and starts the stdin reader thread
void io_init();

// Thread-safe stdout write — adds '\n' and flushes
void io_write(const std::string& line);

// Drains all pending lines from the queue into `out` (passed by reference so we can fill it).
// Returns the number of lines moved.
int io_drain(std::queue<std::string>& out);
```

> `io_drain` takes `out` by non-const reference (`&` without `const`) because it needs to
> **modify** it — adding lines to it. This is the C++ equivalent of passing an object to a
> function and mutating it in TypeScript.

Create `src/io.cpp`:
```cpp
#include "io.hpp"
#include <iostream>
#include <mutex>
#include <thread>

// File-scope (internal) state — not exposed in the header
static std::queue<std::string> s_queue;
static std::mutex               s_queue_mutex;
static std::mutex               s_write_mutex;

void io_init() {
    std::cout << std::unitbuf;   // auto-flush on every write

    std::thread reader([]() {
        std::string line;
        while (std::getline(std::cin, line)) {
            std::lock_guard<std::mutex> lock(s_queue_mutex);
            s_queue.push(line);
        }
    });
    reader.detach();
}

void io_write(const std::string& line) {
    std::lock_guard<std::mutex> lock(s_write_mutex);
    std::cout << line << '\n';
}

int io_drain(std::queue<std::string>& out) {
    std::lock_guard<std::mutex> lock(s_queue_mutex);
    int count = 0;
    while (!s_queue.empty()) {
        out.push(s_queue.front());
        s_queue.pop();
        ++count;
    }
    return count;
}
```

> The `static` keyword on file-scope variables means "private to this translation unit" —
> other `.cpp` files can't see them even if they include the header. Think of it as module-private.

**Checkpoint:** `io_init()` starts the reader thread. In a temporary `main.cpp`, call `io_init()`,
then loop: drain the queue and `io_write` each line back. Type lines into stdin and confirm they
echo back via stdout.

---

## Chapter 4 — `main.cpp`: Wiring it All Together

**Goal:** Read the `start` message, load the dump, run the main loop with timers.

---

### `auto` — type inference

You'll see `auto` a lot in this chapter. It means "compiler, figure out the type yourself":

```cpp
auto x = 42;                            // int
auto name = std::string("hello");       // std::string
auto now = std::chrono::steady_clock::now();  // some long internal chrono type
```

Same as TypeScript's `const` inference — except it happens at compile time and the type
is fixed forever. You can't reassign an `auto` variable to a different type later.

It's especially useful with `std::chrono` types where the actual type name is unreadably long.

---

### Timing in C++

There's no `setTimeout` or `setInterval`. Instead, you track "when did I last do X" and
check elapsed time on every loop iteration:

```cpp
#include <chrono>

auto lastHeartbeat = std::chrono::steady_clock::now();

while (true) {
    auto now     = std::chrono::steady_clock::now();
    auto elapsed = std::chrono::duration_cast<std::chrono::milliseconds>(
        now - lastHeartbeat
    ).count();   // plain integer, in milliseconds

    if (elapsed >= heartbeatIntervalMs) {
        // send heartbeat...
        lastHeartbeat = now;   // reset the timer
    }
}
```

The verbose `std::chrono::duration_cast<std::chrono::milliseconds>(...).count()` is just
C++'s way of saying "convert this duration to milliseconds and give me the integer value".
It's boilerplate — don't overthink it.

Use `std::chrono::steady_clock` specifically — it only ever moves forward at a constant rate.
`std::chrono::system_clock` (wall time) can jump backwards if the user changes their clock
or DST kicks in, which would break your timers.

To sleep without blocking the whole process:
```cpp
std::this_thread::sleep_for(std::chrono::milliseconds(10));
```

This only sleeps the current thread. The reader thread keeps running.

---

### `std::atomic<T>` — sharing simple values between threads

If two threads read and write the same regular variable simultaneously, it's undefined
behavior — the CPU can partially write a value while the other thread reads it.

`std::atomic<T>` wraps a value and makes every read and write **indivisible** (atomic),
so no thread ever sees a half-written value:

```cpp
#include <atomic>

std::atomic<bool>     stopFlag{false};   // {false} initializes the value
std::atomic<uint64_t> attempts{0};
```

You can't use regular `=` and `+=` on atomics — those would silently bypass the protection.
Instead you use explicit methods:

```cpp
stopFlag.store(true);                                 // write
stopFlag.load();                                      // read
attempts.fetch_add(1, std::memory_order_relaxed);     // add and return old value
attempts.exchange(0);                                 // swap to 0, return old value
```

`std::memory_order_relaxed` is a performance hint that tells the CPU it doesn't need to
synchronize memory ordering with other operations — fine for a simple counter where you
only care about the value, not what order it was written relative to other things.

The `.exchange(0)` operation is key for progress reporting: it atomically resets the
counter to zero and gives you the previous value in a single operation, so you never
lose a count between reading and resetting.

---

### Why you can't just use a mutex for everything

You could protect `attempts` with a mutex instead of `std::atomic`. It would be correct,
but the worker thread increments it millions of times per second. Locking and unlocking
a mutex that often has significant overhead. `std::atomic` is hardware-level — on modern
CPUs it compiles down to a single instruction with no lock.

Rule of thumb: atomic for simple values (counters, flags), mutex for complex data (structs,
strings, multiple values that must change together).

---

### Match state — mixing atomic and mutex

The match result involves multiple fields (address string, private key, attempt count) that
must be written together consistently. A struct that combines both patterns works well:

```cpp
struct MatchState {
    std::atomic<bool> found{false};   // checked in the hot loop — must be atomic
    std::mutex        mu;             // protects the payload below
    std::string       address;
    std::string       privateKey;
    uint64_t          totalAttempts{0};
};
```

The worker thread writes `address`, `privateKey`, `totalAttempts` under the mutex, then
sets `found` to `true`. The main thread checks `found` cheaply (no lock), and only locks
the mutex to read the payload once a match is confirmed.

---

### Reading the start message

`main()` starts by blocking once on stdin, waiting for the `start` message from Node.js.
This is fine — the worker shouldn't do anything until instructed:

```cpp
std::string startLine;
std::getline(std::cin, startLine);   // blocks until Node sends the start message
auto startMsg = deserializeJson(startLine).get<StartWorkerMessage>();
```

This is a deliberate one-time blocking read, before `ioInit()` starts the reader thread.
After this point, all stdin reading goes through the thread/queue.

---

### `exit(1)` vs `return 1`

In `main()` they're nearly equivalent, but `exit(1)` works from anywhere — including
functions called from `main()`. Use it for fatal errors like heartbeat timeout:

```cpp
exit(1);   // terminate immediately with error code, callable from any function
```

`return 1` only works in `main()` itself.

---

### Building a JSON message with nlohmann

`serializeJson` (from `utils/json.hpp`) takes a `nlohmann::json` object and turns it into a
string. The question is: how do you build that object?

The library supports two styles. The **initializer-list** style constructs the whole object
at once, like an object literal:

```cpp
nlohmann::json msg = {
    {"type", "heartbeat"},
    {"addressListId", someId}
};
```

Each `{key, value}` pair is a field. Values can be any basic type — string, int, bool — and
the library handles the conversion. Nested objects are just another `{...}` inside.

The **assignment** style builds fields one at a time:

```cpp
nlohmann::json msg;
msg["type"]          = "heartbeat";
msg["addressListId"] = someId;
```

Both produce identical JSON. Use whichever reads more clearly for the message at hand. For
short fixed-shape messages the initializer list is compact; for messages where some fields
are conditional the assignment style is easier.

Either way, finish with `io_write(serializeJson(msg))` to send it.

> `using json = nlohmann::json;` is already declared in `utils/json.hpp`, so you can write
> `json{...}` instead of `nlohmann::json{...}` throughout `main.cpp`.

---

### Your task

Rewrite `main.cpp` following this structure:

```
1. Read the start message (one blocking std::getline before ioInit)
2. ioInit()
3. loadDumpFile(startMsg.addressesDumpFilePath)
4. Declare shared state: stopFlag, attempts, matchState
5. Launch stub worker thread (just loops: attempts++, sleep 1ms)
6. Initialize timers: lastHeartbeat, lastProgress, lastHeartbeatAck
7. Main loop:
   a. ioDrain() → for each line, parse type field and handle:
        "heartbeat-ack" → update lastHeartbeatAck
        "stop"          → stopFlag.store(true)
   b. heartbeat timer  → send heartbeat JSON, update lastHeartbeat
   c. heartbeat timeout → exit(1)
   d. progress timer   → send progress JSON (attempts.exchange(0), format as "Xn")
   e. match found      → send match JSON, maybe stopFlag.store(true)
   f. stopFlag check   → break
   g. sleep_for(10ms)
8. workerThread.join()
```

**BigInt serialization reminder** — `attempts` is `std::string` in the struct, so just
assign `std::to_string(count) + "n"` to the field and serialize with `json(msg)` normally.

**Checkpoint:** Run the worker, send a `start` JSON line via stdin, confirm heartbeats
and progress messages appear on stdout at the configured intervals.

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
