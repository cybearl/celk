#pragma once

#include <cstdint>

/**
 * @brief Computes the SHA-256 hash of the given input data.
 * @param inputData A pointer to the input data to hash.
 * @param inputSize The size of the input data in bytes.
 * @param outputData A pointer to an array where the computed hash will be stored
 * (must be at least 32 bytes).
 * @returns True if the hash was computed successfully, false otherwise.
 */
bool sha256(const uint8_t* inputData, size_t inputSize, uint8_t* outputData);

/**
 * @brief Computes the RIPEMD-160 hash of the given input data.
 * @param inputData A pointer to the input data to hash.
 * @param inputSize The size of the input data in bytes.
 * @param outputData A pointer to an array where the computed hash will be stored
 * (must be at least 20 bytes).
 * @return True if the hash was computed successfully, false otherwise.
 */
bool ripemd160(const uint8_t* inputData, size_t inputSize, uint8_t* outputData);

/**
 * @brief Computes the Keccak-256 hash of the given input data.
 * @param inputData A pointer to the input data to hash.
 * @param inputSize The size of the input data in bytes.
 * @param outputData A pointer to an array where the computed hash will be stored
 * (must be at least 32 bytes).
 * @return True if the hash was computed successfully, false otherwise.
 */
bool keccak256(const uint8_t* inputData, size_t inputSize, uint8_t* outputData);

/**
 * @brief Computes the HASH-160 (SHA-256 followed by RIPEMD-160) of the given input data.
 * @param inputData A pointer to the input data to hash.
 * @param inputSize The size of the input data in bytes.
 * @param outputData A pointer to an array where the computed hash will be stored
 * (must be at least 20 bytes).
 * @return True if the hash was computed successfully, false otherwise.
 */
bool hash160(const uint8_t* inputData, size_t inputSize, uint8_t* outputData);

/**
 * @brief Computes the double SHA-25 of the given input data.
 * @param inputData A pointer to the input data to hash.
 * @param inputSize The size of the input data in bytes.
 * @param outputData A pointer to an array where the computed hash will be stored
 * (must be at least 32 bytes).
 * @return True if the hash was computed successfully, false otherwise.
 */
bool doubleSha256(const uint8_t* inputData, size_t inputSize, uint8_t* outputData);

/**
 * @brief Computes the SHA-256 hash of the tag `TapTweak` (BIP-341).
 * @return The 32-byte hash of the tag `TapTweak`.
 */
uint8_t* tapTweakTagHash();
