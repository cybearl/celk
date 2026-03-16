#pragma once

#include <nlohmann/json.hpp>
#include <optional>
#include <string>

/**
 * @brief Custom serializer for `std::optional<T>` to handle null values in JSON.
 */
namespace nlohmann {
template <typename T> struct adl_serializer<std::optional<T>> {
    static void to_json(json& j, const std::optional<T>& opt) {
        if (opt)
            j = *opt;
        else
            j = nullptr;
    }
    static void from_json(const json& j, std::optional<T>& opt) {
        if (j.is_null())
            opt = std::nullopt;
        else
            opt = j.get<T>();
    }
};
}

/**
 * @brief A small helper function that serializes a JSON object to a string.
 * @param j The JSON object to serialize.
 * @returns The serialized JSON string.
 */
std::string serializeJson(const nlohmann::json& json);

/**
 * @brief A small helper function that deserializes a JSON string to a JSON object.
 * @param jsonString The JSON string to deserialize.
 * @returns The deserialized JSON object.
 */
nlohmann::json deserializeJson(const std::string& jsonString);
