#pragma once

#include "core/generatorGroup.hpp"
#include "types.hpp"
#include "userOptions.hpp"
#include <atomic>
#include <vector>

struct AddressDump;

/**
 * @brief The engine that orchestrates private key generation, derivation, and address comparison.
 */
struct Engine {
    /**
     * @brief The generator groups built from the address dump, one per private key generator type.
     */
    std::vector<GeneratorGroup> generatorGroups;

    /**
     * @brief Builds generator groups from the address dump and initializes comparators.
     * @param dumps The address dump to build the engine from.
     * @param userOptions The user options, including the `mixGenerators` flag.
     */
    void build(const std::vector<AddressDump>& dumps, const UserOptions& userOptions);

    /**
     * @brief Runs the engine, spawning one thread per generator group, blocks until `stopFlag`
     * is set or all sequential generators exhaust their range.
     * @param stopFlag Set to true to stop all generator threads.
     * @param attempts Atomically incremented on each iteration across all threads.
     * @param matchState Updated on an exact match.
     * @param stopOnFirstMatch If true, sets `stopFlag` immediately on a match.
     */
    void run(
        std::atomic<bool>& stopFlag, std::atomic<uint64_t>& attempts, MatchState& matchState, bool stopOnFirstMatch);
};
