# Celk
A toolbox to work with Bitcoin addresses & private keys, in Typescript & WASM.

Note that, for now, the performance of the toolbox is not the best as I decided to focus on the architecture first,
and only then, on the actual performance.

As for the SECP256K algorithm, I decided to use the `secp256k1` module, my own implementation is, for now,
really slow, as it is a simple JS implementation, and for it to be fast, it needs to be either written in AssemblyScript,
either with GPU.js, but I'll see that later, it is not something easy to do.

Commands
--------
### Main commands
...

### Benchmarking
...

Notes about the benchmarking:
- What I call the `ghost execution report` in some of my benchmarks results,
  is a single showed execution of the generator with multiple previous hidden executions.
  It is generally named "warm up" in other benchmarks, but I prefer to call it "ghost execution" (cooler).
  It allows the JIT compiler to optimize the code, and to show the real performance of the generator.

Performances
------------
Benchmark environment:
- CPU: AMD Ryzen 7 5800x (8 cores / 16 threads) @ 3.8 GHz.
- GPU: NVIDIA GeForce RTX 3070.
- RAM: 32 GB DDR4 @ 3200 MHz.
- OS: Windows 10 64 bits.
- Node.js: v20.10.0.

### Benchmarking of the Bitcoin addresses generator
| Version     | Addresses per second (K/s) | Upgrade description                                          |
|-------------|----------------------------|--------------------------------------------------------------|
| `v1.0.0`    | 396 K/s                    | **Basic algorithm implementations**                          |
| `v1.0.1`    | 792 K/s                    | **Improved benchmarking precision**                          |
| `v1.0.2`    | 850 K/s                    | **Ghost executions + Better benchmark measures**             |
| `v1.0.2b`   | 1.18 kK/s                  | **Upgrading Node.js from v16.20.2 to v20.9.0**               |
| `v1.0.3`    | 1.19 kK/s                  | **Better private key generator (str -> bigint)**             |
| `v1.0.4`    | 1.24 kK/s                  | **Using a single buffer for all operations**                 |
| `v1.0.4b`   | N/D                        | **Allow to use the public key if known**                     |
| `v1.0.5`    | 1.25 kK/s                  | **Reverts the address to its RIPEMD-160 hash**               |
| `v1.0.5b`   | N/D                        | **Better benchmarking & reports per second**                 |
| `v1.0.6`    | 15.42 kK/s                 | **Using SECP256K1 module and WASM / JS shared memory space** |
| `v1.0.7`    | 19.24 kK/s                 | **Using WASM / JS shared memory space with JS only**         |
| `v1.0.8`    | 19.97 kK/s                 | **Reverted back to an Uint8Array**                           |

#### About the cache:
> Note that I was previously using Node.js Buffers (`v1.0.4`), but for better compatibility with WASM modules,
> I decided to switch to Uin8Arrays (`v1.0.5`).
> Now, I still extended Uint8Arrays to add methods similar to the ones that can be found in the Buffer class,
> but I kept the Uint8Array class as the main class, to avoid any need for conversions.
>
> Also note that this cache is an instance of the memory buffer of the WASM module, allowing
> data sharing between JavaScript & the WASM modules (`v1.0.6`).
>
> Reverted back to a non-shared extended Uint8Array class (`v1.0.8`), as the performances with WASM
> were not as good as expected etc.. Maybe with Rust instead of AssemblyScript, it would be better.

Here's a table that shows the reserved spaces (in bytes):
| Step           | ID     | Offset | End*  | Bytes  |
|----------------|--------|--------|-------|--------|
| `PRIVATE-KEY`  | `PRK`  | `000`  | `032` | `032`  |
| `PUBLIC-KEY`   | `PBL`  | `032`  | `XXX` | `XXX`  |
| `SHA-256`      | `SHA`  | `097`  | `129` | `032`  |
| `NET BYTE`     | `NTB`  | `129`  | `130` | `001`  |
| `RIPEMD-160`   | `RMD`  | `130`  | `150` | `020`  |
| `SHA-256 CHK1` | `SC1`  | `154`  | `186` | `032`  |
| `SHA-256 CHK2` | `SC2`  | `154`  | `186` | `032`  |
| `CHECKSUM`     | `CHK`  | `150`  | `154` | `004`  |
| `ADDRESS`      | `ADR`  | `154`  | `N/D` | `N/D`  |

