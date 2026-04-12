#include "utils/bytes.hpp"
#include <cstring>

uint8_t readLastByte(const uint8_t key[32]) {
    return key[31];
}

bool areAllBytesZeroExceptLast(const uint8_t key[32]) {
    for (int i = 0; i < 31; ++i) {
        if (key[i] != 0) {
            return false;
        }
    }

    return true;
}

void buildBigEndianPrivateKeyFromUint8(uint8_t out[32], uint8_t value) {
    std::memset(out, 0x00, 32);
    out[31] = value;
}
