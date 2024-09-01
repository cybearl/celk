# celk
A brute-forcing tool to work with Bitcoin and Ethereum addresses entirely written in Typescript.

The goal that I have, is to build a dual (Xeon | Epyc)-based home server, and to run this project on it for years
(or decades lol) to see if I can brute-force some addresses, of course, it's almost impossible
but who knows, maybe I'll be lucky.

Performances
------------
Benchmark environment:
- CPU: AMD Ryzen 7 5800x (8 cores / 16 threads) @ 3.8 GHz.
- GPU: NVIDIA GeForce RTX 3070.
- RAM: 32 GB DDR4 @ 3200 MHz.
- OS: Windows 11 64 bits.
- Node.js: v20.15.0.

### Benchmarking of the generator
| Version     | Addresses per second (K/s) | Upgrade description                                          |
|-------------|----------------------------|--------------------------------------------------------------|
| `v1.1.0`    | N/D                        | **Switching to AdonisJS**                                    |
| `v1.0.9`    | N/D                        | **A new architecture**                                       |
| `v1.0.8b`   | N/D                        | **File report system**                                       |
| `v1.0.8`    | 19.97 kK/s                 | **Reverted back to an Uint8Array**                           |
| `v1.0.7`    | 19.24 kK/s                 | **Using WASM / JS shared memory space with JS only**         |
| `v1.0.6`    | 15.42 kK/s                 | **Using SECP256K1 module and WASM / JS shared memory space** |
| `v1.0.5b`   | N/D                        | **Better benchmarking & reports per second**                 |
| `v1.0.5`    | 1.25 kK/s                  | **Reverts the address to its RIPEMD-160 hash**               |
| `v1.0.4b`   | N/D                        | **Allow to use the public key if known**                     |
| `v1.0.4`    | 1.24 kK/s                  | **Using a single buffer for all operations**                 |
| `v1.0.3`    | 1.19 kK/s                  | **Better private key generator (str -> bigint)**             |
| `v1.0.2b`   | 1.18 kK/s                  | **Upgrading Node.js from v16.20.2 to v20.9.0**               |
| `v1.0.2`    | 850 K/s                    | **Ghost executions + Better benchmark measures**             |
| `v1.0.1`    | 792 K/s                    | **Improved benchmarking precision**                          |
| `v1.0.0`    | 396 K/s                    | **Basic algorithm implementations**                          |

Updates
-------
### Latest update (v2024.9.0-alpha):
  - Switching to versioning with the following format: `vYYYY.M.D-<type>`.
  - Implemented Base58 encoding/decoding for Bitcoin addresses.
  - Deleted PostMan in favor of `adonis-autoswagger` + project-hosted Swagger UI.

### Previous updates
- **v1.1.0**:
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
- **v1.0.9**: Started working on a new architecture, with Jest, and a new Cache class.
  - Cancelled in favor of switching to AdonisJS because I wanted to make it a backend API,
    and also because the code started to be a real mess, really hard to maintain and even more
    to improve.
- **v1.0.8b**: Added a file report system, to not loose the results if you close the terminal lol..
- **v1.0.8**: Reverted back to an Uint8Array.
- **v1.0.7**: Using WASM / JS shared memory space with JS only.
- **v1.0.6**: Using SECP256K1 module and WASM / JS shared memory space.
- **v1.0.5b**: Better benchmarking & reports per second.
- **v1.0.5**: Reverts the address to its RIPEMD-160 hash.
- **v1.0.4b**: Allow to use the public key if known.
- **v1.0.4**: Using a single buffer for all operations.
- **v1.0.3**: Better private key generator (str -> bigint).
- **v1.0.2b**: Upgrading Node.js from v16.20.2 to v20.9.0.
- **v1.0.2**: Ghost executions + Better benchmark measures.
- **v1.0.1**: Improved benchmarking precision.
- **v1.0.0**: Basic algorithm implementations.