- `PUBLIC-KEY` The public key length depends on its compression state, either 33 or 65 bytes.
- `*` Note that the `End` index is exclusive.
- As the cache is initialized with 0s, the network byte (`NTB`) just have a reserved space,
  but is never written, we just read the RIPEMD-160 hash with -1 byte offset at start.

In the end, we get:
- `129::150` being the final RIPEMD-160 hash before double SHA-256 checksum (21 bytes).
- `129::154` being the final Bitcoin hash before BASE58 (25 bytes).

### Benchmarking of the different steps of the generator
This table is updated with the latest version of the toolbox.

Note that, since `v1.0.5`, the input address is reversed to its RIPEMD-160 hash,
meaning that there's less steps to check if a private key is valid or not. I still
kept all the necessary stuff to generate addresses directly from the private key.

| Step           | Execution time | Workload | Iterations per second |
|----------------|----------------|----------|-----------------------|
| `RANDOM PRK`   | 7.5µs          | 11.53%   | 217.69 kIT/s          |
| `SECP256K1`    | 37.1µs         | 73.76%   | 26.88 kIT/s           |
| `SHA-256`      | 5.6µs          | 7.55%    | 261.08 kIT/s          |
| `RIPEMD-160`   | 5.6µs          | 7.16%    | 294.57 kIT/s          |

Note that the private key used to benchmark the `SECP256K1` algorithm is in the range `2^250 <-> 2^255`,
and that's why it takes so much time to compute.

1000 BTC Bitcoin Challenge
--------------------------
One thing that made me want to build this toolbox is this challenge.

Introduction about it, from the [Private Keys Database](https://privatekeys.pw/puzzles/bitcoin-puzzle-tx):
> In 2015, in order to show the hugeness of the private key space (or maybe just for fun), someone created a "puzzle" where he chose keys in a certain smaller space and sent increasing amounts to each of those keys.

As mentioned on this website, the best would be to focus on the puzzle #66, which is the following:
- Address: `13zb1hQbWVsc2S7ZTZnP2G4undNNpdh5so`.
- Private key range: `2^65...2^66-1`.
- Balance / Price: `6.60036213 BTC`.

Now, another puzzle that is interesting is the puzzle #130, which is the following:
- Address: `1Fo65aKq8s8iquMt6weF1rku1moWVEd5Ua `.
- Public key: `03633cbe3ec02b9401c5effa144c5b4d22f87940259634858fc7e59b1c09937852`.
- Private key range: `2^129...2^130-1`.
- Balance / Price: `13 BTC`.

Sources & Credits
-----------------
- [A scheme about public keys to BTC addresses](https://en.bitcoin.it/w/images/en/9/9b/PubKeyToAddr.png).
- [Bitcoin address generation procedure](https://www.crypto-lyon.fr/how-to-get-an-address-from-a-private-key-on-bitcoin.html).
- [More detailed procedure to generate addresses](https://www.oreilly.com/library/view/mastering-bitcoin-2nd/9781491954379/ch04.html).
- [Technical background of v1 Bitcoin addresses](https://en.bitcoin.it/wiki/Technical_background_of_version_1_Bitcoin_addresses).
- [Bitcoin address testing tool from uncompressed private keys](https://gobittest.appspot.com/Address).
- [This post about ECC by Andrea Corbellini](https://andrea.corbellini.name/2015/05/17/elliptic-curve-cryptography-a-gentle-introduction/?ref=hackernoon.com).
- [Bitcoin address testing tool](https://www.rfctools.com/bitcoin-address-test-tool/).