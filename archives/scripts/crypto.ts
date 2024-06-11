import config from "configs/main.config";
import MEMORY_TABLE from "lib/constants/memory";
import Ripemd160Algorithm from "lib/crypto/algorithms/ripemd160";
import { Secp256k1Algorithm_v1, Secp256k1Algorithm_v2 } from "lib/crypto/algorithms/secp256k1";
import { Sha256Algorithm_v1 } from "lib/crypto/algorithms/sha256";
import Base58Encoder from "lib/crypto/encoders/base58";
import PrivateKeyGenerator from "lib/crypto/generators/privateKey";
import Cache from "lib/kernel/cache";
import { benchmark } from "lib/utils/benchmarks";
import { bigintToPrivateKey } from "lib/utils/conversions";
import logger from "lib/utils/logger";


// Test values generated from:
// https://www.rfctools.com/bitcoin-address-test-tool/
const secp256k1CompressedOutput = "02B23790A42BE63E1B251AD6C94FDEF07271EC0AADA31DB6C3E8BD32043F8BE384";
const secp256k1UncompressedOutput = "04B23790A42BE63E1B251AD6C94FDEF07271EC0AADA31DB6C3E8BD32043F8BE384FC6B694919D55EDBE8D50F88AA81F94517F004F4149ECB58D10A473DEB19880E";
const sha256Output = "6EEB2A7AB7AEE7E5798A9D1869E98DB10DAE10CB204AD8A0F1EF2DB6EC4EABF2";
const ripemd160Output = "391A6C52EDC0D8D5C4D9A6ADC078C50DD3440BFC";
const rawAddressInput = "00391A6C52EDC0D8D5C4D9A6ADC078C50DD3440BFC05E8881A";
const addressOutput = "16CwAr612Y95NcNKe1zgVfgSqJyXkz8Xbf";

/**
 * Benchmark for the "PrivateKeyGenerator" (S.I).
 * @param cache The cache to read from and write to.
 */
function privateKeyGeneratorBenchmark(cache: Cache) {
    const privateKeyGenerator = new PrivateKeyGenerator("RANDOM", 32, 1n, 2n ** 256n - 1n);

    console.log("");
    logger.warn("PRIVATE KEY GENERATOR (Random mode, S.I):");
    privateKeyGenerator.setPrivateKeyGenMode("RANDOM");
    benchmark(() => privateKeyGenerator.execute(cache, MEMORY_TABLE.PRK), {
        formatFn: (input: bigint) => bigintToPrivateKey(input)
    });

    // console.log("");
    // logger.warn("PRIVATE KEY GENERATOR (Ascending mode, S.I):");
    // privateKeyGenerator.setPrivateKeyGenMode("ASCENDING");
    // benchmark(() => privateKeyGenerator.execute(cache, MEMORY_TABLE.PRK), {
    //     formatFn: (input: bigint) => bigintToPrivateKey(input)
    // });

    // console.log("");
    // logger.warn("PRIVATE KEY GENERATOR (Descending mode, S.I):");
    // privateKeyGenerator.setPrivateKeyGenMode("DESCENDING");
    // benchmark(() => privateKeyGenerator.execute(cache, MEMORY_TABLE.PRK), {
    //     formatFn: (input: bigint) => bigintToPrivateKey(input)
    // });
}

/**
 * Benchmark for the "Secp256k1Algorithm_v1" ("secp256k1" library).
 * @param cache The cache to read from and write to.
 */
function secp256k1Algorithm_v1_benchmark(cache: Cache) {
    // Generate a big private key (increases difficulty)
    const privateKeyGenerator = new PrivateKeyGenerator("DESCENDING", 32, 0n, 2n ** 255n);
    privateKeyGenerator.execute(cache, MEMORY_TABLE.PRK);

    console.log("");
    logger.warn("SECP256K1 ALGORITHM (Compressed, 'secp256k1' library):");
    logger.warn(">> Private key: 0x" + cache.subarray(MEMORY_TABLE.PRK.writeTo.offset, MEMORY_TABLE.PRK.writeTo.offset + 33).toString("hex"));
    const secp256k1Algorithm = new Secp256k1Algorithm_v1("COMPRESSED");

    // Execute once for checking the output
    secp256k1Algorithm.execute(cache, MEMORY_TABLE.PBL);
    const testCompressedOutput = cache.subarray(MEMORY_TABLE.PBL.writeTo.offset, MEMORY_TABLE.PBL.writeTo.offset + 33).toString("hex");

    benchmark(() => secp256k1Algorithm.execute(cache, MEMORY_TABLE.PBL), {
        formatFn: () => "0x" + cache.subarray(MEMORY_TABLE.PBL.writeTo.offset, MEMORY_TABLE.PBL.writeTo.offset + 33).toString("hex"),
        testPassed: {
            expected: "0x" + secp256k1CompressedOutput,
            received: "0x" + testCompressedOutput
        }
    });

    console.log("");
    logger.warn("SECP256K1 ALGORITHM (Uncompressed, 'secp256k1' library):");
    logger.warn(">> Private key: 0x" + cache.subarray(MEMORY_TABLE.PRK.writeTo.offset, MEMORY_TABLE.PRK.writeTo.end).toString("hex"));
    secp256k1Algorithm.setPublicKeyGenMode("UNCOMPRESSED");

    // Execute once for checking the output
    secp256k1Algorithm.execute(cache, MEMORY_TABLE.PBL);
    const testUncompressedOutput = cache.subarray(MEMORY_TABLE.PBL.writeTo.offset, MEMORY_TABLE.PBL.writeTo.end).toString("hex");

    benchmark(() => secp256k1Algorithm.execute(cache, MEMORY_TABLE.PBL), {
        formatFn: () => "0x" + cache.subarray(MEMORY_TABLE.PBL.writeTo.offset, MEMORY_TABLE.PBL.writeTo.end).toString("hex"),
        testPassed: {
            expected: "0x" + secp256k1UncompressedOutput,
            received: "0x" + testUncompressedOutput
        }
    });
}

