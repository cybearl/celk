#pragma once

#include <atomic>
#include <mutex>
#include <queue>
#include <string>
#include <unordered_set>

/**
 * @brief A single pending match produced by a worker thread, queued until the main loop drains it.
 */
struct PendingMatch {
    std::string address;
    std::string privateKey;
};

/**
 * @brief Represents the state of matches inside the worker, with support for concurrent access.
 */
struct MatchState {
    std::atomic<bool> isFound { false };

    std::mutex stateMutex;
    std::queue<PendingMatch> pendingMatches;
    std::unordered_set<std::string> matchedAddresses;
    uint64_t totalAttempts { 0 };
};
