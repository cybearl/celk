#include "utils/files.hpp"

std::string readFile(const std::string& filePath) {
    std::ifstream fileStream(filePath);

    if (!fileStream.is_open()) {
        throw std::runtime_error("Could not open file: " + filePath);
    }

    std::ostringstream buffer;
    buffer << fileStream.rdbuf();
    return buffer.str();
}