/**
 * Benchmark for the "Secp256k1Algorithm_v2" (S.I).
 * @param cache The cache to read from and write to.
 */
function secp256k1Algorithm_v2_benchmark(cache: Cache) {
    // Generate a big private key (increases difficulty)
    const privateKeyGenerator = new PrivateKeyGenerator("DESCENDING", 32, 0n, 2n ** 255n);
    privateKeyGenerator.execute(cache, MEMORY_TABLE.PRK);

    console.log("");
    logger.warn("SECP256K1 ALGORITHM (Compressed, S.I):");
    logger.warn(">> Private key: 0x" + cache.subarray(MEMORY_TABLE.PRK.writeTo.offset, MEMORY_TABLE.PRK.writeTo.offset + 33).toString("hex"));
    const secp256k1Algorithm = new Secp256k1Algorithm_v2("COMPRESSED");

    // Execute once for checking the output
    secp256k1Algorithm.execute(cache, MEMORY_TABLE.PBL);
    const testCompressedOutput = cache.subarray(MEMORY_TABLE.PBL.writeTo.offset, MEMORY_TABLE.PBL.writeTo.offset + 33).toString("hex");

    benchmark(() => secp256k1Algorithm.execute(cache, MEMORY_TABLE.PBL), {
        formatFn: () => "0x" + cache.subarray(MEMORY_TABLE.PBL.writeTo.offset, MEMORY_TABLE.PBL.writeTo.offset + 33).toString("hex"),
        testPassed: {
            expected: "0x" + secp256k1CompressedOutput,
            received: "0x" + testCompressedOutput
        }
    });

    console.log("");
    logger.warn("SECP256K1 ALGORITHM (Uncompressed, S.I):");
    logger.warn(">> Private key: 0x" + cache.subarray(MEMORY_TABLE.PRK.writeTo.offset, MEMORY_TABLE.PRK.writeTo.end).toString("hex"));
    secp256k1Algorithm.setPublicKeyGenMode("UNCOMPRESSED");

    // Execute once for checking the output
    secp256k1Algorithm.execute(cache, MEMORY_TABLE.PBL);
    const testUncompressedOutput = cache.subarray(MEMORY_TABLE.PBL.writeTo.offset, MEMORY_TABLE.PBL.writeTo.end).toString("hex");

    benchmark(() => secp256k1Algorithm.execute(cache, MEMORY_TABLE.PBL), {
        formatFn: () => "0x" + cache.subarray(MEMORY_TABLE.PBL.writeTo.offset, MEMORY_TABLE.PBL.writeTo.end).toString("hex"),
        testPassed: {
            expected: "0x" + secp256k1UncompressedOutput,
            received: "0x" + testUncompressedOutput
        }
    });
}

/**
 * Benchmark for the "Sha256Algorithm_v1" (S.I).
 * @param cache The cache to read from and write to.
 */
function sha256Algorithm_v1_benchmark(cache: Cache) {
    // Replace the "bytes" value of the SHA memory slot by the public key size (65)
    MEMORY_TABLE.SHA.readFrom.bytes = 65;

    // Replace the "end" value of the SHA memory slot by the public key size + 65
    MEMORY_TABLE.SHA.readFrom.end = MEMORY_TABLE.SHA.readFrom.offset + 65;

    // Secp256k1 uncompressed output into cache
    cache.writeHexString(secp256k1UncompressedOutput, MEMORY_TABLE.SHA.readFrom.offset, MEMORY_TABLE.SHA.readFrom.end);

    console.log("");
    logger.warn("SHA-256 ALGORITHM (65 bytes input, S.I):");
    const sha256Algorithm = new Sha256Algorithm_v1();

    // Execute once for checking the output
    sha256Algorithm.execute(cache, MEMORY_TABLE.SHA);
    const testOutput = cache.subarray(MEMORY_TABLE.SHA.writeTo.offset, MEMORY_TABLE.SHA.writeTo.end).toString("hex");

    benchmark(() => sha256Algorithm.execute(cache, MEMORY_TABLE.SHA), {
        formatFn: () => "0x" + cache.subarray(MEMORY_TABLE.SHA.writeTo.offset, MEMORY_TABLE.SHA.writeTo.end).toString("hex"),
        testPassed: {
            expected: "0x" + sha256Output,
            received: "0x" + testOutput
        }
    });
}

