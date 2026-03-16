#include "json.hpp"

std::string serializeJson(const nlohmann::json& json) {
    return json.dump();
}

nlohmann::json deserializeJson(const std::string& jsonString) {
    return nlohmann::json::parse(jsonString);
}
