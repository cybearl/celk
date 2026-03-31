#pragma once

#include <nlohmann/json.hpp>

/**
 * @brief The user options for the current address list owner.
 */
struct UserOptions {
    bool autoDisableZeroBalance;
    bool mixGenerators;
};

NLOHMANN_DEFINE_TYPE_NON_INTRUSIVE(UserOptions, autoDisableZeroBalance, mixGenerators)
