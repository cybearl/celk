#include "utils/hash.hpp"
#include <cstring>
#include <openssl/evp.h>
#include <openssl/sha.h>

// Prevent name mangling since Keccak-tiny is compiled as C
// but nobody bothered adding the "C" guard inside the header..
extern "C" {
#include <keccak-tiny.h>
}

bool sha256(const uint8_t* inputData, size_t inputSize, uint8_t* outputData) {
    SHA256(inputData, inputSize, outputData);
    return true;
}

bool ripemd160(const uint8_t* inputData, size_t inputSize, uint8_t* outputData) {
    // Caching the descriptor since EVP_MD_fetch is expensive (provider lookup)
    // (EVP_MD objects are immutable after creation and safe to reuse across calls)
    static EVP_MD* evpMdRipemd160 = EVP_MD_fetch(nullptr, "RIPEMD160", nullptr);
    if (!evpMdRipemd160) {
        return false;
    }

    EVP_MD_CTX* ctx = EVP_MD_CTX_new();
    if (!ctx) {
        return false;
    }

    unsigned int outLength = 20;
    const bool success = EVP_DigestInit_ex(ctx, evpMdRipemd160, nullptr) == 1
        && EVP_DigestUpdate(ctx, inputData, inputSize) == 1 && EVP_DigestFinal_ex(ctx, outputData, &outLength) == 1;

    EVP_MD_CTX_free(ctx);
    return success;
}

bool keccak256(const uint8_t* inputData, size_t inputSize, uint8_t* outputData) {
    sha3_256(outputData, 32, inputData, inputSize);
    return true;
}

bool hash160(const uint8_t* inputData, size_t inputSize, uint8_t* outputData) {
    if (!sha256(inputData, inputSize, outputData)) {
        return false;
    }

    return ripemd160(outputData, 32, outputData);
}

bool doubleSha256(const uint8_t* inputData, size_t inputSize, uint8_t* outputData) {
    if (!sha256(inputData, inputSize, outputData)) {
        return false;
    }

    return sha256(outputData, 32, outputData);
}

uint8_t* tapTweakTagHash() {
    static uint8_t hash[32];

    const char* tapTweakStr = "TapTweak";
    sha256(reinterpret_cast<const uint8_t*>(tapTweakStr), strlen(tapTweakStr), hash);

    return hash;
}
