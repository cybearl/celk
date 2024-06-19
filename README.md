# celk
A brute-forcing tool to work with Bitcoin and Ethereum addresses entirely written in Typescript.

Note that, the goal of this project is not about providing the fastest generator. It is more like
an experiment to see how far I can optimize a Typescript/Node.js project for heavy computations.
So, yeah, this project is entirely written in Typescript with no external dependencies for
the core functionalities. The only dependencies are for the tests, the logger etc..

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
- Node.js: v20.11.1.

### Benchmarking of the generator
| Version     | Addresses per second (K/s) | Upgrade description                                          |
|-------------|----------------------------|--------------------------------------------------------------|
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
### v1.0.9: A new architecture.
- I decided to throw away the whole benchmarking-everywhere stuff, as it became totally impossible to maintain,
did that when I wasn't that good at Typescript xD.
- I implemented [Jest](https://jestjs.io/fr/), with no need for JS compilation, just a good old `yarn test` that runs all the tests.
- I threw away the old benchmarking function which was a pain in the ass to use, and replaced it by a single-line
benchmarking function that doesn't print anything by itself but returns results instead, it makes the code so much cleaner.
- I also added the `printBenchmarkResults` function, which takes an object containing key-value pairs for each benchmark
(name - results) and prints them all properly, it looks like that now:
```typescript
// Randomness methods
results = {};
results.randomFill = benchmark(() => cache.randomFill());
results.safeRandomFill = benchmark(() => cache.safeRandomFill());
printBenchmarkResults("randomness", results);
```
Which gives:
![printBenchmarkResults example](https://github.com/yoratoni/celk/blob/main/assets/printBenchmarkResult.png?raw=true)

#### About the cache
I started by redoing the most important module of them all, the `Cache`, which is an utility class designed
to write and read data from what I call the memory table

> Since the **v1.0.4**, I started using a single buffer for all operations, and I created a class to manage it,
> but I used too many different types, no benchmarks, and of course, not a single test.

So, I'm redoing it all while benchmarking each single method of the class,
and I will base the other modules on the fastest methods available. Note that this class supports
both little and big endian writing/reading, bounds checking, and is based on the `Uint8Array` class
to use their optimized methods.

**Note:** I do not plan to add workers for the cache itself as writing and reading stuff is already really fast
(+- 25 million operations per second for some methods), and will certainly *never* be the bottleneck of the project.

The algorithm that I'm worried about the most is the `secp256k1` one, it is **really** slow, I previously
tried to implement it in JS, got something like 1,000 keys per second, I decided to use the `secp256k1` module
instead and got 20,000 keys per second, but I'm not satisfied with that at all, I want to try implementing it
in WASM and use shared memory space with workers to see if I can get better results than that.

I'm also implementing `addressToFind`, `publicKeyToFind` and `reverseAddressIntoPublicKey`:
- If `addressToFind` is set, the generator will stop when it finds the address.
- If `publicKeyToFind` is set, the generator will stop when it finds the public key.
- If `addressToFind` and `reverseAddressIntoPublicKey` are both set, the generator will stop when it finds the public key
  corresponding to the address.

### Previous updates
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