/**
 * Benchmark for the "Ripemd160Algorithm" (S.I).
 * @param cache The cache to read from and write to.
 */
function ripemd160AlgorithmBenchmark(cache: Cache) {
    cache.writeHexString(sha256Output, MEMORY_TABLE.RMD.readFrom.offset);

    console.log("");
    logger.warn("RIPEMD-160 ALGORITHM (S.I):");
    const ripemd160Algorithm = new Ripemd160Algorithm();

    // Execute once for checking the output
    ripemd160Algorithm.execute(cache, MEMORY_TABLE.RMD);
    const testOutput = cache.subarray(MEMORY_TABLE.RMD.writeTo.offset, MEMORY_TABLE.RMD.writeTo.end).toString("hex");

    benchmark(() => ripemd160Algorithm.execute(cache, MEMORY_TABLE.RMD), {
        formatFn: () => "0x" + cache.subarray(MEMORY_TABLE.RMD.writeTo.offset, MEMORY_TABLE.RMD.writeTo.end).toString("hex"),
        testPassed: {
            expected: "0x" + ripemd160Output,
            received: "0x" + testOutput
        }
    });
}

/**
 * Benchmark for the "Base58Encoder" (S.I).
 */
function base58EncoderBenchmark() {
    console.log("");
    logger.warn("BASE58 ENCODER (S.I):");
    const base58Encoder = new Base58Encoder();

    // Input from raw address.
    // Input is always 25 bytes long
    const cache = Cache.alloc(25);

    // Slot for the base58Cache
    const slot = {
        readFrom: { offset: 0, bytes: 25, end: 25 },
        writeTo: { offset: -1, bytes: -1, end: -1 }  // Unused
    };

    // Raw address into base58Cache
    cache.writeHexString(rawAddressInput);

    // Execute once for checking the output
    const testOutput = base58Encoder.encode(cache, slot);

    benchmark(() => base58Encoder.encode(cache, slot), {
        testPassed: {
            expected: "0x" + addressOutput,
            received: "0x" + testOutput
        }
    });
}

/**
 * Crypto benchmark mode.
 */
export type CryptoBenchmarkMode = "all" | "algorithms" | "encoders" | "PRK" | "SECP256K1" |
"SHA-256" | "RIPEMD-160" | "BASE58";

/**
 * Main function for the crypto benchmark.
 */
export default function executeCryptoBenchmark() {
    logger.info("Starting benchmarking of the crypto generators/algorithms/encoders...");
    logger.info(`>> Number of reports per benchmark: ${config.numberOfReports}`);
    logger.info(`>> Report interval: ${config.reportInterval} millisecond(s)`);
    logger.info(`>> Benchmark mode: '${config.cryptoBenchmarkMode}'`);

    const cache = Cache.alloc(186);

    if (config.cryptoBenchmarkMode === "all") {
        privateKeyGeneratorBenchmark(cache);
        secp256k1Algorithm_v1_benchmark(cache);
        secp256k1Algorithm_v2_benchmark(cache);
        sha256Algorithm_v1_benchmark(cache);
        ripemd160AlgorithmBenchmark(cache);
        base58EncoderBenchmark();
    }

    if (config.cryptoBenchmarkMode === "algorithms") {
        secp256k1Algorithm_v1_benchmark(cache);
        secp256k1Algorithm_v2_benchmark(cache);
        sha256Algorithm_v1_benchmark(cache);
        ripemd160AlgorithmBenchmark(cache);
    }

    if (config.cryptoBenchmarkMode === "encoders") {
        base58EncoderBenchmark();
    }

    if (config.cryptoBenchmarkMode === "PRK") privateKeyGeneratorBenchmark(cache);

    if (config.cryptoBenchmarkMode === "SECP256K1") {
        secp256k1Algorithm_v1_benchmark(cache);
        secp256k1Algorithm_v2_benchmark(cache);
    }

    if (config.cryptoBenchmarkMode === "SHA-256") {
        sha256Algorithm_v1_benchmark(cache);
    }

    if (config.cryptoBenchmarkMode === "RIPEMD-160") ripemd160AlgorithmBenchmark(cache);
    if (config.cryptoBenchmarkMode === "BASE58") base58EncoderBenchmark();

    console.log("");
}