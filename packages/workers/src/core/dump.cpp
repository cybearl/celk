#include "core/dump.hpp"
#include "utils/files.hpp"
#include "utils/json.hpp"
#include <nlohmann/json.hpp>

std::vector<AddressDump> loadDumpFile(const std::string& dumpFilePath) {
    std::string fileContent = readFile(dumpFilePath);
    nlohmann::json jsonData = deserializeJson(fileContent);
    return jsonData.get<std::vector<AddressDump>>();
}
