#pragma once

#include <atomic>
#include <mutex>
#include <string>

struct MatchState {
    std::atomic<bool> isFound { false };

    std::mutex stateMutex;
    std::string address;
    std::string privateKey;
    uint64_t totalAttempts { 0 };
};
