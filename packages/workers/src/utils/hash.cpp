#include "utils/hash.hpp"
#include <cstring>
#include <hashers/keccak256.hpp>
#include <hashers/ripemd160.hpp>
#include <openssl/sha.h>

bool sha256(const uint8_t* inputData, size_t inputSize, uint8_t* outputData) {
    SHA256(inputData, inputSize, outputData);
    return true;
}

bool ripemd160(const uint8_t* inputData, size_t inputSize, uint8_t* outputData) {
    Ripemd160::getHash(inputData, inputSize, outputData);
    return true;
}

bool keccak256(const uint8_t* inputData, size_t inputSize, uint8_t* outputData) {
    Keccak256::getHash(inputData, inputSize, outputData);
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
