#pragma once

#include <nlohmann/json.hpp>

/**
 * Note: All changes to the protocol should be reflected on the TypeScript side of the Celk protocol.
 */

/**
 * @brief The subset of user options passed to each worker via the start message.
 */
struct UserOptions {
    bool autoDisableZeroBalance;
    bool mixGenerators;
};

NLOHMANN_DEFINE_TYPE_NON_INTRUSIVE(UserOptions, autoDisableZeroBalance, mixGenerators)
