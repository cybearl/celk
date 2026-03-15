#include "json.hpp"

std::string serializeJson(const nlohmann::json& j) {
    return j.dump();
}
