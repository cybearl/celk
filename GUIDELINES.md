# Guidelines

Kernel: Classes
---------------
- All private readonly properties should be written in UPPERCASE with a leading underscore.
- All private methods should be written in camelCase with a leading underscore.
- All methods should have a strongly typed return type.
- All number arrays should be replaced by Uint8Array.
- `Cache` should only be used for the main memory table and never
  for internal operations, use `Uint8Array` instead.
- The `Cache` instance where data is read or written should **never**
  be returned by a method.
- When two methods in classes writes the data either in a `Cache` or an `Uint8Array`,
  the `Uint8Array` one should be written with a `ToBytes` suffix.
  These two methods should not have the logic to write the data, only
  to call the private function that does **both**, example:
  ```typescript
  // PRIVATELY decodes and write either in a Cache or in an Uint8Array
  // If cache and slot are provided, writes in the cache, otherwise in the Uint8Array
  private decode(bech32String: string, cache?: Cache, slot?: MemorySlot): void

  // Decodes and returns the data in a Cache
  decode(bech32String: string, cache: Cache, slot: MemorySlot): void

  // Decodes and returns the data in a Uint8Array
  decodeToBytes(bech32String: string): Uint8Array
  ```
  There's no need to verify that both `cache` and `slot` are provided inside the logic-containing method,
  if one of them is missing, just return the `Uint8Array` instead.
