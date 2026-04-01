#include "utils/hex.hpp"
#include <iostream>
#include <string>
#include <vector>

std::vector<uint8_t> hexStringToVector(const std::string& hexString) {
    {
        std::vector<uint8_t> result;

        size_t startIndex { 0 };
        if (hexString.rfind("0x", 0) == 0) {
            startIndex = 2;
        }

        result.reserve((hexString.length() - startIndex) / 2);

        for (size_t i = startIndex; i < hexString.length(); i += 2) {
            std::string byteString = hexString.substr(i, 2);
            uint8_t byteValue = static_cast<uint8_t>(std::stoul(byteString, nullptr, 16));
            result.push_back(byteValue);
        }

        return result;
    }
}
