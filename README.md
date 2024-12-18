<p align="center">
  <br />
  <a href="https://www.cybearl.com" target="_blank"><img width="100px" src="https://cybearl.com/_next/image?url=%2Fimages%2Flogo.webp&w=640&q=75" /></a>
  <h2 align="center">@cybearl/celk</h2>
  <p align="center">A brute-forcing tool to work with Bitcoin and Ethereum<br />addresses, entirely written in Typescript.</p>
</p>

### Introduction

This project intends to see how much I can optimize the generation of Bitcoin and Ethereum addresses.
I'm mostly doing that for fun, and will implement new methods (headless-gl, workers, etc..) just to
see how much I can improve the performances on Node.js only (with the exception of shaders, if any),

We're still far away from VanitySearch (+- 3,000 MK/s on modern GPUs), but it's a fun project to work on.

### Benchmarking of the generator

| Version      | Addresses per second (K/s) | Upgrade description                                               |
| -------------| -------------------------- | ------------------------------------------------------------------|
| `v2024.12.2` | 23.05 kK/s                 | **Replacing Noble Curves by secp256k1-node binding**              |
| `v2024.12.1` | 2.55 kK/s                  | **New kernel architecture with support of BTC/ETH address types** |
| `v2024.11.1` | N/D                        | **----**                                                          |
| `v2024.9.0`  | N/D                        | **`vYYYY.M.D-<type>` & work on encoders...**                      |
| `v1.1.0`     | N/D                        | **Switching to AdonisJS**                                         |
| `v1.0.9`     | N/D                        | **Cancelled - New arch**                                          |
| `v1.0.8b`    | N/D                        | **File report system**                                            |
| `v1.0.8`     | 19.97 kK/s                 | **Reverted back to an Uint8Array**                                |
| `v1.0.7`     | 19.24 kK/s                 | **Using WASM / JS shared memory space with JS only**              |
| `v1.0.6`     | 15.42 kK/s                 | **Using SECP256K1 module and WASM / JS shared memory space**      |
| `v1.0.5b`    | N/D                        | **Better benchmarking & reports per second**                      |
| `v1.0.5`     | 1.25 kK/s                  | **Reverts the address to its RIPEMD-160 hash**                    |
| `v1.0.4b`    | N/D                        | **Allow to use the public key if known**                          |
| `v1.0.4`     | 1.24 kK/s                  | **Using a single buffer for all operations**                      |
| `v1.0.3`     | 1.19 kK/s                  | **Better private key generator (str -> bigint)**                  |
| `v1.0.2b`    | 1.18 kK/s                  | **Upgrading Node.js from v16.20.2 to v20.9.0**                    |
| `v1.0.2`     | 850 K/s                    | **Ghost executions + Better benchmark measures**                  |
| `v1.0.1`     | 792 K/s                    | **Improved benchmarking precision**                               |
| `v1.0.0`     | 396 K/s                    | **Basic algorithm implementations**                               |

### Updates

#### Latest update (v2024.12.2-alpha):
A simple upgrade that replaces the Noble Curves library by the `secp256k1-node` binding for the `Secp256k1Algorithm` class.

#### Previous updates
-  **v2024.12.1-alpha**:
    Note that this version implements a slow version of the `secp256k1` library, and is not optimized at all.
    - Implemented the new `InstructionSet` standard for the different address generation implementations:
        ```typescript
        { inputSlot: null, outputSlot: { start:   0, end:  32, length: 32 }, operation: GenericOperation.PrivateKey },
        ```
      where the operation runs a specific function on the input/output slots.
    - The private key generator now works based on a random number of bytes based on the lower and upper bounds,
      skipping the addresses that are out of the range, without actually comparing the numbers but the bytes,
      only if the number of bytes equals the min or max lengths. There is still a bit of work to do but it's far
      better than any other version performance-wise.
    - The address generator now supports all sorts of Bitcoin and Ethereum addresses (all from both compressed
      and uncompressed public keys):
        - `P2PKH`: Pay to Public Key Hash (Bitcoin - Legacy - Base58)
        - `P2SH`: Pay to Script Hash (Bitcoin - Legacy - Base58)
        - `P2WPKH`: Pay to Witness Public Key Hash (Bitcoin - SegWit - Bech32)
        - `P2WSH`: Pay to Witness Script Hash (Bitcoin - SegWit - Bech32)
        - `EVM`: Ethereum Virtual Machine (Ethereum - Hex)
    - Each of these address standards has a `MEMORY_SLOT` version that returns the raw version of the address,
      corresponding to the latest operation that cannot be reversed.
-   **v2024.9.0-alpha**:
    - Switching to versioning with the following format: `vYYYY.M.D-<type>`.
    - Implemented Base58 encoding/decoding for Bitcoin addresses.
    - Deleted PostMan in favor of `adonis-autoswagger` + project-hosted Swagger UI.
    - Replaced basic role-check system with AdonisJS Bouncer middleware & policies.
    - Pagination on all index routes.
-   **v1.1.0**:
    - Switching from raw `ts-node` to [AdonisJS](https://adonisjs.com/) with the goal of making it a backend API.
    - Implemented [Lucid ORM](https://lucid.adonisjs.com/docs/introduction) for the database (PostgreSQL).
    - Implemented [Japa](https://japa.dev/docs/introduction) for the tests.
    - Implemented [BullMQ](https://docs.bullmq.io/) for the jobs.
    - Implemented a system that fetches the address data (number of TXs, last TX date, balance, etc..) from the blockchain.
    - Implemented the `v1.0.9` benchmarking system with slight improvements.
    - Added `ts-node` to be able to run arbitrary scripts for development/debugging purposes.
    - Implemented and improved the original `v1.0.9` cache system.
    - Started working on a Ethereum address generator.
    - Implemented Bech32 encoding/decoding for Bitcoin addresses.
-   **v1.0.9**: Started working on a new architecture, with Jest, and a new Cache class.
    - **Cancelled** in favor of switching to AdonisJS because I wanted to make it a backend API,
      and also because the code started to be a real mess, really hard to maintain and even more
      to improve.
-   **v1.0.8b**: Added a file report system, to not loose the results if you close the terminal lol..
-   **v1.0.8**: Reverted back to an Uint8Array.
-   **v1.0.7**: Using WASM / JS shared memory space with JS only.
-   **v1.0.6**: Using SECP256K1 module and WASM / JS shared memory space.
-   **v1.0.5b**: Better benchmarking & reports per second.
-   **v1.0.5**: Reverts the address to its RIPEMD-160 hash.
-   **v1.0.4b**: Allow to use the public key if known.
-   **v1.0.4**: Using a single buffer for all operations.
-   **v1.0.3**: Better private key generator (str -> bigint).
-   **v1.0.2b**: Upgrading Node.js from v16.20.2 to v20.9.0.
-   **v1.0.2**: Ghost executions + Better benchmark measures.
-   **v1.0.1**: Improved benchmarking precision.
-   **v1.0.0**: Basic algorithm implementations.
