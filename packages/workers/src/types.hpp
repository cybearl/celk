#pragma once

#include <atomic>
#include <mutex>
#include <string>

/**
 * @brief Represents the state of a match inside the worker, with support for concurrent access.
 */
struct MatchState {
    std::atomic<bool> isFound { false };

    std::mutex stateMutex;
    std::string address;
    std::string privateKey;
    uint64_t totalAttempts { 0 };
